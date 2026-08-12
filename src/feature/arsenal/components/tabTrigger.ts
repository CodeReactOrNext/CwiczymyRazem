/**
 * The module's own navigation.
 *
 * The class string used to be pasted inline on every trigger, so the tabs
 * drifted apart on every edit. There is one level of them now: the market used
 * to hide the Trader and the player listings behind a second row, and they are
 * top-level tabs of their own since.
 */

/** The module's tabs (Cases, Collection, Rig…). */
export const arsenalTabTriggerClass =
  "shrink-0 gap-2 rounded-lg px-4 py-2 text-sm font-bold text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:hover:bg-zinc-200";
