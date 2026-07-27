// Local persistence for the Tone Studio: user-saved presets (JSON) and imported
// cabinet IRs (raw Float32 PCM + metadata), under app.getPath("userData"). Mirrors
// windowState.js's defensive try/catch fs pattern. Built-in presets are NOT stored
// here — they're hardcoded on the renderer side (src/feature/toneStudio/data) and
// merged with these user entries at the hook level, so they can never be corrupted
// or deleted through this store.
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const { decodeWav } = require("./wavDecoder");
const { resampleLinear } = require("./resample");
const { MAX_IR_TAPS } = require("./dsp/convolver");

const PRESETS_FILE_NAME = "tone-presets.json";
const IR_DIR_NAME = "tone-irs";
const NAM_DIR_NAME = "tone-nam";

// Test-only seam: electron's `app` module only exists inside the real Electron
// runtime (a plain `require("electron")` under Node/Vitest returns a path string,
// not the API object), so tests inject a temp directory here instead.
let userDataDirOverride = null;
function _setUserDataDirForTests(dir) {
  userDataDirOverride = dir;
}
function userDataDir() {
  return userDataDirOverride ?? app.getPath("userData");
}

function presetsFilePath() {
  return path.join(userDataDir(), PRESETS_FILE_NAME);
}
function irDirPath() {
  return path.join(userDataDir(), IR_DIR_NAME);
}
function ensureIrDir() {
  try { fs.mkdirSync(irDirPath(), { recursive: true }); } catch { /* already exists */ }
}
function irMetaPath(id) { return path.join(irDirPath(), `${id}.json`); }
function irDataPath(id) { return path.join(irDirPath(), `${id}.f32`); }

function namDirPath() { return path.join(userDataDir(), NAM_DIR_NAME); }
function ensureNamDir() {
  try { fs.mkdirSync(namDirPath(), { recursive: true }); } catch { /* already exists */ }
}
function namMetaPath(id) { return path.join(namDirPath(), `${id}.json`); }
function namModelPath(id) { return path.join(namDirPath(), `${id}.nam`); }

