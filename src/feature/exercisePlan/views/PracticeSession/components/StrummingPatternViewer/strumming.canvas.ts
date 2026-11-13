import { CHORD_SHAPES, type ChordFrets } from "feature/bosses/data/colossus";
import type { StrumPattern } from "feature/exercisePlan/types/exercise.types";

import {
  ACTIVE_COLOR, DIAGRAM_MIN_W, HEAD_HALF_W, HEADER_ROW_H, INK_COLOR, MIN_SLOT_W, PAD,
  PANEL_COLOR, REP_BAR_H, REP_CURRENT, REP_DONE, REP_TODO, SLOT_W, TEXT_DIM,
} from "./strumming.constants";

const FONT = "ui-sans-serif, system-ui, sans-serif";

export function makeLabels(beats: number, subdivisions: number): string[] {
  const subs4 = ["1","e","&","a","2","e","&","a","3","e","&","a","4","e","&","a","5","e","&","a","6","e","&","a"];
  const subs2 = ["1","&","2","&","3","&","4","&","5","&","6","&","7","&","8","&"];
  const src = subdivisions === 4 ? subs4 : subs2;
  const out: string[] = [];
  for (let b = 0; b < beats; b++)
    for (let s = 0; s < subdivisions; s++)
      out.push(src[b * subdivisions + s] ?? "");
  return out;
}

export function barPixelWidth(p: StrumPattern) {
  return p.timeSignature[0] * p.subdivisions * SLOT_W;
}

/** Widest the slots may be squeezed down to so a whole bar still fits the
 *  viewport — 16th patterns on a phone rely on this instead of being clipped. */
export function fitSlotWidth(viewW: number, totalSlots: number) {
  if (totalSlots <= 0) return MIN_SLOT_W;
  return Math.max(MIN_SLOT_W, (viewW - 2 * PAD) / totalSlots);
}

/** Canvas width: the viewport while the bar fits it, otherwise the bar's own
 *  width — the container scrolls rather than cutting the last strums off. */
export function canvasContentWidth(viewW: number, totalSlots: number) {
  const barW = 2 * PAD + totalSlots * fitSlotWidth(viewW, totalSlots);
  // A bar that fits keeps the canvas exactly viewport-wide (no stray scrollbar
  // from a rounding crumb); only a bar stuck at the floor grows the canvas.
  return barW <= viewW + 0.5 ? viewW : Math.ceil(barW);
}

/** Arrows are drawn for a comfortable ~34px slot. Narrower slots (16th patterns
 *  on a phone) shrink the glyph proportionally so heads never bleed into the
 *  neighbouring slot; wider slots keep the original size. */
export function slotScale(slotW: number) {
  return Math.min(1, Math.max(0.6, slotW / 34));
}

/** The strumming hand is a pendulum: down on every even slot, back up on every
 *  odd one. A slot with no strum is still part of that swing — the hand passes
 *  the strings in this direction without touching them. */
export function swingDirection(slotIndex: number): "down" | "up" {
  return slotIndex % 2 === 0 ? "down" : "up";
}

export type ArrowWeight = "ghost" | "normal" | "accent";

interface ArrowOptions {
  direction: "down" | "up";
  color:     string;
  weight:    ArrowWeight;
  muted?:    boolean;
  /** Painted behind the muted X so it reads as a break in the stem. */
  tileColor?: string;
  slotW?:    number;
}

