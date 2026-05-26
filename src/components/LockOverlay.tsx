import { FormEvent, useEffect, useRef, useState } from "react";
import { Fingerprint, LockKeyhole, ShieldAlert } from "lucide-react";
import { copy, type AppLanguage, localizeError } from "../lib/i18n";
import { LanguageToggle } from "./LanguageToggle";
import { LogoMark } from "./LogoMark";

export function LockOverlay({
  copy: t,
  language,
  languageLabels,
  onToggleLanguage,
  onPinUnlock,
  onFullUnlock
}: {
  copy: (typeof copy)[AppLanguage]["lock"];
  language: AppLanguage;
  languageLabels: (typeof copy)[AppLanguage]["language"];
  onToggleLanguage: () => void;
  onPinUnlock: (pin: string) => Promise<void>;
  onFullUnlock: () => void;
}) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])");
      if (!focusable?.length) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onPinUnlock(pin);
    } catch (nextError) {
      setError(localizeError(nextError, "Quick PIN failed.", language));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-grid fixed inset-0 z-[70] grid place-items-center bg-arkane-canvas px-4">
      <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+14px)]">
        <LanguageToggle compact language={language} labels={languageLabels} onToggle={onToggleLanguage} />
      </div>
      <form
        ref={dialogRef}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-locked-title"
        className="vault-plate w-full max-w-sm rounded-[1.75rem] bg-arkane-deck/95 p-5 shadow-glow ring-1 ring-arkane-line"
      >
        <div className="relative">
          <div className="mb-5 flex items-center gap-3">
            <LogoMark className="h-11 w-11 rounded-2xl" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arkane-green">{t.eyebrow}</p>
              <h2 id="session-locked-title" className="font-serif text-2xl text-arkane-text">
                {t.title}
              </h2>
            </div>
          </div>

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm text-arkane-muted">
              <Fingerprint className="h-4 w-4 text-arkane-amber" />
              {t.pinLabel}
            </span>
            <input
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="••••••"
              className="field-control text-center font-mono text-xl tracking-[0.42em]"
            />
          </label>
          <p className="mt-3 text-pretty text-xs leading-relaxed text-arkane-faint">{t.help}</p>

          {error ? (
            <div className="mt-3 flex gap-2 rounded-2xl bg-arkane-red/15 p-3 text-sm text-red-100 ring-1 ring-arkane-red/30">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="mt-5 grid gap-2 min-[380px]:grid-cols-2">
            <button
              type="button"
              onClick={onFullUnlock}
              className="tap-target interactive-surface rounded-xl bg-white/[0.045] px-4 text-sm text-arkane-muted shadow-inset ring-1 ring-arkane-line active:scale-[0.96] [@media(hover:hover)]:hover:bg-white/[0.075] [@media(hover:hover)]:hover:text-arkane-text"
            >
              {t.masterPassword}
            </button>
            <button
              type="submit"
              disabled={busy || pin.length !== 6}
              className="tap-target interactive-surface inline-flex items-center justify-center gap-2 rounded-xl bg-arkane-amber px-4 font-semibold text-arkane-canvas shadow-amber active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LockKeyhole className="h-4 w-4" />
              {t.unlock}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
