import { mirrorStyle, uprightTransform, useIsLeftHanded } from "hooks/useHandedness";
import { useTranslation } from "hooks/useTranslation";
import { memo } from "react";

import type { GuitarString } from "../calibration.constants";

const DEFAULT_FRETS = 7;
const CELL_W = 64;
const ROW_H = 30;
const LEFT = 44;
const TOP = 14;
const BOTTOM = 34;
const INLAYS = new Set([3, 5, 7, 9]);

const BOARD = "#18181b";
const WIRE = "#3f3f46";
const NUT = "#a1a1aa";
const STRING = "#71717a";
const LABEL = "#a1a1aa";
const LABEL_ON = "#fafafa";

/**
 * Where the sustain test's note is: the first frets of the neck, strings as the
 * tab draws them (thinnest on top), the note's spot marked. Mirrored for
 * left-handed players like every other neck in the app.
 */
// Memoised: the step around it re-renders ~20×/s while the test runs, the neck
// only when the dot lights up.
export const SustainNeck = memo(function SustainNeck({
  strings, string, fret, note, lit, frets: FRETS = DEFAULT_FRETS,
}: {
  strings: GuitarString[];
  /** String number of the note (1 = thinnest). */
  string: number;
  fret: number;
  note: string;
  /** The note is being heard — the dot lights up. */
  lit: boolean;
  /** Frets drawn — fewer on a phone, so the labels stay readable at its width. */
  frets?: number;
}) {
  const { t } = useTranslation("session");
  const leftHanded = useIsLeftHanded();
  const rows = [...strings].sort((a, b) => a.id - b.id);
  const width = LEFT + FRETS * CELL_W + 8;
  const height = TOP + rows.length * ROW_H + BOTTOM;
  const boardTop = TOP;
  const boardBottom = TOP + rows.length * ROW_H;
  const rowY = (i: number) => TOP + i * ROW_H + ROW_H / 2;
  const fretX = (f: number) => LEFT + f * CELL_W;
  const targetRow = rows.findIndex((s) => s.id === string);
  const dotX = fretX(fret) - CELL_W / 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      style={{ transform: mirrorStyle(leftHanded) }}
      role="img"
      aria-label={leftHanded ? t("fretboard.diagram_lefty") : t("fretboard.diagram")}
    >
      <rect x={LEFT} y={boardTop} width={FRETS * CELL_W} height={boardBottom - boardTop} rx={6} fill={BOARD} />

      {[...INLAYS].filter((f) => f <= FRETS).map((f) => (
        <circle key={f} cx={fretX(f) - CELL_W / 2} cy={(boardTop + boardBottom) / 2} r={6} fill="#27272a" />
      ))}

      {Array.from({ length: FRETS }, (_, i) => (
        <line key={i} x1={fretX(i + 1)} y1={boardTop} x2={fretX(i + 1)} y2={boardBottom} stroke={WIRE} strokeWidth={2} />
      ))}
      <rect x={LEFT - 2} y={boardTop} width={5} height={boardBottom - boardTop} fill={NUT} />

      {rows.map((s, i) => {
        const thickness = 0.8 + (s.id - 1) * 0.35;
        const on = s.id === string;
        return (
          <g key={s.id}>
            <line x1={LEFT} y1={rowY(i)} x2={width - 8} y2={rowY(i)} stroke={on ? "#d4d4d8" : STRING} strokeWidth={thickness} />
            <text
              x={LEFT / 2 - 4}
              y={rowY(i) + 5}
              textAnchor="middle"
              fontSize={14}
              fontWeight={on ? 700 : 500}
              fill={on ? LABEL_ON : LABEL}
              transform={uprightTransform(LEFT / 2 - 4, leftHanded)}
            >
              {s.name.replace(/\d+$/, "")}
            </text>
          </g>
        );
      })}

      {Array.from({ length: FRETS }, (_, i) => {
        const f = i + 1;
        const x = fretX(f) - CELL_W / 2;
        return (
          <text
            key={f}
            x={x}
            y={height - 10}
            textAnchor="middle"
            fontSize={13}
            fontWeight={f === fret ? 700 : 500}
            fill={f === fret ? LABEL_ON : "#71717a"}
            transform={uprightTransform(x, leftHanded)}
          >
            {f}
          </text>
        );
      })}

      {targetRow >= 0 && (
        <g>
          <circle
            cx={dotX}
            cy={rowY(targetRow)}
            r={15}
            fill={lit ? "#10b981" : "#f4f4f5"}
            style={{ transition: "fill 150ms" }}
          />
          <text
            x={dotX}
            y={rowY(targetRow) + 4.5}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill={lit ? "#022c22" : "#09090b"}
            transform={uprightTransform(dotX, leftHanded)}
          >
            {note.replace(/\d+$/, "")}
          </text>
        </g>
      )}
    </svg>
  );
});
