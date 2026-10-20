import type {
  BackingTrack,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

import type { KeysState, Section, TrackEvent } from "./arrange";
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
import type { BarInfo } from "./noteEvents";
import { extractTabContent, pulseOf } from "./noteEvents";
import type { Chord } from "./theory";
import { chordSymbol, pcName } from "./theory";

/**
 * The boss-fight score: dark synth over a low E pedal. The spider's drills
 * are chromatic finger patterns — over a held pedal that's exactly what boss
 * music sounds like, all tension — so the harmony doesn't follow the notes,
 * it holds the ground under them: power chords in a dark progression that
 * changes with each phase, a sixteenth-note bass ostinato, a minor-second
 * "strings" motif, and a kit that hits harder the further the fight goes.
 * The boss enraging is played live by the band (AmbientBand.setRage), not
 * written here.
 */

export interface BossMusicOptions {
  /** The fight's phase, from 1 — it picks the progression and the intensity. */
  phase: number;
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

const KICK = 36;
const SNARE = 38;
const HAT = 42;
const CRASH = 49;
const RIDE = 51;
const LOW_TOM = 45;
const FLOOR_TOM = 41;
const HIGH_TOM = 48;
const EPS = 1e-6;

const drum = (midiNote: number, dynamics: number): TablatureNote => ({
  string: 1,
  fret: 0,
  midiNote,
  dynamics,
});

interface BossDrumContext {
  bpm: number;
  level: number;
  section: Section;
  isFill: boolean;
  isCrash: boolean;
  /** An odd bar of its section — the tom pickup lands on these. */
  oddBar: boolean;
}

/** The battle kit: a kick that thickens with the phase, backbeat, hats or ride, toms. */
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

  // Time: hats, onto the ride for the lift; sixteenths once the fight heats up.
  const hatStep =
    (ctx.level >= 2 || ctx.section === "build") && sixteenths && simple
      ? 0.25
      : 0.5;
  for (const pos of every(hatStep, 0, bar.length)) {
    if (!before(pos) || (pos < EPS && ctx.isCrash)) continue;
    const onBeat = Math.abs(pos - Math.round(pos)) < EPS;
    hit(pos, drum(ctx.section === "lift" ? RIDE : HAT, onBeat ? 0.7 : 0.45));
  }
  if (ctx.isCrash) hit(0, drum(CRASH, 0.7));

  // The kick: on the beat, then eighths, then a sixteenth double kick — never
  // on top of the backbeat.
  const kickStep = !simple
    ? null
    : ctx.level === 1
      ? 1
      : ctx.level === 2 || !sixteenths
        ? 0.5
        : 0.25;
  const kicks =
    kickStep === null
      ? starts.filter((_, i) => roles[i] === "kick")
      : every(kickStep, 0, bar.length);
  for (const pos of kicks) {
    if (!before(pos) || snareAt.some((s) => Math.abs(s - pos) < EPS)) continue;
    hit(pos, drum(KICK, Math.abs(pos - Math.round(pos)) < EPS ? 0.8 : 0.6));
  }
  for (const pos of snareAt) if (before(pos)) hit(pos, drum(SNARE, 0.82));

  // A tom pickup into every other bar once the fight is past its opening.
  if (
    ctx.level >= 2 &&
    ctx.oddBar &&
    !ctx.isFill &&
    simple &&
    bar.length >= 4 - EPS
  ) {
    [HIGH_TOM, LOW_TOM, LOW_TOM, FLOOR_TOM].forEach((note, i) =>
      hit(bar.length - 1 + i * 0.25, drum(note, 0.6 + i * 0.06)),
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
        drum(note, 0.6 + (0.38 * i) / (count - 1)),
      );
    }
    hit(fillFrom, drum(KICK, 0.85));
  }
  return events;
}

/** Root of a chord in the bass's low octave, E1–D#2. */
const bassRoot = (pc: number) => 28 + ((pc - 4 + 12) % 12);

/**
 * The ostinato: the root in sixteenths (eighths at a fast tempo) with the
 * octave on the last of each beat — the engine the whole score runs on.
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
      const onBeat = inBeat < EPS;
      events.push({
        pos,
        length: step * 0.8,
        notes: [bassNote(lastOfBeat ? root + 12 : root, onBeat ? 0.95 : 0.7)],
      });
    }
  }
  return events;
}

/** Root, minor second, root, fifth: the half step that tells you something is coming. */
const STRINGS_MOTIF = [0, 1, 0, 7];

/** The strings' motif over each chord, from the E above middle C — high
 *  enough to cut through, the way an orchestra's violins carry a boss theme. */
export function bossStringsBar(
  bar: BarInfo,
  segments: ReturnType<typeof segmentsForBar>,
  bpm: number,
  state: { step: number },
): TrackEvent[] {
  const events: TrackEvent[] = [];
  const step = bpm <= 100 ? 0.25 : 0.5;
  for (const seg of segments) {
    const root = 64 + ((((seg.chord.root - 64) % 12) + 12) % 12);
    for (const pos of every(step, seg.from, seg.to)) {
      const onBeat = Math.abs(pos - Math.round(pos)) < EPS;
      events.push({
        pos,
        length: step * 0.85,
        notes: [
          {
            string: (state.step % 2) + 1,
            fret: 0,
            midiNote: root + STRINGS_MOTIF[state.step % STRINGS_MOTIF.length],
            dynamics: onBeat ? 0.6 : 0.45,
          },
        ],
      });
      state.step++;
    }
  }
  return events;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

export function generateBossBacking(
  measures: TablatureMeasure[],
  bpm: number,
  { phase }: BossMusicOptions,
  options: { tuningOffsets?: readonly number[] },
): AutoBackingResult | null {
  const content = extractTabContent(measures, options.tuningOffsets);
  if (content.totalLength <= 0 || content.bars.length === 0) return null;

  // The pedal follows the low string, so a detuned guitar keeps its ground.
  const tonic = (BOSS_TONIC + (options.tuningOffsets?.[5] ?? 0) + 12) % 12;
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
  const loopStarts: number[] = [];
  barMap.reduce((at, tabBar) => {
    loopStarts.push(at);
    return at + content.bars[tabBar].length;
  }, 0);

  const level = bossIntensity(phase);
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

  song.forEach((songBar) => {
    const bar = content.bars[barMap[songBar.loopBar]];
    const segments = segmentsForBar(
      spans,
      loopStarts[songBar.loopBar],
      bar.length,
    );
    const { section, barInSection, sectionLength } = songBar;
    drums.push(
      buildMeasure(
        bossDrumBar(bar, {
          bpm,
          level,
          section,
          isFill: barInSection === sectionLength - 1,
          isCrash: barInSection % 4 === 0,
          oddBar: barInSection % 2 === 1,
        }),
        bar,
      ),
    );
    bass.push(buildMeasure(bossBassBar(bar, segments, bpm), bar));
    pad.push(buildMeasure(keysBar(bar, segments, "rock", padState), bar));
    strings.push(
      buildMeasure(bossStringsBar(bar, segments, bpm, stringsState), bar),
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
      kind: "drone",
      source: "progression",
      key: { tonic: pcName(tonic), scale: null },
      chords: spans.map((span) => chordSymbol(span.chord)),
      groove: "boss",
      bars: loopBars,
    },
  };
}
