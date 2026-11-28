// Reader for one arrangement's chart inside a song package (a .sng file): the
// beat grid, the notes of every difficulty level, the chord shapes and the
// tuning. The file is encrypted and deflated; under that it is a run of
// counted lists, read here field by field in the order they are stored.
//
// Only what a tab needs is kept — the rest is stepped over.
const crypto = require("crypto");
const zlib = require("zlib");

const CHART_MAGIC = 0x4a;
const FLAG_COMPRESSED = 1;
const CHART_HEADER_BYTES = 24; // magic, flags, 16-byte counter block

const CHART_KEYS = {
  pc: Buffer.from("CB648DF3D12A16BF71701414E69619EC171CCA5D2A142E3E59DE7ADDA18A3A30", "hex"),
  mac: Buffer.from("9821330E34B91F70D0A48CBD625993126970CEA09192C0E6CDA676CC9838289D", "hex"),
};

// Note flags, as the chart stores them.
const NOTE = {
  CHORD: 0x02,
  FRET_HAND_MUTE: 0x08,
  TREMOLO: 0x10,
  HARMONIC: 0x20,
  PALM_MUTE: 0x40,
  HAMMER_ON: 0x200,
  PULL_OFF: 0x400,
  TAP: 0x4000,
  PINCH_HARMONIC: 0x8000,
  VIBRATO: 0x10000,
  MUTE: 0x20000,
  ACCENT: 0x4000000,
};

const NO_FRET = 0xff;
const STRINGS = 6;
const BEND_SLOTS = 32;
const BEND_BYTES = 12;

/** Strips the encryption and the deflate off a chart file. */
function unwrapChart(file, platform = "pc") {
  if (!Buffer.isBuffer(file) || file.length <= CHART_HEADER_BYTES || file.readUInt32LE(0) !== CHART_MAGIC) {
    throw new Error("The chart in this package is not readable.");
  }
  const flags = file.readUInt32LE(4);
  const key = CHART_KEYS[platform] ?? CHART_KEYS.pc;
  const decipher = crypto.createDecipheriv("aes-256-ctr", key, file.subarray(8, CHART_HEADER_BYTES));
  const plain = Buffer.concat([decipher.update(file.subarray(CHART_HEADER_BYTES)), decipher.final()]);
  if (!(flags & FLAG_COMPRESSED)) return plain;

  // Four bytes of length, then the deflated chart. A signature follows it in
  // the file, so the stream is read up to its own end rather than the buffer's.
  try {
    return zlib.inflateSync(plain.subarray(4), { finishFlush: zlib.constants.Z_SYNC_FLUSH });
  } catch {
    throw new Error("The chart in this package is not readable.");
  }
}

class Reader {
  constructor(buffer) {
    this.buffer = buffer;
    this.at = 0;
  }
  take(bytes) {
    if (bytes < 0 || this.at + bytes > this.buffer.length) {
      throw new Error("The chart in this package is not in the expected layout.");
    }
    const from = this.at;
    this.at += bytes;
    return from;
  }
  skip(bytes) { this.take(bytes); }
  u8() { return this.buffer.readUInt8(this.take(1)); }
  i16() { return this.buffer.readInt16LE(this.take(2)); }
  i32() { return this.buffer.readInt32LE(this.take(4)); }
  u32() { return this.buffer.readUInt32LE(this.take(4)); }
  f32() { return this.buffer.readFloatLE(this.take(4)); }
  text(bytes) {
    const from = this.take(bytes);
    const end = this.buffer.indexOf(0, from);
    return this.buffer.toString("utf8", from, end >= from && end < from + bytes ? end : from + bytes);
  }
  /** A list's length. Checked against what is left, so a misread layout fails
   *  here instead of allocating a few billion entries. */
  count(minItemBytes) {
    const n = this.i32();
    if (n < 0 || n * minItemBytes > this.buffer.length - this.at) {
      throw new Error("The chart in this package is not in the expected layout.");
    }
    return n;
  }
  list(minItemBytes, readItem) {
    const n = this.count(minItemBytes);
    const items = new Array(n);
    for (let i = 0; i < n; i++) items[i] = readItem();
    return items;
  }
  skipList(itemBytes) { this.skip(this.count(itemBytes) * itemBytes); }
}

const readBend = (r) => {
  const bend = { time: r.f32(), step: r.f32() };
  r.skip(4);
  return bend;
};

