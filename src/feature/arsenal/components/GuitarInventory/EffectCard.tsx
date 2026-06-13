import { cn } from "assets/lib/utils";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { Trash2 } from "lucide-react";

const NOISE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`;

import type { EffectInventoryItem } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

interface EffectCardProps {
  item: EffectInventoryItem;
  sellItemId: string | null;
  count: number;
  isOnPedalboard: boolean;
  onSellClick: (inventoryItemId: string, effectId: number | string) => void;
  isSelling: boolean;
}

export const EffectCard = ({ item, sellItemId, count, isOnPedalboard, onSellClick, isSelling }: EffectCardProps) => {
  const effect = EFFECTS_BY_ID.get(item.effectId);
  if (!effect) return null;

  const rs = RARITY_STYLES[effect.rarity];

  return (
    <div
      className="group relative flex flex-col h-full overflow-hidden"
      style={{
        borderRadius: 10,
        background: `linear-gradient(160deg, ${rs.baseColor}35 0%, #111116 55%)`,
        border: `1px solid ${rs.baseColor}28`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        contain: "layout style paint",
      }}
    >
      {/* Grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ backgroundImage: NOISE_BG, backgroundSize: "180px 180px", opacity: 0.035, mixBlendMode: "overlay" }}
      />

      {/* Rarity top stripe */}
      <div
        className="h-[2px] w-full flex-shrink-0"
        style={{ background: `linear-gradient(90deg, transparent, ${rs.baseColor}, transparent)` }}
      />

      {/* Brand + Name + Rarity */}
      <div className="px-3 pt-3 pb-1.5 flex-shrink-0">
        <p
          className="text-[10px] font-semibold tracking-wider uppercase leading-none"
          style={{ color: rs.baseColor }}
        >
          {effect.brand}
        </p>
        <p className="text-[16px] font-extrabold text-white leading-tight truncate mt-1">
          {effect.name}
        </p>
        <p
          className="text-[9px] font-medium tracking-[0.15em] mt-0.5 capitalize"
          style={{ color: rs.baseColor, opacity: 0.7 }}
        >
          {effect.rarity} · {effect.type}
        </p>
      </div>

      {/* Effect image */}
      <div
        className="relative flex items-center justify-center flex-1 overflow-hidden py-4"
        style={{ minHeight: 200 }}
      >
        {item.isNew && (
          <div
            className="absolute top-2 left-2 z-20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-black"
            style={{ backgroundColor: rs.baseColor, borderRadius: 3 }}
          >
            New
          </div>
        )}

        {count > 1 && (
          <div
            className={cn("absolute z-20 px-1.5 py-0.5 text-[9px] font-black text-zinc-300 bg-black/70 border border-zinc-700/60", item.isNew ? "top-2 right-2" : "top-2 left-2")}
            style={{ borderRadius: 3 }}
          >
            ×{count}
          </div>
        )}

        <img
          src={`/static/images/effects/${effect.imageId}.png`}
          alt={effect.name}
          className="relative z-10 object-contain"
          style={{
            height: 160,
            width: 160,
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.2))",
          }}
        />

        {/* LED */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full z-20"
          style={{ width: 6, height: 6, backgroundColor: rs.baseColor, boxShadow: `0 0 8px 2px ${rs.baseColor}80` }}
        />

        {isOnPedalboard && (
          <div className="absolute bottom-2 left-3 z-20 flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: rs.baseColor, boxShadow: `0 0 8px ${rs.baseColor}` }}
            />
            <span className="text-[8px] font-medium tracking-wide" style={{ color: `${rs.baseColor}B3` }}>on board</span>
          </div>
        )}
      </div>

      {/* Sell */}
      <div
        className="flex border-t flex-shrink-0"
        style={{ borderColor: `${rs.baseColor}20`, background: "rgba(0,0,0,0.35)" }}
      >
        <button
          onClick={() => sellItemId && onSellClick(sellItemId, item.effectId)}
          disabled={isSelling || !sellItemId}
          className="flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 text-zinc-600 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed"
          title={count === 1 && isOnPedalboard ? "Cannot sell effect on pedalboard" : undefined}
        >
          <Trash2 size={9} strokeWidth={2.5} />
          Sell
        </button>
      </div>
    </div>
  );
};
