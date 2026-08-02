import { HabitIcon } from "../components/HabitIcon";
import { KawaiiIcon } from "../components/KawaiiIcon";
import { offsetDate } from "./date";
import { habitStatus, isDoneOn, isScheduledOn } from "./habits";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const GROUPS = [
  ["morning", "Morning", "sun"],
  ["anytime", "Anytime", "leaf"],
  ["evening", "Evening", "moon"],
];

function dateParts(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dayGreeting(theme) {
  if (theme === "garden-night") return "Good evening";
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function weekFor(todayStr) {
  return Array.from({ length: 7 }, (_, index) => {
    const key = offsetDate(todayStr, index - 6);
    return { key, label: DAY_LETTERS[dateParts(key).getDay()] };
  });
}

export function TodayPanel({
  habits,
  tasks,
  todayStr,
  theme,
  userName,
  worldName,
  feedback,
  onUndo,
  onComplete,
  onMenu,
  onAddHabit,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onOpenSettings,
}) {
  const scheduled = habits.filter((habit) => isScheduledOn(habit, todayStr));
  const done = scheduled.filter((habit) => isDoneOn(habit, todayStr)).length;
  const progress = scheduled.length ? Math.round((done / scheduled.length) * 100) : 0;
  const week = weekFor(todayStr);
  const visibleTasks = tasks.filter((task) => !task.archivedAt);

  return (
    <div className="today-layout">
      <section className="garden-hero" aria-labelledby="today-greeting">
        <img
          className="garden-hero-art"
          src={theme === "garden-night" ? "/scene-garden-night.webp" : "/scene-garden-day.webp"}
          alt=""
          width="1280"
          height="853"
          fetchPriority="high"
        />
        <div className="garden-hero-shade" aria-hidden="true" />
        <header className="garden-hero-header">
          <div>
            <p className="hero-kicker">{worldName || "Your little garden"}</p>
            <h1 id="today-greeting">
              {dayGreeting(theme)}{userName ? `, ${userName}` : ""}
            </h1>
          </div>
          <button className="icon-button hero-settings" type="button" onClick={onOpenSettings} aria-label="Open settings">
            <KawaiiIcon name="settings" />
          </button>
        </header>

        <div className={`hero-progress${feedback?.habitId ? " has-update" : ""}`} aria-label={`${done} of ${scheduled.length} habits completed today`}>
          <span className="hero-progress-icon" aria-hidden="true">
            <KawaiiIcon name="seedling" size={22} />
          </span>
          <div className="hero-progress-copy">
            <strong>{done} of {scheduled.length || 0} cared for</strong>
            <span>{progress === 100 ? "Your garden is glowing." : "Tiny steps root deep."}</span>
          </div>
          <div className="hero-progress-track" aria-hidden="true">
            {scheduled.map((habit) => (
              <i key={habit.id} className={isDoneOn(habit, todayStr) ? "is-filled" : ""} />
            ))}
          </div>
        </div>
      </section>

      <section className="today-agenda" aria-labelledby="today-title">
        <header className="section-heading today-heading">
          <span className="section-mark" aria-hidden="true"><KawaiiIcon name="flower" /></span>
          <div>
            <p className="section-kicker">{new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(dateParts(todayStr))}</p>
            <h2 id="today-title">Today</h2>
          </div>
          <button className="create-button" type="button" onClick={onAddHabit} aria-label="Create habit">
            <KawaiiIcon name="plus" size={20} />
            <span>Create habit</span>
          </button>
        </header>

        {scheduled.length === 0 ? (
          <EmptyRituals onCreate={onAddHabit} />
        ) : (
          <div className="ritual-groups">
            {GROUPS.map(([key, label, icon]) => {
              const groupHabits = scheduled.filter((habit) => (habit.timeOfDay || "anytime") === key);
              if (!groupHabits.length) return null;
              return (
                <section className="ritual-group" key={key} aria-labelledby={`group-${key}`}>
                  <h3 id={`group-${key}`} className="ritual-group-title">
                    <KawaiiIcon name={icon} size={18} />
                    {label}
                  </h3>
                  <div className="ritual-list">
                    {groupHabits.map((habit) => (
                      <HabitRow
                        key={habit.id}
                        habit={habit}
                        todayStr={todayStr}
                        week={week}
                        feedback={feedback?.habitId === habit.id ? feedback : null}
                        onUndo={onUndo}
                        onComplete={() => onComplete(habit)}
                        onMenu={() => onMenu(habit)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <TasksSection
          tasks={visibleTasks}
          onAdd={onAddTask}
          onToggle={onToggleTask}
          onDelete={onDeleteTask}
        />
      </section>
    </div>
  );
}

function HabitRow({ habit, todayStr, week, feedback, onUndo, onComplete, onMenu }) {
  const status = habitStatus(habit, todayStr);
  const completed = status === "done" || status === "tiny";
  const rhythmText = week
    .map(({ key }) => {
      const state = habitStatus(habit, key);
      if (state === "done") return `${key} done`;
      if (state === "tiny") return `${key} tiny`;
      if (state === "skipped") return `${key} rest`;
      if (state === "off") return `${key} not scheduled`;
      return `${key} open`;
    })
    .join(", ");

  return (
    <article className={`ritual-row is-${status}${(feedback?.kind === "care" || feedback?.kind === "unlock") && completed ? " is-celebrating" : ""}`}>
      <HabitIcon name={habit.icon} color={habit.color} />
      <div className="ritual-copy">
        <div className="ritual-title-line">
          <h4>{habit.name}</h4>
          <button className="more-button" type="button" onClick={onMenu} aria-label={`More options for ${habit.name}`}>
            <KawaiiIcon name="more" size={20} />
          </button>
        </div>
        <p>{habit.tinyVersion || "One small version still counts."}</p>
        <div className="week-rhythm" aria-label={`Last seven days: ${rhythmText}`}>
          {week.map(({ key, label }) => {
            const dayStatus = habitStatus(habit, key);
            return (
              <span key={key} className={`rhythm-day is-${dayStatus}${key === todayStr ? " is-today" : ""}`} title={`${key}: ${dayStatus}`}>
                <b aria-hidden="true">{label}</b>
                <i aria-hidden="true">{dayStatus === "done" ? <KawaiiIcon name="check" size={11} /> : dayStatus === "tiny" ? <KawaiiIcon name="leaf" size={10} /> : null}</i>
              </span>
            );
          })}
        </div>
      </div>
      <button
        className={`completion-button${completed ? " is-complete" : ""}`}
        type="button"
        onClick={onComplete}
        aria-label={completed ? `Undo completion for ${habit.name}` : `Complete ${habit.name}`}
        aria-pressed={completed}
      >
        {completed ? <KawaiiIcon name={status === "tiny" ? "leaf" : "check"} size={30} /> : <span className="completion-dot" aria-hidden="true" />}
        <span className="completion-flourish" aria-hidden="true" key={feedback?.id || "idle"}><i /><i /><i /></span>
      </button>
      {feedback && feedback.kind !== "unlock" && (
        <div className="inline-feedback" role="status">
          <KawaiiIcon name="leaf" size={18} />
          <span>{feedback.message}</span>
          <button type="button" onClick={onUndo}>Undo</button>
        </div>
      )}
    </article>
  );
}

function TasksSection({ tasks, onAdd, onToggle, onDelete }) {
  return (
    <section className="extras-section" aria-labelledby="extras-title">
      <header className="section-heading compact-heading">
        <span className="section-mark muted" aria-hidden="true"><KawaiiIcon name="task" /></span>
        <div>
          <p className="section-kicker">Optional, one-time things</p>
          <h2 id="extras-title">Little extras</h2>
        </div>
        <button className="text-button" type="button" onClick={onAdd}>
          <KawaiiIcon name="plus" size={18} /> Create to-do
        </button>
      </header>
      {tasks.length ? (
        <div className="extras-list">
          {tasks.map((task) => (
            <div className={`extra-row${task.done ? " is-done" : ""}`} key={task.id}>
              <button type="button" className="extra-toggle" onClick={() => onToggle(task.id)} aria-label={`${task.done ? "Reopen" : "Complete"} ${task.name}`}>
                {task.done && <KawaiiIcon name="check" size={16} />}
              </button>
              <span>{task.name}</span>
              <small>{task.category || "Personal"}</small>
              <button type="button" className="more-button" onClick={() => onDelete(task)} aria-label={`Delete ${task.name}`}>
                <KawaiiIcon name="trash" size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="quiet-empty">Nothing extra is asking for your attention.</p>
      )}
    </section>
  );
}

function EmptyRituals({ onCreate }) {
  return (
    <div className="illustrated-empty">
      <HabitIcon name="plant" color="#91ad83" />
      <div>
        <h3>Plant your first tiny habit</h3>
        <p>Choose something small enough to do on an ordinary, imperfect day.</p>
      </div>
      <button className="primary-button" type="button" onClick={onCreate}>Create a habit</button>
    </div>
  );
}
