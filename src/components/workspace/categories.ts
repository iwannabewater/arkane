import { Archive, CreditCard, Footprints, IdCard, type LucideIcon } from "lucide-react";
import type { VaultCategory } from "../../types";

export interface CategoryMeta {
  id: VaultCategory;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "credentials", icon: IdCard },
  { id: "assets", icon: CreditCard },
  { id: "footprints", icon: Footprints },
  { id: "sentry", icon: Archive }
];
