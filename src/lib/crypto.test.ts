import { describe, expect, it } from "vitest";
import { createInitialVault } from "../data/initialVault";
import {
  assertPinWrappedKey,
  createVaultKey,
  decryptVaultWithKey,
  decryptVaultWithPassword,
  encryptVaultWithKey,
  isEncryptedEnvelope,
  unwrapVaultKeyWithPin,
  validateVaultData,
  wrapVaultKeyWithPin
} from "./crypto";

describe("vault crypto", () => {
  it("encrypts and decrypts a vault with the master password", async () => {
    const vault = createInitialVault();
    const keyMaterial = await createVaultKey("correct horse battery staple");
    const encrypted = await encryptVaultWithKey(vault, keyMaterial);
    const decrypted = await decryptVaultWithPassword(encrypted, "correct horse battery staple");

    expect(decrypted.vault.schema).toBe("arkane.vault.v1");
    expect(decrypted.vault.items.length).toBe(vault.items.length);
    expect(decrypted.keyMaterial.salt).toBe(keyMaterial.salt);
  });

  it("rejects an incorrect master password", async () => {
    const vault = createInitialVault();
    const keyMaterial = await createVaultKey("correct horse battery staple");
    const encrypted = await encryptVaultWithKey(vault, keyMaterial);

    await expect(decryptVaultWithPassword(encrypted, "incorrect horse battery staple")).rejects.toThrow(
      /Unable to decrypt vault/
    );
  });

  it("wraps the vault key with a 6-digit Quick PIN", async () => {
    const vault = createInitialVault();
    const keyMaterial = await createVaultKey("correct horse battery staple");
    const encrypted = await encryptVaultWithKey(vault, keyMaterial);
    const wrapped = await wrapVaultKeyWithPin(keyMaterial.key, "482913");
    const unwrappedKey = await unwrapVaultKeyWithPin(wrapped, "482913");
    const decrypted = await decryptVaultWithKey(encrypted, unwrappedKey);

    expect(decrypted.updatedAt).toBe(vault.updatedAt);
  });

  it("rejects tampered KDF parameters before doing password work", async () => {
    const keyMaterial = await createVaultKey("correct horse battery staple");
    const encrypted = await encryptVaultWithKey(createInitialVault(), keyMaterial);
    const tampered = {
      ...encrypted,
      kdf: { ...encrypted.kdf, iterations: 1 }
    };

    expect(isEncryptedEnvelope(tampered)).toBe(false);
    await expect(decryptVaultWithPassword(tampered, "correct horse battery staple")).rejects.toThrow(
      /parameters are not supported/
    );
  });

  it("normalizes legacy recovery settings without preserving outbound webhook configuration", () => {
    const legacy = {
      ...createInitialVault(),
      sentry: {
        deadMansNote: "Contact the executor.",
        recoveryHint: "Offline envelope.",
        webhook: { enabled: true, url: "https://example.invalid", method: "POST" }
      }
    };

    expect(validateVaultData(legacy).sentry).toEqual({
      deadMansNote: "Contact the executor.",
      recoveryHint: "Offline envelope."
    });
  });

  it("rejects altered Quick PIN cost parameters", async () => {
    const keyMaterial = await createVaultKey("correct horse battery staple");
    const wrapped = await wrapVaultKeyWithPin(keyMaterial.key, "482913");

    expect(() => assertPinWrappedKey({ ...wrapped, kdf: { ...wrapped.kdf, iterations: 999_999_999 } })).toThrow(
      /parameters are invalid/
    );
  });

  it("rejects malformed visibility settings and unsafe attachment previews", () => {
    const timestamp = new Date().toISOString();
    const item = {
      id: "item-1",
      category: "credentials" as const,
      title: "Document",
      subtitle: "",
      fields: [{ id: "field-1", label: "Code", value: "secret", copyable: true, concealed: true }],
      tags: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const vault = { ...createInitialVault(), items: [item] };

    expect(() =>
      validateVaultData({
        ...vault,
        items: [{ ...item, fields: [{ ...item.fields[0], concealed: "false" }] }]
      })
    ).toThrow(/visibility settings/);
    expect(() =>
      validateVaultData({
        ...vault,
        items: [
          {
            ...item,
            attachment: {
              id: "attachment-1",
              name: "preview.svg",
              mimeType: "image/svg+xml",
              size: 100,
              previewDataUrl: "data:image/svg+xml;base64,PHN2Zy8+"
            }
          }
        ]
      })
    ).toThrow(/preview format/);
  });
});
