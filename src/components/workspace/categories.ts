import { Archive, CreditCard, Footprints, IdCard, type LucideIcon } from "lucide-react";
import type { VaultCategory } from "../../types";

export interface CategoryMeta {
  id: VaultCategory;
  cn: string;
  en: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "credentials", cn: "Credentials", en: "Credentials", icon: IdCard },
  { id: "assets", cn: "Assets", en: "Assets", icon: CreditCard },
  { id: "footprints", cn: "Footprints", en: "Footprints", icon: Footprints },
  { id: "sentry", cn: "Recovery", en: "Recovery", icon: Archive }
];

export function categoryMeta(category: VaultCategory) {
  return CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0];
}
