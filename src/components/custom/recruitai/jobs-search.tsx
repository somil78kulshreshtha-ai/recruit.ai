// @polsia:user-owned
'use client';

import { Bookmark, BriefcaseBusiness, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type MessageKey, useLocale } from '@/i18n/client-locale';
import { apiFetch } from '@/lib/api-client';
import { useSession } from '@/lib/auth-client';
import { jobListSchema, type PublicJob } from '@/lib/contracts/recruitai';

const modes = ['', 'REMOTE', 'HYBRID', 'ONSITE'] as const;
const types = ['', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] as const;

function money(value: number | null, notListed: string) {
  return value === null
    ? notListed
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value);
}

export function JobsSearch() {
  const { t, locale } = useLocale();
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
      setError('load-failed');
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
      toast.success(job.saved ? t('toastRemoved') : t('toastSaved'));
    } catch {
      toast.error(t('toastSaveFail'));
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
      if (result.existing) toast(t('toastAlreadyApplied'));
      else if (result.emailDelivered === false)
        toast(t('toastAppliedNoEmail'));
      else toast.success(t('toastApplied'));
      router.push('/dashboard/applications');
    } catch (failure) {
      const cause = failure instanceof Error ? failure.cause : null;
      const serverMessage =
        cause &&
        typeof cause === 'object' &&
        'message' in cause &&
        typeof cause.message === 'string'
          ? cause.message
          : null;
      toast.error(serverMessage ?? t('toastNeedProfile'));
      if (!serverMessage || serverMessage.includes('profile') || serverMessage.includes('resume'))
        router.push('/dashboard/profile');
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t('jobsKicker')}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('jobsTitle')}</h1>
        <p className="max-w-2xl text-muted-foreground">
          {t('jobsIntro')}
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
          {t('jobsKeywords')}
          <Input
            aria-label={t('jobsKeywords')}
            value={filters.q}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            placeholder={t('jobsKeywordsPh')}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t('jobsCity')}
          <Input
            aria-label={t('jobsCity')}
            value={filters.city}
            onChange={(event) => setFilters({ ...filters, city: event.target.value })}
            placeholder="Pune"
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t('jobsCompany')}
          <Input
            aria-label={t('jobsCompany')}
            value={filters.company}
            onChange={(event) => setFilters({ ...filters, company: event.target.value })}
            placeholder={t('jobsCompanyPh')}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t('jobsWorkMode')}
          <select
            aria-label={t('jobsWorkMode')}
            value={filters.workMode}
            onChange={(event) => setFilters({ ...filters, workMode: event.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {modes.map((mode) => (
              <option key={mode || 'any'} value={mode}>
                {mode ? t(`mode${mode}` as MessageKey) : t('jobsAnyMode')}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t('jobsEmploymentType')}
          <select
            aria-label={t('jobsEmploymentType')}
            value={filters.employmentType}
            onChange={(event) => setFilters({ ...filters, employmentType: event.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {types.map((type) => (
              <option key={type || 'any'} value={type}>
                {type ? t(`type${type}` as MessageKey) : t('jobsAnyType')}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t('jobsIndustry')}
          <Input
            aria-label={t('jobsIndustry')}
            value={filters.industry}
            onChange={(event) => setFilters({ ...filters, industry: event.target.value })}
            placeholder="Technology"
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t('jobsSkill')}
          <Input
            aria-label={t('jobsSkill')}
            value={filters.skill}
            onChange={(event) => setFilters({ ...filters, skill: event.target.value })}
            placeholder="React"
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t('jobsMinSalary')}
          <Input
            aria-label={t('jobsMinSalary')}
            inputMode="numeric"
            value={filters.salaryMin}
            onChange={(event) => setFilters({ ...filters, salaryMin: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t('jobsMaxSalary')}
          <Input
            aria-label={t('jobsMaxSalary')}
            inputMode="numeric"
            value={filters.salaryMax}
            onChange={(event) => setFilters({ ...filters, salaryMax: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t('jobsExperience')}
          <Input
            aria-label={t('jobsExperience')}
            inputMode="numeric"
            value={filters.experience}
            onChange={(event) => setFilters({ ...filters, experience: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t('jobsNotice')}
          <Input
            aria-label={t('jobsNotice')}
            inputMode="numeric"
            value={filters.noticePeriod}
            onChange={(event) => setFilters({ ...filters, noticePeriod: event.target.value })}
          />
        </div>
        <div className="flex items-end md:col-span-4">
          <Button type="submit" className="w-full sm:w-auto">
            <Search className="mr-2 size-4" />
            {t('jobsSearchBtn')}
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
          <p>{t('jobsLoadError')}</p>
          <Button type="button" variant="outline" className="mt-3" onClick={() => void loadJobs()}>
            {t('retry')}
          </Button>
        </div>
      ) : null}
      {!loading && !error && jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <BriefcaseBusiness className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">{t('jobsNoneTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('jobsNoneBody')}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/dashboard/alerts">{t('jobsCreateAlert')}</Link>
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
                      {t('jobsOpenRole')}
                    </span>
                  </div>
                  <p className="mt-1 font-medium text-muted-foreground">{job.company.name}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-4" />
                      {job.location} · {t(`mode${job.workMode}` as MessageKey)}
                    </span>
                    <span>
                      {money(job.salaryMin, t('jobsNotListed'))} – {money(job.salaryMax, t('jobsNotListed'))}
                    </span>
                    <span>{t(`type${job.employmentType}` as MessageKey)}</span>
                    <span>
                      {t('jobsExpMin', { min: job.experienceMinYears })}
                      {job.experienceMaxYears === null
                        ? ''
                        : t('jobsExpMax', { max: job.experienceMaxYears })}
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
                      ? t('jobsPosted', {
                          date: new Intl.DateTimeFormat(`${locale}-IN`, {
                            dateStyle: 'medium',
                          }).format(new Date(job.postedAt)),
                        })
                      : t('jobsRecent')}
                    {job.maxNoticePeriodDays === null
                      ? ''
                      : t('jobsNoticeUpTo', { days: job.maxNoticePeriodDays })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 sm:flex-col">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void toggleSaved(job)}
                    aria-label={
                      job.saved
                        ? t('jobsUnsaveAria', { title: job.title })
                        : t('jobsSaveAria', { title: job.title })
                    }
                  >
                    <Bookmark className="mr-2 size-4" fill={job.saved ? 'currentColor' : 'none'} />
                    {job.saved ? t('jobsSaved') : t('jobsSave')}
                  </Button>
                  <Button type="button" onClick={() => void apply(job)}>
                    {t('jobsApply')}
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
