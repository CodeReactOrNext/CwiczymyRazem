import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import type {
  ArsenalUserData,
  InventoryItem,
  PedalboardPlacement,
} from "feature/arsenal/types/arsenal.types";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "utils/firebase/client/firebase.utils";

const PEDAL_W_PCT = 16;
const PEDAL_H_PCT = 42;

interface TooltipData {
  x: number;
  y: number;
  content: React.ReactNode;
}

const RpgTooltip = ({ tooltip }: { tooltip: TooltipData }) => (
  <div
    className="pointer-events-none fixed z-[9999]"
    style={{ left: tooltip.x + 14, top: tooltip.y - 8 }}
  >
    <div
      style={{
        background: "linear-gradient(160deg, #1a1a2e 0%, #0f0f1a 100%)",
        border: "1px solid #333",
        borderRadius: 8,
        padding: "10px 14px",
        minWidth: 160,
        maxWidth: 220,
        boxShadow: "0 8px 32px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {tooltip.content}
    </div>
  </div>
);

interface GuitarSlotReadonlyProps {
  item: InventoryItem | null;
  slotIndex: number;
  onHover: (e: React.MouseEvent, data: TooltipData | null) => void;
}

const GuitarSlotReadonly = ({ item, slotIndex, onHover }: GuitarSlotReadonlyProps) => {
  const guitar = item ? GUITARS_BY_ID.get(item.guitarId) : null;
  const rs = guitar ? RARITY_STYLES[guitar.rarity] : null;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!guitar || !item || !rs) return;
    onHover(e, {
      x: e.clientX,
      y: e.clientY,
      content: (
        <div style={{ minWidth: 240 }}>
          {/* Rarity bar */}
          <div className="h-1 w-full mb-3 rounded-full" style={{ background: `linear-gradient(90deg, ${rs.baseColor}, transparent)` }} />
          {/* Name block */}
          <div className="mb-3">
            <div className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: rs.baseColor }}>
              {guitar.rarity} · {guitar.brand}
            </div>
            <div className="text-2xl font-bold text-white leading-tight">
              {guitar.name}
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-3 border-t" style={{ borderColor: `${rs.baseColor}25` }}>
            {item.year && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Year</div>
                <div className="text-base font-semibold text-zinc-100">{item.year}</div>
              </div>
            )}
            {item.country && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Origin</div>
                <div className="text-base font-semibold text-zinc-100">{item.country}</div>
              </div>
            )}
          </div>
        </div>
      ),
    });
  };

  if (!guitar || !rs) {
    return (
      <div
        className="relative flex flex-col items-center justify-center rounded-md"
        style={{
          height: 320,
          border: "1px dashed #2a2a2a",
          background: "#0c0c10",
        }}
      >
        <span className="text-[9px] uppercase tracking-widest text-zinc-700 font-black">Slot {slotIndex + 1}</span>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-md cursor-default select-none"
      style={{
        height: 320,
        background: `linear-gradient(175deg, ${rs.baseColor}18 0%, #0c0c10 35%, #0c0c10 100%)`,
        border: `1px solid ${rs.baseColor}28`,
        borderBottom: `3px solid ${rs.baseColor}`,
        boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHover(null as any, null)}
    >
      {/* Rarity stripe */}
      <div className="h-[3px] w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${rs.baseColor}90, transparent)` }} />

      {/* Header */}
      <div className="px-3 pt-3 pb-0 flex flex-col gap-0.5">
        <p className="text-xs font-semibold tracking-wide leading-none truncate" style={{ color: rs.baseColor }}>
          {guitar.brand}
        </p>
        <p className="text-xl font-bold text-white leading-tight truncate">
          {guitar.name}
        </p>
      </div>

      {/* Image */}
      <div
        className="relative flex items-center justify-center flex-1 overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${rs.baseColor}20 0%, transparent 70%)`,
        }}
      >
        <img
          src={`/static/images/rank/${guitar.imageId}.png`}
          alt={guitar.name}
          className="object-contain -rotate-90"
          style={{ height: "85%", width: "85%", maxHeight: 110 }}
        />
      </div>
    </div>
  );
};

interface PedalReadonlyProps {
  placement: PedalboardPlacement;
  effectInventory: ArsenalUserData["effectInventory"];
  onHover: (e: React.MouseEvent, data: TooltipData | null) => void;
}

