import { FormEvent, useState } from "react";
import { Fingerprint, GitBranch as Github, KeyRound, LockKeyhole, ShieldAlert } from "lucide-react";
import type { GitHubConnection } from "../types";
import type { MasterUnlockInput } from "../hooks/useVaultEngine";
import { LogoMark } from "./LogoMark";

interface GatewayProps {
  storedConnection: GitHubConnection | null;
  hasQuickPin: boolean;
  syncMessage: string;
  onMasterUnlock: (input: MasterUnlockInput) => Promise<void>;
  onPinUnlock: (pin: string) => Promise<void>;
}

export function Gateway({ storedConnection, hasQuickPin, syncMessage, onMasterUnlock, onPinUnlock }: GatewayProps) {
  const [token, setToken] = useState(storedConnection?.token ?? "");
  const [repo, setRepo] = useState(storedConnection?.repo ?? "");
  const [branch, setBranch] = useState(storedConnection?.branch ?? "main");
  const [path, setPath] = useState(storedConnection?.path ?? "vault.json");
  const [masterPassword, setMasterPassword] = useState("");
  const [quickPin, setQuickPin] = useState("");
  const [pinUnlock, setPinUnlock] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submitMaster(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onMasterUnlock({
        token,
        repo,
        branch,
        path,
        masterPassword,
        quickPin: quickPin || undefined
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unlock failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onPinUnlock(pinUnlock);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Quick PIN failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      id="main-content"
      className="app-scroll h-full overflow-y-auto px-4 pb-10 pt-[calc(env(safe-area-inset-top)+18px)] sm:px-6 lg:px-8"
    >
      <section className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center gap-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-7">
          <div className="flex items-center gap-4">
            <LogoMark />
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-arkane-green">ARKANE SECURE GATEWAY</p>
              <h1 className="font-serif text-4xl font-semibold tracking-[-0.022em] text-arkane-text sm:text-5xl">
                Arkane
              </h1>
            </div>
          </div>

          <div className="max-w-xl space-y-4">
            <p className="text-balance font-serif text-2xl leading-tight tracking-[-0.012em] text-arkane-text sm:text-3xl">
              Private vault, encrypted locally, committed to your GitHub repository.
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs text-arkane-muted">
              <div className="rounded-lg bg-white/[0.035] px-3 py-3 ring-1 ring-arkane-line">
                <span className="block font-mono text-arkane-amber">AES-GCM</span>
                <span>client-side</span>
              </div>
              <div className="rounded-lg bg-white/[0.035] px-3 py-3 ring-1 ring-arkane-line">
                <span className="block font-mono text-arkane-amber">PWA</span>
                <span>offline shell</span>
              </div>
              <div className="rounded-lg bg-white/[0.035] px-3 py-3 ring-1 ring-arkane-line">
                <span className="block font-mono text-arkane-amber">GitHub</span>
                <span>private sync</span>
              </div>
            </div>
          </div>

          {storedConnection ? (
            <div className="rounded-lg bg-white/[0.03] p-4 ring-1 ring-arkane-line">
              <div className="flex items-center gap-3 text-sm text-arkane-muted">
                <Github className="h-5 w-5 text-arkane-green" />
                <span className="truncate">
                  {storedConnection.repo} · token stored in this browser
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl bg-arkane-deck/95 p-4 shadow-glow ring-1 ring-arkane-line sm:p-5">
          {hasQuickPin && storedConnection ? (
            <form onSubmit={submitPin} className="mb-4 rounded-xl bg-white/[0.035] p-4 ring-1 ring-arkane-line">
              <div className="mb-3 flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-arkane-amber" />
                <div>
                  <h2 className="font-serif text-lg text-arkane-text">Quick PIN</h2>
                  <p className="text-sm text-arkane-muted">Expires after 8 hours. Three failed attempts disable it.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <label className="sr-only" htmlFor="pin-unlock">
                  6-digit Quick PIN
                </label>
                <input
                  id="pin-unlock"
                  value={pinUnlock}
                  onChange={(event) => setPinUnlock(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  className="min-h-11 flex-1 rounded-lg bg-black/30 px-4 font-mono text-lg tracking-[0.35em] text-arkane-text outline-none ring-1 ring-arkane-line transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-arkane-amber"
                />
                <button
                  type="submit"
                  disabled={busy || pinUnlock.length !== 6}
                  className="tap-target rounded-lg bg-arkane-amber px-4 font-semibold text-black transition-transform duration-150 ease-arkane active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Unlock
                </button>
              </div>
            </form>
          ) : null}

          <form onSubmit={submitMaster} className="space-y-4">
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-arkane-green" />
              <div>
                <h2 className="font-serif text-xl text-arkane-text">Master unlock</h2>
                <p className="text-sm text-arkane-muted">The master password stays in memory only.</p>
              </div>
            </div>

            <div className="grid gap-3">
              <label className="space-y-2">
                <span className="text-sm text-arkane-muted">GitHub Personal Access Token</span>
                <input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="github_pat_..."
                  className="min-h-11 w-full rounded-lg bg-black/30 px-4 font-mono text-sm text-arkane-text outline-none ring-1 ring-arkane-line transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-arkane-amber"
                />
                <span className="block text-xs leading-relaxed text-arkane-faint">
                  Stored in this browser to reconnect. Use a fine-grained token limited to your private vault repository.
                </span>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-arkane-muted">Private repo</span>
                <input
                  value={repo}
                  onChange={(event) => setRepo(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="username/arkane-vault"
                  className="min-h-11 w-full rounded-lg bg-black/30 px-4 font-mono text-sm text-arkane-text outline-none ring-1 ring-arkane-line transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-arkane-amber"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-2">
                  <span className="text-sm text-arkane-muted">Branch</span>
                  <input
                    value={branch}
                    onChange={(event) => setBranch(event.target.value)}
                    className="min-h-11 w-full rounded-lg bg-black/30 px-4 font-mono text-sm text-arkane-text outline-none ring-1 ring-arkane-line transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-arkane-amber"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-arkane-muted">Vault path</span>
                  <input
                    value={path}
                    onChange={(event) => setPath(event.target.value)}
                    className="min-h-11 w-full rounded-lg bg-black/30 px-4 font-mono text-sm text-arkane-text outline-none ring-1 ring-arkane-line transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-arkane-amber"
                  />
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm text-arkane-muted">Master password</span>
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(event) => setMasterPassword(event.target.value)}
                  autoComplete="current-password"
                  className="min-h-11 w-full rounded-lg bg-black/30 px-4 text-arkane-text outline-none ring-1 ring-arkane-line transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-arkane-amber"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-arkane-muted">Set 6-digit Quick PIN</span>
                <input
                  value={quickPin}
                  onChange={(event) => setQuickPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="optional"
                  className="min-h-11 w-full rounded-lg bg-black/30 px-4 font-mono text-sm tracking-[0.24em] text-arkane-text outline-none ring-1 ring-arkane-line transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-arkane-amber"
                />
                <span className="block text-xs leading-relaxed text-arkane-faint">
                  Optional device-session convenience. It does not replace the master password.
                </span>
              </label>
            </div>

            {error ? (
              <div className="flex gap-3 rounded-lg bg-arkane-red/15 p-3 text-sm text-red-100 ring-1 ring-arkane-red/30">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <p className="min-h-5 text-xs text-arkane-faint">{syncMessage}</p>
              <button
                type="submit"
                disabled={busy}
                className="tap-target inline-flex items-center gap-2 rounded-lg bg-arkane-green px-5 font-semibold text-black transition-transform duration-150 ease-arkane active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                Open vault
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
