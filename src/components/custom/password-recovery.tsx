// @polsia:user-owned
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/i18n/client-locale';

export function PasswordResetRequest() {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, redirectTo: '/reset-password' }),
      });
      if (!response.ok) throw new Error(t('resetRequestFailed'));
      setMessage(t('resetSent'));
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : t('resetRequestDefault'),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <Label htmlFor="reset-email">{t('emailAddress')}</Label>
      <Input
        id="reset-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      {message ? <output className="text-sm text-emerald-700">{message}</output> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t('sendingEllipsis') : t('sendResetLink')}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useLocale();
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ newPassword: password, token }),
      });
      if (!response.ok)
        throw new Error(t('resetLinkInvalid'));
      setDone(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : t('resetDefaultError'),
      );
    } finally {
      setPending(false);
    }
  }

  if (!token)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t('resetTokenMissing')}
      </p>
    );
  if (done)
    return (
      <output className="text-sm text-emerald-700">{t('resetDone')}</output>
    );
  return (
    <form onSubmit={submit} className="grid gap-3">
      <Label htmlFor="new-password">{t('newPassword')}</Label>
      <Input
        id="new-password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t('savingEllipsis') : t('updatePassword')}
      </Button>
    </form>
  );
}
