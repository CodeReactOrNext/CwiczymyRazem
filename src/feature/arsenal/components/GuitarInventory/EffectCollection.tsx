import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { RARITY_STYLES } from "../RarityBadge";
import type { ArsenalUserData } from "../../types/arsenal.types";

interface EffectCollectionProps {
  data: ArsenalUserData;
}

export const EffectCollection = ({ data }: EffectCollectionProps) => {
  if (!data.effectInventory || data.effectInventory.length === 0) return null;

  // Group by effectId, count duplicates
  const groupedMap = new Map<number | string, { item: typeof data.effectInventory[0]; count: number }>();
  for (const item of data.effectInventory) {
    const existing = groupedMap.get(item.effectId);
    if (!existing || item.acquiredAt > existing.item.acquiredAt) {
      groupedMap.set(item.effectId, { item, count: (existing?.count ?? 0) + 1 });
    } else {
      groupedMap.set(item.effectId, { item: existing.item, count: existing.count + 1 });
    }
  }
  const items = Array.from(groupedMap.values()).sort((a, b) => b.item.acquiredAt - a.item.acquiredAt);

  return (
    <div className="flex flex-col gap-3 mt-8">
      <div className="flex flex-col gap-0.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Effects</p>
        <p className="text-base font-black text-white uppercase tracking-wide">Pedals</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map(({ item, count }) => {
          const effect = EFFECTS_BY_ID.get(item.effectId);
          if (!effect) return null;
          const rs = RARITY_STYLES[effect.rarity];

          return (
            <div
              key={item.id}
              className="relative flex flex-col overflow-hidden cursor-default"
              style={{
                borderRadius: 6,
                background: `linear-gradient(175deg, ${rs.baseColor}18 0%, #0c0c10 35%, #0c0c10 100%)`,
                border: `1px solid ${rs.baseColor}28`,
                borderBottom: `3px solid ${rs.baseColor}`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.6)`,
              }}
            >
              {/* Rarity stripe */}
              <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${rs.baseColor}90, transparent)` }} />

              {/* Header */}
              <div className="px-3 pt-2 pb-1">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] leading-none truncate" style={{ color: rs.baseColor }}>
                  {effect.brand}
                </p>
                <p className="text-[12px] font-black text-white uppercase tracking-wide leading-tight truncate mt-0.5">
                  {effect.name}
                </p>
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5" style={{ color: `${rs.baseColor}80` }}>
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
                    className="absolute top-2 right-2 z-20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-black"
                    style={{ backgroundColor: rs.baseColor, borderRadius: 3, boxShadow: `0 0 12px ${rs.baseColor}90` }}
                  >
                    NEW
                  </div>
                )}

                {/* Count */}
                {count > 1 && (
                  <div className="absolute top-2 left-2 z-20 px-1.5 py-0.5 text-[9px] font-black text-zinc-300 bg-black/70 border border-zinc-700/60" style={{ borderRadius: 3 }}>
                    ×{count}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
