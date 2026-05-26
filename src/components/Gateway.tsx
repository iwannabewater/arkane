import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Fingerprint, GitBranch as Github, KeyRound, LockKeyhole, ShieldAlert } from "lucide-react";
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
      <section className="relative mx-auto flex min-h-full w-full max-w-[1360px] flex-col gap-5 py-4 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.78fr)] lg:items-stretch lg:gap-5">
        <div className="flex items-center justify-between gap-3 lg:col-span-2">
          <div className="flex items-center gap-3">
            <LogoMark className="h-12 w-12 rounded-[1.15rem]" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arkane-green">{t.eyebrow}</p>
              <h1 className="font-serif text-3xl text-arkane-text sm:text-4xl">{t.title}</h1>
            </div>
          </div>
          <LanguageToggle language={language} labels={languageLabels} onToggle={onToggleLanguage} />
        </div>

        <div className="hero-ambient vault-plate min-h-[560px] rounded-[2rem] p-5 shadow-glow ring-1 ring-arkane-line sm:p-7 lg:min-h-0 lg:p-9">
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="relative z-10 max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-arkane-brass/20 bg-arkane-canvas/55 px-3 py-2 text-xs text-arkane-muted shadow-inset">
                <CheckCircle2 className="h-4 w-4 text-arkane-green" />
                <span>{syncMessage}</span>
              </div>
              <p className="hero-title text-balance font-serif text-arkane-text" aria-label={t.tagline}>
                {t.taglineLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-arkane-muted sm:text-xl">{t.proof}</p>
            </div>

            <div className="relative z-10 grid gap-3 sm:grid-cols-3">
              {t.signals.map((signal) => (
                <div
                  key={signal.value}
                  className="interactive-surface rounded-[1.35rem] border border-white/[0.06] bg-arkane-canvas/55 p-4 shadow-inset"
                >
                  <span className="block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-arkane-amber">
                    {signal.value}
                  </span>
                  <span className="mt-1 block text-base text-arkane-muted">{signal.label}</span>
                </div>
              ))}
            </div>

            <VaultSigil />

            {storedConnection ? (
              <div className="relative z-10 rounded-2xl bg-arkane-canvas/55 p-4 shadow-inset ring-1 ring-arkane-line">
                <div className="flex items-center gap-3 text-sm text-arkane-muted">
                  <Github className="h-5 w-5 shrink-0 text-arkane-green" />
                  <span className="min-w-0 truncate">
                    {storedConnection.repo} · {t.storedToken}
                  </span>
                </div>
              </div>
            ) : (
              <p className="relative z-10 max-w-2xl text-pretty text-sm leading-6 text-arkane-faint">{t.securityNote}</p>
            )}
          </div>
        </div>

        <div className="vault-plate rounded-[2rem] bg-arkane-deck/95 p-3 shadow-glow ring-1 ring-arkane-line sm:p-4 lg:self-start">
          {hasQuickPin && storedConnection ? (
            <form onSubmit={submitPin} className="relative mb-3 rounded-[1.35rem] bg-white/[0.045] p-4 shadow-inset ring-1 ring-white/[0.07]">
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
                  className="tap-target interactive-surface inline-flex justify-center rounded-xl bg-arkane-amber px-4 font-semibold text-arkane-canvas shadow-amber active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.quickPinSubmit}
                </button>
              </div>
            </form>
          ) : null}

          <form onSubmit={submitMaster} className="relative rounded-[1.45rem] bg-arkane-canvas/50 p-4 ring-1 ring-white/[0.06] sm:p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-arkane-green/12 text-arkane-green ring-1 ring-arkane-green/20">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-3xl text-arkane-text">{t.masterTitle}</h2>
                <p className="mt-1 text-sm leading-5 text-arkane-muted">{t.masterHelp}</p>
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
                className="tap-target interactive-surface inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-arkane-green px-5 font-semibold text-arkane-canvas shadow-amber active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                {t.openVault}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function VaultSigil() {
  return (
    <div className="pointer-events-none absolute right-8 top-20 z-0 hidden w-[30%] max-w-[300px] opacity-35 lg:block" aria-hidden="true">
      <svg viewBox="0 0 360 360" className="vault-sigil h-full w-full">
        <circle cx="180" cy="180" r="134" fill="none" stroke="oklch(75% 0.095 78 / 0.2)" strokeWidth="1.5" />
        <circle cx="180" cy="180" r="98" fill="none" stroke="oklch(71% 0.115 153 / 0.18)" strokeWidth="1.5" />
        <path d="M180 54 289 102v84c0 78-41 130-109 160C112 316 71 264 71 186v-84L180 54Z" fill="oklch(7% 0.012 286 / 0.58)" stroke="oklch(75% 0.095 78 / 0.54)" strokeWidth="5" />
        <path d="M143 180 170 207 221 139" fill="none" stroke="oklch(91.5% 0.034 88 / 0.9)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        {Array.from({ length: 36 }, (_, index) => {
          const angle = index * 10;
          const long = index % 3 === 0;
          return (
            <line
              key={angle}
              x1="180"
              y1={long ? "20" : "30"}
              x2="180"
              y2="38"
              stroke={long ? "oklch(75% 0.095 78 / 0.42)" : "oklch(91.5% 0.034 88 / 0.15)"}
              strokeWidth={long ? "2" : "1"}
              transform={`rotate(${angle} 180 180)`}
            />
          );
        })}
      </svg>
    </div>
  );
}
