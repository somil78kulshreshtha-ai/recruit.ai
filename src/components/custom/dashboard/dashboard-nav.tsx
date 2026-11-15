// @polsia:user-owned
'use client';

import {
  Bell,
  BriefcaseBusiness,
  Building2,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type MessageKey, useLocale } from '@/i18n/client-locale';
import { cn } from '@/lib/utils';

const items: {
  href: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  base: boolean;
  admin?: boolean;
}[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, base: true },
  { href: '/dashboard/profile', labelKey: 'profile', icon: UserRound, base: true },
  { href: '/dashboard/applications', labelKey: 'applications', icon: FileText, base: true },
  { href: '/dashboard/saved', labelKey: 'saved', icon: Bell, base: true },
  { href: '/dashboard/alerts', labelKey: 'alerts', icon: Search, base: true },
  { href: '/dashboard/company', labelKey: 'company', icon: Building2, base: false },
  {
    href: '/dashboard/company/applications',
    labelKey: 'applications',
    icon: FileText,
    base: false,
  },
  { href: '/dashboard/company/candidates', labelKey: 'candidates', icon: UsersRound, base: false },
  { href: '/dashboard/company/jobs', labelKey: 'jobs', icon: BriefcaseBusiness, base: false },
  { href: '/dashboard/company/team', labelKey: 'team', icon: UsersRound, base: false },
  { href: '/admin', labelKey: 'adminOverview', icon: ShieldCheck, base: false, admin: true },
];

export function DashboardNav({
  hasCompany,
  isAdmin,
  collapsed = false,
}: {
  hasCompany: boolean;
  isAdmin: boolean;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <nav
      aria-label="Workspace"
      className="flex gap-1 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0"
    >
      {items
        .filter((item) => item.base || (item.admin ? isAdmin : hasCompany))
        .map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? t(item.labelKey) : undefined}
              className={cn(
                'flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'lg:justify-center lg:px-0',
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className={cn(collapsed && 'lg:sr-only')}>{t(item.labelKey)}</span>
            </Link>
          );
        })}
    </nav>
  );
}
