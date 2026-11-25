import { motion } from "framer-motion";
import { mirrorStyle, uprightTransform, useIsLeftHanded } from "hooks/useHandedness";
import { useTranslation } from "hooks/useTranslation";
import { useColorTheme } from "lib/colorTheme/colorTheme";
import { type CSSProperties, memo, useCallback, useId, useLayoutEffect, useRef, useState } from "react";

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
  /** Cells already solved in an EARLIER step of the same round (the interval
   *  drill's located roots) — kept on the board in amber under `markedLabel`, so
   *  the answer to step 2 can be read off the shapes the player just built. */
  markedKeys?: string[];
  /** Single character drawn inside every `markedKeys` marker, e.g. "R". */
  markedLabel?: string;
  /** Words for the markers on found, marked and revealed cells — note names. A
   *  found cell without one is ticked. */
  cellLabels?: Record<string, string>;
  /** Cells shown as the answer nobody found, drawn hollow. */
  revealKeys?: string[];
  /** Two cells joined by a line, behind their markers. */
  linkKeys?: readonly [string, string];
  /** Marks the last clicked cell as wrong, under this name. */
  wrongLabel?: string;
  /** Cells the current step still accepts, tinted as a zone — the interval drill's
   *  hand span around the placed root. A whole area, never the answers alone. */
  zoneKeys?: string[];
  /** Zooms out to the whole neck. Owned by the panel (see `useShowFullNeck`), so
   *  the toggle can sit in its control row instead of in a caption above the
   *  board — the neck itself draws exactly the same either way. */
  showFullNeck?: boolean;
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
export const FULL_NECK_END_FRET = 12;

const SHOW_FULL_NECK_LS_KEY = "riffquest.clickableFretboard.showFullNeck";

/**
 * Whole-neck preference, persisted across sessions — some players prefer to
 * always see the whole neck for orientation instead of the zoomed search window
 * + context frets. Lives outside the board so the panel can put the toggle in
 * its own control row.
 */
export function useShowFullNeck() {
  const [showFullNeck, setShowFullNeck] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SHOW_FULL_NECK_LS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const toggle = useCallback((next: boolean) => {
    setShowFullNeck(next);
    try {
      localStorage.setItem(SHOW_FULL_NECK_LS_KEY, next ? "1" : "0");
    } catch {}
  }, []);
  return [showFullNeck, toggle] as const;
}

const TIME_PILL_W = 165;
const TIME_PILL_H = 60;
// Square the mic's pulsing ring is drawn in — its r=30 circle plus the stroke.
const LIVE_RING_BOX = 70;
const WRONG_MARK_BOX = 72;
// A marker that has to hold a note name, up to "A#".
const LABELLED_MARK_R = 33;

const CELL_W = 190;
const ROW_H = 75;
// Narrow screens: floor for how small a fret column may render before the board
// starts scrolling sideways instead of shrinking further. Squeezing ~13 columns
// into a phone width leaves rows a dozen pixels tall — unreadable and untappable.
// Lifted at sm: from there the board fits at full width anyway.
const MIN_COL_PX = 78;
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

/**
 * Everything on the board that has a colour, per theme. The neck is drawn in
 * raw SVG colours, which the light theme's palette remap never reaches, so it
 * carries its own pair.
 */
interface NeckColors {
  /** The fretboard, top to bottom. */
  neckTop: string;
  neckBottom: string;
  /** The neck's edge under the last string, top to bottom. */
  edgeTop: string;
  edgeBottom: string;
  sheenOpacity: number;
  // Frets are just structural markers on the neck — thin, muted, and stay out
  // of the way. Strings are the instrument — brushed steel, not stark white, so
  // it reads as metal rather than UI text.
  fret: string;
  fretOpacity: number;
  inlay: string;
  inlayOpacity: number;
  sideDot: string;
  nut: string;
  string: string;
  stringHighlight: string;
  stringOff: string;
  stringOffOpacity: number;
  /** Added to the thin out-of-play strings, which a bright neck swallows. */
  stringOffExtraWidth: number;
  /** The fret window: the columns that count. */
  window: string;
  windowOpacity: number;
  /** The same window while the zone inside it is lit. */
  windowBehindZoneOpacity: number;
  /** The string(s) in play, along the whole neck. */
  row: string;
  rowOpacity: number;
  /** …and where they cross the window: the cells that count. */
  rowInWindowOpacity: number;
  zone: string;
  zoneOpacity: number;
  /** Window and rows once every position is found. */
  complete: string;
  windowCompleteOpacity: number;
  /** Over the strings out of play. */
  scrim: string;
  scrimOpacity: number;
  hoverClass: string;
  fretNumber: string;
  fretNumberContext: string;
  fretNumberContextOpacity: number;
  label: string;
  labelScoped: string;
  labelOff: string;
  labelOffSize: number;
  root: string;
  rootInk: string;
  found: string;
  foundInk: string;
  foundRing: string;
  link: string;
  linkOpacity: number;
  revealed: string;
  revealedInk: string;
}

