// @polsia:user-owned
import { z } from 'zod';

export const workModeSchema = z.enum(['REMOTE', 'HYBRID', 'ONSITE']);
export const employmentTypeSchema = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']);
export const applicationStatusSchema = z.enum([
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
]);

const stringList = z.array(z.string().trim().min(1).max(64)).max(30);

export const profileInputSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  headline: z.string().trim().max(120).default(''),
  city: z.string().trim().max(80).default(''),
  skills: stringList,
  experienceYears: z.number().min(0).max(60).nullable(),
  education: z.string().trim().min(2).max(500),
  expectedCtc: z.number().int().min(0).max(100_000_000).nullable(),
  noticePeriodDays: z.number().int().min(0).max(365).nullable(),
  preferredLocations: stringList,
  workMode: workModeSchema.nullable(),
  isOpenToWork: z.boolean(),
  isDiscoverable: z.boolean(),
});

export const companyInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(3000),
  website: z.string().trim().url().or(z.literal('')),
  industry: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
});

export const jobInputSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(80).max(12000),
  location: z.string().trim().min(2).max(120),
  workMode: workModeSchema,
  salaryMin: z.number().int().min(0).max(100_000_000).nullable(),
  salaryMax: z.number().int().min(0).max(100_000_000).nullable(),
  experienceMinYears: z.number().min(0).max(60),
  experienceMaxYears: z.number().min(0).max(60).nullable(),
  employmentType: employmentTypeSchema,
  industry: z.string().trim().min(2).max(100),
  skills: stringList,
  maxNoticePeriodDays: z.number().int().min(0).max(365).nullable(),
  expiresAt: z.string().datetime().nullable(),
});

export const jobSearchSchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    city: z.string().trim().max(100).optional(),
    workMode: workModeSchema.optional(),
    salaryMin: z.coerce.number().int().min(0).optional(),
    salaryMax: z.coerce.number().int().min(0).optional(),
    experience: z.coerce.number().min(0).max(60).optional(),
    employmentType: employmentTypeSchema.optional(),
    industry: z.string().trim().max(100).optional(),
    skill: z.string().trim().max(64).optional(),
    company: z.string().trim().max(120).optional(),
    noticePeriod: z.coerce.number().int().min(0).max(365).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.salaryMin !== undefined &&
      value.salaryMax !== undefined &&
      value.salaryMin > value.salaryMax
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salaryMax'],
        message: 'Maximum salary must be at least the minimum.',
      });
    }
  });

export const alertInputSchema = z.object({
  label: z.string().trim().min(2).max(80),
  criteria: jobSearchSchema,
  emailEnabled: z.boolean().default(true),
  whatsappEnabled: z.literal(false).default(false),
});

export const applicationActionSchema = z.object({
  jobId: z.string().cuid(),
});

export const applicationStatusUpdateSchema = z.object({
  applicationId: z.string().cuid(),
  status: applicationStatusSchema,
});

export const applicationCommentSchema = z.object({
  applicationId: z.string().cuid(),
  body: z.string().trim().min(2).max(2000),
  visibility: z.enum(['TEAM', 'PRIVATE_NOTE']).default('TEAM'),
});

export const outreachSchema = z.object({
  candidateUserId: z.string().min(1).max(100),
  body: z.string().trim().min(10).max(2000),
});

export const candidateSearchSchema = z.object({ query: z.string().trim().min(4).max(500) });

export const profileOutputSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  headline: z.string(),
  city: z.string(),
  skills: z.array(z.string()),
  experienceYears: z.number().nullable(),
  education: z.string(),
  expectedCtc: z.number().nullable(),
  noticePeriodDays: z.number().nullable(),
  preferredLocations: z.array(z.string()),
  workMode: workModeSchema.nullable(),
  isOpenToWork: z.boolean(),
  isDiscoverable: z.boolean(),
  resume: z.object({ id: z.string(), filename: z.string(), fileKey: z.string() }).nullable(),
  completeness: z.object({
    percentage: z.number(),
    completed: z.number(),
    total: z.number(),
    missing: z.array(z.string()),
  }),
});

