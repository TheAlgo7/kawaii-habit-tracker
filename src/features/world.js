import { daysBetween, offsetDate } from "./date";

// Decor unlocks as a gentle consequence of showing up, not a shop, not an
// economy. Everything is derived from real completion history, so the world can
// never disagree with what the user actually did. unlockAt is a "trust" cost.
export const DECOR = [
  { id: "sprout", emoji: "🌱", name: "First sprout", unlockAt: 0 },
  { id: "sakura", emoji: "🌸", name: "Sakura bud", unlockAt: 4 },
  { id: "lamp", emoji: "💡", name: "Warm lamp", unlockAt: 8 },
  { id: "books", emoji: "📚", name: "Tiny library", unlockAt: 14 },
  { id: "plant", emoji: "🪴", name: "Potted plant", unlockAt: 20 },
  { id: "music", emoji: "🎵", name: "Soft music", unlockAt: 28 },
  { id: "tulips", emoji: "🌷", name: "Tulip patch", unlockAt: 36 },
  { id: "butterfly", emoji: "🦋", name: "Butterfly", unlockAt: 46 },
  { id: "lantern", emoji: "🏮", name: "Paper lantern", unlockAt: 58 },
  { id: "moon", emoji: "🌙", name: "Moonlight", unlockAt: 72 },
  { id: "tea", emoji: "🍵", name: "Tea corner", unlockAt: 88 },
  { id: "tree", emoji: "🌳", name: "Little tree", unlockAt: 106 },
  { id: "shrine", emoji: "⛩️", name: "Tiny shrine", unlockAt: 126 },
  { id: "rainbow", emoji: "🌈", name: "Rainbow", unlockAt: 148 },
  { id: "stars", emoji: "✨", name: "Stardust", unlockAt: 172 },
  { id: "home", emoji: "🏡", name: "Cozy home", unlockAt: 200 },
];

const LEVELS = [
  { level: 1, at: 0, title: "Seedling" },
  { level: 2, at: 8, title: "Sprout" },
  { level: 3, at: 20, title: "Bud" },
  { level: 4, at: 40, title: "Bloom" },
  { level: 5, at: 70, title: "Garden" },
  { level: 6, at: 110, title: "Grove" },
  { level: 7, at: 160, title: "Meadow" },
  { level: 8, at: 220, title: "Sanctuary" },
];

// A full completion is worth a little more than a tiny one, but tiny still grows
// the world, that's the whole gentle promise.
const FULL_POINTS = 2;
const TINY_POINTS = 1;

export function computeTrust(habits) {
  let trust = 0;
  for (const habit of habits) {
    trust += (habit.completedDates?.length || 0) * FULL_POINTS;
    trust += (habit.tinyDates?.length || 0) * TINY_POINTS;
  }
  return trust;
}

// Warmth = how alive the world feels right now, from the last 7 days of care.
// Drives the glow; decays naturally as activity fades, recovers as you return.
export function computeWarmth(habits, todayStr) {
  const weekAgo = offsetDate(todayStr, -6);
  let recent = 0;
  for (const habit of habits) {
    for (const d of habit.completedDates || []) {
      if (d >= weekAgo && d <= todayStr) recent += FULL_POINTS;
    }
    for (const d of habit.tinyDates || []) {
      if (d >= weekAgo && d <= todayStr) recent += TINY_POINTS;
    }
  }
  return Math.min(100, recent * 7);
}

export function levelForTrust(trust) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) if (trust >= lvl.at) current = lvl;
  return current;
}

export function nextLevel(trust) {
  return LEVELS.find((lvl) => lvl.at > trust) || null;
}

export function unlockedDecor(trust) {
  return DECOR.filter((item) => trust >= item.unlockAt);
}

export function nextDecor(trust) {
  return DECOR.find((item) => item.unlockAt > trust) || null;
}

// Single call the UI uses to render the world.
export function computeWorld(habits, todayStr) {
  const trust = computeTrust(habits);
  const warmth = computeWarmth(habits, todayStr);
  const level = levelForTrust(trust);
  const next = nextLevel(trust);
  const unlocked = unlockedDecor(trust);
  const upcoming = nextDecor(trust);

  const span = next ? next.at - level.at : 1;
  const into = trust - level.at;
  const levelProgress = next ? Math.min(100, Math.round((into / span) * 100)) : 100;

  return {
    trust,
    warmth,
    level: level.level,
    levelTitle: level.title,
    nextLevelTitle: next?.title || null,
    levelProgress,
    trustToNextLevel: next ? next.at - trust : 0,
    unlocked,
    nextDecor: upcoming,
    trustToNextDecor: upcoming ? upcoming.unlockAt - trust : 0,
  };
}

// Days since the last completion of any habit, for gentle "world is resting" copy.
export function daysSinceLastCare(habits, todayStr) {
  let latest = null;
  for (const habit of habits) {
    for (const d of [...(habit.completedDates || []), ...(habit.tinyDates || [])]) {
      if (latest === null || d > latest) latest = d;
    }
  }
  if (latest === null) return null;
  return daysBetween(latest, todayStr);
}
