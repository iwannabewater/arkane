# Vault Format

Arkane writes a JSON encrypted envelope to the user-configured `vault.json` path. Schema identifiers are stable version boundaries; readers reject unsupported cryptographic parameters instead of attempting silent fallback.

## Encrypted Vault File

Schema: `arkane.encrypted.v1`

| Field | Meaning |
| --- | --- |
| `schema` | Format identifier. |
| `kdf.name`, `kdf.hash` | `PBKDF2` and `SHA-256`. |
| `kdf.iterations` | `310000` for version 1. |
| `kdf.salt` | Base64-encoded 16-byte random salt. |
| `cipher.name` | `AES-GCM`. |
| `cipher.iv` | Base64-encoded 12-byte random IV, new for every encryption. |
| `payload` | Base64 AES-GCM ciphertext containing the vault JSON. |
| `updatedAt` | ISO date string mirroring the encrypted vault revision. |

The implementation rejects payloads larger than 12 MiB, malformed Base64 fields, unsupported KDF costs, or invalid IV and salt sizes before decrypting.

## Decrypted Vault

Schema: `arkane.vault.v1`, version `1`.

The decrypted object contains `items`, `updatedAt`, and `sentry` recovery notes. Items may contain fields, tags, expiry dates, and an optional PNG, JPEG, WebP, or GIF preview bounded to 750 KB at input. The renderer receives only data that passes runtime structure, date, visibility-setting, and preview-format validation.

Older version 1 vaults may contain webhook configuration under `sentry`. Current clients discard that property during validation and never execute or persist notification requests after the next vault write.

## Temporary Session Data

Quick PIN key wrap schema: `arkane.pinwrap.v1`.

- PBKDF2-SHA-256 cost is fixed at `160000` iterations.
- The wrapped AES key is stored in `sessionStorage`.
- The record expires eight hours after creation.
- Three failed PIN attempts remove the wrapped key.

Encrypted snapshot schema: `arkane.session.v1`.

- Stores the encrypted envelope, GitHub file SHA, matching repository path, and whether edits await sync.
- Contains no plaintext items or master password.
- Allows lock/unlock and offline restoration without losing queued edits.
- Is removed when the user disconnects.

## Migration Rule

Adding or changing cipher parameters requires a new encrypted schema version and an explicit migration path. A client must never reinterpret existing ciphertext with altered derivation cost, salt, IV, or algorithm rules.
