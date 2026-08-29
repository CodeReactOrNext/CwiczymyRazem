import type { StashPiece } from "feature/arsenal/utils/stashLayout";
import {
  resolveLayout,
  STASH_SPARE_ROWS,
} from "feature/arsenal/utils/stashLayout";
import type { StashItemKind } from "feature/guilds/types/stash.types";

/**
 * How much of the shelf is actually in use, in rows.
 *
 * The shelf is capped in rows rather than in items because a row is what the
 * guild buys and what a member sees — and because sockets are not
 * interchangeable: a guitar hangs across two of them, stacked, so twelve free
 * cells scattered around a board may still have nowhere to hang one. Counting
 * cells would let a shelf pass a check it cannot draw.
 *
 * So the count is the arrangement itself, run through the board's own layout —
 * the same function, in the same order, that the tab draws with. The server
 * refuses a deposit that would push this past the rows the guild has paid for,
 * and it refuses it against the picture the member is looking at.
 */

/** One entry as the board sees it: an id, and whether it hangs two cells tall. */
export const shelfPiece = (entry: {
  id: string;
  kind: StashItemKind;
}): StashPiece => ({ id: entry.id, tall: entry.kind === "guitar" });

/** Rows the current arrangement fills, ignoring the spare room under it. */
export const shelfRowsUsed = (pieces: StashPiece[]): number =>
  resolveLayout(pieces, {}).rows - STASH_SPARE_ROWS;

/** Whether an arrangement fits on a shelf that has bought `rowLimit` rows. */
export const shelfHasRoom = (pieces: StashPiece[], rowLimit: number): boolean =>
  shelfRowsUsed(pieces) <= rowLimit;
