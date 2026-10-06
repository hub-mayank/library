export type LoanStatus =
  'pending' | 'issued' | 'returned' | 'rejected' | 'cancelled';

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: LoanStatus,
    public readonly to: LoanStatus,
  ) {
    super(`Invalid loan transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export const canTransition = (from: LoanStatus, to: LoanStatus): boolean =>
  (from === 'pending' &&
    (to === 'issued' || to === 'rejected' || to === 'cancelled')) ||
  (from === 'issued' && to === 'returned');

export const assertTransition = (from: LoanStatus, to: LoanStatus): void => {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
};

// Cancellation is a deliberate improvement over the legacy app, where members could not cancel.
export const isActive = (status: LoanStatus): boolean =>
  status === 'pending' || status === 'issued';
