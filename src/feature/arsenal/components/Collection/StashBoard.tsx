import { cn } from "assets/lib/utils";
import {
  columnOf,
  rowOf,
  STASH_COLUMNS,
} from "feature/arsenal/utils/stashLayout";
import type { CSSProperties, ReactNode, RefObject } from "react";

export const STASH_GAP = 4;
/** Below this the board stops shrinking and starts scrolling sideways. */
export const STASH_MIN_CELL = 46;

interface StashBoardProps {
  rows: number;
  /** Measured by the caller — the drag needs the same rect to hit-test against. */
  gridRef: RefObject<HTMLDivElement | null>;
  /** Cell being dropped on, and whether the piece is allowed to land there. */
  drop?: { index: number; tall: boolean; valid: boolean } | null;
  /**
   * The whole cabinet is the drop target right now — a piece is being carried
   * over from another board, where the cell it lands on is nobody's decision.
   */
  receiving?: boolean;
  label?: string;
  children: ReactNode;
  className?: string;
}

/**
 * The cabinet: a fixed twelve-column grid of empty sockets with the items
 * placed on top of it.
 *
 * Both the empties and the items are placed by explicit grid coordinates, so an
 * item simply covers the socket it occupies and nothing reflows when it moves —
 * which is the whole point of letting the player move it.
 */
export const StashBoard = ({
  rows,
  gridRef,
  drop,
  receiving = false,
  label,
  children,
  className,
}: StashBoardProps) => (
  <div
    className={cn(
      "overflow-x-auto rounded-lg p-2 transition-shadow",
      className,
    )}
    style={{
      background: receiving
        ? "linear-gradient(180deg, rgba(34,211,238,0.16) 0%, rgba(9,9,11,0.85) 22%, rgba(9,9,11,0.92) 100%)"
        : "linear-gradient(180deg, rgba(39,39,42,0.55) 0%, rgba(9,9,11,0.85) 22%, rgba(9,9,11,0.92) 100%)",
      // A carried piece has to be told which cabinet will take it, and a lit
      // socket cannot say it: where the piece lands on a shelf nobody arranges
      // is the board's choice, not the player's. So the cabinet itself lights
      // up, in the same cyan a socket uses when it is the target.
      boxShadow: receiving
        ? "inset 0 0 0 1px rgba(34,211,238,0.75), 0 0 22px rgba(34,211,238,0.22)"
        : "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(0,0,0,0.6)",
    }}>
    <div
      ref={gridRef}
      role={label ? "group" : undefined}
      aria-label={label}
      className='grid'
      style={
        {
          gap: STASH_GAP,
          gridTemplateColumns: `repeat(${STASH_COLUMNS}, minmax(${STASH_MIN_CELL}px, 1fr))`,
          gridAutoRows: "1fr",
          // Square sockets: as many rows tall as the board is wide, per column.
          aspectRatio: `${STASH_COLUMNS} / ${Math.max(rows, 1)}`,
        } as CSSProperties
      }>
      {/* Every cell gets a socket, placed by hand rather than flowed: auto
          placement steps around explicitly positioned items, which would push
          the empties into rows of their own and leave the board ragged. Items
          come later in the DOM, so they simply cover the socket they occupy. */}
      {Array.from({ length: STASH_COLUMNS * rows }, (_, i) => (
        <div
          key={`socket-${i}`}
          aria-hidden
          className='rounded-sm'
          style={{
            gridColumn: columnOf(i) + 1,
            gridRow: rowOf(i) + 1,
            background:
              "linear-gradient(160deg, rgba(24,24,27,0.9) 0%, rgba(9,9,11,0.9) 100%)",
            boxShadow:
              "inset 0 0 0 1px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.035)",
          }}
        />
      ))}

      {/* Where the carried piece would land, drawn under it and over the sockets */}
      {drop && (
        <div
          aria-hidden
          className='pointer-events-none rounded-sm'
          style={{
            gridColumn: columnOf(drop.index) + 1,
            gridRow: `${rowOf(drop.index) + 1} / span ${drop.tall ? 2 : 1}`,
            background: drop.valid
              ? "rgba(34,211,238,0.14)"
              : "rgba(244,63,94,0.16)",
            boxShadow: `inset 0 0 0 1px ${
              drop.valid ? "rgba(34,211,238,0.7)" : "rgba(244,63,94,0.7)"
            }`,
          }}
        />
      )}

      {children}
    </div>
  </div>
);

/** Which cell a pointer is over, or null when it is off the board. */
export const cellFromPoint = (
  grid: HTMLElement,
  clientX: number,
  clientY: number,
  rows: number,
): number | null => {
  const rect = grid.getBoundingClientRect();
  const cellWidth =
    (rect.width - STASH_GAP * (STASH_COLUMNS - 1)) / STASH_COLUMNS;
  const cellHeight = (rect.height - STASH_GAP * (rows - 1)) / rows;
  if (cellWidth <= 0 || cellHeight <= 0) return null;

  const column = Math.floor((clientX - rect.left) / (cellWidth + STASH_GAP));
  const row = Math.floor((clientY - rect.top) / (cellHeight + STASH_GAP));
  if (column < 0 || column >= STASH_COLUMNS) return null;
  if (row < 0 || row >= rows) return null;
  return row * STASH_COLUMNS + column;
};

/** The pixel box of a cell, for the drag ghost to match the socket it came from. */
export const cellSize = (grid: HTMLElement, rows: number) => {
  const rect = grid.getBoundingClientRect();
  return {
    width: (rect.width - STASH_GAP * (STASH_COLUMNS - 1)) / STASH_COLUMNS,
    height: (rect.height - STASH_GAP * (rows - 1)) / rows,
  };
};
