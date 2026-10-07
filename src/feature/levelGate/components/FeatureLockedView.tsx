import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { FeatureUnlock } from "feature/levelGate/data/featureUnlocks";
import { FEATURE_UNLOCK_LIST } from "feature/levelGate/data/featureUnlocks";
import {
  buildLevelTrack,
  pointsToReachLvl,
} from "feature/levelGate/utils/levelGate.utils";
import { LevelProgressCircle } from "feature/profile/components/LevelProgressCircle";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { Check, Lock } from "lucide-react";
import Link from "next/link";

interface FeatureLockedViewProps {
  feature: FeatureUnlock;
  lvl: number;
  points: number;
}

/** The climb from where you are to where the page opens. */
const LevelTrack = ({
  lvl,
  requiredLvl,
}: {
  lvl: number;
  requiredLvl: number;
}) => {
  const { t } = useTranslation("level_gate");
  return (
  <div className='flex items-center justify-center gap-2'>
    {buildLevelTrack(lvl, requiredLvl).map((step) =>
      step.kind === "gap" ? (
        <span key='gap' className='px-1 text-sm text-zinc-600'>
          &hellip;
        </span>
      ) : (
        <span
          key={step.lvl}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold tabular-nums",
            step.state === "current" && "bg-cyan-500/10 text-cyan-300",
            step.state === "todo" && "bg-zinc-800/40 text-zinc-500",
            step.state === "target" && "bg-zinc-800/60 text-zinc-200",
          )}
          aria-label={
            step.state === "target"
              ? t("track.target", { lvl: step.lvl })
              : t("track.level", { lvl: step.lvl })
          }>
          {step.state === "target" ? (
            <span className='flex items-center gap-1'>
              <Lock size={12} className='text-zinc-400' />
              {step.lvl}
            </span>
          ) : (
            step.lvl
          )}
        </span>
      ),
    )}
  </div>
  );
};

/**
 * What a level-gated page shows before you have the level for it.
 *
 * It leads with the same ring the dashboard uses, so the number being asked for
 * is the number the player already recognises, and it says plainly how far the
 * page is rather than only that it is shut.
 */
export const FeatureLockedView = ({
  feature,
  lvl,
  points,
}: FeatureLockedViewProps) => {
  const { t } = useTranslation("level_gate");
  const { id, requiredLvl } = feature;
  const name = t(`features.${id}.name`, feature.name);
  const reason = t(`features.${id}.reason`, feature.reason);
  const perks = feature.perks.map((perk, i) => t(`features.${id}.perks.${i}`, perk));
  const pointsLeft = pointsToReachLvl(points, requiredLvl);
  const levelsLeft = requiredLvl - lvl;

  return (
    <div className='mx-auto w-full max-w-3xl px-4 py-10 md:py-16'>
      <div className='flex flex-col items-center gap-8 rounded-lg bg-zinc-900/40 px-6 py-12 text-center md:gap-10 md:px-14 md:py-16'>
        <div className='relative'>
          <LevelProgressCircle
            lvl={lvl}
            points={points}
            size={140}
            showLabel={false}
          />
          <span className='absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-zinc-300'>
            <Lock size={16} />
          </span>
        </div>

        <div className='flex flex-col items-center gap-3'>
          <h1 className='text-2xl font-black tracking-tight text-zinc-100 md:text-3xl'>
            {t("opens_at", { name, lvl: requiredLvl })}
          </h1>
          <p className='text-sm text-zinc-300'>
            <Interpolate
              text={t("you_are")}
              values={{
                lvl,
                left: (
                  <span className='font-bold text-cyan-300'>
                    {t(levelsLeft === 1 ? "levels_left_one" : "levels_left", { count: levelsLeft })}
                  </span>
                ),
                points: pointsLeft.toLocaleString(),
              }}
            />
          </p>
        </div>

        <LevelTrack lvl={lvl} requiredLvl={requiredLvl} />

        <p className='max-w-lg text-sm leading-relaxed text-zinc-400'>
          {reason}
        </p>

        <div className='flex w-full max-w-md flex-col gap-3 text-left'>
          {perks.map((perk) => (
            <div key={perk} className='flex items-start gap-3'>
              <span className='mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/60' />
              <span className='text-sm text-zinc-300'>{perk}</span>
            </div>
          ))}
        </div>

        <div className='flex flex-wrap items-center justify-center gap-3'>
          <Button asChild className='bg-white text-zinc-950 hover:bg-zinc-200'>
            <Link href='/timer'>{t("practise_now")}</Link>
          </Button>
          <Button
            asChild
            variant='ghost'
            className='bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-zinc-100'>
            <Link href='/wiki/how-scoring-works'>{t("how_levels")}</Link>
          </Button>
        </div>

        <div className='mt-4 flex w-full flex-col items-center gap-4'>
          <span className='text-xs font-semibold text-zinc-500'>
            {t("what_else")}
          </span>
          <div className='flex flex-wrap items-center justify-center gap-2'>
            {FEATURE_UNLOCK_LIST.map((entry) => {
              const open = lvl >= entry.requiredLvl;
              return (
                <span
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold",
                    open
                      ? "bg-emerald-950/30 text-emerald-400"
                      : "bg-zinc-800/40 text-zinc-400",
                  )}>
                  {open ? (
                    <Check size={12} className='text-emerald-400' />
                  ) : (
                    <Lock size={12} className='text-zinc-500' />
                  )}
                  {t(`features.${entry.id}.name`, entry.name)}
                  <span className='text-zinc-500'>{t("lvl", { lvl: entry.requiredLvl })}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
