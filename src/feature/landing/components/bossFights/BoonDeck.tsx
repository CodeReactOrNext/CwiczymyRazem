"use client";

import { cn } from "assets/lib/utils";
import { BoonIcon, RARITY_TEXT } from "feature/bosses/components/BoonIcon";
import type { BoonId, BoonRarity } from "feature/bosses/utils/boons";
import type { BoonCard } from "feature/landing/lib/bossFightsProps";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

const DEAL_MS = 3600;

const RARITY_CARD: Record<BoonRarity, string> = {
  common: "bg-zinc-900",
  rare: "bg-purple-950/50",
  epic: "bg-amber-950/40",
};

const RARITY_LABEL: Record<BoonRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
};

interface BoonDeckProps {
  boons: BoonCard[];
  /** Real deals, one a phase break. */
  deals: BoonId[][];
}

/** Three cards a break, dealt the way the run dealt them, then the whole deck by rarity. */
export const BoonDeck = ({ boons, deals }: BoonDeckProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [deal, setDeal] = useState(0);
  const byId = new Map(boons.map((boon) => [boon.id, boon]));

  useEffect(() => {
    if (!inView || reduceMotion) return undefined;
    const id = window.setTimeout(
      () => setDeal((d) => (d + 1) % deals.length),
      DEAL_MS,
    );
    return () => window.clearTimeout(id);
  }, [inView, reduceMotion, deal, deals.length]);

  return (
    <div ref={ref}>
      <p className='mb-3 text-xs tabular-nums text-zinc-500'>
        After phase {deal + 1} · pick one
      </p>
      <div className='relative min-h-[17rem] sm:min-h-[12rem]'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.ul
            key={deal}
            className='grid gap-3 sm:grid-cols-3'
            aria-live='polite'>
            {deals[deal].map((id, i) => {
              const boon = byId.get(id);
              if (!boon) return null;
              return (
                <motion.li
                  key={id}
                  className={cn("rounded-lg p-4", RARITY_CARD[boon.rarity])}
                  initial={{ opacity: 0, y: 18, rotate: -2 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  exit={{
                    opacity: 0,
                    y: -10,
                    transition: { duration: 0.2, delay: i * 0.04 },
                  }}
                  transition={{
                    duration: 0.45,
                    delay: i * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}>
                  <div className='flex items-center gap-2.5'>
                    <BoonIcon id={id} className='h-6 w-6' />
                    <span className='font-semibold text-white'>
                      {boon.name}
                    </span>
                  </div>
                  <p className={cn("mt-1 text-xs", RARITY_TEXT[boon.rarity])}>
                    {RARITY_LABEL[boon.rarity]}
                  </p>
                  <p className='mt-2.5 text-sm leading-relaxed text-zinc-400'>
                    {boon.body}
                  </p>
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </div>
    </div>
  );
};

/** The full deck, grouped by rarity — server-rendered, so every boon is on the page. */
export const BoonList = ({ boons }: { boons: BoonCard[] }) => (
  <div className='grid gap-8 md:grid-cols-3'>
    {(["common", "rare", "epic"] as const).map((rarity) => {
      const group = boons.filter((boon) => boon.rarity === rarity);
      return (
        <div key={rarity}>
          <h3 className={cn("mb-4 text-sm font-bold", RARITY_TEXT[rarity])}>
            {RARITY_LABEL[rarity]} · {group.length}
          </h3>
          <ul className='space-y-4'>
            {group.map((boon) => (
              <li key={boon.id} className='flex items-start gap-3'>
                <BoonIcon id={boon.id} className='mt-0.5 h-5 w-5 shrink-0' />
                <div>
                  <p className='text-sm font-semibold text-zinc-100'>
                    {boon.name}
                  </p>
                  <p className='text-sm leading-relaxed text-zinc-500'>
                    {boon.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    })}
  </div>
);
