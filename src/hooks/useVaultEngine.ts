import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createInitialVault } from "../data/initialVault";
import {
  createVaultKey,
  decryptVaultWithKey,
  decryptVaultWithPassword,
  encryptVaultWithKey,
  unwrapVaultKeyWithPin,
  wrapVaultKeyWithPin,
  type VaultKeyMaterial
} from "../lib/crypto";
import { fetchVaultFile, saveVaultFile } from "../lib/github";
import {
  clearConnection,
  clearPinWrap,
  clearSessionSnapshot,
  loadConnection,
  loadPinWrap,
  loadSessionSnapshot,
  recordPinFailure,
  resetPinFailures,
  saveConnection,
  savePinWrap,
  saveSessionSnapshot
} from "../lib/storage";
import { createVaultItem, normalizeConnection, nowIso, stampVault, syncFailureState } from "../lib/vaultModel";
import type { MasterUnlockInput, NewVaultItemInput } from "../lib/vaultModel";
import type { GitHubConnection, SyncState, VaultData, VaultSentry } from "../types";
import { useVaultGuards } from "./useVaultGuards";

export type { MasterUnlockInput, NewVaultItemInput } from "../lib/vaultModel";

type Stage = "gateway" | "ready" | "locking" | "soft-locked";

const INITIAL_SYNC: SyncState = {
  status: "idle",
  message: "No active vault"
};
export function useVaultEngine() {
  const storedConnection = useMemo(() => loadConnection(), []);
  const [stage, setStage] = useState<Stage>("gateway");
  const [connection, setConnection] = useState<GitHubConnection | null>(storedConnection);
  const [vault, setVault] = useState<VaultData | null>(null);
  const [syncState, setSyncState] = useState<SyncState>(INITIAL_SYNC);
  const [hasQuickPin, setHasQuickPin] = useState(() => Boolean(loadPinWrap()));

  const keyMaterialRef = useRef<VaultKeyMaterial | null>(null);
  const connectionRef = useRef<GitHubConnection | null>(storedConnection);
  const shaRef = useRef<string | undefined>(undefined);
  const latestVaultRef = useRef<VaultData | null>(null);
  const stageRef = useRef<Stage>("gateway");
  const flushTimerRef = useRef<number | undefined>(undefined);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const dirtyRef = useRef(false);
  const revisionRef = useRef(0);

  useEffect(() => {
    connectionRef.current = connection;
  }, [connection]);

  const changeStage = useCallback((nextStage: Stage) => {
    stageRef.current = nextStage;
    setStage(nextStage);
  }, []);

  const persistSessionSnapshot = useCallback(async (nextVault: VaultData, dirty: boolean, revision: number) => {
    const keyMaterial = keyMaterialRef.current;
    const activeConnection = connectionRef.current;
    if (!keyMaterial || !activeConnection) {
      return;
    }
    const envelope = await encryptVaultWithKey(nextVault, keyMaterial);
    if (revision !== revisionRef.current || nextVault !== latestVaultRef.current) {
      return;
    }
    saveSessionSnapshot({
      schema: "arkane.session.v1",
      connection: {
        repo: activeConnection.repo,
        branch: activeConnection.branch,
        path: activeConnection.path
      },
      envelope,
      sha: shaRef.current,
      dirty
    });
  }, []);

  const openVault = useCallback(
    (
      nextConnection: GitHubConnection,
      nextVault: VaultData,
      nextKeyMaterial: VaultKeyMaterial,
      nextSha: string | undefined,
      dirty: boolean,
      nextSync: SyncState
    ) => {
      saveConnection(nextConnection);
      connectionRef.current = nextConnection;
      setConnection(nextConnection);
      keyMaterialRef.current = nextKeyMaterial;
      shaRef.current = nextSha;
      latestVaultRef.current = nextVault;
      dirtyRef.current = dirty;
      revisionRef.current += 1;
      setVault(nextVault);
      changeStage("ready");
      setSyncState(nextSync);
    },
    [changeStage]
  );

  const flushVault = useCallback(async () => {
    window.clearTimeout(flushTimerRef.current);
    flushTimerRef.current = undefined;
    if (!dirtyRef.current) {
      setSyncState({ status: "synced", message: "Vault already up to date", at: nowIso() });
      return;
    }
    setSyncState({ status: "syncing", message: "Encrypting and committing vault", at: nowIso() });

    const run = async () => {
      if (!dirtyRef.current) {
        return;
      }
      const nextVault = latestVaultRef.current;
      const keyMaterial = keyMaterialRef.current;
      const activeConnection = connectionRef.current;
      const revision = revisionRef.current;
      if (!nextVault || !keyMaterial || !activeConnection) {
        return;
      }
      const envelope = await encryptVaultWithKey(nextVault, keyMaterial);
      const saved = await saveVaultFile(activeConnection, envelope, shaRef.current);
      shaRef.current = saved.sha;

      if (revision === revisionRef.current && nextVault === latestVaultRef.current) {
        dirtyRef.current = false;
        try {
          await persistSessionSnapshot(nextVault, false, revision);
          setSyncState({ status: "synced", message: "Encrypted vault committed", at: nowIso() });
        } catch {
          clearSessionSnapshot();
          setSyncState({ status: "synced", message: "Committed; encrypted session cache unavailable", at: nowIso() });
        }
      }
    };

    const operation = queueRef.current.then(run);
    queueRef.current = operation.catch(() => undefined);
    try {
      await operation;
    } catch (error: unknown) {
      setSyncState(syncFailureState(error));
      throw error;
    }
  }, [persistSessionSnapshot]);

  const scheduleVaultSave = useCallback(
    (nextVault: VaultData, delay = 900) => {
      latestVaultRef.current = nextVault;
      dirtyRef.current = true;
      revisionRef.current += 1;
      const revision = revisionRef.current;
      setVault(nextVault);
      setSyncState({ status: "syncing", message: "Encrypted commit queued", at: nowIso() });
      void persistSessionSnapshot(nextVault, true, revision).catch(() => undefined);
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = window.setTimeout(() => {
        void flushVault().catch(() => undefined);
      }, delay);
    },
    [flushVault, persistSessionSnapshot]
  );

  const unlockWithMaster = useCallback(
    async (input: MasterUnlockInput) => {
      const nextConnection = normalizeConnection(input);
      setSyncState({ status: "loading", message: "Connecting to private GitHub repo", at: nowIso() });
      const snapshot = loadSessionSnapshot(nextConnection);
      let remote: Awaited<ReturnType<typeof fetchVaultFile>> | undefined;
      let remoteError = "";

      try {
        remote = await fetchVaultFile(nextConnection);
      } catch (error) {
        if (!snapshot) {
          throw error;
        }
        remoteError = error instanceof Error ? error.message : "GitHub is unavailable.";
      }

      let nextVault: VaultData;
      let nextKeyMaterial: VaultKeyMaterial;
      let nextSha: string | undefined;
      let dirty = false;

      if (snapshot?.dirty) {
        if (remote && remote.sha !== snapshot.sha) {
          throw new Error("Remote vault changed while encrypted local changes were waiting. Reconcile before syncing.");
        }
        if (remote === null && snapshot.sha) {
          throw new Error("Remote vault was removed while encrypted local changes were waiting.");
        }
        const decrypted = await decryptVaultWithPassword(snapshot.envelope, input.masterPassword);
        nextVault = decrypted.vault;
        nextKeyMaterial = decrypted.keyMaterial;
        nextSha = snapshot.sha;
        dirty = true;
      } else if (remote) {
        const decrypted = await decryptVaultWithPassword(remote.envelope, input.masterPassword);
        nextVault = decrypted.vault;
        nextKeyMaterial = decrypted.keyMaterial;
        nextSha = remote.sha;
      } else if (snapshot) {
        const decrypted = await decryptVaultWithPassword(snapshot.envelope, input.masterPassword);
        nextVault = decrypted.vault;
        nextKeyMaterial = decrypted.keyMaterial;
        nextSha = snapshot.sha;
      } else {
        nextKeyMaterial = await createVaultKey(input.masterPassword);
        nextVault = createInitialVault();
        const encrypted = await encryptVaultWithKey(nextVault, nextKeyMaterial);
        const saved = await saveVaultFile(nextConnection, encrypted);
        nextSha = saved.sha;
      }

      if (input.quickPin) {
        const pinWrap = await wrapVaultKeyWithPin(nextKeyMaterial.key, input.quickPin);
        savePinWrap(pinWrap);
        setHasQuickPin(true);
      } else {
        clearPinWrap();
        setHasQuickPin(false);
      }

      openVault(nextConnection, nextVault, nextKeyMaterial, nextSha, dirty, {
        status: remoteError
          ? typeof navigator !== "undefined" && !navigator.onLine
            ? "offline"
            : "error"
          : dirty
            ? "syncing"
            : "synced",
        message: remoteError
          ? `Unlocked from encrypted snapshot; sync unavailable: ${remoteError}`
          : dirty
            ? "Encrypted local changes restored and awaiting sync"
            : remote
              ? "Vault decrypted in memory"
              : "New empty vault created",
        at: nowIso()
      });

      if (dirty && !remoteError && (typeof navigator === "undefined" || navigator.onLine)) {
        void flushVault().catch(() => undefined);
      }
    },
    [flushVault, openVault]
  );

  const unlockWithPin = useCallback(
    async (pin: string) => {
      const activeConnection = connectionRef.current;
      const pinWrap = loadPinWrap();
      if (!activeConnection || !pinWrap) {
        throw new Error("Quick PIN is not available. Use the master password.");
      }

      setSyncState({ status: "loading", message: "Restoring encrypted session snapshot", at: nowIso() });
      let key: CryptoKey;
      try {
        key = await unwrapVaultKeyWithPin(pinWrap, pin);
        resetPinFailures();
      } catch (error) {
        const remaining = recordPinFailure();
        if (remaining === 0) {
          setHasQuickPin(false);
          changeStage("gateway");
          throw new Error("Quick PIN disabled after three failed attempts. Use the master password.");
        }
        throw new Error(`Quick PIN failed. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`);
      }

      const snapshot = loadSessionSnapshot(activeConnection);
      let nextVault: VaultData;
      let nextSha: string | undefined;
      let dirty = false;
      let envelope = snapshot?.envelope;

      if (snapshot) {
        nextVault = await decryptVaultWithKey(snapshot.envelope, key);
        nextSha = snapshot.sha;
        dirty = snapshot.dirty;
      } else {
        const remote = await fetchVaultFile(activeConnection);
        if (!remote) {
          throw new Error("vault.json was not found in the configured repo.");
        }
        nextVault = await decryptVaultWithKey(remote.envelope, key);
        nextSha = remote.sha;
        envelope = remote.envelope;
      }

      const nextKeyMaterial = {
        key,
        salt: envelope?.kdf.salt ?? ""
      };
      if (!nextKeyMaterial.salt) {
        throw new Error("Encrypted session metadata is missing.");
      }

      openVault(activeConnection, nextVault, nextKeyMaterial, nextSha, dirty, {
        status: dirty ? "syncing" : "synced",
        message: dirty ? "Encrypted local changes restored and awaiting sync" : "Quick PIN unlock complete",
        at: nowIso()
      });
      if (dirty && (typeof navigator === "undefined" || navigator.onLine)) {
        void flushVault().catch(() => undefined);
      }
    },
    [changeStage, flushVault, openVault]
  );

  const updateVault = useCallback(
    (updater: (current: VaultData) => VaultData) => {
      const current = latestVaultRef.current;
      if (!current) {
        return;
      }
      scheduleVaultSave(stampVault(updater(current)));
    },
    [scheduleVaultSave]
  );

  const addItem = useCallback(
    (input: NewVaultItemInput) => {
      updateVault((current) => {
        return { ...current, items: [createVaultItem(input), ...current.items] };
      });
    },
    [updateVault]
  );

  const deleteItem = useCallback(
    (id: string) => {
      updateVault((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
    },
    [updateVault]
  );

  const updateSentry = useCallback(
    (sentry: VaultSentry) => {
      updateVault((current) => ({ ...current, sentry }));
    },
    [updateVault]
  );

  const manualSync = useCallback(async () => {
    try {
      if (dirtyRef.current) {
        await flushVault();
        return;
      }
      const activeConnection = connectionRef.current;
      const keyMaterial = keyMaterialRef.current;
      if (!activeConnection || !keyMaterial) {
        return;
      }
      setSyncState({ status: "loading", message: "Checking encrypted vault revision", at: nowIso() });
      const remote = await fetchVaultFile(activeConnection);
      if (!remote) {
        throw new Error("vault.json was not found in the configured repo.");
      }
      if (remote.sha !== shaRef.current) {
        const nextVault = await decryptVaultWithKey(remote.envelope, keyMaterial.key);
        shaRef.current = remote.sha;
        latestVaultRef.current = nextVault;
        revisionRef.current += 1;
        setVault(nextVault);
        try {
          await persistSessionSnapshot(nextVault, false, revisionRef.current);
          setSyncState({ status: "synced", message: "Remote vault refreshed", at: nowIso() });
        } catch {
          clearSessionSnapshot();
          setSyncState({ status: "synced", message: "Remote refreshed; encrypted session cache unavailable", at: nowIso() });
        }
        return;
      }
      setSyncState({ status: "synced", message: "Vault already up to date", at: nowIso() });
    } catch (error) {
      setSyncState(syncFailureState(error));
      throw error;
    }
  }, [flushVault, persistSessionSnapshot]);

  const lock = useCallback(async () => {
    if (stageRef.current !== "ready") {
      return;
    }
    const current = latestVaultRef.current;
    const dirty = dirtyRef.current;
    const revision = revisionRef.current;
    changeStage("locking");
    window.clearTimeout(flushTimerRef.current);
    try {
      if (current) {
        await persistSessionSnapshot(current, dirty, revision);
      }
      keyMaterialRef.current = null;
      latestVaultRef.current = null;
      setVault(null);
      if (loadPinWrap()) {
        changeStage("soft-locked");
        setSyncState({
          status: dirty ? "offline" : "idle",
          message: dirty ? "Encrypted local changes held until unlock" : "Session locked",
          at: nowIso()
        });
      } else {
        changeStage("gateway");
        setSyncState({
          status: dirty ? "offline" : "idle",
          message: dirty ? "Unlock to sync encrypted local changes" : "Master unlock required",
          at: nowIso()
        });
      }
    } catch (error) {
      changeStage("ready");
      setSyncState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to lock session safely.",
        at: nowIso()
      });
    }
  }, [changeStage, persistSessionSnapshot]);

  const disconnect = useCallback(async () => {
    if (dirtyRef.current) {
      await flushVault();
    }
    clearConnection();
    clearPinWrap();
    clearSessionSnapshot();
    keyMaterialRef.current = null;
    connectionRef.current = null;
    shaRef.current = undefined;
    latestVaultRef.current = null;
    setConnection(null);
    setVault(null);
    setHasQuickPin(false);
    changeStage("gateway");
    setSyncState(INITIAL_SYNC);
    dirtyRef.current = false;
  }, [changeStage, flushVault]);

  const requireMasterUnlock = useCallback(() => {
    clearPinWrap();
    setHasQuickPin(false);
    keyMaterialRef.current = null;
    shaRef.current = undefined;
    latestVaultRef.current = null;
    setVault(null);
    changeStage("gateway");
    setSyncState({ status: "idle", message: "Master unlock required" });
    dirtyRef.current = false;
  }, [changeStage]);

  useVaultGuards({ stage, dirtyRef, flushVault, lock });

  useEffect(() => () => window.clearTimeout(flushTimerRef.current), []);

  return {
    stage,
    connection,
    storedConnection,
    vault,
    syncState,
    hasQuickPin,
    unlockWithMaster,
    unlockWithPin,
    addItem,
    deleteItem,
    updateSentry,
    manualSync,
    lock,
    requireMasterUnlock,
    disconnect
  };
}
