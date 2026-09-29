import type { CommunityTab } from "feature/logsBox/hooks/useCommunityDrawer";

/**
 * How tall the community panel's box is, and which of its tabs scroll inside that box.
 *
 * Phones used to get no height at all: the chat's message list then stretched the card to the
 * full length of the conversation and left the composer a couple of thousand pixels below the
 * fold, and the feed ran off the bottom of the page with its tab rail scrolled away with it.
 * So on phones the panel is a screen-sized box that scrolls inside itself — the shape the
 * drawer already has — and from `sm` up nothing changes.
 */

/** A box the height of the phone's screen, with the bottom nav still in view under it. */
const MOBILE_PANEL_HEIGHT = "h-[85dvh]";

/** The box the tall tabs have always had on wider screens. */
const DESKTOP_PANEL_HEIGHT = "sm:h-[650px] lg:h-[800px]";

/** Fills its box and scrolls in it, with the panel's scrollbar. */
export const PANEL_SCROLL_CLASS =
  "min-h-0 flex-1 overflow-y-auto scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-600";

/**
 * Scrolls inside the panel on phones and grows the page from `sm` up — the feed's shape
 * everywhere but the drawer, where it scrolls at every width.
 */
export const MOBILE_PANEL_SCROLL_CLASS = `${PANEL_SCROLL_CLASS} sm:flex-none sm:overflow-visible`;

/**
 * The panel's height for the open tab. `hasOwnHeight` means something outside sized it already —
 * the drawer — and then the panel adds no height of its own.
 */
export const panelHeightClass = ({
  tab,
  hasOwnHeight,
}: {
  tab: CommunityTab;
  hasOwnHeight: boolean;
}): string => {
  if (hasOwnHeight) return "";
  // The feed is a page-long list from `sm` up, as it has always been: only phones bound it.
  if (tab === "logs") return `${MOBILE_PANEL_HEIGHT} sm:h-auto`;

  return `${MOBILE_PANEL_HEIGHT} ${DESKTOP_PANEL_HEIGHT}`;
};

/** Where the feed scrolls: in the drawer at every width, on a page only on phones. */
export const feedScrollClass = (contained: boolean): string =>
  contained ? PANEL_SCROLL_CLASS : MOBILE_PANEL_SCROLL_CLASS;
