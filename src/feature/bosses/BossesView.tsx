import { Button, PRESSABLE_KEY } from "assets/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { selectUserAuth } from "feature/user/store/userSlice";
import type { Translate } from "lib/i18n/translate";
import { CircleHelp, Loader2, Monitor, Swords } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

import { BossArt } from "./components/BossArt";
import { BossHowTo } from "./components/BossHowTo";
import { ChangelingGuide } from "./components/ChangelingGuide";
import { FightPrimer } from "./components/FightPrimer";
import { BOSSES } from "./data/bosses";
import { useBossRecord } from "./hooks/useBossProgress";
import { useBossText } from "./hooks/useBossText";
import { useBossLobbyStore } from "./store/bossLobbyStore";
import type { BossDefinition, BossDifficulty, BossRecord } from "./types/boss.types";
import { posterFadeStyle, posterStyle } from "./utils/bossArt";
import { DIFFICULTIES, DIFFICULTY, savepointsFor } from "./utils/difficulty";

/** "−15%", "+10%", "±0%". */
const signedPercent = (share: number) => {
  const percent = Math.round((share - 1) * 100);
  return percent === 0 ? "±0%" : `${percent > 0 ? "+" : "−"}${Math.abs(percent)}%`;
};

/** A key on a poster: dark glass over the boss's colour, lit when picked. */
const POSTER_KEY = cn(
  PRESSABLE_KEY,
  "flex items-center justify-center rounded-lg text-sm font-semibold text-white transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
);
const posterKeyFace = (selected: boolean) => (selected ? "bg-white/25 hover:bg-white/30" : "bg-black/30 hover:bg-black/45");

const PosterKey = ({
  selected,
  onClick,
  tip,
  className,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  tip?: string;
  className?: string;
  children: ReactNode;
}) => {
  const key = (
    <button
      type='button'
      role='radio'
      aria-checked={selected}
      onClick={onClick}
      className={cn(POSTER_KEY, posterKeyFace(selected), className)}>
      {children}
    </button>
  );
  return tip ? (
    <Tooltip>
      <TooltipTrigger asChild>{key}</TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  ) : (
    key
  );
};

/**
 * How the next run is entered: its difficulty, and — once a gate is reached —
 * the phase it starts at. What a difficulty changes is a tooltip away: the
 * four names already say it.
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
  const effects = (d: BossDifficulty) =>
    [
      `${t("lair.effect_damage")} ×${DIFFICULTY[d].damage}`,
      `${t("lair.effect_tempo")} ${signedPercent(DIFFICULTY[d].tempo)}`,
      `${t("lair.effect_score")} ×${DIFFICULTY[d].reward}`,
    ].join(" · ");

  return (
    <>
      <div role='radiogroup' aria-label={t("lair.difficulty")} className='grid grid-cols-4 gap-2'>
        {DIFFICULTIES.map((d) => (
          <PosterKey key={d} selected={d === difficulty} onClick={() => onDifficulty(d)} tip={effects(d)} className='h-11 min-w-0 px-2'>
            {t(`difficulty.${d}`)}
          </PosterKey>
        ))}
      </div>
      {savepoints.length > 1 && (
        <div role='radiogroup' aria-label={t("lair.start_at")} className='flex flex-wrap items-center gap-2'>
          <span className='mr-1 text-sm text-white/85'>{t("lair.start_at")}</span>
          {savepoints.map((phase) => (
            <PosterKey
              key={phase}
              selected={phase === start}
              onClick={() => onStart(phase)}
              tip={phase > 1 ? t("lair.skip_note", { count: phase - 1, phase }) : undefined}
              className='h-9 min-w-11 px-2 tabular-nums'>
              {phase}
            </PosterKey>
          ))}
        </div>
      )}
    </>
  );
};

/**
 * A boss on its poster: the whole drawing on a flat ground of its own colour,
 * light enough that the dark figure stands out, its name and what is played.
 * The picked one opens up and takes how the next run is entered; the others
 * are one big key.
 */
