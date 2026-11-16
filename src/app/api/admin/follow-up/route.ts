// @polsia:user-owned
// Admin view of how quickly companies respond to applicants (last 90 days).
import 'server-only';
import { ApplicationStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { forbidden, hasAdminRole, requestUser, unauthorized } from '@/lib/business/recruitai-server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DAY = 86_400_000;
const WINDOW_DAYS = 90;
const OVERDUE_AFTER_DAYS = 7;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 ? sorted[middle] : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
  return value ?? null;
}

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified || !hasAdminRole(user.role)) return forbidden();

  const now = Date.now();
  const applications = await prisma.application.findMany({
    where: {
      isDemo: false,
      appliedAt: { gte: new Date(now - WINDOW_DAYS * DAY) },
      job: { company: { isDemo: false } },
    },
    select: {
      status: true,
      appliedAt: true,
      job: { select: { company: { select: { id: true, name: true } } } },
      history: {
        where: { fromStatus: { not: null } },
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { createdAt: true },
      },
    },
    take: 5000,
  });

  const companies = new Map<
    string,
    { name: string; total: number; responded: number; waiting: number; overdue: number; hours: number[] }
  >();
  const allHours: number[] = [];
  let totalResponded = 0;

  for (const application of applications) {
    const { id, name } = application.job.company;
    const entry = companies.get(id) ?? { name, total: 0, responded: 0, waiting: 0, overdue: 0, hours: [] };
    entry.total += 1;
    if (application.status === ApplicationStatus.APPLIED) {
      entry.waiting += 1;
      if (now - application.appliedAt.getTime() > OVERDUE_AFTER_DAYS * DAY) entry.overdue += 1;
    } else {
      entry.responded += 1;
      totalResponded += 1;
      const first = application.history[0]?.createdAt;
      if (first) {
        const hours = Math.max(0, (first.getTime() - application.appliedAt.getTime()) / 3_600_000);
        entry.hours.push(hours);
        allHours.push(hours);
      }
    }
    companies.set(id, entry);
  }

  const rows = [...companies.entries()]
    .map(([id, entry]) => ({
      companyId: id,
      name: entry.name,
      applications: entry.total,
      responseRate: entry.total ? Math.round((entry.responded / entry.total) * 100) : 0,
      medianResponseHours: median(entry.hours),
      waiting: entry.waiting,
      overdue: entry.overdue,
    }))
    .sort((a, b) => b.overdue - a.overdue || b.waiting - a.waiting || a.name.localeCompare(b.name))
    .slice(0, 100);

  return NextResponse.json({
    windowDays: WINDOW_DAYS,
    overdueAfterDays: OVERDUE_AFTER_DAYS,
    totals: {
      applications: applications.length,
      responseRate: applications.length ? Math.round((totalResponded / applications.length) * 100) : 0,
      medianResponseHours: median(allHours),
      overdue: rows.reduce((sum, row) => sum + row.overdue, 0),
    },
    companies: rows,
  });
}