/**
 * One stroke of the hand. A strum is a solid arrow (heavier when accented), a
 * swing past the strings a dotted one, a muted strum carries an X on its stem.
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number, top: number, h: number,
  { direction, color, weight, muted = false, tileColor, slotW = SLOT_W }: ArrowOptions,
) {
  const s    = slotScale(slotW);
  const hw   = HEAD_HALF_W * s;
  const lw   = weight === "ghost"  ? Math.max(1.5, 2.5 * s)
             : weight === "accent" ? Math.max(3, 7.5 * s)
             :                       Math.max(2, 4.5 * s);
  const down = direction === "down";
  const tail = down ? top : top + h;
  const tip  = down ? top + h : top;
  const back = down ? -hw : hw;

  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (weight === "ghost") ctx.setLineDash([0.1, Math.max(4, 7 * s)]);
  ctx.beginPath(); ctx.moveTo(cx, tail); ctx.lineTo(cx, tip); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(cx - hw, tip + back); ctx.lineTo(cx, tip); ctx.lineTo(cx + hw, tip + back);
  ctx.stroke();

  if (muted) {
    const xw = 7 * s;
    // Clear of the head, so the X never tangles with it.
    const cy = down ? top + h * 0.38 : top + h * 0.62;
    const cross = () => {
      ctx.beginPath();
      ctx.moveTo(cx - xw, cy - xw); ctx.lineTo(cx + xw, cy + xw);
      ctx.moveTo(cx + xw, cy - xw); ctx.lineTo(cx - xw, cy + xw);
      ctx.stroke();
    };
    if (tileColor) { ctx.strokeStyle = tileColor; ctx.lineWidth = lw + 6 * s; cross(); }
    ctx.strokeStyle = INK_COLOR; ctx.lineWidth = Math.max(2, 3 * s); cross();
  }
  ctx.restore();
}

const DIAGRAM_STRING_GAP = 6;
const DIAGRAM_FRET_GAP   = 7.5;
const DIAGRAM_FRETS      = 4;
const DIAGRAM_NUT_Y      = 9;
const DIAGRAM_W          = DIAGRAM_STRING_GAP * 5 + 4;

function chordDiagramBase(frets: ChordFrets) {
  const fretted = frets.filter((f): f is number => f !== null && f > 0);
  const highest = Math.max(0, ...fretted);
  return highest > DIAGRAM_FRETS ? Math.min(...fretted) : 1;
}

/** Width the diagram takes, including the fret number of a shape up the neck. */
function chordDiagramWidth(frets: ChordFrets) {
  return DIAGRAM_W + (chordDiagramBase(frets) > 1 ? 9 : 0);
}

/** A chord box, low E on the left: dots for fingers, a ring over an open
 *  string, an x over a muted one. Same reading as bosses' ChordDiagram. */
