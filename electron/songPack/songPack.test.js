import crypto from "crypto";
import fs from "fs";
import { createRequire } from "module";
import os from "os";
import path from "path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import zlib from "zlib";

import { readArchive, TOC_IV, TOC_KEY } from "./archive";
import { CHART_KEYS, CHART_MAGIC, NOTE, readChart } from "./chart";
import { decodeSongPack } from "./decodeSongPack";
import { importSongPack } from "./importSongPack";

// The stores as importSongPack itself loads them: it reaches them through
// require(), and an `import` here would be a second copy that the test-only
// directory override below never reaches.
const require = createRequire(import.meta.url);
const backingTrackStore = require("../backingTrackStore");
const gpFileStore = require("../gpFileStore");

// No real package ships with the repo (a package is somebody's released song),
// so these build one byte for byte in the layout the readers expect.

// ── Chart writer ────────────────────────────────────────────────────────────

class Writer {
  constructor() { this.chunks = []; }
  bytes(buffer) { this.chunks.push(buffer); return this; }
  zeros(n) { return this.bytes(Buffer.alloc(n)); }
  u8(v) { return this.bytes(Buffer.from([v & 0xff])); }
  i16(v) { const b = Buffer.alloc(2); b.writeInt16LE(v); return this.bytes(b); }
  i32(v) { const b = Buffer.alloc(4); b.writeInt32LE(v); return this.bytes(b); }
  u32(v) { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0); return this.bytes(b); }
  f32(v) { const b = Buffer.alloc(4); b.writeFloatLE(v); return this.bytes(b); }
  text(value, size) { const b = Buffer.alloc(size); b.write(value, "utf8"); return this.bytes(b); }
  list(items, write) { this.i32(items.length); items.forEach((item) => write(item)); return this; }
  build() { return Buffer.concat(this.chunks); }
}

const NONE = 0xff;

function writeNote(w, note) {
  w.u32(note.mask ?? 0).zeros(8).f32(note.time).u8(note.string ?? 0).u8(note.fret ?? 0).zeros(2);
  w.i32(note.chordId ?? -1).i32(note.chordNotesId ?? -1).zeros(8).zeros(10);
  w.u8(note.slideTo ?? NONE).u8(note.slideUnpitchTo ?? NONE).zeros(5).i16(note.vibrato ?? 0);
  w.f32(note.sustain ?? 0).f32(0);
  w.list(note.bends ?? [], (bend) => w.f32(bend.time).f32(bend.step).zeros(4));
}

function buildChart({ beats, phrases = [], chords = [], iterations = [], sections = [], levels, tuning = [0, 0, 0, 0, 0, 0], capo = NONE, lyrics = 0 }) {
  const w = new Writer();
  w.list(beats, (beat) => w.f32(beat.time).i16(beat.measure).i16(beat.beat).zeros(8));
  w.list(phrases, (phrase) => w.zeros(4).i32(phrase.maxDifficulty).zeros(4).text(phrase.name ?? "", 32));
  w.list(chords, (chord) => {
    w.zeros(4);
    chord.frets.forEach((fret) => w.u8(fret));
    w.zeros(6 + 24).text(chord.name, 32);
  });
  w.i32(0); // chord note details
  w.list(Array.from({ length: lyrics }), () => w.zeros(60));
  if (lyrics > 0) w.i32(0).i32(0).i32(0);
  w.list(iterations, (it) => w.i32(it.phraseId).f32(it.startTime).f32(it.nextPhraseTime).zeros(12));
  w.i32(0); // per-level phrase info
  w.i32(0); // linked difficulties
  w.i32(0).i32(0).i32(0).i32(0); // actions, events, tones, intensity
  w.list(sections, (section) => w.text(section.name, 32).i32(1).f32(section.startTime).zeros(48));
  w.list(levels, (level) => {
    w.i32(level.difficulty);
    w.i32(0).i32(0).i32(0).i32(0);
    w.list(level.notes, (note) => writeNote(w, note));
    w.i32(0).i32(0).i32(0);
  });
  w.zeros(32).zeros(8).u8(capo).zeros(32).i16(1).f32(12.5);
  w.i32(tuning.length);
  tuning.forEach((offset) => w.i16(offset));
  w.zeros(8).i32(0);
  return w.build();
}

