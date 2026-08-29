import { Button } from "assets/components/ui/button";
import { CommunityGoalCard } from "feature/communityGoal/components/CommunityGoalCard";
import { COMMUNITY_GOAL_FAME_REWARD } from "feature/communityGoal/data/goalCatalog";
import {
  GOAL_VOTE_COST,
  SUPPORTER_WELCOME_TOKENS,
  TOKENS_PER_DOLLAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import {
  ArrowRight,
  Coins,
  Flag,
  Gift,
  Ruler,
  Users,
  Vote,
} from "lucide-react";
import Link from "next/link";

/**
 * What a support challenge is, for the player looking at Milestones.
 *
 * It sits next to the practice levels because both are "hit a target, claim
 * Fame" — but this one is not yours to hit. The page has to be honest about
 * that up front: supporters run it, you watch it, and you still get paid.
 *
 * Every figure is read from the constants the server pays against, so a
 * rebalance cannot leave this page quoting last month's numbers.
 */

const STEPS: { icon: typeof Coins; title: string; body: string }[] = [
  {
    icon: Coins,
    title: "Supporters get tickets",
    body: `${SUPPORTER_WELCOME_TOKENS} with the badge, plus ${TOKENS_PER_DOLLAR} for every dollar donated. They keep until they are spent, and every donation after the first buys more.`,
  },
  {
    icon: Vote,
    title: "Tickets pick the next challenge",
    body: `${GOAL_VOTE_COST} ticket puts one push behind an option on next week's ballot. Whichever option is carrying the most tickets on Monday is the one that runs — and whatever ran this week sits the ballot out, so the app never plays the same goal twice running.`,
  },
  {
    icon: Ruler,
    title: "The number is measured, not invented",
    body: "A challenge asks for a stretch over the best week the supporters have actually had — sessions, hours, or hours of one practice category. On a week with no history to stretch, it is sized off how many supporters there are.",
  },
  {
    icon: Flag,
    title: "Supporters run it",
    body: "Only practice logged by a supporter moves the bar. That is the thing the donation actually buys — a place in the run, not a bigger payout.",
  },
  {
    icon: Users,
    title: "Everybody watches it",
    body: "The bar is public. You can see what was picked, how far it has got and how long is left, whether or not you are a supporter.",
  },
  {
    icon: Gift,
    title: "Landing it pays the whole app",
    body: `Once the target falls, every player who practised that week can take ${COMMUNITY_GOAL_FAME_REWARD} Fame. The supporters carried it; the reward is not theirs alone.`,
  },
];

export const SupportChallengeExplainer = () => (
  <div className='space-y-10'>
    <CommunityGoalCard />

    <div className='space-y-6'>
      <div className='space-y-2'>
        <h2 className='text-lg font-bold text-zinc-100'>
          How a support challenge works
        </h2>
        <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
          Milestones are the targets you set yourself. This one is set by the
          people paying for the app, run by them, and collected by everybody.
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div key={title} className='space-y-3 rounded-lg bg-zinc-900/40 p-6'>
            <div className='flex items-center gap-3'>
              <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
                <Icon size={16} />
              </span>
              <h3 className='font-bold text-zinc-100'>{title}</h3>
            </div>
            <p className='text-sm leading-relaxed text-zinc-400'>{body}</p>
          </div>
        ))}
      </div>
    </div>

    <div className='space-y-4 rounded-lg bg-zinc-800/40 p-6'>
      <h3 className='font-bold text-zinc-100'>Claiming it</h3>
      <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
        The Fame is never pushed to your account. You take it by hand from the
        card above, once per challenge, and only if you logged a session in the
        week it was met — so a challenge you sat out is not a payday. The button
        goes away when the week rolls over on Monday.
      </p>
    </div>

    <div className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-6 sm:flex-row sm:items-center sm:justify-between'>
      <div className='space-y-1'>
        <h3 className='font-bold text-zinc-100'>Want to run these?</h3>
        <p className='text-sm text-zinc-400'>
          The badge comes with tickets, a vote on what runs next, and five other
          boards that decide what gets built.
        </p>
      </div>

      <Button asChild className='shrink-0 self-start sm:self-auto'>
        <Link href='/supporter'>
          Supporter panel
          <ArrowRight size={16} className='ml-2' />
        </Link>
      </Button>
    </div>
  </div>
);
