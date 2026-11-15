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

const updateSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(['role', 'suspend', 'reactivate']),
  role: z.enum(['user', 'admin']).optional(),
  reason: z.string().trim().max(500).optional(),
});

export async function GET(request: Request) {
  const admin = await requestUser(request);
  if (!admin) return unauthorized();
  if (!admin.emailVerified || !hasAdminRole(admin.role)) return forbidden();
  const params = new URL(request.url).searchParams;
  const q = params.get('q')?.trim();
  const role = params.get('role');
  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(role === 'admin' || role === 'user' ? { role } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      banned: true,
      banReason: true,
      createdAt: true,
    },
  });
  const userIds = users.map((item) => item.id);
  const [profiles, memberships] = await Promise.all([
    prisma.candidateProfile.findMany({
      where: { userId: { in: userIds }, isDemo: false },
      include: { resumes: { where: { isCurrent: true }, take: 1 } },
    }),
    prisma.companyMembership.findMany({
      where: { userId: { in: userIds }, active: true, company: { isDemo: false } },
      include: { company: { select: { name: true } } },
    }),
  ]);
  const profileByUser = new Map(profiles.map((profile) => [profile.userId, profile]));
  const companiesByUser = new Map<string, Array<{ name: string; role: string }>>();
  for (const membership of memberships) {
    const values = companiesByUser.get(membership.userId) ?? [];
    values.push({ name: membership.company.name, role: membership.role });
    companiesByUser.set(membership.userId, values);
  }
  return NextResponse.json({
    items: users.map((item) => {
      const profile = profileByUser.get(item.id);
      const resume = profile?.resumes[0] ?? null;
      return {
        ...item,
        createdAt: item.createdAt.toISOString(),
        role: item.role ?? 'user',
        banned: item.banned ?? false,
        profile: profile
          ? {
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
              resume: resume ? { fileKey: resume.fileKey, filename: resume.filename } : null,
            }
          : null,
        companies: companiesByUser.get(item.id) ?? [],
      };
    }),
  });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const admin = await requestUser(request);
  if (!admin) return unauthorized();
  if (!admin.emailVerified || !hasAdminRole(admin.role)) return forbidden();
  const limited = await rateLimit(request, 'admin-user-change', admin.id, 100);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { action: 'Choose a supported user action.' } },
      { status: 400 },
    );
  if (parsed.data.userId === admin.id)
    return NextResponse.json({ error: 'cannot_change_own_access' }, { status: 409 });
  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
  const data =
    parsed.data.action === 'role'
      ? { role: parsed.data.role ?? 'user' }
      : parsed.data.action === 'suspend'
        ? {
            banned: true,
            banReason: parsed.data.reason?.trim() || 'Suspended by a RecruitAI administrator',
          }
        : { banned: false, banReason: null, banExpires: null };
  if (parsed.data.action === 'role' && !parsed.data.role)
    return NextResponse.json({ errors: { role: 'Choose a role.' } }, { status: 400 });
  const user = await prisma.user.update({
    where: { id: target.id },
    data,
    select: { id: true, role: true, banned: true },
  });
  return NextResponse.json({
    user: { ...user, role: user.role ?? 'user', banned: user.banned ?? false },
  });
}
