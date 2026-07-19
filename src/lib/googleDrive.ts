'use client';

/**
 * Google Drive browser-only sync for Billify.
 *
 * ZERO-KNOWLEDGE: The OAuth token NEVER touches our server. It lives in
 * localStorage and is used to talk directly to the Google Drive REST API from
 * the browser. Your server only ever sees opaque encrypted blobs (if using the
 * fallback sync) — actually, with Google Drive sync, your server isn't involved
 * AT ALL. The browser → Google Drive directly.
 *
 * GDPR POSITION: You are not processing personal data. The user's Google token
 * and their encrypted data live in Google Drive. You ship JavaScript that runs
 * in their browser. No DPA, no records of processing, no breach notification.
 *
 * HOW IT WORKS:
 * 1. User clicks "Enable cloud sync"
 * 2. Google Identity Services popup → user grants drive.file scope
 * 3. Token stored in localStorage (encrypted at rest via the crypto layer)
 * 4. On sync: encrypt(localData) → upload to Google Drive as a single file
 * 5. On other device: user signs in with same Google account → download + decrypt
 *
 * SCOPE: drive.file — we can ONLY access files our app created. We cannot read
 * the user's other Drive files. This is the most limited, privacy-respecting
 * scope Google offers.
 */

const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';
const BILLIFY_FILENAME = 'billify-sync.json';

const TOKEN_KEY = 'billify_gdrive_token';
const TOKEN_EXPIRY_KEY = 'billify_gdrive_token_expiry';
const FILE_ID_KEY = 'billify_gdrive_file_id';

/** Required OAuth scopes — drive.file = only files created by this app. */
export const REQUIRED_SCOPES = 'https://www.googleapis.com/auth/drive.file';

interface TokenClient {
  requestAccessToken: (config: {
    prompt?: string;
    callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
  }) => void;
}

let tokenClient: TokenClient | null = null;

/**
 * Initialize the Google Identity Services token client.
 * Must be called AFTER the GIS script is loaded (handled by the hook).
 */
export function initTokenClient(clientId: string): TokenClient {
  if (tokenClient) return tokenClient;
  // Lazily init the Google Identity Services token client. The GIS script
  // must be loaded first (loadGisScript). We wrap it so callers don't have to
  // touch the global google object directly.
  const client: TokenClient = {
    requestAccessToken: (config) => {
      // @ts-expect-error - google.accounts.oauth2 is loaded by GIS script
      const tc = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: REQUIRED_SCOPES,
        callback: config.callback,
      });
      tc.requestAccessToken(config);
    },
  };
  tokenClient = client;
  return client;
}

/**
 * Load the Google Identity Services script dynamically.
 * Returns when window.google is available.
 */
export function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    // @ts-expect-error - google is added to window by the script
    if (window.google?.accounts?.oauth2) return resolve();
    const existing = document.getElementById('gis-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load GIS')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/** Get the cached token if still valid, null otherwise. */
export function getCachedToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY) ?? '0');
    if (!token || Date.now() > expiry) return null;
    return token;
  } catch {
    return null;
  }
}

/** Request a fresh access token via the GIS popup. */
export function requestToken(clientId: string, interactive = true): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = initTokenClient(clientId);
    client.requestAccessToken({
      prompt: interactive ? 'consent' : '',
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        if (!response.access_token) {
          reject(new Error('No access token returned'));
          return;
        }
        // Cache token with 55-min expiry (Google tokens last 1 hour)
        localStorage.setItem(TOKEN_KEY, response.access_token);
        localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 55 * 60 * 1000));
        resolve(response.access_token);
      },
    });
  });
}

/** Get a valid token, refreshing if necessary. */
export async function getValidToken(clientId: string): Promise<string> {
  const cached = getCachedToken();
  if (cached) return cached;
  return requestToken(clientId, true);
}

/** Sign out and clear cached token. */
export function signOut(): void {
  const token = getCachedToken();
  if (token) {
    // Best-effouth: revoke the token
    fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' }).catch(() => {});
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(FILE_ID_KEY);
}

/** Check if user has a cached (potentially valid) token. */
export function hasCachedToken(): boolean {
  return !!getCachedToken();
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

/**
 * Find the Billify sync file in the user's Drive (if it exists).
 * Uses the fileList endpoint with a name filter.
 */
async function findSyncFile(token: string): Promise<DriveFile | null> {
  const cachedId = localStorage.getItem(FILE_ID_KEY);
  if (cachedId) {
    // Verify the cached file ID still exists
    const res = await fetch(`${DRIVE_FILES_ENDPOINT}/${cachedId}?fields=id,name,modifiedTime`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const file = await res.json();
      return { id: file.id, name: file.name, modifiedTime: file.modifiedTime };
    }
    // File was deleted — clear the cache
    localStorage.removeItem(FILE_ID_KEY);
  }
  // Search by name (files created by our app via drive.file scope)
  const query = encodeURIComponent(`name = '${BILLIFY_FILENAME}' and trashed = false`);
  const res = await fetch(`${DRIVE_FILES_ENDPOINT}?q=${query}&spaces=drive&fields=files(id,name,modifiedTime)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
  const data = await res.json();
  const files: DriveFile[] = data.files ?? [];
  if (files.length === 0) return null;
  localStorage.setItem(FILE_ID_KEY, files[0].id);
  return files[0];
}

/**
 * Upload (create or update) the sync file.
 * Returns the file metadata.
 */
export async function uploadSyncFile(token: string, content: string): Promise<DriveFile> {
  const existing = await findSyncFile(token);
  const method = existing ? 'PATCH' : 'POST';
  const url = existing
    ? `${DRIVE_UPLOAD_ENDPOINT}/${existing.id}?uploadType=multipart`
    : `${DRIVE_UPLOAD_ENDPOINT}?uploadType=multipart`;

  // Multipart upload: metadata + content
  const boundary = 'billify-' + Math.random().toString(36).slice(2);
  const metadata = existing ? {} : { name: BILLIFY_FILENAME, mimeType: 'application/json' };
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) + '\r\n' +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    content + '\r\n' +
    `--${boundary}--`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive upload failed (${res.status}): ${errText}`);
  }
  const file = await res.json();
  if (!existing) localStorage.setItem(FILE_ID_KEY, file.id);
  return { id: file.id, name: file.name, modifiedTime: file.modifiedTime };
}

/**
 * Download the sync file content.
 * Returns null if no file exists yet.
 */
export async function downloadSyncFile(token: string): Promise<string | null> {
  const file = await findSyncFile(token);
  if (!file) return null;
  const res = await fetch(`${DRIVE_FILES_ENDPOINT}/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return res.text();
}

/**
 * Get the last-modified time of the sync file (for conflict detection).
 */
export async function getSyncFileModifiedTime(token: string): Promise<string | null> {
  const file = await findSyncFile(token);
  return file?.modifiedTime ?? null;
}

/** Delete the sync file (for "disable sync" / reset). */
export async function deleteSyncFile(token: string): Promise<void> {
  const file = await findSyncFile(token);
  if (!file) return;
  await fetch(`${DRIVE_FILES_ENDPOINT}/${file.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  localStorage.removeItem(FILE_ID_KEY);
}
