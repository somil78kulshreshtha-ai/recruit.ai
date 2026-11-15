// @polsia:user-owned
import type { Metadata } from 'next';
import { SavedJobs } from '@/components/custom/recruitai/seeker-panels';

export const metadata: Metadata = { title: 'Saved jobs — RecruitAI' };

export default function SavedJobsPage() {
  return <SavedJobs />;
}
