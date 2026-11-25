import type { HuntPreview as HuntPreviewData } from "../data/onboardingGoals";

const W = 300;
const H = 150;
const LEFT = 34;
const RIGHT = 290;
const TOP = 40;
const BOTTOM = 134;
/** Frets 0–6: the open string left of the nut, then six frets. */
const CELLS = 7;
const CELL = (RIGHT - LEFT) / CELLS;
const GAP = (BOTTOM - TOP) / 5;
const STRING_NAMES = ["e", "B", "G", "D", "A", "E"];

const stringY = (string: number) => TOP + (string - 1) * GAP;
const fretX = (fret: number) => LEFT + fret * CELL + CELL / 2;

/**
 * The hunt card's picture: frets 0–6 the way the Click Hunt draws the neck,
 * the part of it this level plays on lit, and the example note already found
 * where it lives. Drawn, not a screenshot, so it follows the level.
 */
export const HuntPreview = ({ preview }: { preview: HuntPreviewData }) => {
  const { region } = preview;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio='xMidYMid slice'
      aria-hidden
      className='absolute inset-0 h-full w-full'>
      {region && "string" in region && (
        <rect
          x={LEFT}
          y={stringY(region.string) - 9}
          width={RIGHT - LEFT}
          height={18}
          rx={9}
          fill='rgba(255,255,255,0.06)'
        />
      )}
      {region && "fret" in region && (
        <rect
          x={LEFT + region.fret * CELL + 3}
          y={TOP - 9}
          width={CELL - 6}
          height={BOTTOM - TOP + 18}
          rx={9}
          fill='rgba(255,255,255,0.06)'
        />
      )}
      {Array.from({ length: CELLS - 1 }, (_, i) => i + 2).map((line) => (
        <line
          key={line}
          x1={LEFT + line * CELL}
          x2={LEFT + line * CELL}
          y1={TOP}
          y2={BOTTOM}
          stroke='#3f3f46'
        />
      ))}
      {/* The nut. */}
      <line
        x1={LEFT + CELL}
        x2={LEFT + CELL}
        y1={TOP - 2}
        y2={BOTTOM + 2}
        stroke='#d4d4d8'
        strokeWidth={3}
      />
      {[3, 5].map((fret) => (
        <circle
          key={fret}
          cx={fretX(fret)}
          cy={TOP + 2.5 * GAP}
          r={3.2}
          fill='#52525b'
        />
      ))}
      {STRING_NAMES.map((name, index) => (
        <g key={name + index}>
          <line
            x1={LEFT}
            x2={RIGHT}
            y1={stringY(index + 1)}
            y2={stringY(index + 1)}
            stroke='#71717a'
            strokeWidth={1 + index * 0.25}
          />
          <text
            x={LEFT - 12}
            y={stringY(index + 1) + 3.5}
            fontSize={10}
            fill='#71717a'
            textAnchor='middle'>
            {name}
          </text>
        </g>
      ))}
      {preview.spots.map(([string, fret]) => (
        <g key={`${string}-${fret}`}>
          <circle cx={fretX(fret)} cy={stringY(string)} r={10} fill='#10b981' />
          <text
            x={fretX(fret)}
            y={stringY(string) + 3.8}
            fontSize={10.5}
            fontWeight={700}
            fill='#022c22'
            textAnchor='middle'>
            {preview.target}
          </text>
        </g>
      ))}
    </svg>
  );
};
