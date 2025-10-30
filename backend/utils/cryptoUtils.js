const crypto = require('crypto');

// Encryption utility using AES-256-GCM.
// Requires a 32-byte key in environment variable ENCRYPTION_KEY (base64 or raw).
// WARNING: keep ENCRYPTION_KEY secret and rotate regularly in production.

const ALGORITHM = 'aes-256-gcm';
// Prefer ENCRYPTION_KEY, but accept JWT_SECRET_ENCRYPTION as a fallback (useful when you generated
// a separate secret for encryption; recommend renaming to ENCRYPTION_KEY for clarity).
const KEY_ENV = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET_ENCRYPTION || '';
// In-memory ephemeral key used when no ENCRYPTION_KEY is provided (development only).
let __ephemeral_key = null;

function getKey() {
  // If a key is provided via env, prefer it. Support either base64-encoded or raw 32-byte utf8.
  if (KEY_ENV) {
    let keyBuf = null;
    try {
      keyBuf = Buffer.from(KEY_ENV, 'base64');
      if (keyBuf.length !== 32) {
        // fallback to utf8
        keyBuf = Buffer.from(KEY_ENV, 'utf8');
      }
    } catch (e) {
      keyBuf = Buffer.from(KEY_ENV, 'utf8');
    }
    if (keyBuf.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (raw) or base64-encoded 32 bytes');
    return keyBuf;
  }
  // No ENCRYPTION_KEY set. In production we must not proceed — require a durable key
  // to ensure ciphertexts are decryptable and keys are managed in a secrets store.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY is required in production environments');
  }

  // Development fallback: ephemeral in-memory key so local dev/testing can continue.
  if (!__ephemeral_key) {
    __ephemeral_key = crypto.randomBytes(32);
    console.warn('[cryptoUtils] WARNING: ENCRYPTION_KEY not set. Using ephemeral in-memory key for local development only. DO NOT use this in production.');
  }
  return __ephemeral_key;
}

function encryptText(plain) {
  if (!plain && plain !== '') return null;
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store iv + tag + ciphertext as base64 for storage
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

function decryptText(b64) {
  if (!b64) return null;
  const key = getKey();
  const data = Buffer.from(b64, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const ciphertext = data.slice(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString('utf8');
}

module.exports = { encryptText, decryptText };
