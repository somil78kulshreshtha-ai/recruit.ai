// @polsia:user-owned
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { forbidden, rateLimit, requestUser, unauthorized } from '@/lib/business/recruitai-server';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

const reportSchema = z.object({
  jobId: z.string().cuid(),
  reason: z.string().trim().min(10).max(1000),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'job-scam-report', user.id, 5, 60 * 60 * 1000);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { reason: 'Describe the concern in at least ten characters.' } },
      { status: 400 },
    );
  const job = await prisma.job.findFirst({
    where: { id: parsed.data.jobId, isDemo: false, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!job) return NextResponse.json({ error: 'job_not_found' }, { status: 404 });
  const existing = await prisma.scamReport.findFirst({
    where: { jobId: job.id, reporterId: user.id, status: 'OPEN', isDemo: false },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ id: existing.id, existing: true }, { status: 200 });
  const report = await prisma.scamReport.create({
    data: { jobId: job.id, reporterId: user.id, reason: parsed.data.reason },
    select: { id: true },
  });
  return NextResponse.json({ id: report.id }, { status: 201 });
}
