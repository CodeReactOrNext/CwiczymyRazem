import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import { AlertTriangle, LayoutGrid, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  type ChainTier,
  evaluateChain,
  readChainNodes,
  wiredOrder,
} from "../../data/signalChain";
import type {
  ArsenalUserData,
  PedalboardPlacement,
} from "../../types/arsenal.types";
import { getEffectImageSrc } from "../../utils/effectImage";
import type { BoardBox, BoardLayout } from "../../utils/pedalboardLayout";
import {
  collidesWithAny,
  createJackResolver,
  createWidthResolver,
  DEFAULT_ASPECT,
  EFFECT_IMAGE_ASPECT,
  findFreeSpot,
  findSwapTarget,
  layoutBoard,
  packInOrder,
  PEDAL_H_PCT,
  planSwap,
  tidyBoard,
} from "../../utils/pedalboardLayout";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { RARITY_STYLES } from "../RarityBadge";
import { EffectPickerModal } from "./EffectPickerModal";
import { BoardJack, SignalCable } from "./SignalCable";
import { SignalPathPanel } from "./SignalPathPanel";

/** How long a "no room left" message stays up next to the board controls. */
const NOTICE_MS = 8000;

const BOARD_FULL =
  "The board is full — take a pedal off before adding another.";

/** Says it twice: a toast you cannot miss, and a line that stays on the board. */
const announce = (message: string, setNotice: (value: string) => void) => {
  setNotice(message);
  toast.warning(message);
};

interface DragState {
  itemId: string;
  offXPct: number;
  offYPct: number;
  /** The slot the pedal owns while it is in the air, and drops back into.
   *  Trading places with a neighbour hands it that neighbour's slot. */
  homeXPct: number;
  homeYPct: number;
  /** The pedal just traded with. It is off limits until the dragged one has
   *  stepped off it again, which is what stops a swap ping-ponging. */
  lockedId: string | null;
  /** Something has been traded, so letting go is an exchange, not a drop. */
  swapped: boolean;
}

interface PedalboardViewProps {
  data: ArsenalUserData;
  onUpdateItems: (items: PedalboardPlacement[]) => void;
  onHover?: (
    e: React.MouseEvent | null,
    content: React.ReactNode | null,
  ) => void;
  /** Touch-only: tapping a pedal opens its card in a modal (drag is disabled when set). */
  onShowCard?: (content: React.ReactNode) => void;
}

