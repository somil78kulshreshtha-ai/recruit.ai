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
import { companyInputSchema } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

const patchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('update'),
    companyId: z.string().cuid(),
    company: companyInputSchema,
  }),
  z.object({ action: z.literal('request_verification'), companyId: z.string().cuid() }),
]);

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified) return forbidden();
  const companyId = new URL(request.url).searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'company_required' }, { status: 400 });
  const membership = await requireCompanyMember(user.id, companyId);
  if (!membership) return forbidden();
  return NextResponse.json({
    company: {
      id: membership.company.id,
      name: membership.company.name,
      description: membership.company.description,
      website: membership.company.website,
      industry: membership.company.industry,
      city: membership.company.city,
      verificationStatus: membership.company.verificationStatus,
    },
    role: membership.role,
  });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified) return forbidden();
  const limited = await rateLimit(request, 'company-profile', user.id, 30);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { company: 'Check the company details and try again.' } },
      { status: 400 },
    );
  const membership = await requireCompanyMember(user.id, parsed.data.companyId);
  if (!membership) return forbidden();
  if (membership.role === 'RECRUITER') return forbidden();
  if (parsed.data.action === 'request_verification') {
    if (membership.company.verificationStatus === 'VERIFIED') {
      return NextResponse.json({ error: 'already_verified' }, { status: 409 });
    }
    const company = await prisma.company.update({
      where: { id: membership.companyId },
      data: { verificationStatus: 'PENDING' },
      select: { id: true, verificationStatus: true },
    });
    return NextResponse.json({ company });
  }
  const company = await prisma.company.update({
    where: { id: membership.companyId },
    data: parsed.data.company,
  });
  return NextResponse.json({
    company: {
      id: company.id,
      name: company.name,
      description: company.description,
      website: company.website,
      industry: company.industry,
      city: company.city,
      verificationStatus: company.verificationStatus,
    },
  });
}
