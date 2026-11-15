// @polsia:user-owned
import type { Metadata } from 'next';
import { ApplicationTracker } from '@/components/custom/recruitai/seeker-panels';

export const metadata: Metadata = { title: 'Applications — RecruitAI' };

export default function ApplicationsPage() {
  return <ApplicationTracker />;
}
