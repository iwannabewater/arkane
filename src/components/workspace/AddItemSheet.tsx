import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import type { NewVaultItemInput } from "../../hooks/useVaultEngine";
import { copy, type AppLanguage } from "../../lib/i18n";
import { formatBytes } from "../../lib/ui";
import type { VaultAttachment, VaultItem } from "../../types";

type AddSheetCopy = (typeof copy)[AppLanguage]["workspace"]["addSheet"];

export function AddItemSheet({
  copy: t,
  category,
  categoryLabel,
  onClose,
  onAdd
}: {
  copy: AddSheetCopy;
  category: VaultItem["category"];
  categoryLabel: string;
  onClose: () => void;
  onAdd: (input: NewVaultItemInput) => void;
}) {
  const [draft, setDraft] = useState<NewVaultItemInput>({
    category,
    title: "",
    subtitle: "",
    label: t.defaultLabel,
    value: "",
    concealed: false,
    expiresAt: ""
  });
  const [attachment, setAttachment] = useState<Omit<VaultAttachment, "id"> | undefined>(undefined);
  const [fileError, setFileError] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])"
        );
        if (!focusable?.length) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function update<K extends keyof NewVaultItemInput>(key: K, value: NewVaultItemInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > 750_000) {
      setFileError(t.fileTooLarge);
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setFileError(t.fileType);
      return;
    }
    try {
      const previewDataUrl = await readFileAsDataUrl(file);
      setAttachment({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        previewDataUrl,
        encryptedPreview: t.encryptedPreview
      });
      setFileError("");
    } catch {
      setFileError(t.fileRead);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd({
      ...draft,
      label: draft.label.trim() || t.defaultLabel,
      attachment
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/[0.82] backdrop-blur-md sm:grid sm:place-items-center sm:p-4">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-title"
        className="app-scroll scroll-fade vault-plate flex h-[100dvh] max-h-[100dvh] w-full max-w-xl flex-col overflow-y-auto bg-arkane-deck px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+16px)] shadow-glow sm:h-auto sm:max-h-[min(90dvh,760px)] sm:rounded-[1.75rem] sm:p-5 sm:ring-1 sm:ring-arkane-line"
      >
        <div className="relative mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arkane-brass">
              {categoryLabel}
            </p>
            <h2 id="add-item-title" className="font-serif text-2xl text-arkane-text">{t.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="tap-target interactive-surface grid place-items-center rounded-xl text-arkane-muted active:scale-[0.96] [@media(hover:hover)]:hover:bg-white/[0.06] [@media(hover:hover)]:hover:text-arkane-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="relative space-y-3">
          <label className="space-y-2">
            <span className="text-sm text-arkane-muted">{t.itemTitle}</span>
            <input
              ref={titleRef}
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              required
              className="field-control"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-arkane-muted">{t.subtitle}</span>
            <input
              value={draft.subtitle}
              onChange={(event) => update("subtitle", event.target.value)}
              className="field-control"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-arkane-muted">{t.fieldLabel}</span>
              <input
                value={draft.label}
                onChange={(event) => update("label", event.target.value)}
                className="field-control"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-arkane-muted">{t.expiry}</span>
              <input
                type="date"
                value={draft.expiresAt}
                onChange={(event) => update("expiresAt", event.target.value)}
                className="field-control"
              />
            </label>
          </div>
          <label className="space-y-2">
            <span className="text-sm text-arkane-muted">{t.secretValue}</span>
            <textarea
              value={draft.value}
              onChange={(event) => update("value", event.target.value)}
              rows={4}
              required
              className="field-control resize-none font-mono text-sm"
            />
          </label>
          <label className="interactive-surface flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 shadow-inset ring-1 ring-arkane-line">
            <span className="text-sm text-arkane-muted">{t.conceal}</span>
            <input
              type="checkbox"
              checked={draft.concealed}
              onChange={(event) => update("concealed", event.target.checked)}
              className="h-5 w-5 accent-arkane-amber"
            />
          </label>
          <div className="rounded-2xl bg-white/[0.04] p-3 shadow-inset ring-1 ring-arkane-line">
            <label className="tap-target interactive-surface inline-flex cursor-pointer items-center gap-2 rounded-xl bg-black/25 px-4 text-sm text-arkane-text ring-1 ring-arkane-line active:scale-[0.96]">
              <Upload className="h-4 w-4 text-arkane-amber" />
              {t.attach}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={handleFile} />
            </label>
            {attachment ? (
              <p className="mt-2 text-sm text-arkane-muted">
                {attachment.name} · {formatBytes(attachment.size)}
              </p>
            ) : null}
            {fileError ? <p className="mt-2 text-sm text-red-100">{fileError}</p> : null}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="tap-target interactive-surface rounded-xl bg-white/[0.04] px-4 text-arkane-muted shadow-inset ring-1 ring-arkane-line active:scale-[0.96]"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="tap-target interactive-surface rounded-xl bg-arkane-green px-5 font-semibold text-black shadow-amber active:scale-[0.96]"
            >
              {t.submit}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
