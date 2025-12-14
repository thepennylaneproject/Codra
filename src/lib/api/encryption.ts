/**
 * Encryption utilities for secure API key storage
 * Uses AES-256-GCM with per-user encryption keys
 * Keys are derived from Supabase user ID + app secret
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Derive an encryption key from user ID and app secret using PBKDF2
 */
export async function deriveUserEncryptionKey(
  userId: string,
  appSecret: string
): Promise<CryptoKey> {
  const salt = new TextEncoder().encode(userId);

  // Create base key from app secret
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive user-specific key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt plaintext API key
 * Returns base64-encoded string: "iv:salt:ciphertext:tag"
 */
export async function encryptApiKey(
  apiKey: string,
  encryptionKey: CryptoKey
): Promise<string> {
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    encryptionKey,
    new TextEncoder().encode(apiKey)
  );

  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return base64Encode(combined);
}

/**
 * Decrypt API key
 * Expects base64-encoded string: "iv:ciphertext" (combined)
 */
export async function decryptApiKey(
  encryptedKey: string,
  encryptionKey: CryptoKey
): Promise<string> {
  try {
    const combined = base64Decode(encryptedKey);

    // Split IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      encryptionKey,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  } catch (error) {
    throw new Error(`Failed to decrypt API key: ${error}`);
  }
}

/**
 * Utility functions for base64 encoding/decoding
 */
function base64Encode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer));
}

function base64Decode(str: string): Uint8Array {
  const binaryString = atob(str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Verify encryption is available (for browsers without crypto support)
 */
export function isEncryptionAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.getRandomValues !== 'undefined'
  );
}
