import { getNotePositionsInRange } from "feature/exercisePlan/scales/fretboardMapper";
import { NOTES } from "utils/audio/noteUtils";

interface NoteHuntFretboardProps {
  targetNote: string;
  startFret: number;
  endFret: number;
  /** Octaves of the target the player has already located (any string). */
  foundOctaves: number[];
  isMatch: boolean;
}

// String 1 = high e (top row), String 6 = low E (bottom row).
const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];
const STRING_WIDTHS = [1, 1.3, 1.7, 2.1, 2.6, 3.2];
const INLAY_FRETS = new Set([3, 5, 7, 9, 12, 15]);
const MAX_FRET = 15;

const CELL_W = 30;
const CELL_H = 24;
const TOP_PAD = 22;
const LEFT_PAD = 24;
const BOT_PAD = 16;

/**
 * Shows the WHOLE neck and only highlights the fret window the player must search
 * — it deliberately does NOT reveal the target's positions (that's the challenge).
 * The band turns green once every octave of the target inside it has been found.
 */
export function NoteHuntFretboard({ targetNote, startFret, endFret, foundOctaves, isMatch }: NoteHuntFretboardProps) {
  const pitchClass = NOTES.indexOf(targetNote);
  const regionOctaves = pitchClass < 0
    ? []
    : Array.from(new Set(getNotePositionsInRange(pitchClass, startFret, endFret).map(p => p.octave)));
  const allFound = regionOctaves.length > 0 && regionOctaves.every(o => foundOctaves.includes(o));

  const fretCount = MAX_FRET + 1; // frets 0..MAX_FRET
  const neckH = 6 * CELL_H;
  const vw = LEFT_PAD + fretCount * CELL_W;
  const vh = TOP_PAD + neckH + BOT_PAD;

  const bandX = LEFT_PAD + startFret * CELL_W;
  const bandW = (endFret - startFret + 1) * CELL_W;
  const bandColor = allFound ? "#34d399" : isMatch ? "#6ee7b7" : "#38bdf8";

  return (
    <div className="w-full max-w-xl rounded-lg bg-zinc-800/80 p-3 shadow-lg ring-1 ring-white/10">
      <p className="mb-2 text-center text-xs font-bold tracking-widest text-zinc-200">
        FIND <span className="text-cyan-300">{targetNote}</span> IN FRETS {startFret}–{endFret}
      </p>
      <div style={{ height: "180px", width: "100%" }}>
        <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label="Note hunt fretboard">
          {/* Neck background for contrast */}
          <rect x={LEFT_PAD} y={TOP_PAD} width={vw - LEFT_PAD} height={neckH} fill="#3f3f46" rx={3} />

          {/* Highlighted search region */}
          <rect x={bandX} y={TOP_PAD} width={bandW} height={neckH} fill={bandColor} opacity={0.3} rx={3} />
          <rect x={bandX} y={TOP_PAD - 3} width={bandW} height={neckH + 6} fill="none" stroke={bandColor} strokeWidth={2.5} rx={4} />

          {/* Fret lines */}
          {Array.from({ length: fretCount + 1 }, (_, i) => {
            const x = LEFT_PAD + i * CELL_W;
            const isNut = i === 0;
            return (
              <line key={i} x1={x} y1={TOP_PAD} x2={x} y2={TOP_PAD + neckH} stroke={isNut ? "#f4f4f5" : "#71717a"} strokeWidth={isNut ? 4 : 1.5} />
            );
          })}

          {/* String lines */}
          {STRING_LABELS.map((_, i) => {
            const y = TOP_PAD + i * CELL_H + CELL_H / 2;
            return <line key={i} x1={LEFT_PAD} y1={y} x2={vw} y2={y} stroke="#d4d4d8" strokeWidth={STRING_WIDTHS[i]} />;
          })}

          {/* Fret numbers */}
          {Array.from({ length: fretCount }, (_, i) => {
            if (i === 0) return null;
            const inRegion = i >= startFret && i <= endFret;
            const x = LEFT_PAD + i * CELL_W + CELL_W / 2;
            return (
              <text key={i} x={x} y={TOP_PAD - 7} textAnchor="middle" fontSize={11} fontWeight={inRegion ? "bold" : "500"} fill={inRegion ? "#67e8f9" : "#d4d4d8"}>
                {i}
              </text>
            );
          })}

          {/* String labels */}
          {STRING_LABELS.map((label, i) => {
            const y = TOP_PAD + i * CELL_H + CELL_H / 2 + 3.5;
            return <text key={i} x={LEFT_PAD - 7} y={y} textAnchor="end" fontSize={10} fontWeight="600" fill="#a1a1aa">{label}</text>;
          })}

          {/* Inlay markers */}
          {Array.from({ length: fretCount }, (_, i) => {
            if (!INLAY_FRETS.has(i) || i === 0) return null;
            const x = LEFT_PAD + i * CELL_W + CELL_W / 2;
            const y = TOP_PAD + neckH + BOT_PAD / 2;
            return <circle key={i} cx={x} cy={y} r={2.5} fill="#a1a1aa" />;
          })}
        </svg>
      </div>
    </div>
  );
}
