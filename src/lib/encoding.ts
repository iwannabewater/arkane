const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function utf8ToBytes(value: string): Uint8Array {
  return encoder.encode(value);
}

export function bytesToUtf8(value: ArrayBuffer | Uint8Array): string {
  return decoder.decode(value);
}

export function bytesToBase64(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const normalized = value.replace(/\s/g, "");

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(normalized, "base64"));
  }

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function jsonToBase64(value: unknown): string {
  return bytesToBase64(utf8ToBytes(JSON.stringify(value, null, 2)));
}

export function base64ToJson<T>(value: string): T {
  return JSON.parse(bytesToUtf8(base64ToBytes(value))) as T;
}
