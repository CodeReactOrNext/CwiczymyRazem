import { Chip, getChipCustomStyle } from "assets/components/ui/chip";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import {
  getEffectiveRarity,
  getItemLevel,
} from "feature/arsenal/data/itemStats";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import type { LucideIcon } from "lucide-react";
import { Guitar, User, X } from "lucide-react";

import type { InventoryItem } from "../../types/arsenal.types";
import { getRarityColor } from "../RarityBadge";
import type { EquipTarget } from "./GuitarCard";

interface EquipTargetDialogProps {
  isOpen: boolean;
  /** The guitar being placed. Resolved against `inventory` for its art and tier. */
  itemId: string;
  /** The guitar stash, so every target can show the copy it currently holds. */
  inventory: InventoryItem[];
  equippedItemId: string | null;
  rigSlots: (string | null)[];
  onSelect: (target: EquipTarget) => void;
  onRemove: (target: EquipTarget) => void;
  onClose: () => void;
}

/** Everything the dialog needs to draw one owned guitar. */
interface GuitarView {
  brand: string;
  name: string;
  imageSrc: string;
  color: string;
  rarity: string;
  level: number;
}

/**
 * A guitar stood upright over its own tier light, the way the stash and the rig
 * draw it. Square box plus `object-contain`: the art is shot lying down, so a
 * quarter turn inside a square fills the height and nothing can overflow.
 */
const GuitarArt = ({
  view,
  className,
  withLevel = false,
}: {
  view: GuitarView;
  className?: string;
  /** Corner emblem with the item level — the same one a stash socket wears. */
  withLevel?: boolean;
}) => (
  <span
    className={cn(
      "relative flex flex-shrink-0 items-center justify-center",
      className,
    )}>
    <span
      aria-hidden
      className='pointer-events-none absolute inset-0'
      style={{
        background: `radial-gradient(circle at center, ${view.color}59 0%, ${view.color}1f 45%, transparent 72%)`,
      }}
    />
    <img
      src={view.imageSrc}
      alt=''
      aria-hidden
      loading='lazy'
      decoding='async'
      draggable={false}
      className='relative h-full w-full -rotate-90 object-contain'
      style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.7))" }}
    />
    {withLevel && view.level > 0 && (
      <span
        className='absolute left-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums leading-none text-white'
        style={{
          background: "radial-gradient(circle at 50% 35%, #1c1c22, #0b0b0e)",
          boxShadow: `inset 0 0 0 1px ${view.color}, 0 0 8px ${view.color}55`,
        }}>
        {view.level}
      </span>
    )}
  </span>
);

/**
 * Picking where a guitar goes: the avatar, or one of the three rig slots.
 *
 * Every target draws whatever sits in it right now, so "this one is taken" is
 * answered with the guitar itself — art, name and tier — rather than with the
 * word "occupied". Nothing here is destructive, but displacing a Legendary by
 * accident is still a bad minute.
 */
export const EquipTargetDialog = ({
  isOpen,
  itemId,
  inventory,
  equippedItemId,
  rigSlots,
  onSelect,
  onRemove,
  onClose,
}: EquipTargetDialogProps) => {
  const viewOf = (id: string | null | undefined): GuitarView | null => {
    if (!id) return null;
    const item = inventory.find((i) => i.id === id);
    const guitar = item ? GUITARS_BY_ID.get(item.guitarId) : undefined;
    if (!item || !guitar) return null;
    const rarity = getEffectiveRarity(guitar.rarity, item.buildLevel);
    return {
      brand: guitar.brand,
      name: guitar.name,
      imageSrc: getRankBadgeSrc(guitar.imageId, "medium"),
      color: getRarityColor(rarity),
      rarity,
      level: getItemLevel(item, guitar),
    };
  };

  const subject = viewOf(itemId);
  if (!isOpen || !subject) return null;

  const targets: {
    target: EquipTarget;
    label: string;
    icon: LucideIcon;
    occupantId: string | null;
  }[] = [
    {
      target: "profile",
      label: "Profile",
      icon: User,
      occupantId: equippedItemId,
    },
    {
      target: 0,
      label: "Rig slot 1",
      icon: Guitar,
      occupantId: rigSlots[0] ?? null,
    },
    {
      target: 1,
      label: "Rig slot 2",
      icon: Guitar,
      occupantId: rigSlots[1] ?? null,
    },
    {
      target: 2,
      label: "Rig slot 3",
      icon: Guitar,
      occupantId: rigSlots[2] ?? null,
    },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='flex flex-col gap-8 border-0 bg-zinc-900 shadow-none sm:max-w-xl sm:p-8'>
        {/* The guitar being placed */}
        <div className='flex items-center gap-5 pr-10'>
          <GuitarArt view={subject} className='h-28 w-28' />
          <div className='flex min-w-0 flex-col gap-1'>
            <p className='truncate text-sm font-semibold text-zinc-400'>
              {subject.brand}
            </p>
            <DialogTitle className='truncate text-xl font-bold leading-snug text-zinc-100'>
              {subject.name}
            </DialogTitle>
            <div className='mt-1 flex flex-wrap items-center gap-2'>
              <Chip
                color='custom'
                style={getChipCustomStyle(subject.color)}
                className='px-2 py-1'>
                {subject.rarity}
              </Chip>
              <Chip color='gray' className='px-2 py-1'>
                Lvl {subject.level}
              </Chip>
            </div>
          </div>
        </div>

        {/* Where it can go */}
        <div className='flex flex-col gap-4'>
          <p className='text-sm text-zinc-400'>Where should it go?</p>

          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {targets.map(({ target, label, icon: Icon, occupantId }) => {
              const holder = viewOf(occupantId);
              // The target already holds this very copy — the amber one.
              const active = occupantId != null && occupantId === itemId;

              return (
                <div key={String(target)} className='relative'>
                  <button
                    type='button'
                    onClick={() => onSelect(target)}
                    className={cn(
                      "flex h-full w-full flex-col items-center gap-3 rounded-lg bg-zinc-800/40 p-3 pb-4 text-center transition-background",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800/80",
                      active && "bg-amber-500/10 hover:bg-amber-500/20",
                    )}>
                    <span className='flex items-center gap-1.5'>
                      <Icon
                        size={13}
                        className={cn(
                          "flex-shrink-0",
                          active ? "text-amber-400" : "text-zinc-400",
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          active ? "text-amber-400" : "text-zinc-300",
                        )}>
                        {label}
                      </span>
                    </span>

                    {holder ? (
                      <GuitarArt
                        view={holder}
                        className='h-24 w-full'
                        withLevel
                      />
                    ) : (
                      <span className='flex h-24 w-full items-center justify-center'>
                        <Guitar size={26} className='text-zinc-700' />
                      </span>
                    )}

                    <span className='flex min-w-0 flex-col gap-0.5'>
                      {holder ? (
                        <>
                          <span
                            className='break-words text-xs font-semibold leading-snug'
                            style={{ color: holder.color }}>
                            {holder.name}
                          </span>
                          <span className='text-[11px] text-zinc-500'>
                            {active ? "Already here" : "Gets replaced"}
                          </span>
                        </>
                      ) : (
                        <span className='text-[11px] text-zinc-500'>Empty</span>
                      )}
                    </span>
                  </button>

                  {active && (
                    <button
                      type='button'
                      onClick={() => onRemove(target)}
                      aria-label={`Take out of ${label}`}
                      title={`Take out of ${label}`}
                      className='absolute right-2 top-2 rounded p-1.5 text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-red-500/10 hover:text-red-400'>
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
