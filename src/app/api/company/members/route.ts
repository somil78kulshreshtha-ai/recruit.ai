// @polsia:user-owned
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  forbidden,
  rateLimit,
  requestUser,
  requireCompanyMember,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

const inviteSchema = z.object({
  companyId: z.string().cuid(),
  email: z.string().trim().email().max(254),
  role: z.enum(['RECRUITER', 'HIRING_MANAGER']),
});
const removalSchema = z.object({ companyId: z.string().cuid(), membershipId: z.string().cuid() });

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified) return forbidden();
  const companyId = new URL(request.url).searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'company_required' }, { status: 400 });
  if (!(await requireCompanyMember(user.id, companyId))) return forbidden();
  const members = await prisma.companyMembership.findMany({
    where: { companyId, active: true, company: { isDemo: false } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, userId: true, role: true, createdAt: true },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: members.map((item) => item.userId) } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((item) => [item.id, item]));
  return NextResponse.json({
    items: members.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      user: userMap.get(item.userId) ?? null,
    })),
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified) return forbidden();
  const limited = await rateLimit(request, 'company-member-invite', user.id, 30);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { email: 'Enter an existing RecruitAI account email and a team role.' } },
      { status: 400 },
    );
  const membership = await requireCompanyMember(user.id, parsed.data.companyId);
  if (!membership) return forbidden();
  if (membership.role !== 'OWNER') return forbidden();
  const invitee = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLocaleLowerCase() },
    select: { id: true, name: true, email: true },
  });
  if (!invitee)
    return NextResponse.json(
      {
        error: 'account_not_found',
        message: 'The person must create a RecruitAI account before joining this team.',
      },
      { status: 404 },
    );
  const created = await prisma.companyMembership.upsert({
    where: { companyId_userId: { companyId: membership.companyId, userId: invitee.id } },
    create: {
      companyId: membership.companyId,
      userId: invitee.id,
      role: parsed.data.role,
      active: true,
    },
    update: { role: parsed.data.role, active: true },
    select: { id: true, role: true },
  });
  await prisma.notification.create({
    data: {
      userId: invitee.id,
      title: 'You joined a company team',
      body: `You can now work with ${membership.company.name} on RecruitAI.`,
      href: '/dashboard/company',
      kind: 'team',
    },
  });
  return NextResponse.json({ membership: created }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified) return forbidden();
  const limited = await rateLimit(request, 'company-member-remove', user.id, 30);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = removalSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { membershipId: 'Choose a team member.' } },
      { status: 400 },
    );
  const membership = await requireCompanyMember(user.id, parsed.data.companyId);
  if (!membership) return forbidden();
  if (membership.role !== 'OWNER') return forbidden();
  const target = await prisma.companyMembership.findFirst({
    where: { id: parsed.data.membershipId, companyId: parsed.data.companyId, active: true },
  });
  if (!target) return NextResponse.json({ error: 'member_not_found' }, { status: 404 });
  if (target.role === 'OWNER')
    return NextResponse.json({ error: 'owner_transfer_required' }, { status: 409 });
  await prisma.companyMembership.update({ where: { id: target.id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
