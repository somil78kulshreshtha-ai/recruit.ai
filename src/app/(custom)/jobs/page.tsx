// @polsia:user-owned
import type { Metadata } from 'next';
import { JobsSearch } from '@/components/custom/recruitai/jobs-search';

export const metadata: Metadata = {
  title: 'Find jobs — RecruitAI',
  description: 'Search open RecruitAI roles and apply using your saved profile.',
};

export default function JobsPage() {
  return (
    <main className="mx-auto min-h-[75vh] max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <JobsSearch />
    </main>
  );
}
