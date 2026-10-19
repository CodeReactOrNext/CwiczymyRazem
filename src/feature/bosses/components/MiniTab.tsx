import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

const STRING_GAP = 12;
const NOTE_STEP = 26;
const PAD = 14;

/**
 * One bar of tab, drawn small — the new phase's opening, so the fingers know
 * what is coming before it counts in. High e on top, as in the session's tab.
 */
export const MiniTab = ({ measure, label }: { measure: TablatureMeasure; label: string }) => {
  const notes = measure.beats.flatMap((beat) => beat.notes.slice(0, 1));
  const width = PAD * 2 + Math.max(1, notes.length - 1) * NOTE_STEP;
  const height = PAD * 2 + STRING_GAP * 5;
  const yOf = (string: number) => PAD + (string - 1) * STRING_GAP;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className='h-auto w-full' role='img' aria-label={label}>
      {[1, 2, 3, 4, 5, 6].map((string) => (
        <line
          key={string}
          x1={0}
          x2={width}
          y1={yOf(string)}
          y2={yOf(string)}
          stroke='#3f3f46'
          strokeWidth={1}
        />
      ))}
      {notes.map((note, i) => {
        const x = PAD + i * NOTE_STEP;
        const y = yOf(note.string);
        return (
          <g key={i}>
            {/* Cuts the string under the number, as printed tab does. */}
            <rect x={x - 7} y={y - 6} width={14} height={12} rx={2} fill='#09090b' />
            <text
              x={x}
              y={y}
              textAnchor='middle'
              dominantBaseline='central'
              fontSize={10}
              fontWeight={600}
              fill='#f4f4f5'
              style={{ fontVariantNumeric: "tabular-nums" }}>
              {note.fret}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
