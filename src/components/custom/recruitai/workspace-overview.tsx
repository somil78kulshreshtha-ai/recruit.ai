// @polsia:user-owned
'use client';

import { ArrowRight, Bell, Bookmark, BriefcaseBusiness, FileText, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';
import { workspaceOutputSchema } from '@/lib/contracts/recruitai';

export function WorkspaceOverview() {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void apiFetch('/api/workspace', { schema: workspaceOutputSchema })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  if (error)
    return (
      <section className="rounded-2xl border border-destructive/30 bg-card p-6">
        <h1 className="text-2xl font-semibold">Workspace unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not load your account details.
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

  const workspace = workspaceOutputSchema.parse(data);
  const cards = [
    {
      label: 'Applications',
      value: workspace.counts.applications,
      icon: FileText,
      href: '/dashboard/applications',
    },
    {
      label: 'Saved roles',
      value: workspace.counts.savedJobs,
      icon: Bookmark,
      href: '/dashboard/saved',
    },
    {
      label: 'Active alerts',
      value: workspace.counts.alerts,
      icon: Bell,
      href: '/dashboard/alerts',
    },
    {
      label: workspace.profile ? 'Profile completeness' : 'Profile setup',
      value: workspace.profile ? `${workspace.profile.completeness.percentage}%` : 'Start',
      icon: UserRound,
      href: '/dashboard/profile',
    },
  ];
  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {workspace.companies.length ? 'Company and talent workspace' : 'Job seeker workspace'}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Good to see you, {workspace.user.name.split(' ')[0] || 'there'}.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A clear view of your RecruitAI activity. Hiring decisions stay with people.
          </p>
        </div>
        <Button asChild>
          <Link href={workspace.companies.length ? '/dashboard/company' : '/jobs'}>
            {workspace.companies.length ? 'Open company workspace' : 'Explore open roles'}
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </header>
      {!workspace.profile && !workspace.companies.length ? (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <BriefcaseBusiness className="mt-1 size-5 text-primary" />
            <div>
              <h2 className="font-semibold">Choose your workspace</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up a job seeker profile or create a company workspace. You can join a hiring
                team after creating an account.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/setup">Set up your account</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1" />
              </span>
              <span className="mt-5 block text-sm text-muted-foreground">{card.label}</span>
              <strong className="mt-1 block text-2xl font-semibold">{card.value}</strong>
            </Link>
          );
        })}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Keep moving</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your tools are organised around each side of the hiring journey.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <QuickLink
              href="/jobs"
              title="Search open roles"
              detail="Use location, work mode, salary and skills filters."
            />
            <QuickLink
              href="/dashboard/profile"
              title="Update your profile"
              detail="Add experience, education and a private PDF resume."
            />
            <QuickLink
              href="/dashboard/applications"
              title="Track applications"
              detail="See current stages and the full activity history."
            />
            <QuickLink
              href="/dashboard/alerts"
              title="Set a job alert"
              detail="Get email updates when a matching role opens."
            />
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Your companies</h2>
          {workspace.companies.length ? (
            <div className="mt-4 grid gap-3">
              {workspace.companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between rounded-xl bg-muted/60 p-4"
                >
                  <div>
                    <strong>{company.name}</strong>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {company.role.replaceAll('_', ' ')} · verification{' '}
                      {company.verificationStatus.toLocaleLowerCase()}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/company">Open</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border p-5">
              <p className="text-sm text-muted-foreground">
                No company workspace is connected to this account.
              </p>
              <Button asChild variant="outline" className="mt-3">
                <Link href="/dashboard/setup?kind=company">Create a company workspace</Link>
              </Button>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

function QuickLink({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-primary/5"
    >
      <strong className="text-sm">{title}</strong>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
    </Link>
  );
}
