import { daysBetween, today } from "./date";

export const moodAssets = {
  blissful: "/neko-cat-blissful.webp",
  happy: "/neko-cat-happy.webp",
  content: "/neko-cat-normal.webp",
  welcome: "/neko-cat-happy.webp",
  recovered: "/neko-cat-happy.webp",
  sleepy: "/neko-cat-sleepy.webp",
  sad: "/neko-cat-sad.webp",
  lonely: "/neko-cat-sad.webp",
};

export const moodLayout = {
  blissful: { "--neko-width": "258px", "--neko-y": "5px", "--neko-x": "0px" },
  happy: { "--neko-width": "238px", "--neko-y": "2px", "--neko-x": "0px" },
  content: { "--neko-width": "234px", "--neko-y": "0px", "--neko-x": "0px" },
  welcome: { "--neko-width": "238px", "--neko-y": "2px", "--neko-x": "0px" },
  recovered: { "--neko-width": "238px", "--neko-y": "2px", "--neko-x": "0px" },
  sleepy: { "--neko-width": "235px", "--neko-y": "0px", "--neko-x": "-1px" },
  sad: { "--neko-width": "268px", "--neko-y": "7px", "--neko-x": "0px" },
  lonely: { "--neko-width": "268px", "--neko-y": "7px", "--neko-x": "0px" },
};

export const moodMessages = {
  blissful: "Your care is making this little place glow.",
  happy: "A gentle rhythm is taking root.",
  content: "I’m here when you’re ready for one small step.",
  welcome: "Choose one tiny thing and we’ll grow from there.",
  recovered: "You came back, and that's the part that matters. Let's start gently.",
  sleepy: "A quiet start is still a start.",
  sad: "One small act of care is enough for today.",
  lonely: "Your place is still here. Begin again whenever you’re ready.",
};

export function isCrisisMessage(message) {
  return /\b(suicid(?:e|al)|kill myself|end my life|hurt myself|self[- ]?harm|harm someone|kill someone)\b/i.test(
    String(message || ""),
  );
}

// Find the most recent day (before today) on which any habit was completed.
// This is how we tell a brand-new user apart from someone returning after a gap.
function lastActiveDayBefore(habits, todayStr) {
  let latest = null;
  for (const habit of habits) {
    for (const date of [...(habit.completedDates || []), ...(habit.tinyDates || [])]) {
      if (date < todayStr && (latest === null || date > latest)) latest = date;
    }
  }
  return latest;
}

function doneOn(habit, day) {
  return (habit.completedDates || []).includes(day) || (habit.tinyDates || []).includes(day);
}

// Mood is a lifecycle signal, never a punishment. A new user (no history at all)
// must never meet a sad or lonely Neko, sadness is reserved for an established
// relationship that has actually lapsed, and even then the copy is recovery-first.
export function getMood(habits, todayStr) {
  const hour = new Date().getHours();
  const total = habits.length;
  const done = habits.filter((habit) => doneOn(habit, todayStr)).length;
  const pct = total ? done / total : 0;

  // Doing well today always wins, regardless of past history.
  if (total > 0 && pct >= 1) return "blissful";
  if (pct >= 0.67) return "happy";
  if (pct >= 0.34) return "content";

  const lastActive = lastActiveDayBefore(habits, todayStr);

  // No relationship yet → only ever warm/neutral moods. But if they've already
  // done their first tiny thing today, celebrate it, the first win should land.
  if (lastActive === null) {
    if (done > 0) return "happy";
    if (hour < 9) return "sleepy";
    return "welcome";
  }

  const gap = daysBetween(lastActive, todayStr);

  // Returned today after a real break → celebrate the comeback, don't guilt.
  if (done > 0 && gap >= 2) return "recovered";

  // Established relationship with an open gap → gentle, recovery-focused only.
  if (gap >= 3) return "lonely";
  if (gap >= 2) return "sad";

  if (hour < 9) return "sleepy";
  return "content";
}

export function getLocalReply(message, habits, tasks, challenges, userName) {
  const lower = message.toLowerCase();
  const todayStr = today();
  const done = habits.filter((habit) => doneOn(habit, todayStr)).length;
  const pending = tasks.filter((task) => !task.done).length;
  const name = userName ? `${userName}, ` : "";

  if (isCrisisMessage(message)) {
    return "I’m really glad you said something. Please contact local emergency services or a crisis line now, and reach out to someone you trust who can stay with you. You deserve immediate, real-world support.";
  }

  if (/miss|back|recover|restart|gone|away|fell off/.test(lower)) {
    return `${name}coming back is the whole win. Choose the tiniest version of one ritual and begin there.`;
  }

  if (/celebrate|win|proud|did it|done|yay|finished/.test(lower)) {
    return done > 0
      ? `${name}${done} care ritual${done === 1 ? " is" : "s are"} complete today. Your garden is warmer because of it.`
      : `${name}one tiny thing is enough to make a win worth noticing.`;
  }

  if (/easier|easy|tiny|smaller|too much|overwhelm|stuck|hard|difficult/.test(lower)) {
    return `${name}let’s shrink it. What is the two-minute version of the next ritual? Tiny still counts.`;
  }

  if (/plan|today|routine|schedule/.test(lower)) {
    return `${name}start with one easy care ritual, then one important task, then take a real break.`;
  }

  if (/progress|habit|streak|check/.test(lower)) {
    return `${name}you have ${done} of ${habits.length} care ritual${habits.length === 1 ? "" : "s"} complete and ${pending} to-do${pending === 1 ? "" : "s"} waiting. Keep it gentle.`;
  }

  if (/challenge|goal|growth/.test(lower)) {
    const live = challenges.filter((challenge) => !challenge.archivedAt);
    if (!live.length) return "No active longer goals yet. We can plant one when you’re ready.";
    const lines = live.map((challenge) => {
      // Real check-ins, matching the World screen, not calendar days.
      const doneDays = (challenge.completedDates || []).length;
      return `${challenge.name}: ${doneDays}/${challenge.targetDays} care days`;
    });
    return `Your growth garden:\n${lines.join("\n")}`;
  }

  if (/tired|sad|lazy|hard|difficult|motivat|encourage/.test(lower)) {
    return `${name}you don’t have to become a new person today. Choose the next kind thing and begin there.`;
  }

  return `${name}I’m listening. We can plan the day, check your rhythm, or choose one tiny action together.`;
}
