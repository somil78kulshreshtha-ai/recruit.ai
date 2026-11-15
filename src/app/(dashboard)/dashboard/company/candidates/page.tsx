// @polsia:user-owned
import type { Metadata } from 'next';
import { CompanyCandidates } from '@/components/custom/recruitai/company-workspace';

export const metadata: Metadata = { title: 'Candidate search — RecruitAI' };
export default function CompanyCandidatesPage() {
  return <CompanyCandidates />;
}
