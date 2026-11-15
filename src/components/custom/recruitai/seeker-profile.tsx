// @polsia:user-owned
'use client';

import { FileText, UploadCloud } from 'lucide-react';
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
  type ProfileInput,
  profileInputSchema,
  profileOutputSchema,
} from '@/lib/contracts/recruitai';
import { FileUploadError, fileUrl, uploadPrivateFile } from '@/modules/file-upload/client';

const blankProfile: ProfileInput = {
  fullName: '',
  headline: '',
  city: '',
  skills: [],
  experienceYears: null,
  education: '',
  expectedCtc: null,
  noticePeriodDays: null,
  preferredLocations: [],
  workMode: null,
  isOpenToWork: true,
  isDiscoverable: false,
};

function errorMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.cause &&
    typeof error.cause === 'object' &&
    'errors' in error.cause
  )
    return (error.cause as { errors: Record<string, string> }).errors;
  return null;
}

export function SeekerProfile() {
  const { t } = useLocale();
  const [profile, setProfile] = useState<ProfileInput>(blankProfile);
  const [resume, setResume] = useState<{ id: string; filename: string; fileKey: string } | null>(
    null,
  );
  const [percentage, setPercentage] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/profile', { schema: profileOutputSchema });
      setProfile({
        fullName: data.fullName,
        headline: data.headline,
        city: data.city,
        skills: data.skills,
        experienceYears: data.experienceYears,
        education: data.education,
        expectedCtc: data.expectedCtc,
        noticePeriodDays: data.noticePeriodDays,
        preferredLocations: data.preferredLocations,
        workMode: data.workMode,
        isOpenToWork: data.isOpenToWork,
        isDiscoverable: data.isDiscoverable,
      });
      setResume(data.resume);
      setPercentage(data.completeness.percentage);
      setMissing(data.completeness.missing);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    const parsed = profileInputSchema.safeParse(profile);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
            key,
            value?.[0] ?? 'Check this field.',
          ]),
        ),
      );
      setSaving(false);
      return;
    }
    try {
      const result = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(parsed.data),
        schema: profileOutputSchema,
      });
      setPercentage(result.completeness.percentage);
      setMissing(result.completeness.missing);
      setResume(result.resume);
      toast.success('Profile saved');
    } catch (error) {
      setErrors(errorMessage(error) ?? {});
      toast.error('Profile could not be saved. Check the highlighted fields.');
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.type !== 'application/pdf' || !file.name.toLocaleLowerCase().endsWith('.pdf')) {
      toast.error('Choose a PDF file. Other file types are not accepted.');
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadPrivateFile(file);
      const saved = await apiFetch<{ id: string; filename: string; fileKey: string }>(
        '/api/resume',
        {
          method: 'POST',
          body: JSON.stringify({
            key: uploaded.key,
            filename: file.name,
            mime_type: uploaded.mime_type,
            size: uploaded.size,
          }),
        },
      );
      setResume(saved);
      await load();
      toast.success('Private PDF resume saved');
    } catch (error) {
      const message =
        error instanceof FileUploadError
          ? error.message
          : 'Resume upload failed. Your current resume remains unchanged.';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  if (loading)
    return (
      <div className="grid gap-4">
        <div className="h-12 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  if (notFound)
    return (
      <section className="rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold">{t('profileSetupTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('profileSetupIntro')}</p>
        <Button asChild className="mt-5">
          <Link href="/dashboard/setup?kind=seeker">{t('startProfileSetup')}</Link>
        </Button>
      </section>
    );

  const update = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));
  const listValue = (value: string[]) => value.join(', ');
  const setList = (key: 'skills' | 'preferredLocations', value: string) =>
    update(
      key,
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    );

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t('dashboard')}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t('profileTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('profileIntro')}</p>
        </div>
        <div className="min-w-[200px]">
          <div className="mb-2 flex justify-between text-sm">
            <span>{t('completeness')}</span>
            <strong>{percentage}%</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {missing.length ? `${missing.length} ${t('fieldsToComplete')}` : t('profileDetails')}
          </p>
        </div>
      </header>
      <form
        onSubmit={save}
        className="grid gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"
      >
        <div>
          <h2 className="text-lg font-semibold">{t('profileDetails')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('fullName')} · {t('skills')} · {t('education')}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${t('fullName')} *`} id="profile-name" error={errors.fullName}>
            <Input
              id="profile-name"
              value={profile.fullName}
              onChange={(event) => update('fullName', event.target.value)}
              required
            />
          </Field>
          <Field label={t('headline')} id="profile-headline" error={errors.headline}>
            <Input
              id="profile-headline"
              value={profile.headline}
              onChange={(event) => update('headline', event.target.value)}
            />
          </Field>
          <Field label={t('currentCity')} id="profile-city" error={errors.city}>
            <Input
              id="profile-city"
              value={profile.city}
              onChange={(event) => update('city', event.target.value)}
            />
          </Field>
          <Field label={`${t('skills')} *`} id="profile-skills" error={errors.skills}>
            <Input
              id="profile-skills"
              value={listValue(profile.skills)}
              onChange={(event) => setList('skills', event.target.value)}
              placeholder="React, TypeScript, Product design"
              required
            />
          </Field>
          <Field
            label={`${t('experience')} *`}
            id="profile-experience"
            error={errors.experienceYears}
          >
            <Input
              id="profile-experience"
              type="number"
              min="0"
              max="60"
              step="0.5"
              value={profile.experienceYears ?? ''}
              onChange={(event) =>
                update(
                  'experienceYears',
                  event.target.value === '' ? null : Number(event.target.value),
                )
              }
            />
          </Field>
          <Field label={`${t('education')} *`} id="profile-education" error={errors.education}>
            <Textarea
              id="profile-education"
              value={profile.education}
              onChange={(event) => update('education', event.target.value)}
              required
            />
          </Field>
          <Field label={t('expectedCtc')} id="profile-ctc" error={errors.expectedCtc}>
            <Input
              id="profile-ctc"
              type="number"
              min="0"
              value={profile.expectedCtc ?? ''}
              onChange={(event) =>
                update('expectedCtc', event.target.value === '' ? null : Number(event.target.value))
              }
            />
          </Field>
          <Field label={t('noticePeriod')} id="profile-notice" error={errors.noticePeriodDays}>
            <Input
              id="profile-notice"
              type="number"
              min="0"
              max="365"
              value={profile.noticePeriodDays ?? ''}
              onChange={(event) =>
                update(
                  'noticePeriodDays',
                  event.target.value === '' ? null : Number(event.target.value),
                )
              }
            />
          </Field>
          <Field
            label={t('preferredLocations')}
            id="profile-locations"
            error={errors.preferredLocations}
          >
            <Input
              id="profile-locations"
              value={listValue(profile.preferredLocations)}
              onChange={(event) => setList('preferredLocations', event.target.value)}
              placeholder="Pune, Mumbai, Remote"
            />
          </Field>
          <Field label={t('workMode')} id="profile-workmode" error={errors.workMode}>
            <select
              id="profile-workmode"
              value={profile.workMode ?? ''}
              onChange={(event) =>
                update(
                  'workMode',
                  event.target.value === ''
                    ? null
                    : (event.target.value as 'REMOTE' | 'HYBRID' | 'ONSITE'),
                )
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Choose a mode</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={profile.isOpenToWork}
              onChange={(event) => update('isOpenToWork', event.target.checked)}
              className="mt-1 accent-primary"
            />
            <span>
              <strong>{t('openToWork')}</strong>
              <small className="mt-1 block text-muted-foreground">{t('profileIntro')}</small>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={profile.isDiscoverable}
              onChange={(event) => update('isDiscoverable', event.target.checked)}
              className="mt-1 accent-primary"
            />
            <span>
              <strong>{t('discoveryConsent')}</strong>
              <small className="mt-1 block text-muted-foreground">{t('profileIntro')}</small>
            </span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? t('loading') : t('save')}
          </Button>
          <Button type="button" variant="outline" onClick={() => void load()}>
            {t('discard')}
          </Button>
        </div>
      </form>
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="size-5 text-primary" />
            {t('privateResume')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('resumePrivacy')} {t('resumeAccess')}
          </p>
          {resume ? (
            <a
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-4"
              href={fileUrl(resume.fileKey)}
              target="_blank"
              rel="noreferrer"
            >
              {resume.filename}
            </a>
          ) : (
            <p className="mt-3 text-sm font-medium text-amber-700">{t('noResume')}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="resume-file" className="sr-only">
            {t('privateResume')}
          </Label>
          <Input
            id="resume-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => {
              void upload(event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
            disabled={uploading}
          />
          <p className="text-xs text-muted-foreground">{t('pdfLimit')}</p>
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById('resume-file')?.click()}
          >
            <UploadCloud className="mr-2 size-4" />
            {uploading ? t('uploading') : resume ? t('replaceResume') : t('uploadResume')}
          </Button>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
