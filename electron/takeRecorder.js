// Takes: recordings of the player's own playing, kept as ordinary files in a
// folder on this computer (Music/riff.quest unless they pick another).
//
// Two kinds:
//   audio — the guitar as the amp plays it (after the VST rack) and the backing
//           the page plays, as one WAV or, when asked, one WAV each;
//   video — the tablature with the score, encoded by the window (MediaRecorder)
//           with both already mixed in; this side only writes the bytes down.
//           When asked to split, the video carries the guitar alone and the
//           window sends the backing separately, to be written as a WAV that
//           starts where the video does.
//
// While an audio take runs, each source is appended to a raw temp file as it
// arrives — the guitar from the audio engine (takeBatcher.js), the backing from
// the window. finish() lines the two up and writes the WAVs (takeRender.js).
// Nothing here is timing-critical: the audio engine is another process, and all
// it does for a take is copy blocks into messages.
//
// A factory with its paths passed in rather than a module reading Electron's
// `app`, so it runs under Vitest with a temp directory.
const fs = require("fs");
const path = require("path");

const { renderTake, resampleRawFile, wavDurationSec, BYTES_PER_FRAME_F32 } = require("./takeRender");

/** Every file a take writes starts with its date and time, which is also how
 *  the list tells takes from whatever else lives in the folder. */
const TAKE_FILE_RE = /^((\d{4})-(\d{2})-(\d{2}) (\d{2})\.(\d{2})\.(\d{2}).*?)(?: \((guitar|backing)\))?\.(wav|mp4|webm)$/i;
const VIDEO_CONTAINERS = ["mp4", "webm"];
const MAX_TITLE_LENGTH = 60;
const MAX_LISTED_TAKES = 100;

/** A hole in the guitar longer than this (the stream reopened mid-take) is
 *  filled with silence, so what follows stays where it was played. */