const NECK_COLORS: Record<"dark" | "light", NeckColors> = {
  dark: {
    neckTop: "#26232a",
    neckBottom: "#0c0b0d",
    edgeTop: "#0c0b0d",
    edgeBottom: "#000000",
    sheenOpacity: 0.05,
    fret: "#52525b",
    fretOpacity: 0.5,
    inlay: "#a1a1aa",
    inlayOpacity: 1,
    sideDot: "#3f3f46",
    // Bone, like the real thing: amber is what a placed root wears.
    nut: "#d4d4d8",
    string: "#9ca3af",
    stringHighlight: "#d1d5db",
    stringOff: "#57534e",
    stringOffOpacity: 0.5,
    stringOffExtraWidth: 0,
    window: "#22d3ee",
    windowOpacity: 0.08,
    windowBehindZoneOpacity: 0.03,
    row: "#22d3ee",
    rowOpacity: 0.1,
    rowInWindowOpacity: 0,
    zone: "#22d3ee",
    zoneOpacity: 0.14,
    complete: "#34d399",
    windowCompleteOpacity: 0.08,
    scrim: "#09090b",
    scrimOpacity: 0.55,
    hoverClass: "hover:fill-zinc-200/10",
    fretNumber: "#a1a1aa",
    fretNumberContext: "#52525b",
    fretNumberContextOpacity: 0.6,
    label: "#9ca3af",
    labelScoped: "#67e8f9",
    labelOff: "#57534e",
    labelOffSize: 20,
    root: "#f59e0b",
    rootInk: "#432003",
    found: "#10b981",
    foundInk: "#052e1f",
    foundRing: "#052e1f",
    link: "#34d399",
    linkOpacity: 0.45,
    revealed: "#18181b",
    revealedInk: "#fafafa",
  },
  // A maple neck: bleached away from the window, full-coloured inside it, with
  // the cells in play in solid gold.
  light: {
    neckTop: "#faf4e8",
    neckBottom: "#f7eedd",
    edgeTop: "#c39a63",
    edgeBottom: "#c39a63",
    sheenOpacity: 0,
    fret: "#8a7350",
    fretOpacity: 0.85,
    inlay: "#4a3823",
    inlayOpacity: 0.75,
    sideDot: "#4a3823",
    nut: "#57534e",
    string: "#45423e",
    stringHighlight: "#8b8780",
    stringOff: "#8f7d62",
    stringOffOpacity: 0.9,
    stringOffExtraWidth: 0.9,
    window: "#e0b878",
    windowOpacity: 1,
    windowBehindZoneOpacity: 1,
    row: "#f59e0b",
    rowOpacity: 0.12,
    rowInWindowOpacity: 0.72,
    zone: "#f59e0b",
    zoneOpacity: 0.5,
    complete: "#6ee7b7",
    windowCompleteOpacity: 0.75,
    scrim: "#ffffff",
    scrimOpacity: 0.32,
    // Not a zinc class: the remapped palette would wash out on the wood.
    hoverClass: "hover:fill-[rgba(67,32,3,0.14)]",
    fretNumber: "#18181b",
    fretNumberContext: "#71717a",
    fretNumberContextOpacity: 1,
    label: "#27272a",
    labelScoped: "#92400e",
    labelOff: "#71717a",
    labelOffSize: 24,
    root: "#f59e0b",
    rootInk: "#432003",
    found: "#047857",
    foundInk: "#ffffff",
    foundRing: "#ffffff",
    link: "#047857",
    linkOpacity: 0.6,
    revealed: "#fffaf0",
    revealedInk: "#27272a",
  },
};

