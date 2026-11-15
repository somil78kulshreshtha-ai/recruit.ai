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
import { sendEmail } from '@/lib/email/send';
import { env } from '@/lib/env';
import { sameOrigin } from '@/lib/same-origin';

const bodySchema = z.object({
  companyId: z.string().cuid(),
  candidateUserId: z.string().min(1).max(100),
  body: z.string().trim().min(10).max(2000),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified) return forbidden();
  const limited = await rateLimit(request, 'candidate-outreach', user.id, 20);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { body: 'Write a message of at least ten characters.' } },
      { status: 400 },
    );
  const membership = await requireCompanyMember(user.id, parsed.data.companyId);
  if (!membership) return forbidden();
  const profile = await prisma.candidateProfile.findFirst({
    where: {
      userId: parsed.data.candidateUserId,
      isDiscoverable: true,
      isOpenToWork: true,
      isDemo: false,
    },
    select: { userId: true },
  });
  if (!profile) return NextResponse.json({ error: 'candidate_consent_required' }, { status: 403 });
  const recipient = await prisma.user.findUnique({
    where: { id: profile.userId },
    select: { email: true },
  });
  if (!recipient) return NextResponse.json({ error: 'candidate_not_found' }, { status: 404 });

  const [message] = await prisma.$transaction([
    prisma.outreachMessage.create({
      data: {
        companyId: membership.companyId,
        candidateUserId: profile.userId,
        senderUserId: user.id,
        body: parsed.data.body,
        deliveryStatus: 'SAVED',
      },
      select: { id: true },
    }),
    prisma.notification.create({
      data: {
        userId: profile.userId,
        title: `A message from ${membership.company.name}`,
        body: parsed.data.body,
        href: '/dashboard/profile',
        kind: 'outreach',
      },
      select: { id: true },
    }),
  ]);
  let emailDelivered = false;
  try {
    const safeBody = parsed.data.body
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
    const result = await sendEmail({
      to: recipient.email,
      subject: `A message from ${membership.company.name} on RecruitAI`,
      text: `${parsed.data.body}\n\nView your RecruitAI notifications at ${env.NEXT_PUBLIC_APP_URL}/dashboard/profile.`,
      html: `<p>${safeBody}</p><p><a href="${env.NEXT_PUBLIC_APP_URL}/dashboard/profile">Open RecruitAI</a>.</p>`,
    });
    emailDelivered = Boolean(result.id);
  } catch {
    emailDelivered = false;
  }
  await prisma.outreachMessage.update({
    where: { id: message.id },
    data: { deliveryStatus: emailDelivered ? 'SENT' : 'FAILED' },
  });
  return NextResponse.json({ id: message.id, emailDelivered }, { status: 201 });
}
