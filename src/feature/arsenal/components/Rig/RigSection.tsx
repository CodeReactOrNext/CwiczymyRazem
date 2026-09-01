/**
 * The two pieces of chrome every block of the Rig tab shares.
 *
 * One heading per section — no eyebrow over a title saying the same thing in
 * smaller type — and one button style, so a row of board actions reads as a
 * row of board actions and not as four differently dressed suggestions.
 */

/** Every button on the Rig tab: board actions, hardware upgrades. */
export const RIG_BUTTON =
  "flex shrink-0 items-center gap-1.5 rounded bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold tracking-wide text-zinc-300 transition-colors hover:bg-zinc-700/70 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-zinc-800/40 disabled:text-zinc-500 disabled:hover:bg-zinc-800/40 disabled:hover:text-zinc-500";

/** A corrective action — it fixes something the panel beside it is complaining about. */
export const RIG_BUTTON_FIX = "text-amber-300 hover:text-amber-200";

interface SectionHeadingProps {
  title: string;
  /** Actions for this section, kept on the title's line so they stay together. */
  children?: React.ReactNode;
}

export const SectionHeading = ({ title, children }: SectionHeadingProps) => (
  <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
    <p className='text-base font-black capitalize tracking-wide text-white'>
      {title}
    </p>
    {children && (
      <div className='flex flex-wrap items-center gap-2'>{children}</div>
    )}
  </div>
);
