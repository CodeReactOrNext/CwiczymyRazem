// Local persistence for song backing tracks: the audio files themselves (copied
// into userData/backing-tracks/ on import, exactly like toneStore.js does with
// cabinet IRs) plus a per-song "assignment" recording which track a song plays
// and how it is aligned with the tab.
//
// Only the file-based source lives here. YouTube backing tracks are device
// independent, so their config stays in Firestore
// (users/{uid}/userSongs/{songId}.backingSync) and never touches this store.
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const TRACK_DIR_NAME = "backing-tracks";
const ASSIGNMENTS_FILE_NAME = "backing-assignments.json";

// Containers Chromium can decode in a plain <audio> element — the renderer plays
// these back through a media element (not an AudioBufferSourceNode) because only
// the element does pitch-preserving time stretching.
const MIME_BY_EXT = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".opus": "audio/ogg",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".webm": "audio/webm",
};

/** Extensions (no dot) for the native file picker's filter list. */
const SUPPORTED_EXTENSIONS = Object.keys(MIME_BY_EXT).map((e) => e.slice(1));

// A backing track is one song. Anything past this is a mistake (a whole album,
// a video file renamed), and the renderer has to hold the bytes in memory.
const MAX_TRACK_BYTES = 60 * 1024 * 1024;

// Test-only seam — same reason as toneStore.js: electron's `app` module doesn't
// exist under plain Node/Vitest, so tests inject a temp directory here.
let userDataDirOverride = null;
function _setUserDataDirForTests(dir) {
  userDataDirOverride = dir;
}
function userDataDir() {
  return userDataDirOverride ?? app.getPath("userData");
}

function trackDirPath() {
  return path.join(userDataDir(), TRACK_DIR_NAME);
}
function ensureTrackDir() {
  try { fs.mkdirSync(trackDirPath(), { recursive: true }); } catch { /* already exists */ }
}
function trackMetaPath(id) {
  return path.join(trackDirPath(), `${id}.json`);
}
function trackDataPath(id, ext) {
  return path.join(trackDirPath(), `${id}${ext}`);
}
function assignmentsFilePath() {
  return path.join(userDataDir(), ASSIGNMENTS_FILE_NAME);
}

// ── Track library ───────────────────────────────────────────────────────────

function listTracks() {
  ensureTrackDir();
  try {
    return fs
      .readdirSync(trackDirPath())
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        try { return JSON.parse(fs.readFileSync(path.join(trackDirPath(), f), "utf8")); }
        catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => (b.importedAt ?? 0) - (a.importedAt ?? 0));
  } catch {
    return [];
  }
}

/** Copies `filePath` into the store. Throws (surfaced as a rejected IPC call) on
 *  an unsupported container or an implausibly large file. */
