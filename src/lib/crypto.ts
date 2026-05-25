import type {
  EncryptedVaultEnvelope,
  PinWrappedKey,
  VaultAttachment,
  VaultData,
  VaultField,
  VaultItem,
  VaultSentry
} from "../types";
import { base64ToBytes, bytesToBase64, bytesToUtf8, utf8ToBytes } from "./encoding";

export const VAULT_KDF_ITERATIONS = 310_000;
export const PIN_KDF_ITERATIONS = 160_000;
export const MAX_ENCRYPTED_PAYLOAD_BYTES = 12 * 1024 * 1024;
const AES_ALGORITHM = "AES-GCM";
const MAX_VAULT_ITEMS = 5_000;
const MAX_TEXT_LENGTH = 2_000_000;

export class VaultCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultCryptoError";
  }
}

export interface VaultKeyMaterial {
  key: CryptoKey;
  salt: string;
}

function getCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new VaultCryptoError("Web Crypto API is not available in this runtime.");
  }
  return globalThis.crypto;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  getCrypto().getRandomValues(bytes);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown, label: string, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof value !== "string" || value.length > maxLength) {
    throw new VaultCryptoError(`${label} is invalid.`);
  }
  return value;
}

function readOptionalString(value: unknown, label: string, maxLength = MAX_TEXT_LENGTH): string | undefined {
  return value === undefined ? undefined : readString(value, label, maxLength);
}

function readDate(value: unknown, label: string): string {
  const date = readString(value, label, 40);
  if (Number.isNaN(new Date(date).getTime())) {
    throw new VaultCryptoError(`${label} is invalid.`);
  }
  return date;
}

function readOptionalDate(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : readDate(value, label);
}

function readBase64(value: unknown, label: string, expectedLength?: number, maxLength?: number): string {
  const encoded = readString(value, label, (maxLength ?? MAX_ENCRYPTED_PAYLOAD_BYTES) * 2);
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
    throw new VaultCryptoError(`${label} is invalid.`);
  }
  const bytes = base64ToBytes(encoded);
  if (expectedLength !== undefined && bytes.byteLength !== expectedLength) {
    throw new VaultCryptoError(`${label} is invalid.`);
  }
  if (maxLength !== undefined && bytes.byteLength > maxLength) {
    throw new VaultCryptoError(`${label} is too large.`);
  }
  return encoded;
}

function validateField(value: unknown): VaultField {
  if (!isRecord(value)) {
    throw new VaultCryptoError("Vault field is invalid.");
  }
  if (typeof value.copyable !== "boolean" || typeof value.concealed !== "boolean") {
    throw new VaultCryptoError("Vault field visibility settings are invalid.");
  }
  return {
    id: readString(value.id, "Vault field ID", 200),
    label: readString(value.label, "Vault field label", 200),
    value: readString(value.value, "Vault field value"),
    copyable: value.copyable,
    concealed: value.concealed
  };
}

function validateAttachment(value: unknown): VaultAttachment | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new VaultCryptoError("Vault attachment is invalid.");
  }
  const size = value.size;
  if (typeof size !== "number" || !Number.isInteger(size) || size < 0 || size > 750_000) {
    throw new VaultCryptoError("Vault attachment size is invalid.");
  }
  const previewDataUrl = readOptionalString(value.previewDataUrl, "Vault attachment preview", 1_100_000);
  if (previewDataUrl && !/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(previewDataUrl)) {
    throw new VaultCryptoError("Vault attachment preview format is invalid.");
  }
  return {
    id: readString(value.id, "Vault attachment ID", 200),
    name: readString(value.name, "Vault attachment name", 500),
    mimeType: readString(value.mimeType, "Vault attachment MIME type", 200),
    size,
    encryptedPreview: readOptionalString(value.encryptedPreview, "Vault attachment metadata", 500),
    previewDataUrl
  };
}

function validateItem(value: unknown): VaultItem {
  if (!isRecord(value)) {
    throw new VaultCryptoError("Vault item is invalid.");
  }
  if (value.category !== "credentials" && value.category !== "assets" && value.category !== "footprints") {
    throw new VaultCryptoError("Vault item category is invalid.");
  }
  if (!Array.isArray(value.fields) || value.fields.length === 0 || value.fields.length > 100) {
    throw new VaultCryptoError("Vault item fields are invalid.");
  }
  if (!Array.isArray(value.tags) || value.tags.length > 100 || !value.tags.every((tag) => typeof tag === "string")) {
    throw new VaultCryptoError("Vault item tags are invalid.");
  }
  return {
    id: readString(value.id, "Vault item ID", 200),
    category: value.category,
    title: readString(value.title, "Vault item title", 500),
    subtitle: readString(value.subtitle, "Vault item subtitle", 1_000),
    note: readOptionalString(value.note, "Vault item note"),
    fields: value.fields.map(validateField),
    tags: value.tags.map((tag) => readString(tag, "Vault item tag", 200)),
    expiresAt: readOptionalDate(value.expiresAt, "Vault item expiry"),
    attachment: validateAttachment(value.attachment),
    createdAt: readDate(value.createdAt, "Vault item created time"),
    updatedAt: readDate(value.updatedAt, "Vault item updated time")
  };
}

