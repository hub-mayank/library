export type Result<T = void, E extends string = string> =
  { ok: true; value: T } | { ok: false; reason: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const fail = <E extends string>(reason: E): Result<never, E> => ({
  ok: false,
  reason,
});