/** Deflates and encrypts a chart the way a package stores it, signature and all. */
function wrapChart(chart, platform = "pc") {
  const iv = crypto.randomBytes(16);
  const length = Buffer.alloc(4);
  length.writeUInt32LE(chart.length);
  const cipher = crypto.createCipheriv("aes-256-ctr", CHART_KEYS[platform], iv);
  const body = Buffer.concat([cipher.update(Buffer.concat([length, zlib.deflateSync(chart)])), cipher.final()]);
  const header = Buffer.alloc(8);
  header.writeUInt32LE(CHART_MAGIC, 0);
  header.writeUInt32LE(3, 4);
  return Buffer.concat([header, iv, body, crypto.randomBytes(56)]);
}

// ── Archive writer ──────────────────────────────────────────────────────────

const BLOCK = 65536;

function buildArchive(files) {
  const listing = Buffer.from(Object.keys(files).join("\n"), "utf8");
  const contents = [listing, ...Object.values(files)];

  const blockLengths = [];
  const stored = [];
  const entries = contents.map((content) => {
    const entry = { firstBlock: blockLengths.length, length: content.length, blocks: [] };
    for (let at = 0; at < content.length; at += BLOCK) {
      const raw = content.subarray(at, at + BLOCK);
      const packed = zlib.deflateSync(raw);
      // Like a real packer: a block that does not shrink is stored as it is.
      const block = packed.length < raw.length ? packed : raw;
      entry.blocks.push(block);
      blockLengths.push(block.length === BLOCK ? 0 : block.length);
    }
    stored.push(entry);
    return entry;
  });

  const tocLength = 32 + entries.length * 30 + blockLengths.length * 2;
  let offset = tocLength;
  const toc = Buffer.alloc(tocLength - 32);
  entries.forEach((entry, i) => {
    const at = i * 30;
    toc.writeUInt32BE(entry.firstBlock, at + 16);
    toc.writeUIntBE(entry.length, at + 20, 5);
    toc.writeUIntBE(offset, at + 25, 5);
    offset += entry.blocks.reduce((sum, block) => sum + block.length, 0);
  });
  blockLengths.forEach((length, i) => toc.writeUInt16BE(length, entries.length * 30 + i * 2));

  const cipher = crypto.createCipheriv("aes-256-cfb", TOC_KEY, TOC_IV);
  const header = Buffer.alloc(32);
  header.write("PSAR", 0, "latin1");
  header.writeUInt16BE(1, 4);
  header.writeUInt16BE(4, 6);
  header.write("zlib", 8, "latin1");
  header.writeUInt32BE(tocLength, 12);
  header.writeUInt32BE(30, 16);
  header.writeUInt32BE(entries.length, 20);
  header.writeUInt32BE(BLOCK, 24);
  header.writeUInt32BE(4, 28);

  return Buffer.concat([
    header,
    cipher.update(toc),
    cipher.final(),
    ...stored.flatMap((entry) => entry.blocks),
  ]);
}

// ── A small song ────────────────────────────────────────────────────────────

/** Two bars of 4/4 at 120 BPM, starting one second into the recording. */
const beats = Array.from({ length: 8 }, (_, i) => ({ time: 1 + i * 0.5, measure: 1 + Math.floor(i / 4), beat: i % 4 }));

