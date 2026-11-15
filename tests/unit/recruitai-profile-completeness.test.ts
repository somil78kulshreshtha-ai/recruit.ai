import { describe, expect, it } from 'vitest';
import { calculateProfileCompleteness } from '@/lib/business/profile-completeness';

const emptyProfile = {
  fullName: '', skills: [], experienceYears: null, education: '', expectedCtc: null,
  noticePeriodDays: null, preferredLocations: [], workMode: null, resumeKey: null,
};

describe('RecruitAI profile completeness', () => {
  it('reports an empty profile as 0% complete', () => {
    expect(calculateProfileCompleteness(emptyProfile)).toEqual({
      percentage: 0,
      completed: 0,
      total: 9,
      missing: ['Name', 'Skills', 'Experience', 'Education', 'Expected CTC', 'Notice period', 'Preferred locations', 'Work mode', 'PDF resume'],
    });
  });

  it('counts partial profile fields without rounding up missing items', () => {
    const partial = calculateProfileCompleteness({ ...emptyProfile, fullName: 'Aarav Shah', skills: ['React'], education: 'BSc' });
    expect(partial.completed).toBe(3);
    expect(partial.total).toBe(9);
    expect(partial.percentage).toBe(33);
    expect(partial.missing).toContain('PDF resume');
  });

  it('reports a fully completed profile as 100%', () => {
    expect(calculateProfileCompleteness({
      fullName: 'Aarav Shah', skills: ['React'], experienceYears: 3, education: 'BSc',
      expectedCtc: 1200000, noticePeriodDays: 30, preferredLocations: ['Pune'], workMode: 'HYBRID', resumeKey: 'private/key.pdf',
    })).toEqual({ percentage: 100, completed: 9, total: 9, missing: [] });
  });
});
