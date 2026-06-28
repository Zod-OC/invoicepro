import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract a human-facing message from a caught value of unknown type. catch
 * bindings are `unknown`, so the `err.message` access needs an instanceof
 * guard; centralizing the guard means future tightening (e.g. also surfacing
 * DOMException names, scrubbing sensitive detail) lands in one place rather
 * than at every catch site. Returns `fallback` when the value isn't an Error
 * (a string thrown, null, a non-Error object) OR when it is an Error whose
 * message is empty/whitespace — preserving the `err.message || fallback`
 * coercion master's three catch sites relied on, so a bare `throw new Error()`
 * or a terse empty-message rejection still surfaces the friendly fallback
 * instead of a blank error.
 */
export function errorMessage(e: unknown, fallback: string): string {
  const m = e instanceof Error ? e.message : '';
  return m || fallback;
}
