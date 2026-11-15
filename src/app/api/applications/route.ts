// @polsia:user-owned
import 'server-only';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { applicationWritePlan } from '@/lib/business/application-idempotency';
import {
  forbidden,
  isOpenJob,
  rateLimit,
  requestUser,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { applicationActionSchema } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email/send';
import { env } from '@/lib/env';
import { sameOrigin } from '@/lib/same-origin';

async function serializeApplications(userId: string) {
  const applications = await prisma.application.findMany({
    where: { seekerUserId: userId, isDemo: false, job: { isDemo: false } },
    include: {
      job: { include: { company: { select: { name: true } } } },
      history: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { appliedAt: 'desc' },
  });
  const authorIds = [
    ...new Set(applications.flatMap((item) => item.history.map((event) => event.authorUserId))),
  ];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true },
  });
  const authorNames = new Map(authors.map((item) => [item.id, item.name]));
  return applications.map((item) => ({
    id: item.id,
    status: item.status,
    appliedAt: item.appliedAt.toISOString(),
    job: {
      id: item.job.id,
      title: item.job.title,
      companyName: item.job.company.name,
      location: item.job.location,
    },
    history: item.history.map((event) => ({
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      authorName: authorNames.get(event.authorUserId) ?? 'RecruitAI',
      createdAt: event.createdAt.toISOString(),
    })),
  }));
}

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const items = await serializeApplications(user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified)
    return NextResponse.json({ error: 'email_verification_required' }, { status: 403 });
  const limited = await rateLimit(request, 'application-create', user.id, 12);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = applicationActionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ errors: { jobId: 'Choose a valid open role.' } }, { status: 400 });

  const prior = await prisma.application.findUnique({
    where: { seekerUserId_jobId: { seekerUserId: user.id, jobId: parsed.data.jobId } },
    select: { id: true },
  });
  const plan = applicationWritePlan(prior?.id ?? null);
  if (plan.kind === 'return_existing')
    return NextResponse.json({ id: plan.applicationId, existing: true }, { status: 200 });

  const [job, profile] = await Promise.all([
    prisma.job.findFirst({
      where: { id: parsed.data.jobId, isDemo: false, company: { suspended: false, isDemo: false } },
      include: { company: { select: { id: true, name: true } } },
    }),
    prisma.candidateProfile.findUnique({
      where: { userId: user.id },
      include: { resumes: { where: { isCurrent: true }, take: 1 } },
    }),
  ]);
  if (!job || !isOpenJob(job)) return NextResponse.json({ error: 'job_closed' }, { status: 409 });
  const resume = profile?.resumes[0];
  if (!profile || !resume || profile.skills.length === 0 || profile.education.trim().length === 0) {
    return NextResponse.json(
      {
        error: 'profile_incomplete',
        message: 'Complete your profile and add a PDF resume before applying.',
      },
      { status: 400 },
    );
  }

  let applicationId = '';
  try {
    const application = await prisma.application.create({
      data: {
        seekerUserId: user.id,
        candidateProfileId: profile.id,
        jobId: job.id,
        resumeId: resume.id,
        profileSnapshot: {
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
        },
        history: {
          create: {
            eventKey: `application:${user.id}:${job.id}:applied`,
            fromStatus: null,
            toStatus: 'APPLIED',
            authorUserId: user.id,
          },
        },
      },
      select: { id: true },
    });
    applicationId = application.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.application.findUnique({
        where: { seekerUserId_jobId: { seekerUserId: user.id, jobId: job.id } },
        select: { id: true },
      });
      if (existing) return NextResponse.json({ id: existing.id, existing: true }, { status: 200 });
    }
    return NextResponse.json(
      {
        error: 'application_failed',
        message: 'Your application could not be saved. Please try again.',
      },
      { status: 500 },
    );
  }

  const candidateNotification = await prisma.notification
    .create({
      data: {
        userId: user.id,
        title: 'Application received',
        body: `Your application for ${job.title} is now in the Applied stage.`,
        href: '/dashboard/applications',
        kind: 'application',
      },
      select: { id: true },
    })
    .catch(() => null);
  const memberships = await prisma.companyMembership.findMany({
    where: { companyId: job.companyId, active: true, company: { suspended: false, isDemo: false } },
    select: { userId: true },
  });
  const recruiterIds = memberships.map((item) => item.userId);
  const recruiters = await prisma.user.findMany({
    where: { id: { in: recruiterIds }, banned: false },
    select: { id: true, email: true, name: true },
  });
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const messages = [
    sendEmail({
      to: user.email,
      subject: `Application received: ${job.title}`,
      text: `Your application to ${job.company.name} for ${job.title} was received. You can follow its status at ${baseUrl}/dashboard/applications.`,
      html: `<p>Your application to ${job.company.name} for <strong>${job.title}</strong> was received.</p><p>Follow its status at <a href="${baseUrl}/dashboard/applications">your application tracker</a>.</p>`,
    }),
    ...recruiters.map((recruiter) =>
      sendEmail({
        to: recruiter.email,
        subject: `New application: ${job.title}`,
        text: `${profile.fullName} applied to ${job.title}. Review the application in your RecruitAI workspace: ${baseUrl}/dashboard/company/applications.`,
        html: `<p>${profile.fullName} applied to <strong>${job.title}</strong>.</p><p><a href="${baseUrl}/dashboard/company/applications">Review the application</a>.</p>`,
      }),
    ),
  ];
  const deliveries = await Promise.all(
    messages.map((message) => message.then((result) => Boolean(result.id)).catch(() => false)),
  );
  const emailDelivered = deliveries[0] ?? false;
  if (!emailDelivered && candidateNotification) {
    await prisma.notification
      .update({
        where: { id: candidateNotification.id },
        data: {
          body: `Your application for ${job.title} was saved, but the confirmation email could not be delivered. Follow updates in your tracker.`,
        },
      })
      .catch(() => null);
  }
  await Promise.all(
    recruiters.flatMap((recruiter, index) =>
      deliveries[index + 1]
        ? []
        : [
            prisma.notification
              .create({
                data: {
                  userId: recruiter.id,
                  title: 'New application saved',
                  body: `An application for ${job.title} is ready in your company pipeline. The email notification could not be delivered.`,
                  href: '/dashboard/company/applications',
                  kind: 'application',
                },
              })
              .catch(() => null),
          ],
    ),
  );

  return NextResponse.json({ id: applicationId, existing: false, emailDelivered }, { status: 201 });
}
