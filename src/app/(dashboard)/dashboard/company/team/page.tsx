// @polsia:user-owned
import type { Metadata } from 'next';
import { CompanyTeam } from '@/components/custom/recruitai/company-workspace';

export const metadata: Metadata = { title: 'Company team — RecruitAI' };
export default function CompanyTeamPage() {
  return <CompanyTeam />;
}
