// Page zoom for the main window. The title bar's −/+ buttons, the View menu and
// its shortcuts, and Ctrl+wheel all step through the same levels here, so the
// percentage the title bar shows is always the real one. Saved in userData:
// Chromium forgets a page's zoom between launches.
const fs = require("fs");
const path = require("path");

const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
const EPSILON = 0.001;

/** The next level from `current` in `direction` (1 in, -1 out); stays put at either end. */
function stepZoom(current, direction) {
  if (direction > 0) return ZOOM_STEPS.find((step) => step > current + EPSILON) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
  return [...ZOOM_STEPS].reverse().find((step) => step < current - EPSILON) ?? ZOOM_STEPS[0];
}

/** A saved factor back on the ladder — a hand-edited or corrupt file can't zoom to 0 or 50×. */
function clampZoom(factor) {
  if (!Number.isFinite(factor)) return 1;
  return Math.min(ZOOM_STEPS[ZOOM_STEPS.length - 1], Math.max(ZOOM_STEPS[0], factor));
}

function createZoom({ getWindow, filePath }) {
  let factor = 1;
  try {
    factor = clampZoom(JSON.parse(fs.readFileSync(filePath, "utf8")).factor);
  } catch {
    /* first run or unreadable — 100% */
  }

  const contents = () => {
    const win = getWindow();
    return win && !win.isDestroyed() ? win.webContents : null;
  };

  /** Puts the current factor on the page and tells the title bar. */
  const apply = () => {
    const wc = contents();
    if (!wc) return factor;
    wc.setZoomFactor(factor);
    wc.send("window:zoom-changed", factor);
    return factor;
  };

  const set = (next) => {
    factor = clampZoom(next);
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify({ factor }));
    } catch {
      /* best-effort — the zoom still applies for this launch */
    }
    return apply();
  };

  return {
    get: () => factor,
    apply,
    zoomIn: () => set(stepZoom(factor, 1)),
    zoomOut: () => set(stepZoom(factor, -1)),
    reset: () => set(1),
  };
}

module.exports = { ZOOM_STEPS, stepZoom, clampZoom, createZoom };
