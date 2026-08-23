import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { AlertTriangle, LayoutGrid, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { ArsenalUserData, PedalboardPlacement } from "../../types/arsenal.types";
import { getEffectImageSrc } from "../../utils/effectImage";
import type { BoardLayout, LayoutBox } from "../../utils/pedalboardLayout";
import {
  collidesWithAny,
  createWidthResolver,
  DEFAULT_ASPECT,
  EFFECT_IMAGE_ASPECT,
  findFreeSpot,
  layoutBoard,
  PEDAL_H_PCT,
  tidyBoard,
} from "../../utils/pedalboardLayout";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { RARITY_STYLES } from "../RarityBadge";
import { EffectPickerModal } from "./EffectPickerModal";

/** How long a "no room left" message stays up next to the board controls. */
const NOTICE_MS = 8000;

const BOARD_FULL = "The board is full — take a pedal off before adding another.";

/** Says it twice: a toast you cannot miss, and a line that stays on the board. */
const announce = (message: string, setNotice: (value: string) => void) => {
  setNotice(message);
  toast.warning(message);
};

interface DragState {
  itemId: string;
  offXPct: number;
  offYPct: number;
  /** The pedal was already sitting on a neighbour when the drag started, so
   *  collisions have to be ignored until it reaches clear board again. */
  escaping: boolean;
}

interface PedalboardViewProps {
  data: ArsenalUserData;
  onUpdateItems: (items: PedalboardPlacement[]) => void;
  onHover?: (e: React.MouseEvent | null, content: React.ReactNode | null) => void;
  /** Touch-only: tapping a pedal opens its card in a modal (drag is disabled when set). */
  onShowCard?: (content: React.ReactNode) => void;
}

export const PedalboardView = ({ data, onUpdateItems, onHover, onShowCard }: PedalboardViewProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [isColliding, setIsColliding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Natural aspect ratio (w/h) per image, measured once the image loads. It
  // only ever corrects EFFECT_IMAGE_ASPECT, which already knows every shipped
  // pedal — so the board can lay itself out before a single image is decoded.
  const [aspectById, setAspectById] = useState<Record<number | string, number>>({});
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

  const [localItems, setLocalItemsState] = useState<PedalboardPlacement[]>(() =>
    Array.isArray(data.rig.pedalboardItems) ? data.rig.pedalboardItems : []
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
    [data.effectInventory, aspectById]
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
  const boardBoxes = useCallback((excludeId?: string): LayoutBox[] => {
    const overflow = overflowRef.current;
    return localItemsRef.current
      .filter(i => i.itemId !== excludeId && !overflow.includes(i.itemId))
      .map(i => ({ xPct: i.xPct, yPct: i.yPct, wPct: widthOfRef.current(i.itemId) }));
  }, []);

  /** Applies a computed layout: board positions, parked pedals and the save. */
  const applyLayout = useCallback((layout: BoardLayout, source: PedalboardPlacement[]) => {
    const byId = new Map(layout.placed.map(item => [item.itemId, item]));
    // Keep the stored order — only the positions change.
    const next = source.map(item => byId.get(item.itemId) ?? item);
    setOverflowIds(layout.overflow.map(i => i.itemId));
    setLocalItems(next);
    if (layout.changed) debouncedSave(next);
    return next;
  }, [debouncedSave]);

  // Straighten out whatever comes back from the server: pedals dropped on top
  // of each other by older builds of this board get moved to free space.
  useEffect(() => {
    if (dragging || pendingSaveRef.current) return;
    const items = Array.isArray(data.rig.pedalboardItems) ? data.rig.pedalboardItems : [];
    applyLayout(layoutBoard(items, widthOf), items);
  }, [data.rig.pedalboardItems, dragging, widthOf, applyLayout]);

  useEffect(() => {
    const timer = notice ? setTimeout(() => setNotice(null), NOTICE_MS) : null;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [notice]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const wPct = widthOfRef.current(dragging.itemId);
    const rawX = Math.max(0, Math.min(100 - wPct, ((e.clientX - rect.left) / rect.width) * 100 - dragging.offXPct));
    const rawY = Math.max(0, Math.min(100 - PEDAL_H_PCT, ((e.clientY - rect.top) / rect.height) * 100 - dragging.offYPct));

    const others = boardBoxes(dragging.itemId);
    const current = localItemsRef.current.find(i => i.itemId === dragging.itemId);
    const prevX = current?.xPct ?? rawX;
    const prevY = current?.yPct ?? rawY;

    let finalX = rawX;
    let finalY = rawY;
    const hits = (xPct: number, yPct: number) =>
      collidesWithAny({ xPct, yPct, wPct }, others);

    if (dragging.escaping) {
      // A pedal that starts out buried would be blocked in every direction, so
      // it moves freely until it finds clear board — then it is fenced in again.
      if (!hits(rawX, rawY)) setDragging({ ...dragging, escaping: false });
      setIsColliding(hits(rawX, rawY));
    } else if (hits(rawX, rawY)) {
      // Slide along whichever axis is still free, the way a pedal nudged into
      // its neighbour would.
      if (!hits(rawX, prevY)) {
        finalY = prevY;
      } else if (!hits(prevX, rawY)) {
        finalX = prevX;
      } else {
        finalX = prevX;
        finalY = prevY;
      }
      setIsColliding(true);
    } else {
      setIsColliding(false);
    }

    setLocalItems(localItemsRef.current.map(item =>
      item.itemId === dragging.itemId ? { ...item, xPct: finalX, yPct: finalY } : item
    ));
  }, [dragging, boardBoxes]);

  const handleMouseUp = useCallback(() => {
    if (!dragging) return;
    const { itemId } = dragging;
    setDragging(null);
    setIsColliding(false);

    const prev = localItemsRef.current;
    const dropped = prev.find(i => i.itemId === itemId);
    const wPct = widthOfRef.current(itemId);
    const others = boardBoxes(itemId);
    let next = prev;

    // Only reachable after an escaping drag — put the pedal somewhere it can
    // actually stay rather than leaving it on top of another one.
    if (dropped && collidesWithAny({ xPct: dropped.xPct, yPct: dropped.yPct, wPct }, others)) {
      const spot = findFreeSpot(others, wPct);
      if (spot) {
        next = prev.map(item => (item.itemId === itemId ? { ...item, ...spot } : item));
      } else {
        setOverflowIds(ids => (ids.includes(itemId) ? ids : [...ids, itemId]));
        announce(BOARD_FULL, setNotice);
      }
    }

    setLocalItems(next);
    debouncedSave(next);
  }, [dragging, debouncedSave, boardBoxes]);

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

  const handlePedalMouseDown = (e: React.MouseEvent, item: PedalboardPlacement) => {
    // On touch devices we open the card on tap instead of dragging.
    if (onShowCard) return;
    e.preventDefault();
    onHover?.(null, null);
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const curXPct = ((e.clientX - rect.left) / rect.width) * 100;
    const curYPct = ((e.clientY - rect.top) / rect.height) * 100;
    const wPct = widthOf(item.itemId);
    setDragging({
      itemId: item.itemId,
      offXPct: curXPct - item.xPct,
      offYPct: curYPct - item.yPct,
      escaping: collidesWithAny(
        { xPct: item.xPct, yPct: item.yPct, wPct },
        boardBoxes(item.itemId)
      ),
    });
  };

  const handleRemove = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const remaining = localItems.filter(i => i.itemId !== itemId);
    // Taking a pedal off can free the room a parked one was waiting for.
    debouncedSave(applyLayout(layoutBoard(remaining, widthOf), remaining));
  };

  const handlePickerSelect = (inventoryItemId: string | null) => {
    if (!inventoryItemId || localItems.some(i => i.itemId === inventoryItemId)) return;
    const spot = findFreeSpot(boardBoxes(), widthOf(inventoryItemId));
    if (!spot) {
      announce(BOARD_FULL, setNotice);
      return;
    }
    const next = [...localItems, { itemId: inventoryItemId, ...spot }];
    setLocalItems(next);
    debouncedSave(next);
  };

  const handleTidy = () => {
    const layout = tidyBoard(localItems, widthOf);
    applyLayout(layout, localItems);
    if (layout.overflow.length > 0) {
      const count = layout.overflow.length;
      announce(
        `No room for ${count} pedal${count > 1 ? "s" : ""} — ${count > 1 ? "they are" : "it is"} parked below the board.`,
        setNotice
      );
    } else {
      setNotice(null);
    }
  };

  const cardFor = (itemId: string) => {
    const invItem = data.effectInventory.find(e => e.id === itemId);
    return invItem ? <EffectCard item={invItem} readOnly /> : null;
  };

  const occupiedIds = localItems.map(i => i.itemId);
  const boardItems = localItems.filter(i => !overflowIds.includes(i.itemId));
  const overflowItems = localItems.filter(i => overflowIds.includes(i.itemId));

  // Lets the picker grey out pedals the board has no space for, so a full
  // board is visible before anything is clicked.
  const occupancy = boardItems.map(i => ({
    xPct: i.xPct,
    yPct: i.yPct,
    wPct: widthOf(i.itemId),
  }));
  const canFit = (itemId: string) =>
    findFreeSpot(occupancy, widthOf(itemId)) !== null;

  return (
    <>
      {/* Board controls live off the surface so they never sit under a pedal. */}
      <div className="mb-3 flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
        {notice && (
          <p className="mr-auto flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
            <AlertTriangle size={13} strokeWidth={2.5} className="shrink-0" />
            {notice}
          </p>
        )}
        {boardItems.length > 1 && (
          <button
            onClick={handleTidy}
            className="flex items-center gap-1.5 rounded bg-zinc-800/60 px-3 py-1.5 text-[9px] font-black capitalize tracking-[0.2em] text-zinc-400 transition-colors hover:bg-zinc-700/70 hover:text-white"
            title="Line every pedal up in rows"
          >
            <LayoutGrid size={10} strokeWidth={2.5} />
            Tidy Up
          </button>
        )}
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 rounded bg-zinc-800/60 px-3 py-1.5 text-[9px] font-black capitalize tracking-[0.2em] text-zinc-300 transition-colors hover:bg-zinc-700/70 hover:text-white"
        >
          <Plus size={10} strokeWidth={2.5} />
          Add Pedal
        </button>
      </div>

      {/* Case outer shell */}
      <div
        className="relative w-full select-none"
        style={{
          background: "linear-gradient(160deg, #2e2e2e 0%, #1c1c1c 50%, #222 100%)",
          borderRadius: 4,
          padding: "10px 14px 14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
          border: "2px solid #383838",
        }}
      >
        {/* Top bar: latches + label */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex gap-2">
            {[0,1].map(i => (
              <div key={i} style={{ width: 32, height: 11, background: "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)", borderRadius: 4, boxShadow: "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)" }} />
            ))}
          </div>
          <span className="text-[8px] font-black capitalize tracking-[0.35em] text-zinc-600">Pedalboard</span>
          <div className="flex gap-2">
            {[0,1].map(i => (
              <div key={i} style={{ width: 32, height: 11, background: "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)", borderRadius: 4, boxShadow: "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)" }} />
            ))}
          </div>
        </div>

        {/* Board surface — perforated */}
        <div
          ref={boardRef}
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "16 / 7",
            borderRadius: 4,
            backgroundImage: "radial-gradient(circle, #272727 1.4px, transparent 1.4px)",
            backgroundSize: "9px 9px",
            backgroundColor: "#141414",
            boxShadow: "inset 0 4px 16px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.02)",
            cursor: dragging ? "grabbing" : "default",
          }}
        >
          {/* Amp jack — top left */}
          <div className="absolute top-2 left-3 flex flex-col items-center gap-0.5 z-10 pointer-events-none">
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#111", border: "2px solid #92400e", boxShadow: "0 0 8px rgba(146,64,14,0.5)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#b45309", margin: "2.5px auto" }} />
            </div>
            <span style={{ fontSize: 6, letterSpacing: "0.2em", fontWeight: 900, textTransform: "capitalize", color: "#78350f" }}>Amp</span>
          </div>

          {/* Instr jack — bottom right */}
          <div className="absolute bottom-2 right-3 flex flex-col items-center gap-0.5 z-10 pointer-events-none">
            <span style={{ fontSize: 6, letterSpacing: "0.2em", fontWeight: 900, textTransform: "capitalize", color: "#78350f" }}>Instr</span>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#111", border: "2px solid #92400e", boxShadow: "0 0 8px rgba(146,64,14,0.5)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#b45309", margin: "2.5px auto" }} />
            </div>
          </div>

          {/* Pedals */}
          {boardItems.map((placement) => {
            const invItem = data.effectInventory.find(e => e.id === placement.itemId);
            const effect = invItem ? EFFECTS_BY_ID.get(invItem.effectId) : null;
            const rs = effect ? RARITY_STYLES[effect.rarity] : null;
            if (!effect || !rs) return null;
            const isDragging = dragging?.itemId === placement.itemId;
            const showCollision = isDragging && isColliding;
            const wPct = widthOf(placement.itemId);

            return (
              <div
                key={placement.itemId}
                onMouseDown={(e) => handlePedalMouseDown(e, placement)}
                onMouseMove={(e) => { if (!dragging && invItem) onHover?.(e, <EffectCard item={invItem} readOnly />); }}
                onMouseLeave={() => onHover?.(null, null)}
                onClick={() => { if (onShowCard && invItem) onShowCard(<EffectCard item={invItem} readOnly />); }}
                className="absolute group"
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
                  transform: isDragging ? "scale(1.07) translateY(-6px)" : "scale(1)",
                  transition: isDragging ? "none" : "filter 0.15s, transform 0.15s",
                }}
              >
                <img
                  src={getEffectImageSrc(effect.imageId, "full")}
                  alt={effect.name}
                  className="w-full h-full object-contain"
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (!img.naturalWidth || !img.naturalHeight) return;
                    const ar = img.naturalWidth / img.naturalHeight;
                    const known = EFFECT_IMAGE_ASPECT[effect.imageId] ?? DEFAULT_ASPECT;
                    // Only worth remembering when the image is not what the
                    // layout table already assumes.
                    if (Math.abs(known - ar) < 0.005) return;
                    setAspectById((prev) =>
                      prev[effect.imageId] === ar
                        ? prev
                        : { ...prev, [effect.imageId]: ar }
                    );
                  }}
                />
                {/* LED indicator */}
                <div
                  className="absolute bottom-[10%] left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 5, height: 5, backgroundColor: rs.baseColor, boxShadow: `0 0 6px 2px ${rs.baseColor}90` }}
                />
                {/* Remove */}
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => handleRemove(placement.itemId, e)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded bg-black/90 border border-zinc-500 flex items-center justify-center text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-white hover:border-zinc-300 transition-opacity z-10"
                >
                  <X size={8} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom: handles + rubber feet */}
        <div className="flex items-center justify-between mt-2.5 px-3">
          <div style={{ width: 52, height: 9, background: "linear-gradient(180deg,#555,#2a2a2a)", borderRadius: 4, boxShadow: "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)" }} />
          <div className="flex gap-6">
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: 4, background: "radial-gradient(circle at 35% 35%,#3a3a3a,#0a0a0a)", boxShadow: "0 3px 5px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)" }} />
            ))}
          </div>
          <div style={{ width: 52, height: 9, background: "linear-gradient(180deg,#555,#2a2a2a)", borderRadius: 4, boxShadow: "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)" }} />
        </div>
      </div>

      {/* Parked pedals: still equipped, but the board ran out of room for them. */}
      {overflowItems.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded bg-zinc-900/40 p-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] font-bold capitalize tracking-[0.2em] text-amber-500/90">Off the board</p>
            <p className="text-xs text-zinc-400">
              No room left for {overflowItems.length === 1 ? "this pedal" : "these pedals"} — take something off the board, then tidy up to put {overflowItems.length === 1 ? "it" : "them"} back.
            </p>
          </div>
          <div className="flex flex-wrap gap-5">
            {overflowItems.map((placement) => {
              const invItem = data.effectInventory.find(e => e.id === placement.itemId);
              const effect = invItem ? EFFECTS_BY_ID.get(invItem.effectId) : null;
              if (!effect || !invItem) return null;

              return (
                <div
                  key={placement.itemId}
                  className="group relative"
                  onMouseMove={(e) => onHover?.(e, cardFor(placement.itemId))}
                  onMouseLeave={() => onHover?.(null, null)}
                  onClick={() => { if (onShowCard) onShowCard(cardFor(placement.itemId)); }}
                >
                  <img
                    src={getEffectImageSrc(effect.imageId, "small")}
                    alt={effect.name}
                    className="h-14 w-auto object-contain opacity-60 transition-opacity group-hover:opacity-100"
                    draggable={false}
                  />
                  <button
                    onClick={e => handleRemove(placement.itemId, e)}
                    aria-label={`Remove ${effect.name}`}
                    className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded bg-black/90 text-zinc-300 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                  >
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
          onSelect={(id) => { if (id) handlePickerSelect(id); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
};
