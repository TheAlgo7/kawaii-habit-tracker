export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function offsetDate(date, offset) {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next.toISOString().slice(0, 10);
}

export function daysBetween(start, end) {
  return Math.floor((new Date(end) - new Date(start)) / 86400000);
}

export function calcStreak(dates) {
  if (!dates?.length) return 0;

  const currentDay = today();
  const sorted = [...new Set(dates.filter((date) => date <= currentDay))].sort().reverse();
  let cursor = currentDay;
  let streak = 0;

  for (const date of sorted) {
    if (date !== cursor) break;
    streak += 1;
    cursor = offsetDate(cursor, -1);
  }

  return streak;
}

export function formatToday() {
  const now = new Date();
  return {
    weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
    date: now.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}
