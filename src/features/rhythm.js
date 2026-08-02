import { offsetDate } from "./date";
import { isScheduledOn } from "./habits";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const WEEKDAY_SHORT_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateParts(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return { year, month, day };
}

function asDateKey(value) {
  if (typeof value !== "string") return null;
  const key = value.slice(0, 10);
  return DATE_KEY_PATTERN.test(key) ? key : null;
}

function fieldHasDate(habit, field, dateKey) {
  return Array.isArray(habit?.[field]) && habit[field].includes(dateKey);
}

function objectHasDate(habit, field, dateKey) {
  return Boolean(habit?.[field] && Object.prototype.hasOwnProperty.call(habit[field], dateKey));
}

function hasRecordedActivity(habit, dateKey) {
  return (
    fieldHasDate(habit, "completedDates", dateKey) ||
    fieldHasDate(habit, "tinyDates", dateKey) ||
    objectHasDate(habit, "skipsByDate", dateKey) ||
    objectHasDate(habit, "notesByDate", dateKey)
  );
}

function firstRecordedDate(habit) {
  const dates = [
    ...(Array.isArray(habit?.completedDates) ? habit.completedDates : []),
    ...(Array.isArray(habit?.tinyDates) ? habit.tinyDates : []),
    ...Object.keys(habit?.skipsByDate || {}),
    ...Object.keys(habit?.notesByDate || {}),
  ].filter((date) => DATE_KEY_PATTERN.test(date));
  return dates.length ? dates.sort()[0] : null;
}

// Keep migrated history intact when createdAt was added after the habit itself.
function trackingStart(habit) {
  const created = asDateKey(habit?.createdAt);
  const recorded = firstRecordedDate(habit);
  if (!created) return recorded;
  if (!recorded) return created;
  return created < recorded ? created : recorded;
}

