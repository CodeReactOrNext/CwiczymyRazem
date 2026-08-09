import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import {
  getEffectiveRarity,
  getItemCondition,
  getItemFeatures,
  getItemLevel,
} from "feature/arsenal/data/itemStats";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import {
  countScrapParts,
  getGuitarScrapYield,
} from "feature/arsenal/utils/scrap";
import { Check, Store, Trash2, Wrench } from "lucide-react";
import type { ReactNode } from "react";

import { ScrapYieldList } from "../Parts/ScrapYieldList";

// SVG noise rasterized once by the browser and cached as a bitmap — no runtime GPU cost
const NOISE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`;

import type { InventoryItem } from "../../types/arsenal.types";
import { ConditionMeter } from "../ConditionMeter";
import { HoloFoil, HoloStripe } from "../HoloFoil";
import { LevelEmblem } from "../LevelEmblem";
import { RARITY_STYLES } from "../RarityBadge";

export type EquipTarget = "profile" | 0 | 1 | 2;

interface GuitarCardProps {
  item: InventoryItem;
  isEquipped?: boolean;
  /** Opens the equip-target modal (Profile / Rig slot 1-3). */
  onEquipClick?: () => void;
  isEquipping?: boolean;
  onSellClick?: (inventoryItemId: string, guitarId: number | string) => void;
  isSelling?: boolean;
  onListClick?: (inventoryItemId: string, guitarId: number | string) => void;
  isListing?: boolean;
  onScrapClick?: (inventoryItemId: string, guitarId: number | string) => void;
  isScrapping?: boolean;
  /** Rig slot index (0-2) this item occupies, or null/undefined if not in the rig. */
  rigSlot?: number | null;
  /** Hide the Equip/Sell footer — for tooltips, reveals and read-only previews. */
  readOnly?: boolean;
  /** Custom footer rendered inside the card frame in place of the Equip/Sell row
      (e.g. the marketplace seller/price/buy panel). Takes precedence over readOnly. */
  footer?: ReactNode;
}

export const GuitarCard = ({
  item,
  isEquipped = false,
  onEquipClick,
  isEquipping,
  onSellClick,
  isSelling,
  onListClick,
  isListing,
  onScrapClick,
  isScrapping,
  rigSlot,
  readOnly = false,
  footer,
}: GuitarCardProps) => {
  const guitar = GUITARS_BY_ID.get(item.guitarId);
  if (!guitar) return null;

  // What the guitar *is* now: the workshop can promote it past its mint rarity.
  const rarity = getEffectiveRarity(guitar.rarity, item.buildLevel);
  const rs = RARITY_STYLES[rarity];
  // Custom Shop is the only tier that cannot be dropped, so it is the only one
  // that gets a finish instead of a colour.
  const holo = rarity === "Custom Shop";

  const condition = getItemCondition(item);
  const level = getItemLevel(item, guitar);
  const features = getItemFeatures(item);

  // Reasons the Market / Sell actions are blocked — surfaced in a tooltip.
  const marketTooltip = isEquipped
    ? "Unequip from your profile before listing on the market"
    : rigSlot != null
      ? `Remove from rig slot ${rigSlot + 1} before listing on the market`
      : "List on the market";
  const sellTooltip = isEquipped
    ? "Unequip from your profile before selling"
    : "Sell for fame";

  // Scrap potential is deterministic, so the exact payout can be shown up front.
  const scrapParts = getGuitarScrapYield(item, guitar);
  const scrapTotal = countScrapParts(scrapParts);

  // RPG-style affixes: highlight the strongest mod (≥3 pts) as the "legendary" line.
  const sortedFeatures = [...features].sort((a, b) => b.points - a.points);
  const signature =
    sortedFeatures[0] && sortedFeatures[0].points >= 3
      ? sortedFeatures[0]
      : null;
  const affixes = signature ? sortedFeatures.slice(1) : sortedFeatures;

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden",
        isEquipped && "ring-1 ring-amber-400/40",
      )}
      style={{
        borderRadius: 10,
        backgroundColor: "#111116",
        backgroundImage: `linear-gradient(160deg, ${rs.baseColor}${holo ? "14" : "35"} 0%, #111116 55%)`,
        border: `1px solid ${rs.baseColor}28`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        contain: "layout style paint",
      }}>
      {/* Grain overlay */}
      <div
        className='pointer-events-none absolute inset-0 z-0'
        style={{
          backgroundImage: NOISE_BG,
          backgroundSize: "180px 180px",
          opacity: 0.035,
          mixBlendMode: "overlay",
        }}
      />

      {/* Subtle structural grid across the whole card */}
      <div
        className='pointer-events-none absolute inset-0 z-0'
        style={{
          backgroundImage: [
            `linear-gradient(${rs.baseColor} 1px, transparent 1px)`,
            `linear-gradient(90deg, ${rs.baseColor} 1px, transparent 1px)`,
          ].join(","),
          backgroundSize: "22px 22px",
          opacity: 0.04,
        }}
      />

      {holo && <HoloFoil />}

      {/* Rarity top stripe */}
      {holo ? (
        <HoloStripe />
      ) : (
        <div
          className='h-[2px] w-full flex-shrink-0'
          style={{
            background: `linear-gradient(90deg, transparent, ${rs.baseColor}, transparent)`,
          }}
        />
      )}

      {/* Brand + Name + Rarity / Serial */}
      <div className='flex flex-shrink-0 items-start justify-between gap-2 px-3 pb-1.5 pt-3'>
        <div className='min-w-0'>
          <p
            className='text-[10px] font-semibold uppercase leading-none tracking-wider'
            style={{ color: rs.baseColor }}>
            {guitar.brand}
          </p>
          <p className='mt-1 truncate text-[16px] font-extrabold leading-tight text-white'>
            {guitar.name}
          </p>
          <p
            className='mt-0.5 text-[9px] font-medium capitalize tracking-[0.15em]'
            style={{ color: rs.baseColor, opacity: 0.7 }}>
            {rarity}
          </p>
        </div>

        {item.serial != null && (
          <span className='font-mono flex-shrink-0 text-[9px] tracking-tight text-zinc-500'>
            #{String(item.serial).padStart(4, "0")}
          </span>
        )}
      </div>

      {/* Condition — labelled segmented bar */}
      <div className='flex-shrink-0 px-3 pb-2.5'>
        <ConditionMeter condition={condition} restored={item.restored} />
      </div>

      {/* Guitar image */}
      <div
        className='relative flex flex-1 items-center justify-center overflow-hidden py-4'
        style={{ minHeight: 200 }}>
        {/* Neutral spotlight so dark guitars separate from the background */}
        <div
          className='pointer-events-none absolute inset-0 z-0'
          style={{
            background: `radial-gradient(60% 55% at 50% 48%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, transparent 72%)`,
          }}
        />

        {/* Rarity glow backdrop */}
        <div className='pointer-events-none absolute inset-0 z-0 flex translate-y-[60px] items-center justify-center opacity-50'>
          <div
            className='absolute h-[170px] w-[170px] rounded-full blur-[34px]'
            style={{
              background: `radial-gradient(circle at center, ${rs.baseColor}66 0%, ${rs.baseColor}1f 45%, transparent 72%)`,
            }}
          />
        </div>

        {/* Level emblem (every guitar has a level) + New flag */}
        <div className='absolute left-2 top-2 z-20 flex flex-col items-start gap-1.5'>
          {level > 0 && (
            <LevelEmblem level={level} rarity={rarity} title='Guitar level' />
          )}
          {item.isNew && (
            <div
              className='px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-black'
              style={{ backgroundColor: rs.baseColor, borderRadius: 3 }}>
              New
            </div>
          )}
        </div>

        {/* Tags on the right */}
        {(item.year || item.country) && (
          <>
            <div className='absolute right-2 top-3 z-20 flex flex-col gap-1.5'>
              {item.year && (
                <div className='relative flex items-center'>
                  <div
                    className='absolute left-[3px] z-10 h-[5px] w-[5px] rounded-full'
                    style={{
                      background: "#0f0f12",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                  <div
                    className='text-[9px] font-semibold tracking-wide text-zinc-300'
                    style={{
                      background: "linear-gradient(135deg, #28282e, #1b1b21)",
                      borderRadius: "2px 3px 3px 2px",
                      clipPath:
                        "polygon(8px 0%, 100% 0%, 100% 100%, 8px 100%, 0% 50%)",
                      paddingLeft: "14px",
                      paddingRight: "8px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                    }}>
                    {item.year}
                  </div>
                </div>
              )}
              {item.country && (
                <div className='relative flex items-center'>
                  <div
                    className='absolute left-[3px] z-10 h-[5px] w-[5px] rounded-full'
                    style={{
                      background: "#0f0f12",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                  <div
                    className='text-[9px] font-semibold tracking-wide text-zinc-300'
                    style={{
                      background: "linear-gradient(135deg, #28282e, #1b1b21)",
                      borderRadius: "2px 3px 3px 2px",
                      clipPath:
                        "polygon(8px 0%, 100% 0%, 100% 100%, 8px 100%, 0% 50%)",
                      paddingLeft: "14px",
                      paddingRight: "8px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                    }}>
                    {item.country}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <img
          src={getRankBadgeSrc(guitar.imageId, "medium")}
          alt={guitar.name}
          className='relative z-10 -rotate-90 object-contain'
          style={{
            height: 260,
            width: 260,
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.2))",
          }}
        />

        {(isEquipped || rigSlot != null) && (
          <div className='absolute bottom-2 left-3 z-20 flex items-center gap-3'>
            {isEquipped && (
              <div className='flex items-center gap-1.5'>
                <div
                  className='h-1.5 w-1.5 rounded-full bg-amber-400'
                  style={{ boxShadow: "0 0 8px rgba(251,191,36,1)" }}
                />
                <span className='text-[8px] font-medium tracking-wide text-amber-400/70'>
                  equipped
                </span>
              </div>
            )}
            {rigSlot != null && (
              <div className='flex items-center gap-1.5'>
                <div
                  className='h-1.5 w-1.5 rounded-full bg-cyan-400'
                  style={{ boxShadow: "0 0 8px rgba(34,211,238,0.9)" }}
                />
                <span className='text-[8px] font-medium tracking-wide text-cyan-400/70'>
                  rig slot {rigSlot + 1}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RPG-style affixes under the guitar */}
      {features.length > 0 && (
        <div
          className='relative z-10 flex flex-shrink-0 flex-col gap-1 border-t px-3 py-3'
          style={{
            borderColor: `${rs.baseColor}1a`,
            background: "rgba(0,0,0,0.28)",
          }}>
          {affixes.map((f) => (
            <div key={f.id} className='flex items-baseline gap-2 leading-snug'>
              <span className='flex-shrink-0 text-[11px] text-zinc-600'>◆</span>
              <span className='text-[12px] text-zinc-300'>
                <span className='font-bold' style={{ color: "#7dd3fc" }}>
                  +{f.points}
                </span>{" "}
                {f.label}
              </span>
            </div>
          ))}
          {signature && (
            <div className='flex items-baseline gap-2 leading-snug'>
              <span
                className='flex-shrink-0 text-[11px]'
                style={{ color: "#f59e0b" }}>
                ★
              </span>
              <span
                className='text-[12px] font-medium'
                style={{ color: "#f5a524" }}>
                <span className='font-bold' style={{ color: "#fbbf24" }}>
                  +{signature.points}
                </span>{" "}
                {signature.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Custom footer (e.g. marketplace panel) — part of the card frame */}
      {footer ? (
        <div
          className='relative z-10 flex-shrink-0 border-t'
          style={{
            borderColor: `${rs.baseColor}20`,
            background: "rgba(0,0,0,0.35)",
          }}>
          {footer}
        </div>
      ) : null}

      {/* Equip / Sell */}
      {!readOnly && !footer && (
        <div
          className='flex flex-shrink-0 border-t'
          style={{
            borderColor: `${rs.baseColor}20`,
            background: "rgba(0,0,0,0.35)",
          }}>
          <button
            onClick={() => onEquipClick?.()}
            disabled={isEquipping}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 border-r px-1 py-3.5 text-[10px] font-semibold capitalize tracking-wide transition-colors",
              isEquipped
                ? "text-amber-400"
                : "text-zinc-500 disabled:opacity-30 hover:text-white",
            )}
            style={{
              borderColor: `${rs.baseColor}15`,
              background: isEquipped ? "rgba(251,191,36,0.06)" : undefined,
            }}>
            {isEquipped && <Check size={10} strokeWidth={3} />}
            Equip
          </button>

          <TooltipProvider>
            {onListClick && (
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  {/* Wrapper span keeps the tooltip working while the button is disabled. */}
                  <span className='flex flex-1'>
                    <button
                      onClick={() => onListClick(item.id, guitar.id)}
                      disabled={isListing || isEquipped || rigSlot != null}
                      className='flex w-full items-center justify-center gap-1 border-r px-1 py-3.5 text-[10px] font-semibold capitalize tracking-wide text-zinc-600 transition-colors disabled:cursor-not-allowed disabled:opacity-20 hover:text-amber-400'
                      style={{ borderColor: `${rs.baseColor}15` }}>
                      <Store size={10} strokeWidth={2.5} />
                      Market
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side='top'
                  className='border border-zinc-700 bg-zinc-950 text-xs text-white'>
                  {marketTooltip}
                </TooltipContent>
              </Tooltip>
            )}

            {onScrapClick && (
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <span className='flex flex-1'>
                    <button
                      onClick={() => onScrapClick(item.id, guitar.id)}
                      disabled={isScrapping || isEquipped || rigSlot != null}
                      className='flex w-full items-center justify-center gap-1 border-r px-1 py-3.5 text-[10px] font-semibold capitalize tracking-wide text-zinc-600 transition-colors disabled:cursor-not-allowed disabled:opacity-20 hover:text-orange-400'
                      style={{ borderColor: `${rs.baseColor}15` }}>
                      <Wrench size={10} strokeWidth={2.5} />
                      Scrap
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side='top'
                  className='max-w-[260px] border border-zinc-700 bg-zinc-950 text-white'>
                  {isEquipped ? (
                    <span className='text-xs'>
                      Unequip from your profile before scrapping
                    </span>
                  ) : rigSlot != null ? (
                    <span className='text-xs'>
                      Remove from rig slot {rigSlot + 1} before scrapping
                    </span>
                  ) : (
                    <div className='flex flex-col gap-1.5'>
                      <span className='text-[10px] font-bold capitalize tracking-wider text-zinc-400'>
                        Scraps into {scrapTotal} parts
                      </span>
                      <ScrapYieldList parts={scrapParts} compact />
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                {/* Wrapper span keeps the tooltip working while the button is disabled. */}
                <span className='flex flex-1'>
                  <button
                    onClick={() => onSellClick?.(item.id, guitar.id)}
                    disabled={isSelling || isEquipped}
                    className='flex w-full items-center justify-center gap-1 px-1 py-3.5 text-[10px] font-semibold capitalize tracking-wide text-zinc-600 transition-colors disabled:cursor-not-allowed disabled:opacity-20 hover:text-red-400'>
                    <Trash2 size={10} strokeWidth={2.5} />
                    Sell
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent
                side='top'
                className='border border-zinc-700 bg-zinc-950 text-xs text-white'>
                {sellTooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};
