import { daysBetween, today } from "./date";

export const moodAssets = {
  blissful: "/neko-cat-blissful.png",
  happy: "/neko-cat-happy.png",
  content: "/neko-cat-normal.png",
  sleepy: "/neko-cat-sleepy.png",
  sad: "/neko-cat-sad.png",
  lonely: "/neko-cat-sad.png",
};

export const moodLayout = {
  blissful: { "--neko-width": "258px", "--neko-y": "5px", "--neko-x": "0px" },
  happy: { "--neko-width": "238px", "--neko-y": "2px", "--neko-x": "0px" },
  content: { "--neko-width": "234px", "--neko-y": "0px", "--neko-x": "0px" },
  sleepy: { "--neko-width": "235px", "--neko-y": "0px", "--neko-x": "-1px" },
  sad: { "--neko-width": "268px", "--neko-y": "7px", "--neko-x": "0px" },
  lonely: { "--neko-width": "268px", "--neko-y": "7px", "--neko-x": "0px" },
};

export const moodMessages = {
  blissful: "Nyaa~ everything is glowing because of you.",
  happy: "You're doing great. Let's make today amazing.",
  content: "I'm here whenever you're ready for the next tiny step.",
  sleepy: "Soft start today? We can begin gently.",
  sad: "Even one small thing would make the world warmer.",
  lonely: "I saved your place. We can start again slowly.",
};

export function getMood(habits, todayStr) {
  const hour = new Date().getHours();
  const done = habits.filter((habit) => habit.completedDates.includes(todayStr)).length;
  const total = habits.length;
  const pct = total ? done / total : 0;

  if (pct >= 1 && total > 0) return "blissful";
  if (pct >= 0.67) return "happy";
  if (pct >= 0.34) return "content";
  if (hour < 9) return "sleepy";
  if (hour >= 20) return "lonely";
  return "content";
}

export function getLocalReply(message, habits, tasks, challenges, userName) {
  const lower = message.toLowerCase();
  const todayStr = today();
  const done = habits.filter((habit) => habit.completedDates.includes(todayStr)).length;
  const pending = tasks.filter((task) => !task.done).length;
  const name = userName ? `${userName}, ` : "";

  if (/plan|today|routine|schedule/.test(lower)) {
    return `${name}start with one easy care task, then one important task, then take a real break. Tiny steps still count. 🌸`;
  }

  if (/progress|habit|streak|check/.test(lower)) {
    return `${name}you have ${done}/${habits.length} care tasks done today and ${pending} task${pending === 1 ? "" : "s"} waiting. Keep it gentle. ✨`;
  }

  if (/challenge|goal|growth/.test(lower)) {
    if (!challenges.length) return "No active growth challenges yet. We can plant one when you're ready. 🌱";
    const lines = challenges.map((challenge) => {
      const elapsed = daysBetween(challenge.startDate, todayStr) + 1;
      return `${challenge.emoji} ${challenge.name}: day ${elapsed}/${challenge.targetDays}`;
    });
    return `Your growth garden:\n${lines.join("\n")}`;
  }

  if (/tired|sad|lazy|hard|difficult|motivat|encourage/.test(lower)) {
    return `${name}you don't have to become a new person today. Just choose the next kind thing and I'll cheer from here. 💗`;
  }

  return `${name}I'm listening. Want to plan the day, check progress, or pick one tiny task together? 🐱`;
}
