import { cn } from "assets/lib/utils";
import { Check } from "lucide-react";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { RarityBadge, RARITY_STYLES, RARITY_GLOW_CLASS } from "../RarityBadge";
import type { InventoryItem } from "../../types/arsenal.types";

interface GuitarCardProps {
  item: InventoryItem;
  count: number;
  isEquipped: boolean;
  onEquip: (guitarId: number | string) => void;
  isEquipping: boolean;
}

export const GuitarCard = ({ item, count, isEquipped, onEquip, isEquipping }: GuitarCardProps) => {
  const guitar = GUITARS_BY_ID.get(item.guitarId);
  if (!guitar) return null;

  const rs = RARITY_STYLES[guitar.rarity];

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1 hover:z-10",
        isEquipped
          ? "ring-2 ring-amber-400/70 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
          : RARITY_GLOW_CLASS[guitar.rarity]
      )}
      style={{
        background: `linear-gradient(180deg, ${rs.baseColor}12 0%, #09090b 50%, ${rs.baseColor}08 100%)`,
        borderBottom: `3px solid ${rs.baseColor}`,
      }}
    >
      {item.isNew && (
        <div
          className="absolute top-1 right-1 z-20 rounded-sm px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-white"
          style={{
            backgroundColor: rs.baseColor,
            boxShadow: `0 0 10px ${rs.baseColor}80`,
          }}
        >
          NEW
        </div>
      )}
      {count > 1 && (
        <div className="absolute top-1 left-1 z-20 rounded-sm bg-zinc-800/90 border border-zinc-600 px-1.5 py-0.5 text-[9px] font-black text-zinc-300">
          x{count}
        </div>
      )}

      <div
        className="relative flex h-52 w-full items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at center, ${rs.baseColor}15 0%, transparent 70%)`,
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ backgroundColor: `${rs.baseColor}30` }}
        />
        <img
          src={`/static/images/rank/${guitar.imageId}.png`}
          alt={guitar.name}
          className="relative z-10 h-36 w-36 -rotate-45 object-contain transition-transform duration-500 group-hover:scale-130 group-hover:-rotate-[30deg]"
          style={{
            filter: `drop-shadow(0 0 16px ${rs.baseColor}40)`,
          }}
        />
      </div>

      <div className="flex flex-col items-center gap-1.5 w-full px-3 py-3">
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none">
          {guitar.brand}
        </span>
        <span className="text-center text-sm font-black tracking-wide text-white uppercase leading-tight min-h-[32px] flex items-center">
          {guitar.name}
        </span>
        <div className="mt-1">
          <RarityBadge rarity={guitar.rarity} size="sm" />
        </div>
      </div>

      <button
        onClick={() => onEquip(guitar.id)}
        disabled={isEquipped || isEquipping}
        className={cn(
          "w-full px-2 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-t",
          isEquipped
            ? "bg-amber-500/15 text-amber-400 border-amber-500/30 cursor-default flex items-center justify-center gap-1.5"
            : "bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-white border-zinc-800/50 disabled:opacity-50"
        )}
      >
        {isEquipped ? (
          <>
            <Check size={11} strokeWidth={3} />
            Equipped
          </>
        ) : (
          "Equip"
        )}
      </button>
    </div>
  );
};
