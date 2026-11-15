// @polsia:user-owned
import type { Metadata } from 'next';
import { AdminOverview } from '@/components/custom/recruitai/admin-console';

export const metadata: Metadata = { title: 'Admin overview — RecruitAI' };

export default function AdminPage() {
  return <AdminOverview />;
}
