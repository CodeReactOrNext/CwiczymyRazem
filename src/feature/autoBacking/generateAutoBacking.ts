import type {
  BackingTrack,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";

import type { ArpState, KeysState, Section, TrackEvent } from "./arrange";
import {
  arpBar,
  bassBar,
  buildMeasure,
  createRng,
  drumBar,
  keysBar,
  segmentsForBar,
} from "./arrange";
import { colourScale, colourSpans, melodyOnBacking } from "./colour";
import type { GrooveId } from "./grooves";
import { chooseGroove } from "./grooves";
import type { HarmonySource } from "./harmonize";
import { harmonize } from "./harmonize";
import type { HarmonyKind, KeyHint } from "./keyDetection";
import { detectKey, keyFromText } from "./keyDetection";
import type { BarInfo, TabContent } from "./noteEvents";
import { extractTabContent } from "./noteEvents";
import type { Chord, ScaleId } from "./theory";
import { chordSymbol, pcName, usesFlats } from "./theory";

export interface AutoBackingOptions {
  measures: TablatureMeasure[];
  /** The exercise's recommended tempo — it picks the feel, not the playback speed. */
  bpm: number;
  /** The title names a few styles (metal, blues) the notes can't show. */
  title?: string;
  /** Title and description may name the key ("A minor pentatonic"). */
  description?: string;
  /** Per-string semitone offsets of the player's tuning, so the band plays in
   *  the key the guitar actually sounds in. */
  tuningOffsets?: readonly number[];
  /** Loops the session will play before stopping (0 = forever). A finite run
   *  must end with the tab, so the backing can't be longer than it. */
  repeatCount?: number;
  /** A key the exercise already knows (generated scale drills). */
  keyHint?: KeyHint;
  /** Same seed, same backing — drum variations are picked from it. */
  seed?: string;
}

export interface AutoBackingSummary {
  kind: HarmonyKind;
  source: HarmonySource;
  /** The key as the player should hear it named — tonic spelling plus scale,
   *  or no scale when the notes never say major or minor. Null when only the
   *  drums play. */
  key: { tonic: string; scale: ScaleId | null } | null;
  /** Chord symbols in playing order, one per change. */
  chords: string[];
  groove: GrooveId;
  /** Bars in one loop of the harmony. */
  bars: number;
}

export interface AutoBackingResult {
  tracks: BackingTrack[];
  summary: AutoBackingSummary;
}

export const AUTO_TRACK_IDS = {
  drums: "auto-drums",
  bass: "auto-bass",
  keys: "auto-keys",
  arp: "auto-arp",
} as const;

/** Grooves where a held keyboard chord would only muddy the guitar. */
const NO_KEYS: ReadonlySet<GrooveId> = new Set(["metal", "doom", "thrash"]);

/**
 * How many times the tab repeats inside one loop of the harmony. A one-bar
 * drill over a one-bar loop could only ever hold one chord, so short tabs
 * are doubled up to four bars to give the harmony room to move — the tab and
 * the backing still line up, since both start on the same beat and the longer
 * loop is a whole multiple of the shorter. A twelve-bar blues takes twelve.
 */
function repetitionsFor(
  barCount: number,
  options: AutoBackingOptions,
  blues: boolean,
  hasIntroOutro: boolean,
): number {
  if (hasIntroOutro || (options.repeatCount ?? 0) > 0 || barCount === 0)
    return 1;
  if (blues && 12 % barCount === 0) return 12 / barCount;
  return barCount >= 4 ? 1 : Math.ceil(4 / barCount);
}

// ── Song form ─────────────────────────────────────────────────────────────────

export interface SongBar {
  /** The bar of the harmony loop this bar plays (an index into its barMap). */
  loopBar: number;
  section: Section;
  barInSection: number;
  sectionLength: number;
  /** The intro: played on the first pass only. */
  firstLoopOnly: boolean;
}

const CORE_SECTIONS: readonly Section[] = [
  "groove",
  "lift",
  "breakdown",
  "build",
];

/**
 * The song the backing plays over the harmony loop, so five minutes of an
 * exercise don't hear one bar copied out: a short pad-only intro played once,
 * then four sections of a phrase each — groove, lift, breakdown, build — and
 * round again. A phrase is at least eight bars and a whole number of harmony
 * loops, so the song is too, and the tab stays in step when it wraps.
 *
 * A run that has to end together with the tab (a set number of loops, or a
 * tab with its own intro/outro bars) gets the plain loop instead.
 */
export function songForm(
  loopBars: number,
  {
    evolving,
    withIntro,
    sections = CORE_SECTIONS,
  }: { evolving: boolean; withIntro: boolean; sections?: readonly Section[] },
): SongBar[] {
  if (!evolving) {
    return Array.from({ length: loopBars }, (_, i) => ({
      loopBar: i,
      section: "groove",
      barInSection: i,
      sectionLength: loopBars,
      firstLoopOnly: false,
    }));
  }
  const phrase = loopBars * Math.max(1, Math.ceil(8 / loopBars));
  const intro = withIntro ? Math.min(4, loopBars) : 0;
  const bars: SongBar[] = [];
  for (let i = 0; i < intro; i++) {
    bars.push({
      loopBar: i % loopBars,
      section: "intro",
      barInSection: i,
      sectionLength: intro,
      firstLoopOnly: true,
    });
  }
  for (const section of sections) {
    for (let i = 0; i < phrase; i++) {
      bars.push({
        loopBar: bars.length % loopBars,
        section,
        barInSection: i,
        sectionLength: phrase,
        firstLoopOnly: false,
      });
    }
  }
  return bars;
}

/** Notes struck per beat, a chord counting once. */
function onsetDensity(content: TabContent): number {
  const onsets = new Set(
    content.notes.map((note) => Math.round(note.start * 1000)),
  );
  return onsets.size / content.totalLength;
}

/**
 * At most about one note a beat: bends, vibrato, held chords, slow melodies.
 * These leave room the backing fills with an arpeggio; a run of sixteenths
 * would only be crowded by one.
 */
const SPARSE_DENSITY = 1.05;

function measureFor(
  events: TrackEvent[],
  bar: BarInfo,
  songBar: SongBar,
): TablatureMeasure {
  const measure = buildMeasure(events, bar);
  return songBar.firstLoopOnly ? { ...measure, firstLoopOnly: true } : measure;
}

// ── Entry ─────────────────────────────────────────────────────────────────────

export function generateAutoBacking(
  options: AutoBackingOptions,
): AutoBackingResult | null {
  const { measures, bpm } = options;
  if (!measures.length) return null;

  const content = extractTabContent(measures, options.tuningOffsets);
  if (content.totalLength <= 0) return null;
  const analysis = detectKey(
    content,
    options.keyHint,
    keyFromText(options.title, options.description),
  );

  const hasIntroOutro = content.bars.some(
    (bar) => bar.firstLoopOnly || bar.lastLoopOnly,
  );
  const blues =
    analysis.kind === "tonal" && analysis.key?.scale.chordScale === "blues";
  const repetitions = repetitionsFor(
    content.bars.length,
    options,
    blues,
    hasIntroOutro,
  );
  const barMap = Array.from({ length: repetitions }, () =>
    content.bars.map((bar) => bar.index),
  ).flat();

  const rng = createRng(
    options.seed ?? JSON.stringify(measures).slice(0, 2000),
  );
  const plan = harmonize({ content, analysis, barMap, random: rng });
  // The pad plays the chords in colour (maj7, add9, m9…); the bass keeps to
  // the plain triads, whose roots and thirds it walks.
  const padSpans = analysis.key
    ? colourSpans(
        plan.spans,
        melodyOnBacking(content, barMap),
        colourScale(analysis.key),
      )
    : plan.spans;
  const groove = chooseGroove({
    bars: content.bars,
    notes: content.notes,
    bpm,
    text: options.title,
    kind: plan.kind,
  });

  const withChords = plan.kind !== "rhythm" && plan.spans.length > 0;
  const withKeys = withChords && !NO_KEYS.has(groove);
  const withArp = withKeys && onsetDensity(content) <= SPARSE_DENSITY;

  // Where each bar of the harmony loop starts, in loop beats.
  const loopStarts: number[] = [];
  barMap.reduce((start, tabBar) => {
    loopStarts.push(start);
    return start + content.bars[tabBar].length;
  }, 0);

  const song = songForm(barMap.length, {
    evolving: !hasIntroOutro && (options.repeatCount ?? 0) === 0,
    // Without a pad there is nothing to open with.
    withIntro: withKeys,
  });

  const drums: TablatureMeasure[] = [];
  const bass: TablatureMeasure[] = [];
  const keys: TablatureMeasure[] = [];
  const arp: TablatureMeasure[] = [];
  const keysState: KeysState = { voices: null };
  const arpState: ArpState = { step: 0 };
  const evolving =
    song.length !== barMap.length ||
    song.some((bar) => bar.section !== "groove");

  song.forEach((songBar, i) => {
    const bar = content.bars[barMap[songBar.loopBar]];
    const loopStart = loopStarts[songBar.loopBar];
    const { section, barInSection, sectionLength } = songBar;
    const lastOfSection = barInSection === sectionLength - 1;
    drums.push(
      measureFor(
        drumBar(bar, {
          groove,
          bpm,
          rng,
          section,
          late: barInSection >= sectionLength / 2,
          // Fills close a phrase. In the song: every section's last bar; in a
          // plain loop: its end, and every fourth bar of a long one.
          isFill: evolving
            ? lastOfSection && section !== "intro"
            : barMap.length >= 2 &&
              (i === song.length - 1 ||
                (barMap.length >= 8 && (i + 1) % 4 === 0)),
          isCrash: evolving
            ? barInSection === 0 && section !== "intro"
            : i % 8 === 0,
        }),
        bar,
        songBar,
      ),
    );
    if (!withChords) return;
    bass.push(
      measureFor(
        bassBar(
          bar,
          segmentsForBar(plan.spans, loopStart, bar.length),
          groove,
          section,
        ),
        bar,
        songBar,
      ),
    );
    const padSegments = segmentsForBar(padSpans, loopStart, bar.length);
    if (withKeys)
      keys.push(
        measureFor(keysBar(bar, padSegments, groove, keysState), bar, songBar),
      );
    if (withArp) {
      arp.push(
        measureFor(
          section === "intro" ? [] : arpBar(bar, padSegments, bpm, arpState),
          bar,
          songBar,
        ),
      );
    }
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
  ];
  if (withChords) {
    tracks.push({
      id: AUTO_TRACK_IDS.bass,
      name: "Bass",
      measures: bass,
      trackType: "bass",
      pan: 0,
      generated: true,
    });
  }
  if (withKeys) {
    tracks.push({
      id: AUTO_TRACK_IDS.keys,
      name: "Pad",
      measures: keys,
      trackType: "keys",
      pan: -0.2,
      generated: true,
    });
  }
  if (withArp) {
    tracks.push({
      id: AUTO_TRACK_IDS.arp,
      name: "Arpeggio",
      measures: arp,
      trackType: "arp",
      pan: 0.15,
      generated: true,
    });
  }

  const key = analysis.key;
  const flats = key ? usesFlats(key.tonic, key.scale.chordScale) : false;
  const fromChord = (chord: Chord): AutoBackingSummary["key"] => ({
    tonic: pcName(chord.root, flats),
    scale:
      chord.quality === "5" || chord.quality === "sus2"
        ? null
        : chord.quality === "min" || chord.quality === "min7"
          ? "minor"
          : "major",
  });
  let summaryKey: AutoBackingSummary["key"] = null;
  if (plan.source === "tab" && plan.spans.length) {
    // The tab named its chords; the key reads off the first of them.
    summaryKey = fromChord(plan.spans[0].chord);
  } else if (
    key &&
    plan.source === "vamp" &&
    plan.spans[0]?.chord.root !== key.tonic
  ) {
    // The notes fit their own key, but the one chord under them is another —
    // name what the player hears.
    summaryKey = fromChord(plan.spans[0].chord);
  } else if (key && plan.kind !== "rhythm") {
    summaryKey = {
      tonic: pcName(key.tonic, flats),
      scale: plan.kind === "tonal" && key.thirdKnown ? key.scale.id : null,
    };
  }
  return {
    tracks,
    summary: {
      kind: plan.kind,
      source: plan.source,
      key: summaryKey,
      chords: (withKeys ? padSpans : plan.spans).map((span) =>
        chordSymbol(span.chord, flats),
      ),
      groove,
      bars: barMap.length,
    },
  };
}
