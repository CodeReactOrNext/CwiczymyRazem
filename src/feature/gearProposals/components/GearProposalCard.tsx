import { cn } from "assets/lib/utils";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import { ProposedItemCard } from "feature/gearProposals/components/ProposedItemCard";
import type {
  GearProposal,
  ProposalStatus,
} from "feature/gearProposals/types/gearProposal.types";
import { PROPOSAL_STATUSES } from "feature/gearProposals/types/gearProposal.types";
import { isVotingOpen } from "feature/gearProposals/utils/gearProposal.utils";
import { BackerRow } from "feature/supporterPanel/components/BackerRow";
import { ClampedText } from "feature/supporterPanel/components/ClampedText";
import { VotePill } from "feature/supporterPanel/components/VotePill";
import {
  GEAR_BACK_COST,
  MAX_BACKING_PER_GEAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { Hourglass } from "lucide-react";

const STATUS_LABEL: Record<ProposalStatus, string> = {
  open: "Open",
  accepted: "Accepted",
  in_game: "In the game",
  declined: "Not doing",
};

/**
 * The engraving, drawn as what it is: a line cut into metal. Inset shadow above,
 * a highlight below — this is the part of a proposal that outlives the vote, so
 * it gets the one treatment on the card that nothing else has.
 */
const Engraving = ({ line }: { line: string }) => (
  <p
    className='rounded bg-zinc-950/60 px-3 py-2 text-sm italic leading-relaxed text-amber-300/90'
    style={{
      boxShadow:
        "inset 0 1px 2px rgba(0,0,0,0.9), inset 0 -1px 0 rgba(255,255,255,0.04)",
    }}>
    “{line}”
  </p>
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

/**
 * One proposal, as one item card. The section it sits in already says whether
 * it shipped, so the card does not say it again — it only carries what differs
 * from one proposal to the next: the gear, the pitch, the people, the count.
 */
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
    <ProposedItemCard
      proposal={proposal}
      dimmed={proposal.status === "declined"}
      className={cn(proposal.status === "declined" && "opacity-70")}
      stamp={
        // The one decided state that shares a section with open proposals.
        proposal.status === "accepted" && (
          <span className='inline-flex items-center gap-1 rounded bg-cyan-500/15 px-2 py-1 text-xs font-semibold text-cyan-300'>
            <Hourglass size={12} />
            Accepted
          </span>
        )
      }>
      {proposal.description && (
        <ClampedText text={proposal.description} fold={140} />
      )}

      {proposal.inscription && <Engraving line={proposal.inscription} />}

      <BackerRow
        backers={proposal.backers}
        total={proposal.backerCount}
        myUid={myUid}
      />

      <div className='mt-auto flex items-center gap-2'>
        <VotePill
          wide
          total={proposal.voteCount}
          mine={mine}
          max={MAX_BACKING_PER_GEAR}
          tokensLeft={tokensLeft}
          busy={busy}
          what='piece of gear'
          name={proposal.name}
          accent={styles.baseColor}
          cost={GEAR_BACK_COST}
          closed={!isVotingOpen(proposal.status)}
          onBack={onBack}
        />

        {isOwner && (
          <select
            aria-label='Proposal status'
            value={proposal.status}
            disabled={busy}
            onChange={(event) =>
              onStatusChange(event.target.value as ProposalStatus)
            }
            className='shrink-0 rounded bg-zinc-800/60 px-2 py-2.5 text-xs font-semibold text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800'>
            {PROPOSAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        )}
      </div>
    </ProposedItemCard>
  );
};
