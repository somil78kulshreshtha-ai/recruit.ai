// @polsia:user-owned
import 'server-only';
import { ApplicationStatus, JobStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import {
  forbidden,
  hasAdminRole,
  requestUser,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified || !hasAdminRole(user.role)) return forbidden();
  const [users, companies, candidates, activeJobs, applications, interviews, hires] =
    await Promise.all([
      prisma.user.count(),
      prisma.company.count({ where: { isDemo: false } }),
      prisma.candidateProfile.count({ where: { isDemo: false } }),
      prisma.job.count({
        where: {
          status: JobStatus.PUBLISHED,
          isDemo: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      prisma.application.count({ where: { isDemo: false } }),
      prisma.application.count({ where: { status: ApplicationStatus.INTERVIEW, isDemo: false } }),
      prisma.application.count({ where: { status: ApplicationStatus.HIRED, isDemo: false } }),
    ]);
  const [recentUsers, recentJobs, recentApplications, reports] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { company: { select: { name: true } } },
    }),
    prisma.application.findMany({
      where: { isDemo: false },
      orderBy: { appliedAt: 'desc' },
      take: 5,
      include: { job: { select: { title: true } } },
    }),
    prisma.scamReport.count({ where: { status: 'OPEN', isDemo: false } }),
  ]);
  return NextResponse.json({
    counts: {
      users,
      companies,
      candidates,
      activeJobs,
      applications,
      interviews,
      hires,
      openReports: reports,
    },
    recentUsers: recentUsers.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    recentJobs: recentJobs.map((item) => ({
      id: item.id,
      title: item.title,
      companyName: item.company.name,
      status: item.status,
      isDemo: item.isDemo,
      createdAt: item.createdAt.toISOString(),
    })),
    recentApplications: recentApplications.map((item) => ({
      id: item.id,
      jobTitle: item.job.title,
      status: item.status,
      appliedAt: item.appliedAt.toISOString(),
    })),
    system: { api: 'operational', database: 'connected' },
  });
}
