// Loads electron/vst/bin/<platform>-<arch>/vsthost.node, or explains why not.
// Windows x64 and Apple Silicon macOS; every caller treats a null addon as
// "plugins unavailable" and the rest of the audio engine carries on.
const path = require("path");

const SUPPORTED = ["win32-x64", "darwin-arm64"];

let cached = null;

function load() {
  if (cached) return cached;
  const target = `${process.platform}-${process.arch}`;
  if (!SUPPORTED.includes(target)) {
    cached = { addon: null, error: "VST plugins are only supported on Windows (x64) and Apple Silicon Macs for now." };
    return cached;
  }
  // electron-builder unpacks *.node next to app.asar (asarUnpack) — require()
  // resolves the .asar path to the unpacked copy on its own.
  const file = path.join(__dirname, "bin", target, "vsthost.node");
  try {
    cached = { addon: require(file), error: null };
  } catch (err) {
    cached = { addon: null, error: `VST host failed to load: ${err && err.message}` };
  }
  return cached;
}

/** What ./vstRack drives. Windows: the addon itself — the rack and its plugins
 *  share the audio process. macOS: a stand-in whose plugins live in the main
 *  process (see ./vstRemote for why). */
function loadForRack() {
  const { addon, error } = load();
  if (!addon || process.platform !== "darwin") return { addon, error };
  if (!process.parentPort) return { addon: null, error: "VST plugins on macOS need the app's main process to host them." };
  return { addon: require("./vstRemote").connectAudioProcess(addon), error: null };
}

module.exports = { load, loadForRack };
