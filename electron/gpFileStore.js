// Local Guitar Pro library for the desktop app. The web build keeps GP files in
// Firebase Storage, capped at 1.5 MB / 50 files because every byte there is
// paid for; on the desktop they are copied into userData/gp-files/ instead, so
// neither cap applies. They stay on this computer — no sync to the web or to
// another machine (feature/songs/services/userGpFiles.service merges both lists
// and marks these as desktop-only).
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const FILE_DIR_NAME = "gp-files";

const SUPPORTED_EXTENSIONS = [".gp3", ".gp4", ".gp5", ".gpx", ".gp"];

// Not a quota — a guard against a mistake (a video renamed to .gp). Real Guitar
// Pro files with embedded audio top out around 20–30 MB, and the renderer holds
// the whole file in memory while it parses it.
const MAX_FILE_BYTES = 100 * 1024 * 1024;

// Ids are generated here, but they come back over IPC from a web page, so they
// are checked before they ever become part of a path.
const ID_PATTERN = /^gpl_[a-z0-9_]+$/;

// Folder ids are Firestore document ids (folders stay in the cloud for both kinds
// of file), stored here as plain strings.
const FOLDER_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

// Test-only seam — same reason as backingTrackStore.js: electron's `app` module
// doesn't exist under plain Node/Vitest, so tests inject a temp directory here.
let userDataDirOverride = null;
function _setUserDataDirForTests(dir) {
  userDataDirOverride = dir;
}
function userDataDir() {
  return userDataDirOverride ?? app.getPath("userData");
}

function fileDirPath() {
  return path.join(userDataDir(), FILE_DIR_NAME);
}
function ensureFileDir() {
  try { fs.mkdirSync(fileDirPath(), { recursive: true }); } catch { /* already exists */ }
}
function metaPath(id) {
  return path.join(fileDirPath(), `${id}.json`);
}
function dataPath(id, ext) {
  return path.join(fileDirPath(), `${id}${ext}`);
}

function gpExtension(fileName) {
  const lower = String(fileName).toLowerCase();
  return SUPPORTED_EXTENSIONS.find((ext) => lower.endsWith(ext)) ?? null;
}

function normalizeFolderId(folderId) {
  return typeof folderId === "string" && FOLDER_ID_PATTERN.test(folderId) ? folderId : null;
}

function readMeta(id) {
  if (!ID_PATTERN.test(String(id))) return null;
  try { return JSON.parse(fs.readFileSync(metaPath(id), "utf8")); }
  catch { return null; }
}

function writeMeta(meta) {
  fs.writeFileSync(metaPath(meta.id), JSON.stringify(meta));
}

function listFiles() {
  ensureFileDir();
  try {
    return fs
      .readdirSync(fileDirPath())
      .filter((f) => f.endsWith(".json"))
      .map((f) => readMeta(f.slice(0, -".json".length)))
      .filter(Boolean)
      .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
  } catch {
    return [];
  }
}

/**
 * Stores one file the renderer already holds in memory (picked through an
 * <input>, dropped, or imported in the song picker). Throws — surfaced as a
 * rejected IPC call — on a non-GP name or an implausibly large file.
 */
function saveFile(name, data, folderId = null) {
  ensureFileDir();

  const fileName = path.basename(String(name ?? "")).trim();
  const ext = gpExtension(fileName);
  if (!fileName || !ext) {
    throw new Error(`"${fileName || "(no name)"}" is not a Guitar Pro file — use ${SUPPORTED_EXTENSIONS.join(", ")}.`);
  }

  const bytes = Buffer.from(data ?? []);
  if (bytes.length === 0) throw new Error(`"${fileName}" is empty.`);
  if (bytes.length > MAX_FILE_BYTES) {
    throw new Error(`"${fileName}" is ${Math.round(bytes.length / 1024 / 1024)} MB — the limit is ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
  }

  const id = `gpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const meta = {
    id,
    name: fileName,
    ext,
    size: bytes.length,
    savedAt: Date.now(),
    folderId: normalizeFolderId(folderId),
  };

  fs.writeFileSync(dataPath(id, ext), bytes);
  writeMeta(meta);
  return meta;
}

/** Raw bytes of one file — the renderer wraps them in a File for the GP parser. */
function readFile(id) {
  const meta = readMeta(id);
  if (!meta) return null;
  try {
    return { id: meta.id, name: meta.name, data: fs.readFileSync(dataPath(id, meta.ext)) };
  } catch {
    return null;
  }
}

function moveFile(id, folderId) {
  const meta = readMeta(id);
  if (!meta) return null;
  const next = { ...meta, folderId: normalizeFolderId(folderId) };
  writeMeta(next);
  return next;
}

function deleteFile(id) {
  const meta = readMeta(id);
  if (!meta) return;
  try { fs.unlinkSync(dataPath(id, meta.ext)); } catch { /* already gone */ }
  try { fs.unlinkSync(metaPath(id)); } catch { /* already gone */ }
}

module.exports = {
  SUPPORTED_EXTENSIONS,
  MAX_FILE_BYTES,
  listFiles,
  saveFile,
  readFile,
  moveFile,
  deleteFile,
  _setUserDataDirForTests,
};
