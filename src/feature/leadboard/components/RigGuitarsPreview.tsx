import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { CardModal } from "feature/arsenal/components/CardModal";
import { GuitarCard } from "feature/arsenal/components/GuitarInventory/GuitarCard";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getEffectiveRarity, getItemLevel } from "feature/arsenal/data/itemStats";
import type {
  ArsenalUserData,
  GuitarDefinition,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { useTranslation } from "hooks/useTranslation";
import { Guitar } from "lucide-react";
import { useState } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

interface RigGuitarsPreviewProps {
  arsenal?: Partial<ArsenalUserData>;
}

const RigGuitarTile = ({
  item,
  guitar,
}: {
  item: InventoryItem;
  guitar: GuitarDefinition;
}) => {
  const { t } = useTranslation("leadboard");
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [open, setOpen] = useState(false);
  // The workshop can promote a guitar past its mint rarity — show what it is now.
  const rs = RARITY_STYLES[getEffectiveRarity(guitar.rarity, item.buildLevel)];
  const level = getItemLevel(item, guitar);

  const tile = (
    // Flat tile: the rarity is a faint tint of the face, not a glow or a ring —
    // the guitar is what the eye should land on.
    // Flat tile: the rarity is a faint tint of the face, not a glow or a ring —
    // the guitar is what the eye should land on.
    <div className='relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-zinc-800/40 transition-colors duration-base hover:bg-zinc-800/70'>
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0'
        style={{ backgroundColor: `${rs.baseColor}1a` }}
      />
      <img
        src={getRankBadgeSrc(guitar.imageId, "small")}
        alt={`${guitar.brand} ${guitar.name}`}
        className='relative h-8 w-8 -rotate-45 object-contain'
        draggable={false}
      />
      <span
        className='absolute bottom-0.5 right-0.5 rounded bg-zinc-950/80 px-1 py-0.5 text-[10px] font-semibold tabular-nums leading-none text-zinc-200'
        title={t("rig.guitar_level")}>
        {level}
      </span>
    </div>
  );

  // Touch devices: tap opens the card in a centered modal (hover tooltips don't fire).
  if (isMobile) {
    return (
      <>
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}>
          {tile}
        </span>
        {open && (
          <CardModal onClose={() => setOpen(false)}>
            <GuitarCard item={item} readOnly />
          </CardModal>
        )}
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>{tile}</TooltipTrigger>
        <TooltipContent className='p-0 border-0 bg-transparent shadow-2xl' side='top'>
          <div style={{ width: 250 }}>
            <GuitarCard item={item} readOnly />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** Compact strip of the three rig guitar slots for gear-leaderboard rows. */
export const RigGuitarsPreview = ({ arsenal }: RigGuitarsPreviewProps) => {
  const { t } = useTranslation("leadboard");
  const slotItems = [0, 1, 2].map((i) => {
    const slotId = arsenal?.rig?.guitarSlots?.[i] ?? null;
    return slotId
      ? arsenal?.inventory?.find((item) => item.id === slotId) ?? null
      : null;
  });

  return (
    <div className='flex items-center gap-1.5'>
      {slotItems.map((item, i) => {
        const guitar = item ? GUITARS_BY_ID.get(item.guitarId) : null;

        if (!item || !guitar) {
          return (
            <div
              key={i}
              className='flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900/40'
              title={t("rig.empty_slot", { n: i + 1 })}>
              <Guitar className='h-4 w-4 text-zinc-700' />
            </div>
          );
        }

        return <RigGuitarTile key={i} item={item} guitar={guitar} />;
      })}
    </div>
  );
};
