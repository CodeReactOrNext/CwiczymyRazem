import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Archive, CheckCircle2, Lock, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useResponsiveStore } from "store/useResponsiveStore";

import type { GuitarRarity } from "../../types/arsenal.types";
import { formatSlotNumber } from "../../utils/dexWall";
import { RARITY_STYLES } from "../RarityBadge";

export interface DexCardProps {
  /** Slot number on the wall — the catalog position, not the page position. */
  number: number;
  name: string;
  brand: string;
  rarity: GuitarRarity;
  imageSrc: string;
  /** Guitar art ships horizontal — stand it up to hang on the wall. */
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
          className='absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-700 hover:text-white'>
          <X size={15} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
};

/** The four corner brackets that light up on the slot under the pointer. */
const CornerBrackets = () => (
  <>
    {(
      [
        "left-1.5 top-1.5 border-l-2 border-t-2 rounded-tl",
        "right-1.5 top-1.5 border-r-2 border-t-2 rounded-tr",
        "bottom-1.5 left-1.5 border-b-2 border-l-2 rounded-bl",
        "bottom-1.5 right-1.5 border-b-2 border-r-2 rounded-br",
      ] as const
    ).map((pos) => (
      <span
        key={pos}
        aria-hidden
        className={cn(
          "pointer-events-none absolute h-4 w-4 border-cyan-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100",
          pos,
        )}
      />
    ))}
  </>
);

/**
 * One slot of the display wall: a dark panel with a lamp over it, the
 * instrument hanging in the pool of light, its plate underneath. A locked slot
 * keeps the lamp off and shows only the silhouette.
 */
