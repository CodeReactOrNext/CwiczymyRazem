import { cn } from "assets/lib/utils";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { Check } from "lucide-react";

import type { InventoryItem } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

interface GuitarCardProps {
  item: InventoryItem;
  isEquipped: boolean;
  onEquip: (guitarId: number | string, year?: number, country?: string) => void;
  isEquipping: boolean;
}

export const GuitarCard = ({ item, isEquipped, onEquip, isEquipping }: GuitarCardProps) => {
  const guitar = GUITARS_BY_ID.get(item.guitarId);
  if (!guitar) return null;

  const rs = RARITY_STYLES[guitar.rarity];

  return (
    <div
      className={cn(
        "group relative flex flex-col h-full overflow-hidden cursor-default",
        isEquipped && "ring-2 ring-amber-400/60"
      )}
      style={{
        borderRadius: 6,
        background: `linear-gradient(175deg, ${rs.baseColor}18 0%, #0c0c10 35%, #0c0c10 100%)`,
        border: `1px solid ${rs.baseColor}28`,
        borderBottom: `3px solid ${rs.baseColor}`,
        boxShadow: isEquipped
          ? `0 0 24px rgba(251,191,36,0.25), inset 0 0 0 1px rgba(251,191,36,0.1)`
          : `0 8px 32px rgba(0,0,0,0.6), 0 0 0 0 transparent`,
      }}
    >
      {/* Rarity stripe top */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${rs.baseColor}90, transparent)` }} />

      {/* Header */}
      <div className="px-3 pt-2 pb-1.5 flex flex-col gap-0">
        <p className="text-[9px] font-semibold tracking-wide leading-none truncate" style={{ color: rs.baseColor }}>
          {guitar.brand}
        </p>
        <p className="text-[15px] font-bold text-white leading-tight truncate mt-0.5">
          {guitar.name}
        </p>
        <p className="text-[8px] font-medium tracking-[0.2em] mt-0.5 uppercase" style={{ color: `${rs.baseColor}80` }}>
          {guitar.rarity}
        </p>
      </div>

      {/* Image */}
      <div
        className="relative flex items-center justify-center overflow-hidden flex-1"
        style={{
          minHeight: 220,
          background: `radial-gradient(ellipse at 50% 60%, ${rs.baseColor}28 0%, ${rs.baseColor}06 50%, transparent 75%)`,
        }}
      >
        {/* Scan line */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${rs.baseColor}14, transparent)` }}
        />

        <img
          src={`/static/images/rank/${guitar.imageId}.png`}
          alt={guitar.name}
          className="relative z-10 object-contain -rotate-90"
          style={{
            height: 240,
            width: 240,
            WebkitMaskImage: "radial-gradient(ellipse 55% 88% at 50% 50%, black 55%, transparent 100%)",
            maskImage: "radial-gradient(ellipse 55% 88% at 50% 50%, black 55%, transparent 100%)",
          }}
        />

        {/* Badges */}
        {item.isNew && (
          <div
            className="absolute top-2 right-2 z-20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-black"
            style={{ backgroundColor: rs.baseColor, borderRadius: 3, boxShadow: `0 0 12px ${rs.baseColor}90` }}
          >
            NEW
          </div>
        )}
        {/* Equip indicator dot */}
        {isEquipped && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ boxShadow: "0 0 6px rgba(251,191,36,0.9)" }} />
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-stretch border-t" style={{ borderColor: `${rs.baseColor}20` }}>
        {item.year && (
          <div className="flex-1 flex items-center justify-center py-1.5 border-r" style={{ borderColor: `${rs.baseColor}20` }}>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{item.year}</span>
          </div>
        )}
        {item.country && (
          <div className="flex-1 flex items-center justify-center py-1.5">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest truncate px-1">{item.country}</span>
          </div>
        )}
      </div>

      {/* Equip button */}
      <button
        onClick={() => onEquip(guitar.id, item.year, item.country)}
        disabled={isEquipped || isEquipping}
        className={cn(
          "w-full py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-200 border-t flex items-center justify-center gap-1.5",
          isEquipped
            ? "text-amber-400 cursor-default"
            : "text-zinc-600 hover:text-white disabled:opacity-40"
        )}
        style={{
          borderColor: isEquipped ? `rgba(251,191,36,0.25)` : `${rs.baseColor}18`,
          background: isEquipped ? `rgba(251,191,36,0.08)` : "transparent",
        }}
      >
        {isEquipped ? (
          <>
            <Check size={10} strokeWidth={3} />
            Equipped
          </>
        ) : (
          "Equip"
        )}
      </button>
    </div>
  );
};
