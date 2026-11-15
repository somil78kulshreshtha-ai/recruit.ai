// @polsia:user-owned
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  forbidden,
  hasAdminRole,
  rateLimit,
  requestUser,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

const actionSchema = z.object({
  reportId: z.string().cuid(),
  action: z.enum(['dismiss', 'remove_job']),
});

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified || !hasAdminRole(user.role)) return forbidden();
  const reports = await prisma.scamReport.findMany({
    where: { status: 'OPEN' },
    include: { job: { include: { company: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({
    items: reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      status: report.status,
      isDemo: report.isDemo,
      createdAt: report.createdAt.toISOString(),
      reporterId: report.reporterId,
      job: {
        id: report.job.id,
        title: report.job.title,
        status: report.job.status,
        company: report.job.company,
      },
    })),
  });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified || !hasAdminRole(user.role)) return forbidden();
  const limited = await rateLimit(request, 'admin-scam-report', user.id, 100);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { action: 'Choose a valid report action.' } },
      { status: 400 },
    );
  const report = await prisma.scamReport.findUnique({
    where: { id: parsed.data.reportId },
    select: { id: true, jobId: true, status: true },
  });
  if (!report || report.status !== 'OPEN')
    return NextResponse.json({ error: 'report_not_open' }, { status: 409 });
  if (parsed.data.action === 'remove_job') {
    await prisma.$transaction([
      prisma.job.update({
        where: { id: report.jobId },
        data: { status: 'REMOVED', moderationNote: 'Removed after scam report review.' },
      }),
      prisma.scamReport.update({ where: { id: report.id }, data: { status: 'ACTIONED' } }),
    ]);
    return NextResponse.json({ ok: true, action: 'remove_job' });
  }
  await prisma.scamReport.update({ where: { id: report.id }, data: { status: 'DISMISSED' } });
  return NextResponse.json({ ok: true, action: 'dismiss' });
}
