/**
 * Development-only recorder for the guitar input: what the detectors read, what
 * the tab's matcher made of it, and the raw audio itself, sent to the dev
 * server (pages/api/dev/audio-log.ts), which appends it to files on disk.
 *
 * It exists for inputs that can't be debugged at the desk — a phone's
 * microphone, mostly. On the dev server opened from another device it is on by
 * itself; on localhost open any page with `?audiolog=1` (it stays on for that
 * browser until `?audiolog=0`). Play, then read `.audio-debug/`.
 * Outside `next dev` every function here is a no-op.
 */

const STORAGE_KEY = "audio_debug_log";
const ENDPOINT = "/api/dev/audio-log";
const FLUSH_MS = 1000;
/** Raw audio stops being kept after this long — a session is not a recording. */
const MAX_PCM_SECONDS = 300;

let enabled: boolean | null = null;

export function isAudioDebugOn(): boolean {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return false;
  if (enabled === null) {
    try {
      const param = new URLSearchParams(window.location.search).get("audiolog");
      if (param === "1" || param === "0") localStorage.setItem(STORAGE_KEY, param);
      const stored = localStorage.getItem(STORAGE_KEY);
      // Opened from another device (`npm run dev:phone`) it is on unless turned
      // off: a redirect on the way in drops the query before it can be read.
      const remote = !["localhost", "127.0.0.1"].includes(window.location.hostname);
      enabled = stored === "1" || (remote && stored !== "0");
    } catch {
      enabled = false;
    }
  }
  return enabled;
}

let session: string | null = null;
let lines: string[] = [];
let pcmChunks: Int16Array[] = [];
let pcmSamples = 0;
let pcmRate = 0;
let timer: ReturnType<typeof setInterval> | null = null;
/** Posts go out one after another, so the server appends them in order. */
let chain: Promise<unknown> = Promise.resolve();

/** The file name the dev server writes this page load's recording under. */
export function audioDebugSession(): string {
  if (!session) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    session = `${stamp}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return session;
}

function post(kind: "log" | "pcm", body: BodyInit) {
  const url = `${ENDPOINT}?session=${audioDebugSession()}&kind=${kind}`;
  chain = chain
    .then(() => fetch(url, { method: "POST", body, headers: { "Content-Type": "application/octet-stream" } }))
    .catch(() => { /* the dev server is gone — nothing to do about it here */ });
}

function flush() {
  if (lines.length > 0) {
    post("log", `${lines.join("\n")}\n`);
    lines = [];
  }
  if (pcmChunks.length > 0) {
    let length = 0;
    for (const chunk of pcmChunks) length += chunk.length;
    const all = new Int16Array(length);
    let offset = 0;
    for (const chunk of pcmChunks) { all.set(chunk, offset); offset += chunk.length; }
    pcmChunks = [];
    post("pcm", all.buffer);
  }
}

function ensureTimer() {
  if (timer !== null) return;
  timer = setInterval(flush, FLUSH_MS);
  window.addEventListener("pagehide", flush);
}

/** Appends one JSON line, stamped with the time it was logged. */
export function logAudioDebug(entry: Record<string, unknown>): void {
  if (!isAudioDebugOn()) return;
  ensureTimer();
  lines.push(JSON.stringify({ t: Date.now(), ...entry }));
}

/** Appends raw input (mono, as the detectors get it) as 16-bit PCM. */
export function pushAudioDebugSamples(samples: Float32Array, sampleRate: number): void {
  if (!isAudioDebugOn()) return;
  if (pcmRate !== sampleRate) {
    pcmRate = sampleRate;
    logAudioDebug({ k: "pcm", rate: sampleRate, format: "s16le mono", atSample: pcmSamples });
  }
  if (pcmSamples >= MAX_PCM_SECONDS * sampleRate) return;
  ensureTimer();
  const chunk = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    chunk[i] = Math.round(s * 32767);
  }
  pcmChunks.push(chunk);
  pcmSamples += samples.length;
}
