import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { selectUserAuth } from "feature/user/store/userSlice";
import { m } from "framer-motion";
import type { Translate } from "lib/i18n/translate";
import { fadeUp } from "lib/motion/motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

import { BossArt } from "./components/BossArt";
import { ChangelingGuide } from "./components/ChangelingGuide";
import { BOSSES } from "./data/bosses";
import { useBossRecord } from "./hooks/useBossProgress";
import { useBossText } from "./hooks/useBossText";
import { useBossLobbyStore } from "./store/bossLobbyStore";
import type { BossDefinition, BossDifficulty, BossRecord } from "./types/boss.types";
import { stageStyle } from "./utils/bossArt";
import {
  CHANGES_MULTIPLIER_STREAK,
  CHORD_MULTIPLIER_STREAK,
  COMBO_MAX_MULTIPLIER,
  MAX_MULTIPLIER_STREAK,
  PARRY_STREAK,
  PHASE_HEAL,
  WEAK_SPOT_CHARGE,
} from "./utils/bossEngine";
import { SMOOTH_SEMITONES } from "./utils/changesJudge";
import { QUAKES_FROM } from "./utils/chordPhaseGenerator";
import { DIFFICULTIES, DIFFICULTY, GATE_EVERY, GATE_HP, nextSavepoint, savepointsFor } from "./utils/difficulty";
import { AFFIX_FROM, SLAMS_FROM, WEAK_SPOTS_FROM } from "./utils/phaseGenerator";

const RULE_KEYS = ["sword", "strike", "bite", "slam", "endless", "draft", "threats", "gates"] as const;
/** The changeling plays for tricks too: its combo comes right after the sword it feeds. */
const CHANGES_RULE_KEYS = ["sword", "strike", "combo", "bite", "slam", "endless", "draft", "threats", "gates"] as const;

const ruleVars = (boss: BossDefinition) => ({
  max:
    boss.drill === "chords"
      ? CHORD_MULTIPLIER_STREAK
      : boss.drill === "changes"
        ? CHANGES_MULTIPLIER_STREAK
        : MAX_MULTIPLIER_STREAK,
  parry: PARRY_STREAK,
  slams: boss.drill === "spider" ? SLAMS_FROM : QUAKES_FROM,
  heal: PHASE_HEAL,
  weak: WEAK_SPOTS_FROM,
  weakCharge: WEAK_SPOT_CHARGE,
  affix: AFFIX_FROM,
  gate: GATE_EVERY,
  gateHp: Math.round((GATE_HP - 1) * 100),
  comboMax: COMBO_MAX_MULTIPLIER,
  smooth: SMOOTH_SEMITONES,
});

const RecordStat = ({ value, label }: { value: string | number; label: string }) => (
  <div>
    <p className='font-teko text-4xl leading-none tabular-nums text-zinc-100'>{value}</p>
    <p className='mt-1 text-xs text-zinc-400'>{label}</p>
  </div>
);

