import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import {
  getCandidate,
  perSupporterLine,
} from "feature/communityGoal/data/goalCatalog";
import {
  useCommunityGoal,
  useCommunityGoalMutations,
} from "feature/communityGoal/hooks/useCommunityGoal";
import { GOAL_VOTE_COST } from "feature/supporterPanel/constants/supporterPanel.constants";

/**
 * Next week's ballot. One token, one push — supporters are buying which goal
 * the whole app plays for, never how much it pays out.
 *
 * Every number on a row says what it is in the same breath: the target is
 * divided down to what it asks of one supporter, and the tally is counted in
 * votes rather than left as a bare figure beside a coin.
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
            className='h-20 animate-pulse rounded-lg bg-zinc-900/40'
          />
        ))}
      </div>
    );
  }

  const supporters = data.ballot.supporters;
  const leader = Math.max(
    ...data.ballot.options.map((option) => option.tokens),
    0,
  );

  return (
    <div className='space-y-3'>
      {data.ballot.options.map((option) => {
        const isLeading = leader > 0 && option.tokens === leader;
        const share = perSupporterLine(
          option.target,
          supporters,
          getCandidate(option.candidateId).metric,
        );
        const footnote = [
          isLeading ? "leading the vote" : null,
          option.mine > 0 ? `${option.mine} from you` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <button
            key={option.candidateId}
            type='button'
            disabled={vote.isPending || tokensLeft < GOAL_VOTE_COST}
            onClick={() => vote.mutate(option.candidateId)}
            className={cn(
              "flex w-full items-center gap-5 rounded-lg p-5 text-left transition-background",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-50",
              isLeading
                ? "bg-cyan-500/10 hover:bg-cyan-500/15"
                : "bg-zinc-900/40 hover:bg-zinc-900/60",
            )}>
            <div className='min-w-0 flex-1'>
              <p className='font-bold text-zinc-100'>{option.label}</p>
              <p className='mt-1 text-sm text-zinc-400'>{option.blurb}</p>
              {share && (
                <p className='mt-2 text-xs text-zinc-500'>
                  {option.target} {option.unit} in one week — {share}
                </p>
              )}
            </div>

            <div className='flex shrink-0 flex-col items-end gap-1'>
              <span
                className={cn(
                  "flex items-center gap-1.5 text-sm font-bold tabular-nums",
                  isLeading ? "text-cyan-400" : "text-zinc-300",
                )}>
                <SupportToken size={20} />
                {option.tokens} {option.tokens === 1 ? "vote" : "votes"}
              </span>
              {footnote && (
                <span className='text-[11px] text-zinc-500'>{footnote}</span>
              )}
            </div>
          </button>
        );
      })}

      <p className='pt-2 text-xs leading-relaxed text-zinc-500'>
        Every target above is what that goal would ask for if next week opened
        today — a stretch over the best week{" "}
        {supporters === 1
          ? "the one supporter has"
          : `the ${supporters} supporters have`}{" "}
        had recently, and only practice logged by a supporter counts towards it.
        It settles for real on Monday.
      </p>

      <p className='text-xs text-zinc-500'>
        {tokensLeft < GOAL_VOTE_COST ? (
          "Out of tokens — the ballot stays open, and the next donation buys more."
        ) : (
          <>
            <SupportToken size={18} className='inline-block align-middle' />{" "}
            {GOAL_VOTE_COST} token = 1 vote. The option carrying the most votes
            on Monday becomes next week&apos;s goal for the whole app.
          </>
        )}
      </p>
    </div>
  );
};
