/**
 * The module's own navigation.
 *
 * The class string used to be pasted inline on every trigger, so the tabs
 * drifted apart on every edit. There is one level of them now: the market used
 * to hide the Trader and the player listings behind a second row, and they are
 * top-level tabs of their own since.
 */

/**
 * The module's tabs (Cases, Collection, Rig…) — text, not filled pills, so
 * they read as navigation rather than another row of buttons. The active tab
 * gets the one interaction colour, as a 2px underline, and nothing else in
 * this row is coloured.
 *
 * On phones it is a native app's chip row: one line that scrolls sideways, the
 * label beside the icon, the active tab a filled pill (the fades at the rail's
 * ends say there is more). It stays pinned at the top while the tab scrolls.
 * The 4×2/4×3 grid it replaces cost three rows of screen before any content.
 * From `sm` up they're the underlined rail again.
 */
export const arsenalTabTriggerClass =
  "shrink-0 snap-start flex-row gap-1.5 rounded-full border-0 bg-zinc-800/60 px-3.5 py-2 text-sm font-semibold text-arsenal-text-secondary shadow-none transition-colors duration-fast hover:text-arsenal-text-primary data-[state=active]:bg-arsenal-accent data-[state=active]:text-arsenal-bg data-[state=active]:shadow-none sm:gap-2 sm:rounded-none sm:border-b-2 sm:border-transparent sm:bg-transparent sm:px-4 sm:py-3 sm:text-arsenal-text-tertiary sm:data-[state=active]:border-arsenal-accent sm:data-[state=active]:bg-transparent sm:data-[state=active]:text-arsenal-text-primary";

/** The chip row on phones (pinned while scrolling), the rail from `sm` up — see above. */
export const arsenalTabListClass =
  "sticky top-0 z-30 -mx-4 flex h-auto w-auto snap-x scroll-px-4 justify-start gap-2 overflow-x-auto rounded-none bg-zinc-950/95 px-4 py-2.5 no-scrollbar backdrop-blur-md sm:static sm:mx-0 sm:w-full sm:max-w-full sm:gap-1 sm:border-b sm:border-arsenal-border sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none";
