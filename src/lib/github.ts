import type { EncryptedVaultEnvelope, GitHubConnection } from "../types";
import { base64ToJson, jsonToBase64 } from "./encoding";

const API_ROOT = "https://api.github.com";

export class GitHubSyncError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GitHubSyncError";
    this.status = status;
  }
}

export interface VaultFile {
  envelope: EncryptedVaultEnvelope;
  sha: string;
}

export interface SaveVaultFileResult {
  sha: string;
  htmlUrl?: string;
}

export function normalizeRepoName(repo: string): string {
  return repo.trim().replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "");
}

export function validateRepoName(repo: string): boolean {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(normalizeRepoName(repo));
}

export function normalizeVaultPath(path: string): string {
  const normalized = path.trim().replace(/^\/+/, "");
  return normalized || "vault.json";
}

function contentUrl(connection: GitHubConnection): string {
  const repo = encodeURI(normalizeRepoName(connection.repo));
  const path = normalizeVaultPath(connection.path)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const branch = connection.branch.trim();
  const query = branch ? `?ref=${encodeURIComponent(branch)}` : "";
  return `${API_ROOT}/repos/${repo}/contents/${path}${query}`;
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

function headers(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

export async function fetchVaultFile(connection: GitHubConnection): Promise<VaultFile | null> {
  const response = await fetch(contentUrl(connection), {
    headers: headers(connection.token)
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new GitHubSyncError(response.status, await parseError(response));
  }

  const body = (await response.json()) as {
    type: string;
    sha: string;
    content?: string;
    encoding?: string;
  };

  if (body.type !== "file" || body.encoding !== "base64" || !body.content) {
    throw new GitHubSyncError(422, "Vault path must point to a JSON file.");
  }

  return {
    envelope: base64ToJson<EncryptedVaultEnvelope>(body.content),
    sha: body.sha
  };
}

export async function saveVaultFile(
  connection: GitHubConnection,
  envelope: EncryptedVaultEnvelope,
  sha?: string
): Promise<SaveVaultFileResult> {
  const branch = connection.branch.trim();
  const response = await fetch(contentUrl(connection).replace(/\?ref=.*/, ""), {
    method: "PUT",
    headers: {
      ...headers(connection.token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `chore(vault): sync Arkane vault ${new Date().toISOString()}`,
      content: jsonToBase64(envelope),
      sha,
      branch: branch || undefined
    })
  });

  if (!response.ok) {
    throw new GitHubSyncError(response.status, await parseError(response));
  }

  const body = (await response.json()) as {
    content?: { sha?: string; html_url?: string };
  };
  const nextSha = body.content?.sha;
  if (!nextSha) {
    throw new GitHubSyncError(502, "GitHub did not return the updated file SHA.");
  }

  return {
    sha: nextSha,
    htmlUrl: body.content?.html_url
  };
}
