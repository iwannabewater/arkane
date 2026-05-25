# Security Policy

Arkane protects vault confidentiality in a browser application backed by a private GitHub repository. Review this document before storing real secrets.

## Reporting a Vulnerability

Do not report a vulnerability containing secrets, tokens, or vault content in a public issue. Use [GitHub private vulnerability reporting](https://github.com/iwannabewater/arkane/security/advisories/new) with reproduction steps, affected version or commit, and impact.

## Security Model

Arkane encrypts each vault in the browser with AES-256-GCM. The vault key is derived from the master password with PBKDF2-HMAC-SHA-256 and a random salt. The GitHub Contents API receives an encrypted envelope only.

The application makes runtime network requests only to `https://api.github.com` for the repository configured by the user. Arkane does not send vault metadata to notification providers, analytics services, or telemetry systems.

| Boundary | Guarantee | Limitation |
| --- | --- | --- |
| Master password | Arkane does not persist it. | A compromised page, browser extension, or device can observe it while entered. |
| GitHub token | The interface requests a repository-scoped fine-grained token. | Product requirements store it in `localStorage`; script execution on this origin can read it. |
| Vault file | GitHub receives AES-GCM ciphertext and encryption parameters. | Losing the master password makes recovery impossible. |
| Quick PIN | Wraps the current vault key for at most eight hours in `sessionStorage`; three failed attempts disable PIN unlock. | Six digits are for short session convenience, not a substitute for the master password. |
| Locked state | Leaving the application or five minutes of inactivity removes decrypted React state; unsynced data is retained only as an encrypted session snapshot. | A device compromised while the vault is open can access displayed secrets. |

## User Requirements

1. Use a private vault repository separate from this public application repository.
2. Create a fine-grained GitHub token limited to that single repository with Contents read/write access.
3. Revoke the token immediately after suspected browser or device compromise.
4. Use a unique master password and maintain a separate offline recovery record.
5. Lock the vault before handing the device to another person; disconnect on shared devices.

## Cryptographic and Data Format Boundaries

- `src/lib/crypto.ts` uses the browser Web Crypto API directly; no external cryptographic wrapper belongs in the runtime path.
- Arkane validates cipher parameters, payload limits, PIN wrapping parameters, dates, attachment bounds, and decrypted vault structure before rendering data.
- The format is versioned. See [docs/VAULT_FORMAT.md](docs/VAULT_FORMAT.md) for supported schema identifiers and migration rules.

## Deployment Hardening

The application ships a Content Security Policy that prevents runtime connections outside its own origin, local development sockets, and the GitHub API. The deployment workflow verifies tests and the production build before publishing the Pages artifact.

Security fixes require `npm run check`, a mobile lock/scroll verification at 375 px, and review of any change touching storage, cryptography, GitHub requests, or service-worker behavior.