const GUITAR_GAP_MS = 200;
/** ...but a "hole" this long is a clock jump, not a pause worth writing down. */
const GUITAR_GAP_MAX_MS = 5 * 60 * 1000;

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** "2026-11-15 21.30.05" — sorts by name, and legal in a file name everywhere. */
function stampFor(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}.${pad2(date.getMinutes())}.${pad2(date.getSeconds())}`;
}

/** A title the player's song or exercise gave us, made safe as part of a file name. */
function sanitizeTitle(title) {
  if (typeof title !== "string") return "";
  return title
    .replace(/[\u0000-\u001f<>:"/\\|?*]/g, " ")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TITLE_LENGTH)
    .replace(/[. ]+$/, "");
}

function endStream(stream) {
  return new Promise((resolve) => {
    if (!stream) {
      resolve();
      return;
    }
    stream.end(() => resolve());
  });
}

function removeQuietly(filePath) {
  try { fs.rmSync(filePath, { force: true }); } catch { /* already gone */ }
}

/**
 * @param {object} deps
 * @param {string} deps.settingsPath   JSON file remembering the chosen folder
 * @param {string} deps.tempDir        where the raw sources live while a take runs
 * @param {string} deps.defaultFolder  takes folder until the player picks one
 * @param {() => Date} [deps.now]
 */
function createTakeRecorder({ settingsPath, tempDir, defaultFolder, now = () => new Date() }) {
  /** The take being recorded, or null. */
  let session = null;

  // Whatever a crash left behind — no take can be running yet.
  try {
    for (const name of fs.readdirSync(tempDir)) removeQuietly(path.join(tempDir, name));
  } catch { /* no temp dir yet */ }

  function readSettings() {
    try {
      const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function getFolder() {
    const { folder } = readSettings();
    return typeof folder === "string" && folder.length > 0 ? folder : defaultFolder;
  }

  function setFolder(folder) {
    if (typeof folder !== "string" || folder.length === 0) return getFolder();
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({ ...readSettings(), folder }, null, 2));
    return folder;
  }

  function ensureFolder() {
    const folder = getFolder();
    fs.mkdirSync(folder, { recursive: true });
    return folder;
  }

  /** A name nothing in the folder uses yet — two takes can start in one second. */
  function freeBaseName(folder, wanted) {
    const taken = (base) => {
      try {
        return fs.readdirSync(folder).some((name) => name.startsWith(`${base}.`) || name.startsWith(`${base} (`));
      } catch {
        return false;
      }
    };
    if (!taken(wanted)) return wanted;
    for (let n = 2; n < 100; n++) {
      if (!taken(`${wanted} ${n}`)) return `${wanted} ${n}`;
    }
    return `${wanted} ${Date.now()}`;
  }

  function isActive() {
    return session !== null;
  }

  /**
   * Starts a take. opts: { mode: "audio" | "video", title?, split?, container? }
   * — `split` writes the guitar and the backing as separate files (for a video:
   * the backing as a WAV beside it), `container` is what the window's encoder
   * produces ("mp4" | "webm").
   */
  function begin(opts = {}) {
    if (session) throw new Error("A take is already being recorded");
    const mode = opts.mode === "video" ? "video" : "audio";
    const folder = ensureFolder();
    const title = sanitizeTitle(opts.title);
    const baseName = freeBaseName(folder, title ? `${stampFor(now())} ${title}` : stampFor(now()));

    session = {
      mode,
      folder,
      baseName,
      split: !!opts.split,
      error: null,
      guitar: { path: null, stream: null, frames: 0, rate: 0, startMs: Infinity, inputLatencyMs: 0, wet: false },
      backing: { path: null, stream: null, bytes: 0 },
      video: { path: null, partPath: null, stream: null, bytes: 0 },
    };

    if (mode === "video") {
      const container = VIDEO_CONTAINERS.includes(opts.container) ? opts.container : "webm";
      session.video.path = path.join(folder, `${baseName}.${container}`);
      session.video.partPath = `${session.video.path}.part`;
      if (session.split) {
        fs.mkdirSync(tempDir, { recursive: true });
        session.backing.path = path.join(tempDir, `take-${Date.now()}.backing.f32`);
      }
    } else {
      fs.mkdirSync(tempDir, { recursive: true });
      const tempBase = path.join(tempDir, `take-${Date.now()}`);
      session.guitar.path = `${tempBase}.guitar.f32`;
      session.backing.path = `${tempBase}.backing.f32`;
    }
    return { mode, baseName, folder };
  }

  function openStream(target) {
    const stream = fs.createWriteStream(target);
    const owner = session;
    stream.on("error", (err) => {
      if (owner && !owner.error) owner.error = err;
    });
    return stream;
  }

  /** What the engine said it is recording — known once its stream is open. */
  function setGuitarSource(source) {
    if (!session || !source) return;
    session.guitar.inputLatencyMs = Number(source.inputLatencyMs) || 0;
    session.guitar.wet = !!source.wet;
  }

  /** One batch from the audio engine: { pcm, frames, sampleRate, wet, endWallMs }. */
  function pushGuitar(chunk) {
    if (!session || session.mode !== "audio" || session.error) return;
    const g = session.guitar;
    if (!chunk || !chunk.pcm || !(chunk.frames > 0) || !(chunk.sampleRate > 0)) return;
    if (g.rate === 0) g.rate = chunk.sampleRate;
    // A stream that reopened at another rate cannot go into the same file.
    if (chunk.sampleRate !== g.rate) return;
    if (!g.stream) g.stream = openStream(g.path);
    if (chunk.wet) g.wet = true;

    const chunkStartMs = chunk.endWallMs - (chunk.frames / g.rate) * 1000;
    if (g.frames > 0) {
      const gapMs = chunkStartMs - (g.startMs + (g.frames / g.rate) * 1000);
      if (gapMs > GUITAR_GAP_MS && gapMs < GUITAR_GAP_MAX_MS) {
        const silentFrames = Math.round((gapMs / 1000) * g.rate);
        g.stream.write(Buffer.alloc(silentFrames * BYTES_PER_FRAME_F32));
        g.frames += silentFrames;
      }
    }
    g.stream.write(Buffer.from(chunk.pcm.buffer, chunk.pcm.byteOffset, chunk.frames * BYTES_PER_FRAME_F32));
    g.frames += chunk.frames;
    // Batches arrive late by however busy the loops between were, never early:
    // the earliest start any of them implies is the closest to the truth.
    const impliedStartMs = chunk.endWallMs - (g.frames / g.rate) * 1000;
    if (impliedStartMs < g.startMs) g.startMs = impliedStartMs;
  }

  /** Raw interleaved stereo FLOAT32 of the page's own playback, from the window. */
  function pushBacking(bytes) {
    if (!session || session.error || !bytes || !bytes.byteLength) return;
    // A video take mixes the backing in itself unless it was asked to split.
    if (session.mode === "video" && !session.split) return;
    const b = session.backing;
    if (!b.stream) b.stream = openStream(b.path);
    b.stream.write(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));
    b.bytes += bytes.byteLength;
  }

  /** The next piece of the encoded video, in order. */
  function pushVideo(bytes) {
    if (!session || session.mode !== "video" || session.error || !bytes || !bytes.byteLength) return;
    const v = session.video;
    if (!v.stream) v.stream = openStream(v.partPath);
    v.stream.write(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));
    v.bytes += bytes.byteLength;
  }

  /**
   * Ends the take and writes its files. opts:
   *   discard          — throw the take away instead
   *   backingStartMs   — wall-clock moment the backing's first sample was heard
   *   backingSampleRate
   *   guitarTrimMs     — the player's own correction; positive moves the guitar later
   * Resolves the take as list() would show it, or null when it was discarded
   * or recorded nothing.
   */
  async function finish(opts = {}) {
    const current = session;
    if (!current) return null;
    session = null;

    await Promise.all([endStream(current.guitar.stream), endStream(current.backing.stream), endStream(current.video.stream)]);

    const cleanTemp = () => {
      if (current.guitar.path) removeQuietly(current.guitar.path);
      if (current.backing.path) {
        removeQuietly(current.backing.path);
        removeQuietly(`${current.backing.path}.resampled`);
      }
      if (current.video.partPath) removeQuietly(current.video.partPath);
    };

    try {
      if (current.error) throw current.error;
      if (opts.discard) return null;

      if (current.mode === "video") {
        if (current.video.bytes === 0) return null;
        fs.renameSync(current.video.partPath, current.video.path);
        // Split: the window sent the backing from the moment its encoder
        // started, already held back as the picture is — it starts at zero.
        const rate = Number(opts.backingSampleRate);
        const frames = Math.floor(current.backing.bytes / BYTES_PER_FRAME_F32);
        if (current.split && frames > 0 && rate > 0) {
          await renderTake({
            sampleRate: rate,
            sources: { backing: { path: current.backing.path, frames, startMs: 0 } },
            outputs: [{ path: `${path.join(current.folder, current.baseName)} (backing).wav`, sources: ["backing"] }],
          });
        }
        return describeTake(current.folder, current.baseName);
      }

      const g = current.guitar;
      const backingRate = Number(opts.backingSampleRate) > 0 ? Number(opts.backingSampleRate) : g.rate;
      let backingFrames = Math.floor(current.backing.bytes / BYTES_PER_FRAME_F32);
      const sampleRate = g.frames > 0 ? g.rate : backingRate;
      if (!(sampleRate > 0) || (g.frames === 0 && backingFrames === 0)) return null;

      let backingPath = current.backing.path;
      if (backingFrames > 0 && backingRate !== sampleRate) {
        backingPath = `${current.backing.path}.resampled`;
        backingFrames = await resampleRawFile(current.backing.path, backingPath, backingRate, sampleRate);
      }

      const base = path.join(current.folder, current.baseName);
      const trimMs = Number(opts.guitarTrimMs) || 0;
      await renderTake({
        sampleRate,
        sources: {
          // When the string was played, not when its block reached the engine.
          guitar: { path: g.path, frames: g.frames, startMs: g.startMs - g.inputLatencyMs + trimMs },
          backing: { path: backingPath, frames: backingFrames, startMs: Number(opts.backingStartMs) },
        },
        outputs: current.split
          ? [
              { path: `${base} (guitar).wav`, sources: ["guitar"] },
              { path: `${base} (backing).wav`, sources: ["backing"] },
            ]
          : [{ path: `${base}.wav`, sources: ["guitar", "backing"] }],
      });
      return describeTake(current.folder, current.baseName);
    } finally {
      cleanTemp();
    }
  }

  function roleOf(match) {
    const ext = match[9].toLowerCase();
    if (ext !== "wav") return "video";
    return match[8] ? match[8].toLowerCase() : "mix";
  }

  /** Every take file in `folder`, grouped by take, newest first. */
  function scan(folder) {
    let names;
    try {
      names = fs.readdirSync(folder);
    } catch {
      return [];
    }
    const takes = new Map();
    for (const name of names) {
      const match = TAKE_FILE_RE.exec(name);
      if (!match) continue;
      let stat;
      try {
        stat = fs.statSync(path.join(folder, name));
      } catch {
        continue;
      }
      if (!stat.isFile()) continue;
      const id = match[1];
      const role = roleOf(match);
      let take = takes.get(id);
      if (!take) {
        const [, , y, mo, d, h, mi, s] = match;
        take = {
          id,
          title: id.slice(19).trim(),
          createdAt: new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)).getTime(),
          kind: "audio",
          durationSec: null,
          files: [],
        };
        takes.set(id, take);
      }
      take.files.push({ name, role, bytes: stat.size });
      if (role === "video") take.kind = "video";
      else if (take.durationSec === null) take.durationSec = wavDurationSec(path.join(folder, name));
    }
    return [...takes.values()].sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? 1 : -1));
  }

  function describeTake(folder, id) {
    return scan(folder).find((take) => take.id === id) ?? null;
  }

  function list() {
    return scan(getFolder()).slice(0, MAX_LISTED_TAKES);
  }

  /**
   * Full path of a take's file, or null. The window is a remote page: a name it
   * sends is only ever resolved to a take file sitting directly in the folder.
   */
  function resolveFile(fileName) {
    if (typeof fileName !== "string" || fileName !== path.basename(fileName) || !TAKE_FILE_RE.test(fileName)) return null;
    const filePath = path.join(getFolder(), fileName);
    return fs.existsSync(filePath) ? filePath : null;
  }

  /** Full paths of every file of one take. */
  function filesOf(takeId) {
    const take = typeof takeId === "string" ? describeTake(getFolder(), takeId) : null;
    return take ? take.files.map((file) => path.join(getFolder(), file.name)) : [];
  }

  return {
    getFolder, setFolder, ensureFolder,
    isActive, begin, setGuitarSource, pushGuitar, pushBacking, pushVideo, finish,
    list, resolveFile, filesOf,
  };
}

module.exports = { createTakeRecorder, sanitizeTitle, stampFor, TAKE_FILE_RE };
