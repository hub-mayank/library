import { fail, ok, Result } from './result';

export const issueCopy = (available: number): number => {
  if (available <= 0) {
    throw new RangeError(`No available copies: ${available}`);
  }

  return available - 1;
};

export const returnCopy = (available: number, total: number): number => {
  if (available >= total) {
    throw new RangeError(`Available copies exceed issued copies: ${available}`);
  }

  return available + 1;
};

export const computeAvailableOnEdit = (
  oldTotal: number,
  oldAvailable: number,
  newTotal: number,
): Result<number, 'below_issued_count' | 'invalid_total'> => {
  if (!Number.isInteger(newTotal) || newTotal < 1) {
    return fail('invalid_total');
  }

  const issued = oldTotal - oldAvailable;

  if (newTotal < issued) {
    return fail('below_issued_count');
  }

  return ok(newTotal - issued);
};
