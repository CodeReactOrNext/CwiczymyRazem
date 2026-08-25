import type {
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

/** One beat somewhere in the piece — the unit every multi-beat edit works in. */
export interface BeatRef {
  measureIdx: number;
  beatIdx: number;
}

/**
 * A block of grid cells, from the cell a gesture started on to the one it ended
 * on. It may run across bar lines: `startMeasure`/`endMeasure` are stored as the
 * user drew them, so every reader normalises first.
 *
 * Strings are grid indices (0 = high e), matching the rows of the editor.
 */
export interface TabSelection {
  startMeasure: number;
  startBeat: number;
  endMeasure: number;
  endBeat: number;
  startString: number;
  endString: number;
}

export interface NormalizedSelection {
  firstMeasure: number;
  firstBeat: number;
  lastMeasure: number;
  lastBeat: number;
  firstString: number;
  lastString: number;
}

/** Puts a selection's corners in reading order (top-left first). */
export function normalizeSelection(
  selection: TabSelection,
): NormalizedSelection {
  const forward =
    selection.startMeasure < selection.endMeasure ||
    (selection.startMeasure === selection.endMeasure &&
      selection.startBeat <= selection.endBeat);

  return {
    firstMeasure: forward ? selection.startMeasure : selection.endMeasure,
    firstBeat: forward ? selection.startBeat : selection.endBeat,
    lastMeasure: forward ? selection.endMeasure : selection.startMeasure,
    lastBeat: forward ? selection.endBeat : selection.startBeat,
    firstString: Math.min(selection.startString, selection.endString),
    lastString: Math.max(selection.startString, selection.endString),
  };
}

/** A single cell as a selection — what a plain click gives you. */
export function cellSelection(cell: {
  measureIdx: number;
  beatIdx: number;
  stringIdx: number;
}): TabSelection {
  return {
    startMeasure: cell.measureIdx,
    startBeat: cell.beatIdx,
    endMeasure: cell.measureIdx,
    endBeat: cell.beatIdx,
    startString: cell.stringIdx,
    endString: cell.stringIdx,
  };
}

export function isBeatInSelection(
  selection: TabSelection,
  measureIdx: number,
  beatIdx: number,
): boolean {
  const { firstMeasure, firstBeat, lastMeasure, lastBeat } =
    normalizeSelection(selection);

  if (measureIdx < firstMeasure || measureIdx > lastMeasure) return false;
  if (measureIdx > firstMeasure && measureIdx < lastMeasure) return true;
  if (firstMeasure === lastMeasure)
    return beatIdx >= firstBeat && beatIdx <= lastBeat;
  return measureIdx === firstMeasure
    ? beatIdx >= firstBeat
    : beatIdx <= lastBeat;
}

export function isCellInSelection(
  selection: TabSelection,
  measureIdx: number,
  beatIdx: number,
  stringIdx: number,
): boolean {
  const { firstString, lastString } = normalizeSelection(selection);
  return (
    stringIdx >= firstString &&
    stringIdx <= lastString &&
    isBeatInSelection(selection, measureIdx, beatIdx)
  );
}

/** Every beat the selection covers, in playing order, skipping ones that no
 *  longer exist — a selection can outlive the beats an undo or a re-grid took
 *  away. */
export function selectionBeatRefs(
  measures: TablatureMeasure[],
  selection: TabSelection | null,
): BeatRef[] {
  if (!selection) return [];
  const { firstMeasure, lastMeasure } = normalizeSelection(selection);
  const refs: BeatRef[] = [];

  for (
    let measureIdx = Math.max(0, firstMeasure);
    measureIdx <= Math.min(lastMeasure, measures.length - 1);
    measureIdx++
  ) {
    const beats = measures[measureIdx]?.beats ?? [];
    for (let beatIdx = 0; beatIdx < beats.length; beatIdx++) {
      if (isBeatInSelection(selection, measureIdx, beatIdx))
        refs.push({ measureIdx, beatIdx });
    }
  }

  return refs;
}

/** The selected beats of one measure, as indices. */
export function selectedBeatIndices(
  measures: TablatureMeasure[],
  selection: TabSelection | null,
  measureIdx: number,
): number[] {
  return selectionBeatRefs(measures, selection)
    .filter((ref) => ref.measureIdx === measureIdx)
    .map((ref) => ref.beatIdx);
}

/** True when the selection is a single cell — a click, not a dragged block. */
export function isSingleCell(selection: TabSelection): boolean {
  const s = normalizeSelection(selection);
  return (
    s.firstMeasure === s.lastMeasure &&
    s.firstBeat === s.lastBeat &&
    s.firstString === s.lastString
  );
}

/**
 * Rewrites every note the selection covers. Beats and measures outside it stay
 * identity-equal, so React only re-renders what actually changed.
 *
 * `edit` receives a copy of the note and returns the replacement, or null to
 * leave it as it was.
 */
export function mapSelectedNotes(
  measures: TablatureMeasure[],
  selection: TabSelection | null,
  edit: (note: TablatureNote) => TablatureNote | null,
): TablatureMeasure[] {
  if (!selection) return measures;
  const { firstString, lastString } = normalizeSelection(selection);

  return measures.map((measure, measureIdx) => {
    let measureChanged = false;

    const beats = measure.beats.map((beat, beatIdx) => {
      if (!isBeatInSelection(selection, measureIdx, beatIdx)) return beat;

      let beatChanged = false;
      const notes = beat.notes.map((note) => {
        const stringIdx = note.string - 1;
        if (stringIdx < firstString || stringIdx > lastString) return note;
        const edited = edit({ ...note });
        if (!edited) return note;
        beatChanged = true;
        return edited;
      });

      if (!beatChanged) return beat;
      measureChanged = true;
      return { ...beat, notes };
    });

    return measureChanged ? { ...measure, beats } : measure;
  });
}

/** Drops every note the selection covers, leaving the beats as rests. */
export function clearSelectedNotes(
  measures: TablatureMeasure[],
  selection: TabSelection | null,
): TablatureMeasure[] {
  if (!selection) return measures;
  const { firstString, lastString } = normalizeSelection(selection);

  return measures.map((measure, measureIdx) => {
    let measureChanged = false;

    const beats = measure.beats.map((beat, beatIdx) => {
      if (!isBeatInSelection(selection, measureIdx, beatIdx)) return beat;
      const notes = beat.notes.filter(
        (note) => note.string - 1 < firstString || note.string - 1 > lastString,
      );
      if (notes.length === beat.notes.length) return beat;
      measureChanged = true;
      return { ...beat, notes };
    });

    return measureChanged ? { ...measure, beats } : measure;
  });
}

/** How many notes the selection covers — what the inspector counts. */
export function countSelectedNotes(
  measures: TablatureMeasure[],
  selection: TabSelection | null,
): number {
  if (!selection) return 0;
  const { firstString, lastString } = normalizeSelection(selection);

  return selectionBeatRefs(measures, selection).reduce((total, ref) => {
    const notes = measures[ref.measureIdx].beats[ref.beatIdx].notes;
    return (
      total +
      notes.filter(
        (note) =>
          note.string - 1 >= firstString && note.string - 1 <= lastString,
      ).length
    );
  }, 0);
}
