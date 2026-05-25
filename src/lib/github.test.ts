import { describe, expect, it } from "vitest";
import { normalizeRepoName, normalizeVaultPath, validateRepoName } from "./github";

describe("github sync helpers", () => {
  it("normalizes GitHub repo URLs", () => {
    expect(normalizeRepoName("https://github.com/iwannabewater/arkane-vault.git")).toBe(
      "iwannabewater/arkane-vault"
    );
  });

  it("validates owner/repo names", () => {
    expect(validateRepoName("iwannabewater/arkane-vault")).toBe(true);
    expect(validateRepoName("iwannabewater")).toBe(false);
  });

  it("normalizes vault paths", () => {
    expect(normalizeVaultPath("/secure/vault.json")).toBe("secure/vault.json");
    expect(normalizeVaultPath("")).toBe("vault.json");
  });
});