function importTrack(filePath) {
  ensureTrackDir();

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_BY_EXT[ext];
  if (!mimeType) {
    throw new Error(`Unsupported audio format "${ext || "(none)"}" — use ${SUPPORTED_EXTENSIONS.join(", ")}.`);
  }

  const { size } = fs.statSync(filePath);
  if (size > MAX_TRACK_BYTES) {
    throw new Error(`That file is ${Math.round(size / 1024 / 1024)} MB — backing tracks are capped at ${MAX_TRACK_BYTES / 1024 / 1024} MB.`);
  }

  const id = `bt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const fileName = path.basename(filePath);
  const meta = {
    id,
    name: fileName.slice(0, fileName.length - ext.length),
    fileName,
    ext,
    mimeType,
    size,
    importedAt: Date.now(),
  };

  fs.copyFileSync(filePath, trackDataPath(id, ext));
  fs.writeFileSync(trackMetaPath(id), JSON.stringify(meta));
  return meta;
}

function readTrackMeta(id) {
  try { return JSON.parse(fs.readFileSync(trackMetaPath(id), "utf8")); }
  catch { return null; }
}

/** Raw bytes for one track. The renderer wraps them in a Blob + object URL —
 *  the window is served from https://riff.quest, so a file:// src is a non-starter. */
function readTrack(id) {
  const meta = readTrackMeta(id);
  if (!meta) return null;
  try {
    const data = fs.readFileSync(trackDataPath(id, meta.ext));
    return { id: meta.id, name: meta.name, mimeType: meta.mimeType, data };
  } catch {
    return null;
  }
}

function deleteTrack(id) {
  const meta = readTrackMeta(id);
  if (meta) {
    try { fs.unlinkSync(trackDataPath(id, meta.ext)); } catch { /* already gone */ }
  }
  try { fs.unlinkSync(trackMetaPath(id)); } catch { /* already gone */ }

  // Songs using this track would keep a dangling id forever. Drop the stem, but
  // keep the assignment: its offset and tempo still describe the other stems.
  const assignments = listAssignments();
  let changed = false;
  for (const [songId, stored] of Object.entries(assignments)) {
    const assignment = migrateAssignment(stored);
    if (!assignment?.stems?.some((stem) => stem.trackId === id)) continue;
    assignments[songId] = {
      ...assignment,
      stems: assignment.stems.filter((stem) => stem.trackId !== id),
    };
    changed = true;
  }
  if (changed) writeAssignments(assignments);
}

// ── Per-song assignment (which track, and how it lines up with the tab) ──────

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

const DEFAULT_ASSIGNMENT = {
  /** Stems of the same recording — backing, guitar, vocals — in listening order.
   *  They share one timeline, so offset and tempo below are per song, not per stem. */
  stems: [],
  /** Where in the recording the tab's beat 0 lands. Negative = it starts late. */
  offsetMs: 0,
  /** Tempo the recording itself runs at — the divisor for the playback rate. */
  sourceBpm: 120,
  /** Bars pinned to where they actually land in a recording that drifts.
   *  Empty means sourceBpm holds for the whole song. */
  tempoAnchors: [],
  /** Master level over every stem. */
  volume: 0.8,
  muted: false,
};

/** Max stems per song. Each one is a decoded audio element held in memory. */
const MAX_STEMS = 8;

/** Cap on tempo anchors, so a corrupt file can never stall start-up. */
const MAX_ANCHORS = 512;

/**
 * Anchors are read back from a JSON file the user could have edited, so only
 * well-formed entries survive. Bar 1 is the offset, hence beat > 0; anything
 * else would give the tempo map two conflicting names for the same point.
 */
function normalizeAnchors(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => ({ beat: Number(entry?.beat), sec: Number(entry?.sec) }))
    .filter((a) => Number.isFinite(a.beat) && Number.isFinite(a.sec) && a.beat > 0)
    .sort((a, b) => a.beat - b.beat)
    .slice(0, MAX_ANCHORS);
}

function normalizeStems(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const stems = [];
  for (const entry of raw) {
    const trackId = typeof entry === "string" ? entry : entry?.trackId;
    if (typeof trackId !== "string" || seen.has(trackId)) continue;
    seen.add(trackId);
    stems.push({
      trackId,
      volume: clampNumber(entry?.volume, 0, 1, 1),
      muted: !!entry?.muted,
      offsetMs: clampNumber(entry?.offsetMs, -60_000, 60_000, 0),
    });
    if (stems.length >= MAX_STEMS) break;
  }
  return stems;
}

/**
 * Assignments written before stems existed hold a single `trackId`. Reading one
 * as the first stem keeps every already-aligned song working untouched.
 */
function migrateAssignment(stored) {
  if (!stored) return null;
  if (Array.isArray(stored.stems)) return stored;
  const { trackId, ...rest } = stored;
  return {
    ...rest,
    stems: typeof trackId === "string" ? [{ trackId, volume: 1, muted: false, offsetMs: 0 }] : [],
  };
}

function normalizeAssignment(patch, previous) {
  const base = { ...DEFAULT_ASSIGNMENT, ...(migrateAssignment(previous) ?? {}) };
  const next = { ...base };

  if ("stems" in patch) next.stems = normalizeStems(patch.stems);
  if ("offsetMs" in patch) next.offsetMs = clampNumber(patch.offsetMs, -60_000, 60_000, base.offsetMs);
  if ("sourceBpm" in patch) next.sourceBpm = clampNumber(patch.sourceBpm, 20, 400, base.sourceBpm);
  if ("tempoAnchors" in patch) next.tempoAnchors = normalizeAnchors(patch.tempoAnchors);
  if ("volume" in patch) next.volume = clampNumber(patch.volume, 0, 1, base.volume);
  if ("muted" in patch) next.muted = !!patch.muted;

  next.updatedAt = Date.now();
  return next;
}

function listAssignments() {
  try {
    const raw = JSON.parse(fs.readFileSync(assignmentsFilePath(), "utf8"));
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {}; // first run or corrupted file
  }
}

function writeAssignments(assignments) {
  try { fs.writeFileSync(assignmentsFilePath(), JSON.stringify(assignments)); }
  catch { /* best-effort */ }
}

function getAssignment(songId) {
  if (!songId) return null;
  return migrateAssignment(listAssignments()[songId]) ?? null;
}

/** Merge-writes one song's assignment and returns the stored result. */
function saveAssignment(songId, patch) {
  if (!songId || !patch || typeof patch !== "object") return null;
  const assignments = listAssignments();
  const next = normalizeAssignment(patch, assignments[songId]);
  assignments[songId] = next;
  writeAssignments(assignments);
  return next;
}

function clearAssignment(songId) {
  if (!songId) return;
  const assignments = listAssignments();
  if (!(songId in assignments)) return;
  delete assignments[songId];
  writeAssignments(assignments);
}

module.exports = {
  SUPPORTED_EXTENSIONS,
  MAX_TRACK_BYTES,
  MAX_STEMS,
  listTracks,
  importTrack,
  readTrack,
  deleteTrack,
  getAssignment,
  saveAssignment,
  clearAssignment,
  listAssignments,
  _setUserDataDirForTests,
};
