// @polsia:user-owned
import type { Metadata } from 'next';
import { AdminConsole } from '@/components/custom/recruitai/admin-console';

export const metadata: Metadata = { title: 'Application oversight — RecruitAI' };
export default function AdminApplicationsPage() {
  return <AdminConsole kind="applications" />;
}
