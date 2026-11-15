// @polsia:user-owned
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/i18n/client-locale';
import { apiFetch } from '@/lib/api-client';
import {
  adminApplicationsSchema,
  adminCompaniesSchema,
  adminJobsSchema,
  adminOverviewSchema,
  adminReportsSchema,
  adminUsersSchema,
} from '@/lib/contracts/recruitai';
import { fileUrl } from '@/modules/file-upload/client';

export function AdminOverview() {
  const { t } = useLocale();
  const [data, setData] = useState<ReturnType<typeof adminOverviewSchema.parse> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    void apiFetch('/api/admin/overview', { schema: adminOverviewSchema })
      .then(setData)
      .catch(() => setError(true));
  }, []);
  if (error)
    return (
      <section role="alert" className="rounded-2xl border border-destructive/30 bg-card p-6">
        <h1 className="text-2xl font-semibold">Overview could not load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Admin data is restricted to authorised accounts.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </section>
    );
  if (!data)
    return (
      <output className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <span key={item} className="block h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </output>
    );
  const statusNames: Record<string, string> = {
    DRAFT: t('jobDraft'),
    PENDING: t('jobPending'),
    PUBLISHED: t('jobPublished'),
    EXPIRED: t('jobExpired'),
    REMOVED: t('jobRemoved'),
    APPLIED: t('stageApplied'),
    SHORTLISTED: t('stageShortlisted'),
    INTERVIEW: t('stageInterview'),
    OFFER: t('stageOffer'),
    HIRED: t('stageHired'),
    REJECTED: t('stageRejected'),
  };
  const metrics = [
    [t('registeredUsers'), data.counts.users],
    [t('companies'), data.counts.companies],
    [t('jobSeekerProfiles'), data.counts.candidates],
    [t('openJobs'), data.counts.activeJobs],
    [t('applicationCount'), data.counts.applications],
    [t('inInterview'), data.counts.interviews],
    [t('hires'), data.counts.hires],
    [t('openScamReports'), data.counts.openReports],
  ];
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t('platformAdministration')}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{t('adminTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('adminIntro')}</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          API {data.system.api} · database {data.system.database}
        </span>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <strong className="mt-2 block text-3xl font-semibold tracking-tight">{value}</strong>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t('recentRegistrations')}</h2>
            <Button asChild variant="link" size="sm">
              <Link href="/admin/users">{t('allUsers')}</Link>
            </Button>
          </div>
          {data.recentUsers.length ? (
            <ul className="mt-3 divide-y divide-border">
              {data.recentUsers.map((item) => (
                <li key={item.id} className="py-3">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.email} · {item.role}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">{t('noRegistrations')}</p>
          )}
        </article>
        <article className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t('recentJobListings')}</h2>
            <Button asChild variant="link" size="sm">
              <Link href="/admin/jobs">{t('reviewJobs')}</Link>
            </Button>
          </div>
          {data.recentJobs.length ? (
            <ul className="mt-3 divide-y divide-border">
              {data.recentJobs.map((job) => (
                <li key={job.id} className="py-3">
                  <p className="truncate text-sm font-medium">
                    {job.title}
                    {job.isDemo ? ' · DEMO' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {job.companyName} · {statusNames[job.status] ?? job.status}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">{t('noListings')}</p>
          )}
        </article>
        <article className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t('applicationActivity')}</h2>
            <Button asChild variant="link" size="sm">
              <Link href="/admin/applications">{t('monitor')}</Link>
            </Button>
          </div>
          {data.recentApplications.length ? (
            <ul className="mt-3 divide-y divide-border">
              {data.recentApplications.map((item) => (
                <li key={item.id} className="py-3">
                  <p className="truncate text-sm font-medium">{item.jobTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {statusNames[item.status] ?? item.status.replaceAll('_', ' ')} ·{' '}
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
                      new Date(item.appliedAt),
                    )}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">{t('noApplicationsAdmin')}</p>
          )}
        </article>
      </section>
      <section className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Demo records carry an explicit DEMO label and are excluded from customer job search, company
        pipelines and notifications. Demo records remain visible to administrators for moderation
        testing.
      </section>
    </div>
  );
}

type AdminKind = 'users' | 'companies' | 'jobs' | 'applications' | 'reports';

export function AdminConsole({ kind }: { kind: AdminKind }) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const title = {
    users: t('adminUsers'),
    companies: t('adminCompanies'),
    jobs: t('adminJobs'),
    applications: t('adminApplications'),
    reports: t('adminReports'),
  }[kind];
  const endpoint = `/api/admin/${kind}`;
  const statusNames: Record<string, string> = {
    DRAFT: t('jobDraft'),
    PENDING: t('jobPending'),
    PUBLISHED: t('jobPublished'),
    EXPIRED: t('jobExpired'),
    REMOVED: t('jobRemoved'),
    APPLIED: t('stageApplied'),
    SHORTLISTED: t('stageShortlisted'),
    INTERVIEW: t('stageInterview'),
    OFFER: t('stageOffer'),
    HIRED: t('stageHired'),
    REJECTED: t('stageRejected'),
  };
  const statusLabel = (value: string) => statusNames[value] ?? value.replaceAll('_', ' ');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (query.trim() && (kind === 'users' || kind === 'companies')) params.set('q', query.trim());
    if (status && (kind === 'jobs' || kind === 'applications')) params.set('status', status);
    if (kind === 'jobs' && companyFilter.trim()) params.set('company', companyFilter.trim());
    if (kind === 'jobs' && categoryFilter.trim()) params.set('category', categoryFilter.trim());
    try {
      const path = `${endpoint}${params.size ? `?${params.toString()}` : ''}`;
      const data =
        kind === 'users'
          ? await apiFetch(path, { schema: adminUsersSchema })
          : kind === 'companies'
            ? await apiFetch(path, { schema: adminCompaniesSchema })
            : kind === 'jobs'
              ? await apiFetch(path, { schema: adminJobsSchema })
              : kind === 'applications'
                ? await apiFetch(path, { schema: adminApplicationsSchema })
                : await apiFetch(path, { schema: adminReportsSchema });
      setItems(data.items);
    } catch {
      setError('The admin list could not be loaded. Check this account’s access and retry.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, companyFilter, endpoint, kind, query, status]);
  useEffect(() => {
    void load();
  }, [load]);

  async function mutate(body: object, success: string) {
    try {
      await apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
      toast.success(success);
      await load();
    } catch {
      toast.error('The moderation change was not saved. Review the current record and try again.');
    }
  }

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t('adminOverview')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('adminListIntro')}</p>
      </header>
      {kind !== 'reports' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
          className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 xl:flex"
        >
          {kind === 'users' || kind === 'companies' ? (
            <Input
              aria-label={t('searchAdminRecords')}
              placeholder={t('searchAdminRecords')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          ) : null}
          {kind === 'jobs' ? (
            <>
              <Input
                aria-label={t('filterCompany')}
                placeholder={t('filterCompany')}
                value={companyFilter}
                onChange={(event) => setCompanyFilter(event.target.value)}
              />
              <Input
                aria-label={t('filterCategory')}
                placeholder={t('filterCategory')}
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              />
            </>
          ) : null}
          {kind === 'jobs' || kind === 'applications' ? (
            <select
              aria-label={t('allStatuses')}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t('allStatuses')}</option>
              {(kind === 'jobs'
                ? ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'EXPIRED', 'REMOVED']
                : ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']
              ).map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </select>
          ) : null}
          <Button type="submit" variant="outline">
            {t('applyFilters')}
          </Button>
        </form>
      ) : null}
      {loading ? <output className="block h-40 animate-pulse rounded-2xl bg-muted" /> : null}
      {error ? (
        <section role="alert" className="rounded-xl border border-destructive/30 bg-card p-5">
          <p>{error}</p>
          <Button type="button" variant="outline" className="mt-3" onClick={() => void load()}>
            Retry
          </Button>
        </section>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-medium">{t('noMatchingRecords')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('clearFilterHint')}</p>
        </section>
      ) : null}
      {!loading && !error ? (
        <div className="grid gap-3">
          {kind === 'users'
            ? items.map((raw) => {
                const user = adminUsersSchema.shape.items.element.parse(raw);
                return (
                  <article
                    key={user.id}
                    className="grid gap-3 rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold">{user.name}</h2>
                        <p className="truncate text-sm text-muted-foreground">
                          {user.email} · {user.emailVerified ? 'verified' : 'unverified'} ·{' '}
                          {user.role}
                        </p>
                        {user.banned ? (
                          <p className="mt-1 text-xs text-destructive">
                            Suspended · {user.banReason}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void mutate(
                              { userId: user.id, action: user.banned ? 'reactivate' : 'suspend' },
                              user.banned ? 'Account reactivated' : 'Account suspended',
                            )
                          }
                        >
                          {user.banned ? 'Reactivate' : 'Suspend'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void mutate(
                              {
                                userId: user.id,
                                action: 'role',
                                role: user.role === 'admin' ? 'user' : 'admin',
                              },
                              'Admin role updated',
                            )
                          }
                        >
                          {user.role === 'admin' ? 'Remove admin' : 'Assign admin'}
                        </Button>
                      </div>
                    </div>
                    <details className="rounded-lg border border-border px-3 py-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        View account profile
                      </summary>
                      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                        {user.profile ? (
                          <>
                            <p>
                              <span className="text-muted-foreground">Candidate: </span>
                              {user.profile.fullName} · {user.profile.headline || 'No headline'}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Location: </span>
                              {user.profile.city || 'Not set'}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Experience: </span>
                              {user.profile.experienceYears ?? 'Not set'} years ·{' '}
                              {user.profile.education || 'Education not set'}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Skills: </span>
                              {user.profile.skills.join(', ') || 'Not set'}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Expected CTC: </span>
                              {user.profile.expectedCtc === null
                                ? 'Not set'
                                : `₹${user.profile.expectedCtc.toLocaleString('en-IN')}`}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Notice period: </span>
                              {user.profile.noticePeriodDays === null
                                ? 'Not set'
                                : `${user.profile.noticePeriodDays} days`}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Discovery consent: </span>
                              {user.profile.isDiscoverable ? 'Opted in' : 'Off'}
                            </p>
                            {user.profile.resume ? (
                              <a
                                className="text-primary underline underline-offset-4"
                                href={fileUrl(user.profile.resume.fileKey)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open private resume · {user.profile.resume.filename}
                              </a>
                            ) : (
                              <p className="text-muted-foreground">No resume uploaded</p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">No candidate profile.</p>
                        )}
                        {user.companies.length ? (
                          <p className="sm:col-span-2">
                            <span className="text-muted-foreground">Company memberships: </span>
                            {user.companies
                              .map((item) => `${item.name} (${item.role.toLocaleLowerCase()})`)
                              .join(', ')}
                          </p>
                        ) : null}
                      </div>
                    </details>
                  </article>
                );
              })
            : null}
          {kind === 'companies'
            ? items.map((raw) => {
                const company = adminCompaniesSchema.shape.items.element.parse(raw);
                return (
                  <article
                    key={company.id}
                    className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">
                        {company.name}
                        {company.isDemo ? ' · DEMO' : ''}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {company.industry} · {company.city} · {company.members} members ·{' '}
                        {company.jobs} jobs
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Verification {company.verificationStatus} ·{' '}
                        {company.suspended ? 'Suspended' : 'Active'}
                      </p>
                      {company.demoLabel ? (
                        <p className="mt-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                          {company.demoLabel}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void mutate(
                            {
                              companyId: company.id,
                              action:
                                company.verificationStatus === 'VERIFIED'
                                  ? 'reject_verification'
                                  : 'verify',
                            },
                            'Company verification updated',
                          )
                        }
                      >
                        {company.verificationStatus === 'VERIFIED'
                          ? 'Revoke verification'
                          : 'Verify company'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void mutate(
                            {
                              companyId: company.id,
                              action: company.suspended ? 'reactivate' : 'suspend',
                            },
                            company.suspended ? 'Company reactivated' : 'Company suspended',
                          )
                        }
                      >
                        {company.suspended ? 'Reactivate' : 'Suspend'}
                      </Button>
                    </div>
                  </article>
                );
              })
            : null}
          {kind === 'jobs'
            ? items.map((raw) => {
                const job = adminJobsSchema.shape.items.element.parse(raw);
                return (
                  <article
                    key={job.id}
                    className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">
                        {job.title}
                        {job.isDemo ? ' · DEMO' : ''}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {job.company.name} · {job.location} · {job.industry} ·{' '}
                        {statusLabel(job.status)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {job.applications} applications · {job.openReports} open scam reports
                      </p>
                      {job.demoLabel ? (
                        <p className="mt-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                          {job.demoLabel}
                        </p>
                      ) : null}
                      {job.moderationNote ? (
                        <p className="mt-1 text-xs text-amber-700">
                          Review note: {job.moderationNote}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.status === 'PENDING' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              void mutate({ jobId: job.id, action: 'approve' }, 'Job approved')
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void mutate(
                                {
                                  jobId: job.id,
                                  action: 'reject',
                                  note: 'Rejected in admin review',
                                },
                                'Job rejected',
                              )
                            }
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {['DRAFT', 'PUBLISHED', 'REJECTED'].includes(job.status) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void mutate(
                              { jobId: job.id, action: 'remove', note: 'Removed by admin' },
                              'Job removed',
                            )
                          }
                        >
                          Remove
                        </Button>
                      ) : null}
                      {job.status === 'PUBLISHED' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void mutate({ jobId: job.id, action: 'expire' }, 'Job expired')
                          }
                        >
                          Expire
                        </Button>
                      ) : null}
                    </div>
                  </article>
                );
              })
            : null}
          {kind === 'applications'
            ? items.map((raw) => {
                const application = adminApplicationsSchema.shape.items.element.parse(raw);
                return (
                  <article
                    key={application.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">
                          {application.job.title}
                          {application.isDemo ? ' · DEMO' : ''}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {application.job.companyName} · candidate {application.seekerUserId}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {statusLabel(application.status)}
                      </span>
                    </div>
                    {application.demoLabel ? (
                      <p className="mt-2 text-xs font-semibold text-violet-700 dark:text-violet-300">
                        {application.demoLabel}
                      </p>
                    ) : null}
                    <ol className="mt-4 flex flex-wrap gap-2">
                      {application.history.map((event) => (
                        <li
                          key={`${event.toStatus}-${event.createdAt}`}
                          className="rounded-lg bg-muted px-3 py-2 text-xs"
                        >
                          <strong>{statusLabel(event.toStatus)}</strong>
                          <span className="mx-1 text-muted-foreground">by {event.authorName}</span>
                          <time className="text-muted-foreground">
                            {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
                              new Date(event.createdAt),
                            )}
                          </time>
                        </li>
                      ))}
                    </ol>
                  </article>
                );
              })
            : null}
          {kind === 'reports'
            ? items.map((raw) => {
                const report = adminReportsSchema.shape.items.element.parse(raw);
                return (
                  <article
                    key={report.id}
                    className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <h2 className="font-semibold">
                        {report.job.title}
                        {report.isDemo ? ' · DEMO' : ''}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {report.job.company.name} · job status {report.job.status} · report from{' '}
                        {report.reporterId}
                      </p>
                      <p className="mt-2 text-sm">{report.reason}</p>
                      {report.isDemo ? (
                        <p className="mt-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                          Isolated sample report · no customer activity
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void mutate(
                            { reportId: report.id, action: 'dismiss' },
                            'Report dismissed',
                          )
                        }
                      >
                        Dismiss report
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          void mutate(
                            { reportId: report.id, action: 'remove_job' },
                            'Job removed after report review',
                          )
                        }
                      >
                        Remove job
                      </Button>
                    </div>
                  </article>
                );
              })
            : null}
        </div>
      ) : null}
    </div>
  );
}
