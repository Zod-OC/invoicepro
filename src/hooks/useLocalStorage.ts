'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic typed localStorage hook — the shared persistence primitive for
 * client directory, invoice history, and the invoice counter. Handles SSR
 * (Next.js prerender), JSON serialization, and BOTH cross-tab AND same-tab
 * propagation.
 *
 * Same-tab sync matters: the native 'storage' event does NOT fire in the tab
 * that made the change, so two hook instances with the same key in one tab
 * (e.g. handleDownload's recordInvoice + the InvoiceHistory panel's own
 * useInvoiceHistory) would drift until reload. We broadcast a CustomEvent on
 * every write and listen for it alongside 'storage', so any same-key instance
 * in this tab re-reads and stays current.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronization: re-read from localStorage when the key changes, whether
  // from ANOTHER tab (native 'storage' event) or another hook instance in THIS
  // tab (our CustomEvent broadcast from setValue below). The listener only
  // updates in-memory state — it never writes, so there's no feedback loop.
  useEffect(() => {
    const read = () => {
      try {
        const item = window.localStorage.getItem(keyRef.current);
        setStoredValue(item !== null ? (JSON.parse(item) as T) : initialValue);
      } catch {
        // Ignore corrupt writes.
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === keyRef.current) read();
    };
    const onLocal = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (detail && detail.key === keyRef.current) read();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(LOCAL_STORAGE_EVENT, onLocal as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LOCAL_STORAGE_EVENT, onLocal as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(keyRef.current, JSON.stringify(next));
          // Broadcast to other same-tab instances (the native 'storage' event
          // only fires in OTHER tabs). Details carry only the key — listeners
          // re-read the value themselves, so no large payloads on the event.
          window.dispatchEvent(
            new CustomEvent(LOCAL_STORAGE_EVENT, { detail: { key: keyRef.current } }),
          );
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

/** Custom event name for same-tab localStorage broadcasts. */
export const LOCAL_STORAGE_EVENT = 'billify:local-storage';
