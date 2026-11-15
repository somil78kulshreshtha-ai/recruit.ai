// @polsia:user-owned — language switcher; style/place freely (drop it in your nav,
// under <I18nProvider>). POSTs /api/locale to set the cookie, then refreshes.
'use client';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { locales } from '@/i18n/config';
import { apiFetch } from '@/lib/api-client';

export function LocaleSwitcher() {
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function select(locale: string) {
    if (locale === current) return;
    startTransition(async () => {
      await apiFetch('/api/locale', {
        method: 'POST',
        body: JSON.stringify({ locale }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={pending || locale === current}
          onClick={() => select(locale)}
          aria-current={locale === current}
          className="rounded px-2 py-1 font-mono text-xs uppercase tracking-wide disabled:opacity-50"
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
