import { CHORD_SHAPES } from "../data/colossus";

const STRING_GAP = 9;
const FRET_GAP = 12;
const FRETS_SHOWN = 4;
const LEFT = 8;
const TOP = 16;
const WIDTH = LEFT * 2 + STRING_GAP * 5;
const HEIGHT = TOP + FRET_GAP * FRETS_SHOWN + 6;

/**
 * A chord box: the six strings low E to high e left to right, the frets down,
 * a dot where each finger goes, x over a muted string and o over an open one.
 * A shape up the neck starts at its lowest fret, numbered beside it.
 */
export const ChordDiagram = ({ chord, className }: { chord: string; className?: string }) => {
  const frets = CHORD_SHAPES[chord];
  if (!frets) return null;
  const fretted = frets.filter((fret): fret is number => fret !== null && fret > 0);
  const highest = Math.max(0, ...fretted);
  const base = highest > FRETS_SHOWN ? Math.min(...fretted) : 1;
  const xOf = (string: number) => LEFT + string * STRING_GAP;

  return (
    <svg
      viewBox={`0 0 ${WIDTH + 10} ${HEIGHT}`}
      className={className}
      role='img'
      aria-label={chord}>
      {Array.from({ length: FRETS_SHOWN + 1 }, (_, i) => (
        <line
          key={`f${i}`}
          x1={xOf(0)}
          x2={xOf(5)}
          y1={TOP + i * FRET_GAP}
          y2={TOP + i * FRET_GAP}
          stroke={i === 0 && base === 1 ? "#d4d4d8" : "#52525b"}
          strokeWidth={i === 0 && base === 1 ? 2.5 : 1}
        />
      ))}
      {frets.map((_, string) => (
        <line
          key={`s${string}`}
          x1={xOf(string)}
          x2={xOf(string)}
          y1={TOP}
          y2={TOP + FRETS_SHOWN * FRET_GAP}
          stroke='#71717a'
          strokeWidth={1}
        />
      ))}
      {base > 1 && (
        <text x={xOf(5) + 5} y={TOP + FRET_GAP / 2} dominantBaseline='central' fontSize={8} fill='#a1a1aa'>
          {base}
        </text>
      )}
      {frets.map((fret, string) =>
        fret === null || fret === 0 ? (
          <text
            key={`m${string}`}
            x={xOf(string)}
            y={TOP - 7}
            textAnchor='middle'
            dominantBaseline='central'
            fontSize={8}
            fill='#a1a1aa'>
            {fret === null ? "×" : "○"}
          </text>
        ) : (
          <circle
            key={`d${string}`}
            cx={xOf(string)}
            cy={TOP + (fret - base + 0.5) * FRET_GAP}
            r={3.4}
            fill='#f4f4f5'
          />
        ),
      )}
    </svg>
  );
};
