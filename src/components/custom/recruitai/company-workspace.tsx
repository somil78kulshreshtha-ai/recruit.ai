// @polsia:user-owned
'use client';

import { ArrowRight, Building2, Check, CircleAlert, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/i18n/client-locale';
import { apiFetch } from '@/lib/api-client';
import {
  companyApplicationListSchema,
  companyCandidateSearchSchema,
  companyJobsSchema,
  companyMemberListSchema,
  companyProfileOutputSchema,
  inclusiveCheckSchema,
  type JobInput,
  jobDescriptionSchema,
  savedCandidateSearchSchema,
  workspaceOutputSchema,
} from '@/lib/contracts/recruitai';
import { fileUrl } from '@/modules/file-upload/client';

type Companies = ReturnType<typeof workspaceOutputSchema.parse>['companies'];

function useCompanies() {
  const [companies, setCompanies] = useState<Companies>([]);
  const [companyId, setCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    void apiFetch('/api/workspace', { schema: workspaceOutputSchema })
      .then((data) => {
        setCompanies(data.companies);
        setCompanyId(data.companies[0]?.id ?? '');
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);
  return { companies, companyId, setCompanyId, loading, error };
}

function CompanyPicker({
  companies,
  companyId,
  onChange,
}: {
  companies: Companies;
  companyId: string;
  onChange: (id: string) => void;
}) {
  const { t } = useLocale();
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground sm:min-w-64">
      {t('company')}
      <select
        aria-label={t('company')}
        value={companyId}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function NoCompany({ loading, error }: { loading: boolean; error: boolean }) {
  const { t } = useLocale();
  if (loading) return <output className="block h-36 animate-pulse rounded-2xl bg-muted" />;
  return (
    <section className="rounded-2xl border border-border bg-card p-7">
      {error ? (
        <>
          <h1 className="text-xl font-semibold">{t('companyLoadErrorTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('companyLoadErrorIntro')}</p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold">{t('noCompanyTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('noCompanyIntro')}</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/setup?kind=company">{t('setupCompany')}</Link>
          </Button>
        </>
      )}
    </section>
  );
}

export function CompanyWorkspace() {
  const { t } = useLocale();
  const state = useCompanies();
  const [company, setCompany] = useState<
    ReturnType<typeof companyProfileOutputSchema.parse>['company'] | null
  >(null);
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!state.companyId) return;
    try {
      const data = await apiFetch(
        `/api/company/profile?companyId=${encodeURIComponent(state.companyId)}`,
        { schema: companyProfileOutputSchema },
      );
      setCompany(data.company);
      setRole(data.role);
      setError('');
    } catch {
      setError('Company details could not be loaded.');
    }
  }, [state.companyId]);
  useEffect(() => {
    void load();
  }, [load]);
  if (state.loading || !state.companies.length)
    return <NoCompany loading={state.loading} error={state.error} />;

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t('company')}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{t('companyWorkspaceTitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t('companyWorkspaceIntro')}
          </p>
        </div>
        <CompanyPicker
          companies={state.companies}
          companyId={state.companyId}
          onChange={state.setCompanyId}
        />
      </header>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {company ? (
        <section className="grid gap-5 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_auto] sm:items-start sm:p-7">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">{company.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {company.industry} · {company.city} · {role.replaceAll('_', ' ')}
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {company.description}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {t('verification')}: {company.verificationStatus.toLocaleLowerCase()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/dashboard/company/jobs">{t('manageJobs')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/company/applications">{t('reviewApplicants')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/company/candidates">{t('searchCandidates')}</Link>
            </Button>
          </div>
        </section>
      ) : null}
      {company ? (
        <CompanyProfileEditor
          companyId={state.companyId}
          company={company}
          onSaved={load}
          role={role}
        />
      ) : null}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompanyAction
          href="/dashboard/company/jobs"
          icon={<FileText className="size-5" />}
          title={t('jobsAndModeration')}
          text="Save drafts, submit roles for review and expire listings."
        />
        <CompanyAction
          href="/dashboard/company/applications"
          icon={<Users className="size-5" />}
          title={t('applicationPipeline')}
          text="Review submitted profiles and move applicants through the hiring stages."
        />
        <CompanyAction
          href="/dashboard/company/candidates"
          icon={<Check className="size-5" />}
          title={t('optInCandidateSearch')}
          text="Search only candidates who chose to be discoverable."
        />
        <CompanyAction
          href="/dashboard/company/team"
          icon={<Users className="size-5" />}
          title={t('companyTeam')}
          text="Add existing RecruitAI accounts and manage company access."
        />
      </section>
    </div>
  );
}

function CompanyProfileEditor({
  companyId,
  company,
  onSaved,
  role,
}: {
  companyId: string;
  company: ReturnType<typeof companyProfileOutputSchema.parse>['company'];
  onSaved: () => Promise<void>;
  role: string;
}) {
  const [form, setForm] = useState({
    name: company.name,
    description: company.description,
    website: company.website,
    industry: company.industry,
    city: company.city,
  });
  const [pending, setPending] = useState(false);
  useEffect(
    () =>
      setForm({
        name: company.name,
        description: company.description,
        website: company.website,
        industry: company.industry,
        city: company.city,
      }),
    [company],
  );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      await apiFetch('/api/company/profile', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'update', companyId, company: form }),
      });
      toast.success('Company profile saved');
      await onSaved();
    } catch {
      toast.error('Company profile was not saved. Check the fields and your role.');
    } finally {
      setPending(false);
    }
  }
  async function verify() {
    try {
      await apiFetch('/api/company/profile', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'request_verification', companyId }),
      });
      toast.success('Verification request submitted for admin review');
      await onSaved();
    } catch {
      toast.error('Verification request could not be submitted.');
    }
  }
  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Company profile</h2>
          <p className="text-sm text-muted-foreground">
            Owners and hiring managers can update this profile.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={company.verificationStatus === 'VERIFIED' || role === 'RECRUITER'}
          onClick={() => void verify()}
        >
          <CircleAlert className="mr-2 size-4" />
          {company.verificationStatus === 'VERIFIED' ? 'Verified' : 'Request verification'}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1 text-sm">
          <Label htmlFor="company-name">Company name</Label>
          <Input
            id="company-name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            disabled={role === 'RECRUITER'}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <Label htmlFor="company-industry">Industry</Label>
          <Input
            id="company-industry"
            value={form.industry}
            onChange={(event) => setForm({ ...form, industry: event.target.value })}
            disabled={role === 'RECRUITER'}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <Label htmlFor="company-city">City</Label>
          <Input
            id="company-city"
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
            disabled={role === 'RECRUITER'}
          />
        </div>
        <div className="grid gap-1 text-sm">
          <Label htmlFor="company-website">Website</Label>
          <Input
            id="company-website"
            type="url"
            value={form.website}
            onChange={(event) => setForm({ ...form, website: event.target.value })}
            disabled={role === 'RECRUITER'}
          />
        </div>
        <div className="grid gap-1 text-sm sm:col-span-2">
          <Label htmlFor="company-description">Description</Label>
          <Textarea
            id="company-description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            disabled={role === 'RECRUITER'}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending || role === 'RECRUITER'}>
        {pending ? 'Saving…' : 'Save company profile'}
      </Button>
    </form>
  );
}

