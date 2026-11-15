// @polsia:user-owned
import 'server-only';
import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { isOpenJob, rateLimit, requestUser } from '@/lib/business/recruitai-server';
import { jobSearchSchema } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const limited = await rateLimit(request, 'job-search', null, 120);
  if (limited) return limited;
  const params = new URL(request.url).searchParams;
  const parsed = jobSearchSchema.safeParse(Object.fromEntries(params.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_filters' }, { status: 400 });
  }
  const filter = parsed.data;
  const conditions: Prisma.JobWhereInput[] = [
    {
      status: 'PUBLISHED',
      isDemo: false,
      company: { suspended: false, isDemo: false },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  ];
  if (filter.q) {
    conditions.push({
      OR: [
        { title: { contains: filter.q, mode: 'insensitive' } },
        { description: { contains: filter.q, mode: 'insensitive' } },
        { industry: { contains: filter.q, mode: 'insensitive' } },
        {
          company: {
            name: { contains: filter.q, mode: 'insensitive' },
            suspended: false,
            isDemo: false,
          },
        },
      ],
    });
  }
  if (filter.city) conditions.push({ location: { contains: filter.city, mode: 'insensitive' } });
  if (filter.workMode) conditions.push({ workMode: filter.workMode });
  if (filter.employmentType) conditions.push({ employmentType: filter.employmentType });
  if (filter.industry)
    conditions.push({ industry: { equals: filter.industry, mode: 'insensitive' } });
  if (filter.skill) conditions.push({ skills: { has: filter.skill } });
  if (filter.company)
    conditions.push({
      company: {
        name: { contains: filter.company, mode: 'insensitive' },
        suspended: false,
        isDemo: false,
      },
    });
  if (filter.salaryMin !== undefined)
    conditions.push({ OR: [{ salaryMax: null }, { salaryMax: { gte: filter.salaryMin } }] });
  if (filter.salaryMax !== undefined)
    conditions.push({ OR: [{ salaryMin: null }, { salaryMin: { lte: filter.salaryMax } }] });
  if (filter.experience !== undefined) {
    conditions.push({ experienceMinYears: { lte: filter.experience } });
    conditions.push({
      OR: [{ experienceMaxYears: null }, { experienceMaxYears: { gte: filter.experience } }],
    });
  }
  if (filter.noticePeriod !== undefined)
    conditions.push({ maxNoticePeriodDays: { lte: filter.noticePeriod } });

  const jobs = await prisma.job.findMany({
    where: { AND: conditions },
    include: { company: { select: { id: true, name: true, industry: true, city: true } } },
    orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  });
  const user = await requestUser(request);
  const savedIds = user
    ? new Set(
        (
          await prisma.savedJob.findMany({ where: { userId: user.id }, select: { jobId: true } })
        ).map((item) => item.jobId),
      )
    : new Set<string>();
  return NextResponse.json({
    items: jobs
      .filter((job) => isOpenJob(job))
      .map((job) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        workMode: job.workMode,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        experienceMinYears: job.experienceMinYears,
        experienceMaxYears: job.experienceMaxYears,
        employmentType: job.employmentType,
        industry: job.industry,
        skills: job.skills,
        maxNoticePeriodDays: job.maxNoticePeriodDays,
        postedAt: job.postedAt?.toISOString() ?? null,
        company: job.company,
        saved: savedIds.has(job.id),
      })),
  });
}
