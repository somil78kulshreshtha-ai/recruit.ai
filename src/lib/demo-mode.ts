// @polsia:user-owned
// Demo mode: when the DEMO_MODE environment variable is "1" (or "true"), the public job search also
// lists the sample jobs flagged isDemo = true, each with a visible demo label. Applying to and
// saving demo jobs stays disabled. Leave DEMO_MODE unset in production.
export function demoModeEnabled(): boolean {
  const value = process.env.DEMO_MODE?.toLowerCase();
  return value === '1' || value === 'true';
}