export function validateVaultData(value: unknown): VaultData {
  if (!isRecord(value) || value.schema !== "arkane.vault.v1" || value.version !== 1) {
    throw new VaultCryptoError("Vault schema is not supported.");
  }
  if (!Array.isArray(value.items) || value.items.length > MAX_VAULT_ITEMS) {
    throw new VaultCryptoError("Vault item list is invalid.");
  }
  if (!isRecord(value.sentry)) {
    throw new VaultCryptoError("Vault recovery notes are invalid.");
  }
  const sentry: VaultSentry = {
    deadMansNote: readString(value.sentry.deadMansNote, "Recovery note"),
    recoveryHint: readString(value.sentry.recoveryHint, "Recovery hint")
  };
  return {
    schema: "arkane.vault.v1",
    version: 1,
    updatedAt: readDate(value.updatedAt, "Vault updated time"),
    items: value.items.map(validateItem),
    sentry
  };
}

export function assertEncryptedEnvelope(value: unknown): EncryptedVaultEnvelope {
  if (!isRecord(value) || value.schema !== "arkane.encrypted.v1" || !isRecord(value.kdf) || !isRecord(value.cipher)) {
    throw new VaultCryptoError("Encrypted vault schema is not supported.");
  }
  if (
    value.kdf.name !== "PBKDF2" ||
    value.kdf.hash !== "SHA-256" ||
    value.kdf.iterations !== VAULT_KDF_ITERATIONS ||
    value.cipher.name !== AES_ALGORITHM
  ) {
    throw new VaultCryptoError("Encrypted vault parameters are not supported.");
  }
  return {
    schema: "arkane.encrypted.v1",
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: VAULT_KDF_ITERATIONS,
      salt: readBase64(value.kdf.salt, "Vault salt", 16)
    },
    cipher: {
      name: AES_ALGORITHM,
      iv: readBase64(value.cipher.iv, "Vault IV", 12)
    },
    payload: readBase64(value.payload, "Vault payload", undefined, MAX_ENCRYPTED_PAYLOAD_BYTES),
    updatedAt: readDate(value.updatedAt, "Encrypted vault updated time")
  };
}

export function isEncryptedEnvelope(value: unknown): value is EncryptedVaultEnvelope {
  try {
    assertEncryptedEnvelope(value);
    return true;
  } catch {
    return false;
  }
}

export function assertPinWrappedKey(value: unknown): PinWrappedKey {
  if (!isRecord(value) || value.schema !== "arkane.pinwrap.v1" || !isRecord(value.kdf) || !isRecord(value.cipher)) {
    throw new VaultCryptoError("Quick PIN session is invalid.");
  }
  if (
    value.kdf.name !== "PBKDF2" ||
    value.kdf.hash !== "SHA-256" ||
    value.kdf.iterations !== PIN_KDF_ITERATIONS ||
    value.cipher.name !== AES_ALGORITHM
  ) {
    throw new VaultCryptoError("Quick PIN parameters are invalid.");
  }
  return {
    schema: "arkane.pinwrap.v1",
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: PIN_KDF_ITERATIONS,
      salt: readBase64(value.kdf.salt, "Quick PIN salt", 16)
    },
    cipher: {
      name: AES_ALGORITHM,
      iv: readBase64(value.cipher.iv, "Quick PIN IV", 12)
    },
    wrappedKey: readBase64(value.wrappedKey, "Wrapped session key", undefined, 128),
    expiresAt: readDate(value.expiresAt, "Quick PIN expiry")
  };
}

async function deriveAesKey(
  secret: string,
  salt: Uint8Array,
  iterations: number,
  extractable: boolean
): Promise<CryptoKey> {
  const crypto = getCrypto();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(utf8ToBytes(secret)),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      iterations
    },
    baseKey,
    { name: AES_ALGORITHM, length: 256 },
    extractable,
    ["encrypt", "decrypt"]
  );
}

export async function createVaultKey(masterPassword: string, salt?: string): Promise<VaultKeyMaterial> {
  if (masterPassword.trim().length < 10) {
    throw new VaultCryptoError("Master password must be at least 10 characters.");
  }

  const saltBytes = salt ? base64ToBytes(readBase64(salt, "Vault salt", 16)) : randomBytes(16);
  const key = await deriveAesKey(masterPassword, saltBytes, VAULT_KDF_ITERATIONS, true);
  return {
    key,
    salt: bytesToBase64(saltBytes)
  };
}

