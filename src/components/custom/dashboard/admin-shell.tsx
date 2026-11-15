// @polsia:user-owned
'use client';

import { Bell, ChevronDown, ChevronsLeft, ChevronsRight, LayoutGrid, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { type FormEvent, useEffect, useState } from 'react';
import { EmailVerification } from '@/components/custom/email-verification';
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
import { type NotificationItem, notificationListSchema } from '@/lib/contracts/recruitai';
import { AdminNav } from './admin-nav';

export interface AdminShellProps {
  children: ReactNode;
}

function hasRole(role: string | null | undefined) {
  return (
    role
      ?.split(',')
      .map((item) => item.trim())
      .includes('admin') ?? false
  );
}

export function AdminShell({ children }: AdminShellProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationError, setNotificationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isAdmin = hasRole(session?.user?.role);

  useEffect(() => {
    if (!isPending && !session?.user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isPending, pathname, router, session?.user]);

  useEffect(() => {
    if (!isAdmin) return;
    void apiFetch('/api/notifications', { schema: notificationListSchema })
      .then((data) => setNotifications(data.items))
      .catch(() => setNotificationError('Notifications could not be loaded.'));
  }, [isAdmin]);

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
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

  function searchJobs(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchQuery.trim()) router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
  }

  if (isPending || !session?.user)
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-5">
        <p className="text-sm text-muted-foreground">
          {isPending ? 'Loading admin workspace…' : 'Redirecting to sign in…'}
        </p>
      </main>
    );
  if (!isAdmin)
    return (
      <main className="grid min-h-dvh place-items-center bg-muted/40 px-5 text-foreground">
        <div className="grid w-full max-w-md gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {session.user.emailVerified ? (
            <>
              <h1 className="text-xl font-semibold">Admin access required</h1>
              <p className="text-sm text-muted-foreground">
                This account does not have permission to access platform administration.
              </p>
            </>
          ) : (
            <>
              <EmailVerification email={session.user.email} callbackURL="/admin" />
              <p className="text-sm text-muted-foreground">
                Admin access requires an authorized account with a verified email.
              </p>
            </>
          )}
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to your workspace</Link>
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
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
            {collapsed ? null : <span>RecruitAI Admin</span>}
          </Link>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Platform
            </p>
          ) : null}
          <AdminNav collapsed={collapsed} />
          <Button
            variant="ghost"
            size="sm"
            className={`mt-6 w-full ${collapsed ? 'justify-center px-0' : 'justify-start'}`}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand admin sidebar' : 'Collapse admin sidebar'}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <>
                <ChevronsLeft className="size-4" /> Collapse sidebar
              </>
            )}
          </Button>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
            <div className="flex min-h-[68px] items-center gap-3 px-3 sm:px-6">
              <Link
                href="/admin"
                className="flex shrink-0 items-center gap-2 font-semibold lg:hidden"
              >
                <LayoutGrid className="size-4 text-primary" /> Admin
              </Link>
              <div className="hidden text-sm text-muted-foreground lg:block">
                Administration /{' '}
                <span className="font-medium text-foreground">{session.user.email}</span>
              </div>
              <form
                onSubmit={searchJobs}
                className="relative ml-auto hidden w-full max-w-xs md:block"
              >
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search jobs"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search jobs, skills, companies"
                  className="pl-9"
                />
              </form>
              <div className="ml-auto flex shrink-0 items-center gap-1">
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
                      {t('notifications')}
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
                    <Button
                      variant="outline"
                      size="icon"
                      className="sm:w-auto sm:px-3"
                      aria-label="Open profile menu"
                    >
                      <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {session.user.name?.slice(0, 1).toLocaleUpperCase() ?? 'A'}
                      </span>
                      <span className="hidden max-w-28 truncate sm:inline">
                        {session.user.name ?? 'Account'}
                      </span>
                      <ChevronDown className="hidden size-3 sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <span className="block max-w-[15rem] truncate">{session.user.email}</span>
                      <span className="text-xs font-normal text-muted-foreground">Super admin</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Account settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/">View site</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => void handleSignOut()}
                      className="text-destructive"
                    >
                      {t('signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="border-t border-border px-3 py-2 lg:hidden">
              <AdminNav />
              <form onSubmit={searchJobs} className="relative mt-2">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search jobs"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search jobs, skills, companies"
                  className="pl-9"
                />
              </form>
            </div>
          </header>
          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
