import { Checkbox } from "assets/components/ui/checkbox";
import { Label } from "assets/components/ui/label";
import { motion } from "framer-motion";
import { type ReactNode, useId, useState } from "react";

interface ClickableFretboardProps {
  startFret: number;
  endFret: number;
  /** Strings in play (1-6, 1 = high e). Undefined = all 6. */
  strings: number[] | undefined;
  /** "string-fret" keys already found. */
  foundKeys: string[];
  /** Total valid positions for this target — lets the header turn green on completion. */
  totalTargets: number;
  lastClick: { string: number; fret: number; correct: boolean; id: number; elapsedSeconds?: number } | null;
  /** Omitted → read-only "play it" board: no clickable cells, no hover. */
  onCellClick?: (string: number, fret: number) => void;
  /** Read-only mode: "string-fret" key the mic is hearing right now — pulses. */
  liveKey?: string | null;
  /** Replaces the default "FRETS x–y" caption. */
  title?: ReactNode;
}

const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];
const SINGLE_INLAY_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_INLAY_FRETS = new Set([12, 24]);

// Extra frets shown on each side of the actual search window, purely for
// spatial orientation — a lone fret (e.g. just fret 7) with nothing around it
// gives no sense of where it sits on the neck. These extra columns are never
// clickable.
const CONTEXT_FRETS = 3;

// Furthest fret any exercise's search window reaches — the ceiling for the
// "show whole neck" toggle so it always covers every exercise, not just this one.
const FULL_NECK_END_FRET = 12;

const SHOW_FULL_NECK_LS_KEY = "riffquest.clickableFretboard.showFullNeck";

const TIME_PILL_W = 165;
const TIME_PILL_H = 60;

const CELL_W = 190;
const ROW_H = 75;
const TOP_PAD = 55;
const LEFT_PAD = 55;
const BOT_PAD = 18;
// Dark strip below the last string where the fret lines all lean the same way
// (a uniform slant, not a radiating fan) instead of staying parallel — a small
// 3D/perspective flourish so the neck doesn't just end in a flat rectangle.
const BOTTOM_BAND_H = 35;
const BOTTOM_LEAN = 13;

// The nut is a wide, solid-colored bar straddling the fret 0 / fret 1
// boundary — replacing what would otherwise be a plain thin fret divider.
const NUT_WIDTH = 18;

// Strings are the instrument — brushed steel, not stark white, so it reads as
// metal rather than UI text. Frets are just structural markers on the neck —
// thin, muted, and stay out of the way.
const STRING_ACTIVE_COLOR = "#9ca3af";
const STRING_ACTIVE_HIGHLIGHT = "#d1d5db";
const STRING_INACTIVE_COLOR = "#57534e";
const FRET_COLOR = "#52525b";
const FRET_NUMBER_COLOR = "#a1a1aa";
const FRET_NUMBER_CONTEXT_COLOR = "#52525b";

// Real string gauges get thinner from low E (thickest) to high e (thinnest).
// Index 0 = string 1 (high e) .. index 5 = string 6 (low E).
const STRING_ACTIVE_WIDTHS = [3, 3.6, 4.4, 5.4, 6.6, 8];
const STRING_INACTIVE_WIDTHS = [1, 1.1, 1.3, 1.5, 1.8, 2.2];

/**
 * The exercise's neck diagram, shared by the click drills and the mic-driven
 * hunts: zooms in on the fret window (plus a few context frets on each side, so
 * a narrow or single-fret window doesn't float in isolation) so cells are big and
 * easy to read or hit. All 6 strings keep the same row height — a real
 * fretboard's proportions. Strings carry the "in-scope" signal through bold
 * chrome color and thickness, with everything off-scope dimmed behind a scrim;
 * frets are kept deliberately subdued so they never compete with the strings.
 *
 * Without `onCellClick` it renders read-only — the "play this on your guitar"
 * board, where progress comes from the mic instead of taps.
 */
