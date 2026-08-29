import { cn } from "assets/lib/utils";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import {
  RARITY_STYLES,
  RarityBadge,
} from "feature/arsenal/components/RarityBadge";
import { TierPlate } from "feature/arsenal/components/TierPlate";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import {
  renderEffectIcon,
  renderKindIcon,
} from "feature/gearProposals/constants/gearIcons";
import type {
  GearProposal,
  ProposalStatus,
} from "feature/gearProposals/types/gearProposal.types";
import { PROPOSAL_STATUSES } from "feature/gearProposals/types/gearProposal.types";
import { BackerRow } from "feature/supporterPanel/components/BackerRow";
import { VotePill } from "feature/supporterPanel/components/VotePill";
import { MAX_BACKING_PER_GEAR } from "feature/supporterPanel/constants/supporterPanel.constants";
import { ImageOff, Wrench } from "lucide-react";
import { useState } from "react";

const STATUS_LABEL: Record<ProposalStatus, string> = {
  open: "Open",
  accepted: "Accepted",
  in_game: "In the game",
  declined: "Not doing",
};

const STATUS_TONE: Record<ProposalStatus, string> = {
  open: "bg-zinc-800/60 text-zinc-400",
  accepted: "bg-cyan-500/10 text-cyan-400",
  in_game: "bg-emerald-500/10 text-emerald-400",
  declined: "bg-zinc-800/40 text-zinc-600",
};

/**
 * The proposal's picture, sitting in the same hollow every owned thing in the
 * Arsenal sits in — lit by the rarity being asked for. A link somebody typed can
 * 404 at any time, so a failed load falls back to the gear's own silhouette
 * rather than the browser's broken-image glyph.
 */
const GearPlate = ({
  proposal,
  color,
}: {
  proposal: GearProposal;
  color: string;
}) => {
  const [failed, setFailed] = useState(false);
  const showArt = proposal.imageUrl && !failed;

  return (
    <TierPlate color={color} size={104} className='shrink-0'>
      {showArt ? (
        <img
          src={proposal.imageUrl!}
          alt=''
          loading='lazy'
          // Somebody else's host; no need to tell them where it is being viewed.
          referrerPolicy='no-referrer'
          onError={() => setFailed(true)}
          className='h-[88px] w-[88px] object-contain'
        />
      ) : (
        <span style={{ color: `${color}80` }}>
          {proposal.imageUrl ? (
            <ImageOff size={22} />
          ) : (
            renderKindIcon(proposal.kind, 26)
          )}
        </span>
      )}
    </TierPlate>
  );
};

/**
 * The engraving, drawn as what it is: a line cut into metal. Inset shadow above,
 * a highlight below, the proposer's name stamped under it — this is the part of
 * a proposal that outlives the vote, so it gets the one treatment on the card
 * that nothing else has.
 */
const Engraving = ({ line, author }: { line: string; author: string }) => (
  <div
    className='rounded-lg bg-zinc-950/60 px-4 py-3'
    style={{
      boxShadow:
        "inset 0 1px 2px rgba(0,0,0,0.9), inset 0 -1px 0 rgba(255,255,255,0.04)",
    }}>
    <p className='text-sm italic leading-relaxed text-amber-300/90'>“{line}”</p>
    <p className='mt-1.5 text-[10px] tracking-[0.15em] text-zinc-600'>
      engraved by {author}
    </p>
  </div>
);

interface GearProposalCardProps {
  proposal: GearProposal;
  mine: number;
  myUid: string;
  tokensLeft: number;
  busy: boolean;
  isOwner: boolean;
  onBack: () => void;
  onStatusChange: (status: ProposalStatus) => void;
}

