import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calcStreak, daysBetween, offsetDate, toDateKey, today } from "./date";

describe("toDateKey", () => {
  it("formats a date as a zero-padded local calendar key", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toDateKey(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("uses the LOCAL calendar day, not UTC", () => {
    // 01:30 on June 5 in a positive-offset zone (e.g. Asia/Kolkata) is still
    // June 4 in UTC. The old toISOString() approach recorded the wrong day;
    // reading local components must always yield June 5 here.
    expect(toDateKey(new Date(2026, 5, 5, 1, 30))).toBe("2026-06-05");
    // ...and late evening must not roll forward either.
    expect(toDateKey(new Date(2026, 5, 5, 23, 45))).toBe("2026-06-05");
  });
});

describe("offsetDate", () => {
  it("moves forward and backward within a month", () => {
    expect(offsetDate("2026-06-04", 1)).toBe("2026-06-05");
    expect(offsetDate("2026-06-04", -1)).toBe("2026-06-03");
  });

  it("crosses month and year boundaries", () => {
    expect(offsetDate("2026-01-31", 1)).toBe("2026-02-01");
    expect(offsetDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(offsetDate("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles leap years", () => {
    expect(offsetDate("2028-02-28", 1)).toBe("2028-02-29");
    expect(offsetDate("2028-03-01", -1)).toBe("2028-02-29");
  });
});

describe("daysBetween", () => {
  it("counts whole calendar days", () => {
    expect(daysBetween("2026-06-01", "2026-06-04")).toBe(3);
    expect(daysBetween("2026-06-04", "2026-06-04")).toBe(0);
  });

  it("is unaffected by DST transitions", () => {
    // US spring-forward weekend (Mar 8 2026) is still exactly 2 calendar days.
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
  });

  it("handles month and year spans", () => {
    expect(daysBetween("2026-01-01", "2026-12-31")).toBe(364);
  });
});

describe("calcStreak", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 4, 12, 0)); // local noon, June 4 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 for no history", () => {
    expect(calcStreak([])).toBe(0);
    expect(calcStreak(undefined)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(calcStreak(["2026-06-02", "2026-06-03", "2026-06-04"])).toBe(3);
  });

  it("breaks on a gap", () => {
    expect(calcStreak(["2026-06-01", "2026-06-04"])).toBe(1);
  });

  it("returns 0 when today is not completed", () => {
    expect(calcStreak(["2026-06-02", "2026-06-03"])).toBe(0);
  });

  it("ignores duplicates and future dates", () => {
    expect(calcStreak(["2026-06-04", "2026-06-04", "2026-06-05"])).toBe(1);
  });

  it("matches today's local key from the fake clock", () => {
    expect(today()).toBe("2026-06-04");
  });
});
