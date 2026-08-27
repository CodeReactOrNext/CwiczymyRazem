import { cn } from "assets/lib/utils";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import {
  getEffectiveRarity,
  getItemCondition,
  getItemLevel,
} from "feature/arsenal/data/itemStats";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { Guitar, Plus, RefreshCw, X } from "lucide-react";

import type { InventoryItem } from "../../types/arsenal.types";
import { ConditionMeter } from "../ConditionMeter";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { HoloFoil, HoloStripe } from "../HoloFoil";
import { LevelEmblem } from "../LevelEmblem";
import { RARITY_STYLES } from "../RarityBadge";
import { SpecTags } from "../SpecTags";
import { PLATE_NOISE_BG } from "../TierPlate";

/**
 * A guitar socket on the rig.
 *
 * A filled socket is built from the same parts as the card it stands for —
 * rarity stripe, level emblem, condition meter, notched year/country tags — so
 * the loadout describes a guitar the way the collection does rather than in a
 * second, plainer language. An empty one stays a quiet dark panel: nothing is
 * in it, so there is nothing for a finish to be about.
 */

/** Sockets read as places, not indexes — "the second one", not "slot 1". */
const SLOT_NUMERALS = ["I", "II", "III"];

interface GuitarSlotProps {
  slotIndex: number;
  itemId: string | null;
  inventory: InventoryItem[];
  onOpenPicker: (slotIndex: number) => void;
  onRemove: (slotIndex: number) => void;
  onHover?: (
    e: React.MouseEvent | null,
    content: React.ReactNode | null,
  ) => void;
  /** Touch-only: tapping the slot opens its card in a modal. */
  onShowCard?: (content: React.ReactNode) => void;
}