export async function encryptVaultWithKey(
  vault: VaultData,
  keyMaterial: VaultKeyMaterial
): Promise<EncryptedVaultEnvelope> {
  const validatedVault = validateVaultData(vault);
  const crypto = getCrypto();
  const iv = randomBytes(12);
  const plaintext = utf8ToBytes(JSON.stringify(validatedVault));
  if (plaintext.byteLength > MAX_ENCRYPTED_PAYLOAD_BYTES) {
    throw new VaultCryptoError("Vault payload is too large.");
  }
  const encrypted = await crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv: toArrayBuffer(iv) },
    keyMaterial.key,
    toArrayBuffer(plaintext)
  );

  return {
    schema: "arkane.encrypted.v1",
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: VAULT_KDF_ITERATIONS,
      salt: keyMaterial.salt
    },
    cipher: {
      name: "AES-GCM",
      iv: bytesToBase64(iv)
    },
    payload: bytesToBase64(encrypted),
    updatedAt: validatedVault.updatedAt
  };
}

export async function decryptVaultWithKey(
  candidate: EncryptedVaultEnvelope,
  key: CryptoKey
): Promise<VaultData> {
  const envelope = assertEncryptedEnvelope(candidate);
  try {
    const crypto = getCrypto();
    const plaintext = await crypto.subtle.decrypt(
      { name: AES_ALGORITHM, iv: toArrayBuffer(base64ToBytes(envelope.cipher.iv)) },
      key,
      toArrayBuffer(base64ToBytes(envelope.payload))
    );
    return validateVaultData(JSON.parse(bytesToUtf8(plaintext)) as unknown);
  } catch (error) {
    if (error instanceof VaultCryptoError) {
      throw error;
    }
    throw new VaultCryptoError("Unable to decrypt vault. Check the master password or vault file.");
  }
}

export async function decryptVaultWithPassword(
  candidate: EncryptedVaultEnvelope,
  masterPassword: string
): Promise<{ vault: VaultData; keyMaterial: VaultKeyMaterial }> {
  const envelope = assertEncryptedEnvelope(candidate);
  const keyMaterial = await createVaultKey(masterPassword, envelope.kdf.salt);
  const vault = await decryptVaultWithKey(envelope, keyMaterial.key);
  return { vault, keyMaterial };
}

function assertPin(pin: string) {
  if (!/^\d{6}$/.test(pin)) {
    throw new VaultCryptoError("Quick PIN must be exactly 6 digits.");
  }
}

export async function wrapVaultKeyWithPin(key: CryptoKey, pin: string): Promise<PinWrappedKey> {
  assertPin(pin);
  const crypto = getCrypto();
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const pinKey = await deriveAesKey(pin, salt, PIN_KDF_ITERATIONS, false);
  const rawKey = await crypto.subtle.exportKey("raw", key);
  const wrapped = await crypto.subtle.encrypt({ name: AES_ALGORITHM, iv: toArrayBuffer(iv) }, pinKey, rawKey);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  return {
    schema: "arkane.pinwrap.v1",
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: PIN_KDF_ITERATIONS,
      salt: bytesToBase64(salt)
    },
    cipher: {
      name: "AES-GCM",
      iv: bytesToBase64(iv)
    },
    wrappedKey: bytesToBase64(wrapped),
    expiresAt
  };
}

export async function unwrapVaultKeyWithPin(candidate: PinWrappedKey, pin: string): Promise<CryptoKey> {
  assertPin(pin);
  const pinWrap = assertPinWrappedKey(candidate);
  if (new Date(pinWrap.expiresAt).getTime() < Date.now()) {
    throw new VaultCryptoError("Quick PIN session has expired.");
  }

  try {
    const crypto = getCrypto();
    const pinKey = await deriveAesKey(pin, base64ToBytes(pinWrap.kdf.salt), PIN_KDF_ITERATIONS, false);
    const rawKey = await crypto.subtle.decrypt(
      { name: AES_ALGORITHM, iv: toArrayBuffer(base64ToBytes(pinWrap.cipher.iv)) },
      pinKey,
      toArrayBuffer(base64ToBytes(pinWrap.wrappedKey))
    );
    return crypto.subtle.importKey("raw", rawKey, { name: AES_ALGORITHM, length: 256 }, true, [
      "encrypt",
      "decrypt"
    ]);
  } catch {
    throw new VaultCryptoError("Quick PIN could not unlock this session.");
  }
}
