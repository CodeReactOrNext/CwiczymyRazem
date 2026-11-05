import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { useIsLeftHanded } from "hooks/useHandedness";
import { useTranslation } from "hooks/useTranslation";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

import { fingeringSteps, stepIndexAt } from "./fingeringSteps";

interface FingeringHandProps {
  measures: TablatureMeasure[];
  /** Live playhead in beats, written every frame by TablatureSection. */
  currentBeatRef: React.MutableRefObject<number>;
  /** Where the playhead rests while stopped (seek, reset, pause). */
  restingBeat: number;
  isPlaying: boolean;
  /** Height of the tab board beside it; the hand fills most of it. */
  boardHeight: number;
}

const ART = "/images/practice/fingering-hand";
/** Source art is 332×400: an open left hand, palm side, index on the left. */
const ASPECT = 332 / 400;

/**
 * Centre of each finger's number on the art, in % of its box — measured off
 * the finger masks, the same distance below every fingertip.
 */
const TIPS: Record<number, { left: number; top: number }> = {
  1: { left: 36.1, top: 14.2 },
  2: { left: 61.3, top: 8 },
  3: { left: 78, top: 15.5 },
  4: { left: 91.3, top: 30 },
};

/**
 * An illustrated fretting hand beside the tab board: the fingers pressing the
 * current step light up in their color, the rest stay skin. Renders nothing unless the exercise's notes carry fingering.
 */
export function FingeringHand({
  measures,
  currentBeatRef,
  restingBeat,
  isPlaying,
  boardHeight,
}: FingeringHandProps) {
  const { t } = useTranslation("session");
  const leftHanded = useIsLeftHanded();
  const steps = useMemo(() => fingeringSteps(measures), [measures]);

  // The cursor moves every frame, but the grip only changes a few times a
  // second: poll the ref and render only when the step does.
  const [liveIdx, setLiveIdx] = useState(0);
  useEffect(() => {
    if (!isPlaying || steps.length === 0) return undefined;
    let rafId: number;
    const tick = () => {
      const idx = stepIndexAt(steps, currentBeatRef.current);
      setLiveIdx((prev) => (prev === idx ? prev : idx));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, steps, currentBeatRef]);

  if (steps.length === 0) return null;

  const idx = isPlaying
    ? liveIdx
    : Math.max(0, stepIndexAt(steps, restingBeat));
  const step = steps[idx];
  const pressed = new Set(step.notes.map((n) => n.finger));

  const drawH = Math.round(Math.min(200, Math.max(100, boardHeight * 0.7)));

  return (
    <div className='flex shrink-0 items-center justify-center rounded-md bg-zinc-900/40 px-4'>
      <div
        role='img'
        aria-label={
          leftHanded ? t("fretboard.diagram_lefty") : t("fretboard.diagram")
        }
        className='relative select-none'
        style={{
          height: drawH,
          width: Math.round(drawH * ASPECT),
          // The art is a right-handed player's left hand; lefties fret with the other one.
          transform: leftHanded ? "scaleX(-1)" : undefined,
          // The wrist is cut flat at the bottom edge — let it fade out instead.
          maskImage: "linear-gradient(to bottom, black 78%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 78%, transparent 100%)",
        }}>
        <Image
          fill
          sizes='200px'
          src={`${ART}/hand.webp`}
          alt=''
          draggable={false}
        />
        {[1, 2, 3, 4].map((finger) => (
          <Image
            fill
            sizes='200px'
            key={finger}
            src={`${ART}/finger-${finger}.webp`}
            alt=''
            draggable={false}
            className={cn(
              "transition-opacity duration-100",
              pressed.has(finger) ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        {[...pressed].map((finger) => (
          <span
            key={finger}
            className='absolute text-xs font-bold leading-none text-zinc-950'
            style={{
              left: `${TIPS[finger].left}%`,
              top: `${TIPS[finger].top}%`,
              transform: `translate(-50%, -50%)${leftHanded ? " scaleX(-1)" : ""}`,
            }}>
            {finger}
          </span>
        ))}
      </div>
    </div>
  );
}
