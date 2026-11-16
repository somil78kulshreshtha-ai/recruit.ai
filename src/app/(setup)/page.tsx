// @polsia:user-owned — RecruitAI public homepage.
import type { Metadata } from 'next';
import SimpleLanding from '@/components/custom/simple-landing';
import { siteDescription, siteName } from '@/lib/brand';

export const metadata: Metadata = {
  title: { absolute: `${siteName} — Jobs that actually follow up` },
  description: siteDescription,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <SimpleLanding />;
}