export const DexCard = ({
  number,
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
    // Outer = the frame of the recess: a bevel that catches the lamp along its
    // top edge and falls into shadow at the foot. Inner = the recess itself,
    // sunk with inset shadows so the instrument hangs inside a box, not on a
    // flat card. Depth is the point here, so this is the one place in the
    // feature that leans on shadows.
    <div
      tabIndex={0}
      className={cn(
        "group relative aspect-[3/5] rounded-md p-[3px] outline-none",
        hasPreview && "cursor-pointer",
        !hasPreview && "cursor-help",
      )}
      style={{
        background:
          "linear-gradient(180deg, #33363c 0%, #24272c 6%, #1a1c20 55%, #0e0f11 100%)",
        boxShadow: "0 10px 22px -12px rgba(0,0,0,0.9)",
      }}>
      <div
        className='relative h-full w-full overflow-hidden rounded-[4px] bg-[#0f1013] transition-colors group-focus-visible:bg-[#131418]'
        style={{
          boxShadow:
            "inset 0 14px 28px rgba(0,0,0,0.85), inset 0 -8px 18px rgba(0,0,0,0.6), inset 6px 0 14px -8px rgba(0,0,0,0.8), inset -6px 0 14px -8px rgba(0,0,0,0.8)",
        }}>
        {/* Lamp and its pool of light. Lit slots get warm tungsten pouring
            down the back wall; a locked slot keeps a dead bulb and a
            barely-there grey wash. */}
        <div
          className='pointer-events-none absolute inset-x-0 top-0 h-4/5'
          style={{
            background: discovered
              ? "radial-gradient(75% 80% at 50% 0%, rgba(255,196,120,0.28) 0%, rgba(255,196,120,0.08) 45%, transparent 75%)"
              : "radial-gradient(70% 75% at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 70%)",
          }}
        />
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-0 h-[3px] w-8 -translate-x-1/2 rounded-b-full",
            discovered
              ? "bg-amber-200 shadow-[0_0_10px_2px_rgba(255,214,150,0.55)]"
              : "bg-zinc-700",
          )}
        />
        {/* Floor of the recess: a faint lighter band the shadow can fall on. */}
        <div className='pointer-events-none absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-white/[0.04] to-transparent' />

        <span className='absolute left-2.5 top-2 text-[11px] font-semibold tabular-nums text-zinc-500'>
          {formatSlotNumber(number)}
        </span>

        {/* The instrument, hung in the light, as tall as the recess allows.
            The art is a square sized by the box's height (max-w-none beats
            preflight's img cap, which would otherwise pin it to the panel's
            width): a stood-up guitar is narrow, so its square may run past
            the sides without the guitar itself being clipped, and its length
            gets the full height. A pedal is nearly square, so it is held to
            the panel's width instead. */}
        <div className='absolute inset-x-0 bottom-[21%] top-[4%] flex items-center justify-center'>
          {discovered && (
            <div
              className='pointer-events-none absolute h-3/4 w-3/4 rounded-full opacity-60 blur-2xl'
              style={{
                background: `radial-gradient(circle at center, ${rs.baseColor}55 0%, ${rs.baseColor}14 55%, transparent 75%)`,
              }}
            />
          )}
          <div className='pointer-events-none absolute bottom-[1%] left-1/2 h-[4%] w-[44%] -translate-x-1/2 rounded-[100%] bg-black/85 blur-[5px]' />
          <img
            src={imageSrc}
            alt={
              discovered ? `${brand} ${name}` : "Undiscovered item silhouette"
            }
            className={cn(
              "relative z-10 aspect-square h-full shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.03]",
              imageRotated ? "max-w-none -rotate-90" : "max-w-[92%]",
            )}
            style={
              discovered ? undefined : { filter: "brightness(0) invert(0.16)" }
            }
            draggable={false}
            loading='lazy'
          />
          {!discovered && (
            <Lock
              size={22}
              className='absolute z-20 text-zinc-500/90'
              aria-hidden
            />
          )}
        </div>

        {/* Plate under the slot. Name hidden until discovered, Pokédex style;
          the rarity stays readable on a locked slot as the one hint given. */}
        <div className='absolute inset-x-6 bottom-2.5 text-center'>
          <p
            className={cn(
              "line-clamp-2 text-[13px] font-semibold leading-tight",
              !discovered && "text-zinc-500",
              discovered && (inStash ? "text-zinc-100" : "text-zinc-400"),
            )}>
            {discovered ? name : "???"}
          </p>
          <p className='mt-1 flex items-center justify-center gap-1.5 text-[11px] font-medium'>
            <span
              className='h-1.5 w-1.5 rounded-full'
              style={{
                backgroundColor: rs.baseColor,
                opacity: discovered ? 1 : 0.5,
              }}
            />
            <span
              style={{
                color: rs.baseColor,
                opacity: discovered ? 0.95 : 0.55,
              }}>
              {rarity}
            </span>
          </p>
        </div>

        {/* Status seal, bottom right: recorded and held, recorded but gone, or nothing. */}
        {discovered && (
          <span className='absolute bottom-2.5 right-2.5 flex items-center gap-1'>
            {ownedCount > 1 && (
              <span className='text-[10px] font-bold tabular-nums text-zinc-400'>
                ×{ownedCount}
              </span>
            )}
            {inStash ? (
              <CheckCircle2
                size={16}
                className='text-cyan-400'
                aria-label='In your stash'
              />
            ) : (
              <Archive
                size={14}
                className='text-zinc-500'
                aria-label='Discovered, not in stash'
              />
            )}
          </span>
        )}

        <CornerBrackets />
      </div>
    </div>
  );

  // Touch devices: tap opens the full card in a centered modal (hover tooltips don't fire).
  if (isMobile) {
    if (!hasPreview) return tile;
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
        {hasPreview ? (
          <TooltipContent className='border-0 bg-transparent p-0' side='top'>
            <div style={{ width: 250 }}>{preview}</div>
          </TooltipContent>
        ) : (
          <TooltipContent
            side='top'
            className='max-w-[15rem] border-zinc-700 bg-zinc-950 p-3'>
            {discovered ? (
              <>
                <p className='text-xs font-bold text-zinc-100'>
                  {brand} {name}
                </p>
                <p className='mt-1 text-[11px] text-zinc-400'>
                  Discovered · permanently recorded. No copy in your stash right
                  now.
                </p>
              </>
            ) : (
              <>
                <p className='text-xs font-bold text-zinc-100'>
                  Slot {formatSlotNumber(number)}
                </p>
                <p className='mt-1 text-[11px] text-zinc-400'>
                  Not discovered yet — open cases to find it.
                </p>
              </>
            )}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
