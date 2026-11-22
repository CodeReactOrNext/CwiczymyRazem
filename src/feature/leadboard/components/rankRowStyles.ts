import { cn } from "assets/lib/utils";

/**
 * The look of a ranking row — "place · player · score" — shared by the main
 * leaderboard and every smaller board that lists players by a number (duels,
 * guild roster, the daily exercise). One place for the medals, the lit card and
 * the scoreboard number, so the boards read as one family.
 */

/** Medal keys for the podium: face, lip and ink. Everyone else gets zinc. */
export const PODIUM_KEY: Record<number, string> = {
  1: "border-b-amber-700 bg-amber-400 text-zinc-950",
  2: "border-b-zinc-500 bg-zinc-300 text-zinc-950",
  3: "border-b-orange-700 bg-orange-400 text-zinc-950",
};

/** The same medal as light falling on the card from the left. */
export const PODIUM_LIGHT: Record<number, string> = {
  1: "from-amber-400/15",
  2: "from-zinc-300/10",
  3: "from-orange-400/10",
};

/** Places that wear a medal, unless the board has switched medals off. */
export const isPodiumPlace = (place: number, podium = true): boolean =>
  podium && place <= 3;

/**
 * The place is a key, like every control in the app: a face and a lip. It
 * labels the row and is not a button, so it never moves. Size it at the call
 * site (`h-7 w-8 text-xl` on a single line, `h-9 w-10 text-2xl` on a card).
 */
export const placeKeyClass = (
  place: number,
  isCurrentUser: boolean,
  podium = true,
): string =>
  cn(
    "flex flex-shrink-0 items-center justify-center rounded-[0.625rem] border-b-[3px] pt-0.5 font-teko font-semibold tabular-nums leading-none",
    (podium ? PODIUM_KEY[place] : undefined) ??
      cn(
        "border-b-black/40 bg-zinc-800 bg-clip-padding",
        isCurrentUser ? "text-cyan-300" : "text-zinc-300",
      ),
  );

/** The row's card: glass, lit cyan for the player, lit by the medal on the podium. */
export type RankRowSurface = "card" | "bare";

/**
 * `bare` is for a board that already sits inside a card (the daily exercise
 * widget): the row keeps its highlight for the current player and podium
 * light, but drops the glass face so it is not a card inside a card.
 */
export const rankCardClass = (
  place: number,
  isCurrentUser: boolean,
  podium = true,
  surface: RankRowSurface = "card",
): string =>
  cn(
    surface === "card"
      ? "relative overflow-hidden rounded-xl transition-background glass-card hover:glass-card-hover"
      : "relative overflow-hidden rounded-lg transition-background hover:bg-zinc-800/40",
    isCurrentUser
      ? "light-tint bg-gradient-to-r from-cyan-400/15 to-cyan-400/5"
      : isPodiumPlace(place, podium) &&
          cn(
            "light-tint bg-gradient-to-r via-transparent to-transparent",
            PODIUM_LIGHT[place],
          ),
  );

/** Ink for the player's name-side accents and the score. */
export const rankAccentText = (
  place: number,
  isCurrentUser: boolean,
  podium = true,
): string =>
  isCurrentUser
    ? "text-cyan-300"
    : podium && place === 1
      ? "text-amber-400"
      : "text-zinc-100";

export type RankScoreDensity = "default" | "compact";

/**
 * The number the board is sorted by, set like a scoreboard. `default` is the
 * column on the wide leaderboard card; `compact` is the single-line row.
 */
export const rankScoreClass = (
  place: number,
  isCurrentUser: boolean,
  density: RankScoreDensity = "default",
  podium = true,
): string =>
  density === "compact"
    ? cn(
        "pt-0.5 font-teko text-2xl font-semibold tabular-nums leading-none",
        rankAccentText(place, isCurrentUser, podium),
      )
    : cn(
        "pt-1 text-right font-teko font-semibold tabular-nums leading-none",
        isPodiumPlace(place, podium) ? "text-4xl" : "text-3xl",
        rankAccentText(place, isCurrentUser, podium),
      );
