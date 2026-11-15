import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTakeRecorder, sanitizeTitle, TAKE_FILE_RE } from "./takeRecorder";
import { planTimeline, renderTake, resampleRawFile, wavDurationSec } from "./takeRender";

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "rq-takes-"));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

/** Interleaved stereo FLOAT32 with the same value on both sides. */
const stereo = (values) => {
  const out = new Float32Array(values.length * 2);
  values.forEach((v, i) => {
    out[i * 2] = v;
    out[i * 2 + 1] = v;
  });
  return out;
};
const bytesOf = (floats) => new Uint8Array(floats.buffer, floats.byteOffset, floats.byteLength);

/** Left-channel samples of a 24-bit stereo WAV written by takeRender. */
function readWavLeft(filePath) {
  const data = fs.readFileSync(filePath);
  expect(data.toString("ascii", 0, 4)).toBe("RIFF");
  expect(data.readUInt16LE(22)).toBe(2);
  expect(data.readUInt16LE(34)).toBe(24);
  const frames = data.readUInt32LE(40) / 6;
  expect(data.length).toBe(44 + frames * 6);
  const left = [];
  for (let i = 0; i < frames; i++) {
    const o = 44 + i * 6;
    let s = data[o] | (data[o + 1] << 8) | (data[o + 2] << 16);
    if (s & 0x800000) s -= 0x1000000;
    left.push(Math.round((s / 8388607) * 1000) / 1000);
  }
  return { sampleRate: data.readUInt32LE(24), left };
}

function recorderIn(folderName = "takes") {
  return createTakeRecorder({
    settingsPath: path.join(dir, "userData", "takes.json"),
    tempDir: path.join(dir, "userData", "takes-tmp"),
    defaultFolder: path.join(dir, folderName),
    now: () => new Date(2026, 10, 15, 21, 30, 5),
  });
}

describe("planTimeline", () => {
  it("starts where the last source starts, skipping the head of the earlier one", () => {
    const { leads, totalFrames } = planTimeline(
      { guitar: { frames: 1000, startMs: 5000 }, backing: { frames: 1000, startMs: 5100 } },
      1000,
    );
    expect(leads).toEqual({ guitar: -100, backing: 0 });
    expect(totalFrames).toBe(1000);
  });

  it("starts sources together when one has no usable stamp or is absurdly far off", () => {
    expect(
      planTimeline({ guitar: { frames: 10, startMs: 5000 }, backing: { frames: 20, startMs: NaN } }, 1000).leads,
    ).toEqual({ guitar: 0, backing: 0 });
    expect(
      planTimeline({ guitar: { frames: 10, startMs: 0 }, backing: { frames: 20, startMs: 60_000 } }, 1000).leads,
    ).toEqual({ guitar: 0, backing: 0 });
    // A source that ended before the other began keeps its last frame.
    expect(
      planTimeline({ guitar: { frames: 10, startMs: 0 }, backing: { frames: 20, startMs: 500 } }, 1000).leads,
    ).toEqual({ guitar: -9, backing: 0 });
  });

  it("leaves out a source that recorded nothing", () => {
    const { leads, totalFrames } = planTimeline(
      { guitar: { frames: 0, startMs: 0 }, backing: { frames: 20, startMs: 500 } },
      1000,
    );
    expect(leads).toEqual({ backing: 0 });
    expect(totalFrames).toBe(20);
  });
});

