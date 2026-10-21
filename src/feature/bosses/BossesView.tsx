import { Button } from "assets/components/ui/button";
import { selectUserAuth } from "feature/user/store/userSlice";
import Link from "next/link";
import { useAppSelector } from "store/hooks";

import { BossArt } from "./components/BossArt";
import { BOSSES } from "./data/bosses";
import { useBossRecord } from "./hooks/useBossProgress";
import { useBossText } from "./hooks/useBossText";
import type { BossDefinition } from "./types/boss.types";
import {
  CHORD_MULTIPLIER_STREAK,
  MAX_MULTIPLIER_STREAK,
  PARRY_STREAK,
  PHASE_HEAL,
  WEAK_SPOT_CHARGE,
} from "./utils/bossEngine";
import { QUAKES_FROM } from "./utils/chordPhaseGenerator";
import { AFFIX_FROM, SLAMS_FROM, WEAK_SPOTS_FROM } from "./utils/phaseGenerator";

const RULE_KEYS = ["sword", "strike", "bite", "slam", "endless", "draft", "threats"] as const;

const ruleVars = (boss: BossDefinition) => ({
  max: boss.drill === "chords" ? CHORD_MULTIPLIER_STREAK : MAX_MULTIPLIER_STREAK,
  parry: PARRY_STREAK,
  slams: boss.drill === "chords" ? QUAKES_FROM : SLAMS_FROM,
  heal: PHASE_HEAL,
  weak: WEAK_SPOTS_FROM,
  weakCharge: WEAK_SPOT_CHARGE,
  affix: AFFIX_FROM,
});

const RecordStat = ({ value, label }: { value: string | number; label: string }) => (
  <div>
    <p className='font-teko text-4xl leading-none tabular-nums text-zinc-100'>{value}</p>
    <p className='mt-1 text-xs text-zinc-400'>{label}</p>
  </div>
);

const BossLair = ({ boss }: { boss: BossDefinition }) => {
  const uid = useAppSelector(selectUserAuth);
  const { record, isLoading } = useBossRecord(uid ?? null, boss.id);
  const { t, bossName, bossTitle } = useBossText(boss);

  return (
    <section className='space-y-6'>
      <div className='grid items-center gap-8 rounded-lg bg-zinc-900/40 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:p-8'>
        <BossArt
          boss={boss}
          className='mx-auto aspect-[480/380] w-full max-w-md'
          pattern={[1, 3, 2, 4]}
          webTorn={0}
          intro
        />
        <div className='space-y-8'>
          <div className='space-y-1'>
            <p className='text-sm text-zinc-400'>{bossTitle}</p>
            <h1 className='font-display text-3xl font-semibold text-zinc-100'>{bossName}</h1>
            <p className='pt-2 text-sm text-zinc-400'>{t("lair.pitch")}</p>
          </div>

          <div className='flex flex-wrap gap-x-10 gap-y-4'>
            <RecordStat value={record.bestPhase || "—"} label={t("lair.best_phase")} />
            <RecordStat
              value={record.bestDamage ? record.bestDamage.toLocaleString() : "—"}
              label={t("lair.best_damage")}
            />
            <RecordStat value={record.runs} label={t("lair.runs")} />
          </div>

          <Button
            asChild
            disabled={isLoading}
            className='h-10 w-full bg-white text-zinc-950 shadow-none hover:bg-zinc-200 sm:w-auto sm:px-10'>
            <Link href={`/practice/boss/${boss.id}`}>{t("lair.fight")}</Link>
          </Button>
        </div>
      </div>

      <div className='rounded-lg bg-zinc-900/40 p-6'>
        <h2 className='font-display text-lg font-semibold text-zinc-100'>{t("rules.title")}</h2>
        <ol className='mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3'>
          {RULE_KEYS.map((key, i) => (
            <li key={key} className='flex gap-3'>
              <span className='font-teko text-2xl leading-none tabular-nums text-zinc-500'>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className='space-y-1'>
                <span className='block text-sm font-medium text-zinc-200'>
                  {t(`rules.${key}.title`)}
                </span>
                <span className='block text-sm text-zinc-400'>
                  {t(`rules.${key}.body`, ruleVars(boss))}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

/** Every boss, each with its lair. */
export const BossesView = () => (
  <div className='space-y-10'>
    {BOSSES.map((boss) => (
      <BossLair key={boss.id} boss={boss} />
    ))}
  </div>
);
