export type VaultCategory = "credentials" | "assets" | "footprints" | "sentry";

export type SyncStatus = "idle" | "loading" | "syncing" | "synced" | "offline" | "conflict" | "error";

export interface GitHubConnection {
  token: string;
  repo: string;
  branch: string;
  path: string;
}

export interface VaultField {
  id: string;
  label: string;
  value: string;
  copyable: boolean;
  concealed: boolean;
}

export interface VaultAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  encryptedPreview?: string;
  previewDataUrl?: string;
}

export interface VaultItem {
  id: string;
  category: Exclude<VaultCategory, "sentry">;
  title: string;
  subtitle: string;
  note?: string;
  fields: VaultField[];
  tags: string[];
  expiresAt?: string;
  attachment?: VaultAttachment;
  createdAt: string;
  updatedAt: string;
}

export interface VaultSentry {
  deadMansNote: string;
  recoveryHint: string;
}

export interface VaultData {
  schema: "arkane.vault.v1";
  version: 1;
  updatedAt: string;
  items: VaultItem[];
  sentry: VaultSentry;
}

export interface EncryptedVaultEnvelope {
  schema: "arkane.encrypted.v1";
  kdf: {
    name: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
  };
  cipher: {
    name: "AES-GCM";
    iv: string;
  };
  payload: string;
  updatedAt: string;
}

export interface PinWrappedKey {
  schema: "arkane.pinwrap.v1";
  kdf: {
    name: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
  };
  cipher: {
    name: "AES-GCM";
    iv: string;
  };
  wrappedKey: string;
  expiresAt: string;
}

export interface EncryptedSessionSnapshot {
  schema: "arkane.session.v1";
  connection: Pick<GitHubConnection, "repo" | "branch" | "path">;
  envelope: EncryptedVaultEnvelope;
  sha?: string;
  dirty: boolean;
}

export interface SyncState {
  status: SyncStatus;
  message: string;
  at?: string;
}

export interface ExpiryState {
  tone: "none" | "normal" | "warning" | "critical";
  label: string;
  daysLeft?: number;
}
