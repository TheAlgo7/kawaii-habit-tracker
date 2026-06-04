import { today } from "./date";

export const HABIT_COLORS = ["#ff6fa8", "#b7a27d", "#b56cff", "#86d8a7", "#89c5ff", "#ffd166"];

export const seedHabits = [
  { id: 1, name: "Drink 8 glasses of water", emoji: "💧", color: "#ff6fa8", completedDates: [] },
  { id: 2, name: "Read for 20 mins", emoji: "📖", color: "#b7a27d", completedDates: [] },
  { id: 3, name: "Meditate for 10 mins", emoji: "🌸", color: "#b56cff", completedDates: [] },
];

export const seedTasks = [
  { id: 1, name: "Buy groceries", emoji: "🛒", category: "Personal", done: false },
  { id: 2, name: "Reply to emails", emoji: "✉️", category: "Work", done: false },
];

// Built as a function so the start date is always relative to the day the user
// first opens the app. A hardcoded startDate (e.g. "2026-03-01") drifts and
// renders as "Day 96/30", a stale-demo bug that makes the app look broken.
export function makeSeedChallenges() {
  return [
    { id: 1, name: "No junk food", emoji: "🥗", targetDays: 30, startDate: today(), completedDates: [] },
  ];
}