export const GuitarSlot = ({
  slotIndex,
  itemId,
  inventory,
  onOpenPicker,
  onRemove,
  onHover,
  onShowCard,
}: GuitarSlotProps) => {
  const item = itemId ? inventory.find((i) => i.id === itemId) : null;
  const guitar = item ? GUITARS_BY_ID.get(item.guitarId) : null;
  // What the guitar *is* now: the workshop can promote it past its mint rarity.
  const rarity = guitar
    ? getEffectiveRarity(guitar.rarity, item?.buildLevel)
    : null;
  const rs = rarity ? RARITY_STYLES[rarity] : null;
  const numeral = SLOT_NUMERALS[slotIndex] ?? String(slotIndex + 1);

  if (!guitar || !rs || !rarity || !item) {
    return (
      <button
        onClick={() => onOpenPicker(slotIndex)}
        aria-label={`Fit a guitar in slot ${slotIndex + 1}`}
        className={cn(
          "group relative flex min-h-[340px] w-full flex-col items-center justify-center gap-4 rounded-lg bg-zinc-900/40 p-6",
          "transition-background hover:bg-zinc-800/40",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}>
        <span className='absolute left-4 top-4 text-[10px] font-black tracking-[0.3em] text-zinc-700'>
          {numeral}
        </span>

        <span className='flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 transition-background group-hover:bg-zinc-700/60'>
          <Guitar
            size={28}
            strokeWidth={1.2}
            className='text-zinc-500 transition-colors group-hover:text-zinc-300'
          />
        </span>

        <span className='flex flex-col items-center gap-1.5'>
          <span className='text-sm font-bold text-zinc-400 transition-colors group-hover:text-zinc-100'>
            Empty slot
          </span>
          <span className='flex items-center gap-1 text-xs text-zinc-600 transition-colors group-hover:text-zinc-400'>
            <Plus size={11} />
            Fit a guitar
          </span>
        </span>
      </button>
    );
  }

  const level = getItemLevel(item, guitar);
  const condition = getItemCondition(item);
  // Custom Shop is the only tier no case can drop, so it is the only one that
  // gets a finish instead of a colour — the rule the card already follows.
  const holo = rarity === "Custom Shop";
  const card = <GuitarCard item={item} readOnly />;

  return (
    <div
      className='group relative flex min-h-[340px] flex-col overflow-hidden rounded-lg'
      style={{
        backgroundColor: "#111116",
        backgroundImage: `linear-gradient(160deg, ${rs.baseColor}${holo ? "14" : "30"} 0%, #111116 55%)`,
        boxShadow: `inset 0 0 0 1px ${rs.baseColor}26, 0 6px 24px rgba(0,0,0,0.5)`,
      }}
      onMouseMove={(e) => onHover?.(e, card)}
      onMouseLeave={() => onHover?.(null, null)}
      onClick={() => onShowCard?.(card)}>
      {/* Grain — the same one the plates and the cards wear */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 z-0 opacity-[0.04] mix-blend-overlay'
        style={{
          backgroundImage: PLATE_NOISE_BG,
          backgroundSize: "140px 140px",
        }}
      />
      {/* Structural grid across the whole socket */}
      <div
        aria-hidden
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
      {/* Hovering a socket brings its rarity up off the floor. */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'
        style={{
          background: `radial-gradient(120% 75% at 50% 100%, ${rs.baseColor}24 0%, transparent 68%)`,
        }}
      />

      {holo && <HoloFoil />}

      {/* Rarity top stripe */}
      {holo ? (
        <HoloStripe />
      ) : (
        <div
          aria-hidden
          className='h-[2px] w-full flex-shrink-0'
          style={{
            background: `linear-gradient(90deg, transparent, ${rs.baseColor}, transparent)`,
          }}
        />
      )}

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(slotIndex);
        }}
        aria-label='Remove guitar from slot'
        className={cn(
          "absolute right-2 top-3 z-30 rounded bg-black/40 p-1 text-zinc-600",
          "transition-colors hover:bg-black/70 hover:text-zinc-200",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}>
        <X size={13} />
      </button>

      {/* Header */}
      <div className='relative z-10 flex flex-col px-4 pb-1 pt-3'>
        <div className='flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] text-zinc-600'>
          <span>Slot {numeral}</span>
          {item.serial != null && (
            <span className='font-mono tracking-tight'>
              #{String(item.serial).padStart(4, "0")}
            </span>
          )}
        </div>
        <p
          className='mt-2 truncate text-[10px] font-semibold capitalize leading-none tracking-wider'
          style={{ color: rs.baseColor }}>
          {guitar.brand}
        </p>
        <p className='mt-1 truncate text-[17px] font-extrabold leading-tight text-white'>
          {guitar.name}
        </p>
        <p
          className='mt-0.5 text-[9px] font-medium capitalize tracking-[0.15em]'
          style={{ color: rs.baseColor, opacity: 0.75 }}>
          {rarity}
        </p>
      </div>

      {/* Image */}
      <div className='relative flex flex-1 items-center justify-center overflow-hidden'>
        {/* Neutral spotlight so dark guitars separate from the background */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 z-0'
          style={{
            background: `radial-gradient(60% 55% at 50% 48%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, transparent 72%)`,
          }}
        />
        {/* Rarity glow backdrop */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 z-0 flex translate-y-[60px] items-center justify-center opacity-50'>
          <div
            className='absolute h-[170px] w-[170px] rounded-full blur-[34px]'
            style={{
              background: `radial-gradient(circle at center, ${rs.baseColor}66 0%, ${rs.baseColor}1f 45%, transparent 72%)`,
            }}
          />
        </div>

        {/* The card's own level emblem, so it reads as the same stat */}
        <div className='absolute left-3 top-2 z-20'>
          <LevelEmblem
            level={level}
            rarity={rarity}
            size={44}
            title='Guitar level'
          />
        </div>

        <SpecTags
          tags={[item.year, item.country]}
          className='absolute right-3 top-2.5 z-20 max-w-[45%]'
        />

        <img
          src={getRankBadgeSrc(guitar.imageId, "medium")}
          alt={guitar.name}
          className='relative z-10 -rotate-45 object-contain'
          style={{
            height: 260,
            width: 260,
            filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.55))",
          }}
        />
      </div>

      {/* Condition, then the way out of the socket. Both sit on a darker panel:
          the footer separates from the artwork by surface, not by a line. */}
      <div
        className='relative z-10 flex flex-shrink-0 flex-col'
        style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className='px-4 pb-3 pt-3'>
          <ConditionMeter condition={condition} restored={item.restored} />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenPicker(slotIndex);
          }}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 py-2.5 text-xs font-bold capitalize tracking-wide text-zinc-500",
            "transition-background hover:bg-white/[0.04] hover:text-zinc-100",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}>
          <RefreshCw size={11} />
          Change
        </button>
      </div>
    </div>
  );
};
