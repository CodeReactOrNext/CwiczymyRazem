'use client';

import { rootNotes } from 'feature/exercisePlan/scales/scaleDefinitions';
import type { FretPosition } from 'feature/exercisePlan/scales/fretboardMapper';

interface FretboardPreviewProps {
  positions: FretPosition[];
  startFret: number;
  endFret: number;
  rootMidi: number;
  label: string;
}

// String 1 = high e (top row), String 6 = low E (bottom row)
const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];
const STRING_WIDTHS = [0.5, 0.75, 1.0, 1.3, 1.6, 2.0];
const INLAY_FRETS = new Set([3, 5, 7, 9, 12]);

const CELL_W = 26;
const CELL_H = 18;
const TOP_PAD = 16;   // space for fret numbers
const LEFT_PAD = 16;  // space for string names
const BOT_PAD = 10;   // space for inlay dots

export function FretboardPreview({ positions, startFret, endFret, rootMidi, label }: FretboardPreviewProps) {
  const fretCount = endFret - startFret + 1;

  const vw = LEFT_PAD + fretCount * CELL_W;
  const vh = TOP_PAD + 6 * CELL_H + BOT_PAD;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/10 px-2 pt-2 pb-1.5">
      <p className="text-xs text-muted-foreground text-center mb-1.5 font-medium">{label}</p>
      {/* Fixed-height container so the SVG never overflows */}
      <div style={{ height: '150px', width: '100%' }}>
        <svg
          viewBox={`0 0 ${vw} ${vh}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Fretboard diagram"
        >
          {/* String lines */}
          {STRING_LABELS.map((_, i) => {
            const y = TOP_PAD + i * CELL_H + CELL_H / 2;
            return (
              <line
                key={i}
                x1={LEFT_PAD}
                y1={y}
                x2={vw}
                y2={y}
                stroke="#4b5563"
                strokeWidth={STRING_WIDTHS[i]}
              />
            );
          })}

          {/* Fret lines */}
          {Array.from({ length: fretCount + 1 }, (_, i) => {
            const x = LEFT_PAD + i * CELL_W;
            const isNut = startFret === 0 && i === 0;
            return (
              <line
                key={i}
                x1={x}
                y1={TOP_PAD}
                x2={x}
                y2={TOP_PAD + 6 * CELL_H}
                stroke={isNut ? '#9ca3af' : '#2d3748'}
                strokeWidth={isNut ? 3 : 1}
              />
            );
          })}

          {/* Fret numbers */}
          {Array.from({ length: fretCount }, (_, i) => {
            const fret = startFret + i;
            if (fret === 0) return null;
            const x = LEFT_PAD + i * CELL_W + CELL_W / 2;
            return (
              <text key={i} x={x} y={TOP_PAD - 3} textAnchor="middle" fontSize={9} fill="#9ca3af" fontWeight="500">
                {fret}
              </text>
            );
          })}

          {/* String labels */}
          {STRING_LABELS.map((label, i) => {
            const y = TOP_PAD + i * CELL_H + CELL_H / 2 + 2.5;
            return (
              <text key={i} x={LEFT_PAD - 3} y={y} textAnchor="end" fontSize={7} fill="#6b7280">
                {label}
              </text>
            );
          })}

          {/* Inlay position markers */}
          {Array.from({ length: fretCount }, (_, i) => {
            const fret = startFret + i;
            if (!INLAY_FRETS.has(fret) || fret === 0) return null;
            const x = LEFT_PAD + i * CELL_W + CELL_W / 2;
            const y = TOP_PAD + 6 * CELL_H + BOT_PAD / 2;
            return <circle key={i} cx={x} cy={y} r={1.8} fill="#374151" />;
          })}

          {/* Note dots */}
          {positions.map((pos) => {
            const isRoot = pos.midiNote % 12 === rootMidi % 12;
            const fretIndex = pos.fret - startFret;
            if (fretIndex < 0 || fretIndex >= fretCount) return null;

            const cx = LEFT_PAD + fretIndex * CELL_W + CELL_W / 2;
            const cy = TOP_PAD + (pos.string - 1) * CELL_H + CELL_H / 2;
            const noteName = rootNotes[pos.midiNote % 12];
            const r = isRoot ? 7 : 6;

            return (
              <g key={`${pos.string}-${pos.fret}`}>
                <circle cx={cx} cy={cy} r={r} fill={isRoot ? '#f59e0b' : '#3b82f6'} />
                <text
                  x={cx}
                  y={cy + 3.5}
                  textAnchor="middle"
                  fontSize={isRoot ? 7.5 : 7}
                  fontWeight={isRoot ? 'bold' : 'normal'}
                  fill="white"
                >
                  {noteName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground/70 justify-center mt-0.5">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
          Root
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
          Scale note
        </span>
      </div>
    </div>
  );
}
