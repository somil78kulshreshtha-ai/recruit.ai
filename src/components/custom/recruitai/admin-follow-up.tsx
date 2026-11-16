// @polsia:user-owned
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/i18n/client-locale';
import { apiFetch } from '@/lib/api-client';

interface FollowUpData {
  windowDays: number;
  overdueAfterDays: number;
  totals: {
    applications: number;
    responseRate: number;
    medianResponseHours: number | null;
    overdue: number;
  };
  companies: {
    companyId: string;
    name: string;
    applications: number;
    responseRate: number;
    medianResponseHours: number | null;
    waiting: number;
    overdue: number;
  }[];
}

export function AdminFollowUp() {
  const { t } = useLocale();
  const [data, setData] = useState<FollowUpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await apiFetch<FollowUpData>('/api/admin/follow-up'));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function duration(hours: number | null) {
    if (hours === null) return '—';
    return hours < 24
      ? t('fuHours', { n: Math.round(hours) })
      : t('fuDays', { n: Math.round(hours / 24) });
  }

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('fuTitle')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('fuIntro')}</p>
      </header>

      {loading ? <p className="text-sm text-muted-foreground">{t('loading')}</p> : null}

      {failed ? (
        <div className="flex items-center gap-3 text-sm">
          <p role="alert">{t('fuLoadError')}</p>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            {t('retry')}
          </Button>
        </div>
      ) : null}

      {data ? (
        <>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-4">
              <dt className="text-xs text-muted-foreground">{t('fuRate')}</dt>
              <dd className="mt-1 text-2xl font-semibold">{data.totals.responseRate}%</dd>
            </div>
            <div className="rounded-xl border border-border p-4">
              <dt className="text-xs text-muted-foreground">{t('fuMedian')}</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {duration(data.totals.medianResponseHours)}
              </dd>
            </div>
            <div className="rounded-xl border border-border p-4">
              <dt className="text-xs text-muted-foreground">{t('fuOverdue')}</dt>
              <dd className="mt-1 text-2xl font-semibold">{data.totals.overdue}</dd>
            </div>
          </dl>

          {data.companies.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('fuNone')}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('fuCompany')}</th>
                    <th className="px-4 py-3 font-medium">{t('fuApplications')}</th>
                    <th className="px-4 py-3 font-medium">{t('fuRate')}</th>
                    <th className="px-4 py-3 font-medium">{t('fuMedian')}</th>
                    <th className="px-4 py-3 font-medium">{t('fuWaiting')}</th>
                    <th className="px-4 py-3 font-medium">{t('fuOverdue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.companies.map((row) => (
                    <tr key={row.companyId} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3">{row.applications}</td>
                      <td className="px-4 py-3">{row.responseRate}%</td>
                      <td className="px-4 py-3">{duration(row.medianResponseHours)}</td>
                      <td className="px-4 py-3">{row.waiting}</td>
                      <td className={row.overdue > 0 ? 'px-4 py-3 font-semibold text-destructive' : 'px-4 py-3'}>
                        {row.overdue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
