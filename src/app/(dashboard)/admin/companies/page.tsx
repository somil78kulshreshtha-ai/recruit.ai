// @polsia:user-owned
import type { Metadata } from 'next';
import { AdminConsole } from '@/components/custom/recruitai/admin-console';

export const metadata: Metadata = { title: 'Company moderation — RecruitAI' };
export default function AdminCompaniesPage() {
  return <AdminConsole kind="companies" />;
}