const leadChart = () => buildChart({
  beats,
  phrases: [{ maxDifficulty: 0, name: "intro" }, { maxDifficulty: 1, name: "riff" }],
  chords: [{ frets: [0, 2, 2, NONE, NONE, NONE], name: "E5" }],
  iterations: [
    { phraseId: 0, startTime: 1, nextPhraseTime: 3 },
    { phraseId: 1, startTime: 3, nextPhraseTime: 5 },
  ],
  sections: [{ name: "intro", startTime: 1 }, { name: "verse", startTime: 3 }],
  levels: [
    { difficulty: 0, notes: [
      { time: 1, string: 0, fret: 3, sustain: 0.5 },
      { time: 3, string: 0, fret: 1 }, // the easy version of the second phrase
    ] },
    { difficulty: 1, notes: [
      { time: 3, mask: NOTE.CHORD | NOTE.PALM_MUTE, chordId: 0 },
      { time: 3.5, string: 2, fret: 7, mask: NOTE.HAMMER_ON, slideTo: 9, bends: [{ time: 3.6, step: 1 }] },
    ] },
  ],
  tuning: [-2, 0, 0, 0, 0, 0],
});

const bassChart = () => buildChart({
  beats,
  levels: [{ difficulty: 0, notes: [{ time: 1, string: 3, fret: 5 }, { time: 2, string: 5, fret: 5 }] }],
});

const manifest = (arrangement, chartName) => Buffer.from(JSON.stringify({
  Entries: { ABC: { Attributes: {
    ArrangementName: arrangement, SongName: "Test Song", ArtistName: "The Band",
    SongXml: `urn:application:xml:${chartName}`,
  } } },
}));

