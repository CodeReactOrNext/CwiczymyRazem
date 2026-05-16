import { cn } from "assets/lib/utils";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { Trash2 } from "lucide-react";

import type { EffectInventoryItem } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

interface EffectCardProps {
  item: EffectInventoryItem;
  count: number;
  isOnPedalboard: boolean;
  onSellClick: (inventoryItemId: string, effectId: number | string) => void;
  isSelling: boolean;
}

export const EffectCard = ({ item, count, isOnPedalboard, onSellClick, isSelling }: EffectCardProps) => {
  const effect = EFFECTS_BY_ID.get(item.effectId);
  if (!effect) return null;

  const rs = RARITY_STYLES[effect.rarity];

  return (
    <div
      className="relative flex flex-col overflow-hidden cursor-default"
      style={{
        borderRadius: 4,
        background: `linear-gradient(175deg, ${rs.baseColor}18 0%, #0c0c10 35%, #0c0c10 100%)`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Rarity stripe */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${rs.baseColor}90, transparent)` }} />

      {/* Header */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[9px] font-black capitalize tracking-[0.25em] leading-none truncate" style={{ color: rs.baseColor }}>
          {effect.brand}
        </p>
        <p className="text-[12px] font-black text-white capitalize tracking-wide leading-tight truncate mt-0.5">
          {effect.name}
        </p>
        <p className="text-[8px] font-bold capitalize tracking-[0.2em] mt-0.5" style={{ color: `${rs.baseColor}80` }}>
          {effect.rarity} · {effect.type}
        </p>
      </div>

      {/* Image */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          height: 160,
          background: `radial-gradient(ellipse at 50% 60%, ${rs.baseColor}22 0%, ${rs.baseColor}05 55%, transparent 75%)`,
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${rs.baseColor}12, transparent)` }}
        />

        <img
          src={`/static/images/effects/${effect.imageId}.png`}
          alt={effect.name}
          className="relative z-10 object-contain"
          style={{ height: 140, width: 140, filter: `drop-shadow(0 8px 20px rgba(0,0,0,0.8)) drop-shadow(0 0 12px ${rs.baseColor}30)` }}
        />

        {/* LED */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full z-20"
          style={{ width: 6, height: 6, backgroundColor: rs.baseColor, boxShadow: `0 0 8px 2px ${rs.baseColor}80` }}
        />

        {/* NEW badge */}
        {item.isNew && (
          <div
            className="absolute top-2 right-2 z-20 px-1.5 py-0.5 text-[8px] font-black capitalize tracking-widest text-black"
            style={{ backgroundColor: rs.baseColor, borderRadius: 4, boxShadow: `0 0 12px ${rs.baseColor}90` }}
          >
            New
          </div>
        )}

        {/* Count */}
        {count > 1 && (
          <div className="absolute top-2 left-2 z-20 px-1.5 py-0.5 text-[9px] font-black text-zinc-300 bg-black/70 border border-zinc-700/60" style={{ borderRadius: 4 }}>
            ×{count}
          </div>
        )}
      </div>

      {/* Sell button */}
      {count === 1 && (
        <button
          onClick={() => onSellClick(item.id, item.effectId)}
          disabled={isSelling || isOnPedalboard}
          className="w-full py-2 text-[9px] font-black capitalize tracking-widest transition-all duration-200 text-red-600/70 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          style={{
            background: "transparent",
            borderTop: `1px solid ${rs.baseColor}20`,
          }}
          title={isOnPedalboard ? "Cannot sell effect on pedalboard" : undefined}
        >
          <Trash2 size={10} strokeWidth={3} />
          Sell
        </button>
      )}
    </div>
  );
};
