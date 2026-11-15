// @polsia:user-owned
import 'server-only';
import { JobStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  errorFields,
  forbidden,
  rateLimit,
  requestUser,
  requireCompanyMember,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { jobInputSchema } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

const mutationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('save_draft'), companyId: z.string().cuid(), job: jobInputSchema }),
  z.object({ action: z.literal('publish'), companyId: z.string().cuid(), job: jobInputSchema }),
  z.object({ action: z.literal('expire'), companyId: z.string().cuid(), jobId: z.string().cuid() }),
]);

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified) return forbidden();
  const companyId = new URL(request.url).searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'company_required' }, { status: 400 });
  const membership = await requireCompanyMember(user.id, companyId);
  if (!membership) return forbidden();
  const jobs = await prisma.job.findMany({
    where: { companyId, isDemo: false },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      workMode: true,
      salaryMin: true,
      salaryMax: true,
      experienceMinYears: true,
      experienceMaxYears: true,
      employmentType: true,
      industry: true,
      skills: true,
      maxNoticePeriodDays: true,
      status: true,
      moderationNote: true,
      postedAt: true,
      expiresAt: true,
      _count: { select: { applications: { where: { isDemo: false } } } },
    },
  });
  return NextResponse.json({
    items: jobs.map((job) => ({
      ...job,
      postedAt: job.postedAt?.toISOString() ?? null,
      expiresAt: job.expiresAt?.toISOString() ?? null,
      applicationCount: job._count.applications,
    })),
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified)
    return NextResponse.json({ error: 'email_verification_required' }, { status: 403 });
  const limited = await rateLimit(request, 'company-job-write', user.id, 40);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = mutationSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ errors: errorFields(parsed.error) }, { status: 400 });
  const membership = await requireCompanyMember(user.id, parsed.data.companyId);
  if (!membership) return forbidden();
  if (membership.role === 'RECRUITER' && parsed.data.action !== 'save_draft') return forbidden();

  if (parsed.data.action === 'expire') {
    const job = await prisma.job.findFirst({
      where: { id: parsed.data.jobId, companyId: parsed.data.companyId, isDemo: false },
    });
    if (!job) return NextResponse.json({ error: 'job_not_found' }, { status: 404 });
    const updated = await prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.EXPIRED, expiresAt: new Date() },
      select: { id: true, status: true },
    });
    return NextResponse.json({ job: updated });
  }

  const input = parsed.data.job;
  if (input.salaryMin !== null && input.salaryMax !== null && input.salaryMin > input.salaryMax) {
    return NextResponse.json(
      { errors: { salaryMax: 'The maximum salary must be at least the minimum.' } },
      { status: 400 },
    );
  }
  if (input.experienceMaxYears !== null && input.experienceMinYears > input.experienceMaxYears) {
    return NextResponse.json(
      { errors: { experienceMaxYears: 'The maximum experience must be at least the minimum.' } },
      { status: 400 },
    );
  }
  const existing = input.id
    ? await prisma.job.findFirst({
        where: { id: input.id, companyId: parsed.data.companyId, isDemo: false },
        select: { id: true },
      })
    : null;
  if (input.id && !existing) return NextResponse.json({ error: 'job_not_found' }, { status: 404 });
  const nextStatus = parsed.data.action === 'publish' ? JobStatus.PENDING : JobStatus.DRAFT;
  const data = {
    createdByUserId: user.id,
    title: input.title,
    description: input.description,
    location: input.location,
    workMode: input.workMode,
    salaryMin: input.salaryMin,
    salaryMax: input.salaryMax,
    experienceMinYears: input.experienceMinYears,
    experienceMaxYears: input.experienceMaxYears,
    employmentType: input.employmentType,
    industry: input.industry,
    skills: input.skills,
    maxNoticePeriodDays: input.maxNoticePeriodDays,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    status: nextStatus,
    postedAt: null,
  };
  const job = existing
    ? await prisma.job.update({
        where: { id: existing.id },
        data,
        select: { id: true, title: true, status: true },
      })
    : await prisma.job.create({
        data: { ...data, companyId: parsed.data.companyId },
        select: { id: true, title: true, status: true },
      });
  return NextResponse.json({ job }, { status: existing ? 200 : 201 });
}
