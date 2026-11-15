// @polsia:user-owned
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

export function AccountSettings({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pending, setPending] = useState(false);

  async function saveName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await authClient.updateUser({ name });
      if (result.error) throw new Error(result.error.message);
      toast.success('Account name updated');
    } catch {
      toast.error('Account name could not be updated.');
    } finally {
      setPending(false);
    }
  }
  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) throw new Error(result.error.message);
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password changed. Other sessions were signed out.');
    } catch {
      toast.error('Password could not be changed. Check your current password and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={saveName} className="grid gap-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Account name</h2>
        <div className="grid gap-1 text-sm">
          <Label htmlFor="account-name">Name</Label>
          <Input
            id="account-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={100}
          />
        </div>
        <Button type="submit" disabled={pending}>
          Save name
        </Button>
      </form>
      <form
        onSubmit={changePassword}
        className="grid gap-3 rounded-xl border border-border bg-card p-5"
      >
        <h2 className="font-semibold">Change password</h2>
        <div className="grid gap-1 text-sm">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-1 text-sm">
          <Label htmlFor="updated-password">New password</Label>
          <Input
            id="updated-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          Change password
        </Button>
      </form>
    </div>
  );
}
