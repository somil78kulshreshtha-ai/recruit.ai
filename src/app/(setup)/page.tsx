// @polsia:user-owned — RecruitAI public homepage.
import type { Metadata } from 'next';
import RecruitAILanding from '@/components/custom/recruitai-landing';
import { siteDescription, siteName } from '@/lib/brand';

export const metadata: Metadata = {
  title: { absolute: `${siteName} — Smarter hiring, from first search to successful hire` },
  description: siteDescription,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <RecruitAILanding />;
}
