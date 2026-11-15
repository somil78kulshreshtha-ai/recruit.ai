// @polsia:user-owned
import type { Metadata } from 'next';
import { SeekerProfile } from '@/components/custom/recruitai/seeker-profile';

export const metadata: Metadata = { title: 'Job seeker profile — RecruitAI' };

export default function SeekerProfilePage() {
  return <SeekerProfile />;
}
