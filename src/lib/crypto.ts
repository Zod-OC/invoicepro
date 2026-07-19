'use client';

/**
 * Client-side encryption for cloud sync.
 *
 * Uses Web Crypto API (AES-GCM 256 with PBKDF2 key derivation). The passphrase
 * NEVER leaves the browser — the server only ever sees opaque encrypted blobs.
 *
 * This is the zero-knowledge layer: even if an attacker compromised our server
 * (or Google Drive), they'd only get ciphertext. The encryption key is derived
 * from a user-chosen passphrase using PBKDF2 with 250k iterations.
 *
 * For the "device pairing" flow (no passphrase), we generate a random 256-bit
 * key client-side and store it in localStorage. The user transfers it to other
 * devices via QR code or URL fragment (#sync=...). The server never sees it.
 */

const PBKDF2_ITERATIONS = 250_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/** Convert string to ArrayBuffer (not Uint8Array — TS 5.9 BufferSource strictness). */
function str2buf(str: string): ArrayBuffer {
  const arr = new TextEncoder().encode(str);
  const buffer = new ArrayBuffer(arr.byteLength);
  new Uint8Array(buffer).set(arr);
  return buffer;
}

/** Convert ArrayBuffer to base64. */
function buf2b64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Convert base64 to ArrayBuffer. */
function b642buf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/** Generate random bytes as ArrayBuffer. */
function randomBuf(len: number): ArrayBuffer {
  const buf = new ArrayBuffer(len);
  const view = new Uint8Array(buf);
  crypto.getRandomValues(view);
  return buf;
}

/** Derive an AES-GCM key from a passphrase + salt using PBKDF2. */
export async function deriveKey(passphrase: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    str2buf(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Generate a random 256-bit key (for passphrase-less device pairing). */
export async function generateRandomKey(): Promise<{ key: CryptoKey; exported: string }> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  return { key, exported: buf2b64(exported) };
}

/** Import a base64-encoded raw key (for device pairing). */
export async function importKey(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    b642buf(b64),
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedBlob {
  /** Base64-encoded ciphertext. */
  ciphertext: string;
  /** Base64-encoded salt (if passphrase-derived) or null (if random key). */
  salt: string | null;
  /** Base64-encoded IV. */
  iv: string;
  /** Schema version for future migrations. */
  v: 1;
}

/** Encrypt a string payload with a CryptoKey. */
export async function encrypt(key: CryptoKey, plaintext: string): Promise<EncryptedBlob> {
  const iv = randomBuf(IV_LENGTH);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    str2buf(plaintext)
  );
  return {
    ciphertext: buf2b64(ciphertext),
    salt: null,
    iv: buf2b64(iv),
    v: 1,
  };
}

/** Decrypt an EncryptedBlob. Throws if key is wrong (AES-GCM auth fails). */
export async function decrypt(key: CryptoKey, blob: EncryptedBlob): Promise<string> {
  const iv = b642buf(blob.iv);
  const ciphertext = b642buf(blob.ciphertext);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}

/** Full passphrase-based encrypt flow: derive key, encrypt, return blob with salt. */
export async function encryptWithPassphrase(
  passphrase: string,
  plaintext: string
): Promise<EncryptedBlob> {
  const salt = randomBuf(SALT_LENGTH);
  const key = await deriveKey(passphrase, salt);
  const blob = await encrypt(key, plaintext);
  return { ...blob, salt: buf2b64(salt) };
}

/** Full passphrase-based decrypt flow: derive key from salt, decrypt. */
export async function decryptWithPassphrase(
  passphrase: string,
  blob: EncryptedBlob
): Promise<string> {
  if (!blob.salt) throw new Error('Blob has no salt — not passphrase-encrypted');
  const salt = b642buf(blob.salt);
  const key = await deriveKey(passphrase, salt);
  return decrypt(key, blob);
}