function CompanyAction({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="mt-4 flex items-center gap-2 font-semibold">
        {title}
        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </Link>
  );
}

const blankJob: JobInput = {
  title: '',
  description: '',
  location: '',
  workMode: 'HYBRID',
  salaryMin: null,
  salaryMax: null,
  experienceMinYears: 0,
  experienceMaxYears: null,
  employmentType: 'FULL_TIME',
  industry: '',
  skills: [],
  maxNoticePeriodDays: null,
  expiresAt: null,
};

export function CompanyJobs() {
  const state = useCompanies();
  const [items, setItems] = useState<ReturnType<typeof companyJobsSchema.parse>['items']>([]);
  const [job, setJob] = useState<JobInput>(blankJob);
  const [jobId, setJobId] = useState<string | undefined>();
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [inclusiveIssues, setInclusiveIssues] = useState<
    ReturnType<typeof inclusiveCheckSchema.parse>['issues']
  >([]);
  const load = useCallback(async () => {
    if (!state.companyId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(
        `/api/company/jobs?companyId=${encodeURIComponent(state.companyId)}`,
        { schema: companyJobsSchema },
      );
      setItems(data.items);
    } catch {
      setError('Company jobs could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [state.companyId]);
  useEffect(() => {
    void load();
  }, [load]);

  function edit(item: (typeof items)[number]) {
    setJobId(item.id);
    setJob({
      title: item.title,
      description: item.description,
      location: item.location,
      workMode: item.workMode,
      salaryMin: item.salaryMin,
      salaryMax: item.salaryMax,
      experienceMinYears: item.experienceMinYears,
      experienceMaxYears: item.experienceMaxYears,
      employmentType: item.employmentType,
      industry: item.industry,
      skills: item.skills,
      maxNoticePeriodDays: item.maxNoticePeriodDays,
      expiresAt: item.expiresAt,
    });
    setSkills(item.skills.join(', '));
  }
  async function save(action: 'save_draft' | 'publish') {
    if (!state.companyId) return;
    setPending(true);
    const input = {
      ...job,
      id: jobId,
      skills: skills
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      expiresAt: job.expiresAt ? new Date(job.expiresAt).toISOString() : null,
    };
    try {
      await apiFetch('/api/company/jobs', {
        method: 'POST',
        body: JSON.stringify({ action, companyId: state.companyId, job: input }),
      });
      toast.success(action === 'publish' ? 'Job submitted for admin approval' : 'Draft saved');
      setJob(blankJob);
      setJobId(undefined);
      setSkills('');
      setInclusiveIssues([]);
      await load();
    } catch {
      toast.error(
        action === 'publish'
          ? 'Job could not be submitted. Check all required fields.'
          : 'Draft could not be saved. Check all required fields.',
      );
    } finally {
      setPending(false);
    }
  }
  async function generateDescription() {
    try {
      const result = await apiFetch('/api/ai/job-description', {
        method: 'POST',
        body: JSON.stringify({
          companyId: state.companyId,
          title: job.title,
          skills: skills
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          experienceMinYears: job.experienceMinYears,
          experienceMaxYears: job.experienceMaxYears,
          location: job.location,
          workMode: job.workMode,
          employmentType: job.employmentType,
          industry: job.industry,
        }),
        schema: jobDescriptionSchema,
      });
      setJob((current) => ({ ...current, description: result.description }));
      toast.success('Editable draft generated');
    } catch {
      toast.error('AI description is unavailable. Your current text is unchanged.');
    }
  }
  async function checkInclusive() {
    try {
      const result = await apiFetch('/api/ai/inclusive-check', {
        method: 'POST',
        body: JSON.stringify({ companyId: state.companyId, description: job.description }),
        schema: inclusiveCheckSchema,
      });
      setInclusiveIssues(result.issues);
      toast.success(
        result.issues.length
          ? 'Language suggestions are ready for your review'
          : 'No specific language concerns found',
      );
    } catch {
      toast.error('Language check is unavailable. Your job draft is unchanged.');
    }
  }
  async function expire(jobId: string) {
    if (!window.confirm('Expire this job listing? It will stop accepting applications.')) return;
    try {
      await apiFetch('/api/company/jobs', {
        method: 'POST',
        body: JSON.stringify({ action: 'expire', companyId: state.companyId, jobId }),
      });
      toast.success('Job expired');
      await load();
    } catch {
      toast.error('Could not expire this job.');
    }
  }
  if (state.loading || !state.companies.length)
    return <NoCompany loading={state.loading} error={state.error} />;
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Company workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Jobs and listings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A submission enters admin review as Pending. Only approved, open jobs appear in
            candidate search.
          </p>
        </div>
        <CompanyPicker
          companies={state.companies}
          companyId={state.companyId}
          onChange={state.setCompanyId}
        />
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save('save_draft');
        }}
        className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{jobId ? 'Edit job' : 'Create a job'}</h2>
            <p className="text-sm text-muted-foreground">
              AI can draft copy and flag language for you to review. It does not rank candidates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void generateDescription()}>
              Generate description
            </Button>
            <Button type="button" variant="outline" onClick={() => void checkInclusive()}>
              Check inclusive language
            </Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-title">Job title</Label>
            <Input
              id="job-title"
              value={job.title}
              onChange={(event) => setJob({ ...job, title: event.target.value })}
              minLength={3}
              required
            />
          </div>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-location">Location</Label>
            <Input
              id="job-location"
              value={job.location}
              onChange={(event) => setJob({ ...job, location: event.target.value })}
              required
            />
          </div>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-mode">Work mode</Label>
            <select
              id="job-mode"
              value={job.workMode}
              onChange={(event) =>
                setJob({ ...job, workMode: event.target.value as JobInput['workMode'] })
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
            </select>
          </div>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-type">Employment type</Label>
            <select
              id="job-type"
              value={job.employmentType}
              onChange={(event) =>
                setJob({ ...job, employmentType: event.target.value as JobInput['employmentType'] })
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="FULL_TIME">Full time</option>
              <option value="PART_TIME">Part time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-industry">Industry</Label>
            <Input
              id="job-industry"
              value={job.industry}
              onChange={(event) => setJob({ ...job, industry: event.target.value })}
              required
            />
          </div>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-skills">Required skills</Label>
            <Input
              id="job-skills"
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              placeholder="React, TypeScript"
            />
          </div>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-salary-min">Salary minimum (₹ / year)</Label>
            <Input
              id="job-salary-min"
              type="number"
              min="0"
              value={job.salaryMin ?? ''}
              onChange={(event) =>
                setJob({
                  ...job,
                  salaryMin: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </div>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-salary-max">Salary maximum (₹ / year)</Label>
            <Input
              id="job-salary-max"
              type="number"
              min="0"
              value={job.salaryMax ?? ''}
              onChange={(event) =>
                setJob({
                  ...job,
                  salaryMax: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </div>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-exp-min">Minimum experience</Label>
            <Input
              id="job-exp-min"
              type="number"
              min="0"
              value={job.experienceMinYears}
              onChange={(event) =>
                setJob({ ...job, experienceMinYears: Number(event.target.value) })
              }
            />
          </div>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-exp-max">Maximum experience</Label>
            <Input
              id="job-exp-max"
              type="number"
              min="0"
              value={job.experienceMaxYears ?? ''}
              onChange={(event) =>
                setJob({
                  ...job,
                  experienceMaxYears: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </div>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-notice">Maximum notice period (days)</Label>
            <Input
              id="job-notice"
              type="number"
              min="0"
              value={job.maxNoticePeriodDays ?? ''}
              onChange={(event) =>
                setJob({
                  ...job,
                  maxNoticePeriodDays: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </div>
          <div className="grid gap-1 text-sm">
            <Label htmlFor="job-expiry">Expiry date (optional)</Label>
            <Input
              id="job-expiry"
              type="date"
              value={job.expiresAt?.slice(0, 10) ?? ''}
              onChange={(event) =>
                setJob({
                  ...job,
                  expiresAt: event.target.value
                    ? new Date(`${event.target.value}T23:59:59.000Z`).toISOString()
                    : null,
                })
              }
            />
          </div>
          <div className="grid gap-1 text-sm sm:col-span-2">
            <Label htmlFor="job-description">Description (at least 80 characters)</Label>
            <Textarea
              id="job-description"
              rows={8}
              value={job.description}
              onChange={(event) => setJob({ ...job, description: event.target.value })}
              required
              minLength={80}
            />
          </div>
        </div>
        {inclusiveIssues.length ? (
          <section className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
            <h3 className="font-semibold">Review these suggestions</h3>
            <ul className="mt-2 grid gap-2">
              {inclusiveIssues.map((issue) => (
                <li key={`${issue.phrase}-${issue.suggestion}`} className="text-sm">
                  <strong>{issue.phrase}</strong> → {issue.suggestion}
                  <p className="text-xs text-muted-foreground">{issue.reason}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? 'Saving…' : 'Save draft'}
          </Button>
          <Button type="button" disabled={pending} onClick={() => void save('publish')}>
            {pending ? 'Submitting…' : 'Submit for approval'}
          </Button>
          {jobId ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setJob(blankJob);
                setJobId(undefined);
                setSkills('');
              }}
            >
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>
      {loading ? (
        <output className="text-sm text-muted-foreground">Loading company jobs…</output>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <section className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          No jobs yet. Save a draft or submit your first role for review.
        </section>
      ) : null}
      <div className="grid gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <h2 className="truncate font-semibold">{item.title}</h2>
              <p className="text-sm text-muted-foreground">
                {item.location} · {item.workMode.toLocaleLowerCase()} · {item.applicationCount}{' '}
                applicants
              </p>
              <span className="mt-2 inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                {item.status.replaceAll('_', ' ')}
              </span>
              {item.moderationNote ? (
                <p className="mt-1 text-xs text-amber-700">{item.moderationNote}</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => edit(item)}>
                Edit
              </Button>
              {['PUBLISHED', 'PENDING'].includes(item.status) ? (
                <Button type="button" variant="outline" onClick={() => void expire(item.id)}>
                  Expire
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const nextStages: Record<string, string[]> = {
  APPLIED: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['OFFER', 'REJECTED'],
  OFFER: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
};
const stages = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'] as const;

export function CompanyApplications() {
  const state = useCompanies();
  const { t } = useLocale();
  const stageLabels: Record<(typeof stages)[number], string> = {
    APPLIED: t('stageApplied'),
    SHORTLISTED: t('stageShortlisted'),
    INTERVIEW: t('stageInterview'),
    OFFER: t('stageOffer'),
    HIRED: t('stageHired'),
    REJECTED: t('stageRejected'),
  };
  const [items, setItems] = useState<
    ReturnType<typeof companyApplicationListSchema.parse>['items']
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<Record<string, 'TEAM' | 'PRIVATE_NOTE'>>({});
  const load = useCallback(async () => {
    if (!state.companyId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(
        `/api/company/applications?companyId=${encodeURIComponent(state.companyId)}`,
        { schema: companyApplicationListSchema },
      );
      setItems(data.items);
    } catch {
      setError('Applications are unavailable for this company or could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [state.companyId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function advance(applicationId: string, status: string) {
    try {
      const result = await apiFetch<{ id: string; status: string; emailDelivered: boolean }>(
        '/api/company/applications',
        { method: 'PATCH', body: JSON.stringify({ applicationId, status }) },
      );
      toast[result.emailDelivered ? 'success' : 'error'](
        result.emailDelivered
          ? `Moved to ${status.toLocaleLowerCase()}`
          : 'Stage saved, but email notification could not be delivered.',
      );
      await load();
    } catch {
      toast.error('That stage change is invalid or was not saved.');
    }
  }
  async function addComment(applicationId: string) {
    const body = comment[applicationId]?.trim();
    if (!body) return;
    try {
      await apiFetch('/api/company/applications', {
        method: 'POST',
        body: JSON.stringify({
          applicationId,
          body,
          visibility: visibility[applicationId] ?? 'TEAM',
        }),
      });
      toast.success('Team note saved');
      setComment((current) => ({ ...current, [applicationId]: '' }));
      await load();
    } catch {
      toast.error('Comment could not be saved.');
    }
  }
  if (state.loading || !state.companies.length)
    return <NoCompany loading={state.loading} error={state.error} />;
  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t('company')}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{t('applicationPipeline')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('applicationPipelineIntro')}</p>
        </div>
        <CompanyPicker
          companies={state.companies}
          companyId={state.companyId}
          onChange={state.setCompanyId}
        />
      </header>
      {loading ? <output className="block h-48 animate-pulse rounded-2xl bg-muted" /> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-semibold">{t('noApplicationsCompany')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('approvedJobsCollect')}</p>
        </section>
      ) : null}
      {!loading && !error ? (
        <div className="overflow-x-auto pb-3">
          <div className="grid min-w-[1560px] grid-cols-6 gap-3">
            {stages.map((stage) => {
              const bucket = items.filter((item) => item.status === stage);
              return (
                <section key={stage} className="min-h-48 rounded-2xl bg-muted/70 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">{stageLabels[stage]}</h2>
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                      {bucket.length}
                    </span>
                  </div>
                  <div className="grid content-start gap-3">
                    {bucket.map((item) => (
                      <article
                        key={item.id}
                        className="grid gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
                      >
                        <div>
                          <h3 className="text-sm font-semibold">
                            {String(item.candidate.profile.fullName ?? 'Candidate')}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.job.title} · {String(item.candidate.profile.city ?? '')}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {Array.isArray(item.candidate.profile.skills)
                              ? (item.candidate.profile.skills as string[]).join(', ')
                              : ''}{' '}
                            · {String(item.candidate.profile.experienceYears ?? '—')} years
                          </p>
                        </div>
                        {item.candidate.resume ? (
                          <a
                            className="text-xs font-medium text-primary underline underline-offset-4"
                            href={fileUrl(item.candidate.resume.fileKey, {
                              download: true,
                              filename: item.candidate.resume.filename,
                            })}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t('openPrivateResume')} · {item.candidate.resume.filename}
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No resume on this application
                          </p>
                        )}
                        {(nextStages[item.status] ?? []).length ? (
                          <label className="grid gap-1 text-xs text-muted-foreground">
                            {t('moveTo')}
                            <select
                              aria-label={`Move ${String(item.candidate.profile.fullName ?? 'candidate')} to a stage`}
                              value=""
                              onChange={(event) => {
                                if (event.target.value) void advance(item.id, event.target.value);
                              }}
                              className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                            >
                              <option value="">{t('chooseStage')}</option>
                              {(nextStages[item.status] ?? []).map((value) => (
                                <option key={value} value={value}>
                                  {stageLabels[value as (typeof stages)[number]]}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                        <details className="rounded-lg border border-border p-2">
                          <summary className="cursor-pointer text-xs font-medium">
                            {t('historyAndTeamNotes')}
                          </summary>
                          <ol className="mt-2 grid gap-2">
                            {item.history.map((event) => (
                              <li key={`${event.toStatus}-${event.createdAt}`} className="text-xs">
                                <strong>{stageLabels[event.toStatus]}</strong> · {event.authorName}
                                <p className="text-muted-foreground">
                                  {new Intl.DateTimeFormat('en-IN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  }).format(new Date(event.createdAt))}
                                </p>
                              </li>
                            ))}
                          </ol>
                          <ul className="mt-2 grid gap-2">
                            {item.comments.map((entry) => (
                              <li key={entry.id} className="rounded-md bg-muted p-2 text-xs">
                                <span className="font-medium">
                                  {entry.visibility === 'PRIVATE_NOTE'
                                    ? t('recruiterNote')
                                    : t('teamComment')}
                                </span>
                                <p className="mt-1">{entry.body}</p>
                                <p className="mt-1 text-muted-foreground">
                                  {entry.authorName} ·{' '}
                                  {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
                                    new Date(entry.createdAt),
                                  )}
                                </p>
                              </li>
                            ))}
                          </ul>
                          <Textarea
                            aria-label="Add a team comment or private note"
                            className="mt-2 min-h-16 text-xs"
                            value={comment[item.id] ?? ''}
                            onChange={(event) =>
                              setComment((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }
                            placeholder="Add an internal note"
                          />
                          <select
                            aria-label="Comment visibility"
                            value={visibility[item.id] ?? 'TEAM'}
                            onChange={(event) =>
                              setVisibility((current) => ({
                                ...current,
                                [item.id]: event.target.value as 'TEAM' | 'PRIVATE_NOTE',
                              }))
                            }
                            className="mt-2 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="TEAM">{t('teamComment')}</option>
                            <option value="PRIVATE_NOTE">{t('recruiterNote')}</option>
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full"
                            onClick={() => void addComment(item.id)}
                          >
                            {t('addNote')}
                          </Button>
                        </details>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CompanyTeam() {
  const state = useCompanies();
  const [members, setMembers] = useState<ReturnType<typeof companyMemberListSchema.parse>['items']>(
    [],
  );
  const [email, setEmail] = useState('');
  const [teamRole, setTeamRole] = useState<'RECRUITER' | 'HIRING_MANAGER'>('RECRUITER');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!state.companyId) return;
    try {
      const data = await apiFetch(
        `/api/company/members?companyId=${encodeURIComponent(state.companyId)}`,
        { schema: companyMemberListSchema },
      );
      setMembers(data.items);
      setError('');
    } catch {
      setError('Team access could not be loaded.');
    }
  }, [state.companyId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await apiFetch('/api/company/members', {
        method: 'POST',
        body: JSON.stringify({ companyId: state.companyId, email, role: teamRole }),
      });
      toast.success('Existing account added to the team');
      setEmail('');
      await load();
    } catch {
      toast.error('Could not add this account. It must exist and you must be a company owner.');
    }
  }
  async function remove(membershipId: string) {
    if (!window.confirm('Remove this person from the company workspace?')) return;
    try {
      await apiFetch('/api/company/members', {
        method: 'DELETE',
        body: JSON.stringify({ companyId: state.companyId, membershipId }),
      });
      toast.success('Team member removed');
      await load();
    } catch {
      toast.error('Could not remove this team member.');
    }
  }
  if (state.loading || !state.companies.length)
    return <NoCompany loading={state.loading} error={state.error} />;
  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Company team</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add an existing RecruitAI account. No invitation or account is fabricated.
          </p>
        </div>
        <CompanyPicker
          companies={state.companies}
          companyId={state.companyId}
          onChange={state.setCompanyId}
        />
      </header>
      <form
        onSubmit={invite}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_auto_auto]"
      >
        <div className="grid gap-1 text-sm">
          <Label htmlFor="member-email">Existing account email</Label>
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-1 text-sm">
          <Label htmlFor="member-role">Team role</Label>
          <select
            id="member-role"
            value={teamRole}
            onChange={(event) => setTeamRole(event.target.value as 'RECRUITER' | 'HIRING_MANAGER')}
            className="h-10 rounded-md border border-input bg-background px-3"
          >
            <option value="RECRUITER">Recruiter</option>
            <option value="HIRING_MANAGER">Hiring manager</option>
          </select>
        </div>
        <Button type="submit" className="self-end">
          Add to team
        </Button>
      </form>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <section className="grid gap-3">
        {members.map((member) => (
          <article
            key={member.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div>
              <p className="font-medium">
                {member.user?.name ?? 'Account'}
                {member.role === 'OWNER' ? ' · Owner' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                {member.user?.email ?? 'Account unavailable'} · {member.role.replaceAll('_', ' ')}
              </p>
            </div>
            {member.role !== 'OWNER' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void remove(member.id)}
              >
                Remove access
              </Button>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}

export function CompanyCandidates() {
  const state = useCompanies();
  const [query, setQuery] = useState(
    'React developers in Pune, 3+ years, notice period under 30 days',
  );
  const [saveSearch, setSaveSearch] = useState(true);
  const [items, setItems] = useState<
    ReturnType<typeof companyCandidateSearchSchema.parse>['items']
  >([]);
  const [searches, setSearches] = useState<
    ReturnType<typeof savedCandidateSearchSchema.parse>['items']
  >([]);
  const [outreach, setOutreach] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const loadSearches = useCallback(async () => {
    if (!state.companyId) return;
    try {
      const data = await apiFetch(
        `/api/company/candidates?companyId=${encodeURIComponent(state.companyId)}`,
        { schema: savedCandidateSearchSchema },
      );
      setSearches(data.items);
    } catch {
      setSearches([]);
    }
  }, [state.companyId]);
  useEffect(() => {
    void loadSearches();
  }, [loadSearches]);
  async function search(event?: React.FormEvent<HTMLFormElement>, selectedQuery = query) {
    event?.preventDefault();
    setPending(true);
    setError('');
    try {
      const data = await apiFetch('/api/company/candidates', {
        method: 'POST',
        body: JSON.stringify({
          companyId: state.companyId,
          query: selectedQuery,
          save: saveSearch,
        }),
        schema: companyCandidateSearchSchema,
      });
      setItems(data.items);
      if (data.savedSearchId) await loadSearches();
    } catch {
      setError(
        'Natural-language search could not complete. No candidates were ranked. Try again later.',
      );
    } finally {
      setPending(false);
    }
  }
  async function sendOutreach(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await apiFetch<{ id: string; emailDelivered: boolean }>(
        '/api/company/outreach',
        {
          method: 'POST',
          body: JSON.stringify({
            companyId: state.companyId,
            candidateUserId: selectedCandidate,
            body: outreach,
          }),
        },
      );
      toast[result.emailDelivered ? 'success' : 'error'](
        result.emailDelivered
          ? 'Message sent to the opted-in candidate'
          : 'Message saved, but email could not be delivered.',
      );
      setOutreach('');
      setSelectedCandidate('');
    } catch {
      toast.error(
        'Outreach was not sent. Candidate consent and company access are checked on the server.',
      );
    }
  }
  if (state.loading || !state.companies.length)
    return <NoCompany loading={state.loading} error={state.error} />;
  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Company workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Opt-in candidate search</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Describe the criteria in natural language. Results are filtered by explicit skills,
            location, experience and notice period; no scores or automated rankings are created.
          </p>
        </div>
        <CompanyPicker
          companies={state.companies}
          companyId={state.companyId}
          onChange={state.setCompanyId}
        />
      </header>
      <form
        onSubmit={(event) => void search(event)}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6"
      >
        <Label htmlFor="candidate-query">Candidate criteria</Label>
        <Textarea
          id="candidate-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={3}
          minLength={4}
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={saveSearch}
            onChange={(event) => setSaveSearch(event.target.checked)}
            className="accent-primary"
          />
          Save this search
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? 'Searching…' : 'Search opted-in profiles'}
        </Button>
      </form>
      {searches.length ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Saved searches</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {searches.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery(item.query);
                  void search(undefined, item.query);
                }}
              >
                {item.query}
              </Button>
            ))}
          </div>
        </section>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800"
        >
          {error}
        </p>
      ) : null}
      {items.length === 0 && !pending && !error ? (
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          No results displayed yet. Candidate search uses the configured AI module to extract
          explicit filters.
        </p>
      ) : null}
      <div className="grid gap-3">
        {items.map((candidate) => (
          <article
            key={candidate.userId}
            className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div>
              <h2 className="font-semibold">{candidate.fullName}</h2>
              <p className="text-sm text-muted-foreground">
                {candidate.headline} · {candidate.city || candidate.preferredLocations.join(', ')}
              </p>
              <p className="mt-2 text-sm">
                {candidate.skills.join(' · ')} · {candidate.experienceYears ?? '—'} years · notice{' '}
                {candidate.noticePeriodDays ?? '—'} days
              </p>
            </div>
            <Button type="button" onClick={() => setSelectedCandidate(candidate.userId)}>
              Send outreach
            </Button>
          </article>
        ))}
      </div>
      {selectedCandidate ? (
        <form
          onSubmit={sendOutreach}
          className="grid gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5"
        >
          <div>
            <h2 className="font-semibold">Message an opted-in candidate</h2>
            <p className="text-xs text-muted-foreground">
              This message is available only because the profile opted in to discovery. Email
              failure is shown after save.
            </p>
          </div>
          <Textarea
            value={outreach}
            onChange={(event) => setOutreach(event.target.value)}
            minLength={10}
            maxLength={2000}
            required
            placeholder="Introduce your company and role."
          />
          <div className="flex gap-2">
            <Button type="submit">Send message</Button>
            <Button type="button" variant="outline" onClick={() => setSelectedCandidate('')}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
