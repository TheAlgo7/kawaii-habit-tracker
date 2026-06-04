// Starter habits offered during onboarding. Each ships with a ready-made "tiny
// version" so a bad day still has a doable option, the core behaviour bet.
export const HABIT_PRESETS = [
  { name: "Drink water", emoji: "💧", color: "#89c5ff", category: "body", tinyVersion: "One glass of water" },
  { name: "Read", emoji: "📖", color: "#b7a27d", category: "mind", tinyVersion: "Read one page" },
  { name: "Move your body", emoji: "🤸", color: "#86d8a7", category: "body", tinyVersion: "Stretch for 1 minute" },
  { name: "Meditate", emoji: "🌸", color: "#b56cff", category: "mind", tinyVersion: "Three slow breaths" },
  { name: "Tidy up", emoji: "🧹", color: "#ffd166", category: "home", tinyVersion: "Put away one thing" },
  { name: "Journal", emoji: "✏️", color: "#ff6fa8", category: "mind", tinyVersion: "Write one line" },
  { name: "Sleep on time", emoji: "🌙", color: "#9aa7ff", category: "body", tinyVersion: "Phone down 5 min early" },
  { name: "Eat something fresh", emoji: "🥗", color: "#7fd1a0", category: "body", tinyVersion: "One piece of fruit" },
  { name: "Reach out", emoji: "💌", color: "#ff9bc4", category: "social", tinyVersion: "Send one kind message" },
  { name: "Walk", emoji: "🚶", color: "#86d8a7", category: "body", tinyVersion: "Walk to the door and back" },
];

export const THEMES = [
  { id: "midnight-sakura", name: "Midnight Sakura", swatch: "#ff6fa8" },
  { id: "kawaii", name: "Soft Kawaii", swatch: "#ffb3d1" },
  { id: "matcha", name: "Matcha", swatch: "#86d8a7" },
  { id: "sky", name: "Clear Sky", swatch: "#89c5ff" },
];

export const REMINDER_STYLES = [
  { id: "none", label: "No reminders", emoji: "🤫" },
  { id: "morning", label: "Gentle morning", emoji: "🌅" },
  { id: "evening", label: "Calm evening", emoji: "🌙" },
];
