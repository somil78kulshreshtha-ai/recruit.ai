// @polsia:user-owned
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PasswordResetRequest() {
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
      if (!response.ok) throw new Error('Could not request a reset email. Please try again.');
      setMessage('If that account exists, a password reset link has been sent.');
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Could not request a reset email.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <Label htmlFor="reset-email">Email address</Label>
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
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
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
        throw new Error('This reset link is invalid or expired. Request a new one.');
      setDone(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Could not reset the password.',
      );
    } finally {
      setPending(false);
    }
  }

  if (!token)
    return (
      <p role="alert" className="text-sm text-destructive">
        Reset token is missing. Request a new reset link.
      </p>
    );
  if (done)
    return (
      <output className="text-sm text-emerald-700">Password updated. You can now sign in.</output>
    );
  return (
    <form onSubmit={submit} className="grid gap-3">
      <Label htmlFor="new-password">New password</Label>
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
        {pending ? 'Saving…' : 'Update password'}
      </Button>
    </form>
  );
}
