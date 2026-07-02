import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectFeatures, getEffectLevel } from "feature/arsenal/data/effectStats";
import { CONDITION_TIERS, getConditionGrade, getConditionTier, getItemCondition } from "feature/arsenal/data/itemStats";
import { Store,Trash2 } from "lucide-react";
import type { ReactNode } from "react";

const NOISE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`;

import type { EffectInventoryItem } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

interface EffectCardProps {
  item: EffectInventoryItem;
  isOnPedalboard?: boolean;
  onSellClick?: (inventoryItemId: string, effectId: number | string) => void;
  isSelling?: boolean;
  onListClick?: (inventoryItemId: string, effectId: number | string) => void;
  isListing?: boolean;
  /** Hide the Sell footer — for tooltips, reveals and read-only previews. */
  readOnly?: boolean;
  /** Custom footer rendered inside the card frame in place of the Sell row
      (e.g. the marketplace seller/price/buy panel). Takes precedence over readOnly. */
  footer?: ReactNode;
}

export const EffectCard = ({ item, isOnPedalboard = false, onSellClick, isSelling, onListClick, isListing, readOnly = false, footer }: EffectCardProps) => {
  const effect = EFFECTS_BY_ID.get(item.effectId);
  if (!effect) return null;

  const rs = RARITY_STYLES[effect.rarity];

  const condition = getItemCondition(item);
  const grade = getConditionGrade(condition);
  const conditionTier = getConditionTier(condition);
  const level = getEffectLevel(item, effect);
  const features = getEffectFeatures(item);

  // RPG-style affixes: highlight the strongest mod (≥3 pts) as the "legendary" line.
  const sortedFeatures = [...features].sort((a, b) => b.points - a.points);
  const signature = sortedFeatures[0] && sortedFeatures[0].points >= 3 ? sortedFeatures[0] : null;
  const affixes = signature ? sortedFeatures.slice(1) : sortedFeatures;

  return (
    <div
      className="group relative flex flex-col h-full overflow-hidden"
      style={{
        borderRadius: 10,
        backgroundColor: "#111116",
        backgroundImage: `linear-gradient(160deg, ${rs.baseColor}35 0%, #111116 55%)`,
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

      {/* Subtle structural grid across the whole card */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: [
            `linear-gradient(${rs.baseColor} 1px, transparent 1px)`,
            `linear-gradient(90deg, ${rs.baseColor} 1px, transparent 1px)`,
          ].join(","),
          backgroundSize: "22px 22px",
          opacity: 0.04,
        }}
      />

      {/* Rarity top stripe */}
      <div
        className="h-[2px] w-full flex-shrink-0"
        style={{ background: `linear-gradient(90deg, transparent, ${rs.baseColor}, transparent)` }}
      />

      {/* Brand + Name + Rarity·Type / Serial */}
      <div className="px-3 pt-3 pb-1.5 flex-shrink-0 flex items-start justify-between gap-2">
        <div className="min-w-0">
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

        {item.serial != null && (
          <span className="text-[9px] font-mono text-zinc-500 tracking-tight flex-shrink-0">
            #{String(item.serial).padStart(4, "0")}
          </span>
        )}
      </div>

      {/* Condition — labelled segmented bar */}
      <div className="px-3 pb-2.5 flex-shrink-0" title={`Condition: ${grade.label}`}>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[8px] font-medium uppercase tracking-widest text-zinc-500">
            Condition
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: grade.color, textShadow: `0 0 8px ${grade.color}55` }}
          >
            {grade.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: CONDITION_TIERS }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                background: i < conditionTier ? grade.color : "#27272a",
                boxShadow: i < conditionTier ? `0 0 6px ${grade.color}70` : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Effect image */}
      <div
        className="relative flex items-center justify-center flex-1 overflow-hidden py-4"
        style={{ minHeight: 200 }}
      >
        {/* Neutral spotlight so dark effects separate from the background */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: `radial-gradient(60% 55% at 50% 48%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, transparent 72%)` }}
        />

        {/* Rarity glow backdrop */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none translate-y-[60px] opacity-50">
          <div
            className="absolute w-[170px] h-[170px] rounded-full blur-[34px]"
            style={{ background: `radial-gradient(circle at center, ${rs.baseColor}66 0%, ${rs.baseColor}1f 45%, transparent 72%)` }}
          />
        </div>

        {/* Level emblem + New flag */}
        <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1.5">
          {level > 0 && (
            <div
              className="flex flex-col items-center justify-center rounded-full"
              style={{
                width: 38,
                height: 38,
                background: "radial-gradient(circle at 50% 35%, #1c1c22, #0d0d10)",
                border: `1.5px solid ${rs.baseColor}`,
                boxShadow: `0 0 10px ${rs.baseColor}55, inset 0 0 6px rgba(0,0,0,0.6)`,
              }}
              title="Effect level"
            >
              <span className="text-[15px] font-black leading-none text-white">{level}</span>
            </div>
          )}
          {item.isNew && (
            <div
              className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-black"
              style={{ backgroundColor: rs.baseColor, borderRadius: 3 }}
            >
              New
            </div>
          )}
        </div>

        {/* Year / country tags on the right */}
        {(item.year || item.country) && (
          <div className="absolute top-3 right-2 z-20 flex flex-col gap-1.5">
            {[item.year, item.country].filter(Boolean).map((tag, i) => (
              <div key={i} className="relative flex items-center">
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
                  {tag}
                </div>
              </div>
            ))}
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

      {/* RPG-style affixes under the pedal */}
      {features.length > 0 && (
        <div
          className="relative z-10 flex flex-col gap-1 px-3 py-3 border-t flex-shrink-0"
          style={{ borderColor: `${rs.baseColor}1a`, background: "rgba(0,0,0,0.28)" }}
        >
          {affixes.map((f) => (
            <div key={f.id} className="flex items-baseline gap-2 leading-snug">
              <span className="text-[11px] text-zinc-600 flex-shrink-0">◆</span>
              <span className="text-[12px] text-zinc-300">
                <span className="font-bold" style={{ color: "#7dd3fc" }}>+{f.points}</span>{" "}
                {f.label}
              </span>
            </div>
          ))}
          {signature && (
            <div className="flex items-baseline gap-2 leading-snug">
              <span className="text-[11px] flex-shrink-0" style={{ color: "#f59e0b" }}>★</span>
              <span className="text-[12px] font-medium" style={{ color: "#f5a524" }}>
                <span className="font-bold" style={{ color: "#fbbf24" }}>+{signature.points}</span>{" "}
                {signature.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Custom footer (e.g. marketplace panel) — part of the card frame */}
      {footer ? (
        <div
          className="relative z-10 border-t flex-shrink-0"
          style={{ borderColor: `${rs.baseColor}20`, background: "rgba(0,0,0,0.35)" }}
        >
          {footer}
        </div>
      ) : null}

      {/* Sell */}
      {!readOnly && !footer && (
      <div
        className="flex border-t flex-shrink-0"
        style={{ borderColor: `${rs.baseColor}20`, background: "rgba(0,0,0,0.35)" }}
      >
        {onListClick && (
          <button
            onClick={() => onListClick(item.id, item.effectId)}
            disabled={isListing || isOnPedalboard}
            className="flex-1 py-2.5 text-[10px] font-semibold capitalize tracking-wider transition-colors flex items-center justify-center gap-1.5 text-zinc-600 hover:text-amber-400 disabled:opacity-20 disabled:cursor-not-allowed border-r"
            style={{ borderColor: `${rs.baseColor}15` }}
            title={isOnPedalboard ? "Remove from pedalboard before listing" : "List on the market"}
          >
            <Store size={9} strokeWidth={2.5} />
            Market
          </button>
        )}

        <button
          onClick={() => onSellClick?.(item.id, item.effectId)}
          disabled={isSelling || isOnPedalboard}
          className="flex-1 py-2.5 text-[10px] font-semibold capitalize tracking-wider transition-colors flex items-center justify-center gap-1.5 text-zinc-600 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed"
          title={isOnPedalboard ? "Cannot sell effect on pedalboard" : undefined}
        >
          <Trash2 size={9} strokeWidth={2.5} />
          Sell
        </button>
      </div>
      )}
    </div>
  );
};
