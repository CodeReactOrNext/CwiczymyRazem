import { cn } from "assets/lib/utils";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import {
  PLATE_NOISE_BG,
  TierPlate,
} from "feature/arsenal/components/TierPlate";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import { renderKindIcon } from "feature/gearProposals/constants/gearIcons";
import type { GearProposal } from "feature/gearProposals/types/gearProposal.types";
import { ImageOff, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

const CARD_BG = "#111116";

/**
 * A proposal drawn as the item it asks to become — the same frame, grain, grid,
 * stripe and spotlight the Arsenal's own `EffectCard` and `GuitarCard` wear in
 * every tooltip. Seeing the card it would be is what makes a proposal read as
 * gear rather than as a forum post with a picture.
 *
 * There is no inventory item behind it, so the parts of those cards that
 * describe a copy (condition, level, serial, traits) are left out; what is
 * left is what the proposal actually specifies.
 */
export const ProposedItemCard = ({
  proposal,
  stamp,
  dimmed = false,
  className,
  children,
}: {
  proposal: GearProposal;
  /** A mark across the art, for a proposal that has been decided. */
  stamp?: ReactNode;
  /** A turned-down proposal: the light is off. */
  dimmed?: boolean;
  className?: string;
  /** The rest of the proposal — pitch, backers, the vote — inside the frame. */
  children?: ReactNode;
}) => {
  const [failed, setFailed] = useState(false);
  const rs = RARITY_STYLES[proposal.rarity];
  const showArt = proposal.imageUrl && !failed;
  const typeLabel =
    proposal.kind === "guitar" ? "Guitar" : (proposal.effectType ?? "Pedal");

  return (
    <div
      className={cn("relative flex h-full flex-col overflow-hidden", className)}
      style={{
        borderRadius: 10,
        backgroundColor: CARD_BG,
        backgroundImage: `linear-gradient(160deg, ${rs.baseColor}35 0%, ${CARD_BG} 55%)`,
        border: `1px solid ${rs.baseColor}28`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
      }}>
      {/* Grain */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 z-0'
        style={{
          backgroundImage: PLATE_NOISE_BG,
          backgroundSize: "180px 180px",
          opacity: 0.035,
          mixBlendMode: "overlay",
        }}
      />
      {/* Structural grid */}
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

      <div
        aria-hidden
        className='h-[2px] w-full flex-shrink-0'
        style={{
          background: `linear-gradient(90deg, transparent, ${rs.baseColor}, transparent)`,
        }}
      />

      {/* Brand + name + rarity · type */}
      <div className='relative z-10 px-3.5 pb-2 pt-3.5'>
        {proposal.brand && (
          <p
            className='text-[11px] font-semibold leading-none tracking-wide'
            style={{ color: rs.baseColor }}>
            {proposal.brand}
          </p>
        )}
        <p className='mt-1.5 text-base font-extrabold leading-tight text-white'>
          {proposal.name}
        </p>
        <p className='mt-1 text-xs font-medium' style={{ color: rs.baseColor }}>
          {proposal.rarity} · {typeLabel}
          <span className='text-zinc-500'> · by {proposal.authorName}</span>
        </p>
      </div>

      {/* Art */}
      <div className='relative flex h-[170px] items-center justify-center overflow-hidden'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 z-0'
          style={{
            background:
              "radial-gradient(60% 55% at 50% 48%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, transparent 72%)",
          }}
        />
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 z-0 flex translate-y-[50px] items-center justify-center'
          style={{ opacity: dimmed ? 0.15 : 0.5 }}>
          <div
            className='absolute h-[170px] w-[170px] rounded-full blur-[34px]'
            style={{
              background: `radial-gradient(circle at center, ${rs.baseColor}66 0%, ${rs.baseColor}1f 45%, transparent 72%)`,
            }}
          />
        </div>

        {showArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proposal.imageUrl!}
            alt={proposal.name}
            loading='lazy'
            // Somebody else's host; no need to tell them where it is being viewed.
            referrerPolicy='no-referrer'
            onError={() => setFailed(true)}
            className='relative z-10 max-h-[140px] max-w-[180px] rounded object-contain'
            style={{
              filter: dimmed
                ? "grayscale(1) brightness(0.6)"
                : "drop-shadow(0 4px 10px rgba(0,0,0,0.3))",
            }}
          />
        ) : (
          <span
            className='relative z-10'
            style={{ color: `${rs.baseColor}80` }}>
            {proposal.imageUrl ? (
              <ImageOff size={32} />
            ) : (
              renderKindIcon(proposal.kind, 48)
            )}
          </span>
        )}

        {/* A pedal's LED — lit unless the proposal was turned down. */}
        {proposal.kind === "effect" && (
          <div
            aria-hidden
            className='absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full'
            style={{
              width: 6,
              height: 6,
              backgroundColor: dimmed ? "#27272a" : rs.baseColor,
              boxShadow: dimmed
                ? "inset 0 0 2px rgba(0,0,0,0.9)"
                : `0 0 8px 2px ${rs.baseColor}80`,
            }}
          />
        )}

        {stamp && (
          <div className='absolute right-2.5 top-2.5 z-20'>{stamp}</div>
        )}
      </div>

      {/* Payout: the stash's own plates, one per part, lit by grade. */}
      {proposal.scrapBom.length > 0 && (
        <div className='relative z-10 flex flex-wrap items-center gap-2 px-4 pb-1 pt-3'>
          <Wrench
            size={13}
            aria-label='Scraps into'
            className='mr-0.5 text-zinc-500'>
            <title>Scraps into</title>
          </Wrench>
          {proposal.scrapBom.map((slot) => (
            <span
              key={slot.partId}
              title={`${slot.tier} ${getPartLabel(slot.partId)} ×${slot.qty}`}>
              <TierPlate
                color={PART_TIER_COLORS[slot.tier]}
                size={32}
                count={slot.qty > 1 ? slot.qty : undefined}>
                <PartIcon partId={slot.partId} size={20} />
              </TierPlate>
            </span>
          ))}
        </div>
      )}

      {children && (
        <div className='relative z-10 flex flex-1 flex-col gap-4 p-4'>
          {children}
        </div>
      )}
    </div>
  );
};
