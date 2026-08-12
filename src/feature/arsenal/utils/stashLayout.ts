/**
 * Where everything sits on the stash board.
 *
 * The board is a fixed grid — twelve columns, as many rows as the collection
 * needs — because a saved position is only worth saving if it means the same
 * thing tomorrow, and on a phone. Cells are addressed by a single index,
 * `row * STASH_COLUMNS + column`, which is what travels to Firestore.
 */

export const STASH_COLUMNS = 12;

/** Empty rows kept under the last item so there is always somewhere to drop. */
export const STASH_SPARE_ROWS = 2;

/** Anything that hangs on the board: one cell, or two stacked for a guitar. */
export interface StashPiece {
  id: string;
  /** Guitars take the cell below them as well. */
  tall: boolean;
}

/** id → index of the piece's top-left cell. */
export type StashLayout = Record<string, number>;

export const columnOf = (index: number, columns = STASH_COLUMNS): number =>
  index % columns;

export const rowOf = (index: number, columns = STASH_COLUMNS): number =>
  Math.floor(index / columns);

export const indexAt = (
  column: number,
  row: number,
  columns = STASH_COLUMNS,
): number => row * columns + column;

/** Every cell a piece covers when its top-left corner sits at `index`. */
export const cellsOf = (
  index: number,
  tall: boolean,
  columns = STASH_COLUMNS,
): number[] => (tall ? [index, index + columns] : [index]);

const isPlaceable = (
  index: number,
  tall: boolean,
  taken: Set<number>,
  columns: number,
): boolean => {
  if (!Number.isInteger(index) || index < 0) return false;
  return cellsOf(index, tall, columns).every((cell) => !taken.has(cell));
};

/** The first spot from the top-left that fits the piece. */
const firstFree = (
  tall: boolean,
  taken: Set<number>,
  columns: number,
): number => {
  for (let index = 0; ; index++) {
    if (isPlaceable(index, tall, taken, columns)) return index;
  }
};

/**
 * Turn saved positions into an arrangement that actually holds together.
 *
 * A saved position is a wish, not a fact: the item it belonged to may be gone,
 * two of them may have ended up on the same cell after a bad write, and new
 * drops have no position at all. Anything that doesn't fit falls back to the
 * first free spot, in the order the caller listed the pieces.
 */
export const resolveLayout = (
  pieces: StashPiece[],
  saved: StashLayout = {},
  columns = STASH_COLUMNS,
): { layout: StashLayout; rows: number } => {
  const taken = new Set<number>();
  const layout: StashLayout = {};

  // Saved positions get first refusal, in board order so the earliest wins a
  // contested cell — otherwise the winner would depend on inventory order.
  const placed = new Set<string>();
  const wishes = pieces
    .filter((piece) => typeof saved[piece.id] === "number")
    .sort((a, b) => saved[a.id] - saved[b.id]);
  for (const piece of wishes) {
    const index = saved[piece.id];
    if (!isPlaceable(index, piece.tall, taken, columns)) continue;
    layout[piece.id] = index;
    cellsOf(index, piece.tall, columns).forEach((cell) => taken.add(cell));
    placed.add(piece.id);
  }

  for (const piece of pieces) {
    if (placed.has(piece.id)) continue;
    const index = firstFree(piece.tall, taken, columns);
    layout[piece.id] = index;
    cellsOf(index, piece.tall, columns).forEach((cell) => taken.add(cell));
  }

  const lastRow = pieces.reduce((max, piece) => {
    const cells = cellsOf(layout[piece.id], piece.tall, columns);
    return Math.max(max, rowOf(cells[cells.length - 1], columns));
  }, -1);

  return { layout, rows: lastRow + 1 + STASH_SPARE_ROWS };
};

/**
 * Whether the player has ever arranged this board by hand.
 *
 * A saved arrangement is only honoured under `manual` order, so this is what
 * decides the order the stash *opens* in. Without it the board saved a player's
 * arrangement to their account and then re-sorted it away on every visit — the
 * work was in the document and never on the screen.
 */
export const hasSavedArrangement = (saved?: StashLayout): boolean =>
  saved != null && Object.keys(saved).length > 0;

/**
 * The piece covering a cell, if any. `exceptId` skips the piece being carried,
 * which is still in the layout while its ghost follows the pointer.
 */
export const pieceAt = <T extends StashPiece>(
  pieces: T[],
  layout: StashLayout,
  index: number,
  exceptId?: string,
  columns = STASH_COLUMNS,
): T | null =>
  pieces.find(
    (piece) =>
      piece.id !== exceptId &&
      cellsOf(layout[piece.id], piece.tall, columns).includes(index),
  ) ?? null;

/**
 * What the board would look like after dragging `movedId` onto `target`.
 *
 * Empty space takes the piece. A single piece in the way swaps places with it,
 * the way it does in every stash worth using — but only when it actually fits
 * where the dragged piece came from. Anything else is refused, and the caller
 * drops the piece back where it was.
 */
export const planMove = (
  pieces: StashPiece[],
  layout: StashLayout,
  movedId: string,
  target: number,
  columns = STASH_COLUMNS,
): StashLayout | null => {
  const moved = pieces.find((piece) => piece.id === movedId);
  if (!moved || !Number.isInteger(target) || target < 0) return null;

  const from = layout[movedId];
  if (from === target) return null;

  const targetCells = new Set(cellsOf(target, moved.tall, columns));
  const displaced = pieces.filter(
    (piece) =>
      piece.id !== movedId &&
      cellsOf(layout[piece.id], piece.tall, columns).some((cell) =>
        targetCells.has(cell),
      ),
  );

  // Everything that stays put, so both halves of a swap can be checked against
  // the same board.
  const settled = new Set<number>();
  for (const piece of pieces) {
    if (piece.id === movedId) continue;
    if (displaced.some((d) => d.id === piece.id)) continue;
    cellsOf(layout[piece.id], piece.tall, columns).forEach((cell) =>
      settled.add(cell),
    );
  }

  if (!isPlaceable(target, moved.tall, settled, columns)) return null;
  if (displaced.length === 0) return { ...layout, [movedId]: target };
  if (displaced.length > 1) return null;

  const other = displaced[0];
  const afterMove = new Set(settled);
  cellsOf(target, moved.tall, columns).forEach((cell) => afterMove.add(cell));
  if (!isPlaceable(from, other.tall, afterMove, columns)) return null;

  return { ...layout, [movedId]: target, [other.id]: from };
};
