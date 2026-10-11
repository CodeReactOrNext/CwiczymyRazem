import type { ReactNode } from "react";
import type { IconBaseProps, IconType } from "react-icons";

/**
 * Hand-drawn skill icons for the skills the game-icons set had no fitting
 * glyph for (a headstock for alternate picking, a radar for sweeps, claws for
 * tapping). Drawn on a 24 grid with a heavy stroke and solid shapes so they
 * sit next to the remaining game-icons without looking thinner. Same props as
 * a react-icons icon, so `GuitarSkill.icon` takes either.
 */
const createSkillIcon = (name: string, art: ReactNode): IconType => {
  const SkillIcon = ({
    size = "1em",
    color,
    title,
    className,
    style,
    children: _children,
    ...rest
  }: IconBaseProps) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      width={size}
      height={size}
      fill='none'
      stroke='currentColor'
      strokeWidth={2.2}
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
      style={{ color, ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...rest}>
      {title && <title>{title}</title>}
      {art}
    </svg>
  );
  SkillIcon.displayName = name;
  return SkillIcon;
};

const SOLID = { fill: "currentColor", stroke: "none" } as const;

/** A guitar pick, point down, filling the box (x 4.5–19.5, y 3–21.5). */
const PICK =
  "M12 21.5C9 18.6 4.5 12.6 4.5 8.6C4.5 5.2 7.9 3 12 3s7.5 2.2 7.5 5.6c0 4-4.5 10-7.5 12.9Z";

/** A note head tilted the way engraved heads are, centred on (cx, cy). */
const NoteHead = ({
  cx,
  cy,
  r = 2.9,
}: {
  cx: number;
  cy: number;
  r?: number;
}) => (
  <ellipse
    cx={cx}
    cy={cy}
    rx={r}
    ry={r * 0.74}
    transform={`rotate(-22 ${cx} ${cy})`}
    {...SOLID}
  />
);

/** Pick between an up and a down stroke. */
export const AlternatePickingIcon = createSkillIcon(
  "AlternatePickingIcon",
  <>
    <path
      d={PICK}
      transform='translate(12 12) scale(.62) translate(-12 -12.2)'
      {...SOLID}
    />
    <path d='M3.5 19V5.5M1.3 8.2 3.5 5.5l2.2 2.7' />
    <path d='M20.5 5v13.5M18.3 15.8l2.2 2.7 2.2-2.7' />
  </>,
);

/** Pick dragged through three strings in one stroke. */
export const SweepPickingIcon = createSkillIcon(
  "SweepPickingIcon",
  <>
    <path d='M2 11h20M2 15.5h20M2 20h20' strokeWidth={1.5} opacity={0.55} />
    <path
      d={PICK}
      transform='translate(6 5.6) rotate(-30) scale(.5) translate(-12 -12.2)'
      {...SOLID}
    />
    <path d='M11.2 9.6 18 20.4' strokeWidth={2.4} />
    <path d='m14 20.2 4 .2.6-4' strokeWidth={2.4} />
  </>,
);

/** A chord box: nut, four strings, three frets and the fretted dots. */
export const ChordsIcon = createSkillIcon(
  "ChordsIcon",
  <>
    <rect x={4.5} y={2.5} width={15} height={2.6} rx={0.6} {...SOLID} />
    <path
      d='M5.5 5v16.5M10.2 5v16.5M14.8 5v16.5M19.5 5v16.5'
      strokeWidth={1.4}
    />
    <path d='M5.5 10.5h14M5.5 16h14M5.5 21.5h14' strokeWidth={1.4} />
    <circle cx={10.2} cy={13.25} r={2.3} {...SOLID} />
    <circle cx={14.8} cy={13.25} r={2.3} {...SOLID} />
    <circle cx={19.5} cy={7.75} r={2.3} {...SOLID} />
  </>,
);

/** Notes climbing a staircase, one step each. */
export const ScalesIcon = createSkillIcon(
  "ScalesIcon",
  <>
    <path d='M2 21.5h5.5v-5h5v-5h5v-5H22' strokeWidth={2} />
    <NoteHead cx={4.9} cy={17.9} r={2.4} />
    <NoteHead cx={10} cy={12.9} r={2.4} />
    <NoteHead cx={15} cy={7.9} r={2.4} />
    <NoteHead cx={20} cy={2.9} r={2.4} />
  </>,
);

