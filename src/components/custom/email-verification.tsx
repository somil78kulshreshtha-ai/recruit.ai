// @polsia:user-owned
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useLocale } from '@/i18n/client-locale';

export function EmailVerification({
  email,
  callbackURL = '/profile',
}: {
  email: string;
  callbackURL?: string;
}) {
  const { t } = useLocale();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  async function resend() {
    setPending(true);
    setSent(false);
    setFailed(false);
    try {
      const result = await authClient.sendVerificationEmail({ email, callbackURL });
      if (result.error) setFailed(true);
      else setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('verifyEmailTitle')}</h2>
      <p className="text-sm text-muted-foreground">
        {t('verifyEmailBody', { email })}
      </p>
      {sent ? <output>{t('verifyEmailSent')}</output> : null}
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          {t('verifyEmailFailed')}
        </p>
      ) : null}
      <Button type="button" onClick={resend} disabled={pending}>
        {pending ? t('sendingEllipsis') : t('resendVerification')}
      </Button>
    </div>
  );
}