const PedalReadonly = ({ placement, effectInventory, onHover }: PedalReadonlyProps) => {
  const invItem = effectInventory.find((e) => e.id === placement.itemId);
  const effect = invItem ? EFFECTS_BY_ID.get(invItem.effectId) : null;
  const rs = effect ? RARITY_STYLES[effect.rarity] : null;
  if (!effect || !rs) return null;

  const handleMouseMove = (e: React.MouseEvent) => {
    onHover(e, {
      x: e.clientX,
      y: e.clientY,
      content: (
        <div className="space-y-1.5">
          <div className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: rs.baseColor }}>
            {effect.rarity}
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: rs.baseColor }}>
              {effect.brand}
            </div>
            <div className="text-sm font-black text-white uppercase tracking-wide leading-tight">
              {effect.name}
            </div>
          </div>
          <div className="pt-1 border-t" style={{ borderColor: `${rs.baseColor}30` }}>
            <div className="text-[7px] uppercase tracking-widest text-zinc-600">Type</div>
            <div className="text-[10px] font-bold text-zinc-300">{effect.type}</div>
          </div>
        </div>
      ),
    });
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${placement.xPct}%`,
        top: `${placement.yPct}%`,
        width: `${PEDAL_W_PCT}%`,
        height: `${PEDAL_H_PCT}%`,
        filter: `drop-shadow(0 5px 10px rgba(0,0,0,0.85))`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHover(null as any, null)}
    >
      <img
        src={`/static/images/effects/${effect.imageId}.png`}
        alt={effect.name}
        className="w-full h-full object-contain"
        draggable={false}
      />
      <div
        className="absolute bottom-[10%] left-1/2 -translate-x-1/2 rounded-full"
        style={{ width: 5, height: 5, backgroundColor: rs.baseColor, boxShadow: `0 0 6px 2px ${rs.baseColor}90` }}
      />
    </div>
  );
};

interface ProfileArsenalProps {
  userAuth: string;
}

export const ProfileArsenal = ({ userAuth }: ProfileArsenalProps) => {
  const [arsenal, setArsenal] = useState<ArsenalUserData | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    getDoc(doc(db, "users", userAuth)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.arsenal) setArsenal(data.arsenal as ArsenalUserData);
      }
    });
  }, [userAuth]);

  if (!arsenal) return null;

  const { rig, inventory, effectInventory } = arsenal;
  const hasPedals = (rig?.pedalboardItems?.length ?? 0) > 0;
  const hasGuitars = rig?.guitarSlots?.some(Boolean) ?? false;
  if (!hasPedals && !hasGuitars) return null;

  const guitarItems: (InventoryItem | null)[] = ([null, null, null] as (string | null)[])
    .map((_, i) => rig?.guitarSlots?.[i] ?? null)
    .map((slotId) => (slotId ? (inventory?.find((item) => item.id === slotId) ?? null) : null));

  const handleTooltip = (_e: React.MouseEvent, data: TooltipData | null) => {
    setTooltip(data);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip) {
      setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/30 p-6" onMouseMove={handleMouseMove}>
      <h2 className="mb-6 text-2xl font-bold text-white">Rig</h2>

      {/* Guitar Slots */}
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-3">Guitars</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {guitarItems.map((item, i) => (
            <GuitarSlotReadonly key={i} item={item} slotIndex={i} onHover={handleTooltip} />
          ))}
        </div>
      </div>

      {/* Pedalboard */}
      {hasPedals && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-3">Pedalboard</p>
          <div
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
                {[0, 1].map((i) => (
                  <div key={i} style={{ width: 32, height: 11, background: "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)", borderRadius: 3, boxShadow: "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)" }} />
                ))}
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.35em] text-zinc-600">Pedalboard</span>
              <div className="flex gap-2">
                {[0, 1].map((i) => (
                  <div key={i} style={{ width: 32, height: 11, background: "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)", borderRadius: 3, boxShadow: "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)" }} />
                ))}
              </div>
            </div>

            {/* Board surface */}
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "16 / 7",
                borderRadius: 6,
                backgroundImage: "radial-gradient(circle, #272727 1.4px, transparent 1.4px)",
                backgroundSize: "9px 9px",
                backgroundColor: "#141414",
                boxShadow: "inset 0 4px 16px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.02)",
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
              {(rig.pedalboardItems ?? []).map((placement) => (
                <PedalReadonly
                  key={placement.itemId}
                  placement={placement}
                  effectInventory={effectInventory ?? []}
                  onHover={handleTooltip}
                />
              ))}
            </div>

            {/* Bottom handles */}
            <div className="flex items-center justify-between mt-2.5 px-3">
              <div style={{ width: 52, height: 9, background: "linear-gradient(180deg,#555,#2a2a2a)", borderRadius: 4, boxShadow: "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)" }} />
              <div className="flex gap-6">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%,#3a3a3a,#0a0a0a)", boxShadow: "0 3px 5px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)" }} />
                ))}
              </div>
              <div style={{ width: 52, height: 9, background: "linear-gradient(180deg,#555,#2a2a2a)", borderRadius: 4, boxShadow: "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)" }} />
            </div>
          </div>
        </div>
      )}

      {tooltip && <RpgTooltip tooltip={tooltip} />}
    </div>
  );
};
