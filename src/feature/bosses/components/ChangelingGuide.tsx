import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { AnimatePresence, m } from "framer-motion";
import type { Translate } from "lib/i18n/translate";
import { fadeUp } from "lib/motion/motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { useBossText } from "../hooks/useBossText";
import type { BossDefinition, ChangesVariation } from "../types/boss.types";
import { homeWindow } from "../utils/changesFretboard";
import { chordScale } from "../utils/changesHarmony";
import type { ChangesLive } from "../utils/changesLive";
import { IDLE_CHANGES } from "../utils/changesLive";
import { ChordLane } from "./ChangesBoard";
import { ChangesFretboard } from "./ChangesFretboard";
import { ComboView } from "./ComboHud";

/** The pictures' progression: Am, F and G in A minor, a bar each. */
const DEMO: ChangesVariation = {
  bpm: 72,
  key: { tonic: 9, mode: "aeolian" },
  family: "triads",
  progression: ["Am", "F", "G"],
  beatsPerChord: 4,
  units: [
    { chord: "Am", beats: 4, quake: false },
    { chord: "F", beats: 4, quake: false },
    { chord: "G", beats: 4, quake: false },
  ],
};

/** Two beats into the Am: beat 1 hit with a tone of it, beat 3 just ahead. */
const DEMO_LIVE: ChangesLive = {
  ...IDLE_CHANGES,
  unit: 0,
  beatsLeft: 2,
  landed: { 0: true },
  strongBeats: { "0:0": true },
};

const DEMO_COMBO = {
  tricks: ["onTheOne", "smooth", "onTheOne"] as const,
  points: 9,
};

/** A picture of a part of the fight, on the board's own dark ground. */
const Screen = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    aria-hidden
    className={cn(
      "pointer-events-none select-none rounded-lg bg-zinc-950/70 p-4",
      className,
    )}>
    {children}
  </div>
);

/** One bar's four beats: a chord tone due on 1 and 3, the scale on 2 and 4 — beat 1 hit, beat 3 missed. */
const AccentsPicture = ({ t }: { t: Translate }) => (
  <Screen>
    <ol className='grid grid-cols-4 gap-3'>
      {[0, 1, 2, 3].map((beat) => {
        const strong = beat % 2 === 0;
        return (
          <li key={beat} className='space-y-2 text-center'>
            <div className='flex h-10 items-end'>
              <span
                className={cn(
                  "w-full rounded-full",
                  strong ? "h-9" : "h-3",
                  beat === 0
                    ? "bg-emerald-500"
                    : beat === 2
                      ? "bg-orange-500"
                      : "bg-zinc-600",
                )}
              />
            </div>
            <p className='font-teko text-3xl leading-none text-zinc-100'>
              {beat + 1}
            </p>
            <p
              className={cn(
                "text-xs",
                strong ? "font-medium text-zinc-200" : "text-zinc-500",
              )}>
              {strong ? t("guide.accents.chord") : t("guide.accents.scale")}
            </p>
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                beat === 0
                  ? "text-emerald-400"
                  : beat === 2
                    ? "text-orange-400"
                    : "text-zinc-500",
              )}>
              {beat === 0 ? "A ✓" : beat === 2 ? "D ✕" : beat === 1 ? "B" : "G"}
            </p>
          </li>
        );
      })}
    </ol>
  </Screen>
);

interface GuideStep {
  key: string;
  picture: ReactNode;
  /** Bullet lines under the text, for the step that lists what hurts. */
  list?: string[];
}

interface ChangelingGuideProps {
  boss: BossDefinition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the fight is entered — the last step's button. */
  fightHref: string;
}

/**
 * How the changeling is fought, shown before the first run and on asking:
 * five steps, each with a picture made of the board's own parts — the lane
 * of chords, the strong beats, the neck, the combo — and what hurts.
 */
