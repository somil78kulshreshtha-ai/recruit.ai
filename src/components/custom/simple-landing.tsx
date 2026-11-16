// @polsia:user-owned — minimal public homepage (English, Hindi, Marathi).
'use client';

import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { AuthNav } from '@/components/custom/auth-nav';
import { LanguageSwitcher } from '@/components/custom/language-switcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type MessageKey, useLocale } from '@/i18n/client-locale';

const steps: { title: MessageKey; body: MessageKey }[] = [
  { title: 'homeStep1Title', body: 'homeStep1Body' },
  { title: 'homeStep2Title', body: 'homeStep2Body' },
  { title: 'homeStep3Title', body: 'homeStep3Body' },
];

const featureGroups: { title: MessageKey; items: MessageKey[] }[] = [
  { title: 'featSeekersTitle', items: ['fs1', 'fs2', 'fs3', 'fs4', 'fs5', 'fs6'] },
  { title: 'homeEmpKicker', items: ['ft1', 'ft2', 'ft3', 'ft4', 'ft5'] },
  { title: 'featAdminTitle', items: ['fa1', 'fa2', 'fa3', 'fa4'] },
];

export default function SimpleLanding() {
  const { t } = useLocale();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <Link href="/" aria-label={t('homeHomeLabel')} className="text-lg font-semibold tracking-tight">
          RecruitAI
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <Button asChild variant="ghost">
            <Link href="/jobs">{t('navFindJobs')}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="#how-it-works">{t('navHowItWorks')}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/contact">{t('navContact')}</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <AuthNav />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-20 pt-14 sm:pt-24">
        <p className="text-sm text-muted-foreground">{t('homeKicker')}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          {t('homeTitle')}
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">{t('homeSub')}</p>

        <form
          action="/jobs"
          method="get"
          className="mt-10 flex max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 sm:flex-row"
        >
          <Input
            name="q"
            aria-label={t('homeSearchKeywordPh')}
            placeholder={t('homeSearchKeywordPh')}
            className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Input
            name="city"
            aria-label={t('homeSearchCityPh')}
            placeholder={t('homeSearchCityPh')}
            className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0 sm:max-w-[10rem]"
          />
          <Button type="submit" className="h-11 px-6">
            {t('jobsSearchBtn')}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          <Link
            href="/signup?type=company"
            className="inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('homeHiringLink')}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </p>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-20 px-5 pb-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('homeHowTitle')}</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="border-t border-border pt-5">
              <span className="text-sm text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-medium">{t(step.title)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(step.body)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="grid gap-10 border-t border-border pt-10 md:grid-cols-3">
          {featureGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t(group.title)}
              </h2>
              <ul className="mt-5 grid gap-3">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="border-t border-border pt-10">
          <h2 className="text-xl font-semibold">{t('homePeopleTitle')}</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t('homePeopleBody')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="flex flex-col gap-6 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t('homeCtaTitle')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('homeCtaBody')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-11 px-6">
              <Link href="/jobs">{t('navFindJobs')}</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-6">
              <Link href="/signup?type=company">{t('homeCtaHire')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <nav
          aria-label="Footer"
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted-foreground"
        >
          <span>© RecruitAI</span>
          <span className="flex gap-4">
            <Link href="/contact" className="hover:text-foreground">
              {t('navContact')}
            </Link>
            <Link href="/login?next=/admin" className="hover:text-foreground">
              {t('navAdminAccess')}
            </Link>
          </span>
        </nav>
      </footer>
    </main>
  );
}