const pack = (extra = {}) => buildArchive({
  "manifests/songs_dlc_test/test_lead.json": manifest("Lead", "test_lead"),
  "manifests/songs_dlc_test/test_bass.json": manifest("Bass", "test_bass"),
  "manifests/songs_dlc_test/test_vocals.json": manifest("Vocals", "test_vocals"),
  "songs/bin/generic/test_bass.sng": wrapChart(bassChart()),
  "songs/bin/generic/test_lead.sng": wrapChart(leadChart()),
  "songs/bin/generic/test_vocals.sng": wrapChart(buildChart({ beats, levels: [], lyrics: 2 })),
  ...extra,
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe("readArchive", () => {
  it("lists the files and reads each one back", () => {
    const big = crypto.randomBytes(BLOCK * 2 + 123); // does not compress: stored blocks
    const text = Buffer.from("riff ".repeat(40000)); // compresses: deflated blocks
    const archive = readArchive(buildArchive({ "a/big.bin": big, "b/text.txt": text }));

    expect(archive.names).toEqual(["a/big.bin", "b/text.txt"]);
    expect(archive.read("a/big.bin").equals(big)).toBe(true);
    expect(archive.read("b/text.txt").equals(text)).toBe(true);
    expect(archive.read("missing")).toBeNull();
  });

  it("refuses a file that is not a package", () => {
    expect(() => readArchive(Buffer.from("not a package at all, just some text here"))).toThrow(/not a song package/i);
  });
});

describe("readChart", () => {
  it("takes each phrase from the highest level it has", () => {
    const chart = readChart(wrapChart(leadChart()));
    // The first phrase only exists on level 0; the second one tops out on level 1.
    expect(chart.notes.map((note) => [note.time, note.string, note.fret])).toEqual([
      [1, 0, 3],
      [3, 0, 0], [3, 1, 2], [3, 2, 2],
      [3.5, 2, 7],
    ]);
  });

  it("spells a chord out into its strings, marks included", () => {
    const chord = readChart(wrapChart(leadChart())).notes.filter((note) => note.time === 3);
    expect(chord.every((note) => note.chord === "E5" && note.palmMute)).toBe(true);
  });

  it("keeps techniques, the beat grid, sections and tuning", () => {
    const chart = readChart(wrapChart(leadChart()));
    const last = chart.notes[chart.notes.length - 1];
    expect(last).toMatchObject({ hammerOn: true, slideTo: 9 });
    expect(last.bends[0].step).toBe(1);
    expect(chart.beats.filter((beat) => beat.bar).map((beat) => beat.time)).toEqual([1, 3]);
    expect(chart.sections).toEqual([{ name: "intro", time: 1 }, { name: "verse", time: 3 }]);
    expect(chart.tuning[0]).toBe(-2);
    expect(chart.capo).toBe(0);
  });

  it("reads a chart written for the other desktop platform", () => {
    expect(readChart(wrapChart(leadChart(), "mac"), "mac").notes).toHaveLength(5);
    expect(() => readChart(wrapChart(leadChart(), "mac"), "pc")).toThrow();
  });
});

describe("decodeSongPack", () => {
  it("returns the guitar and bass parts, lead first, without the lyrics", () => {
    const { tab, ogg, audioError } = decodeSongPack(pack());
    expect(tab).toMatchObject({ title: "Test Song", artist: "The Band" });
    expect(tab.parts.map((part) => [part.name, part.kind, part.stringCount])).toEqual([
      ["Lead", "guitar", 6],
      ["Bass", "bass", 4],
    ]);
    // A bass has four strings — a note the chart puts above them is dropped.
    expect(tab.parts[1].notes).toHaveLength(1);
    expect(ogg).toBeNull();
    expect(audioError).toMatch(/no recording/i);
  });

  it("still returns the tab when the recording cannot be converted", () => {
    const { tab, ogg, audioError } = decodeSongPack(pack({ "audio/windows/1.wem": Buffer.from("not audio") }));
    expect(tab.parts).toHaveLength(2);
    expect(ogg).toBeNull();
    expect(audioError).toBeTruthy();
  });

  it("refuses a package with nothing to play", () => {
    expect(() => decodeSongPack(buildArchive({ "readme.txt": Buffer.from("hello") }))).toThrow(/no guitar or bass/i);
  });
});

describe("importSongPack", () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "song-pack-test-"));
  gpFileStore._setUserDataDirForTests(userData);
  backingTrackStore._setUserDataDirForTests(userData);

  afterAll(() => fs.rmSync(userData, { recursive: true, force: true }));
  beforeEach(() => {
    fs.rmSync(path.join(userData, "gp-files"), { recursive: true, force: true });
    fs.rmSync(path.join(userData, "backing-tracks"), { recursive: true, force: true });
  });

  it("stores the tab in the local library under the song's name", () => {
    const { file, audioError } = importSongPack("test_p.psarc", pack());
    expect(file.name).toBe("The Band - Test Song.rqpack");
    expect(audioError).toMatch(/no recording/i);

    const stored = JSON.parse(gpFileStore.readFile(file.id).data.toString("utf8"));
    expect(stored.parts).toHaveLength(2);
    expect(stored.audioTrackId).toBeNull();
    expect(backingTrackStore.listTracks()).toEqual([]);
  });

  it("only takes a package", () => {
    expect(() => importSongPack("song.gp5", pack())).toThrow(/not a song package/i);
    expect(() => importSongPack("empty.psarc", Buffer.alloc(0))).toThrow(/empty/i);
  });
});

describe("backingTrackStore.importTrackData", () => {
  it("stores a recording held in memory", () => {
    const userData = fs.mkdtempSync(path.join(os.tmpdir(), "song-pack-audio-"));
    backingTrackStore._setUserDataDirForTests(userData);
    try {
      const meta = backingTrackStore.importTrackData("The Band - Test Song.ogg", Buffer.alloc(4096, 1));
      expect(meta).toMatchObject({ name: "The Band - Test Song", ext: ".ogg", mimeType: "audio/ogg", size: 4096 });
      expect(backingTrackStore.readTrack(meta.id).data.length).toBe(4096);
      expect(() => backingTrackStore.importTrackData("song.exe", Buffer.alloc(8))).toThrow(/unsupported/i);
    } finally {
      fs.rmSync(userData, { recursive: true, force: true });
    }
  });
});
