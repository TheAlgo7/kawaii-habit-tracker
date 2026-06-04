import { describe, expect, it } from "vitest";
import { computeTrust, computeWorld, levelForTrust, unlockedDecor } from "./world";
import { normalizeHabit } from "./habits";

describe("world engine", () => {
  it("scores full completions higher than tiny, but tiny still counts", () => {
    const habits = [normalizeHabit({ completedDates: ["a", "b", "c"], tinyDates: ["d", "e"] })];
    expect(computeTrust(habits)).toBe(3 * 2 + 2 * 1); // 8
  });

  it("levels up with trust", () => {
    expect(levelForTrust(0).level).toBe(1);
    expect(levelForTrust(8).level).toBe(2);
    expect(levelForTrust(220).level).toBe(8);
  });

  it("unlocks decor as trust grows", () => {
    expect(unlockedDecor(0).map((d) => d.id)).toEqual(["sprout"]);
    expect(unlockedDecor(8).map((d) => d.id)).toContain("lamp");
    expect(unlockedDecor(8).length).toBe(3);
  });

  it("computeWorld reports level, progress and next unlock", () => {
    const habits = [normalizeHabit({ completedDates: ["2026-06-04"] })];
    const world = computeWorld(habits, "2026-06-04");
    expect(world.trust).toBe(2);
    expect(world.level).toBe(1);
    expect(world.unlocked.length).toBeGreaterThan(0);
    expect(world.nextDecor).toBeTruthy();
    expect(world.levelProgress).toBeGreaterThanOrEqual(0);
    expect(world.warmth).toBeGreaterThan(0);
  });

  it("a brand-new world is calm, not empty-broken", () => {
    const world = computeWorld([], "2026-06-04");
    expect(world.trust).toBe(0);
    expect(world.warmth).toBe(0);
    expect(world.unlocked.length).toBe(1); // the first sprout is always there
  });
});
