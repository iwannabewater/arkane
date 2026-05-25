import type { GitHubConnection, SyncState, VaultAttachment, VaultData, VaultItem } from "../types";
import { GitHubSyncError, normalizeRepoName, normalizeVaultPath, validateRepoName } from "./github";

export interface MasterUnlockInput {
  token: string;
  repo: string;
  branch: string;
  path: string;
  masterPassword: string;
  quickPin?: string;
}

export interface NewVaultItemInput {
  category: VaultItem["category"];
  title: string;
  subtitle: string;
  label: string;
  value: string;
  concealed: boolean;
  expiresAt?: string;
  attachment?: Omit<VaultAttachment, "id">;
}

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeConnection(input: Omit<MasterUnlockInput, "masterPassword" | "quickPin">): GitHubConnection {
  const connection = {
    token: input.token.trim(),
    repo: normalizeRepoName(input.repo),
    branch: input.branch.trim() || "main",
    path: normalizeVaultPath(input.path)
  };
  if (!connection.token) {
    throw new Error("GitHub PAT is required.");
  }
  if (!validateRepoName(connection.repo)) {
    throw new Error("Repo name must look like owner/private-repo.");
  }
  return connection;
}

export function stampVault(vault: VaultData): VaultData {
  return { ...vault, updatedAt: nowIso() };
}

export function syncFailureState(error: unknown): SyncState {
  const message = error instanceof Error ? error.message : "Unable to sync vault.";
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  const conflict =
    (error instanceof GitHubSyncError && error.status === 409) ||
    message.toLowerCase().includes("sha") ||
    message.toLowerCase().includes("conflict");
  return { status: offline ? "offline" : conflict ? "conflict" : "error", message, at: nowIso() };
}

export function createVaultItem(input: NewVaultItemInput): VaultItem {
  const timestamp = nowIso();
  return {
    id: crypto.randomUUID(),
    category: input.category,
    title: input.title.trim() || "Untitled secure item",
    subtitle: input.subtitle.trim(),
    expiresAt: input.expiresAt || undefined,
    note: "",
    tags: [],
    fields: [
      {
        id: crypto.randomUUID(),
        label: input.label.trim() || "Secret",
        value: input.value,
        copyable: true,
        concealed: input.concealed
      }
    ],
    attachment: input.attachment ? { ...input.attachment, id: crypto.randomUUID() } : undefined,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