/** The six strings' bends of a chord: 32 slots each, of which `used` hold one. */
function readChordBends(r) {
  const perString = [];
  for (let s = 0; s < STRINGS; s++) {
    const slots = [];
    for (let i = 0; i < BEND_SLOTS; i++) slots.push(readBend(r));
    const used = Math.min(BEND_SLOTS, Math.max(0, r.i32()));
    perString.push(slots.slice(0, used));
  }
  return perString;
}

function readNote(r) {
  const mask = r.u32();
  r.skip(8); // flags, hash
  const time = r.f32();
  const string = r.u8();
  const fret = r.u8();
  r.skip(2); // anchor fret and width
  const chordId = r.i32();
  const chordNotesId = r.i32();
  r.skip(8); // phrase, phrase iteration
  r.skip(10); // fingerprints, neighbours
  const slideTo = r.u8();
  const slideUnpitchTo = r.u8();
  r.skip(5); // left hand, tap, pick direction, slap, pluck
  const vibrato = r.i16();
  const sustain = r.f32();
  r.skip(4); // largest bend
  const bends = r.list(BEND_BYTES, () => readBend(r));
  return { mask, time, string, fret, chordId, chordNotesId, slideTo, slideUnpitchTo, vibrato, sustain, bends };
}

/** Reads an unwrapped chart. */
function parseChart(data) {
  const r = new Reader(data);

  const beats = r.list(16, () => {
    const beat = { time: r.f32(), measure: r.i16(), beat: r.i16() };
    r.skip(8);
    return beat;
  });

  const phrases = r.list(44, () => {
    r.skip(4);
    const maxDifficulty = r.i32();
    r.skip(36);
    return { maxDifficulty };
  });

  const chords = r.list(72, () => {
    r.skip(4);
    const frets = [];
    for (let s = 0; s < STRINGS; s++) frets.push(r.u8());
    r.skip(STRINGS + STRINGS * 4); // fingers, notes
    return { frets, name: r.text(32) };
  });

  const chordNotes = r.list(STRINGS * 4 + STRINGS * (BEND_SLOTS * BEND_BYTES + 4) + STRINGS * 4, () => {
    const masks = [];
    for (let s = 0; s < STRINGS; s++) masks.push(r.u32());
    const bends = readChordBends(r);
    const slideTo = [];
    for (let s = 0; s < STRINGS; s++) slideTo.push(r.u8());
    const slideUnpitchTo = [];
    for (let s = 0; s < STRINGS; s++) slideUnpitchTo.push(r.u8());
    const vibrato = [];
    for (let s = 0; s < STRINGS; s++) vibrato.push(r.i16());
    return { masks, bends, slideTo, slideUnpitchTo, vibrato };
  });

  // Lyrics. Their three font tables are only there when the list is not empty.
  const lyricCount = r.count(60);
  r.skip(lyricCount * 60);
  if (lyricCount > 0) {
    r.skipList(32);
    r.skipList(144);
    r.skipList(44);
  }

  const phraseIterations = r.list(24, () => {
    const iteration = { phraseId: r.i32(), startTime: r.f32(), nextPhraseTime: r.f32() };
    r.skip(12);
    return iteration;
  });

  r.skipList(16); // per-level phrase info
  r.list(8, () => { // linked difficulties
    r.skip(4);
    r.skipList(4);
  });
  r.skipList(260); // actions
  r.skipList(260); // events
  r.skipList(8); // tone changes
  r.skipList(8); // intensity markers

  const sections = r.list(88, () => {
    const name = r.text(32);
    r.skip(4);
    const startTime = r.f32();
    r.skip(48);
    return { name, startTime };
  });

  const levels = r.list(4, () => {
    const difficulty = r.i32();
    r.skipList(28); // hand positions
    r.skipList(12);
    r.skipList(20); // chord shapes held
    r.skipList(20); // arpeggio shapes held
    const notes = r.list(67, () => readNote(r));
    r.skipList(4);
    r.skipList(4);
    r.skipList(4);
    return { difficulty, notes };
  });

  r.skip(32); // score totals
  r.skip(8); // first beat length, start time
  const capo = r.u8();
  r.skip(32); // conversion date
  r.skip(2); // part
  const lengthSec = r.f32();
  const stringCount = r.count(2);
  const tuning = [];
  for (let s = 0; s < stringCount; s++) tuning.push(r.i16());

  return {
    beats, phrases, chords, chordNotes, phraseIterations, sections, levels,
    capo: capo === NO_FRET ? 0 : capo,
    lengthSec,
    tuning,
  };
}

