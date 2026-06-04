import { useCallback, useEffect, useState } from "react";
import { loadAppState, saveAppState } from "./appState";

// Owns the whole versioned state object and persists it. `patch` shallow-merges
// top-level slices; `update` takes a full updater for finer control.
export function useAppState() {
  const [state, setState] = useState(loadAppState);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  // Reflect theme + motion choices on the document so CSS can react globally.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", state.preferences.theme || "midnight-sakura");
    root.setAttribute("data-motion", state.preferences.motion || "full");
  }, [state.preferences.theme, state.preferences.motion]);

  const update = useCallback((updater) => {
    setState((current) => (typeof updater === "function" ? updater(current) : updater));
  }, []);

  const patch = useCallback((partial) => {
    setState((current) => ({ ...current, ...partial }));
  }, []);

  return [state, { update, patch, setState }];
}
