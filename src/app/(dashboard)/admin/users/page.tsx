// @polsia:user-owned
import type { Metadata } from 'next';
import { AdminConsole } from '@/components/custom/recruitai/admin-console';

export const metadata: Metadata = { title: 'User management — RecruitAI' };
export default function AdminUsersPage() {
  return <AdminConsole kind="users" />;
}
