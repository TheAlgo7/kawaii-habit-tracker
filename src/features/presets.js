// Starter habits offered during onboarding. Each ships with a ready-made "tiny
// version" so a bad day still has a doable option, the core behaviour bet.
export const HABIT_PRESETS = [
  { name: "Drink water", icon: "water", color: "#87b6c5", category: "body", timeOfDay: "morning", tinyVersion: "One glass is enough" },
  { name: "Read", icon: "book", color: "#d6ad72", category: "mind", timeOfDay: "evening", tinyVersion: "Read one page" },
  { name: "Move your body", icon: "stretch", color: "#9ba984", category: "body", timeOfDay: "anytime", tinyVersion: "Stretch for one minute" },
  { name: "Meditate", icon: "breathe", color: "#a99bbb", category: "mind", timeOfDay: "morning", tinyVersion: "Take three slow breaths" },
  { name: "Tidy up", icon: "home", color: "#d8b16b", category: "home", timeOfDay: "evening", tinyVersion: "Put away one thing" },
  { name: "Journal", icon: "journal", color: "#c97b65", category: "mind", timeOfDay: "evening", tinyVersion: "Write one honest line" },
  { name: "Sleep on time", icon: "moon", color: "#7f7f9f", category: "body", timeOfDay: "evening", tinyVersion: "Put your phone down five minutes early" },
  { name: "Eat something fresh", icon: "plant", color: "#91ad83", category: "body", timeOfDay: "anytime", tinyVersion: "Have one piece of fruit" },
  { name: "Reach out", icon: "heart", color: "#c78379", category: "social", timeOfDay: "anytime", tinyVersion: "Send one kind message" },
  { name: "Walk", icon: "stretch", color: "#8fae8b", category: "body", timeOfDay: "anytime", tinyVersion: "Walk to the door and back" },
];

export const THEMES = [
  { id: "garden-day", name: "Sunlit Garden", swatch: "#e47a55", description: "Warm paper, morning light, and botanical greens" },
  { id: "garden-night", name: "Moonlit Nook", swatch: "#4a3a55", description: "Aubergine paper, lantern glow, and quiet moonlight" },
  { id: "matcha", name: "Matcha Study", swatch: "#82956f", description: "A calmer green variation of the daylight garden" },
];
