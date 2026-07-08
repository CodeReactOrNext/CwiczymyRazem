import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { GuitarCard } from "feature/arsenal/components/GuitarInventory/GuitarCard";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getItemLevel } from "feature/arsenal/data/itemStats";
import type {
  ArsenalUserData,
  GuitarDefinition,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { Guitar, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useResponsiveStore } from "store/useResponsiveStore";

interface RigGuitarsPreviewProps {
  arsenal?: Partial<ArsenalUserData>;
}

/** Centered, tap-to-dismiss modal used on touch devices where hover tooltips don't fire. */
const CardModal = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}>
      <div className='relative w-full max-w-[320px]' onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label='Close'
          className='absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-zinc-300 shadow-lg hover:text-white'>
          <X size={15} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

const RigGuitarTile = ({
  item,
  guitar,
}: {
  item: InventoryItem;
  guitar: GuitarDefinition;
}) => {
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [open, setOpen] = useState(false);
  const rs = RARITY_STYLES[guitar.rarity];
  const level = getItemLevel(item, guitar);

  const tile = (
    <div
      className='group/tile relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-xl transition-transform duration-200 hover:scale-105'
      style={{
        background: `linear-gradient(175deg, ${rs.baseColor}22 0%, #0c0c10 45%, #0c0c10 100%)`,
        boxShadow: `inset 0 0 0 1px ${rs.baseColor}55, 0 2px 8px rgba(0,0,0,0.5)`,
      }}>
      {/* Rarity glow backdrop */}
      <div
        className='pointer-events-none absolute h-12 w-12 translate-y-2 rounded-full blur-[16px]'
        style={{
          background: `radial-gradient(circle at center, ${rs.baseColor}70 0%, ${rs.baseColor}20 50%, transparent 75%)`,
        }}
      />
      <img
        src={getRankBadgeSrc(guitar.imageId, "small")}
        alt={`${guitar.brand} ${guitar.name}`}
        className='relative z-10 h-[52px] w-[52px] -rotate-45 object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.7)]'
        draggable={false}
      />
      {/* Guitar level badge */}
      <div
        className='absolute bottom-1 right-1 z-20 flex items-center justify-center rounded text-xs font-black leading-none text-white'
        style={{
          minWidth: 22,
          height: 18,
          padding: "0 4px",
          background: "#0d0d10",
          border: `1px solid ${rs.baseColor}`,
        }}
        title='Guitar level'>
        {level}
      </div>
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
  const slotItems = [0, 1, 2].map((i) => {
    const slotId = arsenal?.rig?.guitarSlots?.[i] ?? null;
    return slotId
      ? arsenal?.inventory?.find((item) => item.id === slotId) ?? null
      : null;
  });

  return (
    <div className='flex items-center gap-2'>
      {slotItems.map((item, i) => {
        const guitar = item ? GUITARS_BY_ID.get(item.guitarId) : null;

        if (!item || !guitar) {
          return (
            <div
              key={i}
              className='flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-white/10 bg-zinc-900/30'
              title={`Empty slot ${i + 1}`}>
              <Guitar className='h-4 w-4 text-zinc-700' />
            </div>
          );
        }

        return <RigGuitarTile key={i} item={item} guitar={guitar} />;
      })}
    </div>
  );
};
