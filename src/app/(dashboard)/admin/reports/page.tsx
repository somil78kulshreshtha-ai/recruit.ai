// @polsia:user-owned
import type { Metadata } from 'next';
import { AdminConsole } from '@/components/custom/recruitai/admin-console';

export const metadata: Metadata = { title: 'Scam report review — RecruitAI' };
export default function AdminReportsPage() {
  return <AdminConsole kind="reports" />;
}