// Real string gauges get thinner from low E (thickest) to high e (thinnest).
// Index 0 = string 1 (high e) .. index 5 = string 6 (low E).
const STRING_ACTIVE_WIDTHS = [3, 3.6, 4.4, 5.4, 6.6, 8];
const STRING_INACTIVE_WIDTHS = [1, 1.1, 1.3, 1.5, 1.8, 2.2];

/** How long the camera takes to travel to a new fret window. */
const CAMERA_MOVE_MS = 650;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Eases the board's geometry from where it was shown to where React just drew
 * it. React writes the new attributes on commit; this puts the old values back
 * before the browser paints, then walks them across, writing straight to the DOM
 * so the memoised board doesn't re-render every frame. React leaves those
 * attributes alone until the target changes again, so nothing fights the tween.
 *
 * It runs only when the window actually moves (once a round at most), so the
 * neck repainting for those frames is fine; the rule against animating inside
 * the <svg> is about things that loop.
 */
function useTweenedGeometry(target: readonly number[], apply: (values: readonly number[]) => void) {
  const applyRef = useRef(apply);
  useLayoutEffect(() => {
    applyRef.current = apply;
  });
  const shownRef = useRef<readonly number[] | null>(null);
  const key = target.join(",");

  useLayoutEffect(() => {
    const to = key.split(",").map(Number);
    const from = shownRef.current;
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const moves = !!from && from.length === to.length && from.some((value, i) => value !== to[i]);
    if (!from || !moves || reduceMotion || typeof requestAnimationFrame !== "function") {
      // A tween cut short can leave values React has no reason to rewrite.
      shownRef.current = to;
      if (from) applyRef.current(to);
      return undefined;
    }

    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / CAMERA_MOVE_MS);
      const eased = easeInOutCubic(progress);
      const values = to.map((value, i) => from[i] + (value - from[i]) * eased);
      shownRef.current = values;
      applyRef.current(values);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    applyRef.current(from);
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [key]);
}

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
 *
 * Memoised: the panels around it re-render on every tick of the note countdown,
 * and nothing on the neck changes with it.
 */
