import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Archive, Lock, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useResponsiveStore } from "store/useResponsiveStore";

import type { GuitarRarity } from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

export interface DexCardProps {
  name: string;
  brand: string;
  rarity: GuitarRarity;
  imageSrc: string;
  /** Guitar art ships vertical — rotate it to fit the horizontal tile. */
  imageRotated?: boolean;
  /** False = never held by this account (locked silhouette). */
  discovered: boolean;
  /** Copies in the stash right now. 0 on a discovered entry = sold, scrapped or listed. */
  ownedCount: number;
  /** Full item card shown on hover (desktop) or tap (mobile) for entries still owned. */
  preview?: ReactNode;
}

/** Centered, tap-to-dismiss preview used on touch devices where hover tooltips don't fire. */
const PreviewModal = ({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) => {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}>
      <div
        className='relative w-full max-w-[300px]'
        onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label='Close preview'
          className='absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
          <X size={15} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

export const DexCard = ({
  name,
  brand,
  rarity,
  imageSrc,
  imageRotated = false,
  discovered,
  ownedCount,
  preview,
}: DexCardProps) => {
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [previewOpen, setPreviewOpen] = useState(false);
  const rs = RARITY_STYLES[rarity];
  // Discovery is the record; the stash is what the player holds today. An entry
  // can be one without the other — a sold guitar stays revealed, just faded.
  const inStash = ownedCount > 0;
  const hasPreview = inStash && preview != null;

  const tile = (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg p-3",
        !discovered && "bg-zinc-900/40 transition-colors hover:bg-zinc-800/40",
        hasPreview && "cursor-pointer"
      )}
      style={
        discovered
          ? {
              background: `linear-gradient(160deg, ${rs.baseColor}${
                inStash ? "2e" : "17"
              } 0%, rgba(17,17,22,0.92) 60%)`,
            }
          : undefined
      }
      title={
        discovered
          ? inStash
            ? undefined
            : "Discovered — no copy in your stash right now"
          : "Not discovered yet — open cases to find it"
      }>
      {/* Copy count / gone from the stash / lock */}
      <div className='relative z-10 flex h-5 items-center justify-end'>
        {!discovered && <Lock size={12} className='text-zinc-600' />}
        {discovered && !inStash && <Archive size={12} className='text-zinc-600' />}
        {discovered && ownedCount > 1 && (
          <span className='rounded bg-zinc-950/60 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300'>
            ×{ownedCount}
          </span>
        )}
      </div>

      {/* Art with rarity glow backdrop */}
      <div className='relative flex h-24 items-center justify-center'>
        <div
          className={cn(
            "absolute h-16 w-16 rounded-full blur-[20px] transition-opacity",
            discovered && "opacity-70 group-hover:opacity-100"
          )}
          style={{
            background: discovered
              ? `radial-gradient(circle at center, ${rs.baseColor}66 0%, ${rs.baseColor}1f 50%, transparent 75%)`
              : `radial-gradient(circle at center, ${rs.baseColor}30 0%, transparent 70%)`,
          }}
        />
        <img
          src={imageSrc}
          alt={discovered ? `${brand} ${name}` : "Undiscovered item silhouette"}
          className={cn(
            "relative z-10 h-24 w-24 object-contain",
            imageRotated && "-rotate-90",
            discovered && !inStash && "opacity-55"
          )}
          style={discovered ? undefined : { filter: "brightness(0) invert(0.22)" }}
          draggable={false}
          loading='lazy'
        />
      </div>

      {/* Name — hidden until discovered, Pokédex style */}
      <div className='relative z-10 mt-2 min-w-0 text-center'>
        {discovered ? (
          <>
            <p
              className={cn(
                "truncate text-xs font-bold",
                inStash ? "text-zinc-100" : "text-zinc-400"
              )}>
              {name}
            </p>
            <p
              className='mt-0.5 truncate text-[10px] font-semibold'
              style={{ color: rs.baseColor, opacity: inStash ? 1 : 0.7 }}>
              {brand}
            </p>
          </>
        ) : (
          <>
            <p className='text-xs font-bold text-zinc-500'>???</p>
            <p
              className='mt-0.5 text-[10px] font-semibold'
              style={{ color: rs.baseColor, opacity: 0.6 }}>
              {rarity}
            </p>
          </>
        )}
      </div>
    </div>
  );

  if (!hasPreview) return tile;

  // Touch devices: tap opens the full card in a centered modal (hover tooltips don't fire).
  if (isMobile) {
    return (
      <>
        <div onClick={() => setPreviewOpen(true)}>{tile}</div>
        {previewOpen && (
          <PreviewModal onClose={() => setPreviewOpen(false)}>
            {preview}
          </PreviewModal>
        )}
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>{tile}</TooltipTrigger>
        <TooltipContent className='border-0 bg-transparent p-0' side='top'>
          <div style={{ width: 250 }}>{preview}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
