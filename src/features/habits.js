import { offsetDate } from "./date";

// Categories keep habits organised without forcing a taxonomy on the user.
export const HABIT_CATEGORIES = ["mind", "body", "home", "study", "work", "social", "custom"];

export const SKIP_REASONS = [
  { id: "rest", label: "Rest day", icon: "rest" },
  { id: "sick", label: "Sick day", icon: "heart" },
  { id: "travel", label: "Travel", icon: "arrowRight" },
  { id: "toomuch", label: "Too much today", icon: "leaf" },
];

const ICON_HINTS = [
  [/water|hydrate|drink/, "water"],
  [/read|book|study|learn/, "book"],
  [/stretch|move|walk|run|exercise|workout|yoga/, "stretch"],
  [/sleep|bed|night|phone down/, "moon"],
  [/meditat|breath|mindful/, "breathe"],
  [/journal|write|reflect/, "journal"],
  [/tidy|clean|home|room/, "home"],
  [/plant|garden|fresh|food|fruit/, "plant"],
  [/friend|call|message|reach|social/, "heart"],
  [/music/, "music"],
];

export function inferHabitIcon(raw = {}) {
  if (raw.icon) return raw.icon;
  const haystack = `${raw.name || ""} ${raw.tinyVersion || ""}`.toLowerCase();
  const hinted = ICON_HINTS.find(([pattern]) => pattern.test(haystack));
  if (hinted) return hinted[1];
  return {
    mind: "breathe",
    body: "stretch",
    home: "home",
    study: "book",
    work: "task",
    social: "heart",
    custom: "flower",
  }[raw.category] || "flower";
}

// One shape for habits everywhere. New fields default gently so old data and
// quick-added habits still behave. completedDates = full completions; tinyDates
// = "tiny version" completions that still count but are marked as gentle wins.
export function normalizeHabit(raw, index = 0) {
  return {
    id: raw.id ?? Date.now() + index,
    name: raw.name ?? "Untitled",
    icon: inferHabitIcon(raw),
    emoji: raw.emoji || "",
    color: raw.color || "#c96648",
    type: raw.type || "build",
    frequency: normalizeFrequency(raw.frequency),
    tinyVersion: raw.tinyVersion || "",
    category: HABIT_CATEGORIES.includes(raw.category) ? raw.category : "custom",
    timeOfDay: ["morning", "anytime", "evening"].includes(raw.timeOfDay) ? raw.timeOfDay : "anytime",
    difficulty: raw.difficulty || "tiny",
    reminder: raw.reminder || "none",
    createdAt: raw.createdAt || new Date().toISOString(),
    archivedAt: raw.archivedAt || null,
    order: typeof raw.order === "number" ? raw.order : index,
    completedDates: Array.isArray(raw.completedDates) ? raw.completedDates : [],
    tinyDates: Array.isArray(raw.tinyDates) ? raw.tinyDates : [],
    notesByDate: raw.notesByDate && typeof raw.notesByDate === "object" ? raw.notesByDate : {},
    skipsByDate: raw.skipsByDate && typeof raw.skipsByDate === "object" ? raw.skipsByDate : {},
  };
}

export function normalizeFrequency(frequency) {
  if (!frequency || typeof frequency === "string") {
    return { kind: "daily", days: [0, 1, 2, 3, 4, 5, 6] };
  }
  const kind = ["daily", "weekdays", "days"].includes(frequency.kind) ? frequency.kind : "daily";
  if (kind === "daily") return { kind, days: [0, 1, 2, 3, 4, 5, 6] };
  if (kind === "weekdays") return { kind, days: [1, 2, 3, 4, 5] };
  const days = Array.isArray(frequency.days) && frequency.days.length ? frequency.days : [1, 2, 3, 4, 5];
  return { kind: "days", days };
}

export function frequencyLabel(frequency) {
  const f = normalizeFrequency(frequency);
  if (f.kind === "daily") return "Every day";
  if (f.kind === "weekdays") return "Weekdays";
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return f.days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => names[d])
    .join(" ");
}

function weekdayOf(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function isScheduledOn(habit, dateKey) {
  const f = normalizeFrequency(habit.frequency);
  if (f.kind === "daily") return true;
  return f.days.includes(weekdayOf(dateKey));
}

export function isDoneOn(habit, dateKey) {
  return habit.completedDates.includes(dateKey) || habit.tinyDates.includes(dateKey);
}

export function isSkippedOn(habit, dateKey) {
  return Boolean(habit.skipsByDate?.[dateKey]);
}

// Status for a habit row on a given day.
export function habitStatus(habit, dateKey) {
  if (habit.completedDates.includes(dateKey)) return "done";
  if (habit.tinyDates.includes(dateKey)) return "tiny";
  if (isSkippedOn(habit, dateKey)) return "skipped";
  if (!isScheduledOn(habit, dateKey)) return "off";
  return "due";
}

function completionUnion(habit) {
  return new Set([...habit.completedDates, ...habit.tinyDates]);
}

// A gentle, schedule-aware streak: unscheduled days and explicit skips/rest days
// never break it, and today being not-yet-done doesn't break it either.
export function habitStreak(habit, todayStr) {
  const done = completionUnion(habit);
  let cursor = todayStr;
  let streak = 0;
  for (let i = 0; i < 730; i += 1) {
    if (done.has(cursor)) {
      streak += 1;
    } else if (isScheduledOn(habit, cursor) && !isSkippedOn(habit, cursor)) {
      if (cursor !== todayStr) break; // a real miss on a scheduled day ends it
    }
    cursor = offsetDate(cursor, -1);
  }
  return streak;
}

// Toggle full completion for a day (also clears tiny + skip for that day).
export function toggleComplete(habit, dateKey) {
  const has = habit.completedDates.includes(dateKey);
  const skips = { ...habit.skipsByDate };
  delete skips[dateKey];
  return {
    ...habit,
    completedDates: has
      ? habit.completedDates.filter((d) => d !== dateKey)
      : [...habit.completedDates, dateKey],
    tinyDates: habit.tinyDates.filter((d) => d !== dateKey),
    skipsByDate: skips,
  };
}

// Mark the "tiny version" done, counts as a gentle win, mutually exclusive with full.
export function toggleTiny(habit, dateKey) {
  const has = habit.tinyDates.includes(dateKey);
  const skips = { ...habit.skipsByDate };
  delete skips[dateKey];
  return {
    ...habit,
    tinyDates: has
      ? habit.tinyDates.filter((d) => d !== dateKey)
      : [...habit.tinyDates, dateKey],
    completedDates: habit.completedDates.filter((d) => d !== dateKey),
    skipsByDate: skips,
  };
}

// Record a skip/rest day with a reason; clears any completion for that day.
export function setSkip(habit, dateKey, reason) {
  return {
    ...habit,
    completedDates: habit.completedDates.filter((d) => d !== dateKey),
    tinyDates: habit.tinyDates.filter((d) => d !== dateKey),
    skipsByDate: { ...habit.skipsByDate, [dateKey]: reason },
  };
}

export function setNote(habit, dateKey, note) {
  const notes = { ...habit.notesByDate };
  if (note && note.trim()) notes[dateKey] = note.trim();
  else delete notes[dateKey];
  return { ...habit, notesByDate: notes };
}
