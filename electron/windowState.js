// Persists the main window's bounds + maximized state between launches.
// Stored as JSON in userData; loading validates the saved position against the
// current display layout so an unplugged monitor can't leave the window
// stranded off-screen (falls back to centering on the default display).
const fs = require("fs");
const path = require("path");
const { app, screen } = require("electron");

const STATE_FILE_NAME = "window-state.json";
const EDGE_MARGIN = 40; // px of the window that must remain reachable

function stateFilePath() {
  return path.join(app.getPath("userData"), STATE_FILE_NAME);
}

/** Returns { width, height, x?, y?, isMaximized? } — safe to spread into
 *  BrowserWindow options. Call after app "ready" (screen module dependency). */
function loadState(defaults) {
  let saved = null;
  try {
    saved = JSON.parse(fs.readFileSync(stateFilePath(), "utf8"));
  } catch {
    /* first run or corrupted file — use defaults */
  }
  const state = { ...defaults };
  if (saved && typeof saved === "object") {
    if (Number.isFinite(saved.width) && saved.width >= 400) state.width = Math.round(saved.width);
    if (Number.isFinite(saved.height) && saved.height >= 300) state.height = Math.round(saved.height);
    if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      state.x = Math.round(saved.x);
      state.y = Math.round(saved.y);
    }
    state.isMaximized = saved.isMaximized === true;
  }

  if (typeof state.x === "number" && typeof state.y === "number") {
    const visible = screen.getAllDisplays().some(({ workArea }) => {
      return (
        state.x < workArea.x + workArea.width - EDGE_MARGIN &&
        state.x + state.width > workArea.x + EDGE_MARGIN &&
        state.y >= workArea.y - 10 &&
        state.y < workArea.y + workArea.height - EDGE_MARGIN
      );
    });
    if (!visible) {
      delete state.x;
      delete state.y; // Electron centers when x/y are omitted
    }
  }
  return state;
}

/** Saves bounds on window close (normal bounds, so un-maximizing after a
 *  restart restores the pre-maximize size). */
function trackWindow(win) {
  win.on("close", () => {
    if (win.isDestroyed()) return;
    try {
      const bounds = win.getNormalBounds();
      fs.writeFileSync(
        stateFilePath(),
        JSON.stringify({ ...bounds, isMaximized: win.isMaximized() }),
      );
    } catch {
      /* best-effort — never block closing */
    }
  });
}

module.exports = { loadState, trackWindow };
