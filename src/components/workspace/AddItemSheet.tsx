import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import type { NewVaultItemInput } from "../../hooks/useVaultEngine";
import { formatBytes } from "../../lib/ui";
import type { VaultAttachment, VaultItem } from "../../types";
import { categoryMeta } from "./categories";

export function AddItemSheet({
  category,
  onClose,
  onAdd
}: {
  category: VaultItem["category"];
  onClose: () => void;
  onAdd: (input: NewVaultItemInput) => void;
}) {
  const [draft, setDraft] = useState<NewVaultItemInput>({
    category,
    title: "",
    subtitle: "",
    label: "Document number",
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
      setFileError("Attachment limit is 750 KB for this template.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setFileError("Use a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    try {
      const previewDataUrl = await readFileAsDataUrl(file);
      setAttachment({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        previewDataUrl,
        encryptedPreview: "Stored inside the encrypted vault payload"
      });
      setFileError("");
    } catch {
      setFileError("The selected attachment could not be read.");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd({
      ...draft,
      attachment
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 sm:grid sm:place-items-center sm:p-4">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-title"
        className="app-scroll flex h-[100dvh] max-h-[100dvh] w-full max-w-xl flex-col overflow-y-auto bg-arkane-deck px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-[calc(env(safe-area-inset-top)+16px)] shadow-glow sm:h-auto sm:max-h-[min(90dvh,760px)] sm:rounded-2xl sm:p-5 sm:ring-1 sm:ring-arkane-line"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-arkane-brass">
              {categoryMeta(category).en}
            </p>
            <h2 id="add-item-title" className="font-serif text-2xl text-arkane-text">New encrypted item</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap-target grid place-items-center rounded-lg text-arkane-muted transition-[transform,background-color,color] duration-150 ease-arkane active:scale-95 [@media(hover:hover)]:hover:bg-white/[0.06] [@media(hover:hover)]:hover:text-arkane-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="space-y-2">
            <span className="text-sm text-arkane-muted">Title</span>
            <input
              ref={titleRef}
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              required
              className="min-h-11 w-full rounded-lg bg-black/25 px-4 text-arkane-text outline-none ring-1 ring-arkane-line focus-visible:ring-2 focus-visible:ring-arkane-amber"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-arkane-muted">Subtitle</span>
            <input
              value={draft.subtitle}
              onChange={(event) => update("subtitle", event.target.value)}
              className="min-h-11 w-full rounded-lg bg-black/25 px-4 text-arkane-text outline-none ring-1 ring-arkane-line focus-visible:ring-2 focus-visible:ring-arkane-amber"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-arkane-muted">Field label</span>
              <input
                value={draft.label}
                onChange={(event) => update("label", event.target.value)}
                className="min-h-11 w-full rounded-lg bg-black/25 px-4 text-arkane-text outline-none ring-1 ring-arkane-line focus-visible:ring-2 focus-visible:ring-arkane-amber"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-arkane-muted">Expiry</span>
              <input
                type="date"
                value={draft.expiresAt}
                onChange={(event) => update("expiresAt", event.target.value)}
                className="min-h-11 w-full rounded-lg bg-black/25 px-4 text-arkane-text outline-none ring-1 ring-arkane-line focus-visible:ring-2 focus-visible:ring-arkane-amber"
              />
            </label>
          </div>
          <label className="space-y-2">
            <span className="text-sm text-arkane-muted">Secret value</span>
            <textarea
              value={draft.value}
              onChange={(event) => update("value", event.target.value)}
              rows={4}
              required
              className="w-full resize-none rounded-lg bg-black/25 px-4 py-3 font-mono text-sm text-arkane-text outline-none ring-1 ring-arkane-line focus-visible:ring-2 focus-visible:ring-arkane-amber"
            />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-white/[0.035] px-4 ring-1 ring-arkane-line">
            <span className="text-sm text-arkane-muted">Conceal field by default</span>
            <input
              type="checkbox"
              checked={draft.concealed}
              onChange={(event) => update("concealed", event.target.checked)}
              className="h-5 w-5 accent-arkane-amber"
            />
          </label>
          <div className="rounded-lg bg-white/[0.035] p-3 ring-1 ring-arkane-line">
            <label className="tap-target inline-flex cursor-pointer items-center gap-2 rounded-lg bg-black/25 px-4 text-sm text-arkane-text ring-1 ring-arkane-line transition-transform duration-150 ease-arkane active:scale-95">
              <Upload className="h-4 w-4 text-arkane-amber" />
              Attach encrypted preview
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
              className="tap-target rounded-lg bg-white/[0.04] px-4 text-arkane-muted ring-1 ring-arkane-line transition-transform duration-150 ease-arkane active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tap-target rounded-lg bg-arkane-green px-5 font-semibold text-black transition-transform duration-150 ease-arkane active:scale-95"
            >
              Encrypt item
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
