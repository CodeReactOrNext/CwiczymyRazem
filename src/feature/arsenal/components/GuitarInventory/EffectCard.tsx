import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import {
  getEffectFeatures,
  getEffectLevel,
} from "feature/arsenal/data/effectStats";
import {
  getEffectiveRarity,
  getItemCondition,
} from "feature/arsenal/data/itemStats";
import {
  getSalvageableMod,
  getScrappedMods,
} from "feature/arsenal/data/salvage";
import {
  countScrapParts,
  getEffectScrapYield,
} from "feature/arsenal/utils/scrap";
import { Store, Trash2, Unplug, Wrench } from "lucide-react";
import type { ReactNode } from "react";

import { ScrapYieldList } from "../Parts/ScrapYieldList";
import { ModArt } from "../Workshop/ModArt";

const NOISE_BG =`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`;

import type { EffectInventoryItem } from "../../types/arsenal.types";
import { CardAffixes } from "../CardAffixes";
import { ConditionMeter } from "../ConditionMeter";
import { HoloFoil, HoloStripe } from "../HoloFoil";
import { LevelEmblem } from "../LevelEmblem";
import { RARITY_STYLES } from "../RarityBadge";

interface EffectCardProps {
  item: EffectInventoryItem;
  isOnPedalboard?: boolean;
  onSellClick?: (inventoryItemId: string, effectId: number | string) => void;
  isSelling?: boolean;
  onListClick?: (inventoryItemId: string, effectId: number | string) => void;
  isListing?: boolean;
  onScrapClick?: (inventoryItemId: string, effectId: number | string) => void;
  isScrapping?: boolean;
  /** Takes the pedal off the pedalboard straight from the collection tab. */
  onRemoveFromBoard?: (inventoryItemId: string) => void;
  isRemovingFromBoard?: boolean;
  /** Hide the Sell footer — for tooltips, reveals and read-only previews. */
  readOnly?: boolean;
  /** Custom footer rendered inside the card frame in place of the Sell row
      (e.g. the marketplace seller/price/buy panel). Takes precedence over readOnly. */
  footer?: ReactNode;
}