export const publicJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  workMode: workModeSchema,
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  experienceMinYears: z.number(),
  experienceMaxYears: z.number().nullable(),
  employmentType: employmentTypeSchema,
  industry: z.string(),
  skills: z.array(z.string()),
  maxNoticePeriodDays: z.number().nullable(),
  postedAt: z.string().nullable(),
  company: z.object({ id: z.string(), name: z.string(), industry: z.string(), city: z.string() }),
  saved: z.boolean().optional(),
});

export const applicationOutputSchema = z.object({
  id: z.string(),
  status: applicationStatusSchema,
  appliedAt: z.string(),
  job: z.object({
    id: z.string(),
    title: z.string(),
    companyName: z.string(),
    location: z.string(),
  }),
  history: z.array(
    z.object({
      fromStatus: applicationStatusSchema.nullable(),
      toStatus: applicationStatusSchema,
      authorName: z.string(),
      createdAt: z.string(),
    }),
  ),
});

export const workspaceOutputSchema = z.object({
  user: z.object({ id: z.string(), name: z.string(), email: z.string(), role: z.string() }),
  profile: profileOutputSchema.nullable(),
  companies: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      verificationStatus: z.string(),
    }),
  ),
  counts: z.object({
    applications: z.number(),
    savedJobs: z.number(),
    alerts: z.number(),
    notifications: z.number(),
  }),
});

export const applicationListSchema = z.object({ items: z.array(applicationOutputSchema) });
export const jobListSchema = z.object({ items: z.array(publicJobSchema) });
export const alertsListSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      criteria: jobSearchSchema,
      emailEnabled: z.boolean(),
      whatsappEnabled: z.boolean(),
      active: z.boolean(),
    }),
  ),
});

