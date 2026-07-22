'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic typed localStorage hook — the shared persistence primitive for
 * client directory, invoice history, and the invoice counter. Handles SSR
 * (Next.js prerender), JSON serialization, and cross-tab propagation.
 *
 * Same-tab sync is intentionally NOT implemented: the native 'storage' event
 * only fires in OTHER tabs, so it would not catch a same-tab write. We rely
 * instead on each key having a SINGLE hook instance — state is lifted to one
 * owner (e.g. useInvoiceHistory lives only in app/page.tsx, which passes
 * slices to <InvoiceHistory> as props) so two instances of the same key never
 * coexist in a tab and cannot drift. If a key ever needs two same-tab
 * instances, re-introduce a same-tab broadcast — but prefer lifting.
 *
 * Returns [value, setValue, ready] where `ready` is false during SSR/first
 * paint and flips true after the mount effect reads from localStorage — so
 * callers can skip rendering hydrated UI until the data is available (avoids
 * a flash of empty state that would show "no clients" before storage loads).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);
  const keyRef = useRef(key);
  keyRef.current = key;

  // Read from localStorage on mount (client-only — localStorage throws on SSR).
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(keyRef.current);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      // Corrupt JSON or storage disabled — keep initialValue.
    }
    setReady(true);
     
  }, []);

  // Cross-tab synchronization: if another tab writes to the same key, update.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== keyRef.current) return;
      try {
        setStoredValue(e.newValue ? (JSON.parse(e.newValue) as T) : initialValue);
      } catch {
        // Ignore corrupt writes from other tabs.
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(keyRef.current, JSON.stringify(next));
        } catch {
          // Storage full or disabled — state still updates in-memory.
        }
        return next;
      });
    },
    [],
  );

  return [storedValue, setValue, ready];
}
