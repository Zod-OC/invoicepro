'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { exportBackup, applyBackup } from '@/lib/backup';
import type { BillifyBackup } from '@/types';
import {
  loadGisScript,
  getValidToken,
  hasCachedToken,
  signOut as driveSignOut,
  uploadSyncFile,
  downloadSyncFile,
  getSyncFileModifiedTime,
} from '@/lib/googleDrive';
import {
  generateRandomKey,
  importKey,
  encrypt,
  decrypt,
  type EncryptedBlob,
} from '@/lib/crypto';
import { track } from '@/lib/analytics';

const CLIENT_ID_KEY = 'billify_gdrive_client_id_check'; // just a presence flag
const SYNC_KEY_STORAGE = 'billify_sync_key'; // base64-encoded AES key
const LAST_SYNC_KEY = 'billify_last_sync';
const SYNC_VERSION = 1;

export type SyncStatus = 'idle' | 'connected' | 'syncing' | 'error' | 'conflict';

export interface CloudSyncState {
  status: SyncStatus;
  /** ISO timestamp of last successful sync, or null. */
  lastSync: string | null;
  /** Error message if status === 'error'. */
  error: string | null;
  /** Whether the user has connected Google Drive. */
  isConnected: boolean;
}

export interface CloudSyncActions {
  /** Connect Google Drive. Triggers OAuth popup. */
  connect: () => Promise<void>;
  /** Disconnect and clear local sync state. Does NOT delete the Drive file. */
  disconnect: () => void;
  /** Push local data to Drive (encrypts first). */
  syncNow: () => Promise<void>;
  /** Pull from Drive and apply to local storage. */
  pullFromCloud: () => Promise<void>;
}

interface SyncPayload {
  v: number;
  encrypted: EncryptedBlob;
  exportedAt: string;
}

const DRIVE_FILE_NAME = 'billify-sync.json';

/**
 * useCloudSync — zero-knowledge Google Drive sync.
 *
 * The encryption key is generated client-side and stored in localStorage. It
 * NEVER goes to the server. The Drive file contains only ciphertext.
 *
 * On first connect: generate key, store locally, upload encrypted backup.
 * On subsequent devices: user connects same Google account, but ALSO needs
 * the sync key (via URL fragment #sync=KEY or by re-entering a passphrase).
 *
 * For the MVP, we support the random-key device-pairing flow. The passphrase
 * flow is a follow-up.
 */
export function useCloudSync(clientId: string | undefined): CloudSyncState & CloudSyncActions {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const gisLoadedRef = useRef(false);

  // On mount, check for cached token + existing sync key
  useEffect(() => {
    const cached = hasCachedToken();
    const hasKey = !!localStorage.getItem(SYNC_KEY_STORAGE);
    if (cached && hasKey) {
      setIsConnected(true);
      setStatus('connected');
      setLastSync(localStorage.getItem(LAST_SYNC_KEY));
    }
  }, []);

  // Load GIS script on mount (so the OAuth popup is instant when needed)
  useEffect(() => {
    if (!clientId || gisLoadedRef.current) return;
    gisLoadedRef.current = true;
    loadGisScript().catch((err) => {
      console.warn('Failed to preload GIS:', err);
    });
  }, [clientId]);

  const connect = useCallback(async () => {
    if (!clientId) {
      setError('Google Drive sync not configured (missing Client ID)');
      setStatus('error');
      return;
    }
    setStatus('syncing');
    setError(null);
    try {
      // 1. Ensure GIS is loaded
      await loadGisScript();
      // 2. Get OAuth token (triggers popup if needed)
      const token = await getValidToken(clientId);
      // 3. Generate or load encryption key
      let keyB64 = localStorage.getItem(SYNC_KEY_STORAGE);
      if (!keyB64) {
        const { exported } = await generateRandomKey();
        keyB64 = exported;
        localStorage.setItem(SYNC_KEY_STORAGE, keyB64);
      }
      const key = await importKey(keyB64);
      // 4. Export current local data, encrypt, upload
      const backup = exportBackup();
      const payload: SyncPayload = {
        v: SYNC_VERSION,
        encrypted: await encrypt(key, JSON.stringify(backup)),
        exportedAt: new Date().toISOString(),
      };
      await uploadSyncFile(token, JSON.stringify(payload));
      // 5. Update state
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      localStorage.setItem(CLIENT_ID_KEY, '1');
      setIsConnected(true);
      setStatus('connected');
      setLastSync(new Date().toISOString());
      track('cloud_sync_connect', {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setStatus('error');
    }
  }, [clientId]);

  const syncNow = useCallback(async () => {
    if (!clientId) return;
    if (!isConnected) return;
    setStatus('syncing');
    setError(null);
    try {
      const token = await getValidToken(clientId);
      const keyB64 = localStorage.getItem(SYNC_KEY_STORAGE);
      if (!keyB64) throw new Error('No sync key — connect first');
      const key = await importKey(keyB64);
      const backup = exportBackup();
      const payload: SyncPayload = {
        v: SYNC_VERSION,
        encrypted: await encrypt(key, JSON.stringify(backup)),
        exportedAt: new Date().toISOString(),
      };
      await uploadSyncFile(token, JSON.stringify(payload));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      setLastSync(new Date().toISOString());
      setStatus('connected');
      track('cloud_sync_push', {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setStatus('error');
    }
  }, [clientId, isConnected]);

  const pullFromCloud = useCallback(async () => {
    if (!clientId) return;
    if (!isConnected) return;
    setStatus('syncing');
    setError(null);
    try {
      const token = await getValidToken(clientId);
      const keyB64 = localStorage.getItem(SYNC_KEY_STORAGE);
      if (!keyB64) throw new Error('No sync key — connect first');
      const key = await importKey(keyB64);
      const raw = await downloadSyncFile(token);
      if (!raw) {
        setError('No cloud backup found');
        setStatus('error');
        return;
      }
      const payload = JSON.parse(raw) as SyncPayload;
      const plaintext = await decrypt(key, payload.encrypted);
      const backup = JSON.parse(plaintext) as BillifyBackup;
      applyBackup(backup);
      setStatus('connected');
      track('cloud_sync_pull', {});
      // Reload to rehydrate the editor with the pulled data
      window.location.reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setStatus('error');
    }
  }, [clientId, isConnected]);

  const disconnect = useCallback(() => {
    driveSignOut();
    // Keep the sync key in case user reconnects — it's needed to decrypt the
    // existing Drive file. Clearing it would orphan the cloud backup.
    setIsConnected(false);
    setStatus('idle');
    setLastSync(null);
    setError(null);
    track('cloud_sync_disconnect', {});
  }, []);

  return {
    status,
    lastSync,
    error,
    isConnected,
    connect,
    disconnect,
    syncNow,
    pullFromCloud,
  };
}

/** Get the sync key for URL-fragment device pairing (#sync=KEY). */
export function getSyncKeyForSharing(): string | null {
  return localStorage.getItem(SYNC_KEY_STORAGE);
}

/** Parse the #sync= fragment and store the key (for device pairing). */
export function consumeSyncKeyFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  const match = hash.match(/#sync=([A-Za-z0-9+/=]+)/);
  if (!match) return false;
  localStorage.setItem(SYNC_KEY_STORAGE, match[1]);
  // Clear the fragment so it doesn't persist in shared URLs
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return true;
}
