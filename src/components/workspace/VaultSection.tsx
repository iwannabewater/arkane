import { Copy, Eye, EyeOff, FileImage, KeyRound, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { getExpiryState } from "../../lib/expiry";
import { copy, type AppLanguage } from "../../lib/i18n";
import { cn, formatBytes, formatShortDate } from "../../lib/ui";
import type { VaultAttachment, VaultCategory, VaultItem } from "../../types";

type WorkspaceCopy = (typeof copy)[AppLanguage]["workspace"];

export function VaultSection({
  copy: t,
  language,
  category,
  items,
  onCopy,
  onDelete,
  onAdd
}: {
  copy: WorkspaceCopy;
  language: AppLanguage;
  category: VaultCategory;
  items: VaultItem[];
  onCopy: (value: string, label: string) => Promise<void>;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const meta = t.categories[category];

  return (
    <section className="vault-plate rounded-[1.5rem] bg-arkane-deck/95 p-3 shadow-glow ring-1 ring-arkane-line sm:p-4">
      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arkane-brass">{meta.eyebrow}</p>
          <h2 className="font-serif text-2xl text-arkane-text">{meta.title}</h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="tap-target inline-flex items-center gap-2 rounded-xl bg-arkane-amber px-4 font-semibold text-black shadow-amber transition-transform duration-150 ease-arkane active:scale-[0.96]"
        >
          <Plus className="h-4 w-4" />
          {t.add}
        </button>
      </div>

      {items.length ? (
        <div className="relative grid gap-3 xl:grid-cols-2">
          {items.map((item) => (
            <VaultItemCard key={item.id} copy={t} language={language} item={item} onCopy={onCopy} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="surface-grid relative rounded-[1.25rem] bg-black/20 p-8 text-center shadow-inset ring-1 ring-arkane-line">
          <KeyRound className="mx-auto mb-3 h-8 w-8 text-arkane-faint" />
          <p className="font-serif text-xl text-arkane-text">{t.emptyTitle}</p>
          <p className="mt-1 text-sm text-arkane-muted">{t.emptyBody}</p>
        </div>
      )}
    </section>
  );
}

function VaultItemCard({
  copy: t,
  language,
  item,
  onCopy,
  onDelete
}: {
  copy: WorkspaceCopy;
  language: AppLanguage;
  item: VaultItem;
  onCopy: (value: string, label: string) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const expiry = getExpiryTone(item, t, language);

  function confirmDelete() {
    if (window.confirm(`${t.deleteConfirmPrefix} "${item.title}"? ${t.deleteConfirmSuffix}`)) {
      onDelete(item.id);
    }
  }

  return (
    <article className="rounded-[1.25rem] bg-white/[0.04] p-4 shadow-inset ring-1 ring-arkane-line">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-xl text-arkane-text">{item.title}</h3>
          <p className="text-pretty text-sm text-arkane-muted">{item.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={confirmDelete}
          aria-label={`${t.deleteAria} ${item.title}`}
          className="tap-target grid shrink-0 place-items-center rounded-xl text-arkane-faint transition-[transform,background-color,color] duration-150 ease-arkane active:scale-[0.96] [@media(hover:hover)]:hover:bg-arkane-red/10 [@media(hover:hover)]:hover:text-red-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        {item.fields.map((field) => {
          const visible = !field.concealed || revealed[field.id];
          return (
            <div key={field.id} className="rounded-2xl bg-black/20 p-3 shadow-inset ring-1 ring-arkane-line">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-[0.12em] text-arkane-faint">{field.label}</span>
                <div className="flex gap-1">
                  {field.concealed ? (
                    <button
                      type="button"
                      onClick={() => setRevealed((current) => ({ ...current, [field.id]: !visible }))}
                      aria-label={`${visible ? t.hideAria : t.revealAria} ${field.label}`}
                      className="tap-target grid h-9 min-h-9 w-9 min-w-9 place-items-center rounded-lg text-arkane-muted transition-[transform,background-color,color] duration-150 ease-arkane active:scale-[0.96] [@media(hover:hover)]:hover:bg-white/[0.06] [@media(hover:hover)]:hover:text-arkane-text"
                    >
                      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  ) : null}
                  {field.copyable ? (
                    <button
                      type="button"
                      onClick={() => onCopy(field.value, field.label)}
                      aria-label={`${t.copyAria} ${field.label}`}
                      className="tap-target grid h-9 min-h-9 w-9 min-w-9 place-items-center rounded-lg text-arkane-muted transition-[transform,background-color,color] duration-150 ease-arkane active:scale-[0.96] [@media(hover:hover)]:hover:bg-white/[0.06] [@media(hover:hover)]:hover:text-arkane-text"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="break-all font-mono text-sm text-arkane-text">
                {visible ? field.value : t.concealedValue}
              </p>
            </div>
          );
        })}
      </div>

      {item.attachment ? <AttachmentPreview copy={t} attachment={item.attachment} /> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold ring-1", expiry.className)}>
          {expiry.label}
        </span>
        {item.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/[0.035] px-2.5 py-1 text-xs text-arkane-muted ring-1 ring-arkane-line">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

function getExpiryTone(item: VaultItem, t: WorkspaceCopy, language: AppLanguage) {
  const expiry = getExpiryState(item.expiresAt);
  const label =
    expiry.tone === "none"
      ? t.expiryState.noExpiry
      : expiry.label === "Invalid date"
        ? t.expiryState.invalidDate
        : expiry.label === "Due today"
          ? t.expiryState.dueToday
          : expiry.daysLeft !== undefined && expiry.daysLeft < 0
            ? `${Math.abs(expiry.daysLeft)}${t.expiryState.overdueSuffix}`
            : expiry.daysLeft !== undefined
              ? `${expiry.daysLeft}${t.expiryState.leftSuffix}`
              : expiry.label;
  if (expiry.tone === "critical") {
    return { label, className: "bg-arkane-red/20 text-red-100 ring-arkane-red/35" };
  }
  if (expiry.tone === "warning") {
    return { label, className: "bg-arkane-amber/15 text-arkane-amber ring-arkane-amber/30" };
  }
  return {
    label: expiry.tone === "normal" ? formatShortDate(item.expiresAt, language === "zh" ? "zh-CN" : undefined) : label,
    className: "bg-white/[0.035] text-arkane-muted ring-arkane-line"
  };
}

function AttachmentPreview({ copy: t, attachment }: { copy: WorkspaceCopy; attachment: VaultAttachment }) {
  const isImage = attachment.previewDataUrl && attachment.mimeType.startsWith("image/");
  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-black/20 shadow-inset ring-1 ring-arkane-line">
      {isImage ? (
        <img
          src={attachment.previewDataUrl}
          alt={`${attachment.name} encrypted preview`}
          className="aspect-[16/9] w-full object-cover opacity-90 outline outline-1 -outline-offset-1 outline-white/10"
          loading="lazy"
        />
      ) : null}
      <div className="flex items-center gap-3 p-3">
        <FileImage className="h-5 w-5 shrink-0 text-arkane-amber" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-arkane-text">{attachment.name}</p>
          <p className="text-xs text-arkane-faint">{formatBytes(attachment.size)} · {t.vaultEncryptedBlob}</p>
        </div>
      </div>
    </div>
  );
}
