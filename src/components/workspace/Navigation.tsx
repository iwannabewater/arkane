import type { VaultCategory } from "../../types";
import { cn } from "../../lib/ui";
import { CATEGORIES } from "./categories";

export function SideRail({
  labels,
  activeCategory,
  onSelect
}: {
  labels: Record<VaultCategory, { nav: string; title: string; eyebrow: string }>;
  activeCategory: VaultCategory;
  onSelect: (category: VaultCategory) => void;
}) {
  return (
    <nav className="hidden w-[104px] shrink-0 border-r border-white/[0.06] bg-black/30 px-3 py-[calc(env(safe-area-inset-top)+18px)] shadow-[18px_0_50px_oklch(0%_0_0_/_0.18)] lg:block">
      <div className="vault-plate flex min-h-full flex-col gap-3 rounded-[1.45rem] bg-white/[0.025] p-2 shadow-inset ring-1 ring-arkane-line">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const active = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              aria-label={labels[category.id].nav}
              aria-current={active ? "page" : undefined}
              className={cn(
                "tap-target interactive-surface group grid h-16 place-items-center rounded-2xl shadow-inset active:scale-[0.96]",
                active
                  ? "bg-arkane-amber text-black shadow-amber"
                  : "bg-white/[0.035] text-arkane-muted ring-1 ring-arkane-line [@media(hover:hover)]:hover:bg-white/[0.075] [@media(hover:hover)]:hover:text-arkane-text"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="sr-only">{labels[category.id].nav}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNav({
  labels,
  activeCategory,
  onSelect
}: {
  labels: Record<VaultCategory, { nav: string; title: string; eyebrow: string }>;
  activeCategory: VaultCategory;
  onSelect: (category: VaultCategory) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-arkane-canvas/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-18px_38px_oklch(0%_0_0_/_0.32)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 rounded-[1.35rem] bg-white/[0.035] p-1 shadow-inset ring-1 ring-arkane-line">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const active = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={cn(
                "tap-target interactive-surface flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] active:scale-[0.96]",
                active ? "bg-arkane-amber text-black shadow-amber" : "text-arkane-muted [@media(hover:hover)]:hover:bg-white/[0.06]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate leading-none">{labels[category.id].nav}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
