/**
 * The two levels of navigation inside the arsenal.
 *
 * The class string used to be pasted inline on every trigger — six times in the
 * view plus twice in the market — so the module had two levels of tabs that
 * looked exactly the same and drifted apart on every edit.
 */

/** Top level: the module's own tabs (Cases, Collection, Rig…). */
export const arsenalTabTriggerClass =
  "shrink-0 gap-2 rounded-lg px-4 py-2 text-sm font-bold text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:hover:bg-zinc-200";

/** Second level: sections inside a tab. Quieter, so the levels read apart. */
export const arsenalSubTabTriggerClass =
  "shrink-0 gap-2 rounded-lg px-4 py-2 text-sm font-bold text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:bg-zinc-800 data-[state=active]:text-white";
