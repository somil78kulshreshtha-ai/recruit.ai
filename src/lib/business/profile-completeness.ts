// @polsia:user-owned

export interface ProfileCompletenessInput {
  fullName: string;
  skills: string[];
  experienceYears: number | null;
  education: string;
  expectedCtc: number | null;
  noticePeriodDays: number | null;
  preferredLocations: string[];
  workMode: string | null;
  resumeKey: string | null;
}

export interface ProfileCompleteness {
  percentage: number;
  completed: number;
  total: number;
  missing: string[];
}

const profileFields: Array<{
  label: string;
  isComplete: (profile: ProfileCompletenessInput) => boolean;
}> = [
  { label: 'Name', isComplete: (profile) => profile.fullName.trim().length >= 2 },
  { label: 'Skills', isComplete: (profile) => profile.skills.length > 0 },
  { label: 'Experience', isComplete: (profile) => profile.experienceYears !== null },
  { label: 'Education', isComplete: (profile) => profile.education.trim().length > 0 },
  { label: 'Expected CTC', isComplete: (profile) => profile.expectedCtc !== null },
  { label: 'Notice period', isComplete: (profile) => profile.noticePeriodDays !== null },
  { label: 'Preferred locations', isComplete: (profile) => profile.preferredLocations.length > 0 },
  { label: 'Work mode', isComplete: (profile) => profile.workMode !== null },
  { label: 'PDF resume', isComplete: (profile) => profile.resumeKey !== null },
];

export function calculateProfileCompleteness(
  profile: ProfileCompletenessInput,
): ProfileCompleteness {
  const missing = profileFields
    .filter((field) => !field.isComplete(profile))
    .map((field) => field.label);
  const completed = profileFields.length - missing.length;
  return {
    percentage: Math.round((completed / profileFields.length) * 100),
    completed,
    total: profileFields.length,
    missing,
  };
}
