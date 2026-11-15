// @polsia:user-owned
import type { Metadata } from 'next';
import { CompanyJobs } from '@/components/custom/recruitai/company-workspace';

export const metadata: Metadata = { title: 'Company jobs — RecruitAI' };
export default function CompanyJobsPage() {
  return <CompanyJobs />;
}
