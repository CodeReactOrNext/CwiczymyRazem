import { Button } from "assets/components/ui/button";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { GearProposalCard } from "feature/gearProposals/components/GearProposalCard";
import { PROPOSE_GEAR_HREF } from "feature/gearProposals/constants/gearProposal.constants";
import {
  useGearBoard,
  useGearMutations,
} from "feature/gearProposals/hooks/useGearBoard";
import type {
  GearProposal,
  ProposalStatus,
} from "feature/gearProposals/types/gearProposal.types";
import { groupProposals } from "feature/gearProposals/utils/gearProposal.utils";
import { GEAR_PROPOSAL_COST } from "feature/supporterPanel/constants/supporterPanel.constants";
import { Guitar, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

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

/** What a button costs, sitting on the button — not in a sentence above it. */
const Price = ({ cost }: { cost: number }) => (
  <span className='ml-1 inline-flex items-center gap-1 rounded bg-zinc-900/10 px-1.5 py-0.5 text-sm font-bold tabular-nums'>
    <SupportToken size={16} />
    {cost}
  </span>
);

/**
 * The way onto the proposal page, with its price on it. When the wallet is
 * short the same button stays, disabled, and says what is missing — a dead
 * button with no reason left people clicking at nothing.
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
          <Price cost={GEAR_PROPOSAL_COST} />
        </span>
      </Link>
    </Button>
  ) : (
    <Button
      disabled
      title='Not enough tokens left to propose gear'
      className={className}>
      <span className='flex items-center gap-2'>
        <Plus size={16} />
        Propose gear
        <Price cost={GEAR_PROPOSAL_COST} />
      </span>
    </Button>
  );

/** One part of the board: still being voted on, shipped, or turned down. */
const Section = ({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) => (
  <section className='space-y-4'>
    <h3 className='flex items-center gap-2.5 text-lg font-bold text-zinc-100'>
      {title}
      <span className='rounded bg-zinc-800/60 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-400'>
        {count}
      </span>
    </h3>
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>{children}</div>
  </section>
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
  const { voting, shipped, declined } = groupProposals(board.proposals);

  const renderCard = (proposal: GearProposal) => (
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
  );

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <p className='text-sm text-zinc-400'>
          The most-backed gear is drawn into the Arsenal next.
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
          <ProposeGearButton
            affordable={tokensLeft >= GEAR_PROPOSAL_COST}
            className='mt-7'
          />
        </div>
      ) : (
        <div className='space-y-12'>
          {/* Nothing open is said by the Propose button above, not a box. */}
          {voting.length > 0 && (
            <Section title='Up for a vote' count={voting.length}>
              {voting.map(renderCard)}
            </Section>
          )}

          {shipped.length > 0 && (
            <Section title='In the game' count={shipped.length}>
              {shipped.map(renderCard)}
            </Section>
          )}

          {declined.length > 0 && (
            <Section title='Not doing' count={declined.length}>
              {declined.map(renderCard)}
            </Section>
          )}
        </div>
      )}
    </div>
  );
};
