// @polsia:user-owned
import type { Metadata } from 'next';
import { AdminConsole } from '@/components/custom/recruitai/admin-console';

export const metadata: Metadata = { title: 'Job moderation — RecruitAI' };
export default function AdminJobsPage() {
  return <AdminConsole kind="jobs" />;
}