/**
 * The notes of the full arrangement.
 *
 * A chart stores the song once per difficulty level, and each phrase tops out
 * at its own level — so the whole song at full difficulty is not one level but
 * every phrase taken from the highest level it has.
 */
function fullArrangementNotes(chart) {
  const levels = [...chart.levels].sort((a, b) => a.difficulty - b.difficulty);
  if (levels.length === 0) return [];
  const top = levels[levels.length - 1];
  if (chart.phraseIterations.length === 0) return top.notes;

  const levelAtMost = (difficulty) => {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (levels[i].difficulty <= difficulty) return levels[i];
    }
    return levels[0];
  };

  const notes = [];
  chart.phraseIterations.forEach((iteration, i) => {
    const phrase = chart.phrases[iteration.phraseId];
    const level = phrase ? levelAtMost(phrase.maxDifficulty) : top;
    const isLast = i === chart.phraseIterations.length - 1;
    const from = i === 0 ? -Infinity : iteration.startTime;
    const to = isLast ? Infinity : chart.phraseIterations[i + 1].startTime;
    for (const note of level.notes) {
      if (note.time >= from && note.time < to) notes.push(note);
    }
  });
  return notes.sort((a, b) => a.time - b.time);
}

const has = (mask, flag) => (mask & flag) !== 0;

/** One played string, in the shape the tab converter reads (see feature/songPack). */
function tabNote({ time, string, fret, sustain, mask, slideTo, slideUnpitchTo, vibrato, bends, chord }) {
  const note = { time, string, fret, sustain: sustain > 0 ? sustain : 0 };
  if (chord) note.chord = chord;
  if (has(mask, NOTE.HAMMER_ON)) note.hammerOn = true;
  if (has(mask, NOTE.PULL_OFF)) note.pullOff = true;
  if (has(mask, NOTE.PALM_MUTE)) note.palmMute = true;
  if (has(mask, NOTE.MUTE) || has(mask, NOTE.FRET_HAND_MUTE)) note.mute = true;
  if (has(mask, NOTE.HARMONIC)) note.harmonic = true;
  if (has(mask, NOTE.PINCH_HARMONIC)) note.pinchHarmonic = true;
  if (has(mask, NOTE.ACCENT)) note.accent = true;
  if (has(mask, NOTE.TAP)) note.tap = true;
  if (has(mask, NOTE.VIBRATO) || vibrato > 0) note.vibrato = true;
  if (slideTo !== NO_FRET && slideTo !== undefined) note.slideTo = slideTo;
  if (slideUnpitchTo !== NO_FRET && slideUnpitchTo !== undefined) note.slideUnpitchTo = slideUnpitchTo;
  if (bends?.length) note.bends = bends.map((bend) => ({ time: bend.time, step: bend.step }));
  return note;
}

/** Every string that sounds, chords spelled out into their notes. */
function playedNotes(chart) {
  const played = [];
  for (const note of fullArrangementNotes(chart)) {
    const shape = has(note.mask, NOTE.CHORD) ? chart.chords[note.chordId] : null;
    if (!shape) {
      if (note.string < STRINGS && note.fret !== NO_FRET) played.push(tabNote(note));
      continue;
    }
    const detail = chart.chordNotes[note.chordNotesId];
    shape.frets.forEach((fret, string) => {
      if (fret === NO_FRET) return;
      played.push(tabNote({
        time: note.time,
        string,
        fret,
        sustain: note.sustain,
        // What is marked on the chord as a whole holds for each of its strings.
        mask: note.mask | (detail?.masks[string] ?? 0),
        slideTo: detail?.slideTo[string],
        slideUnpitchTo: detail?.slideUnpitchTo[string],
        vibrato: detail?.vibrato[string] ?? 0,
        bends: detail?.bends[string],
        chord: shape.name || undefined,
      }));
    });
  }
  return played;
}

/** A chart file → the beat grid, sections and notes of the full arrangement. */
function readChart(file, platform = "pc") {
  const chart = parseChart(unwrapChart(file, platform));
  return {
    beats: chart.beats.map((beat) => ({ time: beat.time, bar: beat.beat === 0 })),
    sections: chart.sections.map((section) => ({ name: section.name, time: section.startTime })),
    notes: playedNotes(chart),
    tuning: chart.tuning,
    capo: chart.capo,
    lengthSec: chart.lengthSec,
  };
}

module.exports = { readChart, parseChart, unwrapChart, fullArrangementNotes, CHART_KEYS, CHART_MAGIC, NOTE };
