import { cn } from "assets/lib/utils";
import { CASE_DEFINITIONS } from "feature/arsenal/data/caseDefinitions";
import {
  getDailyPool,
  getNextDailyReset,
} from "feature/arsenal/data/dailyCase";
import { useArsenalData } from "feature/arsenal/hooks/useArsenalData";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { buildDexLookup } from "feature/arsenal/utils/dex";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { readableText, useColorTheme } from "lib/colorTheme/colorTheme";
import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DexCornerMark, DexMarks } from "../DexMarks";
import { RARITY_STYLES } from "../RarityBadge";
import { CaseBuyControl } from "./CaseBuyControl";
import { DropRates, rollChance } from "./DropRates";
import { TapTooltip } from "./TapTooltip";

interface DailyCaseCardProps {
  currentFame: number;
  onOpen: (caseType: string, useToken?: boolean) => void;
  isOpening: boolean;
  /** Free cases the player is holding. Zero hides that choice. */
  freeTokens?: number;
}

const formatCountdown = (msLeft: number) => {
  const clamped = Math.max(0, msLeft);
  const d = Math.floor(clamped / 86_400_000);
  const h = Math.floor(clamped / 3_600_000) % 24;
  const m = Math.floor(clamped / 60_000) % 60;
  const s = Math.floor(clamped / 1000) % 60;
  if (d > 0) return `${d}d ${h}h ${String(m).padStart(2, "0")}m`;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
};

