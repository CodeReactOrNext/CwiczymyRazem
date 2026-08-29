import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";
import { GoalIcon } from "feature/guilds/components/GoalIcon";
import { formatAmount, objectiveLine } from "feature/guilds/data/guildMetrics";
import type {
  GuildChallenge,
  GuildObjectiveProgress,
} from "feature/guilds/types/guild.types";
import { Check, Flame } from "lucide-react";

const daysLeft = (endsAt: string): string => {
  const days = Math.ceil(
    (new Date(endsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
  if (!Number.isFinite(days) || days <= 0) return "ends today";
  return days === 1 ? "1 day left" : `${days} days left`;
};

const tenth = (value: number): number =>
  Math.round((Number.isFinite(value) ? value : 0) * 10) / 10;

const percentOf = (progress: number, target: number): number =>
  target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;

/**
 * One goal of the week, drawn three times over: what it asks of every member,
 * where the member themselves stands, and where the guild is.
 *
 * The ask is the headline rather than the guild's number, because the ask is
 * the only part anybody can act on — "2h of technique each" is a plan, "12h of
 * technique" is a scoreboard. The guild's bar sits under it for the same reason
 * the card exists at all: it is the thing the streak is decided on.
 */
const Objective = ({ objective }: { objective: GuildObjectiveProgress }) => {
  const { metric, perMember, target, progress, mine } = objective;

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <p className='flex items-center gap-2 text-sm font-bold text-zinc-100'>
          <GoalIcon
            metric={metric}
            className={objective.isComplete ? "text-emerald-400" : undefined}
          />
          {objectiveLine(metric, perMember)} each
        </p>

        <p
          title={`You have ${formatAmount(metric, mine)} of the ${formatAmount(metric, perMember)} asked of every member`}
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold tabular-nums",
            objective.mineComplete ? "text-emerald-400" : "text-zinc-400",
          )}>
          {objective.mineComplete && <Check size={13} />}
          you {tenth(mine)} / {formatAmount(metric, perMember)}
        </p>
      </div>

      <div className='h-2 overflow-hidden rounded-full bg-zinc-800/60'>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            objective.isComplete ? "bg-emerald-400" : "bg-cyan-400",
          )}
          style={{ width: `${percentOf(progress, target)}%` }}
        />
      </div>

      <p
        className={cn(
          "flex items-center gap-1.5 text-xs tabular-nums",
          objective.isComplete ? "text-emerald-400" : "text-zinc-500",
        )}>
        {objective.isComplete && <Check size={12} />}
        the guild: {tenth(progress)} of {formatAmount(metric, target)}
      </p>
    </div>
  );
};

/**
 * This week's Fame, and where the member stands with it.
 *
 * Four states, and only one of them is a button. The other three are the
 * reasons there is no button yet, said plainly rather than as a disabled
 * control the member has to guess at: the guild has not cleared every goal,
 * this member has not put their own share in, or the Fame is already taken.
 * The split matters because the two failures have completely different fixes —
 * one is "go and practise", the other is "wait for the others".
 *
 * Nothing pays itself out. A cleared week is Fame sitting on the table, and the
 * member has to come in and take it.
 */
