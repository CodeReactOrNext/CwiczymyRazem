/**
 * Sorting General MIDI percussion into the handful of rows a drum lane shows.
 *
 * A drum track's "strings" are not strings at all — Guitar Pro stores a GM key
 * number per hit, so drawing it like tablature would put a kick and a crash on
 * whatever line the file happened to use. Grouping by what was actually struck
 * is the only reading that helps, and for lining a tab up against a recording
 * the kick and the snare are the two rows that matter: they are what the
 * waveform's loudest transients are.
 *
 * Numbers follow the General MIDI Percussion Key Map (notes 35–81).
 */

export type DrumRow = "cymbals" | "hihat" | "toms" | "snare" | "kick" | "other";

/** Top to bottom, the way a drum stave is written: high and open at the top. */
export const DRUM_ROWS: { row: DrumRow; label: string }[] = [
  { row: "cymbals", label: "Cym" },
  { row: "hihat", label: "HH" },
  { row: "toms", label: "Tom" },
  { row: "snare", label: "Sn" },
  { row: "kick", label: "Kick" },
  { row: "other", label: "Perc" },
];

const KICK = new Set([35, 36]);
/** Side stick and hand clap live here too: they are played as snare answers. */
const SNARE = new Set([37, 38, 39, 40]);
const HIHAT = new Set([42, 44, 46]);
const TOMS = new Set([41, 43, 45, 47, 48, 50]);
const CYMBALS = new Set([49, 51, 52, 53, 55, 57, 59]);

/**
 * Which row a hit belongs on.
 *
 * Anything outside the kit proper — cowbell, tambourine, the whole Latin range
 * above 59 — lands in "other" rather than being forced onto a row it would
 * misrepresent, or dropped and silently lost.
 */
export function drumRowForMidi(midiNote: number | undefined): DrumRow {
  if (typeof midiNote !== "number" || !Number.isFinite(midiNote)) return "other";
  if (KICK.has(midiNote)) return "kick";
  if (SNARE.has(midiNote)) return "snare";
  if (HIHAT.has(midiNote)) return "hihat";
  if (TOMS.has(midiNote)) return "toms";
  if (CYMBALS.has(midiNote)) return "cymbals";
  return "other";
}

/** Row index from the top, matching DRUM_ROWS. */
export function drumRowIndex(row: DrumRow): number {
  const index = DRUM_ROWS.findIndex((entry) => entry.row === row);
  return index < 0 ? DRUM_ROWS.length - 1 : index;
}

/**
 * Whether a set of measures actually contains drum hits.
 *
 * A track can be marked as drums and still be empty — an unused kit lane in the
 * file. Offering a drum row for it would be a promise the lane cannot keep.
 */
export function hasDrumHits(
  measures: { beats: { notes: { midiNote?: number }[] }[] }[] | undefined,
): boolean {
  return !!measures?.some((measure) =>
    measure.beats?.some((beat) => (beat.notes?.length ?? 0) > 0),
  );
}

/**
 * Lowest number that can only be a percussion key.
 *
 * Guitar Pro's drum tracks do not all carry General MIDI numbers. Older files
 * — and any track AlphaTab could not resolve an articulation for — arrive with
 * nothing but a tab line per hit, and a line index is a small number. Anything
 * from 27 up is inside the GM percussion map and far above any line count, so
 * it is the one reading that cannot be confused for the other.
 */
const LOWEST_PERCUSSION_KEY = 27;

/** Whether a number is a General MIDI percussion key rather than a tab line. */
export function isPercussionKey(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= LOWEST_PERCUSSION_KEY;
}

export interface DrumRowSpec {
  /** Stable identity — a DrumRow name, or `line:N`. */
  key: string;
  label: string;
  /**
   * Drawn solid rather than faint. Kick and snare are what a recording's
   * loudest transients are, so they are the rows worth reading at a glance.
   */
  loud: boolean;
}

export interface DrumLayout {
  rows: DrumRowSpec[];
  /** Which row a note belongs on, as an index into `rows`. */
  rowOf(note: { string: number; midiNote?: number }): number;
  /** True when rows are kit pieces; false when they are bare tablature lines. */
  isGeneralMidi: boolean;
}

const EMPTY_LAYOUT: DrumLayout = { rows: [], rowOf: () => 0, isGeneralMidi: false };

/**
 * Builds the drum lane's rows from the part itself.
 *
 * A fixed six-row grid was the wrong shape twice over. When the file does carry
 * GM numbers, most songs use three or four pieces, and the unused rows push the
 * real ones into a thin band at the bottom. When it does not — which is common,
 * because articulation data is not in every Guitar Pro file — *every* hit falls
 * through to "other" and the lane shows one flat row that says nothing about
 * what is being played.
 *
 * So the rows are whatever the part actually uses. With GM numbers that is kit
 * pieces in stave order; without them it is the file's own tab lines, which
 * still separate the kick from the hi-hat even though they cannot name either.
 * Either way the lane fills its height with rows that have something on them.
 */
export function drumLayout(
  events: { notes: { string: number; midiNote?: number }[] }[],
): DrumLayout {
  const notes = events.flatMap((event) => event.notes);
  if (!notes.length) return EMPTY_LAYOUT;

  if (notes.some((note) => isPercussionKey(note.midiNote))) {
    const used = new Set(notes.map((note) => drumRowForMidi(note.midiNote)));
    const rows = DRUM_ROWS.filter((entry) => used.has(entry.row)).map((entry) => ({
      key: entry.row,
      label: entry.label,
      loud: entry.row === "kick" || entry.row === "snare",
    }));
    const indexByRow = new Map(rows.map((row, index) => [row.key, index]));
    return {
      rows,
      rowOf: (note) => indexByRow.get(drumRowForMidi(note.midiNote)) ?? rows.length - 1,
      isGeneralMidi: true,
    };
  }

  // No GM data: fall back to the file's own lines, top line first. Naming them
  // after kit pieces here would be a guess dressed up as a fact — the lane says
  // "line 3", which is true, and the pattern is still legible.
  const lines = [...new Set(notes.map((note) => note.string))].sort((a, b) => a - b);
  const rows = lines.map((line) => ({ key: `line:${line}`, label: `L${line}`, loud: true }));
  const indexByLine = new Map(lines.map((line, index) => [line, index]));
  return {
    rows,
    rowOf: (note) => indexByLine.get(note.string) ?? 0,
    isGeneralMidi: false,
  };
}
