import React from 'react';

interface ScaleTone {
  fret: number;
  note: string;
}

const SCALE_TONES: ScaleTone[] = [
  { fret: 0, note: 'E' },
  { fret: 2, note: 'F#' },
  { fret: 4, note: 'G#' },
  { fret: 5, note: 'A' },
  { fret: 7, note: 'B' },
  { fret: 9, note: 'C#' },
  { fret: 11, note: 'D#' },
  { fret: 12, note: 'E' },
];

const ALL_FRETS = Array.from({ length: 13 }, (_, i) => i);

const FRET_X = (fret: number) => 40 + fret * 44;
const STRING_Y = 92;

/**
 * The exact "aha" diagram from the W-W-H-W-W-W-H major-scale explanation:
 * one string, frets 0-12, scale tones highlighted, whole/half-step gaps
 * labeled between them. Frets are drawn evenly spaced (not true fret
 * physics) since this is a teaching diagram, not a build spec.
 */
export const MajorScaleDiagram = () => {
  return (
    <div className="not-prose my-10 overflow-x-auto rounded-lg bg-zinc-900/40 p-6">
      <p className="text-sm font-medium text-zinc-200">The major scale, one string at a time</p>
      <p className="mt-1 text-xs text-zinc-500">Open E string, frets 0-12 — the same W-W-H-W-W-W-H pattern works from any starting note</p>

      <svg viewBox="0 0 610 150" className="mt-6 min-w-[560px]" role="img" aria-label="Diagram of the E major scale on the low E string, frets 0, 2, 4, 5, 7, 9, 11 and 12, with whole-step and half-step gaps labeled between each note.">
        <line x1={20} y1={STRING_Y} x2={590} y2={STRING_Y} stroke="#52525b" strokeWidth={2} />

        {ALL_FRETS.map((fret) => (
          <g key={fret}>
            <line x1={FRET_X(fret)} y1={STRING_Y - 10} x2={FRET_X(fret)} y2={STRING_Y + 10} stroke="#3f3f46" strokeWidth={1} />
            <text x={FRET_X(fret)} y={STRING_Y + 32} textAnchor="middle" fontSize={11} fill="#71717a">
              {fret}
            </text>
          </g>
        ))}
        <text x={305} y={STRING_Y + 52} textAnchor="middle" fontSize={11} fill="#52525b">
          fret number
        </text>

        {SCALE_TONES.slice(0, -1).map((tone, i) => {
          const next = SCALE_TONES[i + 1];
          const gap = next.fret - tone.fret;
          const midX = (FRET_X(tone.fret) + FRET_X(next.fret)) / 2;
          const label = gap === 1 ? 'H' : 'W';
          return (
            <g key={`gap-${tone.fret}`}>
              <rect x={midX - 11} y={18} width={22} height={20} rx={4} fill="#27272a" />
              <text x={midX} y={32} textAnchor="middle" fontSize={12} fontWeight={700} fill="#d4d4d8">
                {label}
              </text>
            </g>
          );
        })}

        {SCALE_TONES.map((tone) => (
          <g key={tone.fret}>
            <circle cx={FRET_X(tone.fret)} cy={STRING_Y} r={13} fill="#06b6d4" />
            <text x={FRET_X(tone.fret)} y={STRING_Y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#083344">
              {tone.note}
            </text>
          </g>
        ))}
      </svg>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        W = whole step (skip a fret), H = half step (next fret over). Every major scale, in any key, on any string, is built from this exact sequence — only the starting fret changes.
      </p>
    </div>
  );
};
