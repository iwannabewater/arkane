import { afterEach, describe, expect, it, vi } from "vitest";
import { initialLanguage, localizeError, localizeSyncMessage, nextLanguage, persistLanguage } from "./i18n";

function memoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear() {
      entries.clear();
    },
    getItem(key: string) {
      return entries.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(entries.keys())[index] ?? null;
    },
    removeItem(key: string) {
      entries.delete(key);
    },
    setItem(key: string, value: string) {
      entries.set(key, value);
    }
  };
}

describe("i18n", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists the one-click language choice when storage is available", () => {
    vi.stubGlobal("localStorage", memoryStorage());

    persistLanguage("zh");

    expect(initialLanguage()).toBe("zh");
    expect(nextLanguage("zh")).toBe("en");
  });

  it("localizes known sync and dynamic Quick PIN messages", () => {
    expect(localizeSyncMessage("Encrypted vault committed", "zh")).toBe("加密金库已提交");
    expect(localizeError(new Error("Quick PIN failed. 2 attempts remaining."), "Quick PIN failed.", "zh")).toBe(
      "快速 PIN 失败。还剩 2 次尝试。"
    );
  });

  it("keeps English messages unchanged", () => {
    expect(localizeSyncMessage("Vault already up to date", "en")).toBe("Vault already up to date");
  });
});
