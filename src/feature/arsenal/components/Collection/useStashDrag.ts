import type {
  StashLayout,
  StashPiece,
} from "feature/arsenal/utils/stashLayout";
import { pieceAt, planMove } from "feature/arsenal/utils/stashLayout";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { useCallback, useRef, useState } from "react";

import { cellFromPoint, cellSize, STASH_GAP } from "./StashBoard";

/** How far the pointer travels before a click becomes a drag. */
const THRESHOLD = 5;

interface UseStashDragOptions {
  pieces: StashPiece[];
  layout: StashLayout;
  rows: number;
  gridRef: RefObject<HTMLDivElement | null>;
  /** A move the board accepted. Already validated. */
  onMove: (next: StashLayout) => void;
  /**
   * The player started rearranging while the toolbar was still imposing an
   * order — the board freezes what is on screen and takes over from here.
   */
  onTakeOver?: () => void;
  enabled?: boolean;
  /**
   * Whether dropping the carried piece *onto* another one does something —
   * a rescued mod onto the instrument it would be fitted to. Answering yes turns
   * that piece into a target: it lights up, and letting go there calls `onApply`
   * instead of rearranging the board.
   */
  canApply?: (carriedId: string, targetId: string) => boolean;
  onApply?: (carriedId: string, targetId: string) => void;
}

export interface StashGhost {
  id: string;
  /** Top-left of the carried piece, in viewport pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Picking a piece up, carrying it, and putting it down.
 *
 * Pointer events rather than HTML drag-and-drop: the same code then covers
 * mouse and touch, the carried piece can be drawn at the size of the socket it
 * came from, and the board can say "no" before the player lets go. A press that
 * never travels far enough stays a click, so opening an item still works.
 */
export const useStashDrag = ({
  pieces,
  layout,
  rows,
  gridRef,
  onMove,
  onTakeOver,
  enabled = true,
  canApply,
  onApply,
}: UseStashDragOptions) => {
  const [ghost, setGhost] = useState<StashGhost | null>(null);
  const [drop, setDrop] = useState<{
    index: number;
    tall: boolean;
    valid: boolean;
  } | null>(null);
  /** The piece the carried one would be applied to, rather than swapped with. */
  const [applyTarget, setApplyTarget] = useState<string | null>(null);

  // Everything the gesture needs between events, kept off the render path.
  const gesture = useRef<{
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

  const reset = () => {
    gesture.current = null;
    if (typeof document !== "undefined") {
      document.body.style.removeProperty("cursor");
    }
    setGhost(null);
    setDrop(null);
    setApplyTarget(null);
  };

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const current = gesture.current;
      const grid = gridRef.current;
      if (!current || !grid) return;

      if (!current.active) {
        const travelled =
          Math.abs(event.clientX - current.startX) +
          Math.abs(event.clientY - current.startY);
        if (travelled < THRESHOLD) return;
        current.active = true;
        // The piece leaves the pointer's reach, so the cursor has to be told
        // from the top rather than by whatever it happens to be hovering.
        document.body.style.setProperty("cursor", "grabbing", "important");
        onTakeOver?.();
      }

      const { width, height } = cellSize(grid, rows);
      const pieceHeight = current.tall ? height * 2 + STASH_GAP : height;
      const x = event.clientX - current.offsetX;
      const y = event.clientY - current.offsetY;

      setGhost({ id: current.id, x, y, width, height: pieceHeight });

      // Aim with the piece itself, not the cursor: the cell under its own
      // top-left corner is the one it would occupy.
      const index = cellFromPoint(grid, x + width / 2, y + height / 2, rows);

      // Over something this piece can be applied to, the gesture stops being a
      // rearrangement: the target lights up and the landing box is dropped, so
      // the board never promises a move it is not about to make.
      const over =
        index == null ? null : pieceAt(pieces, layout, index, current.id);
      const applying = over && canApply?.(current.id, over.id) ? over.id : null;
      setApplyTarget(applying);

      setDrop(
        index == null || applying
          ? null
          : {
              index,
              tall: current.tall,
              valid:
                planMove(pieces, layout, current.id, index) !== null ||
                layout[current.id] === index,
            },
      );
    },
    [canApply, gridRef, layout, onTakeOver, pieces, rows],
  );

  const handlePointerUp = useCallback(() => {
    const current = gesture.current;
    if (current?.active) {
      dragged.current = true;
      // The click this press is about to fire belongs to the drag, not the item.
      setTimeout(() => {
        dragged.current = false;
      }, 0);
      if (applyTarget) {
        onApply?.(current.id, applyTarget);
      } else if (drop?.valid) {
        const next = planMove(pieces, layout, current.id, drop.index);
        if (next) onMove(next);
      }
    }
    reset();
  }, [applyTarget, drop, layout, onApply, onMove, pieces]);

  /** Handlers for one piece's socket. Undefined when the board is read-only. */
  const dragHandlers = (piece: StashPiece) => {
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
    /** The piece under the carried one that would receive it. */
    applyTarget,
    dragHandlers,
    /** True while the click that ends a drag is still on its way. */
    consumeClick: () => dragged.current,
  };
};
