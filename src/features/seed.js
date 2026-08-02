import { today } from "./date";

export const HABIT_COLORS = ["#c96648", "#81946f", "#87a8b5", "#a392ae", "#c99b62", "#b87568"];

export const seedHabits = [
  { id: 1, name: "Drink water", icon: "water", color: "#87a8b5", tinyVersion: "One glass is enough", timeOfDay: "morning", completedDates: [] },
  { id: 2, name: "Read for 10 minutes", icon: "book", color: "#c99b62", tinyVersion: "Read one page", timeOfDay: "evening", completedDates: [] },
  { id: 3, name: "Take a mindful pause", icon: "breathe", color: "#a392ae", tinyVersion: "Take three slow breaths", timeOfDay: "anytime", completedDates: [] },
];

export const seedTasks = [
  { id: 1, name: "Buy groceries", icon: "task", category: "Personal", done: false },
  { id: 2, name: "Reply to emails", icon: "journal", category: "Work", done: false },
];

// Built as a function so the start date is always relative to the day the user
// first opens the app. A hardcoded startDate (e.g. "2026-03-01") drifts and
// renders as "Day 96/30", a stale-demo bug that makes the app look broken.
export function makeSeedChallenges() {
  return [
    { id: 1, name: "Eat something fresh", icon: "plant", targetDays: 30, startDate: today(), completedDates: [] },
  ];
}