export const PedalboardView = ({
  data,
  onUpdateItems,
  onHover,
  onShowCard,
}: PedalboardViewProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [dragging, setDraggingState] = useState<DragState | null>(null);
  // Mirrors `dragging` for the window handlers: the mouse can move twice
  // before React re-renders, and the second move has to see the slot the
  // first one traded for.
  const draggingRef = useRef<DragState | null>(null);

  const setDragging = (next: DragState | null) => {
    draggingRef.current = next;
    setDraggingState(next);
  };

  const [isColliding, setIsColliding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Natural aspect ratio (w/h) per image, measured once the image loads. It
  // only ever corrects EFFECT_IMAGE_ASPECT, which already knows every shipped
  // pedal — so the board can lay itself out before a single image is decoded.
  const [aspectById, setAspectById] = useState<Record<number | string, number>>(
    {},
  );
  // Pedals the board has no room for. They stay in the rig (they are still
  // equipped) but are parked below the case instead of stacked on top of
  // another pedal.
  const [overflowIds, setOverflowIds] = useState<string[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);
  const onUpdateItemsRef = useRef(onUpdateItems);

  const debouncedSave = useCallback((items: PedalboardPlacement[]) => {
    pendingSaveRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      pendingSaveRef.current = false;
      onUpdateItemsRef.current(items);
    }, 600);
  }, []);

  const [localItems, setLocalItemsState] = useState<PedalboardPlacement[]>(
    () =>
      Array.isArray(data.rig.pedalboardItems) ? data.rig.pedalboardItems : [],
  );
  // Mirrors `localItems` for the drag handlers, which read positions between
  // renders while the mouse is moving.
  const localItemsRef = useRef(localItems);

  const setLocalItems = (next: PedalboardPlacement[]) => {
    localItemsRef.current = next;
    setLocalItemsState(next);
  };

  // Width-in-board-% of every pedal, driven by its image's own proportions so
  // a wide (dual) pedal really is wider instead of being squished.
  const widthOf = useMemo(
    () => createWidthResolver(data.effectInventory, aspectById),
    [data.effectInventory, aspectById],
  );

  // Where each pedal takes its cable, so a top-mounted enclosure gets the
  // patch coming over the board rather than in through its side.
  const jacksOf = useMemo(
    () => createJackResolver(data.effectInventory),
    [data.effectInventory],
  );
  const widthOfRef = useRef(widthOf);
  const overflowRef = useRef(overflowIds);

  // Handlers that outlive a render (drag, save) read these through refs.
  useEffect(() => {
    onUpdateItemsRef.current = onUpdateItems;
    widthOfRef.current = widthOf;
    overflowRef.current = overflowIds;
  }, [onUpdateItems, widthOf, overflowIds]);

  /** Everything currently occupying board space, minus one pedal. */
  const boardBoxes = useCallback((excludeId?: string): BoardBox[] => {
    const overflow = overflowRef.current;
    return localItemsRef.current
      .filter((i) => i.itemId !== excludeId && !overflow.includes(i.itemId))
      .map((i) => ({
        itemId: i.itemId,
        xPct: i.xPct,
        yPct: i.yPct,
        wPct: widthOfRef.current(i.itemId),
      }));
  }, []);

  /** Applies a computed layout: board positions, parked pedals and the save. */
  const applyLayout = useCallback(
    (layout: BoardLayout, source: PedalboardPlacement[]) => {
      const byId = new Map(layout.placed.map((item) => [item.itemId, item]));
      // Keep the stored order — only the positions change.
      const next = source.map((item) => byId.get(item.itemId) ?? item);
      setOverflowIds(layout.overflow.map((i) => i.itemId));
      setLocalItems(next);
      if (layout.changed) debouncedSave(next);
      return next;
    },
    [debouncedSave],
  );

  // Straighten out whatever comes back from the server: pedals dropped on top
  // of each other by older builds of this board get moved to free space.
  useEffect(() => {
    if (dragging || pendingSaveRef.current) return;
    const items = Array.isArray(data.rig.pedalboardItems)
      ? data.rig.pedalboardItems
      : [];
    applyLayout(layoutBoard(items, widthOf), items);
  }, [data.rig.pedalboardItems, dragging, widthOf, applyLayout]);

  useEffect(() => {
    const timer = notice ? setTimeout(() => setNotice(null), NOTICE_MS) : null;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [notice]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const drag = draggingRef.current;
      if (!drag || !boardRef.current) return;
      const { itemId } = drag;
      const rect = boardRef.current.getBoundingClientRect();
      const wPct = widthOfRef.current(itemId);
      // A pedal in the air goes wherever the hand takes it — neighbours are
      // traded with rather than bumped into, so nothing is in its way.
      const xPct = Math.max(
        0,
        Math.min(
          100 - wPct,
          ((e.clientX - rect.left) / rect.width) * 100 - drag.offXPct,
        ),
      );
      const yPct = Math.max(
        0,
        Math.min(
          100 - PEDAL_H_PCT,
          ((e.clientY - rect.top) / rect.height) * 100 - drag.offYPct,
        ),
      );

      let next = localItemsRef.current.map((item) =>
        item.itemId === itemId ? { ...item, xPct, yPct } : item,
      );
      let home = { xPct: drag.homeXPct, yPct: drag.homeYPct };

      // Standing on a neighbour trades places with it: the neighbour slides
      // into the slot being carried around, and the dragged pedal inherits the
      // one just vacated. That is the whole of reordering the board — no
      // shuffling anything out of the way first.
      const others = boardBoxes(itemId);
      const target = findSwapTarget({ xPct, yPct, wPct }, others);
      if (target && target.itemId !== drag.lockedId) {
        const plan = planSwap(
          { ...home, wPct },
          target,
          others.filter((box) => box.itemId !== target.itemId),
        );
        if (plan) {
          home = plan.home;
          next = next.map((item) =>
            item.itemId === target.itemId ? { ...item, ...plan.target } : item,
          );
          setDragging({
            ...drag,
            homeXPct: plan.home.xPct,
            homeYPct: plan.home.yPct,
            lockedId: target.itemId,
            swapped: true,
          });
        }
      } else if (!target && drag.lockedId) {
        setDragging({ ...drag, lockedId: null });
      }

      // Red only when the pedal has nowhere of its own to fall back to: it is
      // covering a neighbour and its own slot is taken as well. Trading places
      // never lights it up, because that lands cleanly.
      const settled = next.filter(
        (i) => i.itemId !== itemId && !overflowRef.current.includes(i.itemId),
      );
      const boxes = settled.map((i) => ({
        xPct: i.xPct,
        yPct: i.yPct,
        wPct: widthOfRef.current(i.itemId),
      }));
      setIsColliding(
        collidesWithAny({ xPct, yPct, wPct }, boxes) &&
          collidesWithAny({ ...home, wPct }, boxes),
      );

      setLocalItems(next);
    },
    [boardBoxes],
  );

  const handleMouseUp = useCallback(() => {
    const drag = draggingRef.current;
    if (!drag) return;
    const { itemId, swapped } = drag;
    const home = { xPct: drag.homeXPct, yPct: drag.homeYPct };
    setDragging(null);
    setIsColliding(false);

    const prev = localItemsRef.current;
    const dropped = prev.find((i) => i.itemId === itemId);
    const wPct = widthOfRef.current(itemId);
    const others = boardBoxes(itemId);
    const settleAt = (spot: { xPct: number; yPct: number }) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, ...spot } : item,
      );
    let next = prev;

    if (dropped) {
      const box = { xPct: dropped.xPct, yPct: dropped.yPct, wPct };
      const homeBox = { ...home, wPct };
      const covered = collidesWithAny(box, others);
      const homeFree = !collidesWithAny(homeBox, others);

      if (
        homeFree &&
        (covered || (swapped && collidesWithAny(box, [homeBox])))
      ) {
        // An exchange finishes in the slot it traded for, so the two pedals
        // really do end up in each other's places instead of near enough.
        next = settleAt(home);
      } else if (covered) {
        // Nowhere of its own to go back to — the pedal came off a stack, or
        // its slot was taken while it was in the air.
        const spot = findFreeSpot(others, wPct);
        if (spot) {
          next = settleAt(spot);
        } else {
          setOverflowIds((ids) =>
            ids.includes(itemId) ? ids : [...ids, itemId],
          );
          announce(BOARD_FULL, setNotice);
        }
      }
    }

    setLocalItems(next);
    debouncedSave(next);
  }, [debouncedSave, boardBoxes]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handlePedalMouseDown = (
    e: React.MouseEvent,
    item: PedalboardPlacement,
  ) => {
    // On touch devices we open the card on tap instead of dragging.
    if (onShowCard) return;
    e.preventDefault();
    onHover?.(null, null);
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const curXPct = ((e.clientX - rect.left) / rect.width) * 100;
    const curYPct = ((e.clientY - rect.top) / rect.height) * 100;
    setDragging({
      itemId: item.itemId,
      offXPct: curXPct - item.xPct,
      offYPct: curYPct - item.yPct,
      homeXPct: item.xPct,
      homeYPct: item.yPct,
      lockedId: null,
      swapped: false,
    });
  };

  const handleRemove = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const remaining = localItems.filter((i) => i.itemId !== itemId);
    // Taking a pedal off can free the room a parked one was waiting for.
    debouncedSave(applyLayout(layoutBoard(remaining, widthOf), remaining));
  };

  const handlePickerSelect = (inventoryItemId: string | null) => {
    if (
      !inventoryItemId ||
      localItems.some((i) => i.itemId === inventoryItemId)
    )
      return;
    const spot = findFreeSpot(boardBoxes(), widthOf(inventoryItemId));
    if (!spot) {
      announce(BOARD_FULL, setNotice);
      return;
    }
    const next = [...localItems, { itemId: inventoryItemId, ...spot }];
    setLocalItems(next);
    debouncedSave(next);
  };

  /**
   * Lays the whole board out in the order the craft asks for.
   *
   * It is the only way to reorder the board on a touch device, where dragging is
   * off — but it earns its place on the desktop too, because watching six pedals
   * slide into place and the cable go green in one motion is the moment that
   * teaches the rule. Pedals sharing a stage keep the order the player put them
   * in; only the ones actually standing in the wrong place move.
   */
  const handleWireUp = () => {
    const layout = packInOrder(
      wiredOrder(localItems, data.effectInventory),
      widthOf,
    );
    applyLayout(layout, localItems);
    setNotice(null);
    if (layout.overflow.length > 0) {
      announce(
        `No room for ${layout.overflow.length} pedal${layout.overflow.length > 1 ? "s" : ""} — the rest is wired in order.`,
        setNotice,
      );
    }
  };

  const handleTidy = () => {
    const layout = tidyBoard(localItems, widthOf);
    applyLayout(layout, localItems);
    if (layout.overflow.length > 0) {
      const count = layout.overflow.length;
      announce(
        `No room for ${count} pedal${count > 1 ? "s" : ""} — ${count > 1 ? "they are" : "it is"} parked below the board.`,
        setNotice,
      );
    } else {
      setNotice(null);
    }
  };

  const cardFor = (itemId: string) => {
    const invItem = data.effectInventory.find((e) => e.id === itemId);
    return invItem ? <EffectCard item={invItem} readOnly /> : null;
  };

  const occupiedIds = localItems.map((i) => i.itemId);
  const boardItems = localItems.filter((i) => !overflowIds.includes(i.itemId));
  const overflowItems = localItems.filter((i) =>
    overflowIds.includes(i.itemId),
  );

  // Scored off the *live* board rather than the saved one, so the panel and the
  // cable move under the player's hand instead of 600ms after it. Parked pedals
  // are included because the server counts them too — what the panel promises
  // has to be what a session pays.
  const verdict = useMemo(
    () => evaluateChain(readChainNodes(localItems, data.effectInventory)),
    [localItems, data.effectInventory],
  );
  const isOnBoard = useCallback(
    (itemId: string) => !overflowIds.includes(itemId),
    [overflowIds],
  );

  // The one moment the whole system exists for: say it out loud, once, on the
  // transition — not every render the board happens to be right.
  const lastTierRef = useRef<ChainTier | null>(null);
  useEffect(() => {
    // Mid-drag the board is in whatever state the mouse left it; wait for the
    // pedal to land before congratulating anybody.
    if (dragging) return;
    const previous = lastTierRef.current;
    lastTierRef.current = verdict.tier;
    if (previous === null || previous === verdict.tier) return;
    if (verdict.tier === "book" && verdict.rate > 0) {
      toast.success(
        `By the book — the board pays +${verdict.rate.toFixed(1)} Fame/h`,
      );
    }
  }, [dragging, verdict.tier, verdict.rate]);

  // Lets the picker grey out pedals the board has no space for, so a full
  // board is visible before anything is clicked.
  const occupancy = boardItems.map((i) => ({
    xPct: i.xPct,
    yPct: i.yPct,
    wPct: widthOf(i.itemId),
  }));
  const canFit = (itemId: string) =>
    findFreeSpot(occupancy, widthOf(itemId)) !== null;

  return (
    <>
      {/* What the wiring below is worth, and how to fix it. */}
      <div className='mb-5'>
        <SignalPathPanel
          verdict={verdict}
          onWireUp={boardItems.length > 1 ? handleWireUp : undefined}
        />
      </div>

      {/* Board controls live off the surface so they never sit under a pedal. */}
      <div className='mb-3 flex flex-wrap items-center justify-end gap-x-3 gap-y-2'>
        {notice && (
          <p className='mr-auto flex items-center gap-1.5 text-[11px] font-semibold text-amber-400'>
            <AlertTriangle size={13} strokeWidth={2.5} className='shrink-0' />
            {notice}
          </p>
        )}
        {boardItems.length > 1 && (
          <button
            onClick={handleTidy}
            className='flex items-center gap-1.5 rounded bg-zinc-800/60 px-3 py-1.5 text-[9px] font-black capitalize tracking-[0.2em] text-zinc-400 transition-colors hover:bg-zinc-700/70 hover:text-white'
            title='Line every pedal up in rows'>
            <LayoutGrid size={10} strokeWidth={2.5} />
            Tidy Up
          </button>
        )}
        <button
          onClick={() => setShowPicker(true)}
          className='flex items-center gap-1.5 rounded bg-zinc-800/60 px-3 py-1.5 text-[9px] font-black capitalize tracking-[0.2em] text-zinc-300 transition-colors hover:bg-zinc-700/70 hover:text-white'>
          <Plus size={10} strokeWidth={2.5} />
          Add Pedal
        </button>
      </div>

      {/* Case outer shell */}
      <div
        className='relative w-full select-none'
        style={{
          background:
            "linear-gradient(160deg, #2e2e2e 0%, #1c1c1c 50%, #222 100%)",
          borderRadius: 4,
          padding: "10px 14px 14px",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
          border: "2px solid #383838",
        }}>
        {/* Top bar: latches + label */}
        <div className='mb-2.5 flex items-center justify-between px-1'>
          <div className='flex gap-2'>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 11,
                  background:
                    "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)",
                  borderRadius: 4,
                  boxShadow:
                    "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
          <span className='text-[8px] font-black capitalize tracking-[0.35em] text-zinc-600'>
            Pedalboard
          </span>
          <div className='flex gap-2'>
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 11,
                  background:
                    "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)",
                  borderRadius: 4,
                  boxShadow:
                    "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Board surface — perforated */}
        <div
          ref={boardRef}
          className='relative w-full overflow-hidden'
          style={{
            aspectRatio: "16 / 7",
            borderRadius: 4,
            backgroundImage:
              "radial-gradient(circle, #272727 1.4px, transparent 1.4px)",
            backgroundSize: "9px 9px",
            backgroundColor: "#141414",
            // A board wired by the book washes emerald from the inside. It is the
            // one piece of feedback that needs no reading at all.
            boxShadow: verdict.flawless
              ? "inset 0 4px 16px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(52,211,153,0.10), inset 0 0 44px rgba(16,185,129,0.11)"
              : "inset 0 4px 16px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.02)",
            transition: "box-shadow 0.4s ease",
            cursor: dragging ? "grabbing" : "default",
          }}>
          {/* The signal runs the way a pedal is built — input on the right
              face, output on the left — so it comes in at the top right and
              leaves for the amp at the bottom left. */}
          <BoardJack kind='in' />
          <BoardJack kind='out' />

          <SignalCable
            verdict={verdict}
            widthOf={widthOf}
            jacksOf={jacksOf}
            isOnBoard={isOnBoard}
          />

          {/* Pedals */}
          {boardItems.map((placement) => {
            const invItem = data.effectInventory.find(
              (e) => e.id === placement.itemId,
            );
            const effect = invItem ? EFFECTS_BY_ID.get(invItem.effectId) : null;
            const rs = effect
              ? RARITY_STYLES[
                  getEffectiveRarity(effect.rarity, invItem?.buildLevel)
                ]
              : null;
            if (!effect || !rs) return null;
            const isDragging = dragging?.itemId === placement.itemId;
            const showCollision = isDragging && isColliding;
            const wPct = widthOf(placement.itemId);

            return (
              <div
                key={placement.itemId}
                onMouseDown={(e) => handlePedalMouseDown(e, placement)}
                onMouseMove={(e) => {
                  if (!dragging && invItem)
                    onHover?.(e, <EffectCard item={invItem} readOnly />);
                }}
                onMouseLeave={() => onHover?.(null, null)}
                onClick={() => {
                  if (onShowCard && invItem)
                    onShowCard(<EffectCard item={invItem} readOnly />);
                }}
                className='group absolute'
                style={{
                  left: `${placement.xPct}%`,
                  top: `${placement.yPct}%`,
                  width: `${wPct}%`,
                  height: `${PEDAL_H_PCT}%`,
                  zIndex: isDragging ? 50 : 2,
                  cursor: isDragging ? "grabbing" : "grab",
                  filter: showCollision
                    ? `drop-shadow(0 14px 28px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(220,38,38,0.9))`
                    : isDragging
                      ? `drop-shadow(0 18px 32px rgba(0,0,0,0.98)) drop-shadow(0 0 14px ${rs.baseColor}70)`
                      : `drop-shadow(0 6px 12px rgba(0,0,0,0.9)) drop-shadow(0 2px 4px rgba(0,0,0,0.7))`,
                  transform: isDragging
                    ? "scale(1.07) translateY(-6px)"
                    : "scale(1)",
                  // A pedal being traded with slides into its new place, so the
                  // exchange is something the player watches happen rather than
                  // a jump they have to work out afterwards.
                  transition: isDragging
                    ? "none"
                    : "left 0.18s ease, top 0.18s ease, filter 0.15s, transform 0.15s",
                }}>
                <img
                  src={getEffectImageSrc(effect.imageId, "full")}
                  alt={effect.name}
                  className='h-full w-full object-contain'
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (!img.naturalWidth || !img.naturalHeight) return;
                    const ar = img.naturalWidth / img.naturalHeight;
                    const known =
                      EFFECT_IMAGE_ASPECT[effect.imageId] ?? DEFAULT_ASPECT;
                    // Only worth remembering when the image is not what the
                    // layout table already assumes.
                    if (Math.abs(known - ar) < 0.005) return;
                    setAspectById((prev) =>
                      prev[effect.imageId] === ar
                        ? prev
                        : { ...prev, [effect.imageId]: ar },
                    );
                  }}
                />
                {/* LED indicator */}
                <div
                  className='absolute bottom-[10%] left-1/2 -translate-x-1/2 rounded-full'
                  style={{
                    width: 5,
                    height: 5,
                    backgroundColor: rs.baseColor,
                    boxShadow: `0 0 6px 2px ${rs.baseColor}90`,
                  }}
                />
                {/* Remove */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleRemove(placement.itemId, e)}
                  className='absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded border border-zinc-500 bg-black/90 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:border-zinc-300 hover:text-white'>
                  <X size={8} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom: handles + rubber feet */}
        <div className='mt-2.5 flex items-center justify-between px-3'>
          <div
            style={{
              width: 52,
              height: 9,
              background: "linear-gradient(180deg,#555,#2a2a2a)",
              borderRadius: 4,
              boxShadow:
                "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          />
          <div className='flex gap-6'>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 4,
                  background:
                    "radial-gradient(circle at 35% 35%,#3a3a3a,#0a0a0a)",
                  boxShadow:
                    "0 3px 5px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              />
            ))}
          </div>
          <div
            style={{
              width: 52,
              height: 9,
              background: "linear-gradient(180deg,#555,#2a2a2a)",
              borderRadius: 4,
              boxShadow:
                "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          />
        </div>
      </div>

      {/* Parked pedals: still equipped, but the board ran out of room for them. */}
      {overflowItems.length > 0 && (
        <div className='mt-4 flex flex-col gap-3 rounded bg-zinc-900/40 p-4'>
          <div className='flex flex-col gap-0.5'>
            <p className='text-[9px] font-bold capitalize tracking-[0.2em] text-amber-500/90'>
              Off the board
            </p>
            <p className='text-xs text-zinc-400'>
              No room left for{" "}
              {overflowItems.length === 1 ? "this pedal" : "these pedals"} —
              take something off the board, then tidy up to put{" "}
              {overflowItems.length === 1 ? "it" : "them"} back.
            </p>
          </div>
          <div className='flex flex-wrap gap-5'>
            {overflowItems.map((placement) => {
              const invItem = data.effectInventory.find(
                (e) => e.id === placement.itemId,
              );
              const effect = invItem
                ? EFFECTS_BY_ID.get(invItem.effectId)
                : null;
              if (!effect || !invItem) return null;

              return (
                <div
                  key={placement.itemId}
                  className='group relative'
                  onMouseMove={(e) => onHover?.(e, cardFor(placement.itemId))}
                  onMouseLeave={() => onHover?.(null, null)}
                  onClick={() => {
                    if (onShowCard) onShowCard(cardFor(placement.itemId));
                  }}>
                  <img
                    src={getEffectImageSrc(effect.imageId, "small")}
                    alt={effect.name}
                    className='h-14 w-auto object-contain opacity-60 transition-opacity group-hover:opacity-100'
                    draggable={false}
                  />
                  <button
                    onClick={(e) => handleRemove(placement.itemId, e)}
                    aria-label={`Remove ${effect.name}`}
                    className='absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded bg-black/90 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white'>
                    <X size={8} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showPicker && (
        <EffectPickerModal
          effectInventory={data.effectInventory}
          occupiedItemIds={occupiedIds}
          slotIndex={localItems.length}
          currentItemId={null}
          canFit={canFit}
          onSelect={(id) => {
            if (id) handlePickerSelect(id);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
};