const Payout = ({
  challenge,
  busy,
  onClaim,
}: {
  challenge: GuildChallenge;
  busy: boolean;
  onClaim: () => void;
}) => {
  const owed = challenge.objectives.filter(
    (objective) => !objective.mineComplete,
  );

  if (challenge.claimed) {
    return (
      <p className='flex items-center gap-2 text-sm text-emerald-400'>
        <Check size={15} />
        <span>
          <span className='font-bold'>+{challenge.reward} Fame</span> taken for
          this week. It pays again next week.
        </span>
      </p>
    );
  }

  if (challenge.canClaim) {
    return (
      <div className='flex flex-wrap items-center gap-3'>
        <Button
          size='sm'
          disabled={busy}
          onClick={onClaim}
          className='bg-amber-500 text-zinc-900 hover:bg-amber-400'>
          <span className='flex items-center gap-1.5'>
            <FameCoin size={16} />
            Claim {challenge.reward} Fame
          </span>
        </Button>
        <span className='text-xs text-zinc-500'>
          Every goal cleared, yours included — the week is yours to take.
        </span>
      </div>
    );
  }

  const missing =
    owed.length > 0
      ? `Still yours to do: ${owed
          .map((objective) =>
            objectiveLine(
              objective.metric,
              Math.max(0, objective.perMember - objective.mine),
            ),
          )
          .join(", ")}.`
      : `Your share is in — waiting on the guild to finish ${
          challenge.objectives.length - challenge.cleared
        } more.`;

  return (
    <div className='space-y-1'>
      <p className='flex items-center gap-2 text-sm text-zinc-300'>
        <FameCoin size={16} />
        <span>
          <span className='font-bold text-amber-400'>
            +{challenge.reward} Fame
          </span>{" "}
          to claim once every goal is cleared and your own share is in.
        </span>
      </p>
      <p className='text-xs text-zinc-500'>{missing}</p>
    </div>
  );
};

/**
 * The guild's week.
 *
 * A week is a set of goals — sessions, and hours in the practice categories the
 * guild's rank asks for — and every one of them is stated per member and
 * cleared together. On the rank every guild starts on the prize is the streak
 * and nothing else. Once the guild has funded a paid rank the card grows a
 * payout line, which is claimed per member and gated on that member's own
 * tallies — see `guildChallengeTiers.ts` for why the reward and the harder week
 * had to arrive together.
 */
export const GuildChallengeCard = ({
  challenge,
  memberCount,
  busy,
  onClaim,
}: {
  challenge: GuildChallenge;
  memberCount: number;
  busy: boolean;
  onClaim: () => void;
}) => {
  const goals = challenge.objectives.length;

  return (
    <section className='space-y-6 rounded-lg bg-zinc-900/40 p-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <span
            aria-label={`Rank ${challenge.tier + 1}: ${challenge.tierName}`}
            className={cn(
              "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg",
              challenge.isComplete
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-cyan-500/10 text-cyan-300",
            )}>
            <span className='text-[9px] leading-none opacity-70'>lvl</span>
            <span className='text-lg font-bold tabular-nums leading-tight'>
              {challenge.tier + 1}
            </span>
          </span>

          <div>
            <p className='text-xs text-zinc-400'>
              This week, together ·{" "}
              <span className='font-bold text-zinc-300'>
                {challenge.tierName}
              </span>
            </p>
            <h3
              className={cn(
                "mt-1 text-base font-bold",
                challenge.isComplete ? "text-emerald-400" : "text-zinc-100",
              )}>
              {challenge.cleared} of {goals} {goals === 1 ? "goal" : "goals"}{" "}
              cleared
            </h3>
            <p className='mt-0.5 text-xs text-zinc-500'>
              Every goal is asked of each of the {memberCount}{" "}
              {memberCount === 1 ? "member" : "members"}, and the guild clears
              them together.
            </p>
          </div>
        </div>

        <div className='text-right'>
          {challenge.streak > 0 && (
            <p className='inline-flex items-center gap-1.5 text-sm font-bold text-orange-400'>
              <Flame size={14} />
              {challenge.streak}
              {challenge.streak === 1 ? " week" : " weeks"}
            </p>
          )}
          <p className='mt-0.5 text-xs text-zinc-500'>
            {daysLeft(challenge.endsAt)}
          </p>
        </div>
      </div>

      <div className='space-y-5'>
        {challenge.objectives.map((objective) => (
          <Objective key={objective.metric} objective={objective} />
        ))}
      </div>

      {challenge.reward > 0 ? (
        <Payout challenge={challenge} busy={busy} onClaim={onClaim} />
      ) : (
        <p className='text-sm text-zinc-400'>
          {challenge.isComplete
            ? "Cleared. Keep it going next week and the streak grows."
            : "Miss a single goal and the streak goes back to zero."}
        </p>
      )}
    </section>
  );
};
