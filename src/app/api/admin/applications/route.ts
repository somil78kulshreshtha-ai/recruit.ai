// @polsia:user-owned
import 'server-only';
import { NextResponse } from 'next/server';
import {
  forbidden,
  hasAdminRole,
  requestUser,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { applicationStatusSchema } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const admin = await requestUser(request);
  if (!admin) return unauthorized();
  if (!admin.emailVerified || !hasAdminRole(admin.role)) return forbidden();
  const rawStatus = new URL(request.url).searchParams.get('status');
  const parsedStatus = rawStatus ? applicationStatusSchema.safeParse(rawStatus) : null;
  if (rawStatus && !parsedStatus?.success)
    return NextResponse.json(
      { errors: { status: 'Choose a supported application stage.' } },
      { status: 400 },
    );
  const applications = await prisma.application.findMany({
    where: parsedStatus?.success ? { status: parsedStatus.data } : {},
    include: {
      job: { include: { company: { select: { name: true } } } },
      history: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { appliedAt: 'desc' },
    take: 200,
  });
  const authorIds = [
    ...new Set(applications.flatMap((item) => item.history.map((event) => event.authorUserId))),
  ];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true },
  });
  const names = new Map(authors.map((item) => [item.id, item.name]));
  return NextResponse.json({
    items: applications.map((item) => ({
      id: item.id,
      status: item.status,
      seekerUserId: item.seekerUserId,
      profile: item.profileSnapshot,
      isDemo: item.isDemo,
      demoLabel: item.demoLabel,
      appliedAt: item.appliedAt.toISOString(),
      job: { id: item.job.id, title: item.job.title, companyName: item.job.company.name },
      history: item.history.map((event) => ({
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        authorName: names.get(event.authorUserId) ?? 'RecruitAI',
        createdAt: event.createdAt.toISOString(),
      })),
    })),
  });
}
