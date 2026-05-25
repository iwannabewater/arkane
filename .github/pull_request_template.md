## Change

Describe the user-visible behavior and why the change is needed.

## Security impact

- [ ] No change to cryptography, token storage, locking, GitHub writes, CSP, or deployment.
- [ ] Security-sensitive behavior changed and is described below.

Security-sensitive details:

## Verification

- [ ] `npm run check`
- [ ] Desktop interface inspected when UI changed
- [ ] 375 px mobile interface inspected when UI changed
- [ ] Lock/unlock and pending-sync behavior inspected when security or storage changed

## Data and network review

- [ ] No plaintext vault data, token, or master password is logged or committed.
- [ ] No analytics, telemetry, external notification endpoint, or runtime script was added.
