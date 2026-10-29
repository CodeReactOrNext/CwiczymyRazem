"use client";

import { cn } from "assets/lib/utils";
import { BossArt } from "feature/bosses/components/BossArt";
import { getBoss } from "feature/bosses/data/bosses";
import type { BossId } from "feature/bosses/types/boss.types";
import { stageStyle } from "feature/bosses/utils/bossArt";
import type { BossCard } from "feature/landing/lib/bossFightsProps";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

/**
 * The lair's select screen, on the landing: three portraits, the picked boss
 * lit on its stage with what it deals and what it trains.
 */
export const BossRoster = ({ bosses }: { bosses: BossCard[] }) => {
  const [pickedId, setPickedId] = useState<BossId>(bosses[0].id);
  const picked = bosses.find((boss) => boss.id === pickedId) ?? bosses[0];
  const definition = getBoss(picked.id);

  return (
    <div>
      <div
        className='grid grid-cols-3 gap-3'
        role='tablist'
        aria-label='Bosses'>
        {bosses.map((boss) => {
          const own = getBoss(boss.id);
          const active = boss.id === pickedId;
          return (
            <button
              key={boss.id}
              type='button'
              role='tab'
              aria-selected={active}
              aria-controls='boss-stage'
              onClick={() => setPickedId(boss.id)}
              className={cn(
                "group flex flex-col items-center rounded-lg px-2 pb-3 pt-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500",
                active
                  ? "bg-zinc-900/70"
                  : "bg-zinc-900/30 hover:bg-zinc-900/50",
              )}
              style={active ? stageStyle(boss.id, 0) : undefined}>
              <span
                className={cn(
                  "block h-16 w-20 transition-[filter,opacity] duration-300 sm:h-24 sm:w-28",
                  !active &&
                    "opacity-60 grayscale group-hover:opacity-90 group-hover:grayscale-0",
                )}>
                {own && <BossArt boss={own} className='h-full w-full' />}
              </span>
              <span
                className={cn(
                  "mt-1 text-xs font-semibold sm:text-sm",
                  active ? "text-white" : "text-zinc-400",
                )}>
                {boss.name.replace(/^The /, "")}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id='boss-stage'
        role='tabpanel'
        className='mt-4 overflow-hidden rounded-lg bg-zinc-900/40'
        style={stageStyle(picked.id, 0)}>
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={picked.id}
            className='grid gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-center'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}>
            <div className='mx-auto h-56 w-72 max-w-full sm:h-64 sm:w-80'>
              {definition && (
                <BossArt boss={definition} className='h-full w-full' intro />
              )}
            </div>
            <div>
              <h3 className='font-landingHeading text-2xl font-bold text-white'>
                {picked.name}
              </h3>
              <p className='mt-1 text-sm text-zinc-500'>{picked.title}</p>
              <p className='mt-5 leading-relaxed text-zinc-300'>
                {picked.pitch}
              </p>
              <dl className='mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2'>
                {[
                  { label: "It deals", value: picked.drill },
                  { label: "It trains", value: picked.trains },
                  { label: "Hurts it", value: picked.hit },
                  { label: "Hurts you", value: picked.miss },
                ].map((row) => (
                  <div key={row.label}>
                    <dt className='text-xs text-zinc-500'>{row.label}</dt>
                    <dd className='mt-0.5 text-sm text-zinc-200'>
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