/** A string pushed up off its line, the unbent string still drawn under it. */
export const BendingIcon = createSkillIcon(
  "BendingIcon",
  <>
    <path
      d='M9 18.5h13'
      strokeWidth={1.6}
      strokeDasharray='2 2.6'
      opacity={0.55}
    />
    <path d='M2 18.5h6c4.5 0 7.4-3.2 9-9.6' strokeWidth={2.4} />
    <path d='m13.6 10.6 3.6-3.9 2.3 4.8' strokeWidth={2.4} />
  </>,
);

/** A fingertip hammering a string from above. */
export const TappingIcon = createSkillIcon(
  "TappingIcon",
  <>
    <path d='M8.6 0h6.8v8.8a3.4 3.4 0 0 1-6.8 0Z' {...SOLID} />
    <path
      d='M10.4 8.2h3.2'
      stroke='#000'
      strokeOpacity={0.35}
      strokeWidth={1.3}
    />
    <path d='M2 16.5h20' strokeWidth={2.2} />
    <path d='M5.6 12.6 7.4 14M18.4 12.6 16.6 14M12 19v2.5' strokeWidth={1.8} />
  </>,
);

/** An ear. */
export const EarTrainingIcon = createSkillIcon(
  "EarTrainingIcon",
  <>
    <path
      d='M6 9a6.5 6.5 0 1 1 13 0c0 4.2-3.4 5.4-4.6 8a4.2 4.2 0 0 1-8-1.6'
      strokeWidth={2.4}
    />
    <path
      d='M10 9.2a2.7 2.7 0 1 1 5.2 1c-.6 1.3-2.4 1.6-2.4 3.4'
      strokeWidth={2.2}
    />
  </>,
);

/** A note with an accent over it and a staccato dot under it. */
export const ArticulationIcon = createSkillIcon(
  "ArticulationIcon",
  <>
    <NoteHead cx={8.6} cy={16.4} r={3.3} />
    <path d='M11.6 15.6V4' strokeWidth={2} />
    <path d='m15.5 3.5 6 2.8-6 2.8' strokeWidth={2.2} />
    <circle cx={18.5} cy={14.5} r={1.8} {...SOLID} />
  </>,
);

/** Three notes stacked on one stem — a chord in notation. */
export const HarmonyIcon = createSkillIcon(
  "HarmonyIcon",
  <>
    <path d='M2.5 10.8h19M2.5 16.4h19' strokeWidth={1.3} opacity={0.5} />
    <NoteHead cx={10} cy={19.2} r={2.9} />
    <NoteHead cx={10} cy={13.6} r={2.9} />
    <NoteHead cx={10} cy={8} r={2.9} />
    <path d='M12.7 18.6V2' strokeWidth={2} />
  </>,
);

/** A held note shaking into a wave. */
export const VibratoIcon = createSkillIcon(
  "VibratoIcon",
  <>
    <circle cx={3.6} cy={12} r={2.4} {...SOLID} />
    <path
      d='M6.5 12c1.2-3.6 2.7-3.6 3.9 0s2.7 3.6 3.9 0 2.7-3.6 3.9 0 2.2 3 3.3 0'
      strokeWidth={2.4}
    />
  </>,
);

/** A pick and a bare finger playing the same string. */
export const HybridPickingIcon = createSkillIcon(
  "HybridPickingIcon",
  <>
    <path
      d={PICK}
      transform='translate(7.4 10.4) rotate(-18) scale(.6) translate(-12 -12.2)'
      {...SOLID}
    />
    <path d='M14.6 0h6v11.4a3 3 0 0 1-6 0Z' {...SOLID} />
    <path d='M2 20.5h20' strokeWidth={1.6} opacity={0.6} />
  </>,
);

/** Two notes tied by a slur — played in one pick stroke. */
export const LegatoIcon = createSkillIcon(
  "LegatoIcon",
  <>
    <NoteHead cx={5.6} cy={18} r={3.1} />
    <NoteHead cx={18.4} cy={18} r={3.1} />
    <path d='M4 12.4c3.6-6.6 12.4-6.6 16 0' strokeWidth={2.4} />
  </>,
);

/** A speech bubble with a note — making a line talk. */
export const PhrasingIcon = createSkillIcon(
  "PhrasingIcon",
  <>
    <path
      d='M6.5 3h11A4.5 4.5 0 0 1 22 7.5v4a4.5 4.5 0 0 1-4.5 4.5H11l-5 4.5V16h.5A4.5 4.5 0 0 1 2 11.5v-4A4.5 4.5 0 0 1 6.5 3Z'
      strokeWidth={2.2}
    />
    <NoteHead cx={10.6} cy={11.2} r={2} />
    <path d='M12.5 10.8V6.2c.4 1.1 1.8 1.6 2.6 2.6' strokeWidth={1.7} />
  </>,
);
