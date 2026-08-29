import {
  cellFromPoint,
  cellSize,
  STASH_GAP,
} from "feature/arsenal/components/Collection/StashBoard";
import type {
  StashLayout,
  StashPiece,
} from "feature/arsenal/utils/stashLayout";
import { planMove } from "feature/arsenal/utils/stashLayout";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { useRef, useState } from "react";

/** How far the pointer travels before a click becomes a drag. */
const THRESHOLD = 5;

/** The guild screen has two cabinets, and a piece belongs to one of them. */
export type ShelfBoardId = "shelf" | "gear";

export interface ShelfBoard {
  id: ShelfBoardId;
  /** Measured by the caller — the drag hit-tests against the same rect. */
  gridRef: RefObject<HTMLDivElement | null>;
  rows: number;
  pieces: StashPiece[];
  layout: StashLayout;
  /**
   * Rearranging inside this board is saved. Absent — as it is on a shelf nobody
   * owns — and the board only gives pieces away and receives them.
   */
  onMove?: (next: StashLayout) => void;
}

export interface ShelfGhost {
  board: ShelfBoardId;
  id: string;
  /** Top-left of the carried piece, in viewport pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A rearrangement inside one board, previewed as a landing cell. */
export interface ShelfDrop {
  board: ShelfBoardId;
  index: number;
  tall: boolean;
  valid: boolean;
}

interface UseShelfDragOptions {
  boards: ShelfBoard[];
  /** The piece was carried onto the other cabinet — deposit it, or take it. */
  onTransfer: (from: ShelfBoardId, pieceId: string) => void;
  enabled?: boolean;
}

/**
 * Carrying a piece between the guild's shelf and your own gear.
 *
 * The arsenal's `useStashDrag` moves pieces around one board; here the gesture
 * has a second meaning, because the board a piece is let go over decides
 * whether it changes hands. Inside its own board the drag is the arrangement
 * the player already knows; across the gap it is a deposit or a withdrawal, and
 * the receiving cabinet lights up whole — where a shelf nobody arranges puts
 * the piece is not the player's decision to preview.
 */
export const useShelfDrag = ({
  boards,
  onTransfer,
  enabled = true,
}: UseShelfDragOptions) => {
  const [ghost, setGhost] = useState<ShelfGhost | null>(null);
  const [drop, setDrop] = useState<ShelfDrop | null>(null);
  /** The other cabinet, lit up because letting go now would move the piece. */
  const [receiving, setReceiving] = useState<ShelfBoardId | null>(null);

  // Everything the gesture needs between events, kept off the render path.
  const gesture = useRef<{
    board: ShelfBoardId;
    id: string;
    tall: boolean;
    startX: number;
    startY: number;
    /** Where inside the piece it was grabbed, so it doesn't jump to the cursor. */
    offsetX: number;
    offsetY: number;
    active: boolean;
  } | null>(null);
  /** Set the moment a drag ends, so the click it produces is swallowed. */
  const dragged = useRef(false);

  // The handlers are handed to the sockets fresh on every render, so they close
  // over this render's boards and this render's drop state rather than chasing
  // them through refs — a drag re-renders both cabinets on every pointer move
  // anyway, and a stale board is the one bug this hook cannot afford.
  const boardOf = (id: ShelfBoardId) => boards.find((board) => board.id === id);

  const reset = () => {
    gesture.current = null;
    if (typeof document !== "undefined") {
      document.body.style.removeProperty("cursor");
    }
    setGhost(null);
    setDrop(null);
    setReceiving(null);
  };

  /** Which cabinet a point is inside, and the cell of it under that point. */
  const hit = (clientX: number, clientY: number) => {
    for (const board of boards) {
      const grid = board.gridRef.current;
      if (!grid) continue;
      const index = cellFromPoint(grid, clientX, clientY, board.rows);
      if (index != null) return { board, index };
    }
    return null;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const current = gesture.current;
    const source = current ? boardOf(current.board) : undefined;
    const grid = source?.gridRef.current;
    if (!current || !source || !grid) return;

    if (!current.active) {
      const travelled =
        Math.abs(event.clientX - current.startX) +
        Math.abs(event.clientY - current.startY);
      if (travelled < THRESHOLD) return;
      current.active = true;
      // The piece leaves the pointer's reach, so the cursor has to be told
      // from the top rather than by whatever it happens to be hovering.
      document.body.style.setProperty("cursor", "grabbing", "important");
    }

    // The ghost keeps the size of the socket it came from, whichever cabinet
    // it is floating over.
    const { width, height } = cellSize(grid, source.rows);
    const pieceHeight = current.tall ? height * 2 + STASH_GAP : height;
    const x = event.clientX - current.offsetX;
    const y = event.clientY - current.offsetY;

    setGhost({
      board: current.board,
      id: current.id,
      x,
      y,
      width,
      height: pieceHeight,
    });

    // Aim with the piece itself, not the cursor: the cell under its own
    // middle is the one it would occupy.
    const over = hit(x + width / 2, y + height / 2);

    if (!over) {
      setDrop(null);
      setReceiving(null);
      return;
    }

    if (over.board.id !== current.board) {
      setDrop(null);
      setReceiving(over.board.id);
      return;
    }

    setReceiving(null);
    setDrop(
      source.onMove
        ? {
            board: source.id,
            index: over.index,
            tall: current.tall,
            valid:
              planMove(source.pieces, source.layout, current.id, over.index) !==
                null || source.layout[current.id] === over.index,
          }
        : null,
    );
  };

  const handlePointerUp = () => {
    const current = gesture.current;
    if (current?.active) {
      dragged.current = true;
      // The click this press is about to fire belongs to the drag, not the item.
      setTimeout(() => {
        dragged.current = false;
      }, 0);

      const source = boardOf(current.board);
      if (receiving && receiving !== current.board) {
        onTransfer(current.board, current.id);
      } else if (source?.onMove && drop?.valid) {
        const next = planMove(
          source.pieces,
          source.layout,
          current.id,
          drop.index,
        );
        if (next) source.onMove(next);
      }
    }
    reset();
  };

  /** Handlers for one piece's socket. Undefined when the boards are read-only. */
  const dragHandlers = (board: ShelfBoardId, piece: StashPiece) => {
    if (!enabled) return undefined;
    return {
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        // Left button / touch / pen only — a right-click is not a drag.
        if (event.button !== 0) return;
        // Stops the press from turning into a text selection or one of the
        // browser's own drags before the first pointermove ever arrives.
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        gesture.current = {
          board,
          id: piece.id,
          tall: piece.tall,
          startX: event.clientX,
          startY: event.clientY,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top,
          active: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: reset,
    };
  };

  return {
    ghost,
    drop,
    receiving,
    dragHandlers,
    /** True while the click that ends a drag is still on its way. */
    consumeClick: () => dragged.current,
  };
};
