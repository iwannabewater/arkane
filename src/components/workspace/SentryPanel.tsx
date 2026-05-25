import {
  Check,
  CircleAlert,
  GitBranch as Github,
  NotebookPen,
  Save,
  ShieldCheck
} from "lucide-react";
import type { GitHubConnection, SyncState, VaultData, VaultSentry } from "../../types";
import { MiniStatus } from "./StatusPanels";

export function SentryPanel({
  vault,
  connection,
  syncState,
  onUpdate
}: {
  vault: VaultData;
  connection: GitHubConnection | null;
  syncState: SyncState;
  onUpdate: (sentry: VaultSentry) => void;
}) {
  const sentry = vault.sentry;

  function patch(next: Partial<VaultSentry>) {
    onUpdate({
      ...sentry,
      ...next
    });
  }

  return (
    <section className="rounded-2xl bg-arkane-deck/95 p-4 shadow-glow ring-1 ring-arkane-line">
      <div className="mb-4 flex items-center gap-3">
        <NotebookPen className="h-6 w-6 text-arkane-amber" />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arkane-brass">Vault Sentry</p>
          <h2 className="font-serif text-2xl text-arkane-text">Recovery notes</h2>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
            <span className="text-sm text-arkane-muted">Emergency note</span>
          <textarea
            value={sentry.deadMansNote}
            onChange={(event) => patch({ deadMansNote: event.target.value })}
            rows={9}
            className="w-full resize-none rounded-xl bg-black/25 p-4 text-arkane-text outline-none ring-1 ring-arkane-line transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-arkane-amber"
          />
        </label>
        <div className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm text-arkane-muted">Recovery hint</span>
            <textarea
              value={sentry.recoveryHint}
              onChange={(event) => patch({ recoveryHint: event.target.value })}
              rows={4}
              className="w-full resize-none rounded-xl bg-black/25 p-4 text-arkane-text outline-none ring-1 ring-arkane-line transition-[box-shadow,background-color] focus-visible:ring-2 focus-visible:ring-arkane-amber"
            />
          </label>
          <div className="rounded-xl bg-arkane-green/10 p-4 ring-1 ring-arkane-green/20">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-arkane-green" />
              <div className="space-y-1">
                <p className="font-serif text-lg text-arkane-text">Local-only reminders</p>
                <p className="text-pretty text-sm leading-relaxed text-arkane-muted">
                  Arkane calculates expiry status in your browser. Recovery notes and item metadata are never sent to a notification service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStatus icon={Github} label="Repo" value={connection?.repo ?? "Not connected"} />
        <MiniStatus icon={Save} label="Vault file" value={connection?.path ?? "vault.json"} />
        <MiniStatus icon={syncState.status === "error" ? CircleAlert : Check} label="Status" value={syncState.message} />
      </div>
    </section>
  );
}
