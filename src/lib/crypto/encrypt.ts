/**
 * AES-256-GCM encryption for sensitive data (e.g. AJPES password).
 * Requires AJPES_ENCRYPTION_KEY env var (32 bytes hex = 64 chars).
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const keyHex = process.env.AJPES_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64 || !/^[0-9a-fA-F]+$/.test(keyHex)) {
    throw new Error(
      "AJPES_ENCRYPTION_KEY must be 32 bytes (64 hex chars). Generate: openssl rand -hex 32"
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt plaintext. Output format: base64(iv + encrypted + tag)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

/**
 * Decrypt ciphertext from encrypt().
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH, -TAG_LENGTH);
  const tag = buf.subarray(-TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

/**
 * Check if encryption key is configured.
 */
export function isEncryptionConfigured(): boolean {
  const keyHex = process.env.AJPES_ENCRYPTION_KEY;
  return !!(keyHex && keyHex.length === 64 && /^[0-9a-fA-F]+$/.test(keyHex));
}