export const DailyCaseCard = ({
  currentFame,
  onOpen,
  isOpening,
  freeTokens = 0,
}: DailyCaseCardProps) => {
  const caseDef = CASE_DEFINITIONS.daily;
  const labels = useArsenalLabels();
  // Light theme: the pool tiles go flat — a plain rarity tint, no corner glow
  // or contact shadow.
  const isLight = useColorTheme() === "light";
  const { t } = labels;

  // Ticking clock drives both the countdown and the automatic pool rollover
  // at the rotation boundary (every 3 UTC days). Deriving the pool each tick
  // is trivial (seeded shuffle over the static catalog) and keeps it in sync.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pool = getDailyPool(now);
  const msLeft = getNextDailyReset(now).getTime() - now.getTime();

  // Owned / Dex status for each pool entry — off the same cached query the
  // ArsenalTabs parent already fetches, so no extra request.
  const { data: arsenalData } = useArsenalData();
  const dexStatusOf = useMemo(() => buildDexLookup(arsenalData), [arsenalData]);

  const inDexCount = pool.filter((entry) => {
    const status = dexStatusOf(entry.kind, entry.def.id);
    return status.isOwned || status.inDex;
  }).length;

  return (
    <section className='overflow-hidden rounded-lg bg-arsenal-section'>
      {/* Hero band. The render was composed for this slot — case in the right
          60%, filling the height, left 40% near-black — so it is simply the
          band's cover image. It is wider than the band is tall, so the cover
          crop trims top and bottom; anchoring at 25% keeps the raised lid
          whole and gives up floor instead. The band clips it, so nothing
          runs under the tiles below. */}
      {/* force-dark: the render is composed on near-black, so the band stays a
          dark photo banner in the light theme instead of melting into white. */}
      <div className='force-dark relative overflow-hidden bg-arsenal-section'>
        <img
          src='/images/case-featured-hero.webp'
          alt=''
          className='absolute inset-x-0 top-0 h-[68%] w-full object-cover object-[78%_25%] sm:h-full sm:object-[right_25%]'
          draggable={false}
        />
        {/* Edges dissolve into the section rather than ending in a seam: a
            wash from the left for the copy, a fade at the foot, and a touch
            of dark at the top so the ceiling of the render goes quiet. */}
        <div className='pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-arsenal-section via-arsenal-section/70 to-transparent sm:block lg:via-arsenal-section/20' />
        {/* On a phone the case is above the copy, so the wash comes up from the foot. */}
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-arsenal-section from-[34%] to-transparent to-[75%] sm:hidden' />
        <div className='light-hide pointer-events-none absolute inset-x-0 bottom-0 hidden h-24 sm:block bg-gradient-to-t from-arsenal-section via-arsenal-section/50 to-transparent' />
        <div className='pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-arsenal-section/50 to-transparent' />

        <div className='relative flex min-h-[22rem] flex-col justify-end gap-4 p-5 sm:min-h-[20rem] sm:justify-center sm:gap-5 sm:p-8 lg:max-w-[46%]'>
          <div>
            <p className='flex items-center gap-1.5 text-sm font-semibold tabular-nums text-orange-300'>
              <Clock3 size={14} aria-hidden />
              <span className='sr-only'>{t("cases.refreshes_in")} </span>
              {formatCountdown(msLeft)}
            </p>
            <h2 className='mt-1.5 font-display text-3xl font-black tracking-tight text-zinc-100 sm:text-4xl'>
              {labels.caseName(caseDef)}
            </h2>
          </div>

          <CaseBuyControl
            caseDef={caseDef}
            currentFame={currentFame}
            isOpening={isOpening}
            freeTokens={freeTokens}
            onOpen={onOpen}
            variant='featured'
            className='w-full flex-col sm:w-64'
          />
        </div>
      </div>

      {/* Today's pool — the exact ten items this case can drop, best first,
          on the same surface as the hero so they read as its contents.
          Each one carries the odds for its own rarity on hover: standing in
          front of a Mythic, the question is what the chance of *that* is. */}
      <div className='relative p-5 sm:p-6'>
        <div className='flex items-center justify-between gap-x-4'>
          <p className='text-sm font-semibold text-zinc-300'>
            {t("cases.inside_drop")}
            <span className='ml-2 font-medium tabular-nums text-zinc-400'>
              {t("cases.in_dex", { count: inDexCount, total: pool.length })}
            </span>
          </p>
          <DropRates probabilities={caseDef.probabilities} variant='inline' />
        </div>

        {/* One row on a phone, scrolled sideways: five rows of two pushed the
            shelf two screens down. */}
        <div className='no-scrollbar -mx-5 mt-3 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 xl:grid-cols-10'>
          {pool.map((entry) => {
            const rs = RARITY_STYLES[entry.def.rarity];
            const chance = rollChance(
              caseDef.probabilities,
              entry.def.rarity,
            );
            const imageSrc =
              entry.kind === "guitar"
                ? getRankBadgeSrc(entry.def.imageId, "medium")
                : getEffectImageSrc(entry.def.imageId, "medium");

            const dexStatus = dexStatusOf(entry.kind, entry.def.id);

            return (
              <TapTooltip
                key={`${entry.kind}-${entry.def.id}`}
                trigger={
                  // The rarity is the tile's own base rather than a second
                  // line of text under it; the name is on the tooltip.
                  <button
                    type='button'
                    className='group relative w-28 shrink-0 cursor-help snap-start overflow-hidden rounded-lg bg-arsenal-bg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring sm:w-auto'
                    style={
                      isLight ? { backgroundColor: `${rs.baseColor}1f` } : undefined
                    }>
                    <span className='relative flex aspect-square items-center justify-center overflow-hidden'>
                      {/* Soft pool of light tucked into the bottom-left corner */}
                      <span
                        className='light-hide pointer-events-none absolute -bottom-1/3 -left-1/3 h-full w-full rounded-full opacity-90 blur-2xl transition-opacity group-hover:opacity-100'
                        style={{
                          background: `radial-gradient(circle at center, ${rs.baseColor}8c 0%, ${rs.baseColor}26 50%, transparent 72%)`,
                        }}
                      />
                      {/* Contact shadow only: a pool of dark right under the
                          instrument's base, as if it stood on the tile — no
                          shadow on the silhouette itself. */}
                      <span className='light-hide pointer-events-none absolute bottom-[4%] left-1/2 h-[7%] w-[52%] -translate-x-1/2 rounded-[100%] bg-black/85 blur-[5px]' />
                      <img
                        src={imageSrc}
                        alt={`${entry.def.brand} ${entry.def.name}`}
                        className={cn(
                          "relative z-10 h-[86%] w-[86%] object-contain",
                          entry.kind === "guitar" && "-rotate-90",
                        )}
                        draggable={false}
                        loading='lazy'
                      />
                      {/* Owned / Dex / new glyph, top-right of the tile. */}
                      <span className='absolute right-1.5 top-1.5 z-20'>
                        <DexCornerMark status={dexStatus} />
                      </span>
                    </span>
                    <span
                      className='block truncate px-1 py-1.5 text-center text-xs font-bold'
                      style={{
                        color: readableText(rs.baseColor),
                        backgroundColor: `${rs.baseColor}29`,
                      }}>
                      {labels.rarity(entry.def.rarity)}
                    </span>
                  </button>
                }>
                <p className='truncate text-xs font-bold'>
                  {entry.def.brand} {entry.def.name}
                </p>
                <div className='mt-2.5 flex items-baseline justify-between gap-4'>
                  <span
                    className='text-[11px] font-semibold'
                    style={{ color: readableText(rs.baseColor) }}>
                    {labels.rarity(entry.def.rarity)}
                  </span>
                  <span
                    className='text-lg font-black tabular-nums'
                    style={{ color: readableText(rs.baseColor) }}>
                    {chance !== undefined
                      ? `${(chance * 100).toFixed(1)}%`
                      : "—"}
                  </span>
                </div>
                <DexMarks status={dexStatus} className='mt-2' inTooltip />
                <p className='mt-0.5 text-xs text-black/60'>
                  {t("cases.chance_from_case")}
                </p>
              </TapTooltip>
            );
          })}
        </div>
      </div>
    </section>
  );
};
