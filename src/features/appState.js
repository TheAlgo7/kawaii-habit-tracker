import { normalizeHabit } from "./habits";
import { STORAGE_KEYS } from "./storage";

export const STATE_KEY = "kw_state_v2";
export const STATE_VERSION = 2;

const DEFAULT_CHAT = [
  { id: "chat-welcome", role: "assistant", content: "I’m here. Tell me what kind of day you have, and we’ll choose one gentle next step." },
];

const CURRENT_THEMES = new Set(["garden-day", "garden-night", "matcha"]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeTask(raw, index = 0) {
  const task = isRecord(raw) ? raw : {};
  return {
    id: task.id ?? `task-${Date.now()}-${index}`,
    name: typeof task.name === "string" && task.name.trim() ? task.name.trim() : "Untitled to-do",
    icon: typeof task.icon === "string" ? task.icon : "task",
    category: typeof task.category === "string" ? task.category : "Personal",
    done: Boolean(task.done),
    archivedAt: typeof task.archivedAt === "string" ? task.archivedAt : null,
  };
}

function normalizeChallenge(raw, index = 0) {
  const challenge = isRecord(raw) ? raw : {};
  const targetDays = Number(challenge.targetDays);
  return {
    id: challenge.id ?? `goal-${Date.now()}-${index}`,
    name: typeof challenge.name === "string" && challenge.name.trim() ? challenge.name.trim() : "Untitled goal",
    icon: typeof challenge.icon === "string" ? challenge.icon : "plant",
    targetDays: Number.isFinite(targetDays) && targetDays > 0 ? Math.round(targetDays) : 30,
    startDate: typeof challenge.startDate === "string" ? challenge.startDate : null,
    completedDates: Array.isArray(challenge.completedDates)
      ? [...new Set(challenge.completedDates.filter((date) => typeof date === "string"))]
      : [],
    archivedAt: typeof challenge.archivedAt === "string" ? challenge.archivedAt : null,
  };
}

function normalizeChat(raw) {
  if (!Array.isArray(raw)) return DEFAULT_CHAT;
  const messages = raw
    .filter((message) => isRecord(message) && ["assistant", "user"].includes(message.role) && typeof message.content === "string")
    .map((message, index) => ({
      id: typeof message.id === "string" && message.id ? message.id : `chat-legacy-${index}`,
      role: message.role,
      content: message.content.slice(0, 4000),
    }))
    .slice(-40);
  return messages.length ? messages : DEFAULT_CHAT;
}

// A single versioned object replaces the old pile of unrelated localStorage keys.
// completions/skips/notes live on each habit (see normalizeHabit) rather than in
// separate maps, simpler for CRUD while keeping the same intent as the brief.
export function defaultState() {
  return {
    version: STATE_VERSION,
    profile: {
      userName: "",
      nekoName: "Neko",
      worldName: "Mori Garden",
      onboardedAt: null,
      createdAt: new Date().toISOString(),
    },
    preferences: {
      theme: "garden-day",
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
  if (Array.isArray(tasks)) state.tasks = tasks.filter(isRecord).map(normalizeTask);
  if (Array.isArray(challenges)) state.challenges = challenges.filter(isRecord).map(normalizeChallenge);
  if (Array.isArray(chat) && chat.length) state.chat = normalizeChat(chat);
  if (memory?.userName) state.profile.userName = memory.userName;
  if (worldName) state.profile.worldName = worldName.replace(/^"|"$/g, "");
  // Anyone with prior data has effectively used the app, don't force onboarding.
  state.profile.onboardedAt = onboarded || (state.habits.length ? state.profile.createdAt : null);
  return state;
}

// Re-normalise a loaded state so newly-added fields are always present.
export function hydrate(raw) {
  const source = isRecord(raw) ? raw : {};
  const base = defaultState();
  const state = { ...base, ...source };
  state.version = STATE_VERSION;
  state.profile = { ...base.profile, ...(isRecord(source.profile) ? source.profile : {}) };
  state.profile.userName = typeof state.profile.userName === "string" ? state.profile.userName : "";
  state.profile.nekoName = typeof state.profile.nekoName === "string" && state.profile.nekoName.trim() ? state.profile.nekoName : "Neko";
  state.profile.worldName = typeof state.profile.worldName === "string" && state.profile.worldName.trim() ? state.profile.worldName : "Mori Garden";
  state.preferences = { ...base.preferences, ...(isRecord(source.preferences) ? source.preferences : {}) };
  state.preferences.theme = {
    "midnight-sakura": "garden-night",
    kawaii: "garden-day",
    sky: "garden-day",
  }[state.preferences.theme] || state.preferences.theme;
  if (!CURRENT_THEMES.has(state.preferences.theme)) state.preferences.theme = base.preferences.theme;
  state.world = { ...base.world, ...(isRecord(source.world) ? source.world : {}) };
  state.neko = { ...base.neko, ...(isRecord(source.neko) ? source.neko : {}) };
  state.habits = Array.isArray(source.habits)
    ? source.habits.filter(isRecord).map((habit, index) => normalizeHabit(habit, index))
    : [];
  state.tasks = Array.isArray(source.tasks) ? source.tasks.filter(isRecord).map(normalizeTask) : [];
  state.challenges = Array.isArray(source.challenges) ? source.challenges.filter(isRecord).map(normalizeChallenge) : [];
  state.chat = normalizeChat(source.chat);
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
  if (!isRecord(parsed)) throw new Error("Not valid backup data.");
  const knownVersion = Number.isInteger(parsed.version) && parsed.version >= 1 && parsed.version <= STATE_VERSION;
  const completeShape = isRecord(parsed.profile)
    && Array.isArray(parsed.habits)
    && Array.isArray(parsed.tasks)
    && Array.isArray(parsed.challenges);
  if (!knownVersion || !completeShape) throw new Error("This doesn't look like a Kawaii Habits backup.");
  return hydrate(parsed);
}

export function exportState(state) {
  return JSON.stringify(state, null, 2);
}
