'use client';

import { useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const STORAGE_KEY = 'billify_invoice_counter';

/**
 * Auto-numbering hook. Maintains a persistent counter so that new invoices
 * get sequential numbers (INV-1001, INV-1002, …) across sessions. The user
 * can always override the number in the editor — this just pre-fills the next
 * sequential value when they click "New Invoice".
 *
 * The counter starts at 1001 (matches the established INV-1XXX convention in
 * createEmptyInvoice's random fallback).
 */
export const INVOICE_COUNTER_START = 1001;

export function useInvoiceCounter() {
  const [counter, setCounter, ready] = useLocalStorage<number | null>(STORAGE_KEY, null);

  /** Get the next invoice number string (without incrementing). */
  const peekNextNumber = useCallback((): string => {
    const next = (counter ?? INVOICE_COUNTER_START - 1) + 1;
    return `INV-${next}`;
  }, [counter]);

  /** Increment the counter and return the new invoice number string. */
  const consumeNextNumber = useCallback((): string => {
    const current = counter ?? INVOICE_COUNTER_START - 1;
    const next = current + 1;
    setCounter(next);
    return `INV-${next}`;
  }, [counter, setCounter]);

  return {
    counter,
    ready,
    peekNextNumber,
    consumeNextNumber,
    /** Raw setter for backup/restore import. */
    _importCounter: setCounter,
  };
}
