import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { HeroPattern } from "components/UI/HeroBanner";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { DISCORD_INVITE_URL } from "constants/community";
import {
  GEAR_BACK_COST,
  GEAR_PROPOSAL_COST,
  GUILD_FOUNDING_COST,
  IDEA_BACK_COST,
  IDEA_COST,
  SLATE_VOTE_COST,
  SUPPORTER_WELCOME_TOKENS,
  TOKENS_PER_DOLLAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import {
  ArrowRight,
  Bot,
  Guitar,
  Map as MapIcon,
  Package,
  Shield,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { FaDiscord } from "react-icons/fa6";

interface Perk {
  id: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Token prices for the `{{slots}}` of the perk's price line. */
  price?: Record<string, number>;
}

/**
 * What the person paying gets back. Every entry is a tab of the supporter
 * panel, so this is a preview of /supporter rather than a second place where
 * perks are invented, and the prices are read from the panel's own constants,
 * so a rebalance never leaves this page quoting last month's rate.
 *
 * Split by how they are paid for: the boards the tokens are spent on, each
 * with its price, so "they buy a say" reads as a menu rather than a promise,
 * and the two things the badge brings on its own.
 */
const SPEND_PERKS: Perk[] = [
  {
    id: "roadmap",
    icon: MapIcon,
    price: { post: IDEA_COST, back: IDEA_BACK_COST },
  },
  {
    id: "gear",
    icon: Guitar,
    price: { post: GEAR_PROPOSAL_COST, back: GEAR_BACK_COST },
  },
  { id: "case", icon: Package, price: { vote: SLATE_VOTE_COST } },
  { id: "guild", icon: Shield, price: { found: GUILD_FOUNDING_COST } },
];

const BADGE_PERKS: Perk[] = [
  { id: "discord", icon: FaDiscord },
  { id: "ai", icon: Bot },
];

const TokenAmount = ({ amount }: { amount: number }) => (
  <span className='inline-flex items-center gap-1 align-[-2px] font-semibold tabular-nums text-amber-300'>
    <SupportToken size={13} />
    {amount}
  </span>
);

const toAmounts = (price: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(price).map(([slot, amount]) => [
      slot,
      <TokenAmount key={slot} amount={amount} />,
    ]),
  );

const DiscordLink = () => (
  <a
    href={DISCORD_INVITE_URL}
    target='_blank'
    rel='noopener noreferrer'
    className='text-amber-300 underline decoration-amber-500/40 underline-offset-2 transition-colors hover:text-amber-200 hover:decoration-amber-400'>
    Discord
  </a>
);

const PerkRow = ({ perk }: { perk: Perk }) => {
  const { t } = useTranslation("supporter");
  const { id, icon: Icon, price } = perk;
  return (
    <li className='flex gap-3.5'>
      <Icon size={18} className='mt-0.5 shrink-0 text-amber-400' />
      <div className='min-w-0'>
        <p className='text-sm font-semibold text-zinc-100'>
          {t(`perks.items.${id}.title`)}
        </p>
        <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
          {id === "discord" ? (
            <Interpolate
              text={t("perks.discord_body")}
              values={{ discord: <DiscordLink /> }}
            />
          ) : (
            t(`perks.items.${id}.body`)
          )}
        </p>
        {price && (
          <p className='mt-2 text-xs text-zinc-500'>
            <Interpolate
              text={t(`perks.items.${id}.price`)}
              values={toAmounts(price)}
            />
          </p>
        )}
      </div>
    </li>
  );
};

const PerkGroup = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className='min-w-0'>
    <p className='text-xs font-semibold text-zinc-500'>{title}</p>
    {children}
  </div>
);

export const RoadmapPerks = () => {
  const { t } = useTranslation("supporter");
  return (
    <section className='relative overflow-hidden rounded-lg bg-zinc-900/40 p-5 sm:p-7'>
      {/* Amber, the colour the app already spends on supporters (the badge, the
          avatar ring): this section lists what the badge buys, so the surface
          it sits on should read as the same thing. Pattern and glow both fade
          out to the right, leaving the copy on clean background. */}
      <HeroPattern
        variant='shuffle'
        className='opacity-[0.09]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
        gradient={["#fbbf24", "#f97316"]}
      />
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent' />

      <div className='relative flex flex-wrap items-start justify-between gap-x-12 gap-y-5'>
        <div className='min-w-0 max-w-2xl'>
          <h2 className='flex items-center gap-2.5 text-base font-semibold text-zinc-100'>
            <SupportToken size={18} />
            {t("perks.title")}
          </h2>
          <p className='mt-1.5 text-sm leading-relaxed text-zinc-400'>
            <Interpolate
              text={t("perks.tokens")}
              values={{
                welcome: <TokenAmount amount={SUPPORTER_WELCOME_TOKENS} />,
                perDollar: <TokenAmount amount={TOKENS_PER_DOLLAR} />,
              }}
            />
          </p>
        </div>

        <Link
          href='/supporter'
          className={cn(
            PRESSABLE,
            "group flex shrink-0 items-center gap-1.5 rounded-lg border-b-black/30 bg-amber-500/15 px-4 py-2.5 text-sm text-amber-300 transition-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 hover:bg-amber-500/25",
          )}>
          {t("perks.open_panel")}
          <ArrowRight
            size={16}
            className='transition-transform duration-base group-hover:translate-x-0.5'
          />
        </Link>
      </div>

      {/* Plain rows, not tiles: tinted boxes were the loudest thing on the
          page, and on a phone they nested a card inside a card. The two groups
          are told apart by their labels and the gap between them. */}
      <div className='relative mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <PerkGroup title={t("perks.spend_title")}>
          <ul className='mt-4 grid gap-x-10 gap-y-7 sm:grid-cols-2'>
            {SPEND_PERKS.map((perk) => (
              <PerkRow key={perk.id} perk={perk} />
            ))}
          </ul>
        </PerkGroup>

        <PerkGroup title={t("perks.badge_title")}>
          <ul className='mt-4 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-1'>
            {BADGE_PERKS.map((perk) => (
              <PerkRow key={perk.id} perk={perk} />
            ))}
          </ul>
        </PerkGroup>
      </div>
    </section>
  );
};
