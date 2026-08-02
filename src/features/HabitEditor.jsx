import { useState } from "react";
import { HabitIcon } from "../components/HabitIcon";
import { KawaiiIcon } from "../components/KawaiiIcon";
import { Modal } from "./Modal";
import { HABIT_COLORS } from "./seed";
import { HABIT_CATEGORIES, SKIP_REASONS, frequencyLabel, habitStatus, normalizeFrequency } from "./habits";

const ICON_CHOICES = [
  "water",
  "book",
  "move",
  "walk",
  "meditate",
  "breathe",
  "journal",
  "tidy",
  "home",
  "moon",
  "fresh",
  "plant",
  "heart",
  "music",
  "tea",
  "task",
  "seedling",
  "sun",
  "flower",
];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function HabitEditor({ habit, onClose, onSave }) {
  const editing = Boolean(habit);
  const [name, setName] = useState(habit?.name || "");
  const [icon, setIcon] = useState(habit?.icon || "flower");
  const [color, setColor] = useState(habit?.color || HABIT_COLORS[0]);
  const [tinyVersion, setTinyVersion] = useState(habit?.tinyVersion || "");
  const [category, setCategory] = useState(habit?.category || "custom");
  const [timeOfDay, setTimeOfDay] = useState(habit?.timeOfDay || "anytime");
  const [error, setError] = useState("");
  const initialFreq = normalizeFrequency(habit?.frequency);
  const [freqKind, setFreqKind] = useState(initialFreq.kind);
  const [days, setDays] = useState(initialFreq.days);

  function toggleDay(day) {
    setDays((current) =>
      current.includes(day)
        ? current.length === 1 ? current : current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Please give this habit a name.");
      return;
    }
    const frequency = freqKind === "days"
      ? { kind: "days", days: days.length ? days : [1, 2, 3, 4, 5] }
      : { kind: freqKind };
    onSave({
      name: name.trim(),
      icon,
      color,
      tinyVersion: tinyVersion.trim(),
      category,
      timeOfDay,
      frequency,
    });
  }

  return (
    <Modal title={editing ? "Edit habit" : "Create habit"} onClose={onClose} className="entry-modal habit-editor">
      <form onSubmit={submit}>
        <header className="modal-heading">
          <div>
            <p className="section-kicker">Make it kind enough to repeat</p>
            <h2>{editing ? "Edit habit" : "Create a habit"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close habit editor">
            <KawaiiIcon name="close" />
          </button>
        </header>

        <div className="editor-preview">
          <HabitIcon name={icon} color={color} />
          <div><strong>{name || "Your habit"}</strong><span>{tinyVersion || "Its smallest honest version"}</span></div>
        </div>

        <label className="field">
          <span>Name</span>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            onBlur={() => !name.trim() && setError("Please give this habit a name.")}
            placeholder="Drink water"
            autoComplete="off"
            aria-describedby={error ? "habit-name-error" : undefined}
          />
          {error && <small className="field-error" id="habit-name-error">{error}</small>}
        </label>

        <label className="field">
          <span>Tiny version <small>what counts on a difficult day</small></span>
          <input value={tinyVersion} onChange={(event) => setTinyVersion(event.target.value)} placeholder="One glass is enough" autoComplete="off" />
        </label>

        <fieldset className="editor-group">
          <legend>Illustrated icon</legend>
          <div className="icon-choice-grid">
            {ICON_CHOICES.map((choice) => (
              <button
                type="button"
                key={choice}
                className={icon === choice ? "is-selected" : ""}
                onClick={() => setIcon(choice)}
                aria-label={`Use ${choice} icon`}
                aria-pressed={icon === choice}
              >
                <HabitIcon name={choice} color={color} />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="editor-group">
          <legend>Accent</legend>
          <div className="color-choice-row">
            {HABIT_COLORS.map((choice) => (
              <button
                type="button"
                key={choice}
                className={color === choice ? "is-selected" : ""}
                style={{ "--swatch": choice }}
                onClick={() => setColor(choice)}
                aria-label={`Use accent ${choice}`}
                aria-pressed={color === choice}
              >
                {color === choice && <KawaiiIcon name="check" size={15} />}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="editor-group">
          <legend>Part of day</legend>
          <div className="segmented-control">
            {[
              ["morning", "sun", "Morning"],
              ["anytime", "leaf", "Anytime"],
              ["evening", "moon", "Evening"],
            ].map(([id, glyph, label]) => (
              <button key={id} type="button" className={timeOfDay === id ? "is-selected" : ""} onClick={() => setTimeOfDay(id)} aria-pressed={timeOfDay === id}>
                <KawaiiIcon name={glyph} size={17} /> {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="editor-group">
          <legend>How often</legend>
          <div className="segmented-control">
            {[
              ["daily", "Every day"],
              ["weekdays", "Weekdays"],
              ["days", "Custom"],
            ].map(([id, label]) => (
              <button key={id} type="button" className={freqKind === id ? "is-selected" : ""} onClick={() => setFreqKind(id)} aria-pressed={freqKind === id}>
                {label}
              </button>
            ))}
          </div>
          {freqKind === "days" && (
            <div className="day-choice-row">
              {DAY_LABELS.map((label, day) => (
                <button
                  key={DAY_NAMES[day]}
                  type="button"
                  className={days.includes(day) ? "is-selected" : ""}
                  onClick={() => toggleDay(day)}
                  aria-pressed={days.includes(day)}
                  aria-label={DAY_NAMES[day]}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        <label className="field">
          <span>Area</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {HABIT_CATEGORIES.map((choice) => (
              <option key={choice} value={choice}>{choice[0].toUpperCase() + choice.slice(1)}</option>
            ))}
          </select>
        </label>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Keep browsing</button>
          <button type="submit" className="primary-button">{editing ? "Save habit" : "Create habit"}</button>
        </div>
      </form>
    </Modal>
  );
}

export function HabitMenu({ habit, todayStr, onClose, onComplete, onTiny, onSkip, onNote, onEdit, onArchive, onResetToday }) {
  const status = habitStatus(habit, todayStr);
  const note = habit.notesByDate?.[todayStr];
  return (
    <Modal title={habit.name} onClose={onClose} className="entry-modal action-sheet">
      <header className="sheet-heading">
        <HabitIcon name={habit.icon} color={habit.color} />
        <div><h2>{habit.name}</h2>{habit.tinyVersion && <p>{habit.tinyVersion}</p>}</div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close habit options"><KawaiiIcon name="close" /></button>
      </header>
      <div className="sheet-actions">
        {status !== "done" && <SheetAction icon="check" label="Mark fully cared for" onClick={onComplete} />}
        {habit.tinyVersion && status !== "tiny" && <SheetAction icon="leaf" label="I did the tiny version" onClick={onTiny} />}
        {(status === "done" || status === "tiny") && <SheetAction icon="back" label="Open today again" onClick={onResetToday} />}
        <SheetAction icon="rest" label="Take a rest day" onClick={onSkip} />
        <SheetAction icon="note" label={note ? "Edit today’s note" : "Add a note for today"} onClick={onNote} />
        <SheetAction icon="edit" label="Edit habit" onClick={onEdit} />
        <SheetAction icon="archive" label="Archive habit" onClick={onArchive} danger />
      </div>
    </Modal>
  );
}

function SheetAction({ icon, label, onClick, danger = false }) {
  return <button type="button" className={danger ? "is-danger" : ""} onClick={onClick}><KawaiiIcon name={icon} size={20} /><span>{label}</span><KawaiiIcon name="arrowRight" size={16} /></button>;
}

export function SkipSheet({ onClose, onSkip }) {
  const [custom, setCustom] = useState("");
  return (
    <Modal title="Rest today" onClose={onClose} className="entry-modal action-sheet">
      <header className="modal-heading">
        <div><p className="section-kicker">Rest protects the rhythm</p><h2>What kind of day is this?</h2></div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close rest options"><KawaiiIcon name="close" /></button>
      </header>
      <p className="sheet-intro">A recorded rest day will never break your consistency.</p>
      <div className="sheet-actions">
        {SKIP_REASONS.map((reason) => (
          <button key={reason.id} type="button" onClick={() => onSkip(reason.label)}>
            <KawaiiIcon name={reason.icon} size={20} /><span>{reason.label}</span><KawaiiIcon name="arrowRight" size={16} />
          </button>
        ))}
      </div>
      <form className="inline-form" onSubmit={(event) => { event.preventDefault(); if (custom.trim()) onSkip(custom.trim()); }}>
        <label className="sr-only" htmlFor="custom-rest-reason">Another reason</label>
        <input id="custom-rest-reason" value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Another reason" />
        <button className="primary-button" type="submit" disabled={!custom.trim()}>Save rest day</button>
      </form>
    </Modal>
  );
}

export function NotePrompt({ habit, todayStr, onClose, onSave }) {
  const [text, setText] = useState(habit.notesByDate?.[todayStr] || "");
  return (
    <Modal title="Note for today" onClose={onClose} className="entry-modal">
      <form onSubmit={(event) => { event.preventDefault(); onSave(text); }}>
        <header className="modal-heading">
          <div><p className="section-kicker">A small memory, just for you</p><h2>Note for today</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close note"><KawaiiIcon name="close" /></button>
        </header>
        <label className="field">
          <span>{habit.name} <small>{frequencyLabel(habit.frequency)}</small></span>
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} maxLength={500} placeholder="What helped? What would you like to remember?" autoFocus />
          <small className="character-count">{text.length} / 500</small>
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Keep browsing</button>
          <button type="submit" className="primary-button">Save note</button>
        </div>
      </form>
    </Modal>
  );
}