export const notificationListSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      body: z.string(),
      href: z.string(),
      kind: z.string(),
      readAt: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
});
export const companyMemberListSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      userId: z.string(),
      role: z.enum(['OWNER', 'RECRUITER', 'HIRING_MANAGER']),
      createdAt: z.string(),
      user: z.object({ id: z.string(), name: z.string(), email: z.string() }).nullable(),
    }),
  ),
});
export const companyJobsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      location: z.string(),
      workMode: workModeSchema,
      salaryMin: z.number().nullable(),
      salaryMax: z.number().nullable(),
      experienceMinYears: z.number(),
      experienceMaxYears: z.number().nullable(),
      employmentType: employmentTypeSchema,
      industry: z.string(),
      skills: z.array(z.string()),
      maxNoticePeriodDays: z.number().nullable(),
      status: z.string(),
      moderationNote: z.string(),
      postedAt: z.string().nullable(),
      expiresAt: z.string().nullable(),
      applicationCount: z.number(),
    }),
  ),
});
export const companyApplicationListSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      status: applicationStatusSchema,
      appliedAt: z.string(),
      job: z.object({
        id: z.string(),
        title: z.string(),
        location: z.string(),
        companyId: z.string(),
      }),
      candidate: z.object({
        userId: z.string(),
        profile: z.record(z.string(), z.unknown()),
        resume: z.object({ id: z.string(), fileKey: z.string(), filename: z.string() }).nullable(),
      }),
      history: z.array(
        z.object({
          fromStatus: applicationStatusSchema.nullable(),
          toStatus: applicationStatusSchema,
          authorName: z.string(),
          note: z.string(),
          createdAt: z.string(),
        }),
      ),
      comments: z.array(
        z.object({
          id: z.string(),
          body: z.string(),
          visibility: z.enum(['TEAM', 'PRIVATE_NOTE']),
          authorName: z.string(),
          createdAt: z.string(),
        }),
      ),
    }),
  ),
});
export const companyProfileOutputSchema = z.object({
  company: companyInputSchema.extend({ id: z.string(), verificationStatus: z.string() }),
  role: z.enum(['OWNER', 'RECRUITER', 'HIRING_MANAGER']),
});
export const companyCandidateSearchSchema = z.object({
  criteria: z.object({
    skills: z.array(z.string()),
    city: z.string().nullable(),
    minExperienceYears: z.number().nullable(),
    maxNoticePeriodDays: z.number().nullable(),
  }),
  items: z.array(
    z.object({
      userId: z.string(),
      fullName: z.string(),
      headline: z.string(),
      city: z.string(),
      skills: z.array(z.string()),
      experienceYears: z.number().nullable(),
      education: z.string(),
      expectedCtc: z.number().nullable(),
      noticePeriodDays: z.number().nullable(),
      preferredLocations: z.array(z.string()),
      workMode: workModeSchema.nullable(),
    }),
  ),
  savedSearchId: z.string().nullable(),
});
export const savedCandidateSearchSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      query: z.string(),
      criteria: z.record(z.string(), z.unknown()),
      createdAt: z.string(),
    }),
  ),
});
export const inclusiveCheckSchema = z.object({
  issues: z.array(z.object({ phrase: z.string(), suggestion: z.string(), reason: z.string() })),
});
export const jobDescriptionSchema = z.object({ description: z.string().min(80) });
export const adminOverviewSchema = z.object({
  counts: z.object({
    users: z.number(),
    companies: z.number(),
    candidates: z.number(),
    activeJobs: z.number(),
    applications: z.number(),
    interviews: z.number(),
    hires: z.number(),
    openReports: z.number(),
  }),
  recentUsers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
      createdAt: z.string(),
    }),
  ),
  recentJobs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      companyName: z.string(),
      status: z.string(),
      isDemo: z.boolean(),
      createdAt: z.string(),
    }),
  ),
  recentApplications: z.array(
    z.object({
      id: z.string(),
      jobTitle: z.string(),
      status: applicationStatusSchema,
      appliedAt: z.string(),
    }),
  ),
  system: z.object({ api: z.string(), database: z.string() }),
});
export const adminUsersSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      emailVerified: z.boolean(),
      role: z.string(),
      banned: z.boolean(),
      banReason: z.string().nullable(),
      createdAt: z.string(),
      profile: z
        .object({
          fullName: z.string(),
          headline: z.string(),
          city: z.string(),
          skills: z.array(z.string()),
          experienceYears: z.number().nullable(),
          education: z.string(),
          expectedCtc: z.number().nullable(),
          noticePeriodDays: z.number().nullable(),
          preferredLocations: z.array(z.string()),
          workMode: workModeSchema.nullable(),
          isOpenToWork: z.boolean(),
          isDiscoverable: z.boolean(),
          resume: z.object({ fileKey: z.string(), filename: z.string() }).nullable(),
        })
        .nullable(),
      companies: z.array(z.object({ name: z.string(), role: z.string() })),
    }),
  ),
});
export const adminCompaniesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      website: z.string(),
      industry: z.string(),
      city: z.string(),
      verificationStatus: z.string(),
      suspended: z.boolean(),
      isDemo: z.boolean(),
      demoLabel: z.string().nullable(),
      members: z.number(),
      jobs: z.number(),
      createdAt: z.string(),
    }),
  ),
});
export const adminJobsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      location: z.string(),
      workMode: workModeSchema,
      industry: z.string(),
      status: z.string(),
      moderationNote: z.string(),
      isDemo: z.boolean(),
      demoLabel: z.string().nullable(),
      expiresAt: z.string().nullable(),
      postedAt: z.string().nullable(),
      company: z.object({ id: z.string(), name: z.string(), suspended: z.boolean() }),
      applications: z.number(),
      openReports: z.number(),
    }),
  ),
});
export const adminApplicationsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      status: applicationStatusSchema,
      seekerUserId: z.string(),
      profile: z.record(z.string(), z.unknown()),
      isDemo: z.boolean(),
      demoLabel: z.string().nullable(),
      appliedAt: z.string(),
      job: z.object({ id: z.string(), title: z.string(), companyName: z.string() }),
      history: z.array(
        z.object({
          fromStatus: applicationStatusSchema.nullable(),
          toStatus: applicationStatusSchema,
          authorName: z.string(),
          createdAt: z.string(),
        }),
      ),
    }),
  ),
});
export const adminReportsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      reason: z.string(),
      status: z.string(),
      isDemo: z.boolean(),
      createdAt: z.string(),
      reporterId: z.string(),
      job: z.object({
        id: z.string(),
        title: z.string(),
        status: z.string(),
        company: z.object({ name: z.string() }),
      }),
    }),
  ),
});

export type NotificationItem = z.infer<typeof notificationListSchema>['items'][number];

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type JobInput = z.infer<typeof jobInputSchema>;
export type JobSearch = z.infer<typeof jobSearchSchema>;
export type PublicJob = z.infer<typeof publicJobSchema>;
