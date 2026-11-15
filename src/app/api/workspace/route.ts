// @polsia:user-owned
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateProfileCompleteness } from '@/lib/business/profile-completeness';
import {
  errorFields,
  forbidden,
  rateLimit,
  requestUser,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { companyInputSchema } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

const workspaceSetupSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('seeker') }),
  z.object({ kind: z.literal('company'), company: companyInputSchema }),
]);

function profileResponse(
  profile: NonNullable<Awaited<ReturnType<typeof prisma.candidateProfile.findUnique>>> & {
    resumes: Array<{ id: string; filename: string; fileKey: string; isCurrent: boolean }>;
  },
) {
  const resume = profile.resumes.find((item) => item.isCurrent) ?? null;
  const completeness = calculateProfileCompleteness({
    fullName: profile.fullName,
    skills: profile.skills,
    experienceYears: profile.experienceYears,
    education: profile.education,
    expectedCtc: profile.expectedCtc,
    noticePeriodDays: profile.noticePeriodDays,
    preferredLocations: profile.preferredLocations,
    workMode: profile.workMode,
    resumeKey: resume?.fileKey ?? null,
  });
  return {
    id: profile.id,
    fullName: profile.fullName,
    headline: profile.headline,
    city: profile.city,
    skills: profile.skills,
    experienceYears: profile.experienceYears,
    education: profile.education,
    expectedCtc: profile.expectedCtc,
    noticePeriodDays: profile.noticePeriodDays,
    preferredLocations: profile.preferredLocations,
    workMode: profile.workMode,
    isOpenToWork: profile.isOpenToWork,
    isDiscoverable: profile.isDiscoverable,
    resume: resume ? { id: resume.id, filename: resume.filename, fileKey: resume.fileKey } : null,
    completeness,
  };
}

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
    include: { resumes: { where: { isCurrent: true }, take: 1 } },
  });
  const memberships = await prisma.companyMembership.findMany({
    where: { userId: user.id, active: true, company: { isDemo: false } },
    include: {
      company: { select: { id: true, name: true, verificationStatus: true, suspended: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  const [applications, savedJobs, alerts, notifications] = await Promise.all([
    prisma.application.count({ where: { seekerUserId: user.id, isDemo: false } }),
    prisma.savedJob.count({ where: { userId: user.id, job: { isDemo: false } } }),
    prisma.jobAlert.count({ where: { userId: user.id, isDemo: false, active: true } }),
    prisma.notification.count({ where: { userId: user.id, isDemo: false, readAt: null } }),
  ]);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    profile: profile ? profileResponse(profile) : null,
    companies: memberships
      .filter((item) => !item.company.suspended)
      .map((item) => ({
        id: item.company.id,
        name: item.company.name,
        role: item.role,
        verificationStatus: item.company.verificationStatus,
      })),
    counts: { applications, savedJobs, alerts, notifications },
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'workspace-setup', user.id, 8);
  if (limited) return limited;

  const body: unknown = await request.json().catch(() => null);
  const parsed = workspaceSetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: errorFields(parsed.error) }, { status: 400 });
  }

  if (parsed.data.kind === 'seeker') {
    const profile = await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, fullName: user.name },
      update: {},
    });
    return NextResponse.json({ kind: 'seeker', id: profile.id }, { status: 201 });
  }

  const companyData = parsed.data.company;
  const slug = `${
    companyData.name
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 54) || 'company'
  }-${user.id.slice(-6)}`;
  const company = await prisma.$transaction(async (tx) => {
    const created = await tx.company.upsert({
      where: { slug },
      create: { ...companyData, slug },
      update: companyData,
    });
    await tx.companyMembership.upsert({
      where: { companyId_userId: { companyId: created.id, userId: user.id } },
      create: { companyId: created.id, userId: user.id, role: 'OWNER' },
      update: { active: true },
    });
    return created;
  });
  return NextResponse.json({ kind: 'company', id: company.id }, { status: 201 });
}
