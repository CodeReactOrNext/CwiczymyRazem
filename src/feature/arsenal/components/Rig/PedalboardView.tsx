import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { RARITY_STYLES } from "../RarityBadge";
import { EffectPickerModal } from "./EffectPickerModal";
import type { ArsenalUserData, PedalboardPlacement } from "../../types/arsenal.types";

const PEDAL_W_PCT = 16;
const PEDAL_H_PCT = 42;

const DEFAULT_POSITIONS = [
  { xPct: 5,  yPct: 8  },
  { xPct: 28, yPct: 8  },
  { xPct: 51, yPct: 8  },
  { xPct: 5,  yPct: 52 },
  { xPct: 28, yPct: 52 },
  { xPct: 51, yPct: 52 },
];


interface DragState {
  itemId: string;
  offXPct: number;
  offYPct: number;
}

interface PedalboardViewProps {
  data: ArsenalUserData;
  onUpdateItems: (items: PedalboardPlacement[]) => void;
}

export const PedalboardView = ({ data, onUpdateItems }: PedalboardViewProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [isColliding, setIsColliding] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);
  const onUpdateItemsRef = useRef(onUpdateItems);
  onUpdateItemsRef.current = onUpdateItems;

  const debouncedSave = useCallback((items: PedalboardPlacement[]) => {
    pendingSaveRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      pendingSaveRef.current = false;
      onUpdateItemsRef.current(items);
    }, 600);
  }, []);

  const localItemsRef = useRef<PedalboardPlacement[]>(
    Array.isArray(data.rig.pedalboardItems) ? data.rig.pedalboardItems : []
  );
  const [localItems, setLocalItemsState] = useState<PedalboardPlacement[]>(localItemsRef.current);

  const setLocalItems = (updater: PedalboardPlacement[] | ((prev: PedalboardPlacement[]) => PedalboardPlacement[])) => {
    setLocalItemsState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localItemsRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    if (!dragging && !pendingSaveRef.current) {
      const items = Array.isArray(data.rig.pedalboardItems) ? data.rig.pedalboardItems : [];
      localItemsRef.current = items;
      setLocalItemsState(items);
    }
  }, [data.rig.pedalboardItems, dragging]);

  const checkCollision = (xPct: number, yPct: number, excludeId: string): boolean => {
    return localItemsRef.current.some(item => {
      if (item.itemId === excludeId) return false;
      return (
        xPct < item.xPct + PEDAL_W_PCT &&
        xPct + PEDAL_W_PCT > item.xPct &&
        yPct < item.yPct + PEDAL_H_PCT &&
        yPct + PEDAL_H_PCT > item.yPct
      );
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const rawX = Math.max(0, Math.min(100 - PEDAL_W_PCT, ((e.clientX - rect.left) / rect.width) * 100 - dragging.offXPct));
    const rawY = Math.max(0, Math.min(100 - PEDAL_H_PCT, ((e.clientY - rect.top) / rect.height) * 100 - dragging.offYPct));

    const current = localItemsRef.current.find(i => i.itemId === dragging.itemId);
    const prevX = current?.xPct ?? rawX;
    const prevY = current?.yPct ?? rawY;

    let finalX = rawX;
    let finalY = rawY;

    if (checkCollision(rawX, rawY, dragging.itemId)) {
      // Try sliding on X axis only
      if (!checkCollision(rawX, prevY, dragging.itemId)) {
        finalX = rawX;
        finalY = prevY;
      // Try sliding on Y axis only
      } else if (!checkCollision(prevX, rawY, dragging.itemId)) {
        finalX = prevX;
        finalY = rawY;
      // Full block — keep previous position
      } else {
        finalX = prevX;
        finalY = prevY;
      }
      setIsColliding(true);
    } else {
      setIsColliding(false);
    }

    setLocalItems(prev => prev.map(item =>
      item.itemId === dragging.itemId ? { ...item, xPct: finalX, yPct: finalY } : item
    ));
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    if (!dragging) return;
    setDragging(null);
    setIsColliding(false);
    setLocalItems(prev => {
      debouncedSave(prev);
      return prev;
    });
  }, [dragging, debouncedSave]);

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
    e.preventDefault();
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const curXPct = ((e.clientX - rect.left) / rect.width) * 100;
    const curYPct = ((e.clientY - rect.top) / rect.height) * 100;
    setDragging({ itemId: item.itemId, offXPct: curXPct - item.xPct, offYPct: curYPct - item.yPct });
  };

  const handleRemove = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = localItems.filter(i => i.itemId !== itemId);
    setLocalItems(next);
    debouncedSave(next);
  };

  const handlePickerSelect = (inventoryItemId: string | null) => {
    if (!inventoryItemId || localItems.some(i => i.itemId === inventoryItemId)) return;
    const pos = DEFAULT_POSITIONS[localItems.length % DEFAULT_POSITIONS.length];
    const next = [...localItems, { itemId: inventoryItemId, xPct: pos.xPct, yPct: pos.yPct }];
    setLocalItems(next);
    debouncedSave(next);
  };

  const occupiedIds = localItems.map(i => i.itemId);

  return (
    <>
      {/* Case outer shell */}
      <div
        className="relative w-full select-none"
        style={{
          background: "linear-gradient(160deg, #2e2e2e 0%, #1c1c1c 50%, #222 100%)",
          borderRadius: 12,
          padding: "10px 14px 14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
          border: "2px solid #383838",
        }}
      >
        {/* Top bar: latches + label */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex gap-2">
            {[0,1].map(i => (
              <div key={i} style={{ width: 32, height: 11, background: "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)", borderRadius: 3, boxShadow: "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)" }} />
            ))}
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.35em] text-zinc-600">Pedalboard</span>
          <div className="flex gap-2">
            {[0,1].map(i => (
              <div key={i} style={{ width: 32, height: 11, background: "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)", borderRadius: 3, boxShadow: "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)" }} />
            ))}
          </div>
        </div>

        {/* Board surface — perforated */}
        <div
          ref={boardRef}
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "16 / 7",
            borderRadius: 6,
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
            <span style={{ fontSize: 6, letterSpacing: "0.2em", fontWeight: 900, textTransform: "uppercase", color: "#78350f" }}>Amp</span>
          </div>

          {/* Instr jack — bottom right */}
          <div className="absolute bottom-2 right-3 flex flex-col items-center gap-0.5 z-10 pointer-events-none">
            <span style={{ fontSize: 6, letterSpacing: "0.2em", fontWeight: 900, textTransform: "uppercase", color: "#78350f" }}>Instr</span>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#111", border: "2px solid #92400e", boxShadow: "0 0 8px rgba(146,64,14,0.5)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#b45309", margin: "2.5px auto" }} />
            </div>
          </div>

          {/* Pedals */}
          {localItems.map((placement) => {
            const invItem = data.effectInventory.find(e => e.id === placement.itemId);
            const effect = invItem ? EFFECTS_BY_ID.get(invItem.effectId) : null;
            const rs = effect ? RARITY_STYLES[effect.rarity] : null;
            if (!effect || !rs) return null;
            const isDragging = dragging?.itemId === placement.itemId;
            const showCollision = isDragging && isColliding;

            return (
              <div
                key={placement.itemId}
                onMouseDown={(e) => handlePedalMouseDown(e, placement)}
                className="absolute group"
                style={{
                  left: `${placement.xPct}%`,
                  top: `${placement.yPct}%`,
                  width: `${PEDAL_W_PCT}%`,
                  height: `${PEDAL_H_PCT}%`,
                  zIndex: isDragging ? 50 : 2,
                  cursor: isDragging ? "grabbing" : "grab",
                  filter: showCollision
                    ? `drop-shadow(0 14px 28px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(220,38,38,0.9))`
                    : isDragging
                    ? `drop-shadow(0 14px 28px rgba(0,0,0,0.95)) drop-shadow(0 0 14px ${rs.baseColor}70)`
                    : `drop-shadow(0 5px 10px rgba(0,0,0,0.85))`,
                  transform: isDragging ? "scale(1.07) translateY(-5px)" : "scale(1)",
                  transition: isDragging ? "none" : "filter 0.15s, transform 0.15s",
                }}
              >
                <img
                  src={`/static/images/effects/${effect.imageId}.png`}
                  alt={effect.name}
                  className="w-full h-full object-contain"
                  draggable={false}
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
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/90 border border-zinc-500 flex items-center justify-center text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-white hover:border-zinc-300 transition-opacity z-10"
                >
                  <X size={8} />
                </button>
              </div>
            );
          })}

          {/* Add pedal button */}
          <button
            onClick={() => setShowPicker(true)}
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-sm border border-dashed border-zinc-700 text-zinc-700 hover:text-zinc-400 hover:border-zinc-500 transition-colors z-10"
            style={{ fontSize: 8 }}
          >
            <Plus size={9} strokeWidth={2.5} />
            <span className="font-black uppercase tracking-[0.2em]">Add Pedal</span>
          </button>
        </div>

        {/* Bottom: handles + rubber feet */}
        <div className="flex items-center justify-between mt-2.5 px-3">
          <div style={{ width: 52, height: 9, background: "linear-gradient(180deg,#555,#2a2a2a)", borderRadius: 4, boxShadow: "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)" }} />
          <div className="flex gap-6">
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%,#3a3a3a,#0a0a0a)", boxShadow: "0 3px 5px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)" }} />
            ))}
          </div>
          <div style={{ width: 52, height: 9, background: "linear-gradient(180deg,#555,#2a2a2a)", borderRadius: 4, boxShadow: "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)" }} />
        </div>
      </div>

      {showPicker && (
        <EffectPickerModal
          effectInventory={data.effectInventory}
          occupiedItemIds={occupiedIds}
          slotIndex={localItems.length}
          currentItemId={null}
          onSelect={(id) => { if (id) handlePickerSelect(id); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
};
