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
 * On phones the tabs are cells of a 4×2 grid, label under the icon, so all eight are on screen
 * and every one is named — an icon row there showed only the active tab's label and cut Market
 * and Dex off past the edge. From `sm` up they're the rail again, label beside the icon.
 */
export const arsenalTabTriggerClass =
  "min-w-0 flex-col gap-1 rounded-none border-b-2 border-transparent bg-transparent px-1 py-2 text-xs font-semibold text-arsenal-text-tertiary shadow-none transition-colors duration-150 hover:text-arsenal-text-primary data-[state=active]:border-arsenal-accent data-[state=active]:bg-transparent data-[state=active]:text-arsenal-text-primary data-[state=active]:shadow-none sm:shrink-0 sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-sm";

/** The grid on phones, the scrolling rail from `sm` up — see `arsenalTabTriggerClass`. */
export const arsenalTabListClass =
  "grid h-auto w-full grid-cols-4 gap-1 rounded-none bg-transparent p-0 overflow-x-auto no-scrollbar sm:flex sm:max-w-full sm:justify-start sm:border-b sm:border-arsenal-border";
