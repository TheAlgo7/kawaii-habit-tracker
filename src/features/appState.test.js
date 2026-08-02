import { describe, expect, it } from "vitest";
import { defaultState, exportState, hydrate, importState, migrateLegacy } from "./appState";
import { STORAGE_KEYS } from "./storage";

function legacyGetter(map) {
  return (key) => (key in map ? map[key] : null);
}

describe("migrateLegacy", () => {
  it("returns null when there is no legacy data (fresh install)", () => {
    expect(migrateLegacy(legacyGetter({}))).toBeNull();
  });

  it("migrates v1 keys into a v2 state and normalises habits", () => {
    const state = migrateLegacy(
      legacyGetter({
        [STORAGE_KEYS.habits]: JSON.stringify([
          { id: 1, name: "Water", emoji: "💧", color: "#fff", completedDates: ["2026-06-01"] },
        ]),
        [STORAGE_KEYS.worldName]: "Sakura Town",
        [STORAGE_KEYS.name]: JSON.stringify({ userName: "Gaurav" }),
      }),
    );

    expect(state.version).toBe(2);
    expect(state.profile.userName).toBe("Gaurav");
    expect(state.profile.worldName).toBe("Sakura Town");
    expect(state.habits[0].tinyDates).toEqual([]);
    expect(state.habits[0].frequency.kind).toBe("daily");
    // Existing data means the user already used the app → don't re-onboard.
    expect(state.profile.onboardedAt).not.toBeNull();
  });
});

describe("hydrate", () => {
  it("fills missing fields on partial stored state", () => {
    const state = hydrate({ habits: [{ name: "Read" }] });
    expect(state.preferences.theme).toBe("garden-day");
    expect(state.profile.nekoName).toBe("Neko");
    expect(state.habits[0].icon).toBe("book");
    expect(state.habits[0].timeOfDay).toBe("anytime");
  });

  it.each([
    ["midnight-sakura", "garden-night"],
    ["kawaii", "garden-day"],
    ["sky", "garden-day"],
  ])("migrates the legacy %s theme to %s", (legacyTheme, expectedTheme) => {
    const state = hydrate({ preferences: { theme: legacyTheme } });
    expect(state.preferences.theme).toBe(expectedTheme);
  });

  it.each(["garden-day", "garden-night", "matcha"])(
    "keeps the current %s theme unchanged",
    (theme) => {
      const state = hydrate({ preferences: { theme } });
      expect(state.preferences.theme).toBe(theme);
    },
  );

  it("keeps legacy emoji data while assigning a first-party icon", () => {
    const state = hydrate({ habits: [{ name: "Drink water", emoji: "💧" }] });
    expect(state.habits[0]).toMatchObject({ icon: "water", emoji: "💧" });
  });

  it("normalises malformed task, goal, and chat slices without crashing", () => {
    const state = hydrate({
      tasks: [null, { name: "  Call home  ", done: 1 }],
      challenges: [{ name: "Fresh food", targetDays: "8" }, null],
      chat: [{ role: "assistant", content: "Welcome back" }, { role: "system", content: "ignore" }],
    });

    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0]).toMatchObject({ name: "Call home", done: true, icon: "task" });
    expect(state.challenges[0]).toMatchObject({ targetDays: 8, completedDates: [] });
    expect(state.challenges).toHaveLength(1);
    expect(state.chat).toEqual([{ role: "assistant", content: "Welcome back" }]);
  });

  it("falls back to Sunlit Garden for an unknown theme", () => {
    expect(hydrate({ preferences: { theme: "neon-rpg" } }).preferences.theme).toBe("garden-day");
  });
});

describe("export / import round-trip", () => {
  it("imports what it exports", () => {
    const original = defaultState();
    original.profile.userName = "Mochi";
    const restored = importState(exportState(original));
    expect(restored.profile.userName).toBe("Mochi");
  });

  it("rejects garbage", () => {
    expect(() => importState("not json")).toThrow();
    expect(() => importState({ nope: true })).toThrow();
    expect(() => importState({ version: 2, profile: {}, habits: [] })).toThrow();
  });
});
