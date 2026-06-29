/**
 * Analytics wrapper for self-hosted, same-origin, cookieless Umami.
 *
 * The tracker (served at /script.js, proxied to the umami container by nginx,
 * loaded with `async` in src/app/layout.tsx) populates `window.umami.track`.
 * Events fired before the script loads are buffered and flushed once it's ready.
 * Every call is try/catched — analytics can never break the app. We track a small
 * fixed set of NAMED events (page views are automatic): checkout_click,
 * editor_open, pseo_view, cap_hit. No autocapture, no PII.
 */
declare global {
  interface Window {
    umami?: {
      track: (name: string, props?: Record<string, unknown>) => void;
    };
  }
}

const pending: Array<[string, Record<string, unknown> | undefined]> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

// Drain the buffer once the tracker is available; retry briefly if it hasn't
// loaded yet (the async /script.js usually loads within ~1s). Shifts an event
// ONLY on success — a throwing tracker (backend down) leaves the event buffered
// for the next attempt instead of silently dropping it.
function tryFlush(retriesLeft = 5): void {
  flushTimer = null;
  const umami = typeof window !== 'undefined' ? window.umami : undefined;
  if (!umami) {
    if (retriesLeft > 0 && pending.length) {
      flushTimer = setTimeout(() => tryFlush(retriesLeft - 1), 1000);
    }
    return;
  }
  while (pending.length) {
    const [name, props] = pending[0];
    try {
      umami.track(name, props);
    } catch {
      break; // tracker threw — stop draining, leave remaining events buffered
    }
    pending.shift();
  }
}

export function track(name: string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  // Bound the buffer: if the tracker never loads (env unset) or persistently
  // throws, `pending` would otherwise grow for the tab's lifetime. Drop oldest.
  if (pending.length >= 100) pending.shift();
  pending.push([name, props]);
  if (window.umami) {
    // Tracker ready — clear any pending retry and flush now (drains the just-pushed event too).
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    tryFlush();
  } else if (flushTimer === null) {
    flushTimer = setTimeout(() => tryFlush(), 1000);
  }
}
