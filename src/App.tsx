import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { Gateway } from "./components/Gateway";
import { LockOverlay } from "./components/LockOverlay";
import { LogoMark } from "./components/LogoMark";
import { VaultWorkspace } from "./components/VaultWorkspace";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { useVaultEngine } from "./hooks/useVaultEngine";
import { copy, initialLanguage, localizeSyncMessage, nextLanguage, persistLanguage } from "./lib/i18n";

export default function App() {
  const online = useNetworkStatus();
  const engine = useVaultEngine();
  const [language, setLanguage] = useState(initialLanguage);
  const [pwaMessage, setPwaMessage] = useState("");
  const t = copy[language];

  const toggleLanguage = () =>
    setLanguage((current) => {
      const next = nextLanguage(current);
      persistLanguage(next);
      return next;
    });

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

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  if (engine.stage === "locking") {
    return (
      <main id="main-content" className="grid h-full place-items-center px-4">
        <div className="vault-plate rounded-[1.75rem] bg-arkane-deck/90 p-5 text-arkane-muted shadow-glow ring-1 ring-arkane-line">
          <div className="relative flex items-center gap-3">
            <LogoMark className="h-11 w-11 rounded-2xl" />
            <div>
              <p className="font-serif text-xl text-arkane-text">{t.app.securingSession}</p>
              <p className="text-sm">{t.app.savingSnapshot}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (engine.stage === "soft-locked") {
    return (
      <LockOverlay
        copy={t.lock}
        language={language}
        languageLabels={t.language}
        onToggleLanguage={toggleLanguage}
        onPinUnlock={engine.unlockWithPin}
        onFullUnlock={engine.requireMasterUnlock}
      />
    );
  }

  if (!engine.vault || engine.stage === "gateway") {
    return (
      <Gateway
        copy={t.gateway}
        language={language}
        languageLabels={t.language}
        storedConnection={engine.connection ?? engine.storedConnection}
        hasQuickPin={engine.hasQuickPin}
        syncMessage={localizeSyncMessage(pwaMessage || engine.syncState.message, language)}
        onToggleLanguage={toggleLanguage}
        onMasterUnlock={engine.unlockWithMaster}
        onPinUnlock={engine.unlockWithPin}
      />
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <VaultWorkspace
        copy={t.workspace}
        language={language}
        languageLabels={t.language}
        vault={engine.vault}
        connection={engine.connection}
        syncState={engine.syncState}
        online={online}
        onToggleLanguage={toggleLanguage}
        onAddItem={engine.addItem}
        onDeleteItem={engine.deleteItem}
        onUpdateSentry={engine.updateSentry}
        onManualSync={engine.manualSync}
        onLock={engine.lock}
        onDisconnect={engine.disconnect}
      />
      {!online ? (
        <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+12px)] z-[60] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 rounded-full bg-arkane-amber px-4 py-2 text-sm font-semibold text-black shadow-amber">
          <CircleAlert className="h-4 w-4" />
          <span className="truncate">{t.app.offlineWarning}</span>
        </div>
      ) : null}
    </div>
  );
}