const BossPoster = ({ boss, selected, onSelect }: { boss: BossDefinition; selected: boolean; onSelect: () => void }) => {
  const uid = useAppSelector(selectUserAuth);
  const { record } = useBossRecord(uid ?? null, boss.id);
  const { t, bossName } = useBossText(boss);
  const difficulty = useBossLobbyStore((s) => s.difficulty);
  const setDifficulty = useBossLobbyStore((s) => s.setDifficulty);
  const [chosenStart, setChosenStart] = useState(1);
  // A savepoint picked on another difficulty may not be open on this one.
  const start = savepointsFor(record, difficulty).includes(chosenStart) ? chosenStart : 1;
  const fightHref = `/practice/boss/${boss.id}?difficulty=${difficulty}${start > 1 ? `&start=${start}` : ""}`;
  // The changeling is played unlike the others: it has a guide of its own, shown before its first fight.
  const hasGuide = boss.drill === "changes";
  const guideSeen = useBossLobbyStore((s) => s.guidesSeen.includes(boss.id));
  const markGuideSeen = useBossLobbyStore((s) => s.markGuideSeen);
  const [howOpen, setHowOpen] = useState(false);
  // The fight's page takes a moment to load — the key shows it is on its way.
  const [entering, setEntering] = useState(false);
  const Name = selected ? "h1" : "span";

  return (
    <article
      style={posterStyle(boss.id)}
      className={cn(
        // Its colours are the boss's in both themes.
        "force-dark group relative w-full min-w-0 overflow-hidden rounded-lg lg:h-full lg:basis-0 lg:transition-[flex-grow] lg:duration-slow lg:motion-reduce:transition-none",
        selected ? "h-[28rem] lg:grow-[2.15]" : "h-28 lg:grow",
      )}>
      <div
        className={cn(
          "pointer-events-none absolute transition-[filter] duration-base",
          // Waiting, a boss stands by its name on a phone and fills its column on a desktop.
          selected
            ? "left-1/2 top-2 h-[66%] -translate-x-1/2 lg:top-[3%] lg:h-[66%]"
            : "right-0 top-1 h-40 brightness-[.82] saturate-[.72] group-hover:brightness-100 group-hover:saturate-100 lg:left-1/2 lg:right-auto lg:top-[8%] lg:h-[62%] lg:-translate-x-1/2",
        )}>
        <BossArt boss={boss} className='aspect-[480/380] h-full max-w-none' pattern={[1, 3, 2, 4]} />
      </div>

      {record.runs > 0 && (
        <p className={cn("absolute left-5 top-4 text-sm text-white/90", !selected && "max-lg:hidden")}>
          {t("lair.phase_label")} <span className='font-teko text-3xl leading-none tabular-nums text-white'>{record.bestPhase}</span>
        </p>
      )}

      <div
        style={selected ? posterFadeStyle(boss.id) : undefined}
        className={cn(
          "absolute inset-x-0 bottom-0 space-y-5 px-5 pb-5",
          selected ? "pt-24 lg:px-6 lg:pb-6" : "max-lg:top-0 max-lg:flex max-lg:flex-col max-lg:justify-center max-lg:pb-0",
        )}>
        <div className='space-y-1'>
          <Name
            className={cn(
              "block font-display font-extrabold leading-tight tracking-tight text-white",
              selected ? "text-3xl lg:text-4xl" : "max-w-[60%] text-xl lg:max-w-none",
            )}>
            {bossName}
          </Name>
          <p className={cn("text-white/85", selected ? "text-base" : "text-sm")}>{t("lair.skill")}</p>
        </div>

        {selected && (
          <>
            <div className='hidden space-y-3 lg:block'>
              <FightSetup
                record={record}
                difficulty={difficulty}
                onDifficulty={setDifficulty}
                start={start}
                onStart={setChosenStart}
                t={t}
              />
              <div className='flex gap-2.5'>
                <Button asChild size='xl' className='flex-1'>
                  <Link
                    href={fightHref}
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                      // The first time, the fight waits for how it is played.
                      if (hasGuide && !guideSeen) {
                        event.preventDefault();
                        setHowOpen(true);
                        return;
                      }
                      setEntering(true);
                    }}>
                    {entering ? <Loader2 className='animate-spin' aria-hidden /> : <Swords aria-hidden />}
                    {t("lair.fight")}
                  </Link>
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      onClick={() => setHowOpen(true)}
                      aria-label={t("guide.open")}
                      className={cn(POSTER_KEY, posterKeyFace(false), "h-12 w-12 shrink-0")}>
                      <CircleHelp aria-hidden className='size-6' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("guide.open")}</TooltipContent>
                </Tooltip>
              </div>
            </div>
            {/* Below `lg`: a fight needs the room and the tab speed of a computer screen. */}
            <p className='flex items-center gap-2.5 text-base font-semibold text-white lg:hidden'>
              <Monitor aria-hidden className='size-5 shrink-0' />
              {t("lair.on_computer")}
            </p>
          </>
        )}
      </div>

      {!selected && (
        <button
          type='button'
          onClick={onSelect}
          aria-label={bossName}
          className='absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white'
        />
      )}

      {hasGuide ? (
        <ChangelingGuide
          boss={boss}
          open={howOpen}
          onOpenChange={(open) => {
            setHowOpen(open);
            if (!open) markGuideSeen(boss.id);
          }}
          fightHref={fightHref}
        />
      ) : (
        <BossHowTo boss={boss} open={howOpen} onOpenChange={setHowOpen} />
      )}
    </article>
  );
};

/** The boss select screen: three posters side by side, the picked one open, and what a fight is. */
export const BossesView = () => {
  // The remembered difficulty and boss are read after the first paint, so
  // the page the server sent and the one hydrated over it agree.
  useEffect(() => {
    void useBossLobbyStore.persist.rehydrate();
  }, []);
  const bossId = useBossLobbyStore((s) => s.bossId);
  const setBossId = useBossLobbyStore((s) => s.setBossId);

  return (
    <div className={cn("space-y-10", PAGE_CONTENT)}>
      <TooltipProvider delayDuration={200}>
        <div className='flex flex-col gap-3 lg:h-[41rem] lg:flex-row'>
          {BOSSES.map((boss) => (
            <BossPoster key={boss.id} boss={boss} selected={boss.id === bossId} onSelect={() => setBossId(boss.id)} />
          ))}
        </div>
      </TooltipProvider>
      <FightPrimer />
    </div>
  );
};
