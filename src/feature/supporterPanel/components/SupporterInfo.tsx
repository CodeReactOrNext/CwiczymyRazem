import { Button } from "assets/components/ui/button";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { DISCORD_INVITE_URL } from "constants/community";
import {
  GEAR_BACK_COST,
  GEAR_PROPOSAL_COST,
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
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import {
  AtSign,
  Guitar,
  Hammer,
  Heart,
  Map,
  Package,
  Shield,
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

/** The other tabs, in the order the panel shows them; copy in `supporter:panel.info.surfaces`. */
const SURFACES: { id: string; icon: typeof Map }[] = [
  { id: "roadmap", icon: Map },
  { id: "work", icon: Hammer },
  { id: "gear", icon: Guitar },
  { id: "case", icon: Package },
  { id: "wall", icon: Heart },
  { id: "guild", icon: Shield },
];

/** Dollar figures for the ladder — the token counts beside them are computed. */
const LADDER_DOLLARS = [3, 5, 10, 25];

/** Titles and row labels are keys in `supporter:panel.info.costs`. */
const COST_GROUPS: {
  id: string;
  rows: { id: string; cost: number }[];
}[] = [
  {
    id: "roadmap",
    rows: [
      { id: "post_idea", cost: IDEA_COST },
      { id: "back_idea", cost: IDEA_BACK_COST },
    ],
  },
  {
    id: "gear",
    rows: [
      { id: "propose_gear", cost: GEAR_PROPOSAL_COST },
      { id: "back_proposal", cost: GEAR_BACK_COST },
    ],
  },
  {
    id: "votes",
    rows: [{ id: "case_item", cost: SLATE_VOTE_COST }],
  },
  {
    id: "guild",
    rows: [
      { id: "found_guild", cost: GUILD_FOUNDING_COST },
      { id: "seats", cost: GUILD_SEAT_UPGRADE_COST },
      { id: "stash_row", cost: GUILD_STASH_ROW_COST },
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
  const { t } = useTranslation("supporter");
  const email = useAccountEmail();

  return (
    <div className='space-y-10'>
      <section className='space-y-5'>
        <h2 className='text-base font-bold text-zinc-100'>
          {t("panel.info.what_you_do")}
        </h2>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {SURFACES.map(({ id, icon: Icon }) => (
            <div
              key={id}
              className='space-y-3 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
              <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/60 text-cyan-400'>
                <Icon size={18} />
              </span>
              <h3 className='text-sm font-bold text-zinc-100'>
                {t(`panel.info.surfaces.${id}.title`)}
              </h3>
              <p className='text-sm leading-relaxed text-zinc-400'>
                {t(`panel.info.surfaces.${id}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className='space-y-5 rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
        <h2 className='text-base font-bold text-zinc-100'>
          {t("panel.info.how_tokens")}
        </h2>

        <div className='space-y-3'>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-sm text-zinc-400'>
              {t("panel.info.badge_once")}
            </span>
            <Tokens value={SUPPORTER_WELCOME_TOKENS} />
          </div>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='text-sm text-zinc-400'>
              {t("panel.info.per_dollar")}
            </span>
            <Tokens value={TOKENS_PER_DOLLAR} />
          </div>
        </div>

        <div className='space-y-3 rounded-lg bg-zinc-800/40 p-5'>
          {LADDER_DOLLARS.map((usd) => (
            <div
              key={usd}
              className='flex items-baseline justify-between gap-4'>
              <span className='text-sm text-zinc-400'>
                {t("panel.info.in_total", { usd })}
              </span>
              <Tokens value={tokensEarned(usd, null, true)} />
            </div>
          ))}
        </div>

        <p className='max-w-2xl text-sm leading-relaxed text-zinc-500'>
          {t("panel.info.membership")}
        </p>
      </section>

      <section className='space-y-5'>
        <h2 className='text-base font-bold text-zinc-100'>
          {t("panel.info.what_cost")}
        </h2>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {COST_GROUPS.map(({ id, rows }) => (
            <div
              key={id}
              className='space-y-3 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
              <h3 className='text-sm font-bold text-zinc-100'>
                {t(`panel.info.costs.${id}.title`)}
              </h3>
              {rows.map(({ id: rowId, cost }) => (
                <div
                  key={rowId}
                  className='flex items-baseline justify-between gap-3'>
                  <span className='text-sm text-zinc-400'>
                    {t(`panel.info.costs.${id}.${rowId}`, {
                      max: MAX_BACKING_PER_IDEA,
                      seats: GUILD_SEATS_PER_UPGRADE,
                    })}
                  </span>
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
          {t("panel.info.donate_email")}
        </h2>

        <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
          {email ? (
            <Interpolate
              text={t("panel.info.email_known")}
              values={{
                email: <span className='font-bold text-zinc-100'>{email}</span>,
              }}
            />
          ) : (
            t("panel.info.email")
          )}
        </p>

        <Button asChild variant='secondary' className='self-start'>
          <a href={DISCORD_INVITE_URL} target='_blank' rel='noreferrer'>
            <span className='flex items-center gap-2'>
              <FaDiscord size={16} />
              {t("panel.info.message_discord")}
            </span>
          </a>
        </Button>
      </section>
    </div>
  );
};
