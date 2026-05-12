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

export const seedChallenges = [
  { id: 1, name: "No junk food", emoji: "🥗", targetDays: 30, startDate: "2026-03-01", completedDates: [] },
];
