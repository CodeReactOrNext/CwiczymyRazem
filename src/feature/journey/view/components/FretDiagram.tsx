import type { FretDiagramData } from "../../types/journey.types";

interface FretDiagramProps {
  data: FretDiagramData;
}

// String 1 = high e (top row), string 6 = low E (bottom row) — same convention
// as the fretboard used inside the exercises themselves.
const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];
const STRING_WIDTHS = [1.5, 2, 2.6, 3.2, 4, 5];
const SINGLE_INLAY_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_INLAY_FRETS = new Set([12, 24]);

const CELL_W = 76;
const CELL_H = 46;
const TOP_PAD = 34;
const LEFT_PAD = 34;
const BOT_PAD = 10;

/**
 * Read-only SVG fretboard diagram for journey step content — renders the whole
 * neck (6 strings) but dims strings outside the exercise's scope and prints the
 * verified note name directly on every active cell in the given fret window.
 */
export function FretDiagram({ data }: FretDiagramProps) {
  const { startFret, endFret, strings } = data;
  const fretCount = endFret - startFret + 1;
  const neckH = 6 * CELL_H;
  const vw = LEFT_PAD + fretCount * CELL_W + 10;
  const vh = TOP_PAD + neckH + BOT_PAD;

  const byString = new Map(strings.map((s) => [s.string, s]));

  return (
    <div className="flex w-full justify-center rounded-lg bg-zinc-900/60 p-3">
      <svg
        viewBox={`0 0 ${vw} ${vh}`}
        style={{ width: `min(100%, ${vw}px)`, height: "auto" }}
        aria-label="Fretboard diagram"
      >
          <rect x={LEFT_PAD} y={TOP_PAD} width={vw - LEFT_PAD - 6} height={neckH} fill="#3f3f46" rx={4} />

          {/* Inlay markers — sit on the fretboard itself, between strings, like a real neck. */}
          {Array.from({ length: fretCount }, (_, i) => {
            const fret = startFret + i;
            if (fret === 0) return null;
            const x = LEFT_PAD + i * CELL_W + CELL_W / 2;
            const centerY = TOP_PAD + neckH / 2;
            if (SINGLE_INLAY_FRETS.has(fret)) {
              return <circle key={i} cx={x} cy={centerY} r={7} fill="#a1a1aa" opacity={0.7} />;
            }
            if (DOUBLE_INLAY_FRETS.has(fret)) {
              return (
                <g key={i}>
                  <circle cx={x} cy={centerY - CELL_H} r={7} fill="#a1a1aa" opacity={0.7} />
                  <circle cx={x} cy={centerY + CELL_H} r={7} fill="#a1a1aa" opacity={0.7} />
                </g>
              );
            }
            return null;
          })}

          {/* Fret lines */}
          {Array.from({ length: fretCount + 1 }, (_, i) => {
            const fret = startFret + i;
            const x = LEFT_PAD + i * CELL_W;
            const isNut = fret === 0;
            return (
              <line key={i} x1={x} y1={TOP_PAD} x2={x} y2={TOP_PAD + neckH} stroke={isNut ? "#f4f4f5" : "#71717a"} strokeWidth={isNut ? 5 : 1.5} />
            );
          })}

          {/* String lines */}
          {STRING_LABELS.map((_, i) => {
            const stringNum = i + 1;
            const active = byString.get(stringNum)?.active ?? false;
            const y = TOP_PAD + i * CELL_H + CELL_H / 2;
            return (
              <line key={i} x1={LEFT_PAD} y1={y} x2={vw - 6} y2={y} stroke="#d4d4d8" strokeWidth={STRING_WIDTHS[i]} opacity={active ? 1 : 0.25} />
            );
          })}

          {/* Fret numbers */}
          {Array.from({ length: fretCount }, (_, i) => {
            const fret = startFret + i;
            const x = LEFT_PAD + i * CELL_W + CELL_W / 2;
            return (
              <text key={i} x={x} y={TOP_PAD - 11} textAnchor="middle" fontSize={17} fontWeight="bold" fill="#67e8f9">
                {fret}
              </text>
            );
          })}

          {/* String labels */}
          {STRING_LABELS.map((label, i) => {
            const stringNum = i + 1;
            const active = byString.get(stringNum)?.active ?? false;
            const y = TOP_PAD + i * CELL_H + CELL_H / 2 + 6;
            return (
              <text key={i} x={LEFT_PAD - 12} y={y} textAnchor="end" fontSize={16} fontWeight="700" fill={active ? "#e4e4e7" : "#71717a"}>
                {label}
              </text>
            );
          })}

          {/* Note labels on active strings */}
          {STRING_LABELS.map((_, i) => {
            const stringNum = i + 1;
            const entry = byString.get(stringNum);
            if (!entry?.active || !entry.notes) return null;
            const y = TOP_PAD + i * CELL_H + CELL_H / 2 + 6;
            return entry.notes.map((note, idx) => {
              if (!note) return null;
              const x = LEFT_PAD + idx * CELL_W + CELL_W / 2;
              return (
                <g key={idx}>
                  <circle cx={x} cy={TOP_PAD + i * CELL_H + CELL_H / 2} r={18} fill="#0891b2" />
                  <text x={x} y={y} textAnchor="middle" fontSize={16} fontWeight="bold" fill="#ecfeff">
                    {note}
                  </text>
                </g>
              );
            });
          })}
        </svg>
    </div>
  );
}
