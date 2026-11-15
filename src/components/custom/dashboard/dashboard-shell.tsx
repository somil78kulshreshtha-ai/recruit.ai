// @polsia:user-owned
'use client';

import { Bell, ChevronDown, ChevronsLeft, ChevronsRight, LayoutGrid, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { LanguageSwitcher } from '@/components/custom/language-switcher';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/i18n/client-locale';
import { apiFetch } from '@/lib/api-client';
import { signOut, useSession } from '@/lib/auth-client';
import { colorTheme } from '@/lib/color-theme';
import {
  type NotificationItem,
  notificationListSchema,
  workspaceOutputSchema,
} from '@/lib/contracts/recruitai';
import { DashboardNav } from './dashboard-nav';

export interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [hasCompany, setHasCompany] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationError, setNotificationError] = useState('');
  const isAdmin =
    session?.user?.role
      ?.split(',')
      .map((role) => role.trim())
      .includes('admin') ?? false;
  const crumbs = useMemo(
    () =>
      pathname
        .split('/')
        .filter(Boolean)
        .map((part, index, all) => ({
          label: part.replaceAll('-', ' '),
          href: `/${all.slice(0, index + 1).join('/')}`,
        })),
    [pathname],
  );

  useEffect(() => {
    if (!isPending && !session?.user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isPending, pathname, router, session?.user]);

  useEffect(() => {
    if (!session?.user) return;
    void apiFetch('/api/workspace', { schema: workspaceOutputSchema })
      .then((data) => setHasCompany(data.companies.length > 0))
      .catch(() => setHasCompany(false));
    void apiFetch('/api/notifications', { schema: notificationListSchema })
      .then((data) => setNotifications(data.items))
      .catch(() => setNotificationError('Notifications could not be loaded.'));
  }, [session?.user]);

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  async function openNotification(item: NotificationItem) {
    try {
      if (!item.readAt)
        await apiFetch('/api/notifications', {
          method: 'PATCH',
          body: JSON.stringify({ id: item.id }),
        });
      setNotifications((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry,
        ),
      );
      router.push(item.href);
    } catch {
      setNotificationError('Could not mark this notification as read.');
    }
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (term) router.push(`/jobs?q=${encodeURIComponent(term)}`);
  }

  if (isPending || !session?.user)
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          {isPending ? t('loading') : 'Opening sign in…'}
        </p>
      </main>
    );

  return (
    <main className="min-h-dvh bg-muted/35 text-foreground">
      <div className="flex min-h-dvh">
        <aside
          className={`hidden shrink-0 border-r border-border bg-background p-4 transition-[width] duration-200 lg:block ${collapsed ? 'w-[84px]' : 'w-[260px]'}`}
        >
          <Link
            href="/"
            className={`mb-9 flex h-12 items-center gap-3 rounded-xl px-2 font-semibold tracking-tight ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <LayoutGrid className="size-4" />
            </span>
            {collapsed ? null : <span>RecruitAI</span>}
          </Link>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Workspace
            </p>
          ) : null}
          <DashboardNav hasCompany={hasCompany} isAdmin={isAdmin} collapsed={collapsed} />
          <div className="mt-8 border-t border-border pt-4">
            {!collapsed ? (
              <p className="mb-3 px-3 text-xs text-muted-foreground">AI assists. Humans decide.</p>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start'}`}
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronsRight className="size-4" />
              ) : (
                <>
                  <ChevronsLeft className="size-4" /> Collapse sidebar
                </>
              )}
            </Button>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
            <div className="mx-auto flex min-h-[68px] max-w-[1600px] items-center gap-2 px-4 sm:px-6">
              <Link
                href="/"
                className="mr-2 flex shrink-0 items-center gap-2 font-semibold lg:hidden"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <LayoutGrid className="size-4" />
                </span>
                RecruitAI
              </Link>
              <nav
                className="hidden min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground sm:flex"
                aria-label="Breadcrumb"
              >
                <Link href="/dashboard" className="hover:text-foreground">
                  Workspace
                </Link>
                {crumbs.map((crumb, index) => (
                  <span key={crumb.href} className="flex min-w-0 items-center gap-2">
                    <span aria-hidden="true">/</span>
                    {index === crumbs.length - 1 ? (
                      <span className="truncate capitalize text-foreground">{crumb.label}</span>
                    ) : (
                      <Link className="truncate capitalize hover:text-foreground" href={crumb.href}>
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
              <form onSubmit={search} className="relative ml-auto hidden w-full max-w-sm md:block">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search jobs"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search jobs, skills, companies"
                  className="pl-9"
                />
              </form>
              {colorTheme === 'system' ? <ThemeToggle /> : null}
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Notifications${notifications.some((item) => !item.readAt) ? ', unread' : ''}`}
                    className="relative"
                  >
                    <Bell className="size-4" />
                    {notifications.some((item) => !item.readAt) ? (
                      <span className="absolute right-1 top-1 size-2 rounded-full bg-violet-500" />
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))]">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Notifications{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      {notifications.filter((item) => !item.readAt).length} unread
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notificationError ? (
                    <p className="px-3 py-2 text-xs text-destructive">{notificationError}</p>
                  ) : null}
                  {notifications.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-muted-foreground">{t('empty')}</p>
                  ) : (
                    notifications.slice(0, 8).map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        onSelect={(event) => {
                          event.preventDefault();
                          void openNotification(item);
                        }}
                        className="cursor-pointer whitespace-normal"
                      >
                        <span className="grid gap-1">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.body}</span>
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="max-w-[10rem] gap-2">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {session.user.name?.slice(0, 1).toLocaleUpperCase() ?? 'R'}
                    </span>
                    <span className="hidden truncate sm:inline">
                      {session.user.name ?? 'Account'}
                    </span>
                    <ChevronDown className="size-3 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <span className="block max-w-[15rem] truncate">{session.user.email}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {isAdmin ? 'Super admin' : hasCompany ? 'Company member' : 'Job seeker'}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Account settings</Link>
                  </DropdownMenuItem>
                  {isAdmin ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin workspace</Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onSelect={() => void handleSignOut()}
                    className="text-destructive"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="border-t border-border px-3 py-2 lg:hidden">
              <DashboardNav hasCompany={hasCompany} isAdmin={isAdmin} />
            </div>
          </header>
          <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <section className="min-w-0">{children}</section>
          </div>
        </div>
      </div>
    </main>
  );
}
