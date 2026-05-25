import { useMemo, useState } from "react";
import type { NewVaultItemInput } from "../hooks/useVaultEngine";
import { getExpiringItems } from "../lib/expiry";
import type { GitHubConnection, SyncState, VaultCategory, VaultData, VaultItem, VaultSentry } from "../types";
import { AddItemSheet } from "./workspace/AddItemSheet";
import { BottomNav, SideRail } from "./workspace/Navigation";
import { SentryPanel } from "./workspace/SentryPanel";
import { ConnectionPanel, ExpiryPanel, Header, StatusStrip } from "./workspace/StatusPanels";
import { VaultSection } from "./workspace/VaultSection";

interface VaultWorkspaceProps {
  vault: VaultData;
  connection: GitHubConnection | null;
  syncState: SyncState;
  online: boolean;
  onAddItem: (input: NewVaultItemInput) => void;
  onDeleteItem: (id: string) => void;
  onUpdateSentry: (sentry: VaultSentry) => void;
  onManualSync: () => Promise<void>;
  onLock: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function VaultWorkspace({
  vault,
  connection,
  syncState,
  online,
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
      setToast(`${label} copied. Clear your clipboard after use.`);
    } catch {
      setToast("Clipboard access failed. Copy the value manually.");
    }
    window.setTimeout(() => setToast(""), 3600);
  }

  return (
    <main id="main-content" className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1" inert={addOpen ? true : undefined}>
        <SideRail activeCategory={activeCategory} onSelect={setActiveCategory} />
        <section className="app-scroll relative min-w-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-[calc(env(safe-area-inset-top)+14px)] sm:px-6 lg:pb-8 lg:pl-8 lg:pr-10">
          <Header
            connection={connection}
            online={online}
            syncState={syncState}
            onManualSync={onManualSync}
            onLock={onLock}
            onDisconnect={onDisconnect}
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <StatusStrip vault={vault} expiringCount={expiringItems.length} />
              {activeCategory === "sentry" ? (
                <SentryPanel
                  vault={vault}
                  connection={connection}
                  syncState={syncState}
                  onUpdate={onUpdateSentry}
                />
              ) : (
                <VaultSection
                  category={activeCategory}
                  items={activeItems}
                  onCopy={copyValue}
                  onDelete={onDeleteItem}
                  onAdd={() => setAddOpen(true)}
                />
              )}
            </div>

            <aside className="hidden space-y-4 lg:block">
              <ExpiryPanel items={expiringItems} />
              <ConnectionPanel connection={connection} online={online} syncState={syncState} />
            </aside>
          </div>
        </section>
      </div>

      <div inert={addOpen ? true : undefined}>
        <BottomNav activeCategory={activeCategory} onSelect={setActiveCategory} />
      </div>
      {addOpen ? (
        <AddItemSheet
          category={activeCategory === "sentry" ? "credentials" : (activeCategory as VaultItem["category"])}
          onClose={() => setAddOpen(false)}
          onAdd={(input) => {
            onAddItem(input);
            setAddOpen(false);
            setToast("Encrypted commit queued");
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
