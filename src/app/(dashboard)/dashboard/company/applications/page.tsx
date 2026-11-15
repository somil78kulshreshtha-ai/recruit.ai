// @polsia:user-owned
import type { Metadata } from 'next';
import { CompanyApplications } from '@/components/custom/recruitai/company-workspace';

export const metadata: Metadata = { title: 'Applicant pipeline — RecruitAI' };
export default function CompanyApplicationsPage() {
  return <CompanyApplications />;
}
