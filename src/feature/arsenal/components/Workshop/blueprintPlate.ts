/**
 * The workshop's plate materials, in one place.
 *
 * It started as two gradients inside `ModArt`, which was fine while a mod tile was
 * the only thing wearing one. The bench job cards now wear plates of their own so
 * three identical zinc rectangles read as three different kinds of work — and a
 * material that lives in four files is a material that drifts, so everything draws
 * it from here.
 */

/** Blueprint navy, lit from where the part sits rather than flat across the plate. */
export const PLATE_WASH =
  "radial-gradient(circle at 50% 42%, #16305a 0%, #0e2143 55%, #081527 100%)";

/**
 * The same idea at card strength: a tint, not a colour. A whole job card washed as
 * hard as a 96px tile would outshout the instrument it belongs to, and lit from the
 * left because that is where the card's own icon sits.
 */
export const QUIET_WASH = {
  navy: "radial-gradient(circle at 12% 50%, rgba(22,48,90,0.55) 0%, rgba(14,33,67,0.4) 45%, rgba(8,21,39,0.25) 100%)",
  emerald:
    "radial-gradient(circle at 12% 50%, rgba(6,60,45,0.5) 0%, rgba(6,42,33,0.36) 45%, rgba(4,24,20,0.22) 100%)",
  cyan: "radial-gradient(circle at 12% 50%, rgba(8,52,72,0.5) 0%, rgba(7,38,56,0.36) 45%, rgba(5,22,33,0.22) 100%)",
} as const;

/** The drafting grid, drawn as two hairline gradients so it stays crisp at any size. */
export const gridWash = (line: string) =>
  `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`;

/** Fine diagonal grain — the surface a restore job leaves behind. */
export const hatchWash = (line: string, step = 9) =>
  `repeating-linear-gradient(135deg, ${line} 0 1px, transparent 1px ${step}px)`;

/** Plotted points rather than ruled lines — where something is being added to. */
export const dotWash = (dot: string) =>
  `radial-gradient(${dot} 1px, transparent 1.6px)`;

export const GRID_LINE = "rgba(147,190,255,0.09)";

/** A drafting plate's two layers, ready to hand to `style` — grid over wash. */
export const plateStyle = (cell: string, wash: string = PLATE_WASH) => ({
  backgroundImage: `${gridWash(GRID_LINE)}, ${wash}`,
  backgroundSize: `${cell} ${cell}, ${cell} ${cell}, cover`,
});