export const EffectCard = ({
  item,
  isOnPedalboard = false,
  onSellClick,
  isSelling,
  onListClick,
  isListing,
  onScrapClick,
  isScrapping,
  onRemoveFromBoard,
  isRemovingFromBoard,
  readOnly = false,
  footer,
}: EffectCardProps) => {
  const effect = EFFECTS_BY_ID.get(item.effectId);
  if (!effect) return null;

  // What the pedal *is* now: the workshop can promote it past its mint rarity.
  const rarity = getEffectiveRarity(effect.rarity, item.buildLevel);
  const rs = RARITY_STYLES[rarity];
  // Custom Shop is the only tier that cannot be dropped, so it is the only one
  // that gets a finish instead of a colour.
  const holo = rarity === "Custom Shop";

  const condition = getItemCondition(item);
  const level = getEffectLevel(item, effect);
  const features = getEffectFeatures(item);

  // Scrap potential is deterministic, so the exact payout can be shown up front.
  const scrapParts = getEffectScrapYield(item, effect);
  const scrapTotal = countScrapParts(scrapParts);
  const salvagedMod = getSalvageableMod(item, "effect");
  const scrappedMods = getScrappedMods(item, "effect");

  return (
    <div
      className='group relative flex h-full flex-col overflow-hidden'
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

      {/* Brand + Name + Rarity·Type / Serial */}
      <div className='flex flex-shrink-0 items-start justify-between gap-2 px-3 pb-1.5 pt-3'>
        <div className='min-w-0'>
          <p
            className='text-[10px] font-semibold uppercase leading-none tracking-wider'
            style={{ color: rs.baseColor }}>
            {effect.brand}
          </p>
          <p className='mt-1 truncate text-[16px] font-extrabold leading-tight text-white'>
            {effect.name}
          </p>
          <p
            className='mt-0.5 text-[9px] font-medium capitalize tracking-[0.15em]'
            style={{ color: rs.baseColor, opacity: 0.7 }}>
            {rarity} · {effect.type}
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

      {/* Effect image */}
      <div
        className='relative flex flex-1 items-center justify-center overflow-hidden py-4'
        style={{ minHeight: 200 }}>
        {/* Neutral spotlight so dark effects separate from the background */}
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

        {/* Level emblem + New flag */}
        <div className='absolute left-2 top-2 z-20 flex flex-col items-start gap-1.5'>
          {level > 0 && (
            <LevelEmblem level={level} rarity={rarity} title='Effect level' />
          )}
          {item.isNew && (
            <div
              className='px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-black'
              style={{ backgroundColor: rs.baseColor, borderRadius: 3 }}>
              New
            </div>
          )}
        </div>

        {/* Year / country tags on the right */}
        {(item.year || item.country) && (
          <div className='absolute right-2 top-3 z-20 flex flex-col gap-1.5'>
            {[item.year, item.country].filter(Boolean).map((tag, i) => (
              <div key={i} className='relative flex items-center'>
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
                  {tag}
                </div>
              </div>
            ))}
          </div>
        )}

        <img
          src={`/static/images/effects/${effect.imageId}.png`}
          alt={effect.name}
          className='relative z-10 object-contain'
          style={{
            height: 160,
            width: 160,
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.2))",
          }}
        />

        {/* LED */}
        <div
          className='absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full'
          style={{
            width: 6,
            height: 6,
            backgroundColor: rs.baseColor,
            boxShadow: `0 0 8px 2px ${rs.baseColor}80`,
          }}
        />

        {isOnPedalboard && (
          <div className='absolute bottom-2 left-3 z-20 flex items-center gap-1.5'>
            <div
              className='h-1.5 w-1.5 rounded-full'
              style={{
                backgroundColor: rs.baseColor,
                boxShadow: `0 0 8px ${rs.baseColor}`,
              }}
            />
            <span
              className='text-[8px] font-medium tracking-wide'
              style={{ color: `${rs.baseColor}B3` }}>
              on board
            </span>
          </div>
        )}
      </div>

      <CardAffixes features={features} />

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

      {/* On the board every other action is blocked, so the whole row becomes
          the one action that is available: taking the pedal off. */}
      {!readOnly && !footer && isOnPedalboard && onRemoveFromBoard && (
        <div
          className='flex flex-shrink-0 border-t'
          style={{
            borderColor: `${rs.baseColor}20`,
            background: "rgba(0,0,0,0.35)",
          }}>
          <button
            onClick={() => onRemoveFromBoard(item.id)}
            disabled={isRemovingFromBoard}
            className='flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold capitalize tracking-wider text-zinc-300 transition-colors disabled:cursor-not-allowed disabled:opacity-20 hover:text-cyan-400'
            title='Take this pedal off the pedalboard'>
            <Unplug size={9} strokeWidth={2.5} />
            Remove from board
          </button>
        </div>
      )}

      {/* Sell */}
      {!readOnly && !footer && !(isOnPedalboard && onRemoveFromBoard) && (
        <div
          className='flex flex-shrink-0 border-t'
          style={{
            borderColor: `${rs.baseColor}20`,
            background: "rgba(0,0,0,0.35)",
          }}>
          {onListClick && (
            <button
              onClick={() => onListClick(item.id, item.effectId)}
              disabled={isListing || isOnPedalboard}
              className='flex flex-1 items-center justify-center gap-1.5 border-r py-2.5 text-[11px] font-semibold capitalize tracking-wider text-zinc-400 transition-colors disabled:cursor-not-allowed disabled:opacity-20 hover:text-amber-400'
              style={{ borderColor: `${rs.baseColor}15` }}
              title={
                isOnPedalboard
                  ? "Remove from pedalboard before listing"
                  : "List on the market"
              }>
              <Store size={9} strokeWidth={2.5} />
              Market
            </button>
          )}

          {onScrapClick && (
            <TooltipProvider>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  {/* Wrapper span keeps the tooltip working while the button is disabled. */}
                  <span className='flex flex-1'>
                    <button
                      onClick={() => onScrapClick(item.id, item.effectId)}
                      disabled={isScrapping || isOnPedalboard}
                      className='flex w-full items-center justify-center gap-1.5 border-r py-2.5 text-[11px] font-semibold capitalize tracking-wider text-zinc-400 transition-colors disabled:cursor-not-allowed disabled:opacity-20 hover:text-orange-400'
                      style={{ borderColor: `${rs.baseColor}15` }}>
                      <Wrench size={9} strokeWidth={2.5} />
                      Scrap
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side='top'
                  className='max-w-[260px] border border-zinc-700 bg-zinc-950 text-white'>
                  {isOnPedalboard ? (
                    <span className='text-xs'>
                      Remove from the pedalboard before scrapping
                    </span>
                  ) : (
                    <div className='flex flex-col gap-1.5'>
                      <span className='text-[10px] font-bold capitalize tracking-wider text-zinc-400'>
                        Scraps into {scrapTotal} parts
                      </span>
                      <ScrapYieldList parts={scrapParts} compact />
                      {salvagedMod && (
                        <span className='text-[11px] text-purple-300'>
                          {salvagedMod.label} +{salvagedMod.points} comes off
                          whole
                        </span>
                      )}
                      {/* Plates, not names — see `GuitarCard`. The list runs
                          long on a loaded pedal and the yield is what the
                          tooltip is for. */}
                      {scrappedMods.length > 0 && (
                        <div className='flex flex-wrap items-center gap-1.5'>
                          <span className='sr-only'>
                            {scrappedMods.map((m) => m.label).join(", ")}{" "}
                            {scrappedMods.length === 1 ? "goes" : "go"} with it
                          </span>
                          {scrappedMods.map((mod) => (
                            <ModArt
                              key={mod.featureId}
                              modId={mod.featureId}
                              size={24}
                              dimmed
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <button
            onClick={() => onSellClick?.(item.id, item.effectId)}
            disabled={isSelling || isOnPedalboard}
            className='flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold capitalize tracking-wider text-zinc-400 transition-colors disabled:cursor-not-allowed disabled:opacity-20 hover:text-red-400'
            title={
              isOnPedalboard ? "Cannot sell effect on pedalboard" : undefined
            }>
            <Trash2 size={9} strokeWidth={2.5} />
            Sell
          </button>
        </div>
      )}
    </div>
  );
};
