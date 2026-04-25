import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

interface TablaturePreviewProps {
  measures: TablatureMeasure[];
  className?: string;
}

const STRING_COLORS = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#60a5fa", "#c084fc"] as const;

const VIEW_W      = 280;
const LABEL_W     = 2;
const V_PAD       = 8;
const STR_SPACING = 11;
const ROW_H       = V_PAD * 2 + STR_SPACING * 5;

export const TablaturePreview = ({ measures, className }: TablaturePreviewProps) => {
  const measure = measures[0];
  if (!measure || measure.beats.length === 0) return null;

  const { beats } = measure;
  const availW = VIEW_W - LABEL_W - 4;

  // ── Duration-based x positions ──────────────────────────────────────────────
  const totalDuration = beats.reduce((sum, b) => sum + b.duration, 0);
  let cumDur = 0;
  const beatMeta = beats.map((beat) => {
    const slotW  = (beat.duration / totalDuration) * availW;
    const cx     = LABEL_W + (cumDur / totalDuration) * availW + slotW / 2;
    cumDur += beat.duration;
    return { cx, slotW };
  });

  const strY = (s: number) => V_PAD + (s - 1) * STR_SPACING;

  // ── Build render elements in one pass ───────────────────────────────────────
  // Track last note cx per string for HO/PO arcs
  const lastCx: Record<number, number> = {};

  const arcs: React.ReactNode[] = [];
  const notes: React.ReactNode[] = [];

  beats.forEach((beat, bi) => {
    const { cx, slotW } = beatMeta[bi];

    beat.notes.forEach((note) => {
      const cy     = strY(note.string);
      const txt    = String(note.fret);
      const color  = STRING_COLORS[note.string - 1];
      const bgW    = Math.min(slotW - 2, txt.length > 1 ? 13 : 10);
      const key    = `${bi}-${note.string}`;

      // ── Hammer-on / Pull-off arc ───────────────────────────────────────────
      const technique = note.isHammerOn ? "h" : note.isPullOff ? "p" : null;
      if (technique && lastCx[note.string] !== undefined) {
        const x1   = lastCx[note.string];
        const x2   = cx;
        const midX = (x1 + x2) / 2;
        const arcY = cy - 5;
        arcs.push(
          <g key={`arc-${key}`}>
            <path
              d={`M ${x1} ${arcY + 1} Q ${midX} ${arcY - 4} ${x2} ${arcY + 1}`}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={0.7}
            />
            <text
              x={midX}
              y={arcY - 5}
              fill="rgba(255,255,255,0.45)"
              fontSize={5}
              fontFamily="monospace"
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {technique}
            </text>
          </g>
        );
      }

      // ── Bend indicator ─────────────────────────────────────────────────────
      if (note.isBend) {
        notes.push(
          <text
            key={`bend-${key}`}
            x={cx + bgW / 2 + 1}
            y={cy - 4}
            fill={color}
            fontSize={5}
            fontFamily="monospace"
            fontWeight="700"
            opacity={0.7}
          >
            b
          </text>
        );
      }

      // ── Sustain line (duration width indicator) ────────────────────────────
      const sustainX1 = cx + bgW / 2 + 1;
      const sustainX2 = cx + slotW / 2 - 1;
      if (sustainX2 > sustainX1 + 2) {
        notes.push(
          <line
            key={`sus-${key}`}
            x1={sustainX1}
            y1={cy}
            x2={sustainX2}
            y2={cy}
            stroke={color}
            strokeWidth={0.8}
            opacity={0.25}
          />
        );
      }

      // ── Pill + fret number ─────────────────────────────────────────────────
      notes.push(
        <g key={`note-${key}`}>
          <rect
            x={cx - bgW / 2}
            y={cy - 6}
            width={bgW}
            height={12}
            fill={color}
            fillOpacity={0.22}
            rx={2}
          />
          <text
            x={cx}
            y={cy}
            fill="white"
            fontSize={8.5}
            fontFamily="monospace"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {txt}
          </text>
        </g>
      );

      lastCx[note.string] = cx;
    });
  });

  return (
    <div
      className={cn("w-full rounded-lg overflow-hidden", className)}
      style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.45))" }}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${ROW_H}`}
        preserveAspectRatio="xMinYMid meet"
        style={{ display: "block", width: "100%" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tabFadeRight" x1="0" x2="1" y1="0" y2="0">
            <stop offset="65%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="tabMask">
            <rect x="0" y="0" width={VIEW_W} height={ROW_H} fill="url(#tabFadeRight)" />
          </mask>
        </defs>

        <g mask="url(#tabMask)">
          {/* String lines */}
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <line
              key={s}
              x1={LABEL_W - 1}
              y1={strY(s)}
              x2={VIEW_W - 2}
              y2={strY(s)}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />
          ))}

          {/* Left barline */}
          <line
            x1={LABEL_W - 1}
            y1={strY(1)}
            x2={LABEL_W - 1}
            y2={strY(6)}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={0.8}
          />

          {/* Arcs below notes (render first so notes appear on top) */}
          {arcs}

          {/* Notes */}
          {notes}
        </g>
      </svg>
    </div>
  );
};
