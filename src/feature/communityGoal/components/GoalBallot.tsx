import { cn } from "assets/lib/utils";
import { GoalIcon } from "feature/communityGoal/components/GoalIcon";
import {
  getCandidate,
  perSupporterShare,
} from "feature/communityGoal/data/goalCatalog";
import {
  useCommunityGoal,
  useCommunityGoalMutations,
} from "feature/communityGoal/hooks/useCommunityGoal";
import { VotePill } from "feature/supporterPanel/components/VotePill";

/**
 * Next week's ballot.
 *
 * Sorted by what is backing each option, so the row at the top is the one that
 * runs on Monday — the order carries the result, and nothing has to be labelled
 * "leading the vote" for it to read that way. What a challenge is, where the
 * targets come from and what a token buys are all spelled out on the Milestones
 * page (`SupportChallengeExplainer`); this is the ballot, so it just votes.
 */
export const GoalBallot = ({ tokensLeft }: { tokensLeft: number }) => {
  const { data, isLoading } = useCommunityGoal();
  const { vote } = useCommunityGoalMutations();

  if (isLoading || !data) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className='h-[104px] animate-pulse rounded-lg bg-zinc-900/40'
          />
        ))}
      </div>
    );
  }

  const supporters = data.ballot.supporters;
  const options = [...data.ballot.options].sort((a, b) => b.tokens - a.tokens);

  return (
    <div className='space-y-3'>
      {options.map((option, index) => {
        const leading = index === 0 && option.tokens > 0;
        const share = perSupporterShare(
          option.target,
          supporters,
          getCandidate(option.candidateId).metric,
        );

        return (
          <div
            key={option.candidateId}
            className={cn(
              "flex items-center gap-4 rounded-lg p-5 transition-background",
              leading ? "bg-cyan-500/10" : "bg-zinc-900/40",
            )}>
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                leading
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "bg-zinc-800/60 text-zinc-400",
              )}>
              <GoalIcon icon={option.icon} />
            </span>

            <div className='min-w-0 flex-1'>
              <p className='font-bold text-zinc-100'>{option.label}</p>
              <p className='mt-1 text-sm text-zinc-400'>{option.blurb}</p>
              {share && <p className='mt-2 text-xs text-zinc-500'>{share}</p>}
            </div>

            <VotePill
              total={option.tokens}
              mine={option.mine}
              // No `max`: nothing caps how much of a wallet may go behind one
              // goal — the ballot buys which target runs, never what it pays.
              tokensLeft={tokensLeft}
              busy={vote.isPending}
              what='goal'
              name={option.label}
              onBack={() => vote.mutate(option.candidateId)}
            />
          </div>
        );
      })}
    </div>
  );
};
