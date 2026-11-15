// @polsia:user-owned
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { GoogleSignInButton } from '@/components/polsia/google-sign-in-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth-client';

// Email + password sign-in. Composes the template's base shadcn primitives
// (Button/Input/Label) styled through the theme tokens. Restyle freely — this
// file is user-owned. Calls better-auth's authClient.signIn.email; on success
// the session cookie is set by the catch-all route handler and the page reloads.
export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<'password' | 'otp' | 'mobile'>('password');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  function destination() {
    const next = new URL(window.location.href).searchParams.get('next');
    return next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\')
      ? next
      : '/dashboard';
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      const { error: signInError } = await signIn.email({ email, password });
      if (signInError) {
        setError(signInError.message ?? 'Could not sign in. Check your details.');
        return;
      }
      window.location.assign(destination());
    } catch {
      setError('Could not sign in right now. Please try again.');
    } finally {
      setPending(false);
    }
  }

  async function sendOtp() {
    setPending(true);
    setError(undefined);
    try {
      const response = await fetch('/api/auth/email-otp/send-verification-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, type: 'sign-in' }),
      });
      if (!response.ok) throw new Error('Email delivery failed. Please try again shortly.');
      setOtpSent(true);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not send a sign-in code.');
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      const response = await fetch('/api/auth/sign-in/email-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, otp, name }),
      });
      if (!response.ok) throw new Error('That code could not be verified. Check it and try again.');
      window.location.assign(destination());
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Could not verify the code.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <fieldset className="mb-5 min-w-0 rounded-lg bg-muted p-1">
        <legend className="sr-only">Sign-in method</legend>
        <div className="grid grid-cols-3">
          <button
            className={`rounded-md px-2 py-2 text-xs font-medium ${mode === 'password' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            type="button"
            onClick={() => {
              setMode('password');
              setError(undefined);
            }}
          >
            Password
          </button>
          <button
            className={`rounded-md px-2 py-2 text-xs font-medium ${mode === 'otp' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            type="button"
            onClick={() => {
              setMode('otp');
              setError(undefined);
            }}
          >
            Email OTP
          </button>
          <button
            className={`rounded-md px-2 py-2 text-xs font-medium ${mode === 'mobile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            type="button"
            onClick={() => {
              setMode('mobile');
              setError(undefined);
            }}
          >
            Mobile OTP
          </button>
        </div>
      </fieldset>
      {mode === 'password' ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          <Label htmlFor="sign-in-email">Email address</Label>
          <Input
            id="sign-in-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={error ? true : undefined}
          />
          <Link
            href="/forgot-password"
            className="self-end text-sm text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
          <Label htmlFor="sign-in-password">Password</Label>
          <Input
            id="sign-in-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-invalid={error ? true : undefined}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
          <GoogleSignInButton />
        </form>
      ) : null}
      {mode === 'otp' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!otpSent) void sendOtp();
            else void verifyOtp(event);
          }}
          className="flex flex-col gap-3"
          noValidate
        >
          <Label htmlFor="otp-email">Email address</Label>
          <Input
            id="otp-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {otpSent ? (
            <>
              <Label htmlFor="otp-name">Your name (for a new account)</Label>
              <Input
                id="otp-name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Label htmlFor="email-otp">6-digit code</Label>
              <Input
                id="email-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                minLength={6}
                maxLength={6}
                required
              />
            </>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending || !email}>
            {pending ? 'Please wait…' : otpSent ? 'Verify and sign in' : 'Send email code'}
          </Button>
          {otpSent ? (
            <button
              type="button"
              className="text-sm text-primary underline-offset-4 hover:underline"
              onClick={() => void sendOtp()}
            >
              Send a new code
            </button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Codes expire after five minutes. Email verification is completed by a successful OTP
            sign-in.
          </p>
        </form>
      ) : null}
      {mode === 'mobile' ? (
        <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
          <p className="font-medium">Mobile OTP is not configured</p>
          <p className="mt-1 text-muted-foreground">
            A real SMS provider and credentials are required before this sign-in method can send
            codes.
          </p>
        </div>
      ) : null}
    </>
  );
}
