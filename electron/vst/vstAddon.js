// Loads electron/vst/bin/<platform>-<arch>/vsthost.node, or explains why not.
// Windows-only for now (VST3 hosting on macOS needs AU/VST3 bundle loading and
// Cocoa editor windows — not built yet); every caller treats a null addon as
// "plugins unavailable" and the rest of the audio engine carries on.
const path = require("path");

let cached = null;

function load() {
  if (cached) return cached;
  if (process.platform !== "win32" || process.arch !== "x64") {
    cached = { addon: null, error: "VST plugins are only supported on Windows (x64) for now." };
    return cached;
  }
  // electron-builder unpacks *.node next to app.asar (asarUnpack) — require()
  // resolves the .asar path to the unpacked copy on its own.
  const file = path.join(__dirname, "bin", `${process.platform}-${process.arch}`, "vsthost.node");
  try {
    cached = { addon: require(file), error: null };
  } catch (err) {
    cached = { addon: null, error: `VST host failed to load: ${err && err.message}` };
  }
  return cached;
}

module.exports = { load };
