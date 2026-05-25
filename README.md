# Arkane

Arkane is a mobile-first encrypted vault that runs as a static Progressive Web App. The application is hosted publicly; each user's vault is stored as one encrypted `vault.json` file in a private GitHub repository selected during sign-in.

Live application: [https://whynotsleep.cc/arkane/](https://whynotsleep.cc/arkane/)

## Properties

- Encryption and decryption run in the browser through the Web Crypto API.
- Arkane sends vault content only as an encrypted envelope to the configured private GitHub repository.
- The application has no analytics, telemetry, notification webhooks, or third-party runtime scripts.
- Leaving the application or remaining inactive for five minutes locks it and removes decrypted vault data from the rendered application. An encrypted session snapshot preserves edits waiting to sync.
- Quick PIN is a temporary convenience mechanism. It expires after eight hours and is disabled after three failed attempts.

## Trust Boundary

| Data | Location | Notes |
| --- | --- | --- |
| Application files | Public GitHub Pages site | Contains no user vault data. |
| Encrypted vault envelope | User-selected private GitHub repository | Written through the GitHub Contents API. |
| GitHub fine-grained token and repo connection | Browser `localStorage` | Required for reconnecting; exposed if the browser profile or page origin is compromised. |
| PIN-wrapped temporary key and encrypted session snapshot | Browser `sessionStorage` | Cleared when the browser session ends or the user disconnects. |
| Master password | Unlock form state and derivation call only | Never stored by Arkane. |

Read [SECURITY.md](SECURITY.md) before putting real credentials in a vault. It explains the threat model, token permissions, device risks, recovery expectations, and vulnerability reporting.

## First Use

1. Create a private GitHub repository for vault data, for example `username/arkane-vault`.
2. Create a fine-grained personal access token restricted to that repository with Contents read/write access.
3. Open the application, enter the private repository, token, and a master password of at least ten characters.
4. Optionally set a six-digit Quick PIN for the current browser session.

If `vault.json` does not exist, Arkane creates an empty encrypted vault. The application does not seed a new repository with sample credentials.

## Development

Requirements: Node.js 24 and npm.

```bash
npm ci
npm run dev
```

Run the stable verification gate before submitting changes:

```bash
npm run check
```

For interface changes, test both a desktop viewport and a 375 px mobile viewport, including lock/unlock, long recovery notes, item creation, and scrolling with the editor open.

## Architecture

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) describes state ownership, encryption, synchronization, and locking behavior.
- [docs/VAULT_FORMAT.md](docs/VAULT_FORMAT.md) documents the encrypted file and temporary session formats.
- [CONTRIBUTING.md](CONTRIBUTING.md) defines engineering boundaries and review requirements.

## Deployment

The public shell is built by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) and published to GitHub Pages at [https://whynotsleep.cc/arkane/](https://whynotsleep.cc/arkane/). `vite.config.ts` uses the `/arkane/` base path required by this deployment.

The application repository is public static hosting. Store real vault data only in the separate private repository configured in the application.
