import type { VaultCategory } from "../../types";
import { cn } from "../../lib/ui";
import { CATEGORIES } from "./categories";

export function SideRail({
  activeCategory,
  onSelect
}: {
  activeCategory: VaultCategory;
  onSelect: (category: VaultCategory) => void;
}) {
  return (
    <nav className="hidden w-[92px] shrink-0 border-r border-white/[0.06] bg-black/20 px-3 py-[calc(env(safe-area-inset-top)+18px)] lg:block">
      <div className="flex flex-col gap-3">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const active = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              aria-label={category.en}
              className={cn(
                "tap-target grid h-16 place-items-center rounded-xl transition-[transform,background-color,color] duration-150 ease-arkane active:scale-95",
                active
                  ? "bg-arkane-amber text-black shadow-amber"
                  : "bg-white/[0.035] text-arkane-muted ring-1 ring-arkane-line [@media(hover:hover)]:hover:bg-white/[0.07] [@media(hover:hover)]:hover:text-arkane-text"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="sr-only">{category.en}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNav({
  activeCategory,
  onSelect
}: {
  activeCategory: VaultCategory;
  onSelect: (category: VaultCategory) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-arkane-canvas/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const active = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={cn(
                "tap-target flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-xs transition-[transform,background-color,color] duration-150 ease-arkane active:scale-95",
                active ? "bg-arkane-amber text-black" : "text-arkane-muted"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="leading-none">{category.cn}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
