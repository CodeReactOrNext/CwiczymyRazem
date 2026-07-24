import { useEffect, useState } from "react";

interface ElectronWindowControlsState {
  isElectron: boolean;
  isMac: boolean;
  isMaximized: boolean;
}

const initialState: ElectronWindowControlsState = {
  isElectron: false,
  isMac: false,
  isMaximized: false,
};

/**
 * Shared state + actions for the frameless Electron window (see
 * electron/main.js): whether we're running desktop, the platform, current
 * maximized state, and the minimize/maximize/close actions. No-ops on the web
 * build, where `window.electronWindow` is undefined (consumers gate custom
 * chrome on `isElectron`).
 */
export const useElectronWindowControls = () => {
  const [{ isElectron, isMac, isMaximized }, setState] =
    useState(initialState);

  useEffect(() => {
    const api = window.electronWindow;
    if (!api) return undefined;

    // Both the initial reveal and later updates flow through async callbacks
    // (IPC round-trips), never a direct synchronous setState in the effect body.
    let cancelled = false;
    api.isMaximized().then((maximized) => {
      if (cancelled) return;
      setState({
        isElectron: true,
        isMac: api.platform === "darwin",
        isMaximized: maximized,
      });
    });

    const unsubscribe = api.onMaximizedChange((maximized) =>
      setState((s) => ({ ...s, isMaximized: maximized }))
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const api = typeof window !== "undefined" ? window.electronWindow : undefined;

  return {
    isElectron,
    isMac,
    isMaximized,
    minimize: () => api?.minimize(),
    toggleMaximize: () => api?.toggleMaximize(),
    close: () => api?.close(),
  };
};
