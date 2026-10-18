// On-disk state for VST hosting, under app.getPath("userData"):
//   vst-plugins.json    the plugin library: what scanning found plus the files
//                       and folders the player added by hand (written by
//                       ./vstScanner in the main process, read by ./vstRack in
//                       the audio process to turn a plugin id into a file path)
//   vst-rack.json       the player's rack — which plugins, in which order,
//                       which are bypassed (written by ./vstRack)
//   vst-states/<slot>.bin  each rack slot's plugin settings, saved whenever its
//                       window closes / it is unloaded, restored when it loads
//
// Settings belong to a rack slot, not to a plugin: the same EQ can sit in the
// rack twice with two different curves.
const fs = require("fs");
const path = require("path");

const CATALOG_FILE = "vst-plugins.json";
const RACK_FILE = "vst-rack.json";
const STATES_DIR = "vst-states";
const CATALOG_VERSION = 1;
// VST3 class ids are 32 hex chars, rack slot ids 16. Nothing else may ever
// become part of a file path.
const PLUGIN_ID_RE = /^[0-9A-F]{32}$/i;
const SLOT_ID_RE = /^[0-9a-f]{16}$/i;

let userDataDirOverride = null;

function setUserDataDir(dir) {
  userDataDirOverride = dir;
}

function userDataDir() {
  if (userDataDirOverride) return userDataDirOverride;
  let app = null;
  try { ({ app } = require("electron")); } catch { /* plain node (tests) */ }
  if (!app || typeof app.getPath !== "function") {
    throw new Error("vstStore: userData directory not configured (call setUserDataDir outside the main process)");
  }
  return app.getPath("userData");
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(path.join(userDataDir(), file), "utf8")); } catch { return null; }
}

function writeJsonSync(file, data) {
  const target = path.join(userDataDir(), file);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, target);
}

// ── Library ──────────────────────────────────────────────────────────────────

function emptyCatalog() {
  return {
    version: CATALOG_VERSION,
    scannedAt: null,
    plugins: [],
    failed: [],
    fingerprints: {},
    sources: { folders: [], files: [] },
  };
}

function readCatalog() {
  const raw = readJson(CATALOG_FILE);
  if (!raw || raw.version !== CATALOG_VERSION) return emptyCatalog();
  const arr = (v) => (Array.isArray(v) ? v : []);
  const sources = raw.sources && typeof raw.sources === "object" ? raw.sources : {};
  return {
    ...emptyCatalog(),
    ...raw,
    plugins: arr(raw.plugins),
    failed: arr(raw.failed),
    fingerprints: raw.fingerprints && typeof raw.fingerprints === "object" ? raw.fingerprints : {},
    sources: { folders: arr(sources.folders), files: arr(sources.files) },
  };
}

function writeCatalog(catalog) {
  writeJsonSync(CATALOG_FILE, { ...catalog, version: CATALOG_VERSION });
}

function findPlugin(id) {
  if (!id) return null;
  const wanted = String(id).toUpperCase();
  return readCatalog().plugins.find((p) => String(p.id).toUpperCase() === wanted) || null;
}

// ── Rack ─────────────────────────────────────────────────────────────────────

/** [{ id, pluginId, name, vendor, bypass }] — invalid entries are dropped. */
function readRack() {
  const raw = readJson(RACK_FILE);
  const slots = raw && Array.isArray(raw.slots) ? raw.slots : [];
  return slots
    .filter((s) => s && SLOT_ID_RE.test(String(s.id)) && PLUGIN_ID_RE.test(String(s.pluginId)))
    .map((s) => ({
      id: String(s.id).toLowerCase(),
      pluginId: String(s.pluginId).toUpperCase(),
      name: String(s.name || ""),
      vendor: String(s.vendor || ""),
      bypass: !!s.bypass,
    }));
}

/** Async: called from the audio process (its event loop is the audio thread). */
async function writeRack(slots) {
  const target = path.join(userDataDir(), RACK_FILE);
  const tmp = `${target}.tmp`;
  await fs.promises.writeFile(tmp, JSON.stringify({ slots }, null, 2));
  await fs.promises.rename(tmp, target);
}

// ── Per-slot plugin settings ────────────────────────────────────────────────

function statePath(slotId) {
  if (!SLOT_ID_RE.test(String(slotId || ""))) return null;
  return path.join(userDataDir(), STATES_DIR, `${String(slotId).toLowerCase()}.bin`);
}

function readState(slotId) {
  const file = statePath(slotId);
  if (!file) return null;
  try { return fs.readFileSync(file); } catch { return null; }
}

/** Async on purpose — see writeRack. */
async function writeState(slotId, buf) {
  const file = statePath(slotId);
  if (!file || !buf || !buf.length) return false;
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.promises.writeFile(tmp, buf);
  await fs.promises.rename(tmp, file);
  return true;
}

async function deleteState(slotId) {
  const file = statePath(slotId);
  if (!file) return;
  try { await fs.promises.unlink(file); } catch { /* never saved */ }
}

module.exports = {
  setUserDataDir,
  readCatalog,
  writeCatalog,
  emptyCatalog,
  findPlugin,
  readRack,
  writeRack,
  readState,
  writeState,
  deleteState,
  PLUGIN_ID_RE,
  SLOT_ID_RE,
};
