import { useState } from "react";
import { Modal } from "./Modal";
import { HABIT_COLORS } from "./seed";
import { HABIT_CATEGORIES, SKIP_REASONS, frequencyLabel, habitStatus, normalizeFrequency } from "./habits";

const EMOJI_QUICK = ["🌸", "💧", "📖", "🧘", "🏃", "🥗", "🌙", "✏️", "🧹", "💌", "☀️", "🎵"];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// Create or edit a habit. `habit` null => create mode.
export function HabitEditor({ habit, onClose, onSave }) {
  const editing = Boolean(habit);
  const [name, setName] = useState(habit?.name || "");
  const [emoji, setEmoji] = useState(habit?.emoji || "🌸");
  const [color, setColor] = useState(habit?.color || HABIT_COLORS[0]);
  const [tinyVersion, setTinyVersion] = useState(habit?.tinyVersion || "");
  const [category, setCategory] = useState(habit?.category || "custom");
  const initialFreq = normalizeFrequency(habit?.frequency);
  const [freqKind, setFreqKind] = useState(initialFreq.kind);
  const [days, setDays] = useState(initialFreq.days);

  function toggleDay(d) {
    setDays((current) =>
      current.includes(d) ? current.filter((x) => x !== d) : [...current, d].sort((a, b) => a - b),
    );
  }

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    const frequency =
      freqKind === "days" ? { kind: "days", days: days.length ? days : [1, 2, 3, 4, 5] } : { kind: freqKind };
    onSave({
      name: name.trim(),
      emoji: emoji.trim() || "🌸",
      color,
      tinyVersion: tinyVersion.trim(),
      category,
      frequency,
    });
  }

  return (
    <Modal title={editing ? "Edit habit" : "New care ritual"} onClose={onClose} className="entry-modal habit-editor">
      <form onSubmit={submit}>
        <h2>{editing ? "Edit habit" : "New care ritual"}</h2>

        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Drink water" autoComplete="off" />
        </label>

        <label>
          Tiny version <span className="field-hint">the version that counts on hard days</span>
          <input value={tinyVersion} onChange={(e) => setTinyVersion(e.target.value)} placeholder="One glass of water" autoComplete="off" />
        </label>

        <fieldset className="editor-group">
          <legend>Emoji</legend>
          <div className="emoji-row">
            <input className="emoji-input" value={emoji} onChange={(e) => setEmoji(e.target.value)} aria-label="Habit emoji" maxLength={4} />
            {EMOJI_QUICK.map((e) => (
              <button type="button" key={e} className={emoji === e ? "on" : ""} onClick={() => setEmoji(e)} aria-label={`Use ${e}`}>
                {e}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="editor-group">
          <legend>Colour</legend>
          <div className="color-row">
            {HABIT_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`color-dot${color === c ? " on" : ""}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`Colour ${c}`}
                aria-pressed={color === c}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="editor-group">
          <legend>How often</legend>
          <div className="seg">
            {[
              ["daily", "Every day"],
              ["weekdays", "Weekdays"],
              ["days", "Custom"],
            ].map(([id, label]) => (
              <button key={id} type="button" className={freqKind === id ? "on" : ""} onClick={() => setFreqKind(id)} aria-pressed={freqKind === id}>
                {label}
              </button>
            ))}
          </div>
          {freqKind === "days" && (
            <div className="day-row">
              {DAY_LABELS.map((label, d) => (
                <button
                  key={d}
                  type="button"
                  className={`day-dot${days.includes(d) ? " on" : ""}`}
                  onClick={() => toggleDay(d)}
                  aria-pressed={days.includes(d)}
                  aria-label={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d]}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {HABIT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit">{editing ? "Save" : "Add"}</button>
        </div>
      </form>
    </Modal>
  );
}

// The per-row action menu.
export function HabitMenu({ habit, todayStr, onClose, onComplete, onTiny, onSkip, onNote, onEdit, onArchive, onResetToday }) {
  const status = habitStatus(habit, todayStr);
  const note = habit.notesByDate?.[todayStr];
  return (
    <Modal title={habit.name} onClose={onClose} className="entry-modal action-sheet">
      <h2>
        <span aria-hidden="true">{habit.emoji}</span> {habit.name}
      </h2>
      {habit.tinyVersion && <p className="sheet-tiny">Tiny: {habit.tinyVersion}</p>}
      <div className="sheet-actions">
        {status !== "done" && (
          <button type="button" onClick={onComplete}>✓ Mark done</button>
        )}
        {habit.tinyVersion && status !== "tiny" && (
          <button type="button" onClick={onTiny}>🌱 Did the tiny version</button>
        )}
        {(status === "done" || status === "tiny") && (
          <button type="button" onClick={onResetToday}>↺ Reset today</button>
        )}
        <button type="button" onClick={onSkip}>🛌 Skip / rest today</button>
        <button type="button" onClick={onNote}>📝 {note ? "Edit note" : "Add note"}</button>
        <button type="button" onClick={onEdit}>✎ Edit habit</button>
        <button type="button" className="sheet-danger" onClick={onArchive}>🗑 Archive</button>
      </div>
    </Modal>
  );
}

export function SkipSheet({ onClose, onSkip }) {
  const [custom, setCustom] = useState("");
  return (
    <Modal title="Skip today" onClose={onClose} className="entry-modal action-sheet">
      <h2>It's okay to rest 💗</h2>
      <p className="sheet-tiny">Skipping with a reason keeps your streak safe, no guilt.</p>
      <div className="sheet-actions">
        {SKIP_REASONS.map((r) => (
          <button key={r.id} type="button" onClick={() => onSkip(r.label)}>
            <span aria-hidden="true">{r.emoji}</span> {r.label}
          </button>
        ))}
      </div>
      <form
        className="note-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (custom.trim()) onSkip(custom.trim());
        }}
      >
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Another reason…" aria-label="Custom skip reason" />
        <button type="submit">Skip</button>
      </form>
    </Modal>
  );
}

export function NotePrompt({ habit, todayStr, onClose, onSave }) {
  const [text, setText] = useState(habit.notesByDate?.[todayStr] || "");
  return (
    <Modal title="Add a note" onClose={onClose} className="entry-modal">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(text);
        }}
      >
        <h2>Note for today</h2>
        <label>
          {habit.name} · {frequencyLabel(habit.frequency)}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="How did it go? Anything to remember?"
            autoFocus
          />
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit">Save note</button>
        </div>
      </form>
    </Modal>
  );
}
