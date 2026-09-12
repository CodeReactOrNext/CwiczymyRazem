import { cn } from "assets/lib/utils";
import type { ToneAccent } from "feature/toneStudio/utils/chain";
import { ACCENT_HEX } from "feature/toneStudio/utils/chassis";
import { KNOB_CAP_FRACTION, KNOB_SRC } from "feature/toneStudio/utils/gearArt";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useId, useRef, useState } from "react";

export interface KnobProps {
  label: string;
  value: number; // 0..1
  onChange: (value: number) => void;
  displayValue?: string;
  size?: number;
  accent?: ToneAccent;
  disabled?: boolean;
  /** Double-click target. Omit to make double-click a no-op. */
  defaultValue?: number;
  /** The value arc around the dial. Off for the cramped toolbar knob, where
   *  the pointer alone is enough and every pixel of width counts. */
  ring?: boolean;
  /**
   * What the dial is drawn on.
   *
   * `render`: the knob is ours — the cap render, lit here, rotated in place.
   * `painted`: the knob is already in the artwork underneath (the pedals are
   * rendered with blank caps on), so only the pointer and the arc are drawn.
   */
  face?: "render" | "painted";
  /** For a painted face seen slightly from above: the cap's height as a
   *  fraction of its width. The pointer and arc are drawn in that plane. */
  faceAspect?: number;
  /** Label colour: light text for a dark panel, dark ink for a coloured
   *  enclosure it is printed on. */
  ink?: "light" | "dark";
}

const MIN_DEG = -135;
const MAX_DEG = 135;
const SWEEP_DEG = MAX_DEG - MIN_DEG; // 270deg — a real dial's travel, gap at the bottom
const DRAG_RANGE_PX = 160; // vertical px dragged for a full 0..1 sweep
const FINE_DIVISOR = 5; // hold shift for slow, ±0.2%-per-px moves
/** Clearance between a rendered knob's edge and its value arc. */
const KNOB_RING_GAP_PX = 7;
/** How much of the cap's diameter the fluted rim takes up in the render. */
const RIM_FRACTION = 0.075;
/** Where the arc sits on a painted cap: just inside the fluted edge. */
const PAINTED_ARC_FRACTION = 0.84;
/** How far a painted cap's side wall and nut hang below its face, as a
 *  fraction of its width — the label has to clear them. */
const PAINTED_SKIRT_FRACTION = 0.42;
/** Printed on a coloured enclosure: dark ink with a hair of light under it,
 *  the way a silkscreened label catches the lamp on its lower edge. */
const INK_SHADOW = "0 1px 0 rgba(255,255,255,0.22)";

/** Point on the dial's circle. Angles run clockwise from 12 o'clock, the way a
 *  knob's travel is described, not the way SVG measures them. */