describe("renderTake", () => {
  it("mixes two sources on one timeline and clamps the sum", async () => {
    const guitar = path.join(dir, "g.f32");
    const backing = path.join(dir, "b.f32");
    fs.writeFileSync(guitar, bytesOf(stereo([0.5, 0.5, 0.5, 0.9])));
    fs.writeFileSync(backing, bytesOf(stereo([0.25, 0.25, 0.25])));
    const out = path.join(dir, "mix.wav");
    // The backing starts 2 ms (2 frames at 1 kHz) after the guitar.
    const { written, totalFrames } = await renderTake({
      sampleRate: 1000,
      sources: {
        guitar: { path: guitar, frames: 4, startMs: 100 },
        backing: { path: backing, frames: 3, startMs: 102 },
      },
      outputs: [{ path: out, sources: ["guitar", "backing"] }],
    });
    expect(written).toEqual([out]);
    expect(totalFrames).toBe(3);
    const wav = readWavLeft(out);
    expect(wav.sampleRate).toBe(1000);
    // The guitar's first two frames came before there was a backing.
    expect(wav.left).toEqual([0.75, 1, 0.25]);
    expect(wavDurationSec(out)).toBeCloseTo(0.003, 6);
  });

  it("writes stems that share a start, and skips one with nothing in it", async () => {
    const guitar = path.join(dir, "g.f32");
    const backing = path.join(dir, "b.f32");
    fs.writeFileSync(guitar, bytesOf(stereo([0.5, 0.5])));
    fs.writeFileSync(backing, bytesOf(stereo([0.25, 0.25, 0.25])));
    const gOut = path.join(dir, "g.wav");
    const bOut = path.join(dir, "b.wav");
    await renderTake({
      sampleRate: 1000,
      sources: {
        guitar: { path: guitar, frames: 2, startMs: 101 },
        backing: { path: backing, frames: 3, startMs: 100 },
      },
      outputs: [
        { path: gOut, sources: ["guitar"] },
        { path: bOut, sources: ["backing"] },
      ],
    });
    // Both start where the guitar does: the backing's first frame is dropped.
    expect(readWavLeft(gOut).left).toEqual([0.5, 0.5]);
    expect(readWavLeft(bOut).left).toEqual([0.25, 0.25]);

    const only = path.join(dir, "only.wav");
    const none = path.join(dir, "none.wav");
    const result = await renderTake({
      sampleRate: 1000,
      sources: {
        guitar: { path: guitar, frames: 0, startMs: 0 },
        backing: { path: backing, frames: 3, startMs: 0 },
      },
      outputs: [
        { path: none, sources: ["guitar"] },
        { path: only, sources: ["backing"] },
      ],
    });
    expect(result.written).toEqual([only]);
    expect(fs.existsSync(none)).toBe(false);
  });

  it("handles takes longer than one block", async () => {
    const frames = 70_000;
    const ramp = new Float32Array(frames * 2);
    for (let i = 0; i < frames; i++) ramp[i * 2] = ramp[i * 2 + 1] = (i % 100) / 200;
    const src = path.join(dir, "long.f32");
    fs.writeFileSync(src, bytesOf(ramp));
    const out = path.join(dir, "long.wav");
    await renderTake({
      sampleRate: 48000,
      sources: { guitar: { path: src, frames, startMs: 0 } },
      outputs: [{ path: out, sources: ["guitar"] }],
    });
    const { left } = readWavLeft(out);
    expect(left).toHaveLength(frames);
    expect(left[32768]).toBeCloseTo((32768 % 100) / 200, 3);
    expect(left[69_999]).toBeCloseTo((69_999 % 100) / 200, 3);
  });
});

describe("resampleRawFile", () => {
  it("keeps the length in seconds and the shape", async () => {
    const src = path.join(dir, "a.f32");
    const dst = path.join(dir, "b.f32");
    const ramp = stereo(Array.from({ length: 441 }, (_, i) => i / 441));
    fs.writeFileSync(src, bytesOf(ramp));
    const frames = await resampleRawFile(src, dst, 44100, 48000);
    expect(frames).toBe(480);
    const out = new Float32Array(new Uint8Array(fs.readFileSync(dst)).buffer);
    expect(out).toHaveLength(960);
    expect(out[0]).toBeCloseTo(0, 5);
    expect(out[240 * 2]).toBeCloseTo(0.5, 2);
    expect(out[240 * 2 + 1]).toBeCloseTo(0.5, 2);
  });
});

