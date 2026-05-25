# Contributing

Arkane handles user secrets. Changes should preserve its small, auditable trust boundary.

## Set Up

Use Node.js 24 and npm:

```bash
npm ci
npm run dev
```

Run the required gate before opening a pull request:

```bash
npm run check
```

The production build enforces a restricted GitHub-only network CSP and a mobile PWA artifact budget. Do not bypass the build-policy verifier when changing assets, fonts, or runtime connections.

## Code Boundaries

- Keep cryptographic operations in `src/lib/crypto.ts` and use the Web Crypto API only.
- Keep GitHub Contents API reads and encrypted writes in `src/lib/github.ts`. Never log access tokens, plaintext vault records, or decrypted payloads.
- Keep login, unlock, encrypted session snapshots, and commit ordering in `src/hooks/useVaultEngine.ts`; keep browser lifecycle guards in `src/hooks/useVaultGuards.ts`.
- Keep UI components focused on rendering and user input. Route vault mutations through `useVaultEngine`.
- Keep the PWA manifest, Pages base path, and service-worker policy in `vite.config.ts`.
- Do not add telemetry, analytics, arbitrary outbound notifications, or third-party runtime scripts.

## Security Invariants

- The master password is never persisted.
- `localStorage` stores only the GitHub connection required for reconnecting, including its fine-grained token.
- `sessionStorage` may contain a time-limited PIN-wrapped key and an encrypted vault snapshot; it must never contain plaintext vault data or a master password.
- Every GitHub write of vault data must contain an encrypted `arkane.encrypted.v1` envelope.
- Any change to locking or save ordering must retain pending edits through a lock/unlock transition.

## Interface Review

For changes under `src/components/`, `src/App.tsx`, or `src/styles.css`, inspect desktop and 375 px mobile layouts. Confirm that the main workspace scrolls in every section, the item editor owns its scroll area, keyboard focus remains within the editor, and locking removes decrypted content from the screen.

## Pull Requests

Describe the user-facing change, security impact, and verification performed. Keep generated files and local environment files out of commits. Changes touching cryptography, token storage, lock behavior, GitHub writes, CSP, or deployment workflows need explicit security review.
