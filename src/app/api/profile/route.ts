// @polsia:user-owned
import 'server-only';
import { NextResponse } from 'next/server';
import { calculateProfileCompleteness } from '@/lib/business/profile-completeness';
import {
  errorFields,
  forbidden,
  rateLimit,
  requestUser,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { profileInputSchema } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

async function readProfile(userId: string) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { resumes: { where: { isCurrent: true }, take: 1 } },
  });
  if (!profile) return null;
  const resume = profile.resumes[0] ?? null;
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
    completeness: calculateProfileCompleteness({
      fullName: profile.fullName,
      skills: profile.skills,
      experienceYears: profile.experienceYears,
      education: profile.education,
      expectedCtc: profile.expectedCtc,
      noticePeriodDays: profile.noticePeriodDays,
      preferredLocations: profile.preferredLocations,
      workMode: profile.workMode,
      resumeKey: resume?.fileKey ?? null,
    }),
  };
}

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const profile = await readProfile(user.id);
  if (!profile) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'profile-write', user.id, 30);
  if (limited) return limited;

  const body: unknown = await request.json().catch(() => null);
  const parsed = profileInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: errorFields(parsed.error) }, { status: 400 });
  }

  await prisma.candidateProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  });
  const profile = await readProfile(user.id);
  return NextResponse.json(profile, { status: 200 });
}
