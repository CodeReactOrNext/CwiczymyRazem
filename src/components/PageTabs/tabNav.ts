import { cn } from "assets/lib/utils";

/**
 * The app's one tab bar.
 *
 * Every module used to draw its own: filled zinc-100 pills on Skills and Plans,
 * cyan-tinted pills on Milestones and the supporter panel, a boxed segmented
 * control on Recordings. They were the same navigation wearing four costumes,
 * and a filled pill reads as a button — so a row of them read as a row of
 * things to press rather than as where you currently are.
 *
 * This is the Arsenal bar, generalised: text on a rail, the active tab marked
 * by a 2px underline and a brighter label, nothing else coloured. The rail is
 * the one line the styleguide's "build separation with space, not borders" rule
 * keeps, because it is what the underline is measured against.
 *
 * Three exports because call sites come in three shapes — a Radix `TabsList`,
 * a row of `<Link>`s, a row of `<button>`s — not because there are three looks.
 */

/** The rail. Goes on a Radix `TabsList` or the wrapping `<nav>` / `<div>`. */
export const tabNavListClass =
  "flex h-auto max-w-full items-center justify-start gap-1 overflow-x-auto rounded-none border-b border-zinc-800 bg-transparent p-0 no-scrollbar";

/** Shared by every item; the active/inactive half is added by the two below. */
const tabNavItemBase =
  "flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-none border-b-2 bg-transparent px-4 py-3 text-sm font-semibold shadow-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-600";

/** A Radix `TabsTrigger` — active state comes from `data-state`. */
export const tabNavTriggerClass = cn(
  tabNavItemBase,
  "border-transparent text-zinc-400 hover:text-zinc-100",
  "data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-zinc-50 data-[state=active]:shadow-none",
);

/** Which ends of a scrolling rail still have tabs past the edge of the screen. */
export interface RailEdges {
  start: boolean;
  end: boolean;
}

/** A pixel of slack, so a rail scrolled to a subpixel short of its end still counts as there. */
export const railEdges = ({
  scrollLeft,
  scrollWidth,
  clientWidth,
}: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}): RailEdges => ({
  start: scrollLeft > 1,
  end: scrollLeft + clientWidth < scrollWidth - 1,
});

/**
 * Fades whichever end of the rail has tabs past it. The rail hides its scrollbar, so on a phone
 * a tab cut cleanly at the screen's edge — or one entirely past it — looked like the end of the
 * row: Settings showed three of its five tabs with nothing to say there were two more.
 */
export const tabNavFadeClass = ({ start, end }: RailEdges): string => {
  if (start && end) {
    return "[mask-image:linear-gradient(to_right,transparent,#000_2.5rem,#000_calc(100%_-_2.5rem),transparent)]";
  }
  if (start)
    return "[mask-image:linear-gradient(to_right,transparent,#000_2.5rem)]";
  if (end)
    return "[mask-image:linear-gradient(to_left,transparent,#000_2.5rem)]";
  return "";
};

/** A plain `<button>` or `<Link>` — the call site knows which one is active. */
export const tabNavItemClass = (isActive: boolean, isDisabled = false) =>
  cn(
    tabNavItemBase,
    isActive
      ? "border-white text-zinc-50"
      : "border-transparent text-zinc-400 hover:text-zinc-100",
    isDisabled && "cursor-not-allowed opacity-50 hover:text-zinc-400",
  );
