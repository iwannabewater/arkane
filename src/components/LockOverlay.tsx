import { FormEvent, useEffect, useRef, useState } from "react";
import { Fingerprint, LockKeyhole, ShieldAlert } from "lucide-react";
import { LogoMark } from "./LogoMark";

export function LockOverlay({
  onPinUnlock,
  onFullUnlock
}: {
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
      setError(nextError instanceof Error ? nextError.message : "Quick PIN failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black px-4">
      <form
        ref={dialogRef}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-locked-title"
        className="w-full max-w-sm rounded-2xl bg-arkane-deck p-5 shadow-glow ring-1 ring-arkane-line"
      >
        <div className="mb-5 flex items-center gap-3">
          <LogoMark className="h-11 w-11 rounded-2xl" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arkane-green">Session locked</p>
            <h2 id="session-locked-title" className="font-serif text-2xl tracking-[-0.012em] text-arkane-text">Arkane</h2>
          </div>
        </div>

        <label className="space-y-2">
          <span className="flex items-center gap-2 text-sm text-arkane-muted">
            <Fingerprint className="h-4 w-4 text-arkane-amber" />
            6-digit Quick PIN
          </span>
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="••••••"
            className="min-h-12 w-full rounded-lg bg-black/30 px-4 text-center font-mono text-xl tracking-[0.42em] text-arkane-text outline-none ring-1 ring-arkane-line transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-arkane-amber"
          />
        </label>
        <p className="mt-3 text-xs leading-relaxed text-arkane-faint">
          The decrypted vault has been removed from the screen. Three incorrect PIN entries require the master password.
        </p>

        {error ? (
          <div className="mt-3 flex gap-2 rounded-lg bg-arkane-red/15 p-3 text-sm text-red-100 ring-1 ring-arkane-red/30">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onFullUnlock}
            className="tap-target flex-1 rounded-lg bg-white/[0.04] px-4 text-sm text-arkane-muted ring-1 ring-arkane-line transition-transform duration-150 ease-arkane active:scale-95"
          >
            Master password
          </button>
          <button
            type="submit"
            disabled={busy || pin.length !== 6}
            className="tap-target inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-arkane-amber px-4 font-semibold text-black transition-transform duration-150 ease-arkane active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LockKeyhole className="h-4 w-4" />
            Unlock
          </button>
        </div>
      </form>
    </div>
  );
}
