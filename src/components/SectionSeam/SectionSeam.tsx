const TONE_HEX = {
  "950": "#09090b", // zinc-950
  "900": "#18181b", // zinc-900
} as const;

interface SectionSeamProps {
  /** Background shade of the section above the seam. Defaults to zinc-950. */
  from?: keyof typeof TONE_HEX;
  /** Background shade of the section below the seam. Defaults to `from`. */
  to?: keyof typeof TONE_HEX;
  className?: string;
}

/**
 * A slim connective band dropped between two dark landing sections so the
 * page doesn't cut abruptly from one flat rectangle straight into the
 * next. Renders a soft cyan glow plus a thin gradient hairline, in normal
 * flow (real height, no negative-margin overlap hacks), and when the two
 * neighboring sections use different zinc shades it blends between them
 * instead of hard-cutting.
 *
 * Not used at the dark/light (ivory) boundary on purpose: that transition
 * is a deliberate hard edge (see `TestimonialsSection`), not something to
 * smooth over.
 *
 * Used sparingly (a handful of spots on the page) so it stays a rhythm
 * device, not more visual noise.
 */
export const SectionSeam = ({
  from = "950",
  to,
  className,
}: SectionSeamProps) => {
  const fromColor = TONE_HEX[from];
  const toColor = TONE_HEX[to ?? from];

  return (
    <div
      aria-hidden
      className={`pointer-events-none relative h-24 overflow-hidden sm:h-32 ${className ?? ""}`}
      style={{
        backgroundImage: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
      }}>
      <div className='absolute left-1/2 top-1/2 h-64 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.06] blur-[100px]' />
      <div className='absolute left-1/2 top-1/2 h-px w-2/3 max-w-sm -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent' />
    </div>
  );
};
