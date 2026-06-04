// Dates are stored as plain local calendar keys ("YYYY-MM-DD"), never UTC.
// Using toISOString() would record an Asia/Kolkata early morning as the
// previous UTC day, so we read the user's *local* year/month/day instead.

function pad(value) {
  return String(value).padStart(2, "0");
}

// Turn a Date into a local calendar key using the device's own timezone.
export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function today() {
  return toDateKey(new Date());
}

// Shift a "YYYY-MM-DD" key by a number of days, staying on the calendar grid.
// We rebuild the Date from its parts so DST never nudges us a day off.
export function offsetDate(dateKey, offset) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return toDateKey(new Date(year, month - 1, day + offset));
}

// Whole-day difference between two calendar keys. Computed in UTC space so the
// result is the number of calendar days regardless of DST transitions.
export function daysBetween(start, end) {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  return Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86400000);
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
