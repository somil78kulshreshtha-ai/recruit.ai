// @polsia:user-owned — seeded by polsia/modules/better-auth; restyle freely.
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from '@/lib/auth-client';
import { useLocale } from '@/i18n/client-locale';

export function AuthNav() {
  const { t } = useLocale();
  const { data: session, isPending } = useSession();

  // Render nothing until the session resolves — avoids a Sign-in→Profile flash.
  if (isPending) return null;

  if (!session?.user) {
    return (
      <nav className="flex items-center gap-2">
        <Button asChild variant="ghost">
          <Link href="/login">{t('signIn')}</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">{t('authSignUp')}</Link>
        </Button>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2">
      <Button asChild variant="ghost">
        <Link href="/dashboard">{t('navWorkspace')}</Link>
      </Button>
      <Button
        variant="secondary"
        onClick={async () => {
          await signOut();
          window.location.assign('/');
        }}
      >
        {t('signOut')}
      </Button>
    </nav>
  );
}
