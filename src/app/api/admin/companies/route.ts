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
  companyId: z.string().cuid(),
  action: z.enum(['verify', 'reject_verification', 'suspend', 'reactivate']),
});

export async function GET(request: Request) {
  const admin = await requestUser(request);
  if (!admin) return unauthorized();
  if (!admin.emailVerified || !hasAdminRole(admin.role)) return forbidden();
  const params = new URL(request.url).searchParams;
  const q = params.get('q')?.trim();
  const verificationStatus = params.get('verificationStatus');
  const companies = await prisma.company.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { industry: { contains: q, mode: 'insensitive' } },
              { city: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(verificationStatus ? { verificationStatus } : {}),
    },
    include: {
      _count: { select: { memberships: true, jobs: true } },
      jobs: { where: { isDemo: false }, select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({
    items: companies.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      website: item.website,
      industry: item.industry,
      city: item.city,
      verificationStatus: item.verificationStatus,
      suspended: item.suspended,
      isDemo: item.isDemo,
      demoLabel: item.demoLabel,
      members: item._count.memberships,
      jobs: item._count.jobs,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const admin = await requestUser(request);
  if (!admin) return unauthorized();
  if (!admin.emailVerified || !hasAdminRole(admin.role)) return forbidden();
  const limited = await rateLimit(request, 'admin-company-change', admin.id, 100);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { action: 'Choose a supported company action.' } },
      { status: 400 },
    );
  const existing = await prisma.company.findUnique({
    where: { id: parsed.data.companyId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'company_not_found' }, { status: 404 });
  const company = await prisma.company.update({
    where: { id: existing.id },
    data:
      parsed.data.action === 'verify'
        ? { verificationStatus: 'VERIFIED' }
        : parsed.data.action === 'reject_verification'
          ? { verificationStatus: 'REJECTED' }
          : parsed.data.action === 'suspend'
            ? { suspended: true }
            : { suspended: false },
    select: { id: true, name: true, verificationStatus: true, suspended: true },
  });
  return NextResponse.json({ company });
}
