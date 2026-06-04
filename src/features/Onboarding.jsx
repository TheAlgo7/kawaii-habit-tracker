import { useMemo, useState } from "react";
import { today } from "./date";
import { normalizeHabit, toggleTiny } from "./habits";
import { HABIT_PRESETS, REMINDER_STYLES, THEMES } from "./presets";

const STEPS = ["welcome", "naming", "pick", "tiny", "reminder", "theme", "first"];

export function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [nekoName, setNekoName] = useState("Neko-chan");
  const [worldName, setWorldName] = useState("Kawaii");
  const [picked, setPicked] = useState([]); // preset indexes
  const [tinies, setTinies] = useState({}); // index -> tiny string
  const [reminderStyle, setReminderStyle] = useState("none");
  const [theme, setTheme] = useState("midnight-sakura");
  const [habits, setHabits] = useState([]);
  const [firstDone, setFirstDone] = useState(false);

  const stepName = STEPS[step];
  const canPickMore = picked.length < 3;

  const selectedPresets = useMemo(
    () => picked.map((i) => ({ ...HABIT_PRESETS[i], tinyVersion: tinies[i] ?? HABIT_PRESETS[i].tinyVersion })),
    [picked, tinies],
  );

  function togglePick(index) {
    setPicked((current) =>
      current.includes(index)
        ? current.filter((i) => i !== index)
        : canPickMore
          ? [...current, index]
          : current,
    );
  }

  function next() {
    // Entering the "first check-in" step: build the real habit objects once.
    if (stepName === "theme") {
      setHabits(selectedPresets.map((preset, i) => normalizeHabit(preset, i)));
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function completeFirst(id) {
    const day = today();
    setHabits((current) => current.map((h) => (h.id === id ? toggleTiny(h, day) : h)));
    setFirstDone(true);
  }

  function finish() {
    onFinish({
      profile: {
        userName: userName.trim(),
        nekoName: nekoName.trim() || "Neko-chan",
        worldName: worldName.trim() || "Kawaii",
        onboardedAt: new Date().toISOString(),
      },
      preferences: {
        theme,
        reminderStyle,
        remindersEnabled: reminderStyle !== "none",
      },
      habits,
    });
  }

  const nextDisabled = stepName === "pick" && picked.length === 0;

  return (
    <div className="onb" role="dialog" aria-modal="true" aria-label="Welcome to Kawaii Habits">
      <div className="onb-card">
        <div className="onb-dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? "on" : ""} />
          ))}
        </div>

        <div className="onb-body">
          {stepName === "welcome" && (
            <div className="onb-step onb-center">
              <img className="onb-neko" src="/neko-cat-happy.webp" alt="" width="160" height="160" />
              <h1>Meet {nekoName}</h1>
              <p>Build tiny care rituals. Your little world grows every time you show up, no streaks to fear, no guilt for resting.</p>
            </div>
          )}

          {stepName === "naming" && (
            <div className="onb-step">
              <h1>Let's introduce ourselves</h1>
              <label className="onb-field">
                Your name <span className="onb-opt">(optional)</span>
                <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="What should Neko call you?" />
              </label>
              <label className="onb-field">
                Name your companion
                <input value={nekoName} onChange={(e) => setNekoName(e.target.value)} placeholder="Neko-chan" />
              </label>
              <label className="onb-field">
                Name your little world
                <input value={worldName} onChange={(e) => setWorldName(e.target.value)} placeholder="Kawaii" />
              </label>
            </div>
          )}

          {stepName === "pick" && (
            <div className="onb-step">
              <h1>Pick 1-3 tiny rituals</h1>
              <p className="onb-sub">You can add or change these anytime. Start small.</p>
              <div className="onb-grid">
                {HABIT_PRESETS.map((preset, i) => {
                  const on = picked.includes(i);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      className={`onb-chip${on ? " on" : ""}`}
                      aria-pressed={on}
                      aria-label={on ? `${preset.name}, selected` : `Select ${preset.name} ritual`}
                      disabled={!on && !canPickMore}
                      onClick={() => togglePick(i)}
                    >
                      <span aria-hidden="true">{preset.emoji}</span>
                      {preset.name}
                    </button>
                  );
                })}
              </div>
              {picked.length >= 3 && (
                <p className="onb-hint" role="status">
                  3 selected, unselect one to choose another.
                </p>
              )}
            </div>
          )}

          {stepName === "tiny" && (
            <div className="onb-step">
              <h1>What's the tiny version?</h1>
              <p className="onb-sub">The version so small it counts even on your worst day.</p>
              {picked.map((i) => (
                <label className="onb-field" key={HABIT_PRESETS[i].name}>
                  <span aria-hidden="true">{HABIT_PRESETS[i].emoji}</span> {HABIT_PRESETS[i].name}
                  <input
                    value={tinies[i] ?? HABIT_PRESETS[i].tinyVersion}
                    onChange={(e) => setTinies((c) => ({ ...c, [i]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          )}

          {stepName === "reminder" && (
            <div className="onb-step">
              <h1>A gentle nudge?</h1>
              <p className="onb-sub">Pick a tone you like. Scheduled reminders are coming soon, for now this just saves your preference.</p>
              <div className="onb-options">
                {REMINDER_STYLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`onb-option${reminderStyle === r.id ? " on" : ""}`}
                    aria-pressed={reminderStyle === r.id}
                    onClick={() => setReminderStyle(r.id)}
                  >
                    <span aria-hidden="true">{r.emoji}</span> {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stepName === "theme" && (
            <div className="onb-step">
              <h1>Choose your world's mood</h1>
              <div className="onb-options">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`onb-option${theme === t.id ? " on" : ""}`}
                    aria-pressed={theme === t.id}
                    onClick={() => setTheme(t.id)}
                  >
                    <span className="onb-swatch" style={{ background: t.swatch }} aria-hidden="true" />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stepName === "first" && (
            <div className="onb-step onb-center">
              {firstDone ? (
                <>
                  <img className="onb-neko" src="/neko-cat-blissful.webp" alt="" width="160" height="160" />
                  <h1>The world just brightened ✨</h1>
                  <p>That's the whole loop, {userName || "friend"}. One tiny thing, and {nekoName} feels it. Welcome home.</p>
                </>
              ) : (
                <>
                  <img className="onb-neko" src="/neko-cat-happy.webp" alt="" width="140" height="140" />
                  <h1>Let's do one tiny thing now</h1>
                  <p className="onb-sub">Tap a ritual to do its tiny version. First wins are the best wins.</p>
                  <div className="onb-firstlist">
                    {habits.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        className="onb-firstrow"
                        aria-label={`Complete tiny version: ${h.tinyVersion || h.name}`}
                        onClick={() => completeFirst(h.id)}
                      >
                        <span className="round-check" style={{ "--row-color": h.color }} aria-hidden="true" />
                        <span>{h.tinyVersion || h.name}</span>
                        <em aria-hidden="true">{h.emoji}</em>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="onb-actions">
          {step > 0 ? (
            <button type="button" className="onb-back" onClick={back}>
              Back
            </button>
          ) : (
            <span />
          )}
          {stepName === "first" ? (
            <button type="button" className="onb-next" onClick={finish}>
              {firstDone ? "Enter your world →" : "Skip for now →"}
            </button>
          ) : (
            <button type="button" className="onb-next" onClick={next} disabled={nextDisabled}>
              {stepName === "welcome" ? "Begin →" : "Next →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
