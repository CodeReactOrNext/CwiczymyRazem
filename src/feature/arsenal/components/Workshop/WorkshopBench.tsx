import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import {
  getConditionGrade,
  getPromotions,
  getPromotionsAvailable,
  RARITY_LADDER,
  RARITY_MAX_FEATURES,
} from "feature/arsenal/data/itemStats";
import { getSalvagedModOptions } from "feature/arsenal/data/salvage";
import {
  getBuildQuote,
  getModQuote,
  getRepairQuote,
} from "feature/arsenal/data/workshop";
import type {
  SalvagedMod,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { describeBlocker } from "feature/arsenal/utils/workshopBlockers";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { Hammer, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { ConditionMeter } from "../ConditionMeter";
import { InServiceTags } from "../InServiceTags";
import { LevelEmblem } from "../LevelEmblem";
import { BuildLog } from "./BuildLog";
import { ConditionPath } from "./ConditionPath";
import { InstalledMods } from "./InstalledMods";
import { JobCard } from "./JobCard";
import type { ModSlotTarget } from "./ModSlotDialog";
import { ModSlotDialog } from "./ModSlotDialog";
import { RarityPath } from "./RarityPath";
import type { WorkshopJob } from "./WorkshopJobModal";
import { WorkshopJobModal } from "./WorkshopJobModal";

interface WorkshopBenchProps {
  entry: WorkshopEntry;
  wallet: ScrapPart[];
  /** The whole stash of rescued mods — filtered here to what this item can take. */
  salvagedMods: SalvagedMod[];
  fame: number;
}

export const WorkshopBench = ({
  entry,
  wallet,
  salvagedMods,
  fame,
}: WorkshopBenchProps) => {
  const rs = RARITY_STYLES[entry.rarity];
  const grade = getConditionGrade(entry.condition);

  const buildQuote = useMemo(
    () => getBuildQuote(entry.subject, wallet, fame),
    [entry.subject, wallet, fame],
  );
  const repairQuote = useMemo(
    () => getRepairQuote(entry.subject, wallet),
    [entry.subject, wallet],
  );
  const modQuote = useMemo(
    () => getModQuote(entry.subject, wallet, fame),
    [entry.subject, wallet, fame],
  );
  const salvagedOptions = useMemo(
    () => getSalvagedModOptions(entry.subject, salvagedMods),
    [entry.subject, salvagedMods],
  );

  const [job, setJob] = useState<WorkshopJob | null>(null);
  /** The socket on the bench the player has opened, if any. */
  const [slot, setSlot] = useState<ModSlotTarget | null>(null);

  const mintRarity = entry.subject.mintRarity;
  const promotionsDone = getPromotions(mintRarity, entry.buildLevel);
  const promotionsTotal = getPromotionsAvailable(mintRarity);
  // Slots the next promotion would unlock — drawn as ghosts past the current cap.
  const nextRarity =
    RARITY_LADDER[RARITY_LADDER.indexOf(entry.rarity) + 1] ?? null;
  const lockedModSlots =
    nextRarity && promotionsDone < promotionsTotal
      ? Math.max(0, (RARITY_MAX_FEATURES[nextRarity] ?? 0) - modQuote.slots.max)
      : 0;

  return (
    <div className='flex flex-col gap-4'>
      <ModSlotDialog
        slot={slot}
        entry={entry}
        modQuote={modQuote}
        salvagedOptions={salvagedOptions}
        fame={fame}
        onClose={() => setSlot(null)}
        // A re-roll has a bill and a before → after, and the job sheet already
        // shows both — so the slot dialog hands over rather than duplicating it.
        onReroll={() => {
          setSlot(null);
          setJob("mod");
        }}
      />

      <WorkshopJobModal
        job={job}
        entry={entry}
        buildQuote={buildQuote}
        repairQuote={repairQuote}
        modQuote={modQuote}
        salvagedOptions={salvagedOptions}
        wallet={wallet}
        fame={fame}
        onClose={() => setJob(null)}
        onChangeJob={setJob}
      />

      {/* ─── The item on the bench ───
          The bench is a dark work surface under one warm lamp, and the item is
          the hero on it: nameplate top left, the instrument itself big in the
          pool of light, and one status bar underneath — grade and level, the
          two numbers every job below is about to move. */}
      <div className='relative flex flex-col gap-4 overflow-hidden rounded-lg bg-[#0f1013] p-5 sm:p-7'>
        {/* The bench is a dark surface under one warm lamp, top left, with the
            item's own colour bleeding onto it behind the instrument. */}
        <div
          className='pointer-events-none absolute inset-0'
          style={{
            backgroundImage: [
              "radial-gradient(60% 55% at 30% 0%, rgba(255,190,110,0.22) 0%, rgba(255,190,110,0.05) 45%, transparent 72%)",
              `radial-gradient(45% 40% at 50% 55%, ${rs.baseColor}${entry.rarity === "Custom Shop" ? "1a" : "2e"} 0%, transparent 70%)`,
              "linear-gradient(180deg, #17181c 0%, #101114 55%, #0a0b0d 100%)",
            ].join(", "),
          }}
        />

        {/* Nameplate */}
        <div className='relative flex flex-col gap-1'>
          <span
            className='text-[11px] font-semibold tracking-[0.18em]'
            style={{ color: rs.baseColor }}>
            {entry.brand} · {entry.rarity}
          </span>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
            <span className='truncate text-3xl font-black text-white sm:text-4xl'>
              {entry.name}
            </span>
            {/* Whether the thing on the bench is gear you are actually playing.
                Every job below is priced in parts you cannot get back, and on a
                spare copy none of it touches your Rig Level. */}
            <InServiceTags uses={entry.uses} />
          </div>
        </div>

        {/* The instrument, stood up in the light, with its mod sockets wired
            to the parts they sit on. Any socket opens the mod job. */}
        <InstalledMods
          kind={entry.kind}
          name={entry.name}
          heroImageSrc={entry.heroImageSrc}
          rotate={entry.rotate}
          fitted={modQuote.fitted}
          slots={modQuote.slots}
          locked={lockedModSlots}
          onOpenSlot={setSlot}
        />

        {/* Status bar: the grade, spelled out, and the level beside it.
            Build level and promotions are not here on purpose — the build card
            says them in the words that matter ("Build 1 → 2 · 2 more to the
            next promotion"). */}
        <div className='relative mx-auto flex w-full max-w-md items-center gap-4 rounded-lg bg-zinc-950/70 px-4 py-2.5'>
          <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
            <span className='flex items-baseline gap-2 text-sm font-bold'>
              <span style={{ color: grade.color }}>{grade.label}</span>
              {entry.restored && (
                <span className='text-xs font-semibold text-zinc-400'>
                  — fully restored
                </span>
              )}
            </span>
            <ConditionMeter
              condition={entry.condition}
              restored={entry.restored}
              showLabel={false}
              className='max-w-[220px]'
            />
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            <span className='text-[10px] font-semibold tracking-widest text-zinc-500'>
              Level
            </span>
            <LevelEmblem level={entry.level} rarity={entry.rarity} size={44} />
          </div>
        </div>
      </div>

      {/* ─── The three things you can do ─── */}
      {/* Nothing left to restore collapses to a status line — a big disabled
          card for a job that will never run again just eats space the other
          two jobs could use. */}
      {repairQuote.target ? (
        <JobCard
          icon={Wrench}
          title='Restore condition'
          summary={
            <ConditionPath
              condition={entry.condition}
              target={repairQuote.target}
            />
          }
          gain={repairQuote.gain}
          ready={repairQuote.canRepair}
          blockedNote={describeBlocker(repairQuote.recipe)}
          accent='emerald'
          onClick={() => setJob("repair")}
        />
      ) : (
        <div className='flex items-center gap-2.5 rounded-lg bg-zinc-900/40 px-4 py-3 text-sm'>
          <Wrench size={15} className='shrink-0 text-emerald-400/60' />
          <span className='font-bold text-zinc-300'>
            {getConditionGrade(entry.condition).label}
          </span>
          <span className='text-zinc-600'>·</span>
          <span className='text-zinc-500'>fully restored</span>
        </div>
      )}

      <JobCard
        icon={Hammer}
        title={
          buildQuote.requirement.promotesTo
            ? `Promote to ${buildQuote.requirement.promotesTo}`
            : `Upgrade to build ${buildQuote.requirement.level}`
        }
        summary={
          <RarityPath
            mintRarity={entry.subject.mintRarity}
            buildLevel={entry.buildLevel}
          />
        }
        gain={buildQuote.gain}
        ready={buildQuote.canBuild}
        blockedNote={describeBlocker(buildQuote.recipe, buildQuote.checks)}
        accent='cyan'
        onClick={() => setJob("build")}
      />

      {/* No "Install mod" card here — every socket up in the hero art already
          opens the same job when clicked, and a second, wordier way to reach
          it just repeated the sockets in a different shape. */}

      {/* ─── The chronicle of bench work, folded away ─── */}
      <BuildLog entries={entry.buildLog} />
    </div>
  );
};
