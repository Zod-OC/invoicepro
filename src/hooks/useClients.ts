'use client';

import { useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateId } from '@/types';
import type { Client, CompanyInfo, Invoice } from '@/types';

const STORAGE_KEY = 'billify_clients';

/**
 * Client directory hook. Stores saved clients in localStorage so users can
 * quickly re-invoice repeat clients without re-typing their details.
 *
 * Pro gating: free tier is limited to FREE_CLIENT_LIMIT (3) clients. The
 * component layer checks `canAddClient` before showing a save option. The hook
 * itself does NOT enforce the limit — it's a data primitive — so the gate can
 * be tested independently and adjusted (e.g. during a promotional period)
 * without touching the hook.
 */
export function useClients() {
  const [clients, setClients, ready] = useLocalStorage<Client[]>(STORAGE_KEY, []);

  const addClient = useCallback(
    (data: Omit<Client, 'id' | 'createdAt'>): Client => {
      const client: Client = { ...data, id: generateId(), createdAt: Date.now() };
      setClients((prev) => [...prev, client]);
      return client;
    },
    [setClients],
  );

  const updateClient = useCallback(
    (id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>) => {
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    },
    [setClients],
  );

  const removeClient = useCallback(
    (id: string) => {
      setClients((prev) => prev.filter((c) => c.id !== id));
    },
    [setClients],
  );

  /** Extract client fields from an Invoice's `to` (CompanyInfo) block. */
  const clientFromInvoice = useCallback(
    (invoice: Invoice): Omit<Client, 'id' | 'createdAt'> => {
      const to: CompanyInfo = invoice.to;
      return {
        name: to.name,
        email: to.email,
        phone: to.phone,
        address: [to.address, to.addressLine2, to.city, to.region, to.postalCode, to.country]
          .filter(Boolean)
          .join(', '),
        taxId: to.taxId,
        defaultCurrency: invoice.currency,
      };
    },
    [],
  );

  /** Check if a client with the same name+email already exists. */
  const findDuplicate = useCallback(
    (name: string, email: string): Client | undefined => {
      const n = name.trim().toLowerCase();
      const e = email.trim().toLowerCase();
      return clients.find(
        (c) => c.name.trim().toLowerCase() === n && c.email.trim().toLowerCase() === e,
      );
    },
    [clients],
  );

  return {
    clients,
    ready,
    addClient,
    updateClient,
    removeClient,
    clientFromInvoice,
    findDuplicate,
    /** Raw setter for backup/restore import. */
    _importClients: setClients,
  };
}
