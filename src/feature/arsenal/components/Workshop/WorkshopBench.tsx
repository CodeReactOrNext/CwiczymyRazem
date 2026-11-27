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
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type {
  SalvagedMod,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { readableText } from "lib/colorTheme/colorTheme";
import { Hammer, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { CardTraits, useItemTraitStates } from "../CardTraits";
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
  /**
   * Opens on a socket instead of the bench — the Collection hands a rescued mod
   * straight to a free slot. Read once, at mount; the bench is keyed per item.
   */
  initialSlot?: ModSlotTarget | null;
  /** The mod to have picked in that slot's list. */
  preferModId?: string | null;
}

export const WorkshopBench = ({
  entry,
  wallet,
  salvagedMods,
  fame,
  initialSlot = null,
  preferModId = null,
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

  const traitStates = useItemTraitStates(entry.id, entry.traits);

  const [job, setJob] = useState<WorkshopJob | null>(null);
  const labels = useArsenalLabels();
  const { t } = labels;
  /** The socket on the bench the player has opened, if any. */
  const [slot, setSlot] = useState<ModSlotTarget | null>(initialSlot);

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
        wallet={wallet}
        preferModId={preferModId}
        onClose={() => setSlot(null)}
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
      {/* bg-zinc-900 + the dark wash: the light theme drops the wash (light-hide)
          and keeps a plain white bench. */}
      <div className='relative flex flex-col gap-4 overflow-hidden rounded-lg bg-zinc-900 p-5 sm:p-7'>
        {/* The bench is a dark surface under one warm lamp, top left, with the
            item's own colour bleeding onto it behind the instrument. */}
        <div
          className='light-hide pointer-events-none absolute inset-0'
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
            className='text-xs font-semibold'
            style={{ color: readableText(rs.baseColor) }}>
            {entry.brand} · {labels.rarity(entry.rarity)}
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
              <span style={{ color: readableText(grade.color) }}>
                {labels.condition(grade)}
              </span>
              {entry.restored && (
                <span className='text-xs font-semibold text-zinc-400'>
                  — {t("workshop.fully_restored")}
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
          <LevelEmblem
            level={entry.level}
            rarity={entry.rarity}
            size={44}
            title={t("workshop.level")}
          />
        </div>

        {/* What the item pays on top of its level. No bench job touches traits,
            but this is where the player decides how much to sink into an item,
            and a trait is often the reason it is worth it. */}
        {entry.traits.length > 0 && (
          <div className='relative mx-auto w-full max-w-md overflow-hidden rounded-lg'>
            <CardTraits traits={entry.traits} states={traitStates} />
          </div>
        )}
      </div>

      {/* ─── The things you can do ─── */}
      {/* Nothing left to restore means no card at all: the status bar above
          already says the grade and that it is fully restored, and a second
          line under it only said so again. What a job is short of is in the
          dialog it opens — the card just greys its gain. */}
      {repairQuote.target && (
        <JobCard
          icon={Wrench}
          title={t("workshop.restore_condition")}
          summary={
            <ConditionPath
              condition={entry.condition}
              target={repairQuote.target}
            />
          }
          gain={repairQuote.gain}
          ready={repairQuote.canRepair}
          accent='emerald'
          onClick={() => setJob("repair")}
        />
      )}

      <JobCard
        icon={Hammer}
        title={
          buildQuote.requirement.promotesTo
            ? t("workshop.promote_to", {
                rarity: labels.rarity(buildQuote.requirement.promotesTo),
              })
            : t("workshop.upgrade_to_build", {
                build: buildQuote.requirement.level,
              })
        }
        summary={
          <RarityPath
            mintRarity={entry.subject.mintRarity}
            buildLevel={entry.buildLevel}
          />
        }
        gain={buildQuote.gain}
        ready={buildQuote.canBuild}
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