function isAvailableOn(habit, dateKey) {
  if (hasRecordedActivity(habit, dateKey)) return true;
  const start = trackingStart(habit);
  const archived = asDateKey(habit?.archivedAt);
  if (start && dateKey < start) return false;
  if (archived && dateKey > archived) return false;
  return true;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function weekdayOf(dateKey) {
  const { year, month, day } = dateParts(dateKey);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function summarizeHabitOnDate(habit, dateKey) {
  if (!isAvailableOn(habit, dateKey)) {
    return { available: false, scheduled: false, full: false, tiny: false, skipped: false, noted: false };
  }

  const full = fieldHasDate(habit, "completedDates", dateKey);
  const tiny = !full && fieldHasDate(habit, "tinyDates", dateKey);
  const skipped = !full && !tiny && objectHasDate(habit, "skipsByDate", dateKey);

  return {
    available: true,
    scheduled: isScheduledOn(habit, dateKey),
    full,
    tiny,
    skipped,
    noted: objectHasDate(habit, "notesByDate", dateKey),
  };
}

export function monthStart(todayStr) {
  const { year, month } = dateParts(todayStr);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function monthLabel(todayStr) {
  const { year, month } = dateParts(todayStr);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function dateLabel(dateKey, includeYear = false) {
  const { year, month, day } = dateParts(dateKey);
  const prefix = `${WEEKDAY_NAMES[weekdayOf(dateKey)]}, ${MONTH_NAMES[month - 1]} ${day}`;
  return includeYear ? `${prefix}, ${year}` : prefix;
}

export function getLastSevenDays(todayStr) {
  return Array.from({ length: 7 }, (_, index) => offsetDate(todayStr, index - 6));
}

export function summarizeDay(habits, dateKey) {
  const summary = {
    dateKey,
    weekdayIndex: weekdayOf(dateKey),
    fullCount: 0,
    tinyCount: 0,
    skippedCount: 0,
    noteCount: 0,
    scheduledCount: 0,
    scheduledSkippedCount: 0,
    opportunityCount: 0,
    completedScheduledCount: 0,
    completionCount: 0,
    completionPercent: 0,
    status: "open",
  };

  for (const habit of Array.isArray(habits) ? habits : []) {
    const state = summarizeHabitOnDate(habit, dateKey);
    if (!state.available) continue;
    if (state.scheduled) summary.scheduledCount += 1;
    if (state.full) summary.fullCount += 1;
    if (state.tiny) summary.tinyCount += 1;
    if (state.skipped) summary.skippedCount += 1;
    if (state.noted) summary.noteCount += 1;
    if (state.scheduled && (state.full || state.tiny)) summary.completedScheduledCount += 1;
    if (state.scheduled && state.skipped) summary.scheduledSkippedCount += 1;
  }

  summary.completionCount = summary.fullCount + summary.tinyCount;
  summary.opportunityCount = summary.scheduledCount - summary.scheduledSkippedCount;
  summary.completionPercent = summary.opportunityCount
    ? Math.round((summary.completedScheduledCount / summary.opportunityCount) * 100)
    : 0;

  if (summary.scheduledCount === 0) {
    summary.status = summary.completionCount > 0 ? "complete" : summary.skippedCount > 0 ? "rest" : "free";
  } else if (summary.completedScheduledCount === summary.scheduledCount) {
    summary.status = summary.fullCount === 0 && summary.tinyCount > 0 ? "tiny" : "complete";
  } else if (summary.scheduledSkippedCount === summary.scheduledCount && summary.completionCount === 0) {
    summary.status = "rest";
  } else if (summary.completedScheduledCount + summary.scheduledSkippedCount >= summary.scheduledCount) {
    summary.status = "settled";
  } else if (summary.completionCount > 0 || summary.skippedCount > 0) {
    summary.status = "partial";
  }

  return summary;
}

export function getWeeklyTotals(habits, todayStr) {
  const days = getLastSevenDays(todayStr).map((dateKey) => summarizeDay(habits, dateKey));
  const totals = days.reduce(
    (result, day) => ({
      fullCount: result.fullCount + day.fullCount,
      tinyCount: result.tinyCount + day.tinyCount,
      skippedCount: result.skippedCount + day.skippedCount,
      noteCount: result.noteCount + day.noteCount,
      scheduledCount: result.scheduledCount + day.scheduledCount,
      scheduledSkippedCount: result.scheduledSkippedCount + day.scheduledSkippedCount,
      opportunityCount: result.opportunityCount + day.opportunityCount,
      completedScheduledCount: result.completedScheduledCount + day.completedScheduledCount,
    }),
    {
      fullCount: 0,
      tinyCount: 0,
      skippedCount: 0,
      noteCount: 0,
      scheduledCount: 0,
      scheduledSkippedCount: 0,
      opportunityCount: 0,
      completedScheduledCount: 0,
    },
  );

  const completionCount = totals.fullCount + totals.tinyCount;
  const careDays = days.filter((day) => day.completionCount > 0).length;
  return {
    ...totals,
    days,
    startDate: days[0].dateKey,
    endDate: days[days.length - 1].dateKey,
    completionCount,
    careDays,
    completionPercent: totals.opportunityCount
      ? Math.round((totals.completedScheduledCount / totals.opportunityCount) * 100)
      : 0,
  };
}

export function getHabitCompletionStats(habit, startDate, endDate) {
  const stats = {
    startDate,
    endDate,
    fullCount: 0,
    tinyCount: 0,
    skippedCount: 0,
    noteCount: 0,
    scheduledCount: 0,
    completedCount: 0,
    completionPercent: 0,
  };

  if (!DATE_KEY_PATTERN.test(startDate) || !DATE_KEY_PATTERN.test(endDate) || startDate > endDate) return stats;

  let cursor = startDate;
  // The guard protects this pure helper from accidentally iterating forever on malformed input.
  for (let index = 0; cursor <= endDate && index < 3660; index += 1) {
    const state = summarizeHabitOnDate(habit, cursor);
    if (state.available) {
      if (state.full) stats.fullCount += 1;
      if (state.tiny) stats.tinyCount += 1;
      if (state.skipped) stats.skippedCount += 1;
      if (state.noted) stats.noteCount += 1;
      // Explicit rest is a protected day, not a failed opportunity.
      if (state.scheduled && !state.skipped) {
        stats.scheduledCount += 1;
        if (state.full || state.tiny) stats.completedCount += 1;
      }
    }
    cursor = offsetDate(cursor, 1);
  }

  stats.completionPercent = stats.scheduledCount
    ? Math.round((stats.completedCount / stats.scheduledCount) * 100)
    : 0;
  return stats;
}

export function getHabitCompletionPercent(habit, startDate, endDate) {
  return getHabitCompletionStats(habit, startDate, endDate).completionPercent;
}

function statusLabelForCell(cell) {
  if (cell.status === "upcoming") return "Upcoming";
  if (cell.status === "complete") return "Full";
  if (cell.status === "tiny") return "Tiny";
  if (cell.status === "settled") return "Cared";
  if (cell.status === "partial") return "Some";
  if (cell.status === "rest") return "Rest";
  if (cell.status === "free") return "Free";
  return "Open";
}

// Returns complete Sunday-to-Saturday rows. Padding cells have dateKey: null,
// letting the UI render a real calendar table without inventing adjacent-month data.
export function getMonthlyCells(habits, todayStr) {
  const { year, month } = dateParts(todayStr);
  const firstDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const leadingCount = weekdayOf(firstDate);
  const cells = Array.from({ length: leadingCount }, (_, index) => ({
    key: `before-${index}`,
    dateKey: null,
    inMonth: false,
  }));

  for (let dayNumber = 1; dayNumber <= daysInMonth(year, month); dayNumber += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    const summary = summarizeDay(habits, dateKey);
    const isFuture = dateKey > todayStr;
    const cell = {
      ...summary,
      key: dateKey,
      inMonth: true,
      dayNumber,
      isToday: dateKey === todayStr,
      isFuture,
      status: isFuture ? "upcoming" : summary.status,
    };
    cell.statusLabel = statusLabelForCell(cell);
    cells.push(cell);
  }

  const trailingCount = (7 - (cells.length % 7)) % 7;
  for (let index = 0; index < trailingCount; index += 1) {
    cells.push({ key: `after-${index}`, dateKey: null, inMonth: false });
  }
  return cells;
}

export function chunkCalendarWeeks(cells) {
  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return weeks;
}
