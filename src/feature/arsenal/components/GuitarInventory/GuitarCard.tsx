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
import {
  getSalvageableMod,
  getScrappedMods,
} from "feature/arsenal/data/salvage";
import { getItemTraits } from "feature/arsenal/data/traits";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import {
  countScrapParts,
  getGuitarScrapYield,
} from "feature/arsenal/utils/scrap";
import { Check, Store, Trash2, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { ScrapYieldList } from "../Parts/ScrapYieldList";
import { ModArt } from "../Workshop/ModArt";

// SVG noise rasterized once by the browser and cached as a bitmap — no runtime GPU cost
const NOISE_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`;

import type { InventoryItem } from "../../types/arsenal.types";
import { CardAction, CardActionRow } from "../CardActions";
import { CardAffixes } from "../CardAffixes";
import { CardTraits, useItemTraitStates } from "../CardTraits";
import { ConditionMeter } from "../ConditionMeter";
import { HoloFoil, HoloStripe } from "../HoloFoil";
import { LevelEmblem } from "../LevelEmblem";
import { RARITY_STYLES } from "../RarityBadge";
import { SpecTags } from "../SpecTags";

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
  // Resolved before the guard below because the state hook must run on every
  // render — a guitar whose definition has been retired still has to obey the
  // rules of hooks on its way to rendering nothing.
  const traits = useMemo(() => getItemTraits(item), [item]);
  const traitStates = useItemTraitStates(item.id, traits);

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
  const salvagedMod = getSalvageableMod(item, "guitar");
  const scrappedMods = getScrappedMods(item, "guitar");

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

        {/* Year / country tags on the right */}
        <SpecTags
          tags={[item.year, item.country]}
          className='absolute right-2 top-3 z-20'
        />

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

      <CardAffixes features={features} />
      <CardTraits traits={traits} states={traitStates} />

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
        <CardActionRow>
          <CardAction
            tone={isEquipped ? "active" : "neutral"}
            icon={isEquipped ? Check : undefined}
            onClick={() => onEquipClick?.()}
            disabled={isEquipping}>
            Equip
          </CardAction>

          <TooltipProvider>
            {onListClick && (
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  {/* Wrapper span keeps the tooltip working while the button is disabled. */}
                  <span className='flex flex-1'>
                    <CardAction
                      tone='market'
                      icon={Store}
                      onClick={() => onListClick(item.id, guitar.id)}
                      disabled={isListing || isEquipped || rigSlot != null}>
                      Market
                    </CardAction>
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
                    <CardAction
                      tone='scrap'
                      icon={Wrench}
                      onClick={() => onScrapClick(item.id, guitar.id)}
                      disabled={isScrapping || isEquipped || rigSlot != null}>
                      Scrap
                    </CardAction>
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
                      {salvagedMod && (
                        <span className='text-[11px] text-purple-300'>
                          {salvagedMod.label} +{salvagedMod.points} comes off
                          whole
                        </span>
                      )}
                      {/* Named, this ran to eleven mods on a loaded guitar and
                          buried the yield above it. The plates say the same
                          thing at a glance; the names stay for screen readers,
                          which get nothing from `ModArt` — it is decorative. */}
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
            )}

            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                {/* Wrapper span keeps the tooltip working while the button is disabled. */}
                <span className='flex flex-1'>
                  <CardAction
                    tone='sell'
                    icon={Trash2}
                    onClick={() => onSellClick?.(item.id, guitar.id)}
                    disabled={isSelling || isEquipped}>
                    Sell
                  </CardAction>
                </span>
              </TooltipTrigger>
              <TooltipContent
                side='top'
                className='border border-zinc-700 bg-zinc-950 text-xs text-white'>
                {sellTooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardActionRow>
      )}
    </div>
  );
};
