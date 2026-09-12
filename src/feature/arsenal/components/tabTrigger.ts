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
 */
export const arsenalTabTriggerClass =
  "shrink-0 gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-semibold text-arsenal-text-tertiary shadow-none transition-colors duration-150 hover:text-arsenal-text-primary data-[state=active]:border-arsenal-accent data-[state=active]:bg-transparent data-[state=active]:text-arsenal-text-primary data-[state=active]:shadow-none";
