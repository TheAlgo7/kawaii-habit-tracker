import { afterAll, beforeAll, describe, expect, it } from "vitest";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  chunkCalendarWeeks,
  getHabitCompletionPercent,
  getHabitCompletionStats,
  getLastSevenDays,
  getMonthlyCells,
  getWeeklyTotals,
  monthLabel,
  monthStart,
  summarizeDay,
} from "./rhythm";

function habit(overrides = {}) {
  return {
    id: overrides.id ?? 1,
    name: overrides.name ?? "Water",
    frequency: overrides.frequency ?? { kind: "daily", days: [0, 1, 2, 3, 4, 5, 6] },
    completedDates: [],
    tinyDates: [],
    skipsByDate: {},
    notesByDate: {},
    ...overrides,
  };
}

describe("rhythm helpers", () => {
  it("builds an oldest-to-newest seven-day window across month boundaries", () => {
    expect(getLastSevenDays("2026-03-02")).toEqual([
      "2026-02-24",
      "2026-02-25",
      "2026-02-26",
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });

  it("totals full, tiny, rest, and note activity without treating rest as failure", () => {
    const habits = [
      habit({
        id: 1,
        completedDates: ["2026-06-01", "2026-06-02"],
        tinyDates: ["2026-06-03"],
        skipsByDate: { "2026-06-04": "rest" },
        notesByDate: { "2026-06-02": "Felt easier today" },
      }),
      habit({
        id: 2,
        completedDates: ["2026-06-01"],
        tinyDates: ["2026-06-05"],
        skipsByDate: { "2026-06-06": "sick" },
        notesByDate: { "2026-06-05": "A short version" },
      }),
    ];

    const result = getWeeklyTotals(habits, "2026-06-07");

    expect(result.days).toHaveLength(7);
    expect(result.fullCount).toBe(3);
    expect(result.tinyCount).toBe(2);
    expect(result.skippedCount).toBe(2);
    expect(result.noteCount).toBe(2);
    expect(result.completionCount).toBe(5);
    expect(result.careDays).toBe(4);
    expect(result.opportunityCount).toBe(12);
    expect(result.completionPercent).toBe(42);
  });

  it("calculates a schedule-aware habit percentage and counts tiny versions", () => {
    const weekdays = habit({
      frequency: { kind: "weekdays", days: [1, 2, 3, 4, 5] },
      completedDates: ["2026-06-01"],
      tinyDates: ["2026-06-02"],
      skipsByDate: { "2026-06-03": "rest" },
      notesByDate: { "2026-06-02": "Kept it short" },
    });

    const stats = getHabitCompletionStats(weekdays, "2026-06-01", "2026-06-07");

    expect(stats).toMatchObject({
      fullCount: 1,
      tinyCount: 1,
      skippedCount: 1,
      noteCount: 1,
      scheduledCount: 4,
      completedCount: 2,
      completionPercent: 50,
    });
    expect(getHabitCompletionPercent(weekdays, "2026-06-01", "2026-06-07")).toBe(50);
  });

  it("uses completion, tiny, then rest precedence if stored data overlaps", () => {
    const overlapping = habit({
      completedDates: ["2026-06-01"],
      tinyDates: ["2026-06-01"],
      skipsByDate: { "2026-06-01": "rest" },
    });

    expect(summarizeDay([overlapping], "2026-06-01")).toMatchObject({
      fullCount: 1,
      tinyCount: 0,
      skippedCount: 0,
      completionCount: 1,
      status: "complete",
    });
  });

  it("builds complete calendar weeks with accessible, non-color status labels", () => {
    const habits = [
      habit({
        completedDates: ["2026-08-01"],
        tinyDates: ["2026-08-02"],
        skipsByDate: { "2026-08-03": "rest" },
        notesByDate: { "2026-08-02": "A quiet win" },
      }),
    ];

    const cells = getMonthlyCells(habits, "2026-08-02");
    const augustFirst = cells.find((cell) => cell.dateKey === "2026-08-01");
    const today = cells.find((cell) => cell.dateKey === "2026-08-02");
    const future = cells.find((cell) => cell.dateKey === "2026-08-03");

    expect(cells).toHaveLength(42);
    expect(cells.slice(0, 6).every((cell) => !cell.inMonth)).toBe(true);
    expect(augustFirst).toMatchObject({ dayNumber: 1, status: "complete", statusLabel: "Full" });
    expect(today).toMatchObject({ isToday: true, status: "tiny", statusLabel: "Tiny", noteCount: 1 });
    expect(future).toMatchObject({ isFuture: true, status: "upcoming", statusLabel: "Upcoming" });
    expect(chunkCalendarWeeks(cells)).toHaveLength(6);
    expect(chunkCalendarWeeks(cells).every((week) => week.length === 7)).toBe(true);
  });

  it("distinguishes full, cared-for, rest, partial, and open days in text", () => {
    const first = habit({
      id: 1,
      completedDates: ["2026-06-01", "2026-06-02", "2026-06-05"],
      skipsByDate: { "2026-06-03": "rest", "2026-06-04": "rest" },
    });
    const second = habit({
      id: 2,
      completedDates: ["2026-06-01"],
      skipsByDate: { "2026-06-02": "rest", "2026-06-03": "rest" },
    });

    expect(summarizeDay([first, second], "2026-06-01").status).toBe("complete");
    expect(summarizeDay([first, second], "2026-06-02").status).toBe("settled");
    expect(summarizeDay([first, second], "2026-06-03").status).toBe("rest");
    expect(summarizeDay([first, second], "2026-06-04").status).toBe("partial");
    expect(summarizeDay([first, second], "2026-06-06").status).toBe("open");
  });

  it("keeps migrated history that predates createdAt and stops scheduling after archive", () => {
    const archived = habit({
      createdAt: "2026-06-10T08:00:00.000Z",
      archivedAt: "2026-06-03T08:00:00.000Z",
      completedDates: ["2026-06-01"],
    });

    const stats = getHabitCompletionStats(archived, "2026-06-01", "2026-06-07");
    expect(stats.scheduledCount).toBe(3);
    expect(stats.completedCount).toBe(1);
  });

  it("exposes stable month labels and safely handles an empty list", () => {
    expect(monthStart("2026-08-02")).toBe("2026-08-01");
    expect(monthLabel("2026-08-02")).toBe("August 2026");
    expect(getWeeklyTotals(null, "2026-08-02")).toMatchObject({ completionCount: 0, careDays: 0 });
  });
});

describe("RhythmPanel", () => {
  let RhythmPanel;
  const previousReact = globalThis.React;

  beforeAll(async () => {
    // Vitest's Node transform uses the classic JSX runtime for imported JSX
    // files; the browser build uses Vite's automatic runtime.
    globalThis.React = React;
    ({ RhythmPanel } = await import("./RhythmPanel"));
  });

  afterAll(() => {
    if (previousReact === undefined) delete globalThis.React;
    else globalThis.React = previousReact;
  });

  it("renders a calm, actionable empty state", () => {
    const markup = renderToStaticMarkup(createElement(RhythmPanel, { habits: [], todayStr: "2026-08-02" }));

    expect(markup).toContain("A softer view of consistency");
    expect(markup).toContain("Your rhythm starts with one habit");
    expect(markup).not.toContain("<table");
  });

  it("renders labeled weekly, monthly, and per-habit history", () => {
    const markup = renderToStaticMarkup(createElement(RhythmPanel, {
      habits: [habit({ completedDates: ["2026-08-01"], tinyDates: ["2026-08-02"] })],
      todayStr: "2026-08-02",
      onEditHabit: () => {},
    }));

    expect(markup).toContain("aria-label=\"Daily activity for the last seven days\"");
    expect(markup).toContain("<table");
    expect(markup).toContain("August 2026 daily habit history");
    expect(markup).toContain("data-state=\"tiny\"");
    expect(markup).toContain("role=\"progressbar\"");
    expect(markup).toContain("Edit<span class=\"rhythm-habit__edit-name\"> Water</span>");
  });
});