export const ClickableFretboard = memo(function ClickableFretboard({
  startFret,
  endFret,
  strings,
  foundKeys,
  totalTargets,
  lastClick,
  onCellClick,
  liveKey,
  markedKeys,
  markedLabel,
  zoneKeys,
  cellLabels,
  revealKeys,
  linkKeys,
  wrongLabel,
  showFullNeck = false,
}: ClickableFretboardProps) {
  const { t } = useTranslation("session");
  const colors = NECK_COLORS[useColorTheme()];
  const isInScope = (stringNum: number) => !strings || strings.includes(stringNum);
  const found = new Set(foundKeys);
  const marked = new Set(markedKeys);
  const zone = new Set(zoneKeys);
  const revealed = new Set(revealKeys);
  const allFound = totalTargets > 0 && found.size >= totalTargets;
  const windowOpacity =
    zone.size > 0
      ? colors.windowBehindZoneOpacity
      : allFound
        ? colors.windowCompleteOpacity
        : colors.windowOpacity;
  const interactive = !!onCellClick;
  // Only worth shouting about which string to use when the exercise actually
  // narrows it down — with all six in play there's nothing to distinguish.
  const stringScoped = !!strings && strings.length < 6;

  // The neck is always drawn whole, nut to a few frets past the 12th; what
  // moves is the camera on it (the viewBox). Zoomed in, the camera frames the
  // search window plus a few context frets. When a drill moves that window
  // between rounds, the camera travels along the neck to the new spot rather
  // than the board cutting to a fresh drawing with different fret numbers, so
  // the player sees where on the neck the round went.
  const displayStart = showFullNeck ? 0 : Math.max(0, startFret - CONTEXT_FRETS);
  const displayEnd = showFullNeck ? Math.max(endFret, FULL_NECK_END_FRET) : endFret + CONTEXT_FRETS;
  const drawEnd = Math.max(endFret, FULL_NECK_END_FRET) + CONTEXT_FRETS;
  const fretCount = drawEnd + 1;
  const neckX = LEFT_PAD;
  // Fret 0 (the open string) only needs half a cell — the nut sits at its
  // right edge — so every other fret shifts left by half a cell width.
  const colWidth = (fret: number) => (fret === 0 ? CELL_W / 2 : CELL_W);
  const colX = (fret: number): number => (fret <= 0 ? neckX : neckX + CELL_W / 2 + (fret - 1) * CELL_W);
  // The nut replaces the plain divider between fret 0 and fret 1, instead of
  // taking its own extra slot before fret 0.
  const nutCenterX = colX(1);

  // Camera: the neck from camLeft to camRight, with the string names in a
  // gutter to its left that travels with it.
  const camLeft = colX(displayStart);
  const camRight = colX(displayEnd + 1);
  const viewX = camLeft - LEFT_PAD;
  const vw = camRight - viewX + 10;
  const neckH = 6 * ROW_H;
  const vh = TOP_PAD + neckH + BOTTOM_BAND_H + BOT_PAD;
  const neckW = colX(drawEnd + 1) - neckX;

  // Where the gradient passes from the fretboard to the edge below it.
  const neckEndOffset = `${(neckH / (neckH + BOTTOM_BAND_H)) * 100}%`;

  const rowY = (i: number) => TOP_PAD + i * ROW_H;
  const reactId = useId();
  const gradientId = `ckfb-neck-${reactId}`;
  const sheenId = `ckfb-sheen-${reactId}`;
  const clipId = `ckfb-clip-${reactId}`;
  const viewClipId = `ckfb-view-${reactId}`;

  // Left-handed mode mirrors the neck about its vertical centre — nut on the
  // right, frets running right-to-left, string rows untouched. Only the drawing
  // is flipped (a CSS transform on the <svg>), so every coordinate below, the
  // click targets and the hit testing stay exactly as they are; text gets an
  // `upright()` counter-transform so labels never read backwards.
  const leftHanded = useIsLeftHanded();
  const upright = (anchorX: number) => uprightTransform(anchorX, leftHanded);

  // The camera and the window band glide to a moved window instead of jumping.
  const svgRef = useRef<SVGSVGElement>(null);
  const viewClipRef = useRef<SVGRectElement>(null);
  const labelsRef = useRef<SVGGElement>(null);
  const bandRef = useRef<SVGGElement>(null);
  useTweenedGeometry([camLeft, camRight, colX(startFret), colX(endFret + 1)], ([left, right, bandLeft, bandRight]) => {
    const x = left - LEFT_PAD;
    svgRef.current?.setAttribute("viewBox", `${x} 0 ${right - x + 10} ${vh}`);
    viewClipRef.current?.setAttribute("x", String(left));
    viewClipRef.current?.setAttribute("width", String(right - left + 4));
    labelsRef.current?.setAttribute("transform", `translate(${x} 0)`);
    for (const rect of Array.from(bandRef.current?.children ?? [])) {
      rect.setAttribute("x", String(bandLeft));
      rect.setAttribute("width", String(bandRight - bandLeft));
    }
  });

  // Percent box of the overlay layer for a rect in viewBox units.
  const overlayBox = (x: number, y: number, w: number, h: number): CSSProperties => ({
    left: `${((x - viewX) / vw) * 100}%`,
    top: `${(y / vh) * 100}%`,
    width: `${(w / vw) * 100}%`,
    height: `${(h / vh) * 100}%`,
  });

  const liveCell = (() => {
    if (!liveKey || found.has(liveKey)) return null;
    const [stringNum, fret] = liveKey.split("-").map(Number);
    if (!isInScope(stringNum) || fret < startFret || fret > endFret) return null;
    return { cx: colX(fret) + colWidth(fret) / 2, cy: rowY(stringNum - 1) + ROW_H / 2 };
  })();

  const cellCenter = (key: string) => {
    const [stringNum, fret] = key.split("-").map(Number);
    return { cx: colX(fret) + colWidth(fret) / 2, cy: rowY(stringNum - 1) + ROW_H / 2 };
  };
  const link = linkKeys && { from: cellCenter(linkKeys[0]), to: cellCenter(linkKeys[1]) };

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="relative mx-auto min-w-[var(--fretboard-min-w)] sm:min-w-0"
        style={{
          width: `min(100%, ${vw}px)`,
          "--fretboard-min-w": `${Math.round(vw * (MIN_COL_PX / CELL_W))}px`,
        } as CSSProperties}>
        <svg
          ref={svgRef}
          viewBox={`${viewX} 0 ${vw} ${vh}`}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            transform: mirrorStyle(leftHanded),
          }}
          aria-label={leftHanded ? t("fretboard.aria_lefty") : t("fretboard.aria")}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.neckTop} />
              <stop offset={neckEndOffset} stopColor={colors.neckBottom} />
              <stop offset={neckEndOffset} stopColor={colors.edgeTop} />
              <stop offset="100%" stopColor={colors.edgeBottom} />
            </linearGradient>
            <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0.3">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity={colors.sheenOpacity} />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            {/* Everything on the neck is cut to the camera, so the neck to the left
                of the frame never shows behind the string names. */}
            <clipPath id={viewClipId}>
              <rect ref={viewClipRef} x={camLeft} y={0} width={camRight - camLeft + 4} height={vh} />
            </clipPath>
            <clipPath id={clipId}>
              <rect x={neckX} y={TOP_PAD} width={neckW} height={neckH + BOTTOM_BAND_H} rx={6} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${viewClipId})`}>
          <rect x={neckX} y={TOP_PAD} width={neckW} height={neckH + BOTTOM_BAND_H} rx={6} fill={`url(#${gradientId})`} />
          <rect x={neckX} y={TOP_PAD} width={neckW} height={neckH} fill={`url(#${sheenId})`} clipPath={`url(#${clipId})`} />

          {/* String-scope band — runs the full length of the neck along every
              string in play. Crossed with the fret window below, the two bands
              intersect exactly on the cells that count. */}
          {stringScoped && STRING_LABELS.map((_, i) =>
            isInScope(i + 1) ? (
              <rect
                key={i}
                x={neckX}
                y={rowY(i)}
                width={neckW}
                height={ROW_H}
                fill={allFound ? colors.complete : colors.row}
                opacity={colors.rowOpacity}
              />
            ) : null,
          )}

          {/* Search-zone band — marks exactly which columns are clickable,
              distinguishing them from the surrounding context-only frets — and,
              over it, the in-play strings' share of those columns. The camera
              tween moves and sizes every rect in this group as the window. */}
          <g ref={bandRef}>
            <rect
              x={colX(startFret)}
              y={TOP_PAD}
              width={colX(endFret + 1) - colX(startFret)}
              height={neckH}
              fill={allFound ? colors.complete : colors.window}
              opacity={windowOpacity}
            />
            {stringScoped && colors.rowInWindowOpacity > 0 && STRING_LABELS.map((_, i) =>
              isInScope(i + 1) ? (
                <rect
                  key={i}
                  x={colX(startFret)}
                  y={rowY(i)}
                  width={colX(endFret + 1) - colX(startFret)}
                  height={ROW_H}
                  fill={allFound ? colors.complete : colors.row}
                  opacity={colors.rowInWindowOpacity}
                />
              ) : null,
            )}
          </g>

          {/* Inlay markers — sit on the fretboard itself, between strings, like a real neck. */}
          {Array.from({ length: fretCount }, (_, i) => {
            const fret = i;
            if (fret === 0) return null;
            const x = colX(fret) + CELL_W / 2;
            const centerY = TOP_PAD + neckH / 2;
            if (SINGLE_INLAY_FRETS.has(fret)) {
              return <circle key={i} cx={x} cy={centerY} r={11} fill={colors.inlay} opacity={colors.inlayOpacity} className="pointer-events-none" />;
            }
            if (DOUBLE_INLAY_FRETS.has(fret)) {
              return (
                <g key={i} className="pointer-events-none">
                  <circle cx={x} cy={centerY - ROW_H} r={11} fill={colors.inlay} opacity={colors.inlayOpacity} />
                  <circle cx={x} cy={centerY + ROW_H} r={11} fill={colors.inlay} opacity={colors.inlayOpacity} />
                </g>
              );
            }
            return null;
          })}

          {/* Fret dividers — thin and muted, deliberately understated next to the strings. */}
          {Array.from({ length: fretCount + 1 }, (_, i) => {
            const fret = i;
            const x = colX(fret);
            if (fret === 0 || fret === 1) return null;
            return (
              <line
                key={i}
                x1={x}
                y1={TOP_PAD}
                x2={x}
                y2={TOP_PAD + neckH}
                stroke={colors.fret}
                strokeWidth={3}
                opacity={colors.fretOpacity}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Bottom band — frets all lean the same way at the same angle here
              instead of staying parallel, a small perspective flourish under
              the last string. */}
          {Array.from({ length: fretCount + 1 }, (_, i) => {
            const fret = i;
            const x = colX(fret);
            if (fret === 0 || fret === 1) return null;
            const spreadX = x - BOTTOM_LEAN;
            return (
              <line
                key={i}
                x1={x}
                y1={TOP_PAD + neckH}
                x2={spreadX}
                y2={TOP_PAD + neckH + BOTTOM_BAND_H}
                stroke={colors.fret}
                strokeWidth={3}
                opacity={colors.fretOpacity * 0.8}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Side-dot markers in the bottom band, following the same lean as the
              fret lines there — like the position dots on the edge of a real neck. */}
          {Array.from({ length: fretCount }, (_, i) => {
            const fret = i;
            if (!SINGLE_INLAY_FRETS.has(fret) && !DOUBLE_INLAY_FRETS.has(fret)) return null;
            const xTop = colX(fret) + CELL_W / 2;
            const x = xTop - BOTTOM_LEAN / 2;
            const y = TOP_PAD + neckH + BOTTOM_BAND_H / 2;
            return <circle key={i} cx={x} cy={y} r={8} fill={colors.sideDot} className="pointer-events-none" />;
          })}

          {/* Nut — replaces the plain divider between fret 0 and fret 1: wide,
              solid-colored, straddling that boundary. Continues into the
              bottom band with the same lean/skew as the frets there, instead
              of a straight-down bar. */}
          {(() => {
            const nutLeft = nutCenterX - NUT_WIDTH / 2;
            const nutRight = nutCenterX + NUT_WIDTH / 2;
            return (
              <>
                <rect x={nutLeft} y={TOP_PAD - 4} width={NUT_WIDTH} height={neckH + 8} rx={4} fill={colors.nut} />
                <polygon
                  points={`${nutLeft},${TOP_PAD + neckH} ${nutRight},${TOP_PAD + neckH} ${nutRight - BOTTOM_LEAN},${TOP_PAD + neckH + BOTTOM_BAND_H} ${nutLeft - BOTTOM_LEAN},${TOP_PAD + neckH + BOTTOM_BAND_H}`}
                  fill={colors.nut}
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
            const width = active ? STRING_ACTIVE_WIDTHS[i] : STRING_INACTIVE_WIDTHS[i] + colors.stringOffExtraWidth;
            return (
              <g key={i}>
                <line
                  x1={neckX}
                  y1={y}
                  x2={neckX + neckW}
                  y2={y}
                  stroke={active ? colors.string : colors.stringOff}
                  strokeWidth={width}
                  opacity={active ? 1 : colors.stringOffOpacity}
                  strokeLinecap="round"
                />
                {active && (
                  <line
                    x1={neckX}
                    y1={y - width / 4}
                    x2={neckX + neckW}
                    y2={y - width / 4}
                    stroke={colors.stringHighlight}
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
                fill={colors.scrim}
                opacity={colors.scrimOpacity}
                className="pointer-events-none"
              />
            ),
          )}

          {/* Fret numbers — plain text above the neck, dimmer for context-only frets. */}
          {Array.from({ length: fretCount }, (_, i) => {
            const fret = i;
            const inTarget = fret >= startFret && fret <= endFret;
            const x = colX(fret) + colWidth(fret) / 2;
            return (
              <text
                key={i}
                x={x}
                y={TOP_PAD - 22}
                transform={upright(x)}
                textAnchor="middle"
                fontSize={inTarget ? 30 : 22}
                fontWeight={inTarget ? "bold" : "600"}
                fill={inTarget ? colors.fretNumber : colors.fretNumberContext}
                opacity={inTarget ? 1 : colors.fretNumberContextOpacity}
              >
                {fret}
              </text>
            );
          })}

          {link && (
            <line
              x1={link.from.cx}
              y1={link.from.cy}
              x2={link.to.cx}
              y2={link.to.cy}
              stroke={colors.link}
              strokeWidth={10}
              strokeLinecap="round"
              opacity={colors.linkOpacity}
              className="pointer-events-none"
            />
          )}

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
              const isMarked = !isFound && marked.has(key);
              const isRevealed = !isFound && !isMarked && revealed.has(key);
              const label = cellLabels?.[key];
              const cx = x + w / 2;
              const cy = y + ROW_H / 2;
              cells.push(
                <g key={key}>
                  {zone.has(key) && (
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={ROW_H}
                      fill={colors.zone}
                      opacity={colors.zoneOpacity}
                      className="pointer-events-none"
                    />
                  )}
                  {interactive && (
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={w - 2}
                      height={ROW_H - 2}
                      fill="transparent"
                      // No colour transition: tweening a fill inside the <svg>
                      // repaints the whole neck for every frame of it, on every
                      // cell the pointer crosses.
                      className={`cursor-pointer ${colors.hoverClass}`}
                      onClick={() => onCellClick!(stringNum, fret)}
                    />
                  )}
                  {isMarked && (
                    <g className="pointer-events-none">
                      <circle cx={cx} cy={cy} r={32} fill={colors.root} opacity={0.15} />
                      <circle cx={cx} cy={cy} r={label ? LABELLED_MARK_R : 24} fill={colors.root} stroke={colors.rootInk} strokeWidth={3} />
                      {(label ?? markedLabel) && (
                        <text x={cx} y={cy + 9} transform={upright(cx)} textAnchor="middle" fontSize={30} fontWeight="bold" fill={colors.rootInk}>
                          {label ?? markedLabel}
                        </text>
                      )}
                    </g>
                  )}
                  {isRevealed && (
                    <g className="pointer-events-none">
                      <circle cx={cx} cy={cy} r={LABELLED_MARK_R - 2} fill={colors.revealed} stroke={colors.revealedInk} strokeWidth={4} strokeDasharray="9 7" />
                      <text x={cx} y={cy + 9} transform={upright(cx)} textAnchor="middle" fontSize={30} fontWeight="bold" fill={colors.revealedInk}>
                        {label}
                      </text>
                    </g>
                  )}
                  {isFound && (
                    <g className="pointer-events-none">
                      <circle cx={cx} cy={cy} r={42} fill={colors.found} opacity={0.12} />
                      {!label && <circle cx={cx} cy={cy} r={32} fill={colors.found} opacity={0.2} />}
                      <circle cx={cx} cy={cy} r={label ? LABELLED_MARK_R : 24} fill={colors.found} stroke={colors.foundRing} strokeWidth={3} />
                      <text x={cx} y={cy + 9} transform={upright(cx)} textAnchor="middle" fontSize={27} fontWeight="bold" fill={colors.foundInk}>
                        {label ?? "✓"}
                      </text>
                    </g>
                  )}
                </g>,
              );
            }
            return cells;
          })}
          </g>

          {/* String labels — the string(s) actually in play read as the loudest
              thing on the diagram; everything else recedes. */}
          <g ref={labelsRef} transform={`translate(${viewX} 0)`}>
          {STRING_LABELS.map((label, i) => {
            const stringNum = i + 1;
            const active = isInScope(stringNum);
            const y = rowY(i) + ROW_H / 2 + (active ? 10 : 6);
            return (
              <text
                key={i}
                x={LEFT_PAD - 20}
                y={y}
                transform={upright(LEFT_PAD - 20)}
                textAnchor={leftHanded ? "start" : "end"}
                fontSize={active ? 32 : colors.labelOffSize}
                fontWeight={active ? "800" : "600"}
                fill={active ? (stringScoped ? colors.labelScoped : colors.label) : colors.labelOff}
              >
                {label}
              </text>
            );
          })}
          </g>

      </svg>

      {/* Everything that animates lives here, outside the neck's <svg>. Animating
          an element inside an SVG repaints the whole drawing every frame — the
          full-width neck with its gradients — while these are plain boxes the
          browser can fade and move on the compositor without touching it.
          Positioned in percentages of the viewBox, so they track the neck at any
          width, and mirrored the same way it is. */}
      <div className="pointer-events-none absolute inset-0" style={{ transform: mirrorStyle(leftHanded) }}>
        {liveCell && (
          <motion.div
            className="absolute"
            style={overlayBox(liveCell.cx - LIVE_RING_BOX / 2, liveCell.cy - LIVE_RING_BOX / 2, LIVE_RING_BOX, LIVE_RING_BOX)}
            initial={{ opacity: 0.9, scale: 0.75 }}
            animate={{ opacity: [0.9, 0.2, 0.9], scale: [0.75, 1.15, 0.75] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}>
            <svg viewBox={`0 0 ${LIVE_RING_BOX} ${LIVE_RING_BOX}`} className="block h-full w-full">
              <circle cx={LIVE_RING_BOX / 2} cy={LIVE_RING_BOX / 2} r={30} fill="none" stroke={colors.link} strokeWidth={5} />
            </svg>
          </motion.div>
        )}

        {/* One-shot flash on the last clicked cell — keyed by click id so it
            replays on every click without needing local state/timers; framer-motion
            animates itself to opacity 0 and simply stays there until the next key. */}
        {lastClick && isInScope(lastClick.string) && (
          <motion.div
            key={lastClick.id}
            className="absolute"
            style={{
              ...overlayBox(colX(lastClick.fret), rowY(lastClick.string - 1), colWidth(lastClick.fret), ROW_H),
              backgroundColor: lastClick.correct ? "#34d399" : "#ef4444",
            }}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          />
        )}

        {/* The wrong cell, named — it stays for as long as the panel says so. */}
        {wrongLabel && lastClick && !lastClick.correct && isInScope(lastClick.string) && (
          <motion.div
            key={`wrong-${lastClick.id}`}
            className="absolute"
            style={overlayBox(
              colX(lastClick.fret) + colWidth(lastClick.fret) / 2 - WRONG_MARK_BOX / 2,
              rowY(lastClick.string - 1) + ROW_H / 2 - WRONG_MARK_BOX / 2,
              WRONG_MARK_BOX,
              WRONG_MARK_BOX,
            )}
            initial={{ x: 0 }}
            animate={{ x: ["0%", "-14%", "12%", "-6%", "0%"] }}
            transition={{ duration: 0.36 }}>
            <svg viewBox={`0 0 ${WRONG_MARK_BOX} ${WRONG_MARK_BOX}`} className="block h-full w-full" style={{ transform: mirrorStyle(leftHanded) }}>
              <circle cx={WRONG_MARK_BOX / 2} cy={WRONG_MARK_BOX / 2} r={LABELLED_MARK_R} fill="#ef4444" />
              <text x={WRONG_MARK_BOX / 2} y={WRONG_MARK_BOX / 2 + 11} textAnchor="middle" fontSize={30} fontWeight="bold" fill="#ffffff">
                {wrongLabel}
              </text>
            </svg>
          </motion.div>
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
          // 6 viewBox units of drift, as a share of the pill's own height.
          const drift = `${(6 / TIME_PILL_H) * 100}%`;
          const driftBack = `-${(6 / TIME_PILL_H) * 100}%`;
          return (
            <motion.div
              key={`time-${lastClick.id}`}
              className="absolute"
              style={overlayBox(pillX, pillY, TIME_PILL_W, TIME_PILL_H)}
              initial={{ opacity: 0, y: above ? drift : driftBack, scale: 0.7 }}
              animate={{ opacity: [0, 1, 1, 0], y: [above ? drift : driftBack, "0%", "0%", above ? driftBack : drift], scale: [0.7, 1, 1, 0.95] }}
              transition={{ duration: 1.4, times: [0, 0.15, 0.75, 1] }}>
              {/* The pill is symmetric about the cell, so only its content needs
                  turning back the right way round under the mirror. */}
              <svg viewBox={`0 0 ${TIME_PILL_W} ${TIME_PILL_H}`} className="block h-full w-full overflow-visible" style={{ transform: mirrorStyle(leftHanded) }}>
                <rect x={1.25} y={1.25} width={TIME_PILL_W - 2.5} height={TIME_PILL_H - 2.5} rx={12} fill="#18181b" stroke="#10b981" strokeWidth={2.5} />
                <circle cx={32} cy={TIME_PILL_H / 2} r={17} fill="#10b981" />
                <text x={32} y={TIME_PILL_H / 2 + 7} textAnchor="middle" fontSize={20} fontWeight="bold" fill="#052e1f">
                  ✓
                </text>
                <text x={58} y={TIME_PILL_H / 2 + 9} textAnchor="start" fontSize={27} fontWeight="800" fill="#ffffff">
                  {lastClick.elapsedSeconds.toFixed(1)}s
                </text>
              </svg>
            </motion.div>
          );
        })()}
      </div>
      </div>
    </div>
  );
});