const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
) => {
  const start = polar(cx, cy, r, from);
  const end = polar(cx, cy, r, to);
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${end.x} ${end.y}`;
};

/**
 * Rotary hardware control — drag vertically to turn, shift for fine moves,
 * double-click to reset.
 *
 * With a `render` face, the dial is the knob render rotated in place. That
 * only reads as a turning knob because the render is rotationally symmetric
 * apart from its pointer: it is lit flat along its own axis, so nothing orbits
 * the dial as it moves. The price is that a flat-lit render looks like a
 * sticker, so the light goes on here, and it never turns: the cap shaded as a
 * dome under one key light from the upper left, the fluted rim catching that
 * light as a bevel, a shadow thrown onto the panel. Only the render (and with
 * it the pointer) rotates underneath.
 *
 * With a `painted` face, all of that is already in the artwork — the pedals
 * are rendered with their knobs on, blank-capped, lit by the same lamp as the
 * enclosure — so this draws just the pointer, turning on the cap, and the arc.
 *
 * The arc is the one thing real hardware cannot do and every plugin does: the
 * position readable from across the room.
 */
export const Knob = ({
  label,
  value,
  onChange,
  displayValue,
  size = 64,
  accent = "cyan",
  disabled,
  defaultValue,
  ring = true,
  face = "render",
  faceAspect = 1,
  ink = "light",
}: KnobProps) => {
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{ startY: number; startValue: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = { startY: e.clientY, startValue: value };
      setDragging(true);
    },
    [disabled, value],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragState.current) return;
      const dy = dragState.current.startY - e.clientY;
      const range = e.shiftKey ? DRAG_RANGE_PX * FINE_DIVISOR : DRAG_RANGE_PX;
      const next = Math.min(
        1,
        Math.max(0, dragState.current.startValue + dy / range),
      );
      onChange(next);
    },
    [onChange],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      dragState.current = null;
      setDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released — nothing to give back */
      }
    },
    [],
  );

  const id = useId();
  const domeId = `${id}-dome`;
  const bevelId = `${id}-bevel`;

  const deg = MIN_DEG + value * SWEEP_DEG;
  const hex = ACCENT_HEX[accent];
  const painted = face === "painted";
  // A painted cap has its arc printed on the face, inside the rim, so nothing
  // needs room outside the cap; ours wears the arc around it.
  const gap = ring && !painted ? KNOB_RING_GAP_PX : 0;
  const box = size + gap * 2;
  const centre = box / 2;
  const capRadius = size / 2;
  const ringRadius = painted
    ? capRadius * PAINTED_ARC_FRACTION
    : capRadius + gap / 2;
  const stroke = Math.max(2, Math.round(size * (painted ? 0.04 : 0.045)));
  // The render carries a transparent margin around the cap; drawing it a
  // little larger than `size` puts the cap's painted edge exactly at `size`,
  // so `size` still means "how wide the knob looks".
  const renderSize = size / KNOB_CAP_FRACTION;
  const rim = size * RIM_FRACTION;
  const pointerWidth = Math.max(2, size * 0.07);

  const arc = ring && (
    <>
      <path
        d={arcPath(centre, centre, ringRadius, MIN_DEG, MAX_DEG)}
        fill='none'
        stroke={painted ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.45)"}
        strokeWidth={stroke}
        strokeLinecap='round'
        vectorEffect='non-scaling-stroke'
      />
      {value > 0.001 && (
        <path
          d={arcPath(centre, centre, ringRadius, MIN_DEG, deg)}
          fill='none'
          stroke={hex}
          strokeWidth={stroke}
          strokeLinecap='round'
          vectorEffect='non-scaling-stroke'
          style={{
            filter: dragging ? `drop-shadow(0 0 4px ${hex})` : undefined,
          }}
        />
      )}
    </>
  );

  return (
    <div className='flex select-none flex-col items-center gap-1.5'>
      <div
        role='slider'
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={value}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={() => {
          if (!disabled && defaultValue !== undefined) onChange(defaultValue);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          const step = e.shiftKey ? 0.005 : 0.02;
          if (e.key === "ArrowUp" || e.key === "ArrowRight")
            onChange(Math.min(1, value + step));
          if (e.key === "ArrowDown" || e.key === "ArrowLeft")
            onChange(Math.max(0, value - step));
        }}
        style={{ width: box, height: box }}
        className={cn(
          "relative flex-shrink-0 cursor-grab touch-none rounded-full focus-visible:outline-none active:cursor-grabbing",
          disabled && "cursor-not-allowed opacity-40",
        )}>
        {!painted && (
          // The cap. Rotates, and is the only thing that does. The shadow it
          // casts is of a circle, so it holds still too.
          <img
            src={KNOB_SRC}
            alt=''
            draggable={false}
            width={renderSize}
            height={renderSize}
            className='pointer-events-none absolute left-1/2 top-1/2 max-w-none'
            style={{
              width: renderSize,
              height: renderSize,
              transform: `translate(-50%, -50%) rotate(${deg}deg)`,
              filter: [
                `drop-shadow(0 ${(size * 0.06).toFixed(1)}px ${(size * 0.09).toFixed(1)}px rgba(0,0,0,0.55))`,
                "drop-shadow(0 1px 1px rgba(0,0,0,0.45))",
              ].join(" "),
            }}
          />
        )}

        <svg
          aria-hidden
          width={box}
          height={box}
          viewBox={`0 0 ${box} ${box}`}
          className='pointer-events-none absolute inset-0'>
          {painted ? (
            // Pointer and arc, in the plane of the painted cap's face.
            <g
              transform={`translate(${centre} ${centre}) scale(1 ${faceAspect}) translate(${-centre} ${-centre})`}>
              {arc}
              <g transform={`rotate(${deg} ${centre} ${centre})`}>
                <line
                  x1={centre}
                  y1={centre - capRadius * 0.16}
                  x2={centre}
                  y2={centre - capRadius * 0.66}
                  stroke='#2a2420'
                  strokeWidth={pointerWidth}
                  strokeLinecap='round'
                />
              </g>
            </g>
          ) : (
            <>
              <defs>
                {/* Key light from the upper left, the cap curving away from
                    it. Built mostly from shadow: the cap is cream, already
                    near the top of the range, so the far side going dark is
                    what sells the form — white on the near side only has to
                    suggest it. */}
                <radialGradient id={domeId} cx='0.38' cy='0.32' r='0.72'>
                  <stop offset='0' stopColor='#fff' stopOpacity='0.32' />
                  <stop offset='0.3' stopColor='#fff' stopOpacity='0.1' />
                  <stop offset='0.5' stopColor='#000' stopOpacity='0' />
                  <stop offset='0.78' stopColor='#000' stopOpacity='0.14' />
                  <stop offset='1' stopColor='#000' stopOpacity='0.34' />
                </radialGradient>
                {/* The fluted rim as a bevel: lit edge towards the lamp, dark
                    edge away from it. */}
                <linearGradient id={bevelId} x1='0' y1='0' x2='1' y2='1'>
                  <stop offset='0' stopColor='#fff' stopOpacity='0.4' />
                  <stop offset='0.4' stopColor='#fff' stopOpacity='0' />
                  <stop offset='0.58' stopColor='#000' stopOpacity='0' />
                  <stop offset='1' stopColor='#000' stopOpacity='0.42' />
                </linearGradient>
              </defs>

              <circle
                cx={centre}
                cy={centre}
                r={capRadius}
                fill={`url(#${domeId})`}
              />
              <circle
                cx={centre}
                cy={centre}
                r={capRadius - rim / 2}
                fill='none'
                stroke={`url(#${bevelId})`}
                strokeWidth={rim}
              />
              {/* A hairline at the silhouette so the cap sits into the panel
                  instead of floating on it. */}
              <circle
                cx={centre}
                cy={centre}
                r={capRadius - 0.5}
                fill='none'
                stroke='rgba(0,0,0,0.3)'
                strokeWidth={1}
              />
              {arc}
            </>
          )}
        </svg>
      </div>
      <div
        className='flex flex-col items-center'
        style={{
          marginTop: painted ? size * PAINTED_SKIRT_FRACTION : undefined,
        }}>
        <span
          className={cn(
            "leading-tight tracking-wide",
            ink === "dark"
              ? "text-[13px] font-semibold text-black/80"
              : "text-[11px] text-zinc-400",
          )}
          style={{ textShadow: ink === "dark" ? INK_SHADOW : undefined }}>
          {label}
        </span>
        <span
          className={cn(
            "font-mono tabular-nums leading-tight",
            ink === "dark"
              ? "text-[13px] font-semibold text-black/90"
              : "text-[11px] text-zinc-200",
          )}
          style={{ textShadow: ink === "dark" ? INK_SHADOW : undefined }}>
          {displayValue ?? (value * 10).toFixed(1)}
        </span>
      </div>
    </div>
  );
};
