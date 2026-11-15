// @polsia:user-owned
'use client';

import { useEffect, useState } from 'react';
import { GoogleSignInButton } from '@/components/polsia/google-sign-in-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/lib/auth-client';

// Email + password sign-up. Composes the template's base shadcn primitives
// (Button/Input/Label) styled through the theme tokens. Restyle freely — this
// file is user-owned. Calls better-auth's authClient.signUp.email; better-auth
// requires a name field, so we collect one. On success the session cookie is
// set by the catch-all route handler and the page reloads.
export function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [accountKind, setAccountKind] = useState<'seeker' | 'company'>('seeker');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('type') === 'company')
      setAccountKind('company');
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      const { error: signUpError } = await signUp.email({
        name,
        email,
        password,
        callbackURL: `/dashboard/setup?kind=${accountKind}`,
      });
      if (signUpError) {
        setError(signUpError.message ?? 'Could not create your account. Try again.');
        return;
      }
      window.location.assign(`/dashboard/setup?kind=${accountKind}`);
    } catch {
      setError('Could not create your account right now. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <Label htmlFor="sign-up-name">Name</Label>
      <Input
        id="sign-up-name"
        name="name"
        type="text"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        aria-invalid={error ? true : undefined}
      />
      <Label htmlFor="sign-up-kind">I am joining as</Label>
      <select
        id="sign-up-kind"
        value={accountKind}
        onChange={(event) =>
          setAccountKind(event.target.value === 'company' ? 'company' : 'seeker')
        }
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="seeker">Job seeker</option>
        <option value="company">Company owner / recruiter</option>
      </select>
      <Label htmlFor="sign-up-email">Email address</Label>
      <Input
        id="sign-up-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-invalid={error ? true : undefined}
      />
      <Label htmlFor="sign-up-password">Password</Label>
      <Input
        id="sign-up-password"
        name="password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        aria-invalid={error ? true : undefined}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
      <GoogleSignInButton callbackURL={`/dashboard/setup?kind=${accountKind}`} />
    </form>
  );
}