export const ChangelingGuide = ({
  boss,
  open,
  onOpenChange,
  fightHref,
}: ChangelingGuideProps) => {
  const { t } = useBossText(boss);
  const [step, setStep] = useState(0);

  const steps: GuideStep[] = [
    {
      key: "lane",
      picture: (
        <Screen>
          <ChordLane
            variation={DEMO}
            live={DEMO_LIVE}
            current={0}
            started
            veiled={false}
            t={t}
            stillAt={1.6}
          />
        </Screen>
      ),
    },
    { key: "accents", picture: <AccentsPicture t={t} /> },
    {
      key: "neck",
      picture: (
        <Screen className='flex justify-center'>
          <ChangesFretboard
            chord='Am'
            scale={chordScale("Am", DEMO.key)}
            musicKey={DEMO.key}
            start={homeWindow(DEMO.key.tonic)}
            guideTones={false}
            played={null}
            label={t("board.fretboard", { chord: "Am" })}
          />
        </Screen>
      ),
    },
    {
      key: "combo",
      picture: (
        <Screen className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <p className='text-xs text-zinc-500'>{t("guide.combo.strung")}</p>
            <ComboView
              combo={DEMO_COMBO}
              comboKey='demo'
              ending={null}
              t={t}
              className='h-16'
            />
          </div>
          <div className='space-y-2'>
            <p className='text-xs text-zinc-500'>{t("guide.combo.banked")}</p>
            <ComboView
              combo={null}
              comboKey='demo'
              ending={{
                id: 1,
                banked: true,
                combo: { ...DEMO_COMBO, multiplier: 3, value: 27 },
              }}
              t={t}
              className='h-16'
            />
          </div>
        </Screen>
      ),
    },
    {
      key: "watch",
      picture: null,
      list: ["outside", "strong", "silent", "rush", "headphones"].map((item) =>
        t(`guide.watch.${item}`),
      ),
    },
  ];
  const current = steps[step];
  const last = step === steps.length - 1;

  const close = (next: boolean) => {
    onOpenChange(next);
    // Opened again, it starts from the top.
    if (!next) setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='max-w-2xl gap-0 border-0 bg-zinc-900 p-0 text-zinc-100 shadow-none sm:rounded-xl'>
        <div className='space-y-6 p-6 sm:p-8'>
          <ol
            className='flex gap-1.5 pr-10'
            aria-label={t("guide.progress", {
              step: step + 1,
              count: steps.length,
            })}>
            {steps.map((s, i) => (
              <li key={s.key} className='flex-1'>
                <button
                  type='button'
                  onClick={() => setStep(i)}
                  aria-label={t(`guide.${s.key}.title`)}
                  aria-current={i === step ? "step" : undefined}
                  className={cn(
                    "block h-1.5 w-full rounded-full transition-colors duration-fast",
                    i <= step ? "bg-zinc-100" : "bg-zinc-700 hover:bg-zinc-600",
                  )}
                />
              </li>
            ))}
          </ol>

          <AnimatePresence mode='wait' initial={false}>
            <m.div
              key={current.key}
              variants={fadeUp}
              initial='hidden'
              animate='visible'
              exit='hidden'
              className='space-y-5'>
              <div className='space-y-2'>
                <p className='text-xs tabular-nums text-zinc-500'>
                  {t("guide.progress", { step: step + 1, count: steps.length })}
                </p>
                <DialogTitle className='font-display text-2xl font-semibold text-zinc-50'>
                  {t(`guide.${current.key}.title`)}
                </DialogTitle>
              </div>
              {current.picture}
              <DialogDescription className='text-sm leading-relaxed text-zinc-300'>
                {t(`guide.${current.key}.body`)}
              </DialogDescription>
              {current.list && (
                <ul className='space-y-2.5'>
                  {current.list.map((line, i) => (
                    <li
                      key={line}
                      className='flex gap-3 text-sm leading-relaxed text-zinc-300'>
                      <span
                        className={cn(
                          "shrink-0 font-semibold",
                          i === current.list!.length - 1
                            ? "text-zinc-500"
                            : "text-orange-400",
                        )}
                        aria-hidden>
                        {i === current.list!.length - 1 ? "·" : "✕"}
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </m.div>
          </AnimatePresence>
        </div>

        <div className='flex items-center justify-between gap-3 bg-zinc-950/40 px-6 py-4 sm:rounded-b-xl sm:px-8'>
          <Button
            type='button'
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className='h-10 bg-zinc-800 px-5 text-zinc-100 shadow-none hover:bg-zinc-700'>
            {t("guide.back")}
          </Button>
          {last ? (
            <Button
              asChild
              className='h-10 bg-white px-8 text-zinc-950 shadow-none hover:bg-zinc-200'>
              <Link href={fightHref} onClick={() => onOpenChange(false)}>
                {t("lair.fight")}
              </Link>
            </Button>
          ) : (
            <Button
              type='button'
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className='h-10 bg-white px-8 text-zinc-950 shadow-none hover:bg-zinc-200'>
              {t("guide.next")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
