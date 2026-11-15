// @polsia:user-owned
import type { Metadata } from 'next';
import { WorkspaceSetup } from '@/components/custom/recruitai/workspace-setup';

export const metadata: Metadata = { title: 'Workspace setup — RecruitAI' };

export default async function WorkspaceSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  return <WorkspaceSetup initialKind={kind} />;
}
