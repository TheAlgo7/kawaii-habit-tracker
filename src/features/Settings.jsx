import { useRef, useState } from "react";
import { Modal } from "./Modal";
import { defaultState, exportState, importState } from "./appState";
import { REMINDER_STYLES, THEMES } from "./presets";

const APP_VERSION = "1.0.0";

export function Settings({ state, onUpdate, onClose }) {
  const { profile, preferences } = state;
  const [importError, setImportError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef(null);

  function setProfile(partial) {
    onUpdate((current) => ({ ...current, profile: { ...current.profile, ...partial } }));
  }
  function setPrefs(partial) {
    onUpdate((current) => ({ ...current, preferences: { ...current.preferences, ...partial } }));
  }

  function doExport() {
    const blob = new Blob([exportState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kawaii-habits-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function doImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = importState(String(reader.result));
        onUpdate(() => next);
        setImportError("");
        onClose();
      } catch (error) {
        setImportError(error.message || "Could not read that file.");
      }
    };
    reader.readAsText(file);
  }

  function doReset() {
    onUpdate(() => defaultState());
    onClose();
  }

  return (
    <Modal title="Settings" onClose={onClose} className="settings-panel">
      <header className="settings-head">
        <h2>Settings</h2>
        <button type="button" className="settings-close" onClick={onClose} aria-label="Close settings">
          ✕
        </button>
      </header>

      <section className="settings-group">
        <h3>You & your world</h3>
        <label>
          Your name
          <input value={profile.userName} onChange={(e) => setProfile({ userName: e.target.value })} placeholder="optional" />
        </label>
        <label>
          Companion name
          <input value={profile.nekoName} onChange={(e) => setProfile({ nekoName: e.target.value })} />
        </label>
        <label>
          World name
          <input value={profile.worldName} onChange={(e) => setProfile({ worldName: e.target.value })} />
        </label>
      </section>

      <section className="settings-group">
        <h3>Theme</h3>
        <div className="onb-options">
          {THEMES.map((t) => (
            <button key={t.id} type="button" className={`onb-option${preferences.theme === t.id ? " on" : ""}`} aria-pressed={preferences.theme === t.id} onClick={() => setPrefs({ theme: t.id })}>
              <span className="onb-swatch" style={{ background: t.swatch }} aria-hidden="true" />
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-group">
        <h3>Comfort</h3>
        <Toggle label="Reduce motion" hint="Calmer, fewer animations" checked={preferences.motion === "reduced"} onChange={(on) => setPrefs({ motion: on ? "reduced" : "full" })} />
        <Toggle label="Softer emotions" hint="Neko stays gentle and low-key" checked={preferences.emotionalIntensity === "soft"} onChange={(on) => setPrefs({ emotionalIntensity: on ? "soft" : "gentle" })} />
        <Toggle label="Reminders (coming soon)" hint="Saves your preferred tone for when reminders ship" checked={preferences.remindersEnabled} onChange={(on) => setPrefs({ remindersEnabled: on })} />
        {preferences.remindersEnabled && (
          <label>
            Preferred tone
            <select value={preferences.reminderStyle} onChange={(e) => setPrefs({ reminderStyle: e.target.value })}>
              {REMINDER_STYLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      <section className="settings-group">
        <h3>Your data</h3>
        <p className="settings-note">
          Everything lives only on this device, in your browser. No account, no server, no tracking. Export a backup anytime, clearing your browser data erases it.
        </p>
        <div className="settings-buttons">
          <button type="button" onClick={doExport}>⬇ Export backup</button>
          <button type="button" onClick={() => fileRef.current?.click()}>⬆ Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={doImport} />
        </div>
        {importError && <p className="settings-error" role="alert">{importError}</p>}

        {confirmReset ? (
          <div className="reset-confirm" role="alert">
            <p>This erases everything and starts fresh. Sure?</p>
            <div className="settings-buttons">
              <button type="button" onClick={() => setConfirmReset(false)}>Keep my world</button>
              <button type="button" className="sheet-danger" onClick={doReset}>Reset everything</button>
            </div>
          </div>
        ) : (
          <button type="button" className="reset-trigger sheet-danger" onClick={() => setConfirmReset(true)}>
            Reset app
          </button>
        )}
      </section>

      <p className="settings-version">Kawaii Habits v{APP_VERSION}</p>
    </Modal>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <button type="button" className={`toggle-row${checked ? " on" : ""}`} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-knob" />
      </span>
    </button>
  );
}