export const GearProposalCard = ({
  proposal,
  mine,
  myUid,
  tokensLeft,
  busy,
  isOwner,
  onBack,
  onStatusChange,
}: GearProposalCardProps) => {
  const styles = RARITY_STYLES[proposal.rarity];

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-lg bg-zinc-900/40 transition-background hover:bg-zinc-900/60",
        proposal.status === "declined" && "opacity-60",
      )}>
      {/* The rarity says itself in the card's own light, not just in a chip. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
          styles.bg,
        )}
      />
      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r",
          styles.rpgGradient,
        )}
      />

      <div className='relative flex gap-4 p-5'>
        <VotePill
          total={proposal.voteCount}
          mine={mine}
          max={MAX_BACKING_PER_GEAR}
          tokensLeft={tokensLeft}
          busy={busy}
          what='piece of gear'
          accent={styles.baseColor}
          onBack={onBack}
        />

        <GearPlate proposal={proposal} color={styles.baseColor} />

        <div className='min-w-0 flex-1 space-y-3'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h3 className='text-base font-bold text-zinc-100'>
                {proposal.name}
              </h3>
              {proposal.brand && (
                <p className='text-xs tracking-wide text-zinc-500'>
                  {proposal.brand}
                </p>
              )}
            </div>

            {isOwner ? (
              <select
                aria-label='Proposal status'
                value={proposal.status}
                disabled={busy}
                onChange={(event) =>
                  onStatusChange(event.target.value as ProposalStatus)
                }
                className='rounded bg-zinc-800/60 px-2 py-1 text-xs font-semibold text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800'>
                {PROPOSAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            ) : (
              proposal.status !== "open" && (
                <span
                  className={cn(
                    "rounded px-2.5 py-1 text-[10px] font-black tracking-widest",
                    STATUS_TONE[proposal.status],
                  )}>
                  {STATUS_LABEL[proposal.status]}
                </span>
              )
            )}
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <RarityBadge rarity={proposal.rarity} />

            <span className='inline-flex items-center gap-1.5 rounded bg-zinc-800/50 px-2.5 py-1 text-[10px] font-bold tracking-widest text-zinc-400'>
              {renderKindIcon(proposal.kind, 11)}
              {proposal.kind === "guitar" ? "Guitar" : "Pedal"}
            </span>

            {proposal.effectType && (
              <span className='inline-flex items-center gap-1.5 rounded bg-cyan-950/40 px-2.5 py-1 text-[10px] font-bold tracking-widest text-cyan-400'>
                {renderEffectIcon(proposal.effectType, 11)}
                {proposal.effectType}
              </span>
            )}
          </div>

          {proposal.description && (
            <p className='whitespace-pre-line text-sm leading-relaxed text-zinc-400'>
              {proposal.description}
            </p>
          )}

          {proposal.inscription && (
            <Engraving
              line={proposal.inscription}
              author={proposal.authorName}
            />
          )}

          {proposal.scrapBom.length > 0 && (
            <div className='space-y-2'>
              <span className='inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-zinc-500'>
                <Wrench size={11} />
                Breaks down into
              </span>
              <div className='flex flex-wrap items-center gap-3'>
                {proposal.scrapBom.map((slot) => (
                  <span
                    key={slot.partId}
                    title={`${slot.tier} ${getPartLabel(slot.partId)} ×${slot.qty}`}
                    className='flex flex-col items-center gap-1'>
                    {/* Same plate the stash uses, lit by the grade the proposal
                        asks for — so a proposed part reads as the same object
                        as the one already in the game. */}
                    <TierPlate
                      color={PART_TIER_COLORS[slot.tier]}
                      size={38}
                      count={slot.qty > 1 ? slot.qty : undefined}>
                      <PartIcon partId={slot.partId} size={22} />
                    </TierPlate>
                    <span
                      className='text-[10px] font-semibold'
                      style={{ color: PART_TIER_COLORS[slot.tier] }}>
                      {slot.tier}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className='space-y-2'>
            <p className='text-xs text-zinc-500'>{proposal.authorName}</p>
            <BackerRow
              backers={proposal.backers}
              total={proposal.backerCount}
              myUid={myUid}
            />
          </div>
        </div>
      </div>
    </article>
  );
};
