import { useRef, useState } from "react";
import { KawaiiIcon } from "../components/KawaiiIcon";
import { ThemeArtwork } from "../components/ThemeArtwork";
import { Modal } from "./Modal";
import { defaultState, exportState, importState } from "./appState";
import { THEMES } from "./presets";

const APP_VERSION = "1.1.0";
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
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kawaii-habits-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
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
        setImportError(error.message || "We could not read that backup. Choose a JSON backup exported by Kawaii Habits.");
      }
    };
    reader.onerror = () => setImportError("We could not open that file. Try exporting or selecting the backup again.");
    reader.readAsText(file);
  }

  function doReset() {
    onUpdate(() => defaultState());
    onClose();
  }

  return (
    <Modal
      title="Settings"
      onClose={onClose}
      className={`settings-panel settings-panel--${preferences.theme}`}
    >
      <header className="modal-heading settings-heading">
        <div><p className="section-kicker">Make the garden comfortable</p><h2>Settings</h2></div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close settings"><KawaiiIcon name="close" /></button>
      </header>

      <div className="settings-scroll">
        <section className="settings-group" aria-labelledby="settings-profile">
          <h3 id="settings-profile"><KawaiiIcon name="neko" size={18} /> You and your garden</h3>
          <div className="settings-field-grid">
            <label className="field"><span>Your name <small>optional</small></span><input value={profile.userName} onChange={(event) => setProfile({ userName: event.target.value })} placeholder="What should Neko call you?" /></label>
            <label className="field"><span>Companion name</span><input value={profile.nekoName} onChange={(event) => setProfile({ nekoName: event.target.value })} /></label>
            <label className="field wide"><span>Garden name</span><input value={profile.worldName} onChange={(event) => setProfile({ worldName: event.target.value })} /></label>
          </div>
        </section>

        <section className="settings-group" aria-labelledby="settings-theme">
          <h3 id="settings-theme"><KawaiiIcon name="sun" size={18} /> Atmosphere</h3>
          <div className="settings-theme-grid">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={`settings-theme theme-${theme.id}${preferences.theme === theme.id ? " is-selected" : ""}`}
                aria-pressed={preferences.theme === theme.id}
                onClick={() => setPrefs({ theme: theme.id })}
              >
                <span aria-hidden="true"><ThemeArtwork theme={theme.id} /></span>
                <strong>{theme.name}</strong>
                <small>{theme.description}</small>
                <i aria-hidden="true">{preferences.theme === theme.id && <KawaiiIcon name="check" size={15} />}</i>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-group" aria-labelledby="settings-comfort">
          <h3 id="settings-comfort"><KawaiiIcon name="heart" size={18} /> Comfort</h3>
          <div className="toggle-list">
            <Toggle label="Reduce motion" hint="Turn off animated movement" checked={preferences.motion === "reduced"} onChange={(on) => setPrefs({ motion: on ? "reduced" : "full" })} />
          </div>
          <p className="settings-note">Kawaii Habits stays quiet in the background. It does not schedule system notifications or pressure you to return.</p>
        </section>

        <section className="settings-group" aria-labelledby="settings-data">
          <h3 id="settings-data"><KawaiiIcon name="lock" size={18} /> Your data</h3>
          <p className="settings-note">Your habits stay on this device. There is no account, advertising tracker, or cloud copy. Export a backup before clearing browser storage or moving to another device.</p>
          <div className="settings-buttons">
            <button type="button" className="secondary-button" onClick={doExport}><KawaiiIcon name="download" size={18} /> Export backup</button>
            <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}><KawaiiIcon name="upload" size={18} /> Import backup</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={doImport} />
          </div>
          {importError && <p className="settings-error" role="alert"><KawaiiIcon name="heart" size={18} /> {importError}</p>}

          {confirmReset ? (
            <div className="reset-confirm" role="alert">
              <div><strong>Reset this garden?</strong><p>This permanently erases local habits, history, notes, and settings from this device.</p></div>
              <div className="settings-buttons">
                <button type="button" className="secondary-button" onClick={() => setConfirmReset(false)}>Keep my garden</button>
                <button type="button" className="danger-button" onClick={doReset}>Reset everything</button>
              </div>
            </div>
          ) : (
            <button type="button" className="text-danger-button" onClick={() => setConfirmReset(true)}><KawaiiIcon name="trash" size={18} /> Reset app data</button>
          )}
        </section>

        <footer className="settings-footer"><KawaiiIcon name="leaf" size={16} /> Kawaii Habits v{APP_VERSION}. Private, local, and offline-first.</footer>
      </div>
    </Modal>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <button type="button" className={`toggle-row${checked ? " is-on" : ""}`} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
      <span className="toggle-track" aria-hidden="true"><span className="toggle-knob" /></span>
    </button>
  );
}
