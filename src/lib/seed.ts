import { prisma } from '@/lib/db';
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
  // DEMO CANDIDATES
  const candidates = [
    {
      id: "demo-profile-riya",
      userId: "demo-seeker-riya",
      fullName: "Demo candidate · Riya Sharma",
      headline: "Frontend Developer",
      city: "Pune",
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
      experienceYears: 2,
      education: "B.Tech Computer Science",
    },
    {
      id: "demo-profile-rahul",
      userId: "demo-seeker-rahul",
      fullName: "Demo candidate · Rahul Verma",
      headline: "Backend Developer",
      city: "Bengaluru",
      skills: ["Node.js", "Python", "PostgreSQL", "AWS"],
      experienceYears: 4,
      education: "B.Tech Information Technology",
    },
    {
      id: "demo-profile-neha",
      userId: "demo-seeker-neha",
      fullName: "Demo candidate · Neha Patel",
      headline: "Data Analyst",
      city: "Mumbai",
      skills: ["Python", "SQL", "Power BI", "Excel"],
      experienceYears: 3,
      education: "M.Sc Data Science",
    },
  ];

  for (const candidate of candidates) {
    const profile = await prisma.candidateProfile.upsert({
      where: { userId: candidate.userId },
      create: {
        ...candidate,
        isDemo: true,
        isDiscoverable: true,
        isOpenToWork: true,
        preferredLocations: [candidate.city, "Remote"],
        demoLabel: "DEMO DATA · NOT A REAL PERSON",
      },
      update: {},
    });

    await prisma.resume.upsert({
      where: { id: `demo-resume-${candidate.id}` },
      create: {
        id: `demo-resume-${candidate.id}`,
        profileId: profile.id,
        fileKey: `demo-resumes/${candidate.id}.pdf`,
        filename: `${candidate.fullName.replace("Demo candidate · ", "")}-Resume.pdf`,
        isCurrent: true,
        isDemo: true,
      },
      update: {},
    });
  }

  // DEMO COMPANIES
  const companies = [
    {
      name: "Demo company · TechNova",
      slug: "demo-technova",
      industry: "Information Technology",
      city: "Pune",
    },
    {
      name: "Demo company · CloudBridge",
      slug: "demo-cloudbridge",
      industry: "Software",
      city: "Bengaluru",
    },
    {
      name: "Demo company · DataNest",
      slug: "demo-datanest",
      industry: "Data Analytics",
      city: "Mumbai",
    },
  ];

  const companyRecords = [];

  for (const item of companies) {
    const record = await prisma.company.upsert({
      where: { slug: item.slug },
      create: {
        ...item,
        description: "Sample company profile for RecruitAI demonstration.",
        isDemo: true,
        verificationStatus: "UNVERIFIED",
        demoLabel: "DEMO DATA · NOT A REAL COMPANY",
      },
      update: {},
    });

    companyRecords.push(record);
  }

  // DEMO JOB LISTINGS
  const jobs = [
    {
      id: "demo-job-react",
      companyIndex: 0,
      title: "Junior React Developer",
      location: "Pune",
      salaryMin: 400000,
      salaryMax: 700000,
      experienceMinYears: 1,
      experienceMaxYears: 3,
      skills: ["React", "JavaScript", "CSS", "Next.js"],
      description:
        "Build modern web applications using React and Next.js. Work with designers and backend developers to create reliable user experiences.",
    },
    {
      id: "demo-job-backend",
      companyIndex: 1,
      title: "Backend Developer",
      location: "Bengaluru",
      salaryMin: 700000,
      salaryMax: 1200000,
      experienceMinYears: 2,
      experienceMaxYears: 5,
      skills: ["Node.js", "PostgreSQL", "REST API", "AWS"],
      description:
        "Develop scalable backend services, build REST APIs and work with databases and cloud infrastructure.",
    },
    {
      id: "demo-job-analyst",
      companyIndex: 2,
      title: "Data Analyst",
      location: "Mumbai",
      salaryMin: 500000,
      salaryMax: 900000,
      experienceMinYears: 1,
      experienceMaxYears: 4,
      skills: ["Python", "SQL", "Power BI", "Excel"],
      description:
        "Analyze business data, prepare dashboards and communicate useful insights to business teams.",
    },
    {
      id: "demo-job-fullstack",
      companyIndex: 0,
      title: "Full Stack Developer",
      location: "Pune",
      salaryMin: 800000,
      salaryMax: 1400000,
      experienceMinYears: 2,
      experienceMaxYears: 5,
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
      description:
        "Build end-to-end web applications and collaborate with product and design teams.",
    },
    {
      id: "demo-job-uiux",
      companyIndex: 1,
      title: "UI/UX Designer",
      location: "Remote",
      salaryMin: 500000,
      salaryMax: 850000,
      experienceMinYears: 1,
      experienceMaxYears: 3,
      skills: ["Figma", "Wireframing", "Prototyping", "UI Design"],
      description:
        "Design intuitive interfaces, create prototypes and improve product experiences through user research.",
    },
  ];

  for (const job of jobs) {
    await prisma.job.upsert({
      where: { id: job.id },
      create: {
        id: job.id,
        companyId: companyRecords[job.companyIndex].id,
        createdByUserId: "demo-company-owner",
        title: job.title,
        description: job.description,
        location: job.location,
        workMode: job.location === "Remote" ? "REMOTE" : "HYBRID",
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        experienceMinYears: job.experienceMinYears,
        experienceMaxYears: job.experienceMaxYears,
        employmentType: "FULL_TIME",
        industry: "Technology",
        skills: job.skills,
        status: "PUBLISHED",
        postedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isDemo: true,
        demoLabel: "DEMO DATA · NOT A REAL JOB",
      },
      update: {},
    });
  }
