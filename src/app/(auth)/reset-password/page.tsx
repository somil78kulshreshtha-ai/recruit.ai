// @polsia:user-owned
import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/custom/password-recovery';
import { T } from '@/i18n/t';

export const metadata: Metadata = { title: 'Choose a new password — RecruitAI' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-lg content-center px-5 py-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <T k="accountRecovery" />
        </p>
        <h1 className="mb-6 mt-3 text-3xl font-semibold">
          <T k="chooseNewPassword" />
        </h1>
        <ResetPasswordForm token={token ?? ''} />
      </div>
    </main>
  );
}
