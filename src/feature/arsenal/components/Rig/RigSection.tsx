/**
 * The two pieces of chrome every block of the Rig tab shares.
 *
 * One heading per section — no eyebrow over a title saying the same thing in
 * smaller type — and one button style, so a row of board actions reads as a
 * row of board actions and not as four differently dressed suggestions.
 */

/** Every button on the Rig tab: board actions, hardware upgrades. Secondary
    tier — a bordered neutral surface, same as the rest of the app's non-primary
    actions. */
export const RIG_BUTTON =
  "flex shrink-0 items-center gap-1.5 rounded border border-arsenal-border bg-arsenal-card px-3 py-1.5 text-xs font-semibold tracking-wide text-arsenal-text-secondary transition-colors duration-150 hover:bg-white/[0.06] hover:text-arsenal-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arsenal-accent/60 disabled:cursor-not-allowed disabled:bg-arsenal-card/40 disabled:text-arsenal-text-tertiary disabled:hover:bg-arsenal-card/40 disabled:hover:text-arsenal-text-tertiary";

/** The one primary action on the board — adding to it. Filled cyan, the
    interaction colour, so it reads first in a row of neutral buttons. */
export const RIG_BUTTON_PRIMARY =
  "flex shrink-0 items-center gap-1.5 rounded bg-cyan-500/90 px-3 py-1.5 text-xs font-semibold tracking-wide text-zinc-950 transition-colors duration-150 hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300/60";

/** A corrective action — it fixes something the panel beside it is complaining
    about. Orange, not amber/gold — this system reserves gold for Fame. */
export const RIG_BUTTON_FIX = "text-orange-300 hover:text-orange-200";

interface SectionHeadingProps {
  title: string;
  /** Actions for this section, kept on the title's line so they stay together. */
  children?: React.ReactNode;
}

export const SectionHeading = ({ title, children }: SectionHeadingProps) => (
  <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
    <p className='text-base font-semibold capitalize tracking-wide text-arsenal-text-primary'>
      {title}
    </p>
    {children && (
      <div className='flex flex-wrap items-center gap-2'>{children}</div>
    )}
  </div>
);
