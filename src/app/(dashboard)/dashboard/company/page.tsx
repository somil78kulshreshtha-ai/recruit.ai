// @polsia:user-owned
import type { Metadata } from 'next';
import { CompanyWorkspace } from '@/components/custom/recruitai/company-workspace';

export const metadata: Metadata = { title: 'Company workspace — RecruitAI' };
export default function CompanyPage() {
  return <CompanyWorkspace />;
}
