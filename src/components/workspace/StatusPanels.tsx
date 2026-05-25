import {
  BellRing,
  Check,
  CircleAlert,
  Cloud,
  CloudOff,
  CreditCard,
  Footprints,
  GitBranch as Github,
  IdCard,
  LockKeyhole,
  LogOut,
  RefreshCw,
  Save,
  ShieldAlert,
  Wifi,
  WifiOff,
  type LucideIcon
} from "lucide-react";
import { useState } from "react";
import { getExpiringItems } from "../../lib/expiry";
import { cn, formatShortDate } from "../../lib/ui";
import type { GitHubConnection, SyncState, VaultData, VaultItem } from "../../types";
import { LogoMark } from "../LogoMark";

export function Header({
  connection,
  online,
  syncState,
  onManualSync,
  onLock,
  onDisconnect
}: {
  connection: GitHubConnection | null;
  online: boolean;
  syncState: SyncState;
  onManualSync: () => Promise<void>;
  onLock: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}) {
  const [syncing, setSyncing] = useState(false);

  async function syncNow() {
    setSyncing(true);
    try {
      await onManualSync();
    } finally {
      setSyncing(false);
    }
  }

  async function disconnect() {
    try {
      await onDisconnect();
    } catch {
      // The engine already exposes the sync error and keeps the vault connected.
    }
  }

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <LogoMark className="h-11 w-11 rounded-2xl" />
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arkane-green">Arkane Vault</p>
          <h1 className="truncate font-serif text-2xl font-semibold tracking-[-0.012em] text-arkane-text">
            {connection?.repo ?? "No repository"}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill online={online} syncState={syncState} />
        <button
          type="button"
          onClick={syncNow}
          aria-label="Sync now"
          className="tap-target hidden rounded-lg bg-white/[0.04] px-3 text-arkane-muted ring-1 ring-arkane-line transition-[transform,background-color,color] duration-150 ease-arkane active:scale-95 [@media(hover:hover)]:hover:bg-white/[0.07] [@media(hover:hover)]:hover:text-arkane-text sm:inline-flex sm:items-center sm:gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          <span className="text-sm">Sync</span>
        </button>
        <button
          type="button"
          onClick={() => void onLock()}
          aria-label="Lock vault"
          className="tap-target grid place-items-center rounded-lg bg-white/[0.04] text-arkane-muted ring-1 ring-arkane-line transition-[transform,background-color,color] duration-150 ease-arkane active:scale-95 [@media(hover:hover)]:hover:bg-white/[0.07] [@media(hover:hover)]:hover:text-arkane-text"
        >
          <LockKeyhole className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => void disconnect()}
          aria-label="Disconnect GitHub credentials"
          className="tap-target grid place-items-center rounded-lg bg-white/[0.04] text-arkane-muted ring-1 ring-arkane-line transition-[transform,background-color,color] duration-150 ease-arkane active:scale-95 [@media(hover:hover)]:hover:bg-white/[0.07] [@media(hover:hover)]:hover:text-arkane-text"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function StatusPill({ online, syncState }: { online: boolean; syncState: SyncState }) {
  const Icon = online ? Wifi : WifiOff;
  const tone =
    syncState.status === "error" || syncState.status === "conflict"
      ? "bg-arkane-red/15 text-red-100 ring-arkane-red/30"
      : syncState.status === "syncing" || syncState.status === "loading"
        ? "bg-arkane-amber/15 text-arkane-amber ring-arkane-amber/25"
        : online
          ? "bg-arkane-green/15 text-arkane-green ring-arkane-green/20"
          : "bg-white/[0.035] text-arkane-muted ring-arkane-line";

  return (
    <div className={cn("hidden min-h-11 items-center gap-2 rounded-lg px-3 text-sm ring-1 sm:flex", tone)}>
      <Icon className="h-4 w-4" />
      <span className="max-w-[180px] truncate">{syncState.message}</span>
    </div>
  );
}

