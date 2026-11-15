// @polsia:user-owned
'use client';

import { Bookmark, BriefcaseBusiness, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api-client';
import { useSession } from '@/lib/auth-client';
import { jobListSchema, type PublicJob } from '@/lib/contracts/recruitai';

const modes = ['', 'REMOTE', 'HYBRID', 'ONSITE'] as const;
const types = ['', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] as const;

function money(value: number | null) {
  return value === null
    ? 'Not listed'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value);
}

export function JobsSearch() {
  const router = useRouter();
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [filters, setFilters] = useState({
    q: '',
    city: '',
    workMode: '',
    salaryMin: '',
    salaryMax: '',
    experience: '',
    employmentType: '',
    industry: '',
    skill: '',
    company: '',
    noticePeriod: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
    });
    try {
      const result = await apiFetch(`/api/jobs?${params.toString()}`, { schema: jobListSchema });
      setJobs(result.items);
    } catch {
      setError('Open roles could not be loaded. Try again shortly.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  async function toggleSaved(job: PublicJob) {
    if (!session?.user) {
      router.push('/login?next=/jobs');
      return;
    }
    try {
      await apiFetch('/api/saved-jobs', {
        method: job.saved ? 'DELETE' : 'POST',
        body: JSON.stringify({ jobId: job.id }),
      });
      setJobs((current) =>
        current.map((item) => (item.id === job.id ? { ...item, saved: !job.saved } : item)),
      );
      toast.success(job.saved ? 'Removed from saved jobs' : 'Job saved');
    } catch {
      toast.error('Could not update saved jobs. Please try again.');
    }
  }

  async function apply(job: PublicJob) {
    if (!session?.user) {
      router.push(`/login?next=${encodeURIComponent('/jobs')}`);
      return;
    }
    try {
      const result = await apiFetch<{ id: string; existing: boolean; emailDelivered?: boolean }>(
        '/api/applications',
        { method: 'POST', body: JSON.stringify({ jobId: job.id }) },
      );
      if (result.existing) toast('You have already applied. Your tracker is up to date.');
      else if (result.emailDelivered === false)
        toast('Application saved. Email delivery failed; check your in-app notifications.');
      else toast.success('Application sent. You can follow its stages in your tracker.');
      router.push('/dashboard/applications');
    } catch (failure) {
      const cause = failure instanceof Error ? failure.cause : null;
      const message =
        cause &&
        typeof cause === 'object' &&
        'message' in cause &&
        typeof cause.message === 'string'
          ? cause.message
          : 'Complete your profile and upload a PDF resume before applying.';
      toast.error(message);
      if (message.includes('profile') || message.includes('resume'))
        router.push('/dashboard/profile');
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Open roles</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Find work that fits.</h1>
        <p className="max-w-2xl text-muted-foreground">
          Browse published openings and apply using your saved profile and private PDF resume.
          RecruitAI does not score or rank candidates.
        </p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void loadJobs();
        }}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-4"
      >
        <div className="grid gap-1 text-xs font-medium text-muted-foreground md:col-span-2">
          Job title or keywords
          <Input
            aria-label="Job title or keywords"
            value={filters.q}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            placeholder="e.g. product designer"
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          City or location
          <Input
            aria-label="City or location"
            value={filters.city}
            onChange={(event) => setFilters({ ...filters, city: event.target.value })}
            placeholder="Pune"
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          Company
          <Input
            aria-label="Company"
            value={filters.company}
            onChange={(event) => setFilters({ ...filters, company: event.target.value })}
            placeholder="Company name"
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          Work mode
          <select
            aria-label="Work mode"
            value={filters.workMode}
            onChange={(event) => setFilters({ ...filters, workMode: event.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {modes.map((mode) => (
              <option key={mode || 'any'} value={mode}>
                {mode ? mode.replace('_', ' ') : 'Any mode'}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          Employment type
          <select
            aria-label="Employment type"
            value={filters.employmentType}
            onChange={(event) => setFilters({ ...filters, employmentType: event.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {types.map((type) => (
              <option key={type || 'any'} value={type}>
                {type ? type.replaceAll('_', ' ') : 'Any type'}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          Industry
          <Input
            aria-label="Industry"
            value={filters.industry}
            onChange={(event) => setFilters({ ...filters, industry: event.target.value })}
            placeholder="Technology"
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          Skill
          <Input
            aria-label="Skill"
            value={filters.skill}
            onChange={(event) => setFilters({ ...filters, skill: event.target.value })}
            placeholder="React"
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          Minimum salary (₹)
          <Input
            aria-label="Minimum salary"
            inputMode="numeric"
            value={filters.salaryMin}
            onChange={(event) => setFilters({ ...filters, salaryMin: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          Maximum salary (₹)
          <Input
            aria-label="Maximum salary"
            inputMode="numeric"
            value={filters.salaryMax}
            onChange={(event) => setFilters({ ...filters, salaryMax: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          Experience years
          <Input
            aria-label="Experience years"
            inputMode="numeric"
            value={filters.experience}
            onChange={(event) => setFilters({ ...filters, experience: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          Notice period up to (days)
          <Input
            aria-label="Maximum notice period"
            inputMode="numeric"
            value={filters.noticePeriod}
            onChange={(event) => setFilters({ ...filters, noticePeriod: event.target.value })}
          />
        </div>
        <div className="flex items-end md:col-span-4">
          <Button type="submit" className="w-full sm:w-auto">
            <Search className="mr-2 size-4" />
            Search roles
          </Button>
        </div>
      </form>
      {loading ? (
        <div className="grid gap-3" aria-live="polite">
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : null}
      {error && !loading ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5" role="alert">
          <p>{error}</p>
          <Button type="button" variant="outline" className="mt-3" onClick={() => void loadJobs()}>
            Retry
          </Button>
        </div>
      ) : null}
      {!loading && !error && jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <BriefcaseBusiness className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">No open roles match these filters</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a broader search or create an alert from your workspace.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/alerts">Create a job alert</Link>
          </Button>
        </div>
      ) : null}
      {!loading && !error ? (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div
                  className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-lg font-semibold text-primary"
                  aria-hidden="true"
                >
                  {job.company.name.slice(0, 1).toLocaleUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="text-xl font-semibold">{job.title}</h2>
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                      Open role
                    </span>
                  </div>
                  <p className="mt-1 font-medium text-muted-foreground">{job.company.name}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-4" />
                      {job.location} · {job.workMode.toLocaleLowerCase()}
                    </span>
                    <span>
                      {money(job.salaryMin)} – {money(job.salaryMax)}
                    </span>
                    <span>{job.employmentType.replaceAll('_', ' ')}</span>
                    <span>
                      {job.experienceMinYears}+ years
                      {job.experienceMaxYears === null ? '' : `, up to ${job.experienceMaxYears}`}
                    </span>
                    <span>{job.industry}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {job.postedAt
                      ? `Posted ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(job.postedAt))}`
                      : 'Recently posted'}
                    {job.maxNoticePeriodDays === null
                      ? ''
                      : ` · Notice period up to ${job.maxNoticePeriodDays} days`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 sm:flex-col">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void toggleSaved(job)}
                    aria-label={job.saved ? `Unsave ${job.title}` : `Save ${job.title}`}
                  >
                    <Bookmark className="mr-2 size-4" fill={job.saved ? 'currentColor' : 'none'} />
                    {job.saved ? 'Saved' : 'Save'}
                  </Button>
                  <Button type="button" onClick={() => void apply(job)}>
                    Apply
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
