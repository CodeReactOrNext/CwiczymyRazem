import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { STRING_COLORS } from "feature/exercisePlan/views/PracticeSession/components/tablatureRenderData";

/**
 * The shape of the card's picture from sm up (440 × 160), so all six strings
 * show there; on a phone the slice keeps the left end: the string names and
 * the riff's first notes.
 */
const W = 330;
const H = 120;
const LEFT = 30;
const RIGHT = W - 10;
const TOP = 20;
const BOTTOM = 100;
const GAP = (BOTTOM - TOP) / 5;
const PILL_W = 16;
const PILL_H = 13;
/** A quarter note's width at most: about two bars of a slow riff. */
const QUARTER = 28;
/** Closest two notes may sit, so a run of eighths does not overlap. */
const MIN_STEP = PILL_W + 3;
const STRING_NAMES = ["e", "B", "G", "D", "A", "E"];

const stringY = (string: number) => TOP + (string - 1) * GAP;

interface PreviewNote {
  x: number;
  string: number;
  label: string;
}

/** The riff's opening notes, placed by duration, up to the card's right edge. */
export const getRiffPreviewNotes = (exercise: Exercise): PreviewNote[] => {
  const beats = (exercise.tablature ?? []).flatMap((measure) => measure.beats);
  const shortest = Math.min(
    ...beats.filter((beat) => beat.notes.length > 0).map((b) => b.duration),
  );
  const quarter = Math.max(QUARTER, MIN_STEP / shortest);
  const notes: PreviewNote[] = [];
  let x = LEFT + 14;
  for (const measure of exercise.tablature ?? []) {
    for (const beat of measure.beats) {
      if (x > RIGHT - PILL_W / 2) return notes;
      for (const note of beat.notes) {
        notes.push({
          x,
          string: note.string,
          label: note.isDead ? "×" : String(note.fret),
        });
      }
      x += beat.duration * quarter;
    }
  }
  return notes;
};

/**
 * The riff card's picture: the start of this level's riff on six strings, in
 * the session's string colours. Drawn from the riff's own tab, not a
 * screenshot, so "no fretting" never sits beside a fretted note.
 */
export const RiffPreview = ({ exercise }: { exercise: Exercise }) => {
  const notes = getRiffPreviewNotes(exercise);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio='xMinYMid slice'
      aria-hidden
      className='absolute inset-0 h-full w-full'>
      {STRING_NAMES.map((name, index) => (
        <g key={name + index}>
          <line
            x1={LEFT}
            x2={W}
            y1={stringY(index + 1)}
            y2={stringY(index + 1)}
            stroke='#3f3f46'
            strokeWidth={1 + index * 0.2}
          />
          <text
            x={LEFT - 14}
            y={stringY(index + 1) + 3.5}
            fontSize={10}
            fontWeight={700}
            fill='#71717a'
            textAnchor='middle'>
            {name}
          </text>
        </g>
      ))}
      {notes.map((note, index) => {
        const color = STRING_COLORS[note.string - 1];
        const y = stringY(note.string);
        return (
          <g key={index}>
            <rect
              x={note.x - PILL_W / 2}
              y={y - PILL_H / 2}
              width={PILL_W}
              height={PILL_H}
              rx={4}
              fill='#09090b'
              stroke={color}
              strokeWidth={1.6}
            />
            <text
              x={note.x}
              y={y + 3.4}
              fontSize={9.5}
              fontWeight={700}
              fill='#fafafa'
              textAnchor='middle'>
              {note.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
