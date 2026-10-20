// Main-process side of the plugin library: finds VST3 files in the standard
// folders plus any file/folder the player added by hand, reads what each
// contains through ./vstScanProcess (isolated — see there), and keeps the result
// in ./vstStore's catalog. Nothing is scanned until the player asks (a full
// first scan loads every plugin DLL and can take a minute). Incremental: a file
// whose size/mtime didn't change is not loaded again.
const fs = require("fs");
const path = require("path");

const vstStore = require("./vstStore");

// A healthy plugin reads in well under this (Archetype Petrucci: ~3 s incl.
// licence check); one without a licence can sit on its check until killed.
const SCAN_TIMEOUT_MS = 20000;
// Scanner processes working side by side — the hung ones then cost one timeout
// per worker rather than one each, in series.
const SCAN_WORKERS = 3;

/** Effects only: the amp slot is mono-in audio, instruments make no sense there. */
function isEffect(cls) {
  if (cls.category !== "Audio Module Class") return false;
  const subs = String(cls.subCategories || "").split("|");
  return !subs.includes("Instrument");
}

/** A plugin that refuses to load is nearly always one the user has no licence
 *  or activation for (that's what killed DllMain for the Archetypes during the
 *  spike) — say that instead of a raw Win32 error. */
function friendlyError(raw) {
  const msg = String(raw || "");
  // macOS (CFBundle): an Intel-only plugin can't load into the arm64 app.
  if (/current architecture|incompatible architecture/i.test(msg)) return "This plugin isn't built for Apple Silicon (no arm64 version).";
  if (/LoadLibrary|couldn.t be loaded|bundleEntry|Could not create Bundle/i.test(msg)) {
    return "The plugin refused to load — usually a missing licence or activation.";
  }
  if (/timed out/i.test(msg)) return "The plugin took too long to load (maybe waiting on a hidden dialog).";
  if (/crashed|exited/i.test(msg)) return "The plugin crashed while loading.";
  return msg || "Could not read the plugin.";
}

function fingerprintOf(modulePath) {
  try {
    let st = fs.statSync(modulePath);
    // A macOS bundle folder's own mtime doesn't follow an update — its binary's does.
    const binary = path.join(modulePath, "Contents", "MacOS", path.basename(modulePath, ".vst3"));
    if (st.isDirectory() && fs.existsSync(binary)) st = fs.statSync(binary);
    return `${st.size}:${Math.round(st.mtimeMs)}`;
  } catch {
    return null;
  }
}

/**
 * Pure catalog builder (unit-tested): `scanOne(path)` resolves
 * `{ ok: true, classes }` or `{ ok: false, error }` and never rejects. Pass an
 * array of them to scan in parallel lanes (one per isolated process).
 */
async function buildCatalog({ paths, previous, force, retryFailed, fingerprint, scanOne, onProgress }) {
  const prev = force || !previous ? vstStore.emptyCatalog() : previous;
  const plugins = [];
  const failed = [];
  const fingerprints = {};
  const todo = [];

  for (const p of paths) {
    const fp = fingerprint(p);
    fingerprints[p] = fp;
    const failedBefore = prev.failed.some((x) => x.path === p);
    // A licence bought since doesn't change the file, so "Rescan" retries every
    // failure; automatic listing doesn't (each hung plugin costs a timeout).
    if (fp && prev.fingerprints[p] === fp && !(retryFailed && failedBefore)) {
      plugins.push(...prev.plugins.filter((x) => x.path === p));
      failed.push(...prev.failed.filter((x) => x.path === p));
    } else {
      todo.push(p);
    }
  }

  const results = new Array(todo.length);
  let next = 0;
  let done = 0;
  const worker = async (scanWith) => {
    while (next < todo.length) {
      const i = next++;
      onProgress?.({ done, total: todo.length, current: path.basename(todo[i]) });
      results[i] = await scanWith(todo[i]);
      done++;
    }
  };
  const lanes = Array.isArray(scanOne) ? scanOne : [scanOne];
  await Promise.all(lanes.map(worker));

  for (let i = 0; i < todo.length; i++) {
    const p = todo[i];
    const res = results[i];
    if (res.ok) {
      for (const cls of res.classes.filter(isEffect)) {
        plugins.push({
          id: String(cls.uid).toUpperCase(),
          name: cls.name,
          vendor: cls.vendor || "",
          subCategories: cls.subCategories || "",
          version: cls.version || "",
          path: p,
        });
      }
    } else {
      failed.push({ path: p, name: path.basename(p, ".vst3"), error: friendlyError(res.error) });
    }
  }
  onProgress?.({ done: todo.length, total: todo.length, current: null });

  plugins.sort((a, b) => a.name.localeCompare(b.name));
  failed.sort((a, b) => a.name.localeCompare(b.name));
  return { version: 1, scannedAt: Date.now(), plugins, failed, fingerprints };
}

