import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { Gateway } from "./components/Gateway";
import { LockOverlay } from "./components/LockOverlay";
import { LogoMark } from "./components/LogoMark";
import { VaultWorkspace } from "./components/VaultWorkspace";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { useVaultEngine } from "./hooks/useVaultEngine";

export default function App() {
  const online = useNetworkStatus();
  const engine = useVaultEngine();
  const [pwaMessage, setPwaMessage] = useState("");

  useEffect(() => {
    const offlineReady = () => setPwaMessage("Offline shell cached");
    const updateReady = () => setPwaMessage("Update available after refresh");
    window.addEventListener("arkane:offline-ready", offlineReady);
    window.addEventListener("arkane:update-available", updateReady);
    return () => {
      window.removeEventListener("arkane:offline-ready", offlineReady);
      window.removeEventListener("arkane:update-available", updateReady);
    };
  }, []);

  if (engine.stage === "locking") {
    return (
      <main id="main-content" className="grid h-full place-items-center px-4">
        <div className="flex items-center gap-3 text-arkane-muted">
          <LogoMark className="h-11 w-11 rounded-2xl" />
          <div>
            <p className="font-serif text-xl text-arkane-text">Securing session</p>
            <p className="text-sm">Saving an encrypted local snapshot</p>
          </div>
        </div>
      </main>
    );
  }

  if (engine.stage === "soft-locked") {
    return <LockOverlay onPinUnlock={engine.unlockWithPin} onFullUnlock={engine.requireMasterUnlock} />;
  }

  if (!engine.vault || engine.stage === "gateway") {
    return (
      <Gateway
        storedConnection={engine.connection ?? engine.storedConnection}
        hasQuickPin={engine.hasQuickPin}
        syncMessage={pwaMessage || engine.syncState.message}
        onMasterUnlock={engine.unlockWithMaster}
        onPinUnlock={engine.unlockWithPin}
      />
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <VaultWorkspace
        vault={engine.vault}
        connection={engine.connection}
        syncState={engine.syncState}
        online={online}
        onAddItem={engine.addItem}
        onDeleteItem={engine.deleteItem}
        onUpdateSentry={engine.updateSentry}
        onManualSync={engine.manualSync}
        onLock={engine.lock}
        onDisconnect={engine.disconnect}
      />
      {!online ? (
        <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+12px)] z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-arkane-amber px-4 py-2 text-sm font-semibold text-black shadow-amber">
          <CircleAlert className="h-4 w-4" />
          Offline, writes will retry after reconnect
        </div>
      ) : null}
    </div>
  );
}
