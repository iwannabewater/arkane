import { Languages } from "lucide-react";
import type { AppLanguage } from "../lib/i18n";
import { cn } from "../lib/ui";

interface LanguageToggleProps {
  language: AppLanguage;
  labels: {
    aria: string;
    next: string;
    en: string;
    zh: string;
  };
  onToggle: () => void;
  compact?: boolean;
}

export function LanguageToggle({ language, labels, onToggle, compact = false }: LanguageToggleProps) {
  const activeZh = language === "zh";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${labels.aria}: ${labels.next}`}
      title={labels.next}
      className={cn(
        "tap-target interactive-surface group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/[0.08] bg-black/35 text-arkane-muted shadow-inset ring-1 ring-black/40 active:scale-[0.97] [@media(hover:hover)]:hover:border-arkane-brass/40 [@media(hover:hover)]:hover:bg-white/[0.075] [@media(hover:hover)]:hover:text-arkane-text",
        compact ? "px-2.5 py-2" : "px-3 py-2"
      )}
    >
      <Languages className="relative z-10 h-4 w-4 text-arkane-brass transition-colors group-hover:text-arkane-amber" />
      <span
        className={cn(
          "relative z-10 grid h-8 w-[4.7rem] grid-cols-2 rounded-full bg-black/35 p-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-arkane-faint ring-1 ring-white/[0.07]",
          compact && "w-[3.85rem]"
        )}
      >
        <span
          className={cn(
            "absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-arkane-amber shadow-amber transition-transform duration-200 ease-arkane",
            activeZh ? "translate-x-[calc(100%+4px)]" : "translate-x-1"
          )}
          aria-hidden="true"
        />
        <span className={cn("relative z-10 grid place-items-center", !activeZh && "text-black")}>{labels.en}</span>
        <span className={cn("relative z-10 grid place-items-center", activeZh && "text-black")}>{labels.zh}</span>
      </span>
    </button>
  );
}
