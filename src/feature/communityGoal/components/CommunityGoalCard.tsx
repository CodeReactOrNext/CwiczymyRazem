import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import {
  metricUnit,
  perSupporterLine,
} from "feature/communityGoal/data/goalCatalog";
import {
  useCommunityGoal,
  useCommunityGoalMutations,
} from "feature/communityGoal/hooks/useCommunityGoal";
import type { GoalIcon } from "feature/communityGoal/types/communityGoal.types";
import {
  BookOpen,
  CalendarClock,
  Check,
  Ear,
  Flame,
  Guitar,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";

const GOAL_ICONS: Record<GoalIcon, typeof Users> = {
  sessions: Users,
  hours: Timer,
  technique: Guitar,
  theory: BookOpen,
  hearing: Ear,
  creativity: Sparkles,
  // Retired candidates, still carried by goal documents written before the
  // practice categories existed.
  marathon: Flame,
  spread: CalendarClock,
};

const renderGoalIcon = (icon: GoalIcon) => {
  const Icon = GOAL_ICONS[icon] ?? Users;
  return <Icon size={18} />;
};

const daysLeft = (endsAt: string): string => {
  const days = Math.ceil(
    (new Date(endsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
  if (!Number.isFinite(days) || days <= 0) return "ends today";
  return days === 1 ? "1 day left" : `${days} days left`;
};

/**
 * The week's support challenge in one card: what the supporters are running,
 * how far it has got, and the reward once it lands. Shown to every player —
 * supporters pick it and run it, everybody watches it and everybody who
 * practised claims it.
 */
export const CommunityGoalCard = ({ className }: { className?: string }) => {
  const { data, isLoading } = useCommunityGoal();
  const { claim } = useCommunityGoalMutations();

  if (isLoading) {
    return (
      <div
        className={cn(
          "h-40 animate-pulse rounded-lg bg-zinc-900/40",
          className,
        )}
      />
    );
  }

  const goal = data?.current;
  if (!goal) return null;

  const percent = Math.min(
    100,
    goal.target > 0 ? Math.round((goal.progress / goal.target) * 100) : 0,
  );
  const reward = data.reward;
  const unit = metricUnit(goal.metric);
  const left = Math.max(0, goal.target - goal.progress);
  // What is left, divided by the roster that is allowed to move the bar — the
  // difference between "40 sessions" and "two and a half each" is the whole
  // question of whether the week is winnable.
  const leftEach = perSupporterLine(left, data.ballot.supporters, goal.metric);

  return (
    <section
      className={cn("space-y-5 rounded-lg bg-zinc-900/40 p-6", className)}>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              goal.isComplete
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-cyan-500/10 text-cyan-400",
            )}>
            {goal.isComplete ? <Check size={18} /> : renderGoalIcon(goal.icon)}
          </span>
          <div>
            <p className='text-xs text-zinc-400'>
              This week&apos;s support challenge
            </p>
            <h3 className='mt-1 text-base font-bold text-zinc-100'>
              {goal.label}
            </h3>
          </div>
        </div>

        <span className='text-xs text-zinc-500'>{daysLeft(goal.endsAt)}</span>
      </div>

      <div className='space-y-2'>
        <div className='h-2 overflow-hidden rounded-full bg-zinc-800/60'>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              goal.isComplete ? "bg-emerald-400" : "bg-cyan-400",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className='text-xs tabular-nums text-zinc-400'>
          {goal.progress} of {goal.target} {unit} logged by supporters ·{" "}
          {percent}% there
        </p>
        {!goal.isComplete && leftEach && (
          <p className='text-xs text-zinc-500'>
            {left} {unit} still to go — {leftEach}, before Monday
          </p>
        )}
      </div>

      {reward.claimed ? (
        <p className='text-sm font-medium text-emerald-400'>
          Done — you took your {reward.fame} Fame this week.
        </p>
      ) : reward.claimable ? (
        <div className='flex flex-wrap items-center gap-4'>
          <Button onClick={() => claim.mutate()} disabled={claim.isPending}>
            Claim {reward.fame} Fame
          </Button>
          <p className='text-sm text-zinc-400'>
            The supporters got there. Everyone who practised this week gets
            paid.
          </p>
        </div>
      ) : reward.missedTheWeek ? (
        <p className='text-sm text-zinc-400'>
          The supporters landed it, but the reward is for players who practised
          this week. Log a session before Monday and it is yours.
        </p>
      ) : (
        <p className='text-sm text-zinc-400'>
          The supporters are running this one. When it lands, every player who
          practised this week takes {reward.fame} Fame.
        </p>
      )}
    </section>
  );
};
