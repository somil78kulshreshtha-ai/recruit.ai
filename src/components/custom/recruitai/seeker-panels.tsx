// @polsia:user-owned
'use client';

import { BellRing, Bookmark, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/i18n/client-locale';
import type { Locale } from '@/i18n/config';
import { apiFetch } from '@/lib/api-client';
import {
  alertsListSchema,
  applicationListSchema,
  jobListSchema,
  type PublicJob,
} from '@/lib/contracts/recruitai';

const stages = ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'] as const;
const stageLabels: Record<Locale, Record<(typeof stages)[number], string>> = {
  en: {
    APPLIED: 'Applied',
    SHORTLISTED: 'Shortlisted',
    INTERVIEW: 'Interview',
    OFFER: 'Offer',
    HIRED: 'Hired',
    REJECTED: 'Rejected',
  },
  hi: {
    APPLIED: 'आवेदन किया',
    SHORTLISTED: 'चयनित',
    INTERVIEW: 'साक्षात्कार',
    OFFER: 'प्रस्ताव',
    HIRED: 'नियुक्त',
    REJECTED: 'अस्वीकृत',
  },
  mr: {
    APPLIED: 'अर्ज केला',
    SHORTLISTED: 'निवड यादीत',
    INTERVIEW: 'मुलाखत',
    OFFER: 'ऑफर',
    HIRED: 'नियुक्त',
    REJECTED: 'नाकारले',
  },
};

export function ApplicationTracker() {
  const { t, locale } = useLocale();
  const [items, setItems] = useState<ReturnType<typeof applicationListSchema.parse>['items']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setLoading(true);
    return apiFetch('/api/applications', { schema: applicationListSchema })
      .then((data) => setItems(data.items))
      .catch(() => setError('Application history could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className="grid gap-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t('dashboard')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{t('applicationTracker')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('applicationIntro')}</p>
      </header>
      {loading ? <output className="text-sm text-muted-foreground">{t('loading')}</output> : null}
      {error ? (
        <section role="alert" className="rounded-xl border border-destructive/30 bg-card p-5">
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => {
              setError('');
              void load();
            }}
          >
            Retry
          </Button>
        </section>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="font-semibold">{t('noApplications')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('applicationIntro')}</p>
          <Button asChild className="mt-4">
            <Link href="/jobs">{t('findJobs')}</Link>
          </Button>
        </section>
      ) : null}
      {!loading && !error ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{item.job.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.job.companyName} · {item.job.location}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {stageLabels[locale][item.status]}
                </span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {stageLabels[locale].APPLIED} ·{' '}
                {new Intl.DateTimeFormat(
                  locale === 'en' ? 'en-IN' : locale === 'hi' ? 'hi-IN' : 'mr-IN',
                  { dateStyle: 'medium' },
                ).format(new Date(item.appliedAt))}
              </p>
              <ol
                aria-label={t('applicationTracker')}
                className="mt-5 grid gap-3 border-l border-border pl-4"
              >
                {item.history.map((event, index) => (
                  <li key={`${item.id}-${event.toStatus}-${event.createdAt}`} className="relative">
                    <span
                      className={`absolute -left-[21px] top-1 size-2.5 rounded-full ${index === item.history.length - 1 ? 'bg-primary' : 'bg-muted-foreground/40'}`}
                    />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <strong className="text-sm">{stageLabels[locale][event.toStatus]}</strong>
                      <span className="text-xs text-muted-foreground">{event.authorName}</span>
                      <time className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat(
                          locale === 'en' ? 'en-IN' : locale === 'hi' ? 'hi-IN' : 'mr-IN',
                          { dateStyle: 'medium', timeStyle: 'short' },
                        ).format(new Date(event.createdAt))}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                {stages.map((stage) => stageLabels[locale][stage]).join(' → ')}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SavedJobs() {
  const [items, setItems] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(
    () =>
      apiFetch('/api/saved-jobs', { schema: jobListSchema })
        .then((data) => setItems(data.items))
        .catch(() => setError(true))
        .finally(() => setLoading(false)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function remove(job: PublicJob) {
    try {
      await apiFetch('/api/saved-jobs', {
        method: 'DELETE',
        body: JSON.stringify({ jobId: job.id }),
      });
      setItems((current) => current.filter((item) => item.id !== job.id));
      toast.success('Job removed from saved roles');
    } catch {
      toast.error('Could not remove this saved role.');
    }
  }
  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-3xl font-semibold">Saved jobs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your saved roles stay with your account.
        </p>
      </header>
      {loading ? (
        <output className="text-sm text-muted-foreground">Loading saved roles…</output>
      ) : null}
      {error ? (
        <section role="alert" className="rounded-xl border border-destructive/30 bg-card p-5">
          <p>Saved jobs could not be loaded.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => {
              setError(false);
              setLoading(true);
              void load();
            }}
          >
            Retry
          </Button>
        </section>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Bookmark className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 font-medium">No saved roles yet</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </section>
      ) : null}
      <div className="grid gap-3">
        {items.map((job) => (
          <article
            key={job.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 font-semibold text-primary">
              {job.company.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">{job.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.company.name} · <MapPin className="inline size-3" /> {job.location}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/jobs">View roles</Link>
              </Button>
              <Button type="button" variant="outline" onClick={() => void remove(job)}>
                Remove
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function JobAlerts() {
  const { t } = useLocale();
  const [items, setItems] = useState<ReturnType<typeof alertsListSchema.parse>['items']>([]);
  const [editingId, setEditingId] = useState('');
  const [label, setLabel] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [criteria, setCriteria] = useState({
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
  const load = useCallback(
    () =>
      apiFetch('/api/alerts', { schema: alertsListSchema })
        .then((data) => setItems(data.items))
        .catch(() => setError('Alerts could not be loaded.'))
        .finally(() => setLoading(false)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  function criteriaPayload() {
    return {
      q: criteria.q.trim() || undefined,
      city: criteria.city.trim() || undefined,
      workMode: criteria.workMode || undefined,
      salaryMin: criteria.salaryMin ? Number(criteria.salaryMin) : undefined,
      salaryMax: criteria.salaryMax ? Number(criteria.salaryMax) : undefined,
      experience: criteria.experience ? Number(criteria.experience) : undefined,
      employmentType: criteria.employmentType || undefined,
      industry: criteria.industry.trim() || undefined,
      skill: criteria.skill.trim() || undefined,
      company: criteria.company.trim() || undefined,
      noticePeriod: criteria.noticePeriod ? Number(criteria.noticePeriod) : undefined,
    };
  }
  function resetForm() {
    setEditingId('');
    setLabel('');
    setEmailEnabled(true);
    setCriteria({
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
  }
  function edit(item: ReturnType<typeof alertsListSchema.parse>['items'][number]) {
    setEditingId(item.id);
    setLabel(item.label);
    setEmailEnabled(item.emailEnabled);
    setCriteria({
      q: item.criteria.q ?? '',
      city: item.criteria.city ?? '',
      workMode: item.criteria.workMode ?? '',
      salaryMin: item.criteria.salaryMin?.toString() ?? '',
      salaryMax: item.criteria.salaryMax?.toString() ?? '',
      experience: item.criteria.experience?.toString() ?? '',
      employmentType: item.criteria.employmentType ?? '',
      industry: item.criteria.industry ?? '',
      skill: item.criteria.skill ?? '',
      company: item.criteria.company ?? '',
      noticePeriod: item.criteria.noticePeriod?.toString() ?? '',
    });
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const method = editingId ? 'PATCH' : 'POST';
      await apiFetch('/api/alerts', {
        method,
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          label,
          criteria: criteriaPayload(),
          emailEnabled,
          whatsappEnabled: false,
        }),
      });
      toast.success(editingId ? 'Job alert updated' : 'Email job alert saved');
      resetForm();
      setLoading(true);
      await load();
    } catch {
      toast.error('Could not save this alert.');
    }
  }
  async function remove(id: string) {
    try {
      await apiFetch('/api/alerts', { method: 'DELETE', body: JSON.stringify({ id }) });
      setItems((current) => current.filter((item) => item.id !== id));
      toast.success('Alert removed');
    } catch {
      toast.error('Could not remove this alert.');
    }
  }
  return (
    <div className="grid gap-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Job seeker workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Job alerts</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Matching open jobs trigger an email and an in-app notification. WhatsApp delivery is not
          active until a real provider is configured.
        </p>
      </header>
      <form
        onSubmit={save}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 xl:grid-cols-3 sm:p-6"
      >
        <h2 className="font-semibold sm:col-span-2 xl:col-span-3">
          {editingId ? 'Edit alert' : 'Create an alert'}
        </h2>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-name">Alert name</Label>
          <Input
            id="alert-name"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            required
            minLength={2}
            maxLength={80}
            placeholder="React roles in Pune"
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-keywords">Keywords</Label>
          <Input
            id="alert-keywords"
            value={criteria.q}
            onChange={(event) => setCriteria({ ...criteria, q: event.target.value })}
            placeholder="React developer"
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-city">City</Label>
          <Input
            id="alert-city"
            value={criteria.city}
            onChange={(event) => setCriteria({ ...criteria, city: event.target.value })}
            placeholder="Pune"
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-company">Company</Label>
          <Input
            id="alert-company"
            value={criteria.company}
            onChange={(event) => setCriteria({ ...criteria, company: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-industry">Industry</Label>
          <Input
            id="alert-industry"
            value={criteria.industry}
            onChange={(event) => setCriteria({ ...criteria, industry: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-skill">Skill</Label>
          <Input
            id="alert-skill"
            value={criteria.skill}
            onChange={(event) => setCriteria({ ...criteria, skill: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-work-mode">Work mode</Label>
          <select
            id="alert-work-mode"
            value={criteria.workMode}
            onChange={(event) => setCriteria({ ...criteria, workMode: event.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Any mode</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-employment-type">Employment type</Label>
          <select
            id="alert-employment-type"
            value={criteria.employmentType}
            onChange={(event) => setCriteria({ ...criteria, employmentType: event.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Any type</option>
            <option value="FULL_TIME">Full time</option>
            <option value="PART_TIME">Part time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-salary-min">Minimum salary</Label>
          <Input
            id="alert-salary-min"
            type="number"
            min="0"
            value={criteria.salaryMin}
            onChange={(event) => setCriteria({ ...criteria, salaryMin: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-salary-max">Maximum salary</Label>
          <Input
            id="alert-salary-max"
            type="number"
            min="0"
            value={criteria.salaryMax}
            onChange={(event) => setCriteria({ ...criteria, salaryMax: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-experience">Experience years</Label>
          <Input
            id="alert-experience"
            type="number"
            min="0"
            max="60"
            step="0.5"
            value={criteria.experience}
            onChange={(event) => setCriteria({ ...criteria, experience: event.target.value })}
          />
        </div>
        <div className="grid gap-1 text-xs font-medium text-muted-foreground">
          <Label htmlFor="alert-notice-period">Notice period up to (days)</Label>
          <Input
            id="alert-notice-period"
            type="number"
            min="0"
            max="365"
            value={criteria.noticePeriod}
            onChange={(event) => setCriteria({ ...criteria, noticePeriod: event.target.value })}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2 xl:col-span-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(event) => setEmailEnabled(event.target.checked)}
            />
            Email alerts
          </label>
          <span className="text-xs text-muted-foreground">
            WhatsApp off until a real delivery provider is configured.
          </span>
          <Button type="submit">{editingId ? 'Save alert' : 'Create alert'}</Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
      {loading ? <output className="text-sm text-muted-foreground">{t('loading')}</output> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <section className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          No alerts yet. Create one to receive updates when a matching open role is approved.
        </section>
      ) : null}
      <div className="grid gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
          >
            <div>
              <strong className="inline-flex items-center gap-2">
                <BellRing className="size-4 text-primary" />
                {item.label}
              </strong>
              <p className="mt-1 text-xs text-muted-foreground">
                {Object.values(item.criteria).filter(Boolean).join(' · ') || 'Any open role'} ·
                Email {item.emailEnabled ? 'on' : 'off'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => edit(item)}>
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void remove(item.id)}
              >
                Remove alert
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
