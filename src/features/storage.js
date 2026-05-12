export const STORAGE_KEYS = {
  habits: "kw_habits",
  tasks: "kw_todos",
  challenges: "kw_challenges",
  chat: "kw_nekoMessages",
  name: "kw_nekoMemory",
  worldName: "kw_worldName",
  onboarded: "kw_onboarded",
};

export function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail in private mode or when quota is exceeded.
  }
}
