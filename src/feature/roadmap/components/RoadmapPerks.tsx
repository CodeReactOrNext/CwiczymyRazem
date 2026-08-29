import { HeroPattern } from "components/UI/HeroBanner";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { DISCORD_INVITE_URL } from "constants/community";
import {
  SUPPORTER_WELCOME_TOKENS,
  TOKENS_PER_DOLLAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Guitar, Map, Package, Shield, Target } from "lucide-react";
import Link from "next/link";
import { FaDiscord } from "react-icons/fa6";

/**
 * The other half of the pitch above: the roadmap explains what the money
 * builds for everyone, this explains what it hands the person paying.
 *
 * Every perk here is a tab of the supporter panel, so the section is a preview
 * of /supporter rather than a second place where perks are invented — and the
 * token figures are read from the panel's own constants, so a rebalance never
 * leaves this page quoting last month's rate.
 */
const PERKS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Map,
    title: "The roadmap board",
    body: "Post what you want built and back the ideas other supporters posted. The board is ordered by how many people want the thing.",
  },
  {
    icon: Guitar,
    title: "Gear you picked",
    body: "Propose a guitar or a pedal for the Arsenal, or back somebody else's spec into the drop tables.",
  },
  {
    icon: Package,
    title: "The supporter case",
    body: "Vote on which items get a seat in the next supporter case before it opens.",
  },
  {
    icon: Shield,
    title: "A guild of your own",
    body: "Found one with its own name and tag, a shared stash, and a harder practice week for the roster.",
  },
  {
    icon: Target,
    title: "The next challenge",
    body: "Pick the community challenge everybody plays next week.",
  },
];

export const RoadmapPerks = () => {
  return (
    <section className='relative overflow-hidden rounded-lg bg-zinc-900/40 p-5 sm:p-7'>
      <HeroPattern
        className='opacity-[0.06]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
      />
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent' />

      <div className='relative space-y-7'>
        {/* Same single-row head as the banners above: copy left, CTA right. */}
        <div className='flex flex-wrap items-start gap-x-12 gap-y-6'>
          <div className='flex w-full min-w-0 items-start gap-3.5 lg:w-auto lg:flex-1'>
            <SupportToken size={18} className='mt-0.5 shrink-0' />
            <div className='min-w-0'>
              <p className='text-sm font-semibold text-zinc-100 sm:text-base'>
                What you get
              </p>
              <p className='mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm'>
                Supporting turns into tokens: {SUPPORTER_WELCOME_TOKENS} land
                with the badge and {TOKENS_PER_DOLLAR} more for every dollar
                after that. They never expire, and they buy a say over what gets
                built.
              </p>
            </div>
          </div>

          <Link
            href='/supporter'
            className='group flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-500/15 px-4 py-2.5 text-xs font-semibold text-amber-300 transition-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 hover:bg-amber-500/25 sm:w-auto sm:text-sm'>
            Open the supporter panel
            <ArrowRight
              size={16}
              className='transition-transform duration-300 group-hover:translate-x-0.5'
            />
          </Link>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {PERKS.map(({ icon: Icon, title, body }) => (
            <div key={title} className='rounded-lg bg-zinc-800/40 p-4 sm:p-5'>
              <p className='flex items-center gap-2.5 text-sm font-semibold text-zinc-100'>
                <Icon size={16} className='shrink-0 text-amber-400' />
                {title}
              </p>
              <p className='mt-2 text-xs leading-relaxed text-zinc-400'>
                {body}
              </p>
            </div>
          ))}

          {/* Discord sits in the grid rather than under it: it is the one perk
              that lives outside the panel, and a lone footer line read as an
              afterthought next to five tiles. */}
          <div className='rounded-lg bg-zinc-800/40 p-4 sm:p-5'>
            <p className='flex items-center gap-2.5 text-sm font-semibold text-zinc-100'>
              <FaDiscord size={16} className='shrink-0 text-amber-400' />
              The supporter channel
            </p>
            <p className='mt-2 text-xs leading-relaxed text-zinc-400'>
              A supporter role on{" "}
              <a
                href={DISCORD_INVITE_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='text-amber-300 transition-colors hover:text-amber-200'>
                Discord
              </a>{" "}
              and the channel where I show what I am building before it ships.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
