import { useEffect, useMemo, useRef, useState } from "react";
import { HabitIcon } from "../components/HabitIcon";
import { KawaiiIcon } from "../components/KawaiiIcon";
import { ThemeArtwork } from "../components/ThemeArtwork";
import { today } from "./date";
import { normalizeHabit, toggleTiny } from "./habits";
import { HABIT_PRESETS, THEMES } from "./presets";

const STEPS = ["welcome", "naming", "pick", "tiny", "theme", "first"];
export function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [nekoName, setNekoName] = useState("Neko");
  const [worldName, setWorldName] = useState("Mori Garden");
  const [picked, setPicked] = useState([]);
  const [tinies, setTinies] = useState({});
  const [theme, setTheme] = useState("garden-day");
  const [habits, setHabits] = useState([]);
  const [firstDone, setFirstDone] = useState(false);
  const headingRef = useRef(null);
  const bodyRef = useRef(null);

  const stepName = STEPS[step];
  const selectedPresets = useMemo(
    () => picked.map((index) => ({ ...HABIT_PRESETS[index], tinyVersion: tinies[index] ?? HABIT_PRESETS[index].tinyVersion })),
    [picked, tinies],
  );

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    headingRef.current?.focus({ preventScroll: true });
  }, [step, firstDone]);

  function togglePick(index) {
    setPicked((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : current.length < 3
          ? [...current, index]
          : current,
    );
  }

  function next() {
    if (stepName === "theme") {
      setHabits(selectedPresets.map((preset, index) => normalizeHabit(preset, index)));
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function completeFirst(id) {
    const day = today();
    setHabits((current) => current.map((habit) => (habit.id === id ? toggleTiny(habit, day) : habit)));
    setFirstDone(true);
  }

  function finish() {
    onFinish({
      profile: {
        userName: userName.trim(),
        nekoName: nekoName.trim() || "Neko",
        worldName: worldName.trim() || "Mori Garden",
        onboardedAt: new Date().toISOString(),
      },
      preferences: {
        theme,
      },
      habits,
    });
  }

  const nextDisabled = stepName === "pick" && picked.length === 0;

  return (
    <main className="onboarding" data-onboarding-theme={theme}>
      <section className="onboarding-shell" role="dialog" aria-modal="true" aria-label="Welcome to Kawaii Habits">
        <div className="onboarding-art" aria-hidden="true">
          <img
            src={theme === "garden-night" ? "/scene-garden-night.webp" : "/scene-garden-day.webp"}
            alt=""
            width="1280"
            height="853"
          />
          <div className="onboarding-art-copy">
            <KawaiiIcon name="leaf" size={24} />
            <span>Tiny steps, root deep.</span>
          </div>
        </div>

        <div className="onboarding-content">
          <div
            className="step-progress"
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuemin="1"
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
            aria-valuetext={`Step ${step + 1} of ${STEPS.length}`}
          >
            {STEPS.map((name, index) => (
              <span key={name} className={index <= step ? "is-active" : ""} aria-hidden="true" />
            ))}
          </div>

          <div className="onboarding-body" ref={bodyRef}>
            {stepName === "welcome" && (
              <div className="onboarding-step welcome-step">
                <p className="section-kicker">A habit companion for imperfect days</p>
                <h1 ref={headingRef} tabIndex="-1">Care for yourself. Grow a little world.</h1>
                <p>Choose tiny habits, mark what you can, and watch Neko’s garden respond. Rest never counts against you.</p>
                <div className="welcome-promises">
                  <span><KawaiiIcon name="check" size={18} /> Private and offline</span>
                  <span><KawaiiIcon name="leaf" size={18} /> Tiny versions count</span>
                  <span><KawaiiIcon name="heart" size={18} /> No guilt mechanics</span>
                </div>
              </div>
            )}

            {stepName === "naming" && (
              <div className="onboarding-step">
                <p className="section-kicker">Make this place yours</p>
                <h1 ref={headingRef} tabIndex="-1">Who lives in your garden?</h1>
                <label className="field">
                  <span>Your name <small>optional</small></span>
                  <input value={userName} onChange={(event) => setUserName(event.target.value)} placeholder="What should Neko call you?" />
                </label>
                <label className="field">
                  <span>Companion name</span>
                  <input value={nekoName} onChange={(event) => setNekoName(event.target.value)} placeholder="Neko" />
                </label>
                <label className="field">
                  <span>Garden name</span>
                  <input value={worldName} onChange={(event) => setWorldName(event.target.value)} placeholder="Mori Garden" />
                </label>
              </div>
            )}

            {stepName === "pick" && (
              <div className="onboarding-step">
                <p className="section-kicker">Begin with less</p>
                <h1 ref={headingRef} tabIndex="-1">Pick one to three habits</h1>
                <p>Choose only what deserves space in an ordinary day. You can change everything later.</p>
                <div className="preset-grid">
                  {HABIT_PRESETS.map((preset, index) => {
                    const selected = picked.includes(index);
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        className={selected ? "is-selected" : ""}
                        aria-pressed={selected}
                        disabled={!selected && picked.length >= 3}
                        onClick={() => togglePick(index)}
                      >
                        <HabitIcon name={preset.icon} color={preset.color} />
                        <span>{preset.name}<small>{preset.tinyVersion}</small></span>
                        <i aria-hidden="true">{selected && <KawaiiIcon name="check" size={16} />}</i>
                      </button>
                    );
                  })}
                </div>
                <p className="selection-count" role="status">{picked.length} of 3 selected</p>
              </div>
            )}

            {stepName === "tiny" && (
              <div className="onboarding-step">
                <p className="section-kicker">Design for the difficult day</p>
                <h1 ref={headingRef} tabIndex="-1">What is the tiny version?</h1>
                <p>The smallest honest version still counts.</p>
                <div className="tiny-fields">
                  {picked.map((index) => (
                    <label className="tiny-field" key={HABIT_PRESETS[index].name}>
                      <HabitIcon name={HABIT_PRESETS[index].icon} color={HABIT_PRESETS[index].color} />
                      <span>{HABIT_PRESETS[index].name}</span>
                      <input
                        value={tinies[index] ?? HABIT_PRESETS[index].tinyVersion}
                        onChange={(event) => setTinies((current) => ({ ...current, [index]: event.target.value }))}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {stepName === "theme" && (
              <div className="onboarding-step">
                <p className="section-kicker">Set the atmosphere</p>
                <h1 ref={headingRef} tabIndex="-1">Choose your garden’s light</h1>
                <div className="theme-choice-grid">
                  {THEMES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`theme-choice theme-${option.id}${theme === option.id ? " is-selected" : ""}`}
                      aria-pressed={theme === option.id}
                      onClick={() => setTheme(option.id)}
                    >
                      <span className="theme-preview" aria-hidden="true"><ThemeArtwork theme={option.id} /></span>
                      <strong>{option.name}</strong>
                      <small>{option.description}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {stepName === "first" && (
              <div className="onboarding-step first-step">
                {firstDone ? (
                  <>
                    <span className="success-seal" aria-hidden="true"><KawaiiIcon name="flower" size={40} /></span>
                    <p className="section-kicker">Your first root</p>
                    <h1 ref={headingRef} tabIndex="-1">The garden noticed.</h1>
                    <p>That is the whole loop, {userName || "friend"}. One tiny thing, cared for honestly.</p>
                  </>
                ) : (
                  <>
                    <p className="section-kicker">Try the real loop</p>
                    <h1 ref={headingRef} tabIndex="-1">Do one tiny thing now</h1>
                    <p>Choose a habit below. Its tiny version counts as a complete, gentle win.</p>
                    <div className="first-ritual-list">
                      {habits.map((habit) => (
                        <button key={habit.id} type="button" onClick={() => completeFirst(habit.id)}>
                          <HabitIcon name={habit.icon} color={habit.color} />
                          <span><strong>{habit.name}</strong><small>{habit.tinyVersion}</small></span>
                          <KawaiiIcon name="circle" size={30} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <footer className="onboarding-actions">
            {step > 0 ? (
              <button type="button" className="secondary-button" onClick={back}>
                <KawaiiIcon name="back" size={18} /> Back
              </button>
            ) : <span />}
            {stepName === "first" ? (
              <button type="button" className="primary-button" onClick={finish}>
                {firstDone ? "Enter your garden" : "Settle in for now"}
                <KawaiiIcon name="arrowRight" size={18} />
              </button>
            ) : (
              <button type="button" className="primary-button" onClick={next} disabled={nextDisabled}>
                {stepName === "welcome" ? "Begin gently" : "Continue"}
                <KawaiiIcon name="arrowRight" size={18} />
              </button>
            )}
          </footer>
        </div>
      </section>
    </main>
  );
}
