import { describe, expect, it } from 'vitest';
import { applicationWritePlan } from '@/lib/business/application-idempotency';

describe('RecruitAI application duplicate prevention', () => {
  it('returns the existing application instead of planning another create', () => {
    expect(applicationWritePlan('application-existing')).toEqual({
      kind: 'return_existing',
      applicationId: 'application-existing',
    });
  });

  it('creates only when the seeker/job pair has no existing application', () => {
    expect(applicationWritePlan(null)).toEqual({ kind: 'create' });
  });
});
