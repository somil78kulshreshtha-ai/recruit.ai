// @polsia:user-owned
import type { Metadata } from 'next';
import { AdminFollowUp } from '@/components/custom/recruitai/admin-follow-up';

export const metadata: Metadata = { title: 'Employer follow-up — RecruitAI' };
export default function AdminFollowUpPage() {
  return <AdminFollowUp />;
}
