// @polsia:user-owned
import type { Metadata } from 'next';
import { PasswordResetRequest } from '@/components/custom/password-recovery';

export const metadata: Metadata = { title: 'Reset password — RecruitAI' };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-lg content-center px-5 py-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Account recovery
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Reset your password</h1>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">
          We’ll email a secure reset link if the account is registered.
        </p>
        <PasswordResetRequest />
      </div>
    </main>
  );
}
