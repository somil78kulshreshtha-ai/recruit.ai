// @polsia:user-owned
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  forbidden,
  isOpenJob,
  rateLimit,
  requestUser,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

const inputSchema = z.object({ jobId: z.string().cuid() });

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const saved = await prisma.savedJob.findMany({
    where: { userId: user.id, job: { isDemo: false, company: { suspended: false } } },
    include: {
      job: {
        include: { company: { select: { id: true, name: true, industry: true, city: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({
    items: saved
      .filter((item) => isOpenJob(item.job))
      .map((item) => ({
        id: item.job.id,
        title: item.job.title,
        description: item.job.description,
        location: item.job.location,
        workMode: item.job.workMode,
        salaryMin: item.job.salaryMin,
        salaryMax: item.job.salaryMax,
        experienceMinYears: item.job.experienceMinYears,
        experienceMaxYears: item.job.experienceMaxYears,
        employmentType: item.job.employmentType,
        industry: item.job.industry,
        skills: item.job.skills,
        maxNoticePeriodDays: item.job.maxNoticePeriodDays,
        postedAt: item.job.postedAt?.toISOString() ?? null,
        company: item.job.company,
        saved: true,
      })),
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'save-job', user.id, 60);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ errors: { jobId: 'Choose a valid open job.' } }, { status: 400 });
  const job = await prisma.job.findFirst({
    where: { id: parsed.data.jobId, isDemo: false, company: { suspended: false } },
  });
  if (!job || !isOpenJob(job)) return NextResponse.json({ error: 'job_closed' }, { status: 409 });
  await prisma.savedJob.upsert({
    where: { userId_jobId: { userId: user.id, jobId: job.id } },
    create: { userId: user.id, jobId: job.id },
    update: {},
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'unsave-job', user.id, 60);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ errors: { jobId: 'Choose a valid job.' } }, { status: 400 });
  await prisma.savedJob.deleteMany({ where: { userId: user.id, jobId: parsed.data.jobId } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