// Copies a TypedArray's exact bytes into a standalone Buffer, regardless of any
// pooled/non-zero byteOffset on its underlying ArrayBuffer.
function float32ToBuffer(f32) {
  return Buffer.from(f32.buffer.slice(f32.byteOffset, f32.byteOffset + f32.byteLength));
}
// Inverse: always slices to a fresh, zero-offset ArrayBuffer before viewing as
// Float32Array — fs.readFileSync's Buffer can have a non-4-byte-aligned byteOffset
// into Node's internal buffer pool, which would otherwise throw.
function bufferToFloat32(buf) {
  return new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

function listPresets() {
  try {
    const raw = JSON.parse(fs.readFileSync(presetsFilePath(), "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return []; // first run or corrupted file
  }
}

function savePreset(preset) {
  const presets = listPresets();
  const idx = presets.findIndex((p) => p.id === preset.id);
  if (idx >= 0) presets[idx] = preset;
  else presets.push(preset);
  try { fs.writeFileSync(presetsFilePath(), JSON.stringify(presets)); } catch { /* best-effort */ }
  return preset;
}

function deletePreset(id) {
  const presets = listPresets().filter((p) => p.id !== id);
  try { fs.writeFileSync(presetsFilePath(), JSON.stringify(presets)); } catch { /* best-effort */ }
}

function listIRs() {
  ensureIrDir();
  try {
    return fs
      .readdirSync(irDirPath())
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        try { return JSON.parse(fs.readFileSync(path.join(irDirPath(), f), "utf8")); }
        catch { return null; }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// In-memory cache of resampled IRs, keyed by `${id}:${targetSr}` — the disk read +
// resample only happens once per unique IR/sample-rate pair per process lifetime.
const irSampleCache = new Map();

function importIR(filePath) {
  ensureIrDir();
  const fileBuffer = fs.readFileSync(filePath);
  const { sampleRate, samples } = decodeWav(fileBuffer);

  const truncated = samples.length > MAX_IR_TAPS;
  const stored = truncated ? samples.slice(0, MAX_IR_TAPS) : samples;

  const id = `ir_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const name = path.basename(filePath).replace(/\.wav$/i, "");
  const meta = {
    id,
    name,
    sampleRate,
    lengthSamples: stored.length,
    originalLengthSamples: samples.length,
    truncated,
    importedAt: Date.now(),
  };

  fs.writeFileSync(irDataPath(id), float32ToBuffer(stored));
  fs.writeFileSync(irMetaPath(id), JSON.stringify(meta));
  return meta;
}

function deleteIR(id) {
  try { fs.unlinkSync(irDataPath(id)); } catch { /* ignore */ }
  try { fs.unlinkSync(irMetaPath(id)); } catch { /* ignore */ }
  for (const key of Array.from(irSampleCache.keys())) {
    if (key.startsWith(`${id}:`)) irSampleCache.delete(key);
  }
}

/** Resolves an imported IR to Float32 samples resampled for `targetSr`, cached. */
function getIRSamples(id, targetSr) {
  if (!id) return null;
  const cacheKey = `${id}:${targetSr}`;
  if (irSampleCache.has(cacheKey)) return irSampleCache.get(cacheKey);

  let meta;
  try { meta = JSON.parse(fs.readFileSync(irMetaPath(id), "utf8")); }
  catch { return null; }

  let raw;
  try { raw = bufferToFloat32(fs.readFileSync(irDataPath(id))); }
  catch { return null; }

  const resampled = meta.sampleRate === targetSr ? raw : resampleLinear(raw, meta.sampleRate, targetSr);
  const capped = resampled.length > MAX_IR_TAPS ? resampled.slice(0, MAX_IR_TAPS) : resampled;
  irSampleCache.set(cacheKey, capped);
  return capped;
}

function listNamModels() {
  ensureNamDir();
  try {
    return fs
      .readdirSync(namDirPath())
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        try { return JSON.parse(fs.readFileSync(path.join(namDirPath(), f), "utf8")); }
        catch { return null; }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// .nam files are already JSON, so unlike IRs there's no format conversion —
// just a sidecar metadata file (mirroring the IR pattern) alongside the raw
// file, so listing doesn't have to re-parse a potentially multi-MB weights
// array just to show a name in the UI.
function importNamModel(filePath) {
  ensureNamDir();
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw); // throws on invalid JSON -- caller (main.js) surfaces it as a rejected IPC call
  if (!parsed.architecture || !parsed.weights) {
    throw new Error("This doesn't look like a valid .nam model file (missing architecture/weights).");
  }

  const id = `nam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const name = path.basename(filePath).replace(/\.nam$/i, "");
  const meta = {
    id,
    name,
    architecture: parsed.architecture,
    gearMake: parsed.metadata?.gear_make ?? null,
    gearModel: parsed.metadata?.gear_model ?? null,
    importedAt: Date.now(),
  };

  fs.writeFileSync(namModelPath(id), raw);
  fs.writeFileSync(namMetaPath(id), JSON.stringify(meta));
  return meta;
}

function deleteNamModel(id) {
  try { fs.unlinkSync(namModelPath(id)); } catch { /* ignore */ }
  try { fs.unlinkSync(namMetaPath(id)); } catch { /* ignore */ }
}

/** Resolves an imported NAM model id to its raw .nam JSON text, or null. */
function getNamModelJson(id) {
  if (!id) return null;
  try { return fs.readFileSync(namModelPath(id), "utf8"); }
  catch { return null; }
}

module.exports = {
  listPresets, savePreset, deletePreset,
  listIRs, deleteIR, importIR, getIRSamples,
  listNamModels, deleteNamModel, importNamModel, getNamModelJson,
  _setUserDataDirForTests,
};
