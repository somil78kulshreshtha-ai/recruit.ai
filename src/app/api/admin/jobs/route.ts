// @polsia:user-owned
import 'server-only';
import { JobStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  forbidden,
  hasAdminRole,
  matchesJobCriteria,
  rateLimit,
  requestUser,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { jobSearchSchema } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email/send';
import { env } from '@/lib/env';
import { sameOrigin } from '@/lib/same-origin';

const actionSchema = z.object({
  jobId: z.string().cuid(),
  action: z.enum(['approve', 'reject', 'remove', 'expire']),
  note: z.string().trim().max(500).optional(),
});
const jobStatusSchema = z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'EXPIRED', 'REMOVED']);

export async function GET(request: Request) {
  const admin = await requestUser(request);
  if (!admin) return unauthorized();
  if (!admin.emailVerified || !hasAdminRole(admin.role)) return forbidden();
  const params = new URL(request.url).searchParams;
  const companyId = params.get('companyId');
  const company = params.get('company')?.trim();
  const status = params.get('status');
  const category = params.get('category');
  const parsedStatus = status ? jobStatusSchema.safeParse(status) : null;
  const jobs = await prisma.job.findMany({
    where: {
      ...(companyId ? { companyId } : {}),
      ...(company ? { company: { name: { contains: company, mode: 'insensitive' } } } : {}),
      ...(category ? { industry: { equals: category, mode: 'insensitive' } } : {}),
      ...(parsedStatus?.success ? { status: parsedStatus.data } : {}),
    },
    include: {
      company: { select: { id: true, name: true, suspended: true } },
      _count: { select: { applications: true, scamReports: { where: { status: 'OPEN' } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({
    items: jobs.map((item) => ({
      id: item.id,
      title: item.title,
      location: item.location,
      workMode: item.workMode,
      industry: item.industry,
      status: item.status,
      moderationNote: item.moderationNote,
      isDemo: item.isDemo,
      demoLabel: item.demoLabel,
      expiresAt: item.expiresAt?.toISOString() ?? null,
      postedAt: item.postedAt?.toISOString() ?? null,
      company: item.company,
      applications: item._count.applications,
      openReports: item._count.scamReports,
    })),
  });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const admin = await requestUser(request);
  if (!admin) return unauthorized();
  if (!admin.emailVerified || !hasAdminRole(admin.role)) return forbidden();
  const limited = await rateLimit(request, 'admin-job-moderation', admin.id, 150);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { action: 'Choose a moderation action.' } },
      { status: 400 },
    );
  const job = await prisma.job.findUnique({
    where: { id: parsed.data.jobId },
    include: { company: true },
  });
  if (!job) return NextResponse.json({ error: 'job_not_found' }, { status: 404 });
  if (parsed.data.action === 'approve' && job.company.suspended)
    return NextResponse.json({ error: 'company_suspended' }, { status: 409 });
  if (
    parsed.data.action === 'approve' &&
    job.status !== JobStatus.PENDING &&
    job.status !== JobStatus.PUBLISHED
  ) {
    return NextResponse.json({ error: 'job_not_pending_review' }, { status: 409 });
  }
  const nextStatus =
    parsed.data.action === 'approve'
      ? JobStatus.PUBLISHED
      : parsed.data.action === 'reject'
        ? JobStatus.REJECTED
        : parsed.data.action === 'remove'
          ? JobStatus.REMOVED
          : JobStatus.EXPIRED;
  const isStillOpen = job.expiresAt === null || job.expiresAt.getTime() > Date.now();
  const shouldSendAlerts =
    parsed.data.action === 'approve' &&
    job.status !== JobStatus.PUBLISHED &&
    !job.isDemo &&
    isStillOpen;
  const updated = await prisma.job.update({
    where: { id: job.id },
    data: {
      status: nextStatus,
      moderationNote: parsed.data.note ?? '',
      ...(parsed.data.action === 'approve' ? { postedAt: new Date() } : {}),
      ...(parsed.data.action === 'expire' ? { expiresAt: new Date() } : {}),
    },
    select: { id: true, status: true, postedAt: true, expiresAt: true },
  });

  let matchingAlerts = 0;
  let deliveredEmails = 0;
  if (shouldSendAlerts) {
    const alerts = await prisma.jobAlert.findMany({
      where: { active: true, emailEnabled: true, isDemo: false },
    });
    const matches = alerts.filter((alert) => {
      const criteria = jobSearchSchema.safeParse(alert.criteria);
      return (
        criteria.success &&
        matchesJobCriteria(criteria.data, { ...job, company: { name: job.company.name } })
      );
    });
    matchingAlerts = matches.length;
    const outcomes = await Promise.all(
      matches.map(async (alert) => {
        const notification = await prisma.notification
          .create({
            data: {
              userId: alert.userId,
              title: 'A job matches your alert',
              body: `${job.title} at ${job.company.name} is now open.`,
              href: '/jobs',
              kind: 'job_alert',
            },
            select: { id: true },
          })
          .catch(() => null);
        const recipient = await prisma.user.findUnique({
          where: { id: alert.userId },
          select: { email: true },
        });
        if (!recipient) return false;
        try {
          const result = await sendEmail({
            to: recipient.email,
            subject: `New role matching ${alert.label}`,
            text: `${job.title} at ${job.company.name} is now open in ${job.location}. View open roles at ${env.NEXT_PUBLIC_APP_URL}/jobs.`,
            html: `<p>A new role matches your saved alert.</p><p><a href="${env.NEXT_PUBLIC_APP_URL}/jobs">Browse open roles</a>.</p>`,
          });
          const delivered = Boolean(result.id);
          if (!delivered && notification) {
            await prisma.notification.update({
              where: { id: notification.id },
              data: {
                body: `${job.title} matches your alert, but the email could not be delivered. View open roles in RecruitAI.`,
              },
            });
          }
          return delivered;
        } catch {
          if (notification) {
            await prisma.notification
              .update({
                where: { id: notification.id },
                data: {
                  body: `${job.title} matches your alert, but the email could not be delivered. View open roles in RecruitAI.`,
                },
              })
              .catch(() => null);
          }
          return false;
        }
      }),
    );
    deliveredEmails = outcomes.filter(Boolean).length;
  }
  return NextResponse.json({ job: updated, matchingAlerts, deliveredEmails });
}
