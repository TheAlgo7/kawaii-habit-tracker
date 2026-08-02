import { describe, expect, it } from "vitest";
import {
  habitStatus,
  habitStreak,
  isScheduledOn,
  normalizeHabit,
  setSkip,
  toggleComplete,
  toggleTiny,
} from "./habits";

// 2026-06-04 is a Thursday; 06-05 Fri, 06-06 Sat, 06-07 Sun, 06-08 Mon.

describe("normalizeHabit", () => {
  it("fills gentle defaults", () => {
    const h = normalizeHabit({ name: "Read" });
    expect(h.type).toBe("build");
    expect(h.icon).toBe("book");
    expect(h.timeOfDay).toBe("anytime");
    expect(h.frequency).toEqual({ kind: "daily", days: [0, 1, 2, 3, 4, 5, 6] });
    expect(h.tinyDates).toEqual([]);
    expect(h.archivedAt).toBeNull();
  });

  it("infers a first-party icon for migrated habits without changing legacy data", () => {
    const h = normalizeHabit({ name: "Drink water", emoji: "💧" });
    expect(h.icon).toBe("water");
    expect(h.emoji).toBe("💧");
  });

  it("gives movement, walking, meditation, tidying, and fresh food distinct artwork", () => {
    expect(normalizeHabit({ name: "Move your body" }).icon).toBe("move");
    expect(normalizeHabit({ name: "Walk after lunch" }).icon).toBe("walk");
    expect(normalizeHabit({ name: "Meditate" }).icon).toBe("meditate");
    expect(normalizeHabit({ name: "Tidy the desk" }).icon).toBe("tidy");
    expect(normalizeHabit({ name: "Eat fresh fruit" }).icon).toBe("fresh");
  });

  it("migrates old duplicated icon choices without changing unrelated habits", () => {
    expect(normalizeHabit({ name: "Walk", icon: "stretch" }).icon).toBe("walk");
    expect(normalizeHabit({ name: "Move your body", icon: "stretch" }).icon).toBe("move");
    expect(normalizeHabit({ name: "Meditate", icon: "breathe" }).icon).toBe("meditate");
    expect(normalizeHabit({ name: "Breathing break", icon: "breathe" }).icon).toBe("breathe");
    expect(normalizeHabit({ name: "Tidy up", icon: "home" }).icon).toBe("tidy");
    expect(normalizeHabit({ name: "Eat something fresh", icon: "plant" }).icon).toBe("fresh");
  });
});

describe("isScheduledOn", () => {
  it("daily is always scheduled", () => {
    expect(isScheduledOn(normalizeHabit({ frequency: { kind: "daily" } }), "2026-06-07")).toBe(true);
  });

  it("weekdays excludes the weekend", () => {
    const h = normalizeHabit({ frequency: { kind: "weekdays" } });
    expect(isScheduledOn(h, "2026-06-04")).toBe(true); // Thursday
    expect(isScheduledOn(h, "2026-06-07")).toBe(false); // Sunday
  });
});

describe("habitStatus + toggles", () => {
  it("reports done / tiny / skipped / due", () => {
    const base = normalizeHabit({ name: "h" });
    expect(habitStatus(base, "2026-06-04")).toBe("due");
    expect(habitStatus(toggleComplete(base, "2026-06-04"), "2026-06-04")).toBe("done");
    expect(habitStatus(toggleTiny(base, "2026-06-04"), "2026-06-04")).toBe("tiny");
    expect(habitStatus(setSkip(base, "2026-06-04", "rest"), "2026-06-04")).toBe("skipped");
  });

  it("completing clears a tiny/skip on the same day", () => {
    let h = normalizeHabit({ name: "h" });
    h = setSkip(h, "2026-06-04", "rest");
    h = toggleComplete(h, "2026-06-04");
    expect(h.skipsByDate["2026-06-04"]).toBeUndefined();
    expect(h.completedDates).toContain("2026-06-04");
  });
});

describe("habitStreak (gentle, schedule-aware)", () => {
  it("counts consecutive completions ending today", () => {
    const h = normalizeHabit({ completedDates: ["2026-06-03", "2026-06-04"] });
    expect(habitStreak(h, "2026-06-04")).toBe(2);
  });

  it("a rest day does not break the streak", () => {
    const h = normalizeHabit({
      completedDates: ["2026-06-02", "2026-06-04"],
      skipsByDate: { "2026-06-03": "rest" },
    });
    expect(habitStreak(h, "2026-06-04")).toBe(2);
  });

  it("unscheduled weekend days do not break a weekday streak", () => {
    const h = normalizeHabit({
      frequency: { kind: "weekdays" },
      completedDates: ["2026-06-04", "2026-06-05"], // Thu, Fri
    });
    expect(habitStreak(h, "2026-06-08")).toBe(2); // Monday, weekend skipped
  });

  it("tiny completions still count toward the streak", () => {
    const h = normalizeHabit({ completedDates: ["2026-06-04"], tinyDates: ["2026-06-03"] });
    expect(habitStreak(h, "2026-06-04")).toBe(2);
  });
});