export function ClickableFretboard({
  startFret,
  endFret,
  strings,
  foundKeys,
  totalTargets,
  lastClick,
  onCellClick,
  liveKey,
  title,
}: ClickableFretboardProps) {
  const isInScope = (stringNum: number) => !strings || strings.includes(stringNum);
  const found = new Set(foundKeys);
  const allFound = totalTargets > 0 && found.size >= totalTargets;
  const interactive = !!onCellClick;
  // Only worth shouting about which string to use when the exercise actually
  // narrows it down — with all six in play there's nothing to distinguish.
  const stringScoped = !!strings && strings.length < 6;

  // Persisted across sessions — some players prefer to always see the whole
  // neck for orientation instead of the zoomed search window + context frets.
  const [showFullNeck, setShowFullNeck] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SHOW_FULL_NECK_LS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const toggleShowFullNeck = (checked: boolean) => {
    setShowFullNeck(checked);
    try {
      localStorage.setItem(SHOW_FULL_NECK_LS_KEY, checked ? "1" : "0");
    } catch {}
  };

  const displayStart = showFullNeck ? 0 : Math.max(0, startFret - CONTEXT_FRETS);
  const displayEnd = showFullNeck ? Math.max(endFret, FULL_NECK_END_FRET) : endFret + CONTEXT_FRETS;
  const fretCount = displayEnd - displayStart + 1;
  const showNut = displayStart === 0;
  const neckX = LEFT_PAD;
  // Fret 0 (the open string) only needs half a cell — the nut sits at its
  // right edge — so every other fret shifts left by half a cell width.
  const colWidth = (fret: number) => (showNut && fret === 0 ? CELL_W / 2 : CELL_W);
  const colX = (fret: number): number => {
    if (!showNut) return neckX + (fret - displayStart) * CELL_W;
    if (fret <= 0) return neckX;
    return neckX + CELL_W / 2 + (fret - 1) * CELL_W;
  };
  // The nut replaces the plain divider between fret 0 and fret 1, instead of
  // taking its own extra slot before fret 0.
  const nutCenterX = colX(1);

  const vw = colX(displayEnd + 1) + 10;
  const neckH = 6 * ROW_H;
  const vh = TOP_PAD + neckH + BOTTOM_BAND_H + BOT_PAD;
  const neckW = vw - neckX - 6;
  const nutColor = allFound ? "#34d399" : "#f59e0b";

  const rowY = (i: number) => TOP_PAD + i * ROW_H;
  const reactId = useId();
  const gradientId = `ckfb-neck-${reactId}`;
  const sheenId = `ckfb-sheen-${reactId}`;
  const clipId = `ckfb-clip-${reactId}`;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        <p className="text-center text-sm font-bold tracking-widest text-zinc-200">
          {title ?? `FRETS ${startFret}–${endFret}`}
        </p>
        <div className="flex items-center gap-2">
          <Checkbox id="show-full-neck" checked={showFullNeck} onCheckedChange={(checked) => toggleShowFullNeck(checked === true)} />
          <Label htmlFor="show-full-neck" className="cursor-pointer text-xs font-semibold tracking-wide text-zinc-400">
            Show whole neck
          </Label>
        </div>
      </div>
      <div className="flex w-full justify-center">
        <svg
          viewBox={`0 0 ${vw} ${vh}`}
          style={{ width: `min(100%, ${vw}px)`, height: "auto", display: "block" }}
          aria-label="Clickable fretboard"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#26232a" />
              <stop offset={`${(neckH / (neckH + BOTTOM_BAND_H)) * 100}%`} stopColor="#0c0b0d" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
            <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0.3">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <clipPath id={clipId}>
              <rect x={neckX} y={TOP_PAD} width={neckW} height={neckH + BOTTOM_BAND_H} rx={6} />
            </clipPath>
          </defs>

          <rect x={neckX} y={TOP_PAD} width={neckW} height={neckH + BOTTOM_BAND_H} rx={6} fill={`url(#${gradientId})`} />
          <rect x={neckX} y={TOP_PAD} width={neckW} height={neckH} fill={`url(#${sheenId})`} clipPath={`url(#${clipId})`} />

          {/* Search-zone band — marks exactly which columns are clickable,
              distinguishing them from the surrounding context-only frets. */}
          <rect
            x={colX(startFret)}
            y={TOP_PAD}
            width={colX(endFret + 1) - colX(startFret)}
            height={neckH}
            fill={allFound ? "#34d399" : "#22d3ee"}
            opacity={0.08}
          />

          {/* String-scope band — runs the full length of the neck along every
              string in play. Crossed with the fret window above, the two bands
              intersect exactly on the cells that count. */}
          {stringScoped && STRING_LABELS.map((_, i) =>
            isInScope(i + 1) ? (
              <rect
                key={i}
                x={neckX}
                y={rowY(i)}
                width={neckW}
                height={ROW_H}
                fill={allFound ? "#34d399" : "#22d3ee"}
                opacity={0.1}
              />
            ) : null,
          )}

          {/* Inlay markers — sit on the fretboard itself, between strings, like a real neck. */}
          {Array.from({ length: fretCount }, (_, i) => {
            const fret = displayStart + i;
            if (fret === 0) return null;
            const x = colX(fret) + CELL_W / 2;
            const centerY = TOP_PAD + neckH / 2;
            if (SINGLE_INLAY_FRETS.has(fret)) {
              return <circle key={i} cx={x} cy={centerY} r={11} fill="#a1a1aa" className="pointer-events-none" />;
            }
            if (DOUBLE_INLAY_FRETS.has(fret)) {
              return (
                <g key={i} className="pointer-events-none">
                  <circle cx={x} cy={centerY - ROW_H} r={11} fill="#a1a1aa" />
                  <circle cx={x} cy={centerY + ROW_H} r={11} fill="#a1a1aa" />
                </g>
              );
            }
            return null;
          })}

          {/* Fret dividers — thin and muted, deliberately understated next to the strings. */}
          {Array.from({ length: fretCount + 1 }, (_, i) => {
            const fret = displayStart + i;
            const x = colX(fret);
            if (fret === 0 || (fret === 1 && showNut)) return null;
            return (
              <line
                key={i}
                x1={x}
                y1={TOP_PAD}
                x2={x}
                y2={TOP_PAD + neckH}
                stroke={FRET_COLOR}
                strokeWidth={3}
                opacity={0.5}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Bottom band — frets all lean the same way at the same angle here
              instead of staying parallel, a small perspective flourish under
              the last string. */}
          {Array.from({ length: fretCount + 1 }, (_, i) => {
            const fret = displayStart + i;
            const x = colX(fret);
            if (fret === 0 || (fret === 1 && showNut)) return null;
            const spreadX = x - BOTTOM_LEAN;
            return (
              <line
                key={i}
                x1={x}
                y1={TOP_PAD + neckH}
                x2={spreadX}
                y2={TOP_PAD + neckH + BOTTOM_BAND_H}
                stroke={FRET_COLOR}
                strokeWidth={3}
                opacity={0.4}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Side-dot markers in the bottom band, following the same lean as the
              fret lines there — like the position dots on the edge of a real neck. */}
          {Array.from({ length: fretCount }, (_, i) => {
            const fret = displayStart + i;
            if (!SINGLE_INLAY_FRETS.has(fret) && !DOUBLE_INLAY_FRETS.has(fret)) return null;
            const xTop = colX(fret) + CELL_W / 2;
            const x = xTop - BOTTOM_LEAN / 2;
            const y = TOP_PAD + neckH + BOTTOM_BAND_H / 2;
            return <circle key={i} cx={x} cy={y} r={8} fill="#3f3f46" className="pointer-events-none" />;
          })}

          {/* Nut — replaces the plain divider between fret 0 and fret 1: wide,
              solid-colored, straddling that boundary. Continues into the
              bottom band with the same lean/skew as the frets there, instead
              of a straight-down bar. */}
          {showNut && (() => {
            const nutLeft = nutCenterX - NUT_WIDTH / 2;
            const nutRight = nutCenterX + NUT_WIDTH / 2;
            return (
              <>
                <rect x={nutLeft} y={TOP_PAD - 4} width={NUT_WIDTH} height={neckH + 8} rx={4} fill={nutColor} />
                <polygon
                  points={`${nutLeft},${TOP_PAD + neckH} ${nutRight},${TOP_PAD + neckH} ${nutRight - BOTTOM_LEAN},${TOP_PAD + neckH + BOTTOM_BAND_H} ${nutLeft - BOTTOM_LEAN},${TOP_PAD + neckH + BOTTOM_BAND_H}`}
                  fill={nutColor}
                  opacity={0.75}
                />
              </>
            );
          })()}

          {/* Strings — bright chrome with a soft highlight stroke for a metallic
              sheen, thicker toward the low E like real string gauges. */}
          {STRING_LABELS.map((_, i) => {
            const stringNum = i + 1;
            const active = isInScope(stringNum);
            const y = rowY(i) + ROW_H / 2;
            const width = active ? STRING_ACTIVE_WIDTHS[i] : STRING_INACTIVE_WIDTHS[i];
            return (
              <g key={i}>
                <line
                  x1={neckX}
                  y1={y}
                  x2={vw - 6}
                  y2={y}
                  stroke={active ? STRING_ACTIVE_COLOR : STRING_INACTIVE_COLOR}
                  strokeWidth={width}
                  opacity={active ? 1 : 0.5}
                  strokeLinecap="round"
                />
                {active && (
                  <line
                    x1={neckX}
                    y1={y - width / 4}
                    x2={vw - 6}
                    y2={y - width / 4}
                    stroke={STRING_ACTIVE_HIGHLIGHT}
                    strokeWidth={Math.max(1, width / 4)}
                    opacity={0.5}
                    strokeLinecap="round"
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}

          {/* Scrim over every string that is out of play — pushes the whole row
              (frets, inlays and all) behind the one the exercise is asking for. */}
          {stringScoped && STRING_LABELS.map((_, i) =>
            isInScope(i + 1) ? null : (
              <rect
                key={i}
                x={neckX}
                y={rowY(i)}
                width={neckW}
                height={ROW_H}
                fill="#09090b"
                opacity={0.55}
                className="pointer-events-none"
              />
            ),
          )}

          {/* Fret numbers — plain text above the neck, dimmer for context-only frets. */}
          {Array.from({ length: fretCount }, (_, i) => {
            const fret = displayStart + i;
            const inTarget = fret >= startFret && fret <= endFret;
            const x = colX(fret) + colWidth(fret) / 2;
            return (
              <text
                key={i}
                x={x}
                y={TOP_PAD - 22}
                textAnchor="middle"
                fontSize={inTarget ? 30 : 22}
                fontWeight={inTarget ? "bold" : "600"}
                fill={inTarget ? FRET_NUMBER_COLOR : FRET_NUMBER_CONTEXT_COLOR}
                opacity={inTarget ? 1 : 0.6}
              >
                {fret}
              </text>
            );
          })}

          {/* String labels — the string(s) actually in play read as the loudest
              thing on the diagram; everything else recedes. */}
          {STRING_LABELS.map((label, i) => {
            const stringNum = i + 1;
            const active = isInScope(stringNum);
            const y = rowY(i) + ROW_H / 2 + (active ? 10 : 6);
            return (
              <text
                key={i}
                x={LEFT_PAD - 20}
                y={y}
                textAnchor="end"
                fontSize={active ? 32 : 20}
                fontWeight={active ? "800" : "600"}
                fill={active ? (stringScoped ? "#67e8f9" : STRING_ACTIVE_COLOR) : STRING_INACTIVE_COLOR}
              >
                {label}
              </text>
            );
          })}

          {/* Target cells — only inside in-scope rows, only inside the actual
              search window. Read-only boards keep the found markers but drop the
              hit areas: nothing here is answerable by clicking. */}
          {STRING_LABELS.map((_, i) => {
            const stringNum = i + 1;
            if (!isInScope(stringNum)) return null;
            const y = rowY(i);
            const cells = [];
            for (let fret = startFret; fret <= endFret; fret++) {
              const x = colX(fret);
              const w = colWidth(fret);
              const key = `${stringNum}-${fret}`;
              const isFound = found.has(key);
              const cx = x + w / 2;
              const cy = y + ROW_H / 2;
              cells.push(
                <g key={key}>
                  {interactive && (
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={w - 2}
                      height={ROW_H - 2}
                      fill="transparent"
                      className="cursor-pointer transition-colors hover:fill-zinc-200/10"
                      onClick={() => onCellClick!(stringNum, fret)}
                    />
                  )}
                  {!isFound && liveKey === key && (
                    <motion.circle
                      cx={cx}
                      cy={cy}
                      r={30}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth={5}
                      initial={{ opacity: 0.9, scale: 0.75 }}
                      animate={{ opacity: [0.9, 0.2, 0.9], scale: [0.75, 1.15, 0.75] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      style={{ transformOrigin: `${cx}px ${cy}px` }}
                      className="pointer-events-none"
                    />
                  )}
                  {isFound && (
                    <g className="pointer-events-none">
                      <circle cx={cx} cy={cy} r={42} fill="#10b981" opacity={0.12} />
                      <circle cx={cx} cy={cy} r={32} fill="#10b981" opacity={0.2} />
                      <circle cx={cx} cy={cy} r={24} fill="#10b981" stroke="#052e1f" strokeWidth={3} />
                      <text x={cx} y={cy + 9} textAnchor="middle" fontSize={27} fontWeight="bold" fill="#052e1f">
                        ✓
                      </text>
                    </g>
                  )}
                </g>,
              );
            }
            return cells;
          })}

          {/* One-shot flash on the last clicked cell — keyed by click id so it
              replays on every click without needing local state/timers; framer-motion
              animates itself to opacity 0 and simply stays there until the next key. */}
          {lastClick && isInScope(lastClick.string) && (
            <motion.rect
              key={lastClick.id}
              x={colX(lastClick.fret)}
              y={rowY(lastClick.string - 1)}
              width={colWidth(lastClick.fret)}
              height={ROW_H}
              fill={lastClick.correct ? "#34d399" : "#ef4444"}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="pointer-events-none"
            />
          )}

          {/* "✓ 1.3s" tooltip — how long it took to find this position, floating
              above the cell (below it if the cell is on the top row, so it never
              gets clipped by the fret numbers). */}
          {lastClick && lastClick.correct && lastClick.elapsedSeconds !== undefined && isInScope(lastClick.string) && (() => {
            const cellCenterX = colX(lastClick.fret) + colWidth(lastClick.fret) / 2;
            const rowTop = rowY(lastClick.string - 1);
            const above = rowTop - TIME_PILL_H - 10 >= 0;
            const pillY = above ? rowTop - TIME_PILL_H - 10 : rowTop + ROW_H + 10;
            const pillX = cellCenterX - TIME_PILL_W / 2;
            return (
              <motion.g
                key={`time-${lastClick.id}`}
                initial={{ opacity: 0, y: above ? 6 : -6, scale: 0.7 }}
                animate={{ opacity: [0, 1, 1, 0], y: [above ? 6 : -6, 0, 0, above ? -6 : 6], scale: [0.7, 1, 1, 0.95] }}
                transition={{ duration: 1.4, times: [0, 0.15, 0.75, 1] }}
                className="pointer-events-none"
              >
                <rect x={pillX} y={pillY} width={TIME_PILL_W} height={TIME_PILL_H} rx={12} fill="#18181b" stroke="#10b981" strokeWidth={2.5} />
                <circle cx={pillX + 32} cy={pillY + TIME_PILL_H / 2} r={17} fill="#10b981" />
                <text x={pillX + 32} y={pillY + TIME_PILL_H / 2 + 7} textAnchor="middle" fontSize={20} fontWeight="bold" fill="#052e1f">
                  ✓
                </text>
                <text x={pillX + 58} y={pillY + TIME_PILL_H / 2 + 9} textAnchor="start" fontSize={27} fontWeight="800" fill="#ffffff">
                  {lastClick.elapsedSeconds.toFixed(1)}s
                </text>
              </motion.g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
