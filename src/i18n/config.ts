// @polsia:user-owned — your app's locales. Add a locale here AND add a matching
// messages/<locale>.json with the SAME keys as every other locale file (a missing
// key throws MISSING_MESSAGE). `defaultLocale` is what `/` and unknown locales use.
export const locales = ['en', 'hi', 'mr'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
