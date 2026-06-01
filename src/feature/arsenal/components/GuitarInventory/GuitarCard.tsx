import { cn } from "assets/lib/utils";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { Check, Trash2 } from "lucide-react";

// SVG noise rasterized once by the browser and cached as a bitmap — no runtime GPU cost
const NOISE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`;

import type { InventoryItem } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

interface GuitarCardProps {
  item: InventoryItem;
  isEquipped: boolean;
  onEquip: (guitarId: number | string, year?: number, country?: string) => void;
  isEquipping: boolean;
  onSellClick: (inventoryItemId: string, guitarId: number | string) => void;
  isSelling: boolean;
}

export const GuitarCard = ({ item, isEquipped, onEquip, isEquipping, onSellClick, isSelling }: GuitarCardProps) => {
  const guitar = GUITARS_BY_ID.get(item.guitarId);
  if (!guitar) return null;

  const rs = RARITY_STYLES[guitar.rarity];

  return (
    <div
      className={cn(
        "group relative flex flex-col h-full overflow-hidden",
        isEquipped && "ring-1 ring-amber-400/40"
      )}
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
          {guitar.brand}
        </p>
        <p className="text-[16px] font-extrabold text-white leading-tight truncate mt-1">
          {guitar.name}
        </p>
        <p
          className="text-[9px] font-medium tracking-[0.15em] mt-0.5 capitalize"
          style={{ color: rs.baseColor, opacity: 0.7 }}
        >
          {guitar.rarity}
        </p>
      </div>

      {/* Guitar image */}
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

        {/* Tags on the right */}
        {(item.year || item.country) && (
          <>
            <div className="absolute top-3 right-2 z-20 flex flex-col gap-1.5">
              {item.year && (
                <div className="relative flex items-center">
                  <div
                    className="absolute left-[3px] w-[5px] h-[5px] rounded-full z-10"
                    style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                  <div
                    className="text-[9px] font-semibold text-zinc-300 tracking-wide"
                    style={{
                      background: "linear-gradient(135deg, #28282e, #1b1b21)",
                      borderRadius: "2px 3px 3px 2px",
                      clipPath: "polygon(8px 0%, 100% 0%, 100% 100%, 8px 100%, 0% 50%)",
                      paddingLeft: "14px",
                      paddingRight: "8px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                    }}
                  >
                    {item.year}
                  </div>
                </div>
              )}
              {item.country && (
                <div className="relative flex items-center">
                  <div
                    className="absolute left-[3px] w-[5px] h-[5px] rounded-full z-10"
                    style={{ background: "#0f0f12", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                  <div
                    className="text-[9px] font-semibold text-zinc-300 tracking-wide"
                    style={{
                      background: "linear-gradient(135deg, #28282e, #1b1b21)",
                      borderRadius: "2px 3px 3px 2px",
                      clipPath: "polygon(8px 0%, 100% 0%, 100% 100%, 8px 100%, 0% 50%)",
                      paddingLeft: "14px",
                      paddingRight: "8px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                    }}
                  >
                    {item.country}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <img
          src={`/static/images/rank/${guitar.imageId}.webp`}
          alt={guitar.name}
          className="relative z-10 object-contain -rotate-90"
          style={{
            height: 260,
            width: 260,
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.2))",
          }}
        />

        {isEquipped && (
          <div className="absolute bottom-2 left-3 z-20 flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
              style={{ boxShadow: "0 0 8px rgba(251,191,36,1)" }}
            />
            <span className="text-[8px] text-amber-400/70 font-medium tracking-wide">equipped</span>
          </div>
        )}
      </div>


      {/* Equip / Sell */}
      <div
        className="flex border-t flex-shrink-0"
        style={{ borderColor: `${rs.baseColor}20`, background: "rgba(0,0,0,0.35)" }}
      >
        <button
          onClick={() => onEquip(guitar.id, item.year, item.country)}
          disabled={isEquipped || isEquipping}
          className={cn(
            "flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border-r",
            isEquipped
              ? "cursor-default text-amber-400"
              : "text-zinc-500 hover:text-white disabled:opacity-30"
          )}
          style={{
            borderColor: `${rs.baseColor}15`,
            background: isEquipped ? "rgba(251,191,36,0.06)" : undefined,
          }}
        >
          {isEquipped ? (
            <>
              <Check size={9} strokeWidth={3} />
              Equipped
            </>
          ) : (
            "Equip"
          )}
        </button>

        <button
          onClick={() => onSellClick(item.id, guitar.id)}
          disabled={isSelling || isEquipped}
          className="flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 text-zinc-600 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed"
          title={isEquipped ? "Cannot sell equipped guitar" : undefined}
        >
          <Trash2 size={9} strokeWidth={2.5} />
          Sell
        </button>
      </div>
    </div>
  );
};