const Option = ({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type='button'
    aria-pressed={selected}
    onClick={onClick}
    className={cn(
      "rounded-lg px-3.5 py-2 text-sm font-semibold tabular-nums transition-colors duration-fast",
      selected ? "bg-zinc-100 text-zinc-950" : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
    )}>
    {children}
  </button>
);

/** "−15%", "+10%", "±0%". */
const signedPercent = (share: number) => {
  const percent = Math.round((share - 1) * 100);
  return percent === 0 ? "±0%" : `${percent > 0 ? "+" : "−"}${Math.abs(percent)}%`;
};

/**
 * How the next run is entered: its difficulty — what bites cost, how fast it
 * plays, what it scores — and the savepoint it starts at, every gate reached
 * on that difficulty or a harder one. Until a gate is reached there is
 * nothing to pick, so the savepoints stay hidden.
 */
const FightSetup = ({
  record,
  difficulty,
  onDifficulty,
  start,
  onStart,
  t,
}: {
  record: BossRecord;
  difficulty: BossDifficulty;
  onDifficulty: (difficulty: BossDifficulty) => void;
  start: number;
  onStart: (phase: number) => void;
  t: Translate;
}) => {
  const savepoints = savepointsFor(record, difficulty);
  const effect = DIFFICULTY[difficulty];
  return (
    <div className='space-y-5'>
      <div className='space-y-2'>
        <p className='text-xs text-zinc-400'>{t("lair.difficulty")}</p>
        <div className='flex flex-wrap gap-2' role='group' aria-label={t("lair.difficulty")}>
          {DIFFICULTIES.map((d) => (
            <Option key={d} selected={d === difficulty} onClick={() => onDifficulty(d)}>
              {t(`difficulty.${d}`)}
            </Option>
          ))}
        </div>
        <p className='text-xs tabular-nums text-zinc-500'>
          {t("lair.difficulty_effect", {
            damage: `×${effect.damage}`,
            tempo: signedPercent(effect.tempo),
            reward: `×${effect.reward}`,
          })}
        </p>
      </div>

      {savepoints.length > 1 && (
        <div className='space-y-2'>
          <p className='text-xs text-zinc-400'>{t("lair.start_at")}</p>
          <div className='flex flex-wrap items-center gap-2' role='group' aria-label={t("lair.start_at")}>
            {savepoints.map((phase) => (
              <Option key={phase} selected={phase === start} onClick={() => onStart(phase)}>
                {t("lair.phase_option", { phase })}
              </Option>
            ))}
            <span className='px-1 text-xs text-zinc-600'>
              {t("lair.next_savepoint", { phase: nextSavepoint(record, difficulty) })}
            </span>
          </div>
          {start > 1 && (
            <p className='text-xs text-zinc-500'>{t("lair.skip_note", { count: start - 1, phase: start })}</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * A boss on the select strip: its portrait, its name and how far you got.
 * The picked one stands lit in its stage's colour; the others wait in grey
 * until hovered.
 */
const RosterTile = ({
  boss,
  selected,
  onSelect,
}: {
  boss: BossDefinition;
  selected: boolean;
  onSelect: () => void;
}) => {
  const uid = useAppSelector(selectUserAuth);
  const { record } = useBossRecord(uid ?? null, boss.id);
  const { t, bossName } = useBossText(boss);

  return (
    <button
      type='button'
      aria-pressed={selected}
      onClick={onSelect}
      style={selected ? stageStyle(boss.id, 0) : undefined}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-colors duration-fast sm:flex-row sm:gap-4 sm:p-4 sm:text-left",
        selected ? "bg-zinc-800/50" : "bg-zinc-900/40 hover:bg-zinc-800/40",
      )}>
      <BossArt
        boss={boss}
        className={cn(
          "aspect-[480/380] w-20 shrink-0 transition-[opacity,filter] duration-base sm:w-28",
          selected ? "opacity-100" : "opacity-50 grayscale group-hover:opacity-80 group-hover:grayscale-0",
        )}
      />
      <span className='min-w-0 space-y-0.5'>
        <span className={cn("block text-sm font-semibold", selected ? "text-zinc-100" : "text-zinc-300")}>
          {bossName}
        </span>
        <span className='block text-xs tabular-nums text-zinc-500'>
          {record.runs ? t("arena.record", { phase: record.bestPhase }) : t("lair.not_fought")}
        </span>
      </span>
    </button>
  );
};

/**
 * The picked boss on its lit stage, the way it will meet you in the fight:
 * large, dropping in as it is picked, with the record against it and how the
 * next run is entered.
 */
const BossLair = ({ boss }: { boss: BossDefinition }) => {
  const uid = useAppSelector(selectUserAuth);
  const { record, isLoading } = useBossRecord(uid ?? null, boss.id);
  const { t, bossName, bossTitle } = useBossText(boss);
  const difficulty = useBossLobbyStore((s) => s.difficulty);
  const setDifficulty = useBossLobbyStore((s) => s.setDifficulty);
  const [chosenStart, setChosenStart] = useState(1);
  // A savepoint picked on another difficulty may not be open on this one.
  const start = savepointsFor(record, difficulty).includes(chosenStart) ? chosenStart : 1;
  const fightHref = `/practice/boss/${boss.id}?difficulty=${difficulty}${start > 1 ? `&start=${start}` : ""}`;
  // The changeling is played unlike the others: it has a how-to-play, shown before its first fight.
  const hasGuide = boss.drill === "changes";
  const guideSeen = useBossLobbyStore((s) => s.guidesSeen.includes(boss.id));
  const markGuideSeen = useBossLobbyStore((s) => s.markGuideSeen);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <section className='overflow-hidden rounded-lg bg-zinc-900/40' style={stageStyle(boss.id, 0)}>
      <div className='grid items-center gap-8 p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 lg:p-10'>
        <BossArt
          boss={boss}
          className='mx-auto aspect-[480/380] w-full max-w-xl'
          pattern={[1, 3, 2, 4]}
          webTorn={0}
          intro
        />
        <m.div className='space-y-8' initial='hidden' animate='visible' variants={fadeUp}>
          <div className='space-y-1'>
            <p className='text-sm text-zinc-400'>{bossTitle}</p>
            <h1 className='font-display text-4xl font-semibold text-zinc-100'>{bossName}</h1>
            <p className='max-w-prose pt-2 text-sm text-zinc-400'>{t("lair.pitch")}</p>
          </div>

          {record.runs > 0 && (
            <div className='flex flex-wrap gap-x-10 gap-y-4'>
              <RecordStat value={record.bestPhase} label={t("lair.best_phase")} />
              <RecordStat value={record.bestScore.toLocaleString()} label={t("lair.best_score")} />
              <RecordStat value={record.runs} label={t("lair.runs")} />
            </div>
          )}

          <FightSetup
            record={record}
            difficulty={difficulty}
            onDifficulty={setDifficulty}
            start={start}
            onStart={setChosenStart}
            t={t}
          />

          <div className='flex flex-wrap items-center gap-3'>
            <Button
              asChild
              disabled={isLoading}
              className='h-12 w-full bg-white text-base text-zinc-950 shadow-none hover:bg-zinc-200 sm:w-auto sm:px-14'>
              <Link
                href={fightHref}
                onClick={(event) => {
                  // The first time, the fight waits for how it is played.
                  if (!hasGuide || guideSeen) return;
                  event.preventDefault();
                  setGuideOpen(true);
                }}>
                {t("lair.fight")}
              </Link>
            </Button>
            {hasGuide && (
              <Button
                type='button'
                onClick={() => setGuideOpen(true)}
                className='h-12 w-full bg-zinc-800 px-8 text-base text-zinc-100 shadow-none hover:bg-zinc-700 sm:w-auto'>
                {t("guide.open")}
              </Button>
            )}
          </div>
        </m.div>
      </div>
      {hasGuide && (
        <ChangelingGuide
          boss={boss}
          open={guideOpen}
          onOpenChange={(open) => {
            setGuideOpen(open);
            if (!open) markGuideSeen(boss.id);
          }}
          fightHref={fightHref}
        />
      )}
    </section>
  );
};

/** The picked boss's rules — every boss words them its own way: the colossus quakes where the spider slams. */
const FightRules = ({ boss }: { boss: BossDefinition }) => {
  const { t } = useBossText(boss);

  return (
    <section className='rounded-lg bg-zinc-900/40 p-6'>
      <h2 className='font-display text-lg font-semibold text-zinc-100'>{t("rules.title")}</h2>
      <ol className='mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3'>
        {(boss.drill === "changes" ? CHANGES_RULE_KEYS : RULE_KEYS).map((key, i) => (
          <li key={key} className='flex gap-3'>
            <span className='font-teko text-2xl leading-none tabular-nums text-zinc-500'>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className='space-y-1'>
              <span className='block text-sm font-medium text-zinc-200'>{t(`rules.${key}.title`)}</span>
              <span className='block text-sm text-zinc-400'>{t(`rules.${key}.body`, ruleVars(boss))}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
};

/** A boss select screen: the strip of bosses, the picked one on its stage, then its rules. */
export const BossesView = () => {
  // The remembered difficulty and boss are read after the first paint, so
  // the page the server sent and the one hydrated over it agree.
  useEffect(() => {
    void useBossLobbyStore.persist.rehydrate();
  }, []);
  const bossId = useBossLobbyStore((s) => s.bossId);
  const setBossId = useBossLobbyStore((s) => s.setBossId);
  const boss = BOSSES.find((b) => b.id === bossId) ?? BOSSES[0];

  return (
    <div className='space-y-10'>
      <div className='space-y-4'>
        <div className='grid grid-cols-3 gap-3'>
          {BOSSES.map((b) => (
            <RosterTile key={b.id} boss={b} selected={b.id === boss.id} onSelect={() => setBossId(b.id)} />
          ))}
        </div>
        {/* Keyed by boss, so a new pick drops in fresh and starts from phase 1. */}
        <BossLair key={boss.id} boss={boss} />
      </div>
      <FightRules boss={boss} />
    </div>
  );
};
