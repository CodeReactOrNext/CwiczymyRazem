import type {
  BackingTrack,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

import type { BarSegment, KeysState, Section, TrackEvent } from "./arrange";
import {
  bassNote,
  buildMeasure,
  every,
  keysBar,
  segmentsForBar,
} from "./arrange";
import type { AutoBackingResult, SongBar } from "./generateAutoBacking";
import { AUTO_TRACK_IDS, songForm } from "./generateAutoBacking";
import { groupHits, groupStarts, isSimpleMeter } from "./grooves";
import type { ChordSpan } from "./harmonize";
import { spansFromChordNames } from "./harmonize";
import type { BarInfo, TabContent } from "./noteEvents";
import { extractTabContent, pulseOf } from "./noteEvents";
import { HEARTBEAT } from "./synth/ambientBand";
import type { Chord } from "./theory";
import { chordSymbol, hasThird, pcName, QUALITY_INTERVALS } from "./theory";

/**
 * The boss-fight score: dark synth, a sixteenth-note bass ostinato, a
 * "strings" motif and a kit that hits harder the further the fight goes.
 * The boss enraging is played live by the band (AmbientBand.setRage), not
 * written here.
 *
 * The harmony depends on the drill. The spider's are chromatic finger
 * patterns — over a held low E pedal that's exactly what boss music sounds
 * like, all tension — so there it doesn't follow the notes: power chords in a
 * dark progression that changes with each phase, and a minor-second motif.
 * The colossus deals chord changes and names every chord in the tab, so there
 * the band plays those chords, change for change, with the motif on their
 * tones — a backing in another key would fight the player's own chords.
 *
 * The changeling is soloed over, so its score is a band to solo over (see
 * BossScore): the same chords, but time kept and the changes made plain
 * rather than a wall of sixteenths.
 */

/**
 * What the player plays over the score: a written drill — the spider's, the
 * colossus's — gets the battle score; an improvised solo over the changes —
 * the changeling's — a band that comps: the kick and a chord tone on 1 and 3,
 * where the solo's own chord tones are due, room everywhere else.
 */
export type BossScore = "battle" | "changes";

export interface BossMusicOptions {
  /** The fight's phase, from 1 — it picks the progression and the intensity. */
  phase: number;
  /** The battle score unless said otherwise. */
  score?: BossScore;
}

/** E: the guitar's lowest open string, the darkest home a backing can have. */
const BOSS_TONIC = 4;

/** One progression per phase, in semitones above the tonic, a bar each. */
const PROGRESSIONS: readonly (readonly number[])[] = [
  [0, 0, 1, 0], // E E F E — the phrygian half step, menace in two notes
  [0, 8, 10, 0], // E C D E
  [0, 1, 3, 1], // E F G F
  [0, 8, 5, 7], // E C A B — the epic minor turn
  [0, 6, 0, 1], // E Bb E F — the tritone
];

/** The fight never lets up: no intro, no breakdown — groove, lift, groove, build. */
const BOSS_SECTIONS: readonly Section[] = ["groove", "lift", "groove", "build"];

/** 1 in the first phases, up to 3 from phase 5. */
export const bossIntensity = (phase: number) =>
  phase <= 2 ? 1 : phase <= 4 ? 2 : 3;

/**
 * The energy the band never drops below in a phase: the score is written in
 * full and the player's run decides how much of it plays (AmbientBand.plays),
 * but the further the fight goes, the less a miss can strip it — 1 at first,
 * 2 from phase 5.
 */
export const bossEnergyFloor = (phase: number) => (bossIntensity(phase) >= 3 ? 2 : 1);

/**
 * The changes score never drops under its groove — kick, backbeat, hats, the
 * bass in two, the line: a solo needs its time kept, so a miss only takes
 * the extras the run has earned.
 */
export const CHANGES_ENERGY_FLOOR = 2;

/**
 * The layers of the score, from the live energy they need (TablatureNote.layer):
 * 0 always — pad, the bass on the beat; 1 the kick on the beat; 2 the
 * backbeat, eighth hats, the bass's eighths, the strings on the beat, the
 * crash; 3 sixteenth hats and bass, the strings' runs, eighth kicks, tom
 * pickups and fills; 4 the double kick and a crash every bar. -1: the
 * heartbeat, while the player is in danger. The changes score layers its own
 * parts (changesDrumBar, changesLineBar) over a floor of CHANGES_ENERGY_FLOOR.
 */
export const LAYER = { floor: 0, pulse: 1, groove: 2, drive: 3, peak: 4, danger: -1 } as const;

const KICK = 36;
const SNARE = 38;
const HAT = 42;
const CRASH = 49;
const RIDE = 51;
const LOW_TOM = 45;
const FLOOR_TOM = 41;
const HIGH_TOM = 48;
const EPS = 1e-6;

const drum = (midiNote: number, dynamics: number, layer: number): TablatureNote => ({
  string: 1,
  fret: 0,
  midiNote,
  dynamics,
  layer,
});

interface BossDrumContext {
  bpm: number;
  section: Section;
  isFill: boolean;
  isCrash: boolean;
  /** An odd bar of its section — the tom pickup lands on these. */
  oddBar: boolean;
}

const onBeat = (pos: number) => Math.abs(pos - Math.round(pos)) < EPS;
const onEighth = (pos: number) => Math.abs(pos * 2 - Math.round(pos * 2)) < EPS;

/**
 * The battle kit, written in full and layered: a kick on the beat, the
 * backbeat and eighth hats, then sixteenths and the eighth kick, then the
 * double kick — which of it plays is the player's run (LAYER).
 */
export function bossDrumBar(bar: BarInfo, ctx: BossDrumContext): TrackEvent[] {
  const events: TrackEvent[] = [];
  const hit = (pos: number, note: TablatureNote) =>
    events.push({ pos, notes: [note] });
  const simple = isSimpleMeter(bar.timeSignature);
  const starts = groupStarts(bar);
  const roles = groupHits(starts.length);
  const snareAt = starts.filter((_, i) => roles[i] === "snare");
  const sixteenths = ctx.bpm <= 125;

  const pulse = pulseOf(bar.timeSignature);
  const fillLength =
    ctx.section === "build" && simple && bar.length >= 4 - EPS
      ? 2
      : bar.length >= 2
        ? Math.min(pulse, 1.5)
        : 0;
  const fillFrom =
    ctx.isFill && fillLength > 0 ? bar.length - fillLength : Infinity;
  const before = (pos: number) => pos < fillFrom - EPS;

  // Time: hats — the ride for the lift — eighths in the groove, sixteenths to drive.
  const hatStep = sixteenths && simple ? 0.25 : 0.5;
  for (const pos of every(hatStep, 0, bar.length)) {
    if (!before(pos) || (pos < EPS && ctx.isCrash)) continue;
    hit(
      pos,
      drum(ctx.section === "lift" ? RIDE : HAT, onBeat(pos) ? 0.7 : 0.45, onEighth(pos) ? LAYER.groove : LAYER.drive),
    );
  }
  if (ctx.isCrash) hit(0, drum(CRASH, 0.7, LAYER.groove));
  else hit(0, drum(CRASH, 0.6, LAYER.peak));

  // The kick: on the beat, eighths, then the sixteenth double kick — never on
  // top of the backbeat.
  const kickStep = !simple ? null : sixteenths ? 0.25 : 0.5;
  const kicks =
    kickStep === null
      ? starts.filter((_, i) => roles[i] === "kick")
      : every(kickStep, 0, bar.length);
  for (const pos of kicks) {
    if (!before(pos) || snareAt.some((s) => Math.abs(s - pos) < EPS)) continue;
    const layer = kickStep === null || onBeat(pos) ? LAYER.pulse : onEighth(pos) ? LAYER.drive : LAYER.peak;
    hit(pos, drum(KICK, onBeat(pos) ? 0.8 : 0.6, layer));
  }
  for (const pos of snareAt) if (before(pos)) hit(pos, drum(SNARE, 0.82, LAYER.groove));

  // The heartbeat of a player in danger: two thumps on the bar's first beat.
  hit(0, drum(HEARTBEAT, 0.9, LAYER.danger));
  hit(0.3, drum(HEARTBEAT, 0.65, LAYER.danger));

  // A tom pickup into every other bar.
  if (ctx.oddBar && !ctx.isFill && simple && bar.length >= 4 - EPS) {
    [HIGH_TOM, LOW_TOM, LOW_TOM, FLOOR_TOM].forEach((note, i) =>
      hit(bar.length - 1 + i * 0.25, drum(note, 0.6 + i * 0.06, LAYER.drive)),
    );
  }

  if (fillFrom < Infinity) {
    const count = Math.max(
      2,
      Math.round(fillLength / (sixteenths ? 0.25 : 0.5)),
    );
    for (let i = 0; i < count; i++) {
      const note =
        i >= count - 2 ? (i === count - 1 ? FLOOR_TOM : LOW_TOM) : SNARE;
      hit(
        fillFrom + (i * fillLength) / count,
        drum(note, 0.6 + (0.38 * i) / (count - 1), LAYER.drive),
      );
    }
    hit(fillFrom, drum(KICK, 0.85, LAYER.pulse));
  }
  return events;
}

/** The bass's lowest note, its open E. */
const BASS_LOW_E = 28;

/** Root of a chord in the bass's low octave, E1–D#2. */
const bassRoot = (pc: number) => BASS_LOW_E + ((pc - 4 + 12) % 12);

/** The fifth a chord really has — a diminished one's is flat. */
const fifthOf = (chord: Chord) =>
  QUALITY_INTERVALS[chord.quality].find((interval) => interval >= 6 && interval <= 8) ?? 7;

/**
 * The ostinato: the root in sixteenths (eighths at a fast tempo) with the
 * octave on the last of each beat — the engine the whole score runs on.
 * Layered: the beat always sounds and holds until the next note cuts it, so
 * stripped to its floor the bass still pulses a root a beat.
 */
export function bossBassBar(
  bar: BarInfo,
  segments: ReturnType<typeof segmentsForBar>,
  bpm: number,
): TrackEvent[] {
  const events: TrackEvent[] = [];
  const step = bpm <= 110 ? 0.25 : 0.5;
  for (const seg of segments) {
    const root = bassRoot(seg.chord.root);
    for (const pos of every(step, seg.from, seg.to)) {
      const inBeat = pos - Math.floor(pos + EPS);
      const lastOfBeat = Math.abs(inBeat - (1 - step)) < EPS;
      const beat = inBeat < EPS;
      const note = bassNote(lastOfBeat ? root + 12 : root, beat ? 0.95 : 0.7);
      note.layer = beat ? LAYER.floor : onEighth(pos) ? LAYER.groove : LAYER.drive;
      events.push({
        pos,
        length: beat ? Math.min(0.95, seg.to - pos) : step * 0.8,
        notes: [note],
      });
    }
  }
  return events;
}

/** Root, minor second, root, fifth: the half step that tells you something is coming. */
const STRINGS_MOTIF = [0, 1, 0, 7];

/** Root, fifth, octave and the chord's own third: the motif over named chords. */
const chordMotif = (chord: Chord) => {
  const fifth = fifthOf(chord);
  const third = hasThird(chord.quality)
    ? QUALITY_INTERVALS[chord.quality][1]
    : fifth;
  return [0, fifth, 12, third];
};

/** The strings' motif over each chord, from the E above middle C — high
 *  enough to cut through, the way an orchestra's violins carry a boss theme. */
export function bossStringsBar(
  bar: BarInfo,
  segments: ReturnType<typeof segmentsForBar>,
  bpm: number,
  state: { step: number },
  followChords = false,
): TrackEvent[] {
  const events: TrackEvent[] = [];
  const step = bpm <= 100 ? 0.25 : 0.5;
  for (const seg of segments) {
    const root = 64 + ((((seg.chord.root - 64) % 12) + 12) % 12);
    const motif = followChords ? chordMotif(seg.chord) : STRINGS_MOTIF;
    for (const pos of every(step, seg.from, seg.to)) {
      const beatHit = onBeat(pos);
      events.push({
        pos,
        length: step * 0.85,
        notes: [
          {
            string: (state.step % 2) + 1,
            fret: 0,
            midiNote: root + motif[state.step % motif.length],
            dynamics: beatHit ? 0.6 : 0.45,
            layer: beatHit ? LAYER.groove : LAYER.drive,
          },
        ],
      });
      state.step++;
    }
  }
  return events;
}

// ── The changes score: a band to solo over ──────────────────────────────────

/** Beats 1 and 3 — where the changeling wants a chord tone, so where its band leans. */
const isStrongBeat = (pos: number) => onBeat(pos) && Math.round(pos) % 2 === 0;

const sameChord = (a: Chord, b: Chord) => a.root === b.root && a.quality === b.quality;

interface ChangesDrumContext {
  bpm: number;
  section: Section;
  /** Where in the bar the progression comes round — the crash. */
  tops: number[];
  /** The progression comes round on the next bar's first beat — a fill into it. */
  fillIn: boolean;
}

/**
 * The kit keeps time for a solo instead of fighting it: the kick on 1 and 3,
 * the backbeat, eighth hats (the ride for the lift). As the run builds, a
 * push on the and of 2 and a fill into the top of the progression; at the
 * peak, sixteenth hats. The crash marks the progression coming round and
 * nothing else does — no double kick, no tom run every other bar.
 */
export function changesDrumBar(bar: BarInfo, ctx: ChangesDrumContext): TrackEvent[] {
  const events: TrackEvent[] = [];
  const hit = (pos: number, note: TablatureNote) => events.push({ pos, notes: [note] });
  const crashAt = (pos: number) => ctx.tops.some((top) => Math.abs(top - pos) < EPS);

  const cymbal = ctx.section === "lift" ? RIDE : HAT;
  const sixteenths = ctx.bpm <= 125;
  for (const pos of every(sixteenths ? 0.25 : 0.5, 0, bar.length)) {
    if (crashAt(pos)) continue;
    const eighth = onEighth(pos);
    hit(pos, drum(cymbal, onBeat(pos) ? 0.62 : eighth ? 0.45 : 0.3, eighth ? LAYER.groove : LAYER.peak));
  }
  for (const top of ctx.tops) hit(top, drum(CRASH, 0.68, LAYER.groove));

  for (const pos of every(1, 0, bar.length)) {
    hit(pos, isStrongBeat(pos) ? drum(KICK, 0.85, LAYER.pulse) : drum(SNARE, 0.8, LAYER.groove));
  }
  if (bar.length >= 4 - EPS) hit(1.5, drum(KICK, 0.6, LAYER.drive));

  // The heartbeat of a player in danger: two thumps on the bar's first beat.
  hit(0, drum(HEARTBEAT, 0.9, LAYER.danger));
  hit(0.3, drum(HEARTBEAT, 0.65, LAYER.danger));

  // The fill rides on the last beat's backbeat: without the drive the bar keeps its plain four.
  if (ctx.fillIn && bar.length >= 2) {
    const fill = sixteenths ? [SNARE, LOW_TOM, FLOOR_TOM] : [FLOOR_TOM];
    const step = 1 / (fill.length + 1);
    fill.forEach((note, i) =>
      hit(bar.length - 1 + (i + 1) * step, drum(note, 0.66 + 0.08 * i, LAYER.drive)),
    );
  }
  return events;
}

/** A half step into the next root — from below, or from above where the bass runs out of strings. */
const approachInto = (next: Chord) => {
  const target = bassRoot(next.root);
  return target - 1 >= BASS_LOW_E ? target - 1 : target + 1;
};

/**
 * The bass drives in eighths whatever the run: the root from a chord's first
 * beat, the fifth from 3 while the chord holds — the chord named on the beats
 * the player names it on — and the last eighth before a change a half step
 * into the next root, so the change is heard coming. It carries the band's
 * weight, so it never drops out on a miss.
 */
export function changesBassBar(segments: readonly BarSegment[]): TrackEvent[] {
  const events: TrackEvent[] = [];
  for (const seg of segments) {
    const root = bassRoot(seg.chord.root);
    const fifth = root + fifthOf(seg.chord);
    const changes = seg.ends && !sameChord(seg.next, seg.chord);
    let held = root;
    for (const pos of every(0.5, seg.from, seg.to)) {
      const since = seg.sinceChordStart + pos - seg.from;
      const strong = since < EPS || isStrongBeat(pos);
      if (strong) held = Math.round(since) % 4 === 2 ? fifth : root;
      const lead = !strong && changes && seg.to - pos <= 0.5 + EPS;
      const note = bassNote(lead ? approachInto(seg.next) : held, strong ? 0.92 : lead ? 0.78 : 0.62);
      note.layer = LAYER.floor;
      events.push({ pos, length: 0.45, notes: [note] });
    }
  }
  return events;
}

/** The line's range, A4–A5: over the pad, at the top of where a solo usually sits. */
const LINE_LOW = 69;
const LINE_HIGH = 81;
/** Where the line starts out, before it has a note to move from. */
const LINE_START = 75;

/** How far the line may step past its range to keep a change smooth. */
const LINE_STEP = 2;

/** A chord's tones from `low` to `high`; the third and seventh — the ones that name it — marked. */
const lineTones = (chord: Chord, low: number, high: number) => {
  const intervals = QUALITY_INTERVALS[chord.quality].map((interval) => interval % 12);
  const tones: { pitch: number; names: boolean }[] = [];
  for (let pitch = low; pitch <= high; pitch++) {
    const interval = (pitch - chord.root + 120) % 12;
    if (intervals.includes(interval)) tones.push({ pitch, names: interval === 3 || interval === 4 || interval >= 10 });
  }
  return tones;
};

/**
 * The tone of `chord` to move to from `from`, none of `avoid`: one a step
 * away at most where there is one — a third or seventh before a root or
 * fifth — else the nearest in the line's range.
 */
const nearestTone = (chord: Chord, from: number, avoid: readonly number[] = []) => {
  const cost = (tone: { pitch: number; names: boolean }) => Math.abs(tone.pitch - from) + (tone.names ? 0 : 1.5);
  const pick = (tones: { pitch: number; names: boolean }[]) =>
    tones.reduce((best, tone) => (cost(tone) < cost(best) ? tone : best)).pitch;
  const allowed = (tone: { pitch: number }) => !avoid.includes(tone.pitch);
  const steps = lineTones(chord, LINE_LOW - LINE_STEP, LINE_HIGH + LINE_STEP).filter(
    (tone) => allowed(tone) && Math.abs(tone.pitch - from) <= LINE_STEP,
  );
  if (steps.length) return pick(steps);
  const tones = lineTones(chord, LINE_LOW, LINE_HIGH);
  const options = tones.filter(allowed);
  return pick(options.length ? options : tones);
};

/**
 * The line: a chord tone on 1 and 3, the same beats the player's are due on,
 * each the one nearest the last — a change moves it a step or holds a tone
 * the two chords share, the smooth landing the combo pays for; within a chord
 * it moves to another of its tones. As the run builds, 2 and 4 answer with a
 * third tone of the chord, out of the line's way.
 */
export function changesLineBar(
  segments: readonly BarSegment[],
  state: { last: number | null },
): TrackEvent[] {
  const events: TrackEvent[] = [];
  for (const seg of segments) {
    const strong: { pos: number; pitch: number }[] = [];
    for (const pos of every(1, seg.from, seg.to)) {
      const since = seg.sinceChordStart + pos - seg.from;
      if (since >= EPS && !isStrongBeat(pos)) continue;
      const from = state.last ?? LINE_START;
      // A change may hold its tone; within the chord the line moves on.
      const pitch = nearestTone(seg.chord, from, since < EPS ? [] : [from]);
      strong.push({ pos, pitch });
      state.last = pitch;
    }
    strong.forEach(({ pos, pitch }, i) => {
      const end = strong[i + 1]?.pos ?? seg.to;
      events.push({
        pos,
        length: end - pos,
        notes: [{ string: 1, fret: 0, midiNote: pitch, dynamics: 0.62, layer: LAYER.floor }],
      });
      for (const answer of every(1, pos + 1, end)) {
        const pitches = [pitch, strong[i + 1]?.pitch ?? pitch];
        events.push({
          pos: answer,
          length: 0.9,
          notes: [
            { string: 2, fret: 0, midiNote: nearestTone(seg.chord, pitch, pitches), dynamics: 0.45, layer: LAYER.drive },
          ],
        });
      }
    });
  }
  return events;
}

/** Where the progression starts over within the loop, in beats: the shortest run of its chords that repeats. */
const progressionTops = (spans: readonly ChordSpan[]) => {
  const n = spans.length;
  const period =
    Array.from({ length: n }, (_, i) => i + 1).find(
      (p) => n % p === 0 && spans.every((span, i) => sameChord(span.chord, spans[i % p].chord)),
    ) ?? n;
  return spans.filter((_, i) => i % period === 0).map((span) => span.start);
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

interface BossHarmony {
  spans: ChordSpan[];
  /** Tab bar played at each bar of the harmony loop. */
  barMap: number[];
  tonic: number;
  /** The tab's own chords, or the boss's dark progression over the pedal. */
  followsTab: boolean;
}

/**
 * Semitones the whole guitar is tuned away from standard — E♭ standard is −1.
 * A drop or open tuning moves only some strings, so the chord names still
 * mean what they say there.
 */
const uniformShift = (tuningOffsets?: readonly number[]) =>
  tuningOffsets?.length &&
  tuningOffsets.every((offset) => offset === tuningOffsets[0])
    ? tuningOffsets[0]
    : 0;

/** The chords the tab names, one loop of the tab, moved with a detuned guitar. */
function tabHarmony(
  content: TabContent,
  tuningOffsets?: readonly number[],
): BossHarmony | null {
  const barMap = content.bars.map((_, i) => i);
  const named = spansFromChordNames(content, barMap);
  if (!named) return null;
  const shift = uniformShift(tuningOffsets);
  const spans = named.map((span) => ({
    ...span,
    chord: { ...span.chord, root: (span.chord.root + shift + 12) % 12 },
  }));
  return { spans, barMap, tonic: spans[0].chord.root, followsTab: true };
}

/** Power chords in the phase's progression over a low E pedal, a bar each. */
function pedalHarmony(
  content: TabContent,
  phase: number,
  tuningOffsets?: readonly number[],
): BossHarmony {
  // The pedal follows the low string, so a detuned guitar keeps its ground.
  const tonic = (BOSS_TONIC + (tuningOffsets?.[5] ?? 0) + 12) % 12;
  const progression =
    PROGRESSIONS[(Math.max(1, phase) - 1) % PROGRESSIONS.length];

  // The harmony loop: whole tab loops, long enough to hold the progression.
  const tabBars = content.bars.length;
  const lcm = (tabBars * progression.length) / gcd(tabBars, progression.length);
  const loopBars = lcm <= 16 ? lcm : tabBars;
  const barMap = Array.from({ length: loopBars }, (_, i) => i % tabBars);

  const spans: ChordSpan[] = [];
  let start = 0;
  barMap.forEach((tabBar, i) => {
    const chord: Chord = {
      root: (tonic + progression[i % progression.length]) % 12,
      quality: "5",
    };
    const length = content.bars[tabBar].length;
    const last = spans[spans.length - 1];
    if (last && last.chord.root === chord.root) last.length += length;
    else spans.push({ chord, start, length });
    start += length;
  });
  return { spans, barMap, tonic, followsTab: false };
}

export function generateBossBacking(
  measures: TablatureMeasure[],
  bpm: number,
  { phase, score = "battle" }: BossMusicOptions,
  options: { tuningOffsets?: readonly number[] },
): AutoBackingResult | null {
  const content = extractTabContent(measures, options.tuningOffsets);
  if (content.totalLength <= 0 || content.bars.length === 0) return null;

  const { spans, barMap, tonic, followsTab } =
    tabHarmony(content, options.tuningOffsets) ??
    pedalHarmony(content, phase, options.tuningOffsets);
  const loopBars = barMap.length;
  const loopStarts: number[] = [];
  const loopLength = barMap.reduce((at, tabBar) => {
    loopStarts.push(at);
    return at + content.bars[tabBar].length;
  }, 0);
  // Comping needs chords to comp: without names the changes score has none.
  const comping = score === "changes" && followsTab;
  const tops = comping ? progressionTops(spans) : [];
  const isTop = (at: number) => tops.some((top) => Math.abs(top - (at % loopLength)) < EPS);

  const song: SongBar[] = songForm(loopBars, {
    evolving: true,
    withIntro: false,
    sections: BOSS_SECTIONS,
  });

  const drums: TablatureMeasure[] = [];
  const bass: TablatureMeasure[] = [];
  const pad: TablatureMeasure[] = [];
  const strings: TablatureMeasure[] = [];
  const padState: KeysState = { voices: null };
  const stringsState = { step: 0 };
  const lineState: { last: number | null } = { last: null };

  song.forEach((songBar) => {
    const bar = content.bars[barMap[songBar.loopBar]];
    const barStart = loopStarts[songBar.loopBar];
    const segments = segmentsForBar(spans, barStart, bar.length);
    const { section, barInSection, sectionLength } = songBar;
    pad.push(buildMeasure(keysBar(bar, segments, "rock", padState), bar));
    if (comping) {
      drums.push(
        buildMeasure(
          changesDrumBar(bar, {
            bpm,
            section,
            tops: every(0.5, 0, bar.length).filter((pos) => isTop(barStart + pos)),
            fillIn: isTop(barStart + bar.length),
          }),
          bar,
        ),
      );
      bass.push(buildMeasure(changesBassBar(segments), bar));
      strings.push(buildMeasure(changesLineBar(segments, lineState), bar));
      return;
    }
    drums.push(
      buildMeasure(
        bossDrumBar(bar, {
          bpm,
          section,
          isFill: barInSection === sectionLength - 1,
          isCrash: barInSection % 4 === 0,
          oddBar: barInSection % 2 === 1,
        }),
        bar,
      ),
    );
    bass.push(buildMeasure(bossBassBar(bar, segments, bpm), bar));
    strings.push(
      buildMeasure(
        bossStringsBar(bar, segments, bpm, stringsState, followsTab),
        bar,
      ),
    );
  });

  const tracks: BackingTrack[] = [
    {
      id: AUTO_TRACK_IDS.drums,
      name: "Drums",
      measures: drums,
      trackType: "drums",
      pan: 0,
      generated: true,
    },
    {
      id: AUTO_TRACK_IDS.bass,
      name: "Bass",
      measures: bass,
      trackType: "bass",
      pan: 0,
      generated: true,
    },
    {
      id: AUTO_TRACK_IDS.keys,
      name: "Pad",
      measures: pad,
      trackType: "keys",
      pan: -0.15,
      generated: true,
    },
    {
      id: AUTO_TRACK_IDS.arp,
      name: "Arpeggio",
      measures: strings,
      trackType: "arp",
      pan: 0.15,
      generated: true,
    },
  ];

  return {
    tracks,
    summary: {
      kind: followsTab ? "tonal" : "drone",
      source: followsTab ? "tab" : "progression",
      key: { tonic: pcName(tonic), scale: null },
      chords: spans.map((span) => chordSymbol(span.chord)),
      groove: "boss",
      bars: loopBars,
    },
  };
}
