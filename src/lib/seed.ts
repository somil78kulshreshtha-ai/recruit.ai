// @polsia:user-owned — deploy-time database seed. You OWN this file.
//
// seed() runs once when the server boots (via the framework-owned
// src/instrumentation.ts), on the Node server, AFTER the schema is applied. Use it
// for reference/lookup data your app needs to exist BEFORE the first request:
// plans, categories, feature defaults, a first admin row, etc. Read/write the DB
// through the Prisma singleton in @/lib/db (server startup — there is no request,
// so this does NOT go through /api).
//
// RULES — this runs on EVERY deploy/boot, possibly more than once, possibly on more
// than one instance at the same time:
//   1. Make every write IDEMPOTENT — upsert (`where` + `create` + `update`) or
//      `createMany({ ..., skipDuplicates: true })`, NEVER a bare `create`/`insert`.
//   2. Keep it fast and small — it runs before the server serves traffic.
//   3. NOT for recurring work (that's polsia.toml `[[crons]]`) or per-user/
//      request-time logic (that's an /api route handler). There is no request here.
//
// The template ships an empty seed (a no-op). Fill in the body when your app needs
// it; leave it empty to keep seeding off. Don't delete the file — instrumentation.ts
// imports it.
export async function seed(): Promise<void> {
  const { prisma } = await import('@/lib/db');
  const company = await prisma.company.upsert({
    where: { slug: 'demo-northstar-labs' },
    create: {
      id: 'demo-company-northstar',
      name: 'Demo company · Northstar Labs',
      slug: 'demo-northstar-labs',
      description:
        'Clearly labelled sample company profile for exploring the isolated RecruitAI demo workspace.',
      website: '',
      industry: 'Technology',
      city: 'Pune',
      verificationStatus: 'UNVERIFIED',
      isDemo: true,
      demoLabel: 'DEMO DATA · NOT A REAL COMPANY',
    },
    update: {},
  });
  const candidate = await prisma.candidateProfile.upsert({
    where: { userId: 'demo-seeker-aarav' },
    create: {
      id: 'demo-profile-aarav',
      userId: 'demo-seeker-aarav',
      fullName: 'Demo candidate · Aarav Kulkarni',
      headline: 'Sample product designer profile',
      city: 'Pune',
      skills: ['Product design', 'Figma', 'User research'],
      experienceYears: 4,
      education: 'Sample education record',
      expectedCtc: 1800000,
      noticePeriodDays: 30,
      preferredLocations: ['Pune', 'Remote'],
      workMode: 'HYBRID',
      isOpenToWork: true,
      isDiscoverable: true,
      isDemo: true,
      demoLabel: 'DEMO DATA · NOT A REAL PERSON',
    },
    update: {},
  });
  const openJob = await prisma.job.upsert({
    where: { id: 'demo-job-product-designer' },
    create: {
      id: 'demo-job-product-designer',
      companyId: company.id,
      createdByUserId: 'demo-company-owner',
      title: 'Demo role · Product Designer',
      description:
        'Sample description for the isolated RecruitAI demo. A hiring team could describe the role, responsibilities, and required experience here.',
      location: 'Pune',
      workMode: 'HYBRID',
      salaryMin: 1200000,
      salaryMax: 1800000,
      experienceMinYears: 3,
      experienceMaxYears: 6,
      employmentType: 'FULL_TIME',
      industry: 'Technology',
      skills: ['Product design', 'Figma', 'User research'],
      maxNoticePeriodDays: 60,
      status: 'PUBLISHED',
      postedAt: new Date(),
      isDemo: true,
      demoLabel: 'DEMO DATA · NOT A REAL OPENING',
    },
    update: {},
  });
  await prisma.job.upsert({
    where: { id: 'demo-job-product-analyst' },
    create: {
      id: 'demo-job-product-analyst',
      companyId: company.id,
      createdByUserId: 'demo-company-owner',
      title: 'Demo draft · Product Analyst',
      description:
        'Sample draft description for the isolated RecruitAI moderation demo. This record is not an active vacancy.',
      location: 'Mumbai',
      workMode: 'ONSITE',
      salaryMin: 900000,
      salaryMax: 1400000,
      experienceMinYears: 2,
      experienceMaxYears: 4,
      employmentType: 'FULL_TIME',
      industry: 'Technology',
      skills: ['Analytics', 'SQL'],
      maxNoticePeriodDays: 45,
      status: 'PENDING',
      isDemo: true,
      demoLabel: 'DEMO DATA · PENDING REVIEW',
    },
    update: {},
  });
  const application = await prisma.application.upsert({
    where: { seekerUserId_jobId: { seekerUserId: candidate.userId, jobId: openJob.id } },
    create: {
      id: 'demo-application-aarav-product-designer',
      seekerUserId: candidate.userId,
      candidateProfileId: candidate.id,
      jobId: openJob.id,
      resumeId: null,
      status: 'APPLIED',
      profileSnapshot: {
        fullName: candidate.fullName,
        headline: candidate.headline,
        city: candidate.city,
        skills: candidate.skills,
        experienceYears: candidate.experienceYears,
        education: candidate.education,
        expectedCtc: candidate.expectedCtc,
        noticePeriodDays: candidate.noticePeriodDays,
        preferredLocations: candidate.preferredLocations,
        workMode: candidate.workMode,
      },
      isDemo: true,
      demoLabel: 'DEMO DATA · NOT A REAL APPLICATION',
    },
    update: {},
  });
  await prisma.applicationStageHistory.upsert({
    where: { eventKey: 'demo-application-applied' },
    create: {
      id: 'demo-history-applied',
      eventKey: 'demo-application-applied',
      applicationId: application.id,
      fromStatus: null,
      toStatus: 'APPLIED',
      authorUserId: 'demo-seeker-aarav',
      note: 'Sample application created for the isolated demo workspace.',
      isDemo: true,
    },
    update: {},
  });
  await prisma.scamReport.upsert({
    where: { id: 'demo-scam-report-product-designer' },
    create: {
      id: 'demo-scam-report-product-designer',
      jobId: openJob.id,
      reporterId: 'demo-seeker-aarav',
      reason: 'Sample report for practicing admin moderation; this is not a real allegation.',
      status: 'OPEN',
      isDemo: true,
    },
    update: {},
  });
}