export function StatusStrip({ vault, expiringCount }: { vault: VaultData; expiringCount: number }) {
  const categories = {
    credentials: vault.items.filter((item) => item.category === "credentials").length,
    assets: vault.items.filter((item) => item.category === "assets").length,
    footprints: vault.items.filter((item) => item.category === "footprints").length
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Metric label="Credentials" value={categories.credentials} icon={IdCard} />
      <Metric label="Assets" value={categories.assets} icon={CreditCard} />
      <Metric label="Footprints" value={categories.footprints} icon={Footprints} />
      <Metric label="Due in 30d" value={expiringCount} icon={ShieldAlert} alert={expiringCount > 0} />
    </div>
  );
}

function Metric({ label, value, icon: Icon, alert = false }: { label: string; value: number; icon: LucideIcon; alert?: boolean }) {
  return (
    <div className="rounded-xl bg-white/[0.035] p-3 ring-1 ring-arkane-line">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-arkane-muted">{label}</span>
        <Icon className={cn("h-4 w-4", alert ? "text-arkane-amber" : "text-arkane-faint")} />
      </div>
      <strong className="tabular font-serif text-3xl font-semibold tracking-[-0.022em] text-arkane-text">
        {value}
      </strong>
    </div>
  );
}

export function ExpiryPanel({ items }: { items: VaultItem[] }) {
  return (
    <aside className="rounded-2xl bg-arkane-deck/95 p-4 ring-1 ring-arkane-line">
      <div className="mb-3 flex items-center gap-2">
        <BellRing className="h-5 w-5 text-arkane-amber" />
        <h2 className="font-serif text-xl text-arkane-text">Expiry sentry</h2>
      </div>
      {items.length ? (
        <div className="space-y-2">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-lg bg-white/[0.035] p-3 ring-1 ring-arkane-line">
              <p className="truncate text-sm text-arkane-text">{item.title}</p>
              <p className="text-xs text-arkane-amber">{formatShortDate(item.expiresAt)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-arkane-muted">No items expiring within 30 days.</p>
      )}
    </aside>
  );
}

export function ConnectionPanel({
  connection,
  online,
  syncState
}: {
  connection: GitHubConnection | null;
  online: boolean;
  syncState: SyncState;
}) {
  return (
    <aside className="rounded-2xl bg-arkane-deck/95 p-4 ring-1 ring-arkane-line">
      <div className="mb-3 flex items-center gap-2">
        <Github className="h-5 w-5 text-arkane-green" />
        <h2 className="font-serif text-xl text-arkane-text">GitHub uplink</h2>
      </div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-arkane-faint">Repository</dt>
          <dd className="break-all font-mono text-arkane-text">{connection?.repo ?? "Not connected"}</dd>
        </div>
        <div>
          <dt className="text-arkane-faint">Token</dt>
          <dd className="text-arkane-text">{connection ? "Stored in this browser" : "None"}</dd>
        </div>
        <div>
          <dt className="text-arkane-faint">Network</dt>
          <dd className="flex items-center gap-2 text-arkane-text">
            {online ? <Cloud className="h-4 w-4 text-arkane-green" /> : <CloudOff className="h-4 w-4 text-arkane-red" />}
            {online ? "Online" : "Offline"}
          </dd>
        </div>
        <div>
          <dt className="text-arkane-faint">Sync</dt>
          <dd className="text-arkane-text">{syncState.message}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function SentryCount(vault: VaultData) {
  return getExpiringItems(vault.items).length;
}

export function MiniStatus({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.035] p-3 ring-1 ring-arkane-line">
      <Icon className="mb-2 h-4 w-4 text-arkane-green" />
      <p className="text-xs uppercase tracking-[0.12em] text-arkane-faint">{label}</p>
      <p className="truncate text-sm text-arkane-text">{value}</p>
    </div>
  );
}

export { Check, CircleAlert, Save };
