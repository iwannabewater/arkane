import { useMemo, useState } from "react";
import type { NewVaultItemInput } from "../hooks/useVaultEngine";
import { getExpiringItems } from "../lib/expiry";
import { copy, type AppLanguage } from "../lib/i18n";
import type { GitHubConnection, SyncState, VaultCategory, VaultData, VaultItem, VaultSentry } from "../types";
import { AddItemSheet } from "./workspace/AddItemSheet";
import { BottomNav, SideRail } from "./workspace/Navigation";
import { SentryPanel } from "./workspace/SentryPanel";
import { ConnectionPanel, ExpiryPanel, Header, StatusStrip } from "./workspace/StatusPanels";
import { VaultSection } from "./workspace/VaultSection";

interface VaultWorkspaceProps {
  copy: (typeof copy)[AppLanguage]["workspace"];
  language: AppLanguage;
  languageLabels: (typeof copy)[AppLanguage]["language"];
  vault: VaultData;
  connection: GitHubConnection | null;
  syncState: SyncState;
  online: boolean;
  onToggleLanguage: () => void;
  onAddItem: (input: NewVaultItemInput) => void;
  onDeleteItem: (id: string) => void;
  onUpdateSentry: (sentry: VaultSentry) => void;
  onManualSync: () => Promise<void>;
  onLock: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function VaultWorkspace({
  copy: t,
  language,
  languageLabels,
  vault,
  connection,
  syncState,
  online,
  onToggleLanguage,
  onAddItem,
  onDeleteItem,
  onUpdateSentry,
  onManualSync,
  onLock,
  onDisconnect
}: VaultWorkspaceProps) {
  const [activeCategory, setActiveCategory] = useState<VaultCategory>("credentials");
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState("");
  const expiringItems = useMemo(() => getExpiringItems(vault.items), [vault.items]);
  const activeItems = useMemo(
    () => vault.items.filter((item) => item.category === activeCategory),
    [activeCategory, vault.items]
  );

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} ${t.copiedSuffix}`);
    } catch {
      setToast(t.clipboardFailed);
    }
    window.setTimeout(() => setToast(""), 3600);
  }

  return (
    <main id="main-content" className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1" inert={addOpen ? true : undefined}>
        <SideRail labels={t.categories} activeCategory={activeCategory} onSelect={setActiveCategory} />
        <section className="app-scroll scroll-fade surface-grid relative min-w-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+14px)] sm:px-6 lg:pb-8 lg:pl-8 lg:pr-10">
          <Header
            copy={t}
            language={language}
            languageLabels={languageLabels}
            connection={connection}
            online={online}
            syncState={syncState}
            onToggleLanguage={onToggleLanguage}
            onManualSync={onManualSync}
            onLock={onLock}
            onDisconnect={onDisconnect}
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <StatusStrip copy={t} vault={vault} expiringCount={expiringItems.length} />
              {activeCategory === "sentry" ? (
                <SentryPanel
                  copy={t}
                  language={language}
                  vault={vault}
                  connection={connection}
                  syncState={syncState}
                  onUpdate={onUpdateSentry}
                />
              ) : (
                <VaultSection
                  copy={t}
                  language={language}
                  category={activeCategory}
                  items={activeItems}
                  onCopy={copyValue}
                  onDelete={onDeleteItem}
                  onAdd={() => setAddOpen(true)}
                />
              )}
            </div>

            <aside className="hidden space-y-4 lg:block">
              <ExpiryPanel copy={t} language={language} items={expiringItems} />
              <ConnectionPanel copy={t} language={language} connection={connection} online={online} syncState={syncState} />
            </aside>
          </div>
        </section>
      </div>

      <div inert={addOpen ? true : undefined}>
        <BottomNav labels={t.categories} activeCategory={activeCategory} onSelect={setActiveCategory} />
      </div>
      {addOpen ? (
        <AddItemSheet
          copy={t.addSheet}
          category={activeCategory === "sentry" ? "credentials" : (activeCategory as VaultItem["category"])}
          categoryLabel={t.categories[activeCategory === "sentry" ? "credentials" : activeCategory].eyebrow}
          onClose={() => setAddOpen(false)}
          onAdd={(input) => {
            onAddItem(input);
            setAddOpen(false);
            setToast(t.encryptedCommitQueued);
          }}
        />
      ) : null}
      {toast ? (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] left-1/2 z-50 -translate-x-1/2 rounded-full bg-arkane-text px-4 py-2 text-sm font-semibold text-black shadow-amber">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
