// @polsia:user-owned
import type { Metadata } from 'next';
import { WorkspaceOverview } from '@/components/custom/recruitai/workspace-overview';

export const metadata: Metadata = { title: 'Workspace — RecruitAI' };

export default function DashboardPage() {
  return <WorkspaceOverview />;
}
