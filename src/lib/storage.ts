import { assertEncryptedEnvelope, assertPinWrappedKey } from "./crypto";
import type { EncryptedSessionSnapshot, GitHubConnection, PinWrappedKey } from "../types";

const CONNECTION_KEY = "arkane.github.connection.v1";
const PIN_WRAP_KEY = "arkane.quickpin.wrap.v1";
const SESSION_SNAPSHOT_KEY = "arkane.session.snapshot.v1";
const PIN_FAILURES_KEY = "arkane.quickpin.failures.v1";
export const MAX_PIN_FAILURES = 3;

function canUseStorage(storage: Storage | undefined): storage is Storage {
  return typeof storage !== "undefined";
}

function sameConnection(
  stored: Pick<GitHubConnection, "repo" | "branch" | "path">,
  active: Pick<GitHubConnection, "repo" | "branch" | "path">
) {
  return stored.repo === active.repo && stored.branch === active.branch && stored.path === active.path;
}

export function loadConnection(): GitHubConnection | null {
  if (!canUseStorage(globalThis.localStorage)) {
    return null;
  }

  try {
    const raw = localStorage.getItem(CONNECTION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<GitHubConnection>;
    if (!parsed.token || !parsed.repo) {
      return null;
    }
    return {
      token: parsed.token,
      repo: parsed.repo,
      branch: parsed.branch || "main",
      path: parsed.path || "vault.json"
    };
  } catch {
    return null;
  }
}

export function saveConnection(connection: GitHubConnection) {
  if (canUseStorage(globalThis.localStorage)) {
    localStorage.setItem(CONNECTION_KEY, JSON.stringify(connection));
  }
}

export function clearConnection() {
  if (canUseStorage(globalThis.localStorage)) {
    localStorage.removeItem(CONNECTION_KEY);
  }
}

export function loadPinWrap(): PinWrappedKey | null {
  if (!canUseStorage(globalThis.sessionStorage)) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(PIN_WRAP_KEY);
    if (!raw) {
      return null;
    }
    const parsed = assertPinWrappedKey(JSON.parse(raw) as unknown);
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      clearPinWrap();
      return null;
    }
    return parsed;
  } catch {
    clearPinWrap();
    return null;
  }
}

export function savePinWrap(pinWrap: PinWrappedKey) {
  if (canUseStorage(globalThis.sessionStorage)) {
    sessionStorage.setItem(PIN_WRAP_KEY, JSON.stringify(assertPinWrappedKey(pinWrap)));
    resetPinFailures();
  }
}

export function clearPinWrap() {
  if (canUseStorage(globalThis.sessionStorage)) {
    sessionStorage.removeItem(PIN_WRAP_KEY);
    resetPinFailures();
  }
}

export function recordPinFailure(): number {
  if (!canUseStorage(globalThis.sessionStorage)) {
    return 0;
  }
  const attempts = Number.parseInt(sessionStorage.getItem(PIN_FAILURES_KEY) ?? "0", 10) + 1;
  if (attempts >= MAX_PIN_FAILURES) {
    clearPinWrap();
    return 0;
  }
  sessionStorage.setItem(PIN_FAILURES_KEY, String(attempts));
  return MAX_PIN_FAILURES - attempts;
}

export function resetPinFailures() {
  if (canUseStorage(globalThis.sessionStorage)) {
    sessionStorage.removeItem(PIN_FAILURES_KEY);
  }
}

export function loadSessionSnapshot(connection: GitHubConnection): EncryptedSessionSnapshot | null {
  if (!canUseStorage(globalThis.sessionStorage)) {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(SESSION_SNAPSHOT_KEY);
    if (!raw) {
      return null;
    }
    const candidate = JSON.parse(raw) as Partial<EncryptedSessionSnapshot>;
    if (
      candidate.schema !== "arkane.session.v1" ||
      !candidate.connection ||
      !sameConnection(candidate.connection, connection) ||
      typeof candidate.dirty !== "boolean"
    ) {
      return null;
    }
    return {
      schema: "arkane.session.v1",
      connection: candidate.connection,
      envelope: assertEncryptedEnvelope(candidate.envelope),
      sha: typeof candidate.sha === "string" ? candidate.sha : undefined,
      dirty: candidate.dirty
    };
  } catch {
    clearSessionSnapshot();
    return null;
  }
}

export function saveSessionSnapshot(snapshot: EncryptedSessionSnapshot) {
  if (canUseStorage(globalThis.sessionStorage)) {
    sessionStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(snapshot));
  }
}

export function clearSessionSnapshot() {
  if (canUseStorage(globalThis.sessionStorage)) {
    sessionStorage.removeItem(SESSION_SNAPSHOT_KEY);
  }
}
