// Turns what a take recorded into the WAV files the player keeps.
//
// While a take runs, its two sources are written as they arrive, as raw
// interleaved stereo FLOAT32: the guitar from the audio engine, the backing
// from the window. They start at slightly different moments and are stamped on
// the wall clock, so here they are put on one timeline — starting where the
// later one starts — and written out as 24-bit PCM: one file with both, or one
// file each. Stems written apart still line up when dropped into a DAW at zero.
//
// Everything is streamed in blocks: a ten-minute take is a quarter of a
// gigabyte of floats, which has no business sitting in the main process.
//
// No Electron dependency, so it is unit-tested with plain files.
const fs = require("fs");

const BYTES_PER_FRAME_F32 = 8; // stereo FLOAT32
const BYTES_PER_FRAME_PCM24 = 6; // stereo 24-bit
const BLOCK_FRAMES = 32768;
const WAV_HEADER_BYTES = 44;

/** Sources further apart than this were not stamped on the same clock — they
 *  are started together rather than trusted. */
const MAX_LEAD_MS = 15000;

/** 44-byte header of a stereo 24-bit PCM WAV holding `frames` frames. */
function wavHeader(sampleRate, frames) {
  const dataBytes = frames * BYTES_PER_FRAME_PCM24;
  const header = Buffer.alloc(WAV_HEADER_BYTES);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(Math.min(0xffffffff, 36 + dataBytes), 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(2, 22); // channels
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * BYTES_PER_FRAME_PCM24, 28);
  header.writeUInt16LE(BYTES_PER_FRAME_PCM24, 32);
  header.writeUInt16LE(24, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(Math.min(0xffffffff, dataBytes), 40);
  return header;
}

/** Floats (clamped to full scale) as 24-bit little-endian PCM. */
function floatToPcm24(samples, count, out) {
  for (let i = 0; i < count; i++) {
    let v = samples[i];
    if (!(v > -1)) v = -1; // also catches NaN
    else if (v > 1) v = 1;
    const s = Math.round(v * 8388607);
    const o = i * 3;
    out[o] = s & 0xff;
    out[o + 1] = (s >> 8) & 0xff;
    out[o + 2] = (s >> 16) & 0xff;
  }
}

/**
 * Rewrites a raw stereo FLOAT32 file at another sample rate (linear
 * interpolation — the backing is the page's own playback, already band-limited
 * well under either rate). Resolves the frame count written.
 */
async function resampleRawFile(srcPath, dstPath, fromRate, toRate) {
  const src = await fs.promises.open(srcPath, "r");
  const dst = await fs.promises.open(dstPath, "w");
  try {
    const { size } = await src.stat();
    const srcFrames = Math.floor(size / BYTES_PER_FRAME_F32);
    const dstFrames = Math.floor((srcFrames * toRate) / fromRate);
    const step = fromRate / toRate;
    const outBlock = new Float32Array(BLOCK_FRAMES * 2);
    const outBytes = Buffer.from(outBlock.buffer);
    for (let done = 0; done < dstFrames; done += BLOCK_FRAMES) {
      const count = Math.min(BLOCK_FRAMES, dstFrames - done);
      // Source frames this block reads, with one spare on the right to lean on.
      const first = Math.floor(done * step);
      const last = Math.min(srcFrames - 1, Math.floor((done + count - 1) * step) + 1);
      const inBlock = new Float32Array((last - first + 1) * 2);
      await src.read(Buffer.from(inBlock.buffer), 0, inBlock.byteLength, first * BYTES_PER_FRAME_F32);
      for (let i = 0; i < count; i++) {
        const pos = (done + i) * step - first;
        const a = Math.floor(pos);
        const b = Math.min(a + 1, last - first);
        const t = pos - a;
        outBlock[i * 2] = inBlock[a * 2] * (1 - t) + inBlock[b * 2] * t;
        outBlock[i * 2 + 1] = inBlock[a * 2 + 1] * (1 - t) + inBlock[b * 2 + 1] * t;
      }
      await dst.write(outBytes, 0, count * BYTES_PER_FRAME_F32);
    }
    return dstFrames;
  } finally {
    await src.close();
    await dst.close();
  }
}

/**
 * Where each source starts on the shared timeline, in frames.
 *
 * `sources` maps a name to { frames, startMs } — startMs being the wall-clock
 * moment its first sample belongs at. The timeline starts where the last
 * source to get going starts: a take's sources are switched on one after the
 * other (the guitar about a second before the page capture is up), and the
 * stretch only one of them covers is not the take yet. So a lead is zero or
 * negative — that many frames of the source are skipped.
 */
function planTimeline(sources, sampleRate) {
  const names = Object.keys(sources).filter((name) => sources[name] && sources[name].frames > 0);
  const stamped = names.filter((name) => Number.isFinite(sources[name].startMs));
  const origin = stamped.length > 0 ? Math.max(...stamped.map((name) => sources[name].startMs)) : 0;
  const leads = {};
  let totalFrames = 0;
  for (const name of names) {
    const { frames, startMs } = sources[name];
    let leadMs = Number.isFinite(startMs) ? startMs - origin : 0;
    if (leadMs < -MAX_LEAD_MS) leadMs = 0;
    // Never skip a source whole: one that ended before the other began still
    // keeps its last frame, so the plan stays a plan of something.
    leads[name] = Math.max(-(frames - 1), Math.round((leadMs / 1000) * sampleRate));
    totalFrames = Math.max(totalFrames, leads[name] + frames);
  }
  return { leads, totalFrames };
}

/**
 * Writes the take's WAV files.
 *
 * @param {object} opts
 * @param {number} opts.sampleRate  rate of the files written, and of every source
 * @param {Record<string, { path: string, frames: number, startMs: number }>} opts.sources
 *   raw stereo FLOAT32 files; a source with no frames is left out
 * @param {{ path: string, sources: string[] }[]} opts.outputs
 *   each file and the sources summed into it; one whose sources recorded
 *   nothing is not written
 * @returns {Promise<{ written: string[], totalFrames: number }>}
 */
async function renderTake({ sampleRate, sources, outputs }) {
  const { leads, totalFrames } = planTimeline(sources, sampleRate);
  const present = Object.keys(leads);
  const wanted = outputs.filter((output) => output.sources.some((name) => present.includes(name)));
  if (totalFrames === 0 || wanted.length === 0) return { written: [], totalFrames: 0 };

  const readers = {};
  const writers = [];
  try {
    for (const name of present) readers[name] = await fs.promises.open(sources[name].path, "r");
    for (const output of wanted) {
      const handle = await fs.promises.open(output.path, "w");
      writers.push({ handle, sources: output.sources.filter((name) => present.includes(name)) });
      await handle.write(wavHeader(sampleRate, totalFrames));
    }

    const blocks = {};
    for (const name of present) blocks[name] = new Float32Array(BLOCK_FRAMES * 2);
    const mix = new Float32Array(BLOCK_FRAMES * 2);
    const pcm = Buffer.alloc(BLOCK_FRAMES * BYTES_PER_FRAME_PCM24);

    for (let at = 0; at < totalFrames; at += BLOCK_FRAMES) {
      const count = Math.min(BLOCK_FRAMES, totalFrames - at);
      for (const name of present) {
        const block = blocks[name];
        block.fill(0, 0, count * 2);
        // The part of this block the source covers, in its own frames.
        const from = Math.max(0, at - leads[name]);
        const to = Math.min(sources[name].frames, at + count - leads[name]);
        if (to <= from) continue;
        const offset = (from + leads[name] - at) * 2;
        await readers[name].read(
          Buffer.from(block.buffer, offset * 4, (to - from) * BYTES_PER_FRAME_F32),
          0,
          (to - from) * BYTES_PER_FRAME_F32,
          from * BYTES_PER_FRAME_F32,
        );
      }
      for (const writer of writers) {
        let samples = blocks[writer.sources[0]];
        if (writer.sources.length > 1) {
          mix.fill(0, 0, count * 2);
          for (const name of writer.sources) {
            const block = blocks[name];
            for (let i = 0; i < count * 2; i++) mix[i] += block[i];
          }
          samples = mix;
        }
        floatToPcm24(samples, count * 2, pcm);
        await writer.handle.write(pcm, 0, count * BYTES_PER_FRAME_PCM24);
      }
    }
  } finally {
    for (const name of Object.keys(readers)) await readers[name].close().catch(() => {});
    for (const writer of writers) await writer.handle.close().catch(() => {});
  }
  return { written: wanted.map((output) => output.path), totalFrames };
}

/** Seconds of audio in a WAV this module wrote, or null when it is not one. */
function wavDurationSec(filePath) {
  let fd = null;
  try {
    fd = fs.openSync(filePath, "r");
    const header = Buffer.alloc(WAV_HEADER_BYTES);
    if (fs.readSync(fd, header, 0, WAV_HEADER_BYTES, 0) < WAV_HEADER_BYTES) return null;
    if (header.toString("ascii", 0, 4) !== "RIFF" || header.toString("ascii", 8, 12) !== "WAVE") return null;
    const byteRate = header.readUInt32LE(28);
    const dataBytes = header.readUInt32LE(40);
    return byteRate > 0 ? dataBytes / byteRate : null;
  } catch {
    return null;
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }
}

module.exports = {
  renderTake, resampleRawFile, planTimeline, wavHeader, floatToPcm24, wavDurationSec,
  BYTES_PER_FRAME_F32, MAX_LEAD_MS,
};
