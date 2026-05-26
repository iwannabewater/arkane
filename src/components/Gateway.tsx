import { FormEvent, useState } from "react";
import { Fingerprint, GitBranch as Github, KeyRound, LockKeyhole, ShieldAlert, ShieldCheck } from "lucide-react";
import type { MasterUnlockInput } from "../hooks/useVaultEngine";
import { copy, type AppLanguage, localizeError } from "../lib/i18n";
import type { GitHubConnection } from "../types";
import { LanguageToggle } from "./LanguageToggle";
import { LogoMark } from "./LogoMark";

interface GatewayProps {
  copy: (typeof copy)[AppLanguage]["gateway"];
  language: AppLanguage;
  languageLabels: (typeof copy)[AppLanguage]["language"];
  storedConnection: GitHubConnection | null;
  hasQuickPin: boolean;
  syncMessage: string;
  onToggleLanguage: () => void;
  onMasterUnlock: (input: MasterUnlockInput) => Promise<void>;
  onPinUnlock: (pin: string) => Promise<void>;
}

export function Gateway({
  copy: t,
  language,
  languageLabels,
  storedConnection,
  hasQuickPin,
  syncMessage,
  onToggleLanguage,
  onMasterUnlock,
  onPinUnlock
}: GatewayProps) {
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
      setError(localizeError(nextError, "Unlock failed.", language));
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
      setError(localizeError(nextError, "Quick PIN failed.", language));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      id="main-content"
      className="app-scroll scroll-fade h-full overflow-y-auto px-4 pb-8 pt-[calc(env(safe-area-inset-top)+14px)] sm:px-6 lg:px-8"
    >
      <section className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center gap-5 py-4 lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:items-center lg:gap-7">
        <div className="flex items-center justify-between gap-3 lg:col-span-2">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10 rounded-2xl" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arkane-green">{t.eyebrow}</p>
              <h1 className="font-serif text-xl font-semibold text-arkane-text">{t.title}</h1>
            </div>
          </div>
          <LanguageToggle language={language} labels={languageLabels} onToggle={onToggleLanguage} />
        </div>

        <div className="space-y-5">
          <div className="vault-plate rounded-[1.75rem] bg-arkane-deck/88 p-5 shadow-glow ring-1 ring-arkane-line sm:p-6">
            <div className="relative space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-balance font-serif text-3xl font-semibold leading-[1.04] text-arkane-text sm:text-5xl">
                    {t.tagline}
                  </p>
                  <p className="mt-4 max-w-xl text-pretty text-sm leading-6 text-arkane-muted sm:text-base">{t.proof}</p>
                </div>
                <div className="hidden h-16 w-16 shrink-0 place-items-center rounded-[1.25rem] bg-black/25 text-arkane-amber shadow-inset ring-1 ring-arkane-line sm:grid">
                  <ShieldCheck className="h-8 w-8" strokeWidth={1.6} />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {t.signals.map((signal) => (
                  <div key={signal.value} className="rounded-2xl bg-white/[0.04] p-3 shadow-inset ring-1 ring-white/[0.065]">
                    <span className="block font-mono text-xs font-semibold uppercase tracking-[0.12em] text-arkane-amber">
                      {signal.value}
                    </span>
                    <span className="text-sm text-arkane-muted">{signal.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {storedConnection ? (
            <div className="rounded-2xl bg-white/[0.035] p-4 shadow-inset ring-1 ring-arkane-line">
              <div className="flex items-center gap-3 text-sm text-arkane-muted">
                <Github className="h-5 w-5 shrink-0 text-arkane-green" />
                <span className="min-w-0 truncate">
                  {storedConnection.repo} · {t.storedToken}
                </span>
              </div>
            </div>
          ) : (
            <p className="max-w-xl text-pretty text-sm leading-6 text-arkane-faint">{t.securityNote}</p>
          )}
        </div>

        <div className="rounded-[1.75rem] bg-arkane-deck/95 p-3 shadow-glow ring-1 ring-arkane-line sm:p-4">
          {hasQuickPin && storedConnection ? (
            <form onSubmit={submitPin} className="mb-3 rounded-[1.25rem] bg-white/[0.04] p-4 shadow-inset ring-1 ring-white/[0.07]">
              <div className="mb-3 flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-arkane-amber/12 text-arkane-amber ring-1 ring-arkane-amber/20">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg text-arkane-text">{t.quickPinTitle}</h2>
                  <p className="text-sm leading-5 text-arkane-muted">{t.quickPinHelp}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 min-[420px]:flex-row">
                <label className="sr-only" htmlFor="pin-unlock">
                  {t.quickPinLabel}
                </label>
                <input
                  id="pin-unlock"
                  value={pinUnlock}
                  onChange={(event) => setPinUnlock(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder={t.quickPinPlaceholder}
                  className="field-control flex-1 text-center font-mono text-lg tracking-[0.35em] min-[420px]:text-left"
                />
                <button
                  type="submit"
                  disabled={busy || pinUnlock.length !== 6}
                  className="tap-target inline-flex justify-center rounded-xl bg-arkane-amber px-4 font-semibold text-black shadow-amber transition-[transform,opacity] duration-150 ease-arkane active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.quickPinSubmit}
                </button>
              </div>
            </form>
          ) : null}

          <form onSubmit={submitMaster} className="rounded-[1.25rem] bg-black/[0.16] p-4 ring-1 ring-white/[0.055]">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-arkane-green/12 text-arkane-green ring-1 ring-arkane-green/20">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-arkane-text">{t.masterTitle}</h2>
                <p className="text-sm leading-5 text-arkane-muted">{t.masterHelp}</p>
              </div>
            </div>

            <div className="grid gap-3">
              <label className="space-y-2">
                <span className="text-sm text-arkane-muted">{t.tokenLabel}</span>
                <input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={t.tokenPlaceholder}
                  className="field-control font-mono text-sm"
                />
                <span className="block text-xs leading-relaxed text-arkane-faint">{t.tokenHelp}</span>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-arkane-muted">{t.repoLabel}</span>
                <input
                  value={repo}
                  onChange={(event) => setRepo(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={t.repoPlaceholder}
                  className="field-control font-mono text-sm"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-arkane-muted">{t.branchLabel}</span>
                  <input value={branch} onChange={(event) => setBranch(event.target.value)} className="field-control font-mono text-sm" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-arkane-muted">{t.pathLabel}</span>
                  <input value={path} onChange={(event) => setPath(event.target.value)} className="field-control font-mono text-sm" />
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm text-arkane-muted">{t.passwordLabel}</span>
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(event) => setMasterPassword(event.target.value)}
                  autoComplete="current-password"
                  className="field-control"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-arkane-muted">{t.quickPinSetLabel}</span>
                <input
                  value={quickPin}
                  onChange={(event) => setQuickPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder={t.quickPinSetPlaceholder}
                  className="field-control font-mono text-sm tracking-[0.24em]"
                />
                <span className="block text-xs leading-relaxed text-arkane-faint">{t.quickPinSetHelp}</span>
              </label>
            </div>

            {error ? (
              <div className="mt-4 flex gap-3 rounded-2xl bg-arkane-red/15 p-3 text-sm text-red-100 ring-1 ring-arkane-red/30">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-h-5 min-w-0 text-xs leading-5 text-arkane-faint">{syncMessage}</p>
              <button
                type="submit"
                disabled={busy}
                className="tap-target inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-arkane-green px-5 font-semibold text-black shadow-amber transition-[transform,opacity] duration-150 ease-arkane active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                {t.openVault}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
