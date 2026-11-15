// @polsia:user-owned
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api-client';

export function WorkspaceSetup({ initialKind }: { initialKind?: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<'seeker' | 'company'>(
    initialKind === 'company' ? 'company' : 'seeker',
  );
  const [company, setCompany] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
    city: '',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await apiFetch('/api/workspace', {
        method: 'POST',
        body: JSON.stringify(kind === 'seeker' ? { kind } : { kind, company }),
      });
      toast.success(
        kind === 'seeker' ? 'Job seeker workspace created' : 'Company workspace created',
      );
      router.push(kind === 'seeker' ? '/dashboard/profile' : '/dashboard/company');
    } catch {
      setError('We could not save this setup. Check the required fields and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Workspace setup
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Choose how you’ll use RecruitAI.</h1>
        <p className="mt-2 text-muted-foreground">
          Administrator access is assigned by trusted setup. This form creates only a seeker profile
          or a company membership for your own account.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setKind('seeker')}
          className={`rounded-2xl border p-5 text-left transition ${kind === 'seeker' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card'}`}
        >
          <strong>Job seeker</strong>
          <p className="mt-2 text-sm text-muted-foreground">
            Build a profile, save roles and track applications.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setKind('company')}
          className={`rounded-2xl border p-5 text-left transition ${kind === 'company' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card'}`}
        >
          <strong>Company owner / recruiter</strong>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a company profile and manage hiring with your team.
          </p>
        </button>
      </div>
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"
      >
        {kind === 'company' ? (
          <>
            <h2 className="text-lg font-semibold">Company details</h2>
            <div className="grid gap-1.5 text-sm">
              <Label htmlFor="setup-company-name">Company name</Label>
              <Input
                id="setup-company-name"
                value={company.name}
                onChange={(event) => setCompany({ ...company, name: event.target.value })}
                required
                minLength={2}
                maxLength={120}
              />
            </div>
            <div className="grid gap-1.5 text-sm">
              <Label htmlFor="setup-company-description">Company description</Label>
              <Textarea
                id="setup-company-description"
                value={company.description}
                onChange={(event) => setCompany({ ...company, description: event.target.value })}
                required
                minLength={20}
                maxLength={3000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5 text-sm">
                <Label htmlFor="setup-company-industry">Industry</Label>
                <Input
                  id="setup-company-industry"
                  value={company.industry}
                  onChange={(event) => setCompany({ ...company, industry: event.target.value })}
                  required
                />
              </div>
              <div className="grid gap-1.5 text-sm">
                <Label htmlFor="setup-company-city">City</Label>
                <Input
                  id="setup-company-city"
                  value={company.city}
                  onChange={(event) => setCompany({ ...company, city: event.target.value })}
                  required
                />
              </div>
              <div className="grid gap-1.5 text-sm sm:col-span-2">
                <Label htmlFor="setup-company-website">Website (optional)</Label>
                <Input
                  id="setup-company-website"
                  type="url"
                  placeholder="https://"
                  value={company.website}
                  onChange={(event) => setCompany({ ...company, website: event.target.value })}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Create your job seeker profile</h2>
            <p className="text-sm text-muted-foreground">
              You can add work history, education and your private PDF resume next.
            </p>
          </>
        )}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending
            ? 'Saving…'
            : kind === 'seeker'
              ? 'Create seeker workspace'
              : 'Create company workspace'}
        </Button>
      </form>
    </div>
  );
}