/** Which of the player's sources (if any) a plugin file came from. */
function sourceOf(pluginPath, sources) {
  const norm = (p) => path.resolve(p).toLowerCase();
  const file = norm(pluginPath);
  if (sources.files.some((f) => norm(f) === file || file.startsWith(norm(f) + path.sep))) return "file";
  if (sources.folders.some((d) => file.startsWith(norm(d) + path.sep))) return "folder";
  return "system";
}

/** What the renderer gets. System plugin paths stay in the main process; the
 *  player's own files/folders are shown back to them (they picked them). */
function publicView(catalog) {
  const sources = catalog.sources || { folders: [], files: [] };
  const fileSource = (p) => sources.files.find((f) => sourceOf(p, { files: [f], folders: [] }) === "file");
  return {
    scannedAt: catalog.scannedAt,
    plugins: catalog.plugins.map(({ id, name, vendor, subCategories, version, path: p }) => {
      const source = sourceOf(p, sources);
      return { id, name, vendor, subCategories, version, source, ...(source === "file" ? { sourcePath: fileSource(p) } : {}) };
    }),
    failed: catalog.failed.map(({ name, error }) => ({ name, error })),
    sources: { folders: sources.folders.slice(), files: sources.files.slice() },
  };
}

// ── The player's own files and folders ───────────────────────────────────────

/** A .vst3 bundle is a folder. Windows loads the binary inside it; macOS
 *  loads the bundle itself (CFBundle), so it stays the path. */
function resolveBundle(p, platform = process.platform) {
  try {
    if (!fs.statSync(p).isDirectory()) return p;
  } catch {
    return null;
  }
  if (platform === "darwin") return fs.existsSync(path.join(p, "Contents", "MacOS")) ? p : null;
  const inner = path.join(p, "Contents", "x86_64-win", path.basename(p));
  return fs.existsSync(inner) ? inner : null;
}

