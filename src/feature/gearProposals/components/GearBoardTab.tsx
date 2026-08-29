import { Button } from "assets/components/ui/button";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { GearProposalCard } from "feature/gearProposals/components/GearProposalCard";
import { PROPOSE_GEAR_HREF } from "feature/gearProposals/constants/gearProposal.constants";
import {
  useGearBoard,
  useGearMutations,
} from "feature/gearProposals/hooks/useGearBoard";
import type { ProposalStatus } from "feature/gearProposals/types/gearProposal.types";
import {
  GEAR_BACK_COST,
  GEAR_PROPOSAL_COST,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { Guitar, Plus } from "lucide-react";
import Link from "next/link";

const BoardSkeleton = () => (
  <div className='space-y-8'>
    <div className='space-y-3'>
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className='h-40 animate-pulse rounded-lg bg-zinc-900/40'
        />
      ))}
    </div>
  </div>
);

/**
 * The way onto the proposal page — or, when the wallet is short, why there
 * isn't one. A dead button saying "Propose gear" left people clicking at
 * nothing, so the price is what the button says instead.
 */
const ProposeGearButton = ({
  affordable,
  className,
}: {
  affordable: boolean;
  className?: string;
}) =>
  affordable ? (
    <Button asChild className={className}>
      <Link href={PROPOSE_GEAR_HREF}>
        <span className='flex items-center gap-2'>
          <Plus size={16} />
          Propose gear
        </span>
      </Link>
    </Button>
  ) : (
    <Button disabled className={className}>
      <span className='flex items-center gap-2'>
        <SupportToken size={18} />
        {GEAR_PROPOSAL_COST} to propose
      </span>
    </Button>
  );

/**
 * Gear the community wants in the Arsenal. Same currency and same ceiling as
 * the roadmap; what differs is that a proposal is a spec, not a wish — which is
 * why writing one happens on its own page rather than in a box over this list.
 */
export const GearBoardTab = ({ enabled }: { enabled: boolean }) => {
  const { data: board, isLoading } = useGearBoard(enabled);
  const { back, changeStatus } = useGearMutations();

  if (isLoading || !board) return <BoardSkeleton />;

  const tokensLeft = board.wallet.left;
  const busy = back.isPending || changeStatus.isPending;

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <p className='text-sm text-zinc-400'>
          Gear you want to see in the Arsenal —{" "}
          <SupportToken size={18} className='inline-block align-middle' />{" "}
          {GEAR_BACK_COST} a push,{" "}
          <SupportToken size={18} className='inline-block align-middle' />{" "}
          {GEAR_PROPOSAL_COST} to put one up. What rises here is what gets drawn
          next.
        </p>
        <ProposeGearButton affordable={tokensLeft >= GEAR_PROPOSAL_COST} />
      </div>

      {board.proposals.length === 0 ? (
        <div className='flex flex-col items-center rounded-lg bg-zinc-900/40 px-6 py-20 text-center'>
          <span className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-400'>
            <Guitar size={26} />
          </span>
          <h3 className='mb-2 text-lg font-bold text-zinc-100'>
            No gear proposed yet
          </h3>
          <p className='max-w-sm text-sm text-zinc-400'>
            Name it, pick its rarity, say what it breaks down into — and leave
            your line on it.
          </p>
          <ProposeGearButton
            affordable={tokensLeft >= GEAR_PROPOSAL_COST}
            className='mt-7'
          />
        </div>
      ) : (
        <div className='space-y-3'>
          {board.proposals.map((proposal) => (
            <GearProposalCard
              key={proposal.id}
              proposal={proposal}
              mine={board.myBacking[proposal.id] ?? 0}
              myUid={board.myUid}
              tokensLeft={tokensLeft}
              busy={busy}
              isOwner={board.isOwner}
              onBack={() => back.mutate({ proposalId: proposal.id, amount: 1 })}
              onStatusChange={(status: ProposalStatus) =>
                changeStatus.mutate({ proposalId: proposal.id, status })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
