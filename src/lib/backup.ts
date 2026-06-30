'use client';

import type { BillifyBackup, Client, Invoice, InvoiceRecord } from '@/types';

const BACKUP_KEYS = {
  clients: 'billify_clients',
  history: 'billify_history',
  counter: 'billify_invoice_counter',
  current: 'billify_current',
} as const;

/**
 * Export all Billify localStorage data to a single JSON object and trigger a
 * file download. This is the "backup" half of backup/restore — always free for
 * all users (data portability is a Billify principle, not a paywalled feature).
 *
 * The exported file includes a schema version so future format changes can
 * migrate old backups on import.
 */
export function exportBackup(): BillifyBackup {
  const read = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  const clients = read<Client[]>(BACKUP_KEYS.clients, []);
  const history = read<InvoiceRecord[]>(BACKUP_KEYS.history, []);
  const counterRaw = localStorage.getItem(BACKUP_KEYS.counter);
  let counter: number | null = null;
  if (counterRaw) {
    try {
      counter = JSON.parse(counterRaw) as number;
    } catch {
      counter = null;
    }
  }
  const current = read<Invoice | null>(BACKUP_KEYS.current, null);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    clients,
    history,
    counter,
    currentInvoice: current,
  };
}

/** Trigger a browser file download of the backup JSON. */
export function downloadBackup(backup: BillifyBackup): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = backup.exportedAt.split('T')[0]; // YYYY-MM-DD
  a.download = `billify-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validation result for import operations.
 */
export interface ImportResult {
  success: boolean;
  error?: string;
  clientsImported: number;
  historyImported: number;
  counterSet: boolean;
  currentSet: boolean;
}

/**
 * Parse and validate a backup JSON string. Returns the parsed backup or throws
 * with a human-readable error message. Separated from `applyBackup` so the UI
 * can show a preview before committing.
 */
export function parseBackup(jsonString: string): BillifyBackup {
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON file — could not parse.');
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid backup file — not a valid Billify backup.');
  }

  const obj = data as Record<string, unknown>;

  // Schema version check (forward-compatible: future versions handled later).
  if (obj.version !== 1) {
    throw new Error(
      `Unsupported backup version (${String(obj.version)}). This backup was created by a newer version of Billify.`,
    );
  }

  // Validate arrays exist.
  if (!Array.isArray(obj.clients)) {
    throw new Error('Invalid backup — clients section is missing or corrupt.');
  }
  if (!Array.isArray(obj.history)) {
    throw new Error('Invalid backup — history section is missing or corrupt.');
  }

  return obj as unknown as BillifyBackup;
}

/**
 * Write a validated backup to localStorage, replacing existing data.
 * Called after the user confirms the import.
 */
export function applyBackup(backup: BillifyBackup): ImportResult {
  const write = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full — partial import. Continue with what we can.
    }
  };

  write(BACKUP_KEYS.clients, backup.clients);
  write(BACKUP_KEYS.history, backup.history);
  if (backup.counter !== null && typeof backup.counter === 'number') {
    write(BACKUP_KEYS.counter, backup.counter);
  }
  if (backup.currentInvoice) {
    write(BACKUP_KEYS.current, backup.currentInvoice);
  }

  return {
    success: true,
    clientsImported: backup.clients.length,
    historyImported: backup.history.length,
    counterSet: backup.counter !== null,
    currentSet: backup.currentInvoice !== null,
  };
}

/**
 * Convenience: parse + apply in one step (for simple "import and reload" flows).
 */
export function importBackup(jsonString: string): ImportResult {
  const backup = parseBackup(jsonString);
  return applyBackup(backup);
}