function drawChordDiagram(ctx: CanvasRenderingContext2D, x: number, y: number, frets: ChordFrets) {
  const base   = chordDiagramBase(frets);
  const left   = x + 2;
  const top    = y + DIAGRAM_NUT_Y;
  const bottom = top + DIAGRAM_FRETS * DIAGRAM_FRET_GAP;
  const xOf    = (string: number) => left + string * DIAGRAM_STRING_GAP;

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "#52525b"; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { ctx.moveTo(xOf(i), top); ctx.lineTo(xOf(i), bottom); }
  for (let i = 1; i <= DIAGRAM_FRETS; i++) {
    ctx.moveTo(xOf(0), top + i * DIAGRAM_FRET_GAP); ctx.lineTo(xOf(5), top + i * DIAGRAM_FRET_GAP);
  }
  ctx.stroke();
  ctx.strokeStyle = base === 1 ? "#d4d4d8" : "#52525b"; ctx.lineWidth = base === 1 ? 2 : 1;
  ctx.beginPath(); ctx.moveTo(xOf(0), top); ctx.lineTo(xOf(5), top); ctx.stroke();

  frets.forEach((fret, string) => {
    const sx = xOf(string);
    if (fret === null) {
      ctx.strokeStyle = TEXT_DIM; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 1.6, y + 1.9); ctx.lineTo(sx + 1.6, y + 5.1);
      ctx.moveTo(sx + 1.6, y + 1.9); ctx.lineTo(sx - 1.6, y + 5.1);
      ctx.stroke();
    } else if (fret === 0) {
      ctx.strokeStyle = TEXT_DIM; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(sx, y + 3.5, 1.7, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = INK_COLOR;
      ctx.beginPath(); ctx.arc(sx, top + (fret - base + 0.5) * DIAGRAM_FRET_GAP, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  });

  if (base > 1) {
    ctx.fillStyle = TEXT_DIM; ctx.font = `9px ${FONT}`; ctx.textBaseline = "middle";
    ctx.fillText(String(base), xOf(5) + 4, top + DIAGRAM_FRET_GAP / 2);
  }
  ctx.restore();
}

function fillPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath(); (ctx as any).roundRect(x, y, w, h, r); ctx.fill();
}

export function drawChordHeader(
  ctx: CanvasRenderingContext2D,
  W: number,
  pattern: StrumPattern,
  chordIdx: number,
  reservedRight: number = 0,
) {
  const hasProgression = pattern.chords && pattern.chords.length > 0;
  // Everything in the header has to live left of the "Rep n / m" counter.
  const headerRight = W - PAD - reservedRight;
  const rowTop      = PAD;
  const midY        = rowTop + HEADER_ROW_H / 2;
  const diagramY    = rowTop + (HEADER_ROW_H - (DIAGRAM_NUT_Y + DIAGRAM_FRETS * DIAGRAM_FRET_GAP)) / 2 - 1;
  const current     = hasProgression ? pattern.chords![chordIdx] : pattern.chord;
  const shape       = current && W >= DIAGRAM_MIN_W ? CHORD_SHAPES[current] : undefined;
  let contentRight  = PAD;

  ctx.save();
  ctx.textBaseline = "middle";

  if (hasProgression) {
    const chords = pattern.chords!;
    let cx = PAD;
    if (shape) {
      const boxW = chordDiagramWidth(shape) + 24;
      fillPanel(ctx, cx, rowTop, boxW, HEADER_ROW_H, 8, PANEL_COLOR);
      drawChordDiagram(ctx, cx + 12, diagramY, shape);
      cx += boxW + 8;
    }
    // Chips start at their comfortable size and step down once before giving up
    // and showing only the chord that is playing — a four-chord loop otherwise
    // runs off the right edge of a phone.
    const chipsWidth = (size: number, padX: number, gap: number) => {
      ctx.font = `bold ${size}px ${FONT}`;
      return chords.reduce((w, ch) => w + ctx.measureText(ch).width + padX * 2 + gap, 0) - gap;
    };
    let size = 14, padX = 10, gap = 6;
    let width = chipsWidth(size, padX, gap);
    if (cx + width > headerRight) {
      size = 11; padX = 5; gap = 4;
      width = chipsWidth(size, padX, gap);
    }
    const visible = cx + width <= headerRight
      ? chords.map((ch, i) => [ch, i] as const)
      : [[`${chords[chordIdx]} · ${chordIdx + 1}/${chords.length}`, chordIdx] as const];
    ctx.font = `bold ${size}px ${FONT}`;
    const ph = 28, py = midY - ph / 2;
    visible.forEach(([ch, i]) => {
      const isSelected = i === chordIdx;
      const pw = ctx.measureText(ch).width + padX * 2;
      fillPanel(ctx, cx, py, pw, ph, 4, isSelected ? "rgba(34,211,238,0.16)" : PANEL_COLOR);
      ctx.fillStyle = isSelected ? ACTIVE_COLOR : TEXT_DIM;
      ctx.fillText(ch, cx + padX, midY + 0.5);
      cx += pw + gap;
    });
    contentRight = cx - gap;
  } else if (pattern.chord) {
    const size = W - PAD * 2 < 260 ? 22 : 26;
    ctx.font = `bold ${size}px ${FONT}`;
    const textW    = ctx.measureText(pattern.chord).width;
    const diagramW = shape ? chordDiagramWidth(shape) + 10 : 0;
    const boxW     = 12 + diagramW + textW + 14;
    fillPanel(ctx, PAD, rowTop, boxW, HEADER_ROW_H, 8, PANEL_COLOR);
    if (shape) drawChordDiagram(ctx, PAD + 12, diagramY, shape);
    ctx.fillStyle = INK_COLOR;
    ctx.fillText(pattern.chord, PAD + 12 + diagramW, midY + 1);
    contentRight = PAD + boxW;
  }

  if (pattern.name) {
    ctx.fillStyle = TEXT_DIM;
    ctx.font = `13px ${FONT}`;
    const nameX = contentRight === PAD ? PAD : contentRight + 12;
    // Dropped rather than clipped mid-word when the chords already took the row.
    if (nameX + ctx.measureText(pattern.name).width <= headerRight) {
      ctx.fillText(pattern.name, nameX, midY + 0.5);
    }
  }
  ctx.restore();
}

/**
 * The set as one bar under the tiles: a segment per rep, the current one
 * filling as the bar plays. Doubles as the playhead's smooth motion.
 */
export function drawRepBar(
  ctx: CanvasRenderingContext2D,
  currentRep: number, repProgress: number, maxReps: number, W: number, y: number,
) {
  const left  = PAD;
  const total = W - 2 * PAD;
  const reps  = Math.max(1, maxReps);
  const gap   = reps > 20 ? 2 : 4;
  const segW  = (total - gap * (reps - 1)) / reps;
  const r     = REP_BAR_H / 2;
  const fill  = Math.min(1, Math.max(0, repProgress));

  // Long sets would leave slivers too thin to read — one continuous bar instead.
  if (segW < 4) {
    fillPanel(ctx, left, y, total, REP_BAR_H, r, REP_TODO);
    const done = total * Math.min(1, (currentRep + fill) / reps);
    if (done >= REP_BAR_H) fillPanel(ctx, left, y, done, REP_BAR_H, r, REP_CURRENT);
    return;
  }

  for (let i = 0; i < reps; i++) {
    const x = left + i * (segW + gap);
    fillPanel(ctx, x, y, segW, REP_BAR_H, r, i < currentRep ? REP_DONE : REP_TODO);
    if (i === currentRep) {
      const w = segW * fill;
      if (w >= REP_BAR_H) fillPanel(ctx, x, y, w, REP_BAR_H, r, REP_CURRENT);
    }
  }
}
