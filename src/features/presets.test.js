import { describe, expect, it } from "vitest";
import { HABIT_PRESETS, THEMES } from "./presets";

describe("habit presets", () => {
  it("uses the first-party icon system and complete starter metadata", () => {
    for (const preset of HABIT_PRESETS) {
      expect(preset.icon).toEqual(expect.any(String));
      expect(preset.icon.length).toBeGreaterThan(0);
      expect(preset).not.toHaveProperty("emoji");
      expect(["morning", "anytime", "evening"]).toContain(preset.timeOfDay);
      expect(preset.tinyVersion.length).toBeGreaterThan(0);
    }
  });
});

describe("themes", () => {
  it("offers the approved daylight, night, and matcha choices", () => {
    expect(THEMES.map((theme) => theme.id)).toEqual([
      "garden-day",
      "garden-night",
      "matcha",
    ]);
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(THEMES.length);
  });
});
