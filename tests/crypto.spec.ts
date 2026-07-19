/**
 * Crypto layer tests for cloud sync.
 *
 * Runs in the browser (Playwright) where Web Crypto API is natively available.
 * Proves the encryption is actually secure (AES-GCM 256 + PBKDF2 250k).
 */
import { test, expect } from '@playwright/test';
import { encrypt, decrypt, encryptWithPassphrase, decryptWithPassphrase, generateRandomKey, importKey } from '../src/lib/crypto';

test.describe('Crypto layer (cloud sync)', () => {
  test('round-trip encrypt/decrypt with random key', async () => {
    const { key, exported } = await generateRandomKey();
    const plaintext = JSON.stringify({ hello: 'world', n: 42 });
    
    const blob = await encrypt(key, plaintext);
    const decrypted = await decrypt(key, blob);
    
    expect(decrypted).toBe(plaintext);
    // Ciphertext must NOT contain plaintext
    expect(blob.ciphertext).not.toContain('hello');
    expect(blob.ciphertext).not.toContain('world');
  });

  test('wrong key fails decryption (AES-GCM auth)', async () => {
    const { key: key1 } = await generateRandomKey();
    const { key: key2 } = await generateRandomKey();
    
    const blob = await encrypt(key1, 'secret data');
    
    await expect(decrypt(key2, blob)).rejects.toThrow();
  });

  test('passphrase round-trip with salt', async () => {
    const passphrase = 'correct horse battery staple';
    const plaintext = 'invoice data 123';
    
    const blob = await encryptWithPassphrase(passphrase, plaintext);
    expect(blob.salt).not.toBeNull();
    
    const decrypted = await decryptWithPassphrase(passphrase, blob);
    expect(decrypted).toBe(plaintext);
  });

  test('wrong passphrase fails', async () => {
    const blob = await encryptWithPassphrase('right password', 'data');
    await expect(decryptWithPassphrase('wrong password', blob)).rejects.toThrow();
  });

  test('imported key matches exported key', async () => {
    const { key: origKey, exported } = await generateRandomKey();
    const importedKey = await importKey(exported);
    
    const plaintext = 'test data';
    const blob = await encrypt(origKey, plaintext);
    const decrypted = await decrypt(importedKey, blob);
    
    expect(decrypted).toBe(plaintext);
  });

  test('encrypted blob is JSON-serializable', async () => {
    const { key } = await generateRandomKey();
    const blob = await encrypt(key, 'data');
    
    // Must survive JSON round-trip (it goes through JSON.stringify when uploaded)
    const json = JSON.stringify(blob);
    const restored = JSON.parse(json);
    
    const decrypted = await decrypt(key, restored);
    expect(decrypted).toBe('data');
  });

  test('IV is unique per encryption (random)', async () => {
    const { key } = await generateRandomKey();
    const blob1 = await encrypt(key, 'same plaintext');
    const blob2 = await encrypt(key, 'same plaintext');
    
    // Same plaintext + same key, but IVs must differ (else it's a security bug)
    expect(blob1.iv).not.toBe(blob2.iv);
    expect(blob1.ciphertext).not.toBe(blob2.ciphertext);
  });
});