describe("sanitizeTitle", () => {
  it("makes a title safe as part of a file name", () => {
    expect(sanitizeTitle('AC/DC: "Back in Black" (live)?')).toBe("AC DC Back in Black live");
    expect(sanitizeTitle("  trailing dots... ")).toBe("trailing dots");
    expect(sanitizeTitle(undefined)).toBe("");
    expect(sanitizeTitle("x".repeat(200))).toHaveLength(60);
  });
});

describe("createTakeRecorder", () => {
  const chunk = (values, endWallMs, sampleRate = 1000, wet = true) => {
    const pcm = stereo(values);
    return { pcm: bytesOf(pcm), frames: values.length, sampleRate, wet, endWallMs };
  };

  it("records an audio take into one mixed file, from where both sources are there", async () => {
    const recorder = recorderIn();
    const started = recorder.begin({ mode: "audio", title: "Smoke on the Water" });
    expect(started.baseName).toBe("2026-11-15 21.30.05 Smoke on the Water");
    expect(recorder.isActive()).toBe(true);
    recorder.setGuitarSource({ sampleRate: 1000, wet: true, inputLatencyMs: 0 });

    // Guitar: 4 frames ending at t=1004 → starts at 1000.
    recorder.pushGuitar(chunk([0.5, 0.5], 1002));
    recorder.pushGuitar(chunk([0.5, 0.5], 1004));
    recorder.pushBacking(bytesOf(stereo([0.25, 0.25, 0.25])));

    const take = await recorder.finish({ backingStartMs: 1001, backingSampleRate: 1000 });
    expect(recorder.isActive()).toBe(false);
    expect(take.kind).toBe("audio");
    expect(take.title).toBe("Smoke on the Water");
    expect(take.files.map((f) => f.role)).toEqual(["mix"]);
    const wav = readWavLeft(path.join(dir, "takes", take.files[0].name));
    expect(wav.left).toEqual([0.75, 0.75, 0.75]);
    // Nothing left behind in the temp folder.
    expect(fs.readdirSync(path.join(dir, "userData", "takes-tmp"))).toEqual([]);
  });

  it("writes the guitar and the backing apart when asked", async () => {
    const recorder = recorderIn();
    recorder.begin({ mode: "audio", title: "Riff", split: true });
    recorder.pushGuitar(chunk([0.5, 0.5], 1002));
    recorder.pushBacking(bytesOf(stereo([0.25, 0.25])));
    const take = await recorder.finish({ backingStartMs: 1000, backingSampleRate: 1000 });
    expect(take.files.map((f) => f.role).sort()).toEqual(["backing", "guitar"]);
    expect(take.files.map((f) => f.name).sort()).toEqual([
      "2026-11-15 21.30.05 Riff (backing).wav",
      "2026-11-15 21.30.05 Riff (guitar).wav",
    ]);
  });

  it("takes the guitar's input latency and the player's trim into account", async () => {
    const recorder = recorderIn();
    recorder.begin({ mode: "audio" });
    recorder.setGuitarSource({ sampleRate: 1000, wet: false, inputLatencyMs: 3 });
    recorder.pushGuitar(chunk([0.5, 0.5], 1005)); // arrived from 1003, played from 1000, trimmed to 1001
    recorder.pushBacking(bytesOf(stereo([0.25, 0.25, 0.25])));
    const take = await recorder.finish({ backingStartMs: 1000, backingSampleRate: 1000, guitarTrimMs: 1 });
    const wav = readWavLeft(path.join(dir, "takes", take.files[0].name));
    expect(wav.left).toEqual([0.75, 0.75]);
  });

  it("fills a hole in the guitar with silence so the rest stays in place", async () => {
    const recorder = recorderIn();
    recorder.begin({ mode: "audio" });
    recorder.pushGuitar(chunk([0.5, 0.5], 1002));
    // The stream reopened: the next batch ends 500 ms later.
    recorder.pushGuitar(chunk([0.25, 0.25], 1504));
    const take = await recorder.finish({});
    const wav = readWavLeft(path.join(dir, "takes", take.files[0].name));
    expect(wav.left).toHaveLength(504);
    expect(wav.left.slice(0, 3)).toEqual([0.5, 0.5, 0]);
    expect(wav.left.slice(-2)).toEqual([0.25, 0.25]);
  });

  it("resamples a backing recorded at another rate", async () => {
    const recorder = recorderIn();
    recorder.begin({ mode: "audio", split: true });
    recorder.pushGuitar(chunk(new Array(100).fill(0.5), 1100, 1000));
    recorder.pushBacking(bytesOf(stereo(new Array(200).fill(0.25))));
    const take = await recorder.finish({ backingStartMs: 1000, backingSampleRate: 2000 });
    const backing = take.files.find((f) => f.role === "backing");
    const wav = readWavLeft(path.join(dir, "takes", backing.name));
    expect(wav.sampleRate).toBe(1000);
    expect(wav.left).toHaveLength(100);
  });

  it("returns nothing for a take that recorded nothing, or was discarded", async () => {
    const recorder = recorderIn();
    recorder.begin({ mode: "audio" });
    expect(await recorder.finish({})).toBeNull();

    recorder.begin({ mode: "audio" });
    recorder.pushGuitar(chunk([0.5], 1001));
    expect(await recorder.finish({ discard: true })).toBeNull();
    expect(recorder.list()).toEqual([]);
  });

  it("writes a video take's bytes in order and only shows it once finished", async () => {
    const recorder = recorderIn();
    recorder.begin({ mode: "video", title: "Solo", container: "mp4" });
    recorder.pushVideo(Uint8Array.of(1, 2, 3));
    recorder.pushVideo(Uint8Array.of(4, 5));
    // Audio is not this side's business in a video take.
    recorder.pushGuitar(chunk([0.5], 1001));
    const take = await recorder.finish({});
    expect(take.kind).toBe("video");
    expect(take.files).toEqual([{ name: "2026-11-15 21.30.05 Solo.mp4", role: "video", bytes: 5 }]);
    expect(Array.from(fs.readFileSync(path.join(dir, "takes", take.files[0].name)))).toEqual([1, 2, 3, 4, 5]);
    expect(fs.readdirSync(path.join(dir, "takes"))).toEqual(["2026-11-15 21.30.05 Solo.mp4"]);
  });

  it("writes a split video take's backing as a WAV beside the video", async () => {
    const recorder = recorderIn();
    recorder.begin({ mode: "video", title: "Solo", container: "mp4", split: true });
    recorder.pushVideo(Uint8Array.of(1, 2, 3));
    const backing = new Float32Array(48000 * 2).fill(0.25);
    recorder.pushBacking(new Uint8Array(backing.buffer));
    const take = await recorder.finish({ backingSampleRate: 48000 });
    expect(take.kind).toBe("video");
    expect(take.files.map((file) => [file.name, file.role]).sort()).toEqual([
      ["2026-11-15 21.30.05 Solo (backing).wav", "backing"],
      ["2026-11-15 21.30.05 Solo.mp4", "video"],
    ]);
    expect(take.durationSec).toBeCloseTo(1, 3);
    expect(fs.readdirSync(path.join(dir, "userData", "takes-tmp"))).toEqual([]);
  });

  it("keeps the backing out of a video take that was not split", async () => {
    const recorder = recorderIn();
    recorder.begin({ mode: "video", title: "Solo", container: "mp4" });
    recorder.pushVideo(Uint8Array.of(1));
    recorder.pushBacking(new Uint8Array(new Float32Array(64).buffer));
    const take = await recorder.finish({ backingSampleRate: 48000 });
    expect(take.files.map((file) => file.role)).toEqual(["video"]);
  });

  it("gives two takes started in the same second different names", async () => {
    const recorder = recorderIn();
    recorder.begin({ mode: "video", title: "Solo", container: "webm" });
    recorder.pushVideo(Uint8Array.of(1));
    await recorder.finish({});
    const second = recorder.begin({ mode: "video", title: "Solo", container: "webm" });
    expect(second.baseName).toBe("2026-11-15 21.30.05 Solo 2");
    await recorder.finish({ discard: true });
  });

  it("refuses a second take while one runs", () => {
    const recorder = recorderIn();
    recorder.begin({ mode: "audio" });
    expect(() => recorder.begin({ mode: "audio" })).toThrow();
  });

  it("lists takes newest first and ignores other files in the folder", () => {
    const folder = path.join(dir, "takes");
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, "2026-11-14 10.00.00 Old.mp4"), "x");
    fs.writeFileSync(path.join(folder, "2026-11-15 10.00.00 New (guitar).wav"), "x");
    fs.writeFileSync(path.join(folder, "2026-11-15 10.00.00 New (backing).wav"), "x");
    fs.writeFileSync(path.join(folder, "holiday.mp4"), "x");
    fs.writeFileSync(path.join(folder, "2026-11-15 10.00.00 New.mp4.part"), "x");
    const takes = recorderIn().list();
    expect(takes.map((t) => t.id)).toEqual(["2026-11-15 10.00.00 New", "2026-11-14 10.00.00 Old"]);
    expect(takes[0].files).toHaveLength(2);
    expect(takes[1].kind).toBe("video");
  });

  it("only resolves take files sitting directly in the folder", () => {
    const folder = path.join(dir, "takes");
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, "2026-11-14 10.00.00 Old.mp4"), "x");
    fs.writeFileSync(path.join(dir, "secret.txt"), "x");
    const recorder = recorderIn();
    expect(recorder.resolveFile("2026-11-14 10.00.00 Old.mp4")).toBe(path.join(folder, "2026-11-14 10.00.00 Old.mp4"));
    expect(recorder.resolveFile("../secret.txt")).toBeNull();
    expect(recorder.resolveFile("..\\secret.txt")).toBeNull();
    expect(recorder.resolveFile("2026-11-14 10.00.00 Missing.mp4")).toBeNull();
    expect(recorder.resolveFile(42)).toBeNull();
    expect(recorder.filesOf("2026-11-14 10.00.00 Old")).toEqual([path.join(folder, "2026-11-14 10.00.00 Old.mp4")]);
    expect(recorder.filesOf("../secret")).toEqual([]);
  });

  it("remembers the folder the player picked", () => {
    const recorder = recorderIn();
    expect(recorder.getFolder()).toBe(path.join(dir, "takes"));
    const picked = path.join(dir, "elsewhere");
    expect(recorder.setFolder(picked)).toBe(picked);
    expect(recorderIn().getFolder()).toBe(picked);
  });

  it("clears what a crash left in the temp folder", () => {
    const tempDir = path.join(dir, "userData", "takes-tmp");
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, "take-1.guitar.f32"), "x");
    recorderIn();
    expect(fs.readdirSync(tempDir)).toEqual([]);
  });
});

describe("TAKE_FILE_RE", () => {
  it("tells a stem from a mix by its suffix", () => {
    expect(TAKE_FILE_RE.exec("2026-11-15 21.30.05 Song (guitar).wav")[8]).toBe("guitar");
    expect(TAKE_FILE_RE.exec("2026-11-15 21.30.05 Song.wav")[8]).toBeUndefined();
    expect(TAKE_FILE_RE.exec("2026-11-15 21.30.05.webm")[1]).toBe("2026-11-15 21.30.05");
    expect(TAKE_FILE_RE.test("notes.wav")).toBe(false);
  });
});
