// @polsia:user-owned
import type { Metadata } from 'next';
import { JobAlerts } from '@/components/custom/recruitai/seeker-panels';

export const metadata: Metadata = { title: 'Job alerts — RecruitAI' };

export default function JobAlertsPage() {
  return <JobAlerts />;
}
