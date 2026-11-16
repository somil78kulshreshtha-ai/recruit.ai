// @polsia:user-owned
// Daily follow-up reminders for hiring teams. Call it once a day (see .github/workflows/follow-up.yml):
//   GET /api/cron/follow-up   with header  Authorization: Bearer <CRON_SECRET>
// For every company with applications still sitting at "Applied" for 3+ days it sends each active
// team member ONE reminder (in-app notification + email). It will not remind the same person twice
// within ~20 hours, so running it again by accident is harmless.
import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { ApplicationStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email/send';
import { renderEmail } from '@/lib/email/templates';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

const DAY = 86_400_000;
const REMIND_AFTER_DAYS = 3;
const OVERDUE_AFTER_DAYS = 7;
const MAX_COMPANIES_PER_RUN = 200;

function isAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const remindBefore = new Date(now - REMIND_AFTER_DAYS * DAY);
  const overdueBefore = new Date(now - OVERDUE_AFTER_DAYS * DAY);

  const waiting = await prisma.application.findMany({
    where: {
      status: ApplicationStatus.APPLIED,
      isDemo: false,
      appliedAt: { lte: remindBefore },
      job: { company: { suspended: false, isDemo: false } },
    },
    select: {
      appliedAt: true,
      job: { select: { companyId: true, company: { select: { name: true } } } },
    },
    take: 5000,
  });

  const byCompany = new Map<string, { name: string; waiting: number; overdue: number }>();
  for (const application of waiting) {
    const { companyId, company } = application.job;
    const entry = byCompany.get(companyId) ?? { name: company.name, waiting: 0, overdue: 0 };
    entry.waiting += 1;
    if (application.appliedAt <= overdueBefore) entry.overdue += 1;
    byCompany.set(companyId, entry);
  }

  const companyIds = [...byCompany.keys()].slice(0, MAX_COMPANIES_PER_RUN);
  if (companyIds.length === 0) {
    return NextResponse.json({ ok: true, companies: 0, notified: 0, emailed: 0, failed: 0 });
  }

  const memberships = await prisma.companyMembership.findMany({
    where: { companyId: { in: companyIds }, active: true },
    select: { companyId: true, userId: true },
  });
  const userIds = [...new Set(memberships.map((member) => member.userId))];
  const [users, recent] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds }, OR: [{ banned: false }, { banned: null }] },
      select: { id: true, email: true },
    }),
    prisma.notification.findMany({
      where: {
        userId: { in: userIds },
        kind: 'follow-up',
        createdAt: { gt: new Date(now - 20 * 3_600_000) },
      },
      select: { userId: true },
    }),
  ]);
  const emailByUser = new Map(users.map((user) => [user.id, user.email]));
  const alreadyReminded = new Set(recent.map((item) => item.userId));
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');

  let notified = 0;
  let emailed = 0;
  let failed = 0;

  for (const member of memberships) {
    const email = emailByUser.get(member.userId);
    const stats = byCompany.get(member.companyId);
    if (!email || !stats || alreadyReminded.has(member.userId)) continue;
    alreadyReminded.add(member.userId);

    const title = `${stats.waiting} applicant${stats.waiting === 1 ? ' is' : 's are'} waiting for a reply`;
    const detail =
      stats.overdue > 0
        ? `${stats.overdue} of them have waited ${OVERDUE_AFTER_DAYS}+ days.`
        : `They have waited ${REMIND_AFTER_DAYS}+ days.`;
    const body = `${detail} Update their stage so candidates know where they stand.`;
    const href = '/dashboard/company/applications';

    try {
      await prisma.notification.create({
        data: { userId: member.userId, title, body, href, kind: 'follow-up', isDemo: false },
      });
      notified += 1;
    } catch {
      failed += 1;
      continue;
    }

    try {
      const content = renderEmail({
        heading: title,
        body: [`${stats.name}: ${detail}`, 'Candidates are told where they stand — please update their stage.'],
        cta: { label: 'Review applicants', url: `${baseUrl}${href}` },
        footer: 'RecruitAI sends this reminder once a day while applicants are waiting.',
      });
      await sendEmail({ to: email, subject: title, ...content });
      emailed += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, companies: companyIds.length, notified, emailed, failed });
}
