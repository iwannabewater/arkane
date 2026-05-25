import type { VaultData } from "../types";

export function createInitialVault(): VaultData {
  return {
    schema: "arkane.vault.v1",
    version: 1,
    updatedAt: new Date().toISOString(),
    items: [],
    sentry: {
      deadMansNote: "",
      recoveryHint: ""
    }
  };
}
