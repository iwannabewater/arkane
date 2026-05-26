import {
  Check,
  CircleAlert,
  GitBranch as Github,
  NotebookPen,
  Save,
  ShieldCheck
} from "lucide-react";
import { copy, type AppLanguage, localizeSyncMessage } from "../../lib/i18n";
import type { GitHubConnection, SyncState, VaultData, VaultSentry } from "../../types";
import { MiniStatus } from "./StatusPanels";

type WorkspaceCopy = (typeof copy)[AppLanguage]["workspace"];

export function SentryPanel({
  copy: t,
  language,
  vault,
  connection,
  syncState,
  onUpdate
}: {
  copy: WorkspaceCopy;
  language: AppLanguage;
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
    <section className="vault-plate rounded-[1.5rem] bg-arkane-deck/95 p-4 shadow-glow ring-1 ring-arkane-line">
      <div className="relative mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-arkane-amber/12 text-arkane-amber ring-1 ring-arkane-amber/20">
          <NotebookPen className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arkane-brass">{t.sentry.eyebrow}</p>
          <h2 className="font-serif text-2xl text-arkane-text">{t.sentry.title}</h2>
        </div>
      </div>

      <div className="relative grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-arkane-muted">{t.sentry.emergencyNote}</span>
          <textarea
            value={sentry.deadMansNote}
            onChange={(event) => patch({ deadMansNote: event.target.value })}
            rows={9}
            className="field-control min-h-[15rem] resize-none"
          />
        </label>
        <div className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm text-arkane-muted">{t.sentry.recoveryHint}</span>
            <textarea
              value={sentry.recoveryHint}
              onChange={(event) => patch({ recoveryHint: event.target.value })}
              rows={4}
              className="field-control min-h-[8rem] resize-none"
            />
          </label>
          <div className="rounded-2xl bg-arkane-green/10 p-4 shadow-inset ring-1 ring-arkane-green/20">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-arkane-green" />
              <div className="space-y-1">
                <p className="font-serif text-lg text-arkane-text">{t.sentry.reminderTitle}</p>
                <p className="text-pretty text-sm leading-relaxed text-arkane-muted">
                  {t.sentry.reminderBody}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStatus icon={Github} label={t.repo} value={connection?.repo ?? t.noRepository} />
        <MiniStatus icon={Save} label={t.vaultFile} value={connection?.path ?? "vault.json"} />
        <MiniStatus icon={syncState.status === "error" ? CircleAlert : Check} label={t.status} value={localizeSyncMessage(syncState.message, language)} />
      </div>
    </section>
  );
}
