// @polsia:user-owned
import 'server-only';
import type { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import {
  canTransitionApplication,
  forbidden,
  rateLimit,
  requestUser,
  requireCompanyMember,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { applicationCommentSchema, applicationStatusUpdateSchema } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email/send';
import { env } from '@/lib/env';
import { sameOrigin } from '@/lib/same-origin';

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified) return forbidden();
  const companyId = new URL(request.url).searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'company_required' }, { status: 400 });
  const membership = await requireCompanyMember(user.id, companyId);
  if (!membership) return forbidden();
  const applications = await prisma.application.findMany({
    where: { isDemo: false, job: { companyId, isDemo: false } },
    include: {
      job: { select: { id: true, title: true, location: true, companyId: true } },
      candidateProfile: { select: { userId: true } },
      resume: { select: { id: true, fileKey: true, filename: true } },
      history: { orderBy: { createdAt: 'asc' } },
      comments: { where: { isDemo: false }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { appliedAt: 'desc' },
  });
  const snapshots = applications.map((item) => item.profileSnapshot as Prisma.JsonObject);
  const actorIds = [
    ...new Set([
      ...applications.flatMap((item) => item.history.map((event) => event.authorUserId)),
      ...applications.flatMap((item) => item.comments.map((comment) => comment.authorUserId)),
    ]),
  ];
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true },
  });
  const actorNames = new Map(actors.map((item) => [item.id, item.name]));
  return NextResponse.json({
    items: applications.map((item, index) => ({
      id: item.id,
      status: item.status,
      appliedAt: item.appliedAt.toISOString(),
      job: item.job,
      candidate: {
        userId: item.seekerUserId,
        profile: snapshots[index] ?? {},
        resume: item.resume
          ? { id: item.resume.id, fileKey: item.resume.fileKey, filename: item.resume.filename }
          : null,
      },
      history: item.history.map((event) => ({
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        authorName: actorNames.get(event.authorUserId) ?? 'RecruitAI',
        note: event.note,
        createdAt: event.createdAt.toISOString(),
      })),
      comments: item.comments
        .filter(
          (comment) =>
            comment.visibility === 'TEAM' ||
            membership.role === 'OWNER' ||
            membership.role === 'RECRUITER',
        )
        .map((comment) => ({
          id: comment.id,
          body: comment.body,
          visibility: comment.visibility,
          authorName: actorNames.get(comment.authorUserId) ?? 'RecruitAI',
          createdAt: comment.createdAt.toISOString(),
        })),
    })),
  });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified)
    return NextResponse.json({ error: 'email_verification_required' }, { status: 403 });
  const limited = await rateLimit(request, 'company-application-status', user.id, 80);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = applicationStatusUpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { status: 'Choose a valid hiring stage.' } },
      { status: 400 },
    );
  const application = await prisma.application.findFirst({
    where: { id: parsed.data.applicationId, isDemo: false, job: { isDemo: false } },
    include: { job: { include: { company: true } } },
  });
  if (!application) return NextResponse.json({ error: 'application_not_found' }, { status: 404 });
  const membership = await requireCompanyMember(user.id, application.job.companyId);
  if (!membership) return forbidden();
  if (!canTransitionApplication(application.status, parsed.data.status)) {
    return NextResponse.json({ error: 'invalid_stage_transition' }, { status: 409 });
  }
  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.application.updateMany({
      where: { id: application.id, status: application.status },
      data: { status: parsed.data.status },
    });
    if (!changed.count) return null;
    const row = await tx.application.findUnique({
      where: { id: application.id },
      select: { id: true, status: true },
    });
    if (!row) return null;
    await tx.applicationStageHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: application.status,
        toStatus: parsed.data.status,
        authorUserId: user.id,
      },
    });
    const notification = await tx.notification.create({
      data: {
        userId: application.seekerUserId,
        title: 'Application update',
        body: `${application.job.title} moved to ${parsed.data.status.toLocaleLowerCase()}.`,
        href: '/dashboard/applications',
        kind: 'application',
      },
      select: { id: true },
    });
    return { ...row, notificationId: notification.id };
  });
  if (!updated)
    return NextResponse.json(
      {
        error: 'application_stage_changed',
        message: 'Another reviewer changed this application. Reload the pipeline and try again.',
      },
      { status: 409 },
    );

  const seeker = await prisma.user.findUnique({
    where: { id: application.seekerUserId },
    select: { email: true },
  });
  let emailDelivered = false;
  if (seeker?.email) {
    try {
      const result = await sendEmail({
        to: seeker.email,
        subject: `Application update: ${application.job.title}`,
        text: `Your application for ${application.job.title} moved to ${parsed.data.status.toLocaleLowerCase()}. Follow its history at ${env.NEXT_PUBLIC_APP_URL}/dashboard/applications.`,
        html: `<p>Your application for <strong>${application.job.title}</strong> moved to ${parsed.data.status.toLocaleLowerCase()}.</p><p><a href="${env.NEXT_PUBLIC_APP_URL}/dashboard/applications">View your tracker</a>.</p>`,
      });
      emailDelivered = Boolean(result.id);
    } catch {
      emailDelivered = false;
    }
  }
  if (!emailDelivered) {
    await prisma.notification
      .update({
        where: { id: updated.notificationId },
        data: {
          body: `${application.job.title} moved to ${parsed.data.status.toLocaleLowerCase()}. Email delivery failed; view the update in your RecruitAI tracker.`,
        },
      })
      .catch(() => null);
  }
  return NextResponse.json(
    { id: updated.id, status: updated.status, emailDelivered },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified)
    return NextResponse.json({ error: 'email_verification_required' }, { status: 403 });
  const limited = await rateLimit(request, 'company-application-comment', user.id, 100);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = applicationCommentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { body: 'Write a comment of at least two characters.' } },
      { status: 400 },
    );
  const application = await prisma.application.findFirst({
    where: { id: parsed.data.applicationId, isDemo: false, job: { isDemo: false } },
    select: { id: true, job: { select: { companyId: true } } },
  });
  if (!application) return NextResponse.json({ error: 'application_not_found' }, { status: 404 });
  const membership = await requireCompanyMember(user.id, application.job.companyId);
  if (!membership) return forbidden();
  if (parsed.data.visibility === 'PRIVATE_NOTE' && membership.role === 'HIRING_MANAGER')
    return forbidden();
  const comment = await prisma.applicationComment.create({
    data: {
      applicationId: application.id,
      authorUserId: user.id,
      body: parsed.data.body,
      visibility: parsed.data.visibility,
    },
  });
  return NextResponse.json(
    { id: comment.id, createdAt: comment.createdAt.toISOString() },
    { status: 201 },
  );
}
