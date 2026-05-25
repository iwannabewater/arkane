import { useEffect, type MutableRefObject } from "react";

const AUTO_LOCK_MS = 5 * 60 * 1000;

interface VaultGuardsInput {
  stage: string;
  dirtyRef: MutableRefObject<boolean>;
  flushVault: () => Promise<void>;
  lock: () => Promise<void>;
}

export function useVaultGuards({ stage, dirtyRef, flushVault, lock }: VaultGuardsInput) {
  useEffect(() => {
    const retryOnOnline = () => {
      if (dirtyRef.current && stage === "ready") {
        void flushVault().catch(() => undefined);
      }
    };
    const lockOnHidden = () => {
      if (document.hidden) {
        void lock();
      }
    };
    const warnOnUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", lockOnHidden);
    window.addEventListener("blur", lock);
    window.addEventListener("online", retryOnOnline);
    window.addEventListener("beforeunload", warnOnUnload);
    return () => {
      document.removeEventListener("visibilitychange", lockOnHidden);
      window.removeEventListener("blur", lock);
      window.removeEventListener("online", retryOnOnline);
      window.removeEventListener("beforeunload", warnOnUnload);
    };
  }, [dirtyRef, flushVault, lock, stage]);

  useEffect(() => {
    if (stage !== "ready") {
      return;
    }
    let idleTimer = window.setTimeout(() => void lock(), AUTO_LOCK_MS);
    const restartTimer = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => void lock(), AUTO_LOCK_MS);
    };
    document.addEventListener("pointerdown", restartTimer, { passive: true });
    document.addEventListener("keydown", restartTimer);
    return () => {
      window.clearTimeout(idleTimer);
      document.removeEventListener("pointerdown", restartTimer);
      document.removeEventListener("keydown", restartTimer);
    };
  }, [lock, stage]);
}
