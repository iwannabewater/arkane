# Architecture

Arkane is a client-only React PWA. The public application shell operates on an encrypted file in a private repository chosen by the user.

## Data Flow

```text
Master password
     |
     v
PBKDF2-SHA-256 -> AES-GCM vault key
     |                    |
     |                    v
     |             encrypted vault envelope
     |                    |
     v                    v
open React state     GitHub Contents API -> private vault.json
     |
     v
lock -> encrypted session snapshot in sessionStorage
```

No server operated by Arkane processes vault records. The only runtime remote service is the GitHub Contents API for the user-configured repository.

## Module Responsibilities

| Module | Responsibility |
| --- | --- |
| `src/lib/crypto.ts` | Key derivation, AES-GCM encryption, PIN wrapping, schema and parameter validation. |
| `src/lib/github.ts` | Repository path normalization and encrypted Contents API reads/writes. |
| `src/lib/storage.ts` | Browser persistence for connection metadata and encrypted temporary session material. |
| `src/lib/vaultModel.ts` | Normalized connection input, vault record construction, and shared sync-error classification. |
| `src/hooks/useVaultEngine.ts` | Unlock lifecycle, lock transition, revisioned save queue, conflict behavior, and vault mutations. |
| `src/hooks/useVaultGuards.ts` | Visibility, inactivity, reconnect, and pending-edit unload guards. |
| `src/components/` | Presentation, input, accessibility, and user intent only. |
| `vite.config.ts` | Pages base path, PWA manifest, and cache policy. |
| `scripts/verify-build.mjs` | Production CSP and mobile artifact-budget gate executed by the build command. |

## Unlock and Lock Lifecycle

Master unlock fetches an encrypted remote vault or creates an empty encrypted file. If a previous session contains encrypted unsynced edits, Arkane restores that snapshot only when the remote revision still matches its base SHA; a mismatch reports a conflict rather than overwriting another device's work.

An optional Quick PIN wraps the in-memory vault key for eight hours. Successful PIN unlock reads the encrypted session snapshot without requiring a network round trip. After three failed PIN attempts, Arkane discards the wrapped key and requires the master password.

Leaving the application or five minutes of inactivity locks the vault. Locking creates or updates an encrypted session snapshot before removing the decrypted vault and active key reference from application state. If no Quick PIN exists, unlocking again requires the master password.

## Synchronization

Mutations receive a monotonically increasing in-memory revision and are saved after a short debounce. The save queue encrypts and commits a captured revision; it marks the vault clean only when no newer revision has appeared during the request. This prevents a pending edit from being replaced or incorrectly marked committed.

Manual sync commits dirty state. For clean state it reads the current remote encrypted file and refreshes the opened vault only when the GitHub SHA changed. GitHub SHA conflicts remain visible to the user and do not silently overwrite local encrypted changes.

## Mobile Shell

The workspace owns one constrained scroll container under a fixed mobile navigation bar. The add-item flow uses a full-height focused editor on narrow screens and an elevated sheet on larger screens. Background workspace controls become inert while the editor is open, preventing nested interactive scrolling and keyboard focus escape.
