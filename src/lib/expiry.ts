import type { ExpiryState, VaultItem } from "../types";

const DAY = 24 * 60 * 60 * 1000;

export function getExpiryState(expiresAt?: string, now = new Date()): ExpiryState {
  if (!expiresAt) {
    return { tone: "none", label: "No expiry" };
  }

  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) {
    return { tone: "none", label: "Invalid date" };
  }

  const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / DAY);
  if (daysLeft < 0) {
    return { tone: "critical", label: `${Math.abs(daysLeft)}d overdue`, daysLeft };
  }
  if (daysLeft === 0) {
    return { tone: "critical", label: "Due today", daysLeft };
  }
  if (daysLeft <= 7) {
    return { tone: "critical", label: `${daysLeft}d left`, daysLeft };
  }
  if (daysLeft <= 30) {
    return { tone: "warning", label: `${daysLeft}d left`, daysLeft };
  }
  return { tone: "normal", label: `${daysLeft}d left`, daysLeft };
}

export function getExpiringItems(items: VaultItem[], now = new Date()): VaultItem[] {
  return items.filter((item) => {
    const state = getExpiryState(item.expiresAt, now);
    return state.tone === "critical" || state.tone === "warning";
  });
}
