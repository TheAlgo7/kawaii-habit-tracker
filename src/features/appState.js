import { normalizeHabit } from "./habits";
import { STORAGE_KEYS } from "./storage";

export const STATE_KEY = "kw_state_v2";
export const STATE_VERSION = 2;

const DEFAULT_CHAT = [
  { role: "assistant", content: "Nyaa~ I'm here. Tell me what kind of day we're growing today. 🌸" },
];

// A single versioned object replaces the old pile of unrelated localStorage keys.
// completions/skips/notes live on each habit (see normalizeHabit) rather than in
// separate maps, simpler for CRUD while keeping the same intent as the brief.
export function defaultState() {
  return {
    version: STATE_VERSION,
    profile: {
      userName: "",
      nekoName: "Neko-chan",
      worldName: "Kawaii",
      onboardedAt: null,
      createdAt: new Date().toISOString(),
    },
    preferences: {
      theme: "midnight-sakura",
      motion: "full",
      emotionalIntensity: "gentle",
      remindersEnabled: false,
      reminderStyle: "none",
    },
    habits: [],
    tasks: [],
    challenges: [],
    world: { lastGrowthEventAt: null, seenTrust: 0 },
    neko: { lastInteractionAt: null },
    chat: DEFAULT_CHAT,
  };
}

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Build a v2 state from the legacy v1 keys. Pure(ish): pass a getItem function so
// this is unit-testable without a real localStorage.
export function migrateLegacy(getItem) {
  const habits = safeParse(getItem(STORAGE_KEYS.habits), null);
  const tasks = safeParse(getItem(STORAGE_KEYS.tasks), null);
  const challenges = safeParse(getItem(STORAGE_KEYS.challenges), null);
  const chat = safeParse(getItem(STORAGE_KEYS.chat), null);
  const memory = safeParse(getItem(STORAGE_KEYS.name), null);
  const worldName = getItem(STORAGE_KEYS.worldName);
  const onboarded = getItem(STORAGE_KEYS.onboarded);

  const hasLegacy =
    habits || tasks || challenges || chat || memory || worldName || onboarded;
  if (!hasLegacy) return null;

  const state = defaultState();
  if (Array.isArray(habits)) state.habits = habits.map((h, i) => normalizeHabit(h, i));
  if (Array.isArray(tasks)) state.tasks = tasks;
  if (Array.isArray(challenges)) state.challenges = challenges;
  if (Array.isArray(chat) && chat.length) state.chat = chat;
  if (memory?.userName) state.profile.userName = memory.userName;
  if (worldName) state.profile.worldName = worldName.replace(/^"|"$/g, "");
  // Anyone with prior data has effectively used the app, don't force onboarding.
  state.profile.onboardedAt = onboarded || (state.habits.length ? state.profile.createdAt : null);
  return state;
}

// Re-normalise a loaded state so newly-added fields are always present.
export function hydrate(raw) {
  const base = defaultState();
  const state = { ...base, ...raw };
  state.version = STATE_VERSION;
  state.profile = { ...base.profile, ...(raw.profile || {}) };
  state.preferences = { ...base.preferences, ...(raw.preferences || {}) };
  state.world = { ...base.world, ...(raw.world || {}) };
  state.neko = { ...base.neko, ...(raw.neko || {}) };
  state.habits = Array.isArray(raw.habits) ? raw.habits.map((h, i) => normalizeHabit(h, i)) : [];
  state.tasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  state.challenges = Array.isArray(raw.challenges) ? raw.challenges : [];
  state.chat = Array.isArray(raw.chat) && raw.chat.length ? raw.chat : base.chat;
  return state;
}

export function loadAppState() {
  let stored = null;
  try {
    stored = localStorage.getItem(STATE_KEY);
  } catch {
    stored = null;
  }

  if (stored) {
    const parsed = safeParse(stored, null);
    if (parsed) return hydrate(parsed);
  }

  // No v2 state yet, try migrating from the v1 keys.
  let migrated = null;
  try {
    migrated = migrateLegacy((key) => localStorage.getItem(key));
  } catch {
    migrated = null;
  }
  if (migrated) {
    saveAppState(migrated);
    return migrated;
  }

  return defaultState();
}

export function saveAppState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // private mode / quota, nothing we can do, fail quietly.
  }
}

// Validate an imported blob before trusting it.
export function importState(json) {
  const parsed = typeof json === "string" ? safeParse(json, null) : json;
  if (!parsed || typeof parsed !== "object") throw new Error("Not valid backup data.");
  if (!Array.isArray(parsed.habits) && !parsed.profile) throw new Error("This doesn't look like a Kawaii Habits backup.");
  return hydrate(parsed);
}

export function exportState(state) {
  return JSON.stringify(state, null, 2);
}
