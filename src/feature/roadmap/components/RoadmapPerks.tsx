import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { DISCORD_INVITE_URL } from "constants/community";
import {
  SUPPORTER_WELCOME_TOKENS,
  TOKENS_PER_DOLLAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { ArrowRight, Guitar, Map, Package, Shield, Target } from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { FaDiscord } from "react-icons/fa6";

interface Perk {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: ReactNode;
}

/**
 * What the person paying gets back. Every entry is a tab of the supporter
 * panel, so this is a preview of /supporter rather than a second place where
 * perks are invented, and the token figures are read from the panel's own
 * constants, so a rebalance never leaves this page quoting last month's rate.
 */
const PERKS: Perk[] = [
  {
    icon: Map,
    title: "The roadmap board",
    body: "Post what you want built and back the ideas other supporters posted.",
  },
  {
    icon: Guitar,
    title: "Gear you picked",
    body: "Propose a guitar or a pedal for the Arsenal, or back somebody else's spec.",
  },
  {
    icon: Package,
    title: "The supporter case",
    body: "Vote on which items get a seat in the next supporter case.",
  },
  {
    icon: Shield,
    title: "A guild of your own",
    body: "Found one with its own name and tag, a shared stash and a harder practice week.",
  },
  {
    icon: Target,
    title: "The next challenge",
    body: "Pick the community challenge everybody plays next week.",
  },
  {
    icon: FaDiscord,
    title: "The supporter channel",
    body: (
      <>
        A supporter role on{" "}
        <a
          href={DISCORD_INVITE_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='text-zinc-200 underline decoration-zinc-600 underline-offset-2 transition-colors hover:text-white hover:decoration-zinc-300'>
          Discord
        </a>{" "}
        and a channel where I show what I am building before it ships.
      </>
    ),
  },
];

export const RoadmapPerks = () => {
  return (
    <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-7'>
      <div className='flex flex-wrap items-start justify-between gap-x-12 gap-y-5'>
        <div className='min-w-0 max-w-2xl'>
          <h2 className='flex items-center gap-2.5 text-base font-semibold text-zinc-100'>
            <SupportToken size={18} />
            What you get
          </h2>
          <p className='mt-1.5 text-sm leading-relaxed text-zinc-400'>
            Supporting turns into tokens: {SUPPORTER_WELCOME_TOKENS} land with
            the badge and {TOKENS_PER_DOLLAR} more for every dollar after that.
            They never expire, and they buy a say over what gets built.
          </p>
        </div>

        <Link
          href='/supporter'
          className='group flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-800/60 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800'>
          Open the supporter panel
          <ArrowRight
            size={16}
            className='transition-transform duration-300 group-hover:translate-x-0.5'
          />
        </Link>
      </div>

      {/* Plain rows, not tiles: six tinted boxes were the loudest thing on the
          page, and on a phone they nested a card inside a card. */}
      <ul className='mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3'>
        {PERKS.map(({ icon: Icon, title, body }) => (
          <li key={title} className='flex gap-3.5'>
            <Icon size={18} className='mt-0.5 shrink-0 text-zinc-400' />
            <div className='min-w-0'>
              <p className='text-sm font-semibold text-zinc-100'>{title}</p>
              <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
                {body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
