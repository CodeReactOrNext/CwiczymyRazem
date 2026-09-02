import { Button } from "assets/components/ui/button";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { DISCORD_INVITE_URL } from "constants/community";
import {
  GEAR_BACK_COST,
  GEAR_PROPOSAL_COST,
  GOAL_VOTE_COST,
  GUILD_FOUNDING_COST,
  GUILD_SEAT_UPGRADE_COST,
  GUILD_SEATS_PER_UPGRADE,
  GUILD_STASH_ROW_COST,
  IDEA_BACK_COST,
  IDEA_COST,
  MAX_BACKING_PER_IDEA,
  SLATE_VOTE_COST,
  SUPPORTER_WELCOME_TOKENS,
  TOKENS_PER_DOLLAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { useAccountEmail } from "feature/supporterPanel/hooks/useAccountEmail";
import { tokensEarned } from "feature/supporterPanel/utils/supporterTokens";
import {
  AtSign,
  Guitar,
  Hammer,
  Heart,
  Map,
  Package,
  Shield,
  Target,
} from "lucide-react";
import { FaDiscord } from "react-icons/fa6";

/**
 * The Info tab: what the panel is for, how tokens are handed out, and what they
 * cost to spend.
 *
 * Supporter-only, like everything else behind the badge — somebody who hasn't
 * donated sees the door in `SupporterPitch` and nothing else. So this is the
 * one place the surfaces and the prices are written down, and a second copy is
 * how one of them ends up quoting last month's numbers.
 *
 * Every number is read from the constants the panel spends against, so a
 * rebalance is a constant to change rather than a page to rewrite.
 */

/** The other tabs, in the order the panel shows them. */
const SURFACES: { icon: typeof Map; title: string; body: string }[] = [
  {
    icon: Map,
    title: "Roadmap",
    body: "Put up what the app is missing and push the ideas you want built. What the board carries most is what gets picked up next.",
  },
  {
    icon: Hammer,
    title: "In the works",
    body: "The actual build order — what is in progress, what is queued, what shipped. You stop guessing what happened to your idea.",
  },
  {
    icon: Guitar,
    title: "Gear",
    body: "Put a guitar, an amp or a pedal up for the Arsenal and push the ones you want drawn. What rises here is what gets made.",
  },
  {
    icon: Package,
    title: "Supporter case",
    body: "Six seats in the next case, and you pick what sits in each one before it ever opens. Only the winner's tokens are spent. Everything backing the rest stays on the board for the next case.",
  },
  {
    icon: Target,
    title: "Support challenge",
    body: "Choose the target the whole app plays for next week — every player collects the Fame off the week you set.",
  },
  {
    icon: Heart,
    title: "Supporters",
    body: "Everyone funding the app, listed with the level they play at. The badge puts you on that wall the day it lands.",
  },
  {
    icon: Shield,
    title: "Guild",
    body: "Claim a name and a tag nobody else can take, then widen the room and the shelf as members turn up.",
  },
];

/** Dollar figures for the ladder — the token counts beside them are computed. */
const LADDER_DOLLARS = [3, 5, 10, 25];

const COST_GROUPS: {
  title: string;
  rows: { label: string; cost: number }[];
}[] = [
  {
    title: "Roadmap",
    rows: [
      { label: "Post an idea", cost: IDEA_COST },
      {
        label: `Back an idea (max ${MAX_BACKING_PER_IDEA})`,
        cost: IDEA_BACK_COST,
      },
    ],
  },
  {
    title: "Gear",
    rows: [
      { label: "Propose gear", cost: GEAR_PROPOSAL_COST },
      { label: "Back a proposal", cost: GEAR_BACK_COST },
    ],
  },
  {
    title: "Votes",
    rows: [
      { label: "Supporter case item", cost: SLATE_VOTE_COST },
      { label: "Next support challenge", cost: GOAL_VOTE_COST },
    ],
  },
  {
    title: "Guild",
    rows: [
      { label: "Found a guild", cost: GUILD_FOUNDING_COST },
      {
        label: `+${GUILD_SEATS_PER_UPGRADE} seats`,
        cost: GUILD_SEAT_UPGRADE_COST,
      },
      { label: "+1 stash row", cost: GUILD_STASH_ROW_COST },
    ],
  },
];

const Tokens = ({ value }: { value: number }) => (
  <span className='flex shrink-0 items-center gap-1.5 text-sm font-bold tabular-nums text-amber-400'>
    <SupportToken size={16} />
    {value}
  </span>
);

export const SupporterInfo = () => {
  const email = useAccountEmail();

  return (
    <div className='space-y-10'>
      <section className='space-y-5'>
        <h2 className='text-base font-bold text-zinc-100'>What you do here</h2>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {SURFACES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className='space-y-3 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
              <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/60 text-cyan-400'>
                <Icon size={18} />
              </span>
              <h3 className='text-sm font-bold text-zinc-100'>{title}</h3>
              <p className='text-sm leading-relaxed text-zinc-400'>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='space-y-5 rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
        <h2 className='text-base font-bold text-zinc-100'>
          How you get tokens
        </h2>

        <div className='space-y-3'>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-sm text-zinc-400'>Supporter badge, once</span>
            <Tokens value={SUPPORTER_WELCOME_TOKENS} />
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-sm text-zinc-400'>Every $1 donated</span>
            <Tokens value={TOKENS_PER_DOLLAR} />
          </div>
        </div>

        <div className='space-y-3 rounded-lg bg-zinc-800/40 p-5'>
          {LADDER_DOLLARS.map((usd) => (
            <div
              key={usd}
              className='flex items-baseline justify-between gap-4'>
              <span className='text-sm text-zinc-400'>${usd} in total</span>
              <Tokens value={tokensEarned(usd, null, true)} />
            </div>
          ))}
        </div>

        <p className='max-w-2xl text-sm leading-relaxed text-zinc-500'>
          A membership pays again on every renewal. Tokens never expire and
          never refill on their own — spent ones are gone.
        </p>
      </section>

      <section className='space-y-5'>
        <h2 className='text-base font-bold text-zinc-100'>What they cost</h2>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {COST_GROUPS.map(({ title, rows }) => (
            <div
              key={title}
              className='space-y-3 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
              <h3 className='text-sm font-bold text-zinc-100'>{title}</h3>
              {rows.map(({ label, cost }) => (
                <div
                  key={label}
                  className='flex items-baseline justify-between gap-3'>
                  <span className='text-sm text-zinc-400'>{label}</span>
                  <Tokens value={cost} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className='space-y-4 rounded-lg bg-amber-500/5 p-6 sm:p-8'>
        <h2 className='flex items-center gap-2.5 text-base font-bold text-zinc-100'>
          <AtSign size={18} className='text-amber-400' />
          Donate with your account email
        </h2>

        <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
          Every donation is matched to an account by the email it carries
          {email ? (
            <>
              {" — yours is "}
              <span className='font-bold text-zinc-100'>{email}</span>
            </>
          ) : null}
          , so one paid from another address adds no tokens to this wallet.
          Happened already? Nothing is lost — write to me on Discord and
          I&apos;ll attach it by hand.
        </p>

        <Button asChild variant='secondary' className='self-start'>
          <a href={DISCORD_INVITE_URL} target='_blank' rel='noreferrer'>
            <span className='flex items-center gap-2'>
              <FaDiscord size={16} />
              Message me on Discord
            </span>
          </a>
        </Button>
      </section>
    </div>
  );
};
