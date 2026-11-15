// @polsia:user-owned
import 'server-only';
import { createHash } from 'node:crypto';
import { ApplicationStatus, type Job, JobStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import type { JobSearch } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';

export interface RequestUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  banned: boolean;
}

export async function requestUser(request: Request): Promise<RequestUser | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || session.user.banned) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    role: session.user.role ?? 'user',
    banned: session.user.banned ?? false,
  };
}

export function hasAdminRole(role: string): boolean {
  return role
    .split(',')
    .map((item) => item.trim())
    .includes('admin');
}

export function unauthorized(): Response {
  return Response.json({ error: 'unauthorized' }, { status: 401 });
}

export function forbidden(): Response {
  return Response.json({ error: 'forbidden' }, { status: 403 });
}

export async function requireCompanyMember(userId: string, companyId: string) {
  return prisma.companyMembership.findFirst({
    where: {
      userId,
      companyId,
      active: true,
      company: { suspended: false, isDemo: false },
    },
    include: { company: true },
  });
}

export async function rateLimit(
  request: Request,
  scope: string,
  subjectId: string | null,
  maxRequests: number,
  windowMs = 60 * 60 * 1000,
): Promise<Response | null> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const subject = subjectId
    ? `user:${subjectId}`
    : `ip:${createHash('sha256').update(ip).digest('hex')}`;
  const bucketKey = `${scope}:${subject}:${windowStart.getTime()}`;
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { bucketKey },
    create: { bucketKey, count: 1, windowStart },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (Math.random() < 0.02) {
    await prisma.rateLimitBucket.deleteMany({
      where: { windowStart: { lt: new Date(now - 48 * 60 * 60 * 1000) } },
    });
  }

  if (bucket.count > maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowStart.getTime() + windowMs - now) / 1000),
    );
    return Response.json(
      { error: 'rate_limited', message: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'retry-after': String(retryAfterSeconds) } },
    );
  }
  return null;
}

export function isOpenJob(
  job: Pick<Job, 'status' | 'expiresAt' | 'isDemo'>,
  allowDemo = false,
): boolean {
  return (
    job.status === JobStatus.PUBLISHED &&
    (allowDemo || !job.isDemo) &&
    (job.expiresAt === null || job.expiresAt.getTime() > Date.now())
  );
}

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  const allowed: Record<ApplicationStatus, ApplicationStatus[]> = {
    APPLIED: [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED],
    SHORTLISTED: [ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED],
    INTERVIEW: [ApplicationStatus.OFFER, ApplicationStatus.REJECTED],
    OFFER: [ApplicationStatus.HIRED, ApplicationStatus.REJECTED],
    HIRED: [],
    REJECTED: [],
  };
  return allowed[from].includes(to);
}

export function matchesJobCriteria(
  criteria: JobSearch,
  job: Pick<
    Job,
    | 'title'
    | 'description'
    | 'location'
    | 'workMode'
    | 'salaryMin'
    | 'salaryMax'
    | 'experienceMinYears'
    | 'experienceMaxYears'
    | 'employmentType'
    | 'industry'
    | 'skills'
    | 'maxNoticePeriodDays'
  > & {
    company: { name: string };
  },
): boolean {
  const text =
    `${job.title} ${job.description} ${job.industry} ${job.company.name}`.toLocaleLowerCase();
  const q = typeof criteria.q === 'string' ? criteria.q.toLocaleLowerCase() : '';
  const city = typeof criteria.city === 'string' ? criteria.city.toLocaleLowerCase() : '';
  const company = typeof criteria.company === 'string' ? criteria.company.toLocaleLowerCase() : '';
  const skill = typeof criteria.skill === 'string' ? criteria.skill.toLocaleLowerCase() : '';
  const salaryMin = typeof criteria.salaryMin === 'number' ? criteria.salaryMin : null;
  const salaryMax = typeof criteria.salaryMax === 'number' ? criteria.salaryMax : null;
  const experience = typeof criteria.experience === 'number' ? criteria.experience : null;
  const noticePeriod = typeof criteria.noticePeriod === 'number' ? criteria.noticePeriod : null;

  return (
    (!q || text.includes(q)) &&
    (!city || job.location.toLocaleLowerCase().includes(city)) &&
    (!company || job.company.name.toLocaleLowerCase().includes(company)) &&
    (!skill || job.skills.some((item) => item.toLocaleLowerCase().includes(skill))) &&
    (!criteria.workMode || job.workMode === criteria.workMode) &&
    (!criteria.employmentType || job.employmentType === criteria.employmentType) &&
    (!criteria.industry ||
      job.industry.toLocaleLowerCase() === String(criteria.industry).toLocaleLowerCase()) &&
    (salaryMin === null || job.salaryMax === null || job.salaryMax >= salaryMin) &&
    (salaryMax === null || job.salaryMin === null || job.salaryMin <= salaryMax) &&
    (experience === null ||
      (job.experienceMinYears <= experience &&
        (job.experienceMaxYears === null || job.experienceMaxYears >= experience))) &&
    (noticePeriod === null ||
      job.maxNoticePeriodDays === null ||
      job.maxNoticePeriodDays <= noticePeriod)
  );
}

export function errorFields(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  const fields = error.flatten().fieldErrors;
  return Object.fromEntries(Object.entries(fields).map(([key, values]) => [key, values?.[0]]));
}
