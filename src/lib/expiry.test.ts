import { describe, expect, it } from "vitest";
import { getExpiryState } from "./expiry";

describe("expiry sentry", () => {
  const now = new Date("2026-05-26T00:00:00.000Z");

  it("marks dates inside 30 days as warning", () => {
    expect(getExpiryState("2026-06-20", now)).toMatchObject({
      tone: "warning",
      daysLeft: 25
    });
  });

  it("marks dates inside seven days as critical", () => {
    expect(getExpiryState("2026-05-28", now)).toMatchObject({
      tone: "critical",
      daysLeft: 2
    });
  });

  it("marks overdue dates as critical", () => {
    expect(getExpiryState("2026-05-20", now)).toMatchObject({
      tone: "critical",
      daysLeft: -6
    });
  });
});
