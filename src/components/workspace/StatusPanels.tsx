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
import { LanguageToggle } from "../LanguageToggle";
import { LogoMark } from "../LogoMark";
import { getExpiringItems } from "../../lib/expiry";
import { copy, type AppLanguage, localizeSyncMessage } from "../../lib/i18n";
import { cn, formatShortDate } from "../../lib/ui";
import type { GitHubConnection, SyncState, VaultData, VaultItem } from "../../types";

type WorkspaceCopy = (typeof copy)[AppLanguage]["workspace"];

export function Header({
  copy: t,
  language,
  languageLabels,
  connection,
  online,
  syncState,
  onToggleLanguage,
  onManualSync,
  onLock,
  onDisconnect
}: {
  copy: WorkspaceCopy;
  language: AppLanguage;
  languageLabels: (typeof copy)[AppLanguage]["language"];
  connection: GitHubConnection | null;
  online: boolean;
  syncState: SyncState;
  onToggleLanguage: () => void;
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
    <header className="vault-plate rounded-[1.5rem] bg-arkane-deck/72 p-3 shadow-inset ring-1 ring-arkane-line sm:flex sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <LogoMark className="h-11 w-11 rounded-2xl" />
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arkane-green">{t.headerEyebrow}</p>
          <h1 className="truncate font-serif text-3xl text-arkane-text sm:text-2xl">
            {connection?.repo ?? t.noRepository}
          </h1>
        </div>
      </div>
      <div className="relative mt-3 flex items-center justify-between gap-2 sm:mt-0 sm:justify-end">
        <StatusPill language={language} online={online} syncState={syncState} />
        <div className="flex items-center gap-2">
          <LanguageToggle compact language={language} labels={languageLabels} onToggle={onToggleLanguage} />
          <button
            type="button"
            onClick={syncNow}
            aria-label={t.syncNow}
            className="tap-target interactive-surface inline-flex items-center gap-2 rounded-xl bg-white/[0.045] px-3 text-arkane-muted shadow-inset ring-1 ring-arkane-line active:scale-[0.96] [@media(hover:hover)]:hover:bg-white/[0.075] [@media(hover:hover)]:hover:text-arkane-text"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            <span className="hidden text-sm min-[430px]:inline">{t.sync}</span>
          </button>
          <button
            type="button"
            onClick={() => void onLock()}
            aria-label={t.lockVault}
            className="tap-target interactive-surface grid place-items-center rounded-xl bg-white/[0.045] text-arkane-muted shadow-inset ring-1 ring-arkane-line active:scale-[0.96] [@media(hover:hover)]:hover:bg-white/[0.075] [@media(hover:hover)]:hover:text-arkane-text"
          >
            <LockKeyhole className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => void disconnect()}
            aria-label={t.disconnect}
            className="tap-target interactive-surface grid place-items-center rounded-xl bg-white/[0.045] text-arkane-muted shadow-inset ring-1 ring-arkane-line active:scale-[0.96] [@media(hover:hover)]:hover:bg-white/[0.075] [@media(hover:hover)]:hover:text-arkane-text"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function StatusPill({ language, online, syncState }: { language: AppLanguage; online: boolean; syncState: SyncState }) {
  const Icon = online ? Wifi : WifiOff;
  const tone =
    syncState.status === "error" || syncState.status === "conflict"
      ? "bg-arkane-red/15 text-red-100 ring-arkane-red/30"
      : syncState.status === "syncing" || syncState.status === "loading"
        ? "bg-arkane-amber/15 text-arkane-amber ring-arkane-amber/25"
        : online
          ? "bg-arkane-green/15 text-arkane-green ring-arkane-green/20"
          : "bg-white/[0.04] text-arkane-muted ring-arkane-line";

  return (
    <div className={cn("hidden min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 text-sm shadow-inset ring-1 sm:flex", tone)}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="max-w-[180px] truncate">{localizeSyncMessage(syncState.message, language)}</span>
    </div>
  );
}

export function StatusStrip({ copy: t, vault, expiringCount }: { copy: WorkspaceCopy; vault: VaultData; expiringCount: number }) {
  const categories = {
    credentials: vault.items.filter((item) => item.category === "credentials").length,
    assets: vault.items.filter((item) => item.category === "assets").length,
    footprints: vault.items.filter((item) => item.category === "footprints").length
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Metric label={t.metrics.credentials} value={categories.credentials} icon={IdCard} />
      <Metric label={t.metrics.assets} value={categories.assets} icon={CreditCard} />
      <Metric label={t.metrics.footprints} value={categories.footprints} icon={Footprints} />
      <Metric label={t.metrics.due} value={expiringCount} icon={ShieldAlert} alert={expiringCount > 0} />
    </div>
  );
}

function Metric({ label, value, icon: Icon, alert = false }: { label: string; value: number; icon: LucideIcon; alert?: boolean }) {
  return (
    <div className="interactive-surface rounded-[1.35rem] bg-white/[0.045] p-4 shadow-inset ring-1 ring-arkane-line">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm text-arkane-muted">{label}</span>
        <Icon className={cn("h-4 w-4 shrink-0", alert ? "text-arkane-amber" : "text-arkane-faint")} />
      </div>
      <strong className="tabular font-serif text-4xl text-arkane-text">{value}</strong>
    </div>
  );
}

export function ExpiryPanel({ copy: t, language, items }: { copy: WorkspaceCopy; language: AppLanguage; items: VaultItem[] }) {
  return (
    <aside className="vault-plate rounded-[1.5rem] bg-arkane-deck/95 p-4 shadow-inset ring-1 ring-arkane-line">
      <div className="mb-3 flex items-center gap-2">
        <BellRing className="h-5 w-5 text-arkane-amber" />
        <h2 className="font-serif text-xl text-arkane-text">{t.expiryTitle}</h2>
      </div>
      {items.length ? (
        <div className="space-y-2">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="interactive-surface rounded-2xl bg-white/[0.04] p-3 shadow-inset ring-1 ring-arkane-line">
              <p className="truncate text-sm text-arkane-text">{item.title}</p>
              <p className="text-xs text-arkane-amber">{formatShortDate(item.expiresAt, language === "zh" ? "zh-CN" : undefined)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-arkane-muted">{t.noExpiry}</p>
      )}
    </aside>
  );
}

export function ConnectionPanel({
  copy: t,
  language,
  connection,
  online,
  syncState
}: {
  copy: WorkspaceCopy;
  language: AppLanguage;
  connection: GitHubConnection | null;
  online: boolean;
  syncState: SyncState;
}) {
  return (
    <aside className="vault-plate rounded-[1.5rem] bg-arkane-deck/95 p-4 shadow-inset ring-1 ring-arkane-line">
      <div className="mb-3 flex items-center gap-2">
        <Github className="h-5 w-5 text-arkane-green" />
        <h2 className="font-serif text-xl text-arkane-text">{t.connectionTitle}</h2>
      </div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-arkane-faint">{t.repository}</dt>
          <dd className="break-all font-mono text-arkane-text">{connection?.repo ?? t.noRepository}</dd>
        </div>
        <div>
          <dt className="text-arkane-faint">{t.token}</dt>
          <dd className="text-arkane-text">{connection ? t.tokenStored : t.none}</dd>
        </div>
        <div>
          <dt className="text-arkane-faint">{t.network}</dt>
          <dd className="flex items-center gap-2 text-arkane-text">
            {online ? <Cloud className="h-4 w-4 text-arkane-green" /> : <CloudOff className="h-4 w-4 text-arkane-red" />}
            {online ? t.online : t.offline}
          </dd>
        </div>
        <div>
          <dt className="text-arkane-faint">{t.sync}</dt>
          <dd className="text-arkane-text">{localizeSyncMessage(syncState.message, language)}</dd>
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
    <div className="interactive-surface rounded-2xl bg-white/[0.04] p-3 shadow-inset ring-1 ring-arkane-line">
      <Icon className="mb-2 h-4 w-4 text-arkane-green" />
      <p className="text-xs uppercase tracking-[0.12em] text-arkane-faint">{label}</p>
      <p className="truncate text-sm text-arkane-text">{value}</p>
    </div>
  );
}

export { Check, CircleAlert, Save };
