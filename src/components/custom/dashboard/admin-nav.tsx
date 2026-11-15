// @polsia:user-owned
'use client';

import {
  Building2,
  ClipboardList,
  Flag,
  LayoutDashboard,
  type LucideIcon,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type MessageKey, useLocale } from '@/i18n/client-locale';
import { cn } from '@/lib/utils';

const items: { href: string; labelKey: MessageKey; icon: LucideIcon }[] = [
  { href: '/admin', labelKey: 'adminOverview', icon: LayoutDashboard },
  { href: '/admin/users', labelKey: 'adminUsers', icon: Users },
  { href: '/admin/companies', labelKey: 'adminCompanies', icon: Building2 },
  { href: '/admin/jobs', labelKey: 'adminJobs', icon: ShieldCheck },
  { href: '/admin/applications', labelKey: 'adminApplications', icon: ClipboardList },
  { href: '/admin/reports', labelKey: 'adminReports', icon: Flag },
];

export function AdminNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <nav
      aria-label="Admin workspace"
      className="flex gap-1 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
        const label = t(item.labelKey);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              'flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              collapsed && 'lg:justify-center lg:px-0',
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className={cn(collapsed && 'lg:sr-only')}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
