'use client';

import { useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { calculateTotals, generateId } from '@/types';
import type { Invoice, InvoiceRecord, HistoryStatus } from '@/types';

const STORAGE_KEY = 'billify_history';
// Full-invoice snapshots (for reload-from-history) keyed by invoice id. The
// history list stores only summaries; these store the full Invoice so a row
// click can restore it. Capped + logo-stripped (logos are ~1MB base64) to stay
// well under the ~5MB localStorage quota.
const SNAPSHOT_KEY = 'billify_invoice_snapshots';
const MAX_SNAPSHOTS = 50;

/**
 * Invoice history hook. Records a lightweight summary of each invoice the
 * user creates/downloads, with manual status tracking (draft → sent → paid →
 * overdue). All data stays in localStorage — no backend, no accounts.
 *
 * The history stores a SUMMARY (InvoiceRecord), not the full Invoice object.
 * To reload an invoice back into the editor, the full invoice is loaded from
 * `billify_current` (which the editor auto-saves on every change). History
 * records the metadata for the list view + status filtering.
 */
export function useInvoiceHistory() {
  const [history, setHistory, ready] = useLocalStorage<InvoiceRecord[]>(STORAGE_KEY, []);
  const [snapshots, setSnapshots] = useLocalStorage<Record<string, Invoice>>(SNAPSHOT_KEY, {});

  /** Create or update a history record from the current invoice. */
  const recordInvoice = useCallback(
    (invoice: Invoice, status?: HistoryStatus) => {
      const { total } = calculateTotals(invoice.items, invoice.taxRate);
      const now = Date.now();
      setHistory((prev) => {
        const existing = prev.find((r) => r.id === invoice.id);
        if (existing) {
          // Update existing record (don't override paid/overdue status unless explicitly given).
          const nextStatus = status ?? existing.status;
          return prev.map((r) =>
            r.id === invoice.id
              ? {
                  ...r,
                  number: invoice.number,
                  clientName: invoice.to.name || '(no client)',
                  amount: total,
                  currency: invoice.currency,
                  date: invoice.date,
                  dueDate: invoice.dueDate,
                  status: nextStatus,
                  updatedAt: now,
                }
              : r,
          );
        }
        // New record.
        const record: InvoiceRecord = {
          id: invoice.id,
          number: invoice.number,
          clientName: invoice.to.name || '(no client)',
          amount: total,
          currency: invoice.currency,
          date: invoice.date,
          dueDate: invoice.dueDate,
          status: status ?? 'draft',
          createdAt: now,
          updatedAt: now,
        };
        return [record, ...prev];
      });
      // Store a logo-stripped full snapshot so the row can reload the invoice.
      setSnapshots((prev) => {
        const stripped: Invoice = {
          ...invoice,
          from: { ...invoice.from, logo: undefined },
          to: { ...invoice.to, logo: undefined },
        };
        const next = { ...prev, [invoice.id]: stripped };
        const ids = Object.keys(next);
        if (ids.length > MAX_SNAPSHOTS) {
          delete next[ids[0]]; // drop the oldest insertion to stay bounded
        }
        return next;
      });
    },
    [setHistory, setSnapshots],
  );

  /** Update the status of a specific invoice record. */
  const updateStatus = useCallback(
    (id: string, status: HistoryStatus) => {
      const now = Date.now();
      setHistory((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
                updatedAt: now,
              }
            : r,
        ),
      );
    },
    [setHistory],
  );

  /** Remove a record (e.g. user deletes a draft they never sent). */
  const removeRecord = useCallback(
    (id: string) => {
      setHistory((prev) => prev.filter((r) => r.id !== id));
      setSnapshots((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [setHistory, setSnapshots],
  );

  /** Clear all history. */
  const clearHistory = useCallback(() => {
    setHistory(() => []);
    setSnapshots(() => ({}));
  }, [setHistory, setSnapshots]);

  /** Check for overdue invoices (due date passed, not yet paid/sent). */
  const markOverdue = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setHistory((prev) =>
      prev.map((r) =>
        r.status === 'sent' && r.dueDate < today
          ? { ...r, status: 'overdue' as HistoryStatus, updatedAt: Date.now() }
          : r,
      ),
    );
  }, [setHistory]);

  /** Load a stored full-invoice snapshot by id (for reload-from-history). */
  const loadInvoice = useCallback(
    (id: string): Invoice | undefined => snapshots[id],
    [snapshots],
  );

  return {
    history,
    ready,
    recordInvoice,
    updateStatus,
    removeRecord,
    clearHistory,
    markOverdue,
    loadInvoice,
    /** Raw setter for backup/restore import. */
    _importHistory: setHistory,
  };
}