/** Every .vst3 under `dir` (bundles resolved, not descended into). */
function walkFolder(dir, platform = process.platform) {
  const out = [];
  const walk = (at, depth) => {
    if (depth > 5) return;
    let entries = [];
    try { entries = fs.readdirSync(at, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(at, e.name);
      if (e.name.toLowerCase().endsWith(".vst3")) {
        const resolved = resolveBundle(full, platform);
        if (resolved) out.push(resolved);
      } else if (e.isDirectory()) {
        walk(full, depth + 1);
      }
    }
  };
  walk(dir, 0);
  return out;
}

function sourcePaths(sources) {
  return [
    ...sources.files.map((f) => resolveBundle(f)).filter(Boolean),
    ...sources.folders.flatMap((d) => walkFolder(d)),
  ];
}

// ── Isolated scan process ────────────────────────────────────────────────────

function createRunner() {
  const { utilityProcess } = require("electron");
  const { createRpcClient } = require("../workerRpc");
  let proc = null;
  let rpc = null;
  let lastExit = null;

  function spawn() {
    const child = utilityProcess.fork(path.join(__dirname, "vstScanProcess.js"), [], {
      serviceName: "riff.quest plugin scanner",
      stdio: "ignore",
    });
    proc = child;
    rpc = createRpcClient(child);
    child.on("exit", (code) => {
      if (proc !== child) return;
      lastExit = code;
      rpc.failAll(new Error(`Plugin scanner exited (code ${code})`));
      proc = null;
      rpc = null;
    });
    return new Promise((resolve) => child.once("spawn", resolve));
  }

  async function call(method, arg, timeoutMs) {
    if (!proc) await spawn();
    const child = proc;
    let timer = null;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("timed out")), timeoutMs);
    });
    try {
      return await Promise.race([rpc.call(method, arg), timeout]);
    } catch (err) {
      if (/timed out/.test(err.message) && proc === child) {
        // Hung plugin: forget this process right now, so the next file gets a
        // fresh one instead of being blamed when this one finally dies.
        const deadRpc = rpc;
        proc = null;
        rpc = null;
        child.kill();
        deadRpc.failAll(err);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    listPaths: () => call("listPaths", undefined, SCAN_TIMEOUT_MS),
    async scanOne(modulePath) {
      try {
        return { ok: true, classes: await call("scan", modulePath, SCAN_TIMEOUT_MS) };
      } catch (err) {
        const crashed = /exited/.test(err.message);
        return { ok: false, error: crashed ? `crashed (exit code ${lastExit})` : err.message };
      }
    },
    dispose() {
      if (proc) proc.kill();
      proc = null;
    },
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

let busy = Promise.resolve();
let scanning = 0;
let progressListener = null;

function onProgress(fn) {
  progressListener = fn;
}

/** One library operation at a time (a scan and an "add file" must not both
 *  rewrite the catalog). */
function exclusive(fn) {
  const run = busy.then(async () => {
    scanning++;
    try { return await fn(); } finally { scanning--; }
  });
  busy = run.catch(() => {});
  return run;
}

/** Scans `listPaths()` (only the files that need it) and saves the result. */
async function rebuild({ listPaths, sources, retryFailed = false, markScanned = false }) {
  const runners = Array.from({ length: SCAN_WORKERS }, createRunner);
  try {
    const previous = vstStore.readCatalog();
    const paths = [...new Set(await listPaths(runners[0], previous))];
    const catalog = await buildCatalog({
      paths,
      previous,
      force: false,
      retryFailed,
      fingerprint: fingerprintOf,
      scanOne: runners.map((runner) => (p) => runner.scanOne(p)),
      onProgress: (p) => { try { progressListener?.(p); } catch { /* ignore */ } },
    });
    const saved = {
      ...catalog,
      scannedAt: markScanned ? catalog.scannedAt : previous.scannedAt,
      sources: sources || previous.sources,
    };
    vstStore.writeCatalog(saved);
    return publicView(saved);
  } finally {
    runners.forEach((runner) => runner.dispose());
  }
}

/** Files already in the library (what an "add" must not forget). */
const knownPaths = (catalog) => Object.keys(catalog.fingerprints).filter((p) => fs.existsSync(p));

/** "Scan this computer": the standard VST3 folders plus the player's own
 *  files/folders. New/changed files are read, and every earlier failure is
 *  retried (a licence activated since doesn't change the file). */
function scan() {
  return exclusive(() =>
    rebuild({
      listPaths: async (runner, previous) => [...(await runner.listPaths()), ...sourcePaths(previous.sources)],
      retryFailed: true,
      markScanned: true,
    }),
  );
}

/** Adds one .vst3 the player picked (a file, or a bundle folder) and reads just that. */
function addFile(filePath) {
  return exclusive(async () => {
    const resolved = resolveBundle(filePath);
    if (!resolved || !resolved.toLowerCase().endsWith(".vst3")) throw new Error("That isn't a VST3 plugin (.vst3).");
    const previous = vstStore.readCatalog();
    const files = previous.sources.files.includes(filePath) ? previous.sources.files : [...previous.sources.files, filePath];
    return rebuild({
      listPaths: async () => [...knownPaths(previous), resolved],
      sources: { ...previous.sources, files },
      retryFailed: true,
    });
  });
}

/** Adds a folder the player keeps plugins in and reads what's new inside it. */
function addFolder(dir) {
  return exclusive(async () => {
    const found = walkFolder(dir);
    const previous = vstStore.readCatalog();
    const folders = previous.sources.folders.includes(dir) ? previous.sources.folders : [...previous.sources.folders, dir];
    const view = await rebuild({
      listPaths: async () => [...knownPaths(previous), ...found],
      sources: { ...previous.sources, folders },
    });
    return { ...view, foundInFolder: found.length };
  });
}

/** Drops a file/folder the player added, and the plugins that came from it. */
function removeSource(sourcePath) {
  return exclusive(async () => {
    const c = vstStore.readCatalog();
    const sources = {
      folders: c.sources.folders.filter((d) => d !== sourcePath),
      files: c.sources.files.filter((f) => f !== sourcePath),
    };
    const gone = (p) => sourceOf(p, c.sources) !== "system" && sourceOf(p, sources) === "system";
    const next = {
      ...c,
      sources,
      fingerprints: Object.fromEntries(Object.entries(c.fingerprints).filter(([p]) => !gone(p))),
      plugins: c.plugins.filter((p) => !gone(p.path)),
      failed: c.failed.filter((p) => !gone(p.path)),
    };
    vstStore.writeCatalog(next);
    return publicView(next);
  });
}

/** The library as it stands — never scans on its own. */
async function listPlugins() {
  return publicView(vstStore.readCatalog());
}

function isScanning() {
  return scanning > 0;
}

module.exports = {
  listPlugins,
  scan,
  addFile,
  addFolder,
  removeSource,
  isScanning,
  onProgress,
  buildCatalog,
  isEffect,
  friendlyError,
  publicView,
  walkFolder,
  resolveBundle,
};
