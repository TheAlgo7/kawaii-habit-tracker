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
    expect(state.preferences.theme).toBe("midnight-sakura");
    expect(state.profile.nekoName).toBe("Neko-chan");
    expect(state.habits[0].emoji).toBe("🌸");
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
  });
});
