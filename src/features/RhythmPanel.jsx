import React from "react";
import { KawaiiIcon } from "../components/KawaiiIcon.jsx";
import {
  WEEKDAY_SHORT_NAMES,
  chunkCalendarWeeks,
  dateLabel,
  getHabitCompletionStats,
  getMonthlyCells,
  getWeeklyTotals,
  monthLabel,
  monthStart,
} from "./rhythm";

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function compactDate(dateKey) {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${month}/${day}`;
}

function dayDescription(day) {
  const parts = [];
  if (day.fullCount) parts.push(plural(day.fullCount, "full step"));
  if (day.tinyCount) parts.push(plural(day.tinyCount, "tiny step"));
  if (day.skippedCount) parts.push(plural(day.skippedCount, "rest day"));
  if (day.noteCount) parts.push(plural(day.noteCount, "note"));
  if (parts.length) return parts.join(", ");
  return day.scheduledCount ? "No check-ins yet" : "No habits scheduled";
}

function cellDescription(cell) {
  const details = [cell.statusLabel];
  if (cell.fullCount) details.push(plural(cell.fullCount, "full step"));
  if (cell.tinyCount) details.push(plural(cell.tinyCount, "tiny step"));
  if (cell.skippedCount) details.push(plural(cell.skippedCount, "rest day"));
  if (cell.noteCount) details.push(plural(cell.noteCount, "note"));
  return `${dateLabel(cell.dateKey, true)}${cell.isToday ? ", today" : ""}: ${details.join(", ")}`;
}

function habitInitial(name) {
  const first = String(name || "Habit").trim().charAt(0);
  return first ? first.toLocaleUpperCase() : "H";
}

function dayStatusLabel(status) {
  return {
    complete: "Full",
    tiny: "Tiny",
    settled: "Cared",
    partial: "Some",
    rest: "Rest",
    free: "Free",
    open: "Open",
  }[status] || "Open";
}

export function RhythmPanel({ habits = [], todayStr, onEditHabit }) {
  const safeHabits = Array.isArray(habits) ? habits : [];
  const weekly = getWeeklyTotals(safeHabits, todayStr);
  const cells = getMonthlyCells(safeHabits, todayStr);
  const weeks = chunkCalendarWeeks(cells);
  const currentMonthStart = monthStart(todayStr);
  const monthName = monthLabel(todayStr);
  const habitRows = safeHabits
    .map((habit) => ({ habit, stats: getHabitCompletionStats(habit, currentMonthStart, todayStr) }))
    .filter(({ habit, stats }) => {
      const recorded = stats.fullCount + stats.tinyCount + stats.skippedCount + stats.noteCount;
      return !habit.archivedAt || stats.scheduledCount > 0 || recorded > 0;
    })
    .sort((left, right) => (left.habit.order ?? 0) - (right.habit.order ?? 0));

  return (
    <div className="rhythm-panel">
      <header className="rhythm-hero">
        <p className="rhythm-hero__eyebrow"><KawaiiIcon name="rhythm" size={18} />Rhythm</p>
        <h2 className="rhythm-hero__title">A softer view of consistency.</h2>
        <p className="rhythm-hero__copy">
          Full steps, tiny versions, rest days, and notes all stay part of your story.
        </p>
      </header>

      {safeHabits.length === 0 ? (
        <section className="rhythm-empty" aria-labelledby="rhythm-empty-title">
          <span className="rhythm-empty__mark" aria-hidden="true"><KawaiiIcon name="rhythm" size={28} /></span>
          <div>
            <h2 id="rhythm-empty-title">Your rhythm starts with one habit</h2>
            <p>Add a habit on Today. Your first check-in will begin a seven-day rhythm and monthly trail.</p>
          </div>
        </section>
      ) : (
        <>
          <section className="rhythm-summary" aria-labelledby="rhythm-summary-title">
            <div className="rhythm-section-heading">
              <div>
                <p className="rhythm-section-heading__eyebrow">Last seven days</p>
                <h2 id="rhythm-summary-title">Your week at a glance</h2>
              </div>
              <p className="rhythm-section-heading__range">
                <time dateTime={weekly.startDate}>{compactDate(weekly.startDate)}</time>
                <span aria-hidden="true"> – </span>
                <time dateTime={weekly.endDate}>{compactDate(weekly.endDate)}</time>
              </p>
            </div>

            <dl className="rhythm-summary__metrics">
              <div className="rhythm-summary__metric">
                <dt>Care days</dt>
                <dd>{weekly.careDays}<span> / 7</span></dd>
              </div>
              <div className="rhythm-summary__metric">
                <dt>Check-ins</dt>
                <dd>{weekly.completionCount}</dd>
              </div>
              <div className="rhythm-summary__metric">
                <dt>Gentle pace</dt>
                <dd>{weekly.opportunityCount ? `${weekly.completionPercent}%` : "—"}</dd>
              </div>
            </dl>
            <p className="rhythm-summary__note">Rest days are protected and do not lower your gentle pace.</p>

            <ol className="rhythm-week" aria-label="Daily activity for the last seven days">
              {weekly.days.map((day) => (
                <li className="rhythm-day" data-state={day.status} key={day.dateKey}>
                  <time className="rhythm-day__date" dateTime={day.dateKey}>
                    <span>{WEEKDAY_SHORT_NAMES[day.weekdayIndex]}</span>
                    <strong>{Number(day.dateKey.slice(-2))}</strong>
                  </time>
                  <div className="rhythm-day__track" aria-hidden="true">
                    <span style={{ width: `${day.completionPercent}%` }} />
                  </div>
                  <span className="rhythm-day__state">{dayStatusLabel(day.status)}</span>
                  <span className="rhythm-day__detail">{dayDescription(day)}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rhythm-calendar-card" aria-labelledby="rhythm-calendar-title">
            <div className="rhythm-section-heading">
              <div>
                <p className="rhythm-section-heading__eyebrow">Monthly trail</p>
                <h2 id="rhythm-calendar-title">{monthName}</h2>
              </div>
              <p className="rhythm-section-heading__hint">Today is outlined</p>
            </div>

            <div className="rhythm-calendar__scroller" tabIndex="0" aria-label={`${monthName} calendar, horizontally scrollable`}>
              <table className="rhythm-calendar">
                <caption>{monthName} daily habit history</caption>
                <thead>
                  <tr>
                    {WEEKDAY_SHORT_NAMES.map((weekday) => (
                      <th key={weekday} scope="col"><abbr title={weekday}>{weekday.slice(0, 1)}</abbr></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week, weekIndex) => (
                    <tr key={`week-${weekIndex + 1}`}>
                      {week.map((cell) => cell.inMonth ? (
                        <td
                          className={`rhythm-calendar__cell rhythm-calendar__cell--${cell.status}${cell.isToday ? " rhythm-calendar__cell--today" : ""}`}
                          data-state={cell.status}
                          key={cell.key}
                        >
                          <div className="rhythm-calendar__day" aria-label={cellDescription(cell)}>
                            <time dateTime={cell.dateKey}>{cell.dayNumber}</time>
                            <span className="rhythm-calendar__state">{cell.statusLabel}</span>
                            {cell.isToday && <span className="rhythm-calendar__today">Today</span>}
                            {cell.noteCount > 0 && <span className="rhythm-calendar__note">{plural(cell.noteCount, "note")}</span>}
                          </div>
                        </td>
                      ) : (
                        <td className="rhythm-calendar__cell rhythm-calendar__cell--outside" aria-hidden="true" key={cell.key} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="rhythm-legend" aria-label="Calendar labels">
              <li data-state="complete"><span aria-hidden="true" />Full</li>
              <li data-state="tiny"><span aria-hidden="true" />Tiny</li>
              <li data-state="partial"><span aria-hidden="true" />Some</li>
              <li data-state="settled"><span aria-hidden="true" />Cared</li>
              <li data-state="rest"><span aria-hidden="true" />Rest</li>
            </ul>
          </section>

          <section className="rhythm-habits" aria-labelledby="rhythm-habits-title">
            <div className="rhythm-section-heading">
              <div>
                <p className="rhythm-section-heading__eyebrow">This month</p>
                <h2 id="rhythm-habits-title">Habit rhythm</h2>
              </div>
            </div>
            <p className="rhythm-habits__intro">Tiny versions count. Planned rest is left out of the percentage.</p>

            {habitRows.length ? (
              <ul className="rhythm-habit-list">
                {habitRows.map(({ habit, stats }) => {
                  const checkIns = stats.fullCount + stats.tinyCount;
                  const progressLabel = stats.scheduledCount
                    ? `${habit.name}: ${stats.completionPercent}%, ${stats.completedCount} of ${stats.scheduledCount} scheduled days completed`
                    : `${habit.name}: no scheduled opportunities yet`;
                  return (
                    <li className="rhythm-habit" key={habit.id}>
                      <div className="rhythm-habit__mark" aria-hidden="true">{habitInitial(habit.name)}</div>
                      <div className="rhythm-habit__body">
                        <div className="rhythm-habit__heading">
                          <h3>{habit.name || "Untitled habit"}</h3>
                          <strong>{stats.scheduledCount ? `${stats.completionPercent}%` : "New"}</strong>
                        </div>
                        <div
                          className="rhythm-habit__progress"
                          role="progressbar"
                          aria-label={progressLabel}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-valuenow={stats.completionPercent}
                        >
                          <span style={{ width: `${stats.completionPercent}%` }} />
                        </div>
                        <p className="rhythm-habit__detail">
                          {plural(checkIns, "check-in")}
                          {stats.tinyCount > 0 && <> · {plural(stats.tinyCount, "tiny step")}</>}
                          {stats.skippedCount > 0 && <> · {plural(stats.skippedCount, "rest day")}</>}
                          {stats.noteCount > 0 && <> · {plural(stats.noteCount, "note")}</>}
                        </p>
                      </div>
                      {typeof onEditHabit === "function" && (
                        <button className="rhythm-habit__edit" type="button" onClick={() => onEditHabit(habit)}>
                          <KawaiiIcon name="edit" size={16} />
                          Edit<span className="rhythm-habit__edit-name"> {habit.name}</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rhythm-habits__empty">No habits were active this month. Earlier history remains safely stored.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
