// @polsia:user-owned
// Use <T k="loginTitle" /> inside server components (pages) to show translated text.
'use client';

import { type MessageKey, useLocale } from '@/i18n/client-locale';

export function T({
  k,
  values,
}: {
  k: MessageKey;
  values?: Record<string, string | number>;
}) {
  const { t } = useLocale();
  return <>{t(k, values)}</>;
}
