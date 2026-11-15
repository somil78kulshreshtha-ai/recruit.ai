// @polsia:user-owned

export type ApplicationWritePlan =
  | { kind: 'create' }
  | { kind: 'return_existing'; applicationId: string };

export function applicationWritePlan(existingId: string | null): ApplicationWritePlan {
  return existingId ? { kind: 'return_existing', applicationId: existingId } : { kind: 'create' };
}
