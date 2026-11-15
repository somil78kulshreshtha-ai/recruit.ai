// @polsia:user-owned
'use client';

import { useState } from 'react';
import { useLocale } from '@/i18n/client-locale';
import { type Locale, locales } from '@/i18n/config';

const labels: Record<Locale, string> = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' };

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [error, setError] = useState('');

  async function change(value: string) {
    setError('');
    try {
      const next = locales.find((item) => item === value);
      if (next) await setLocale(next);
    } catch {
      setError('Language could not be saved.');
    }
  }

  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={locale}
        onChange={(event) => void change(event.target.value)}
        className="h-9 rounded-md border border-border bg-background px-2 text-foreground"
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {labels[item]}
          </option>
        ))}
      </select>
      {error ? <span role="alert">{error}</span> : null}
    </label>
  );
}
