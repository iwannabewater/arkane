// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EncryptedVaultEnvelope } from "../types";
import { decryptVaultWithPassword } from "../lib/crypto";
import { jsonToBase64, base64ToJson } from "../lib/encoding";
import { useVaultEngine } from "./useVaultEngine";

type Engine = ReturnType<typeof useVaultEngine>;

const masterPassword = "correct horse battery staple";
const unlockInput = {
  token: "github_pat_test_token_value",
  repo: "owner/private-vault",
  branch: "main",
  path: "vault.json",
  masterPassword,
  quickPin: "482913"
};

let engine: Engine | undefined;
let root: Root;
let container: HTMLDivElement;
let remote: { envelope: EncryptedVaultEnvelope; sha: string } | null;
let writes: number;
let failNextRead: boolean;

function Harness() {
  const current = useVaultEngine();
  useEffect(() => {
    engine = current;
  });
  return null;
}

function currentEngine() {
  if (!engine) {
    throw new Error("Engine was not rendered.");
  }
  return engine;
}

describe("vault session lifecycle", () => {
  beforeEach(async () => {
    Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true });
    localStorage.clear();
    sessionStorage.clear();
    remote = null;
    writes = 0;
    failNextRead = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "PUT") {
          const body = JSON.parse(String(init.body)) as { content: string };
          writes += 1;
          remote = { envelope: base64ToJson<EncryptedVaultEnvelope>(body.content), sha: `sha-${writes}` };
          return new Response(JSON.stringify({ content: { sha: remote.sha } }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
        if (failNextRead) {
          failNextRead = false;
          return new Response(JSON.stringify({ message: "Service unavailable" }), {
            status: 503,
            headers: { "Content-Type": "application/json" }
          });
        }
        if (!remote) {
          return new Response(null, { status: 404 });
        }
        return new Response(
          JSON.stringify({
            type: "file",
            encoding: "base64",
            sha: remote.sha,
            content: jsonToBase64(remote.envelope)
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => {
      root.render(<Harness />);
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    engine = undefined;
  });

  it("retains a queued edit across lock and Quick PIN unlock before committing it", async () => {
    await act(async () => {
      await currentEngine().unlockWithMaster(unlockInput);
    });
    expect(writes).toBe(1);

    act(() => {
      currentEngine().addItem({
        category: "credentials",
        title: "Pending edit marker",
        subtitle: "Saved after lock",
        label: "Secret",
        value: "preserve-me",
        concealed: true
      });
    });
    expect(currentEngine().vault?.items[0]?.title).toBe("Pending edit marker");

    await act(async () => {
      await currentEngine().lock();
    });
    expect(currentEngine().stage).toBe("soft-locked");
    expect(currentEngine().vault).toBeNull();

    await act(async () => {
      await currentEngine().unlockWithPin("482913");
      await currentEngine().manualSync();
    });
    expect(currentEngine().vault?.items[0]?.title).toBe("Pending edit marker");
    expect(remote).not.toBeNull();
    const persisted = await decryptVaultWithPassword(remote!.envelope, masterPassword);
    expect(persisted.vault.items[0]?.title).toBe("Pending edit marker");
  });

  it("clears decrypted UI state on lock even when Quick PIN is not enabled", async () => {
    await act(async () => {
      await currentEngine().unlockWithMaster({ ...unlockInput, quickPin: undefined });
      await currentEngine().lock();
    });
    expect(currentEngine().stage).toBe("gateway");
    expect(currentEngine().vault).toBeNull();
    expect(sessionStorage.getItem("arkane.session.snapshot.v1")).not.toBeNull();
  });

  it("requires the master password after three failed Quick PIN attempts", async () => {
    await act(async () => {
      await currentEngine().unlockWithMaster(unlockInput);
      await currentEngine().lock();
    });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await act(async () => {
        await expect(currentEngine().unlockWithPin("000000")).rejects.toThrow(/Quick PIN/);
      });
    }
    expect(currentEngine().stage).toBe("gateway");
    expect(currentEngine().hasQuickPin).toBe(false);
  });

  it("surfaces a clean manual refresh failure instead of leaving a loading state", async () => {
    await act(async () => {
      await currentEngine().unlockWithMaster(unlockInput);
    });
    failNextRead = true;
    await act(async () => {
      await expect(currentEngine().manualSync()).rejects.toThrow(/Service unavailable/);
    });
    expect(currentEngine().syncState.status).toBe("error");
    expect(currentEngine().syncState.message).toMatch(/Service unavailable/);
  });

  it("warns before unloading while an encrypted edit is waiting to sync", async () => {
    await act(async () => {
      await currentEngine().unlockWithMaster(unlockInput);
    });
    act(() => {
      currentEngine().addItem({
        category: "assets",
        title: "Pending write",
        subtitle: "",
        label: "Value",
        value: "retain",
        concealed: true
      });
    });
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("opens an encrypted snapshot but reports a GitHub service failure accurately", async () => {
    await act(async () => {
      await currentEngine().unlockWithMaster({ ...unlockInput, quickPin: undefined });
      await currentEngine().lock();
    });
    failNextRead = true;
    await act(async () => {
      await currentEngine().unlockWithMaster({ ...unlockInput, quickPin: undefined });
    });
    expect(currentEngine().stage).toBe("ready");
    expect(currentEngine().syncState.status).toBe("error");
    expect(currentEngine().syncState.message).toMatch(/sync unavailable: Service unavailable/);
  });

  it("locks an open vault after five minutes without activity", async () => {
    vi.useFakeTimers();
    await act(async () => {
      await currentEngine().unlockWithMaster(unlockInput);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    });
    expect(currentEngine().stage).toBe("soft-locked");
    expect(currentEngine().vault).toBeNull();
  });

  it("does not report a committed write as failed when the session cache is full", async () => {
    await act(async () => {
      await currentEngine().unlockWithMaster(unlockInput);
    });
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === "arkane.session.snapshot.v1") {
        throw new DOMException("Full", "QuotaExceededError");
      }
      return setItem.call(this, key, value);
    });
    act(() => {
      currentEngine().addItem({
        category: "footprints",
        title: "Stored remotely",
        subtitle: "",
        label: "Value",
        value: "committed",
        concealed: true
      });
    });
    await act(async () => {
      await currentEngine().manualSync();
    });
    expect(currentEngine().syncState.status).toBe("synced");
    expect(currentEngine().syncState.message).toMatch(/session cache unavailable/);
    const persisted = await decryptVaultWithPassword(remote!.envelope, masterPassword);
    expect(persisted.vault.items[0]?.title).toBe("Stored remotely");
  });
});
