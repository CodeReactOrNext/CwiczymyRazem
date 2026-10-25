"use client";

import {
  CONDITION_TIERS,
  getConditionGrade,
  getConditionTier,
} from "feature/arsenal/data/itemStats";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { motion } from "framer-motion";
import { EASE } from "lib/motion/motion";
import { ArrowRight } from "lucide-react";

import { CountUp } from "../CaseOpeningModal/CountUp";
import type { ScenePhase } from "./ArsenalScene";
import { ArsenalScene } from "./ArsenalScene";
import {
  ImpactFlash,
  ImpactRings,
  SparkBurst,
  StageLight,
  SubjectArt,
} from "./sceneFx";
import type { ActiveScene } from "./sceneStore";
import { subjectOfItem } from "./sceneSubject";

type RestoreRequest = Extract<ActiveScene, { type: "restore" }>;

/** How the instrument looks before the work: drained, dulled, a little yellowed. */
const WORN = "grayscale(0.85) sepia(0.35) brightness(0.55) contrast(0.95)";
/** The scan line: the instrument lit up, seen through a thin band. */
const SCAN_LIGHT = "brightness(2) saturate(0.6)";
/** Height of that band, as a share of the instrument. */
const BAND = 10;

/**
 * The clip for the band with its centre `progress` (0–1) of the way down.
 * Starts and ends just outside the instrument, so it enters and leaves whole.
 */
const band = (progress: number) => {
  const centre = -BAND / 2 + progress * (100 + BAND);
  return `inset(${centre - BAND / 2}% 0 ${100 - (centre + BAND / 2)}% 0)`;
};

/** The pass of the cloth that takes the wear off, top to bottom. */
const WIPE_FOR = 0.8;
const COUNT_FOR = 0.7;

/** Where the glints of the polish catch while the work goes on, in px from centre. */
const GLINTS = [
  { x: -58, y: -42, delay: 0 },
  { x: 46, y: -64, delay: 0.35 },
  { x: 70, y: 18, delay: 0.7 },
  { x: -34, y: 56, delay: 1.05 },
  { x: 8, y: -8, delay: 1.4 },
];

/**
 * Restoring an instrument's condition, as a cleaning.
 *
 * The worn instrument is the clean one under a drained copy of itself. While the
 * request is out a scan line keeps passing down it and the polish catches here
 * and there; when it lands one pass wipes the drained copy away, top to bottom,
 * with the scan line on its edge, and the clean instrument is simply there
 * underneath. The condition meter refills in the new grade's colour on the same
 * pass — the grade's colour is the one the whole scene ends in, since that is
 * what was bought.
 *
 * Wipe and scan line are both clip-paths, which run on the compositor; the
 * copies' filters are set once and never animated. No blend modes: an overlay
 * light was rendered in an isolated layer and showed as a box around the art.
 */
export const RestoreScene = ({
  scene,
  onClose,
}: {
  scene: RestoreRequest;
  onClose: () => void;
}) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const { subject, conditionBefore, result } = scene;

  const conditionAfter = result?.condition ?? conditionBefore;
  const fromGrade = getConditionGrade(conditionBefore);
  const toGrade = getConditionGrade(conditionAfter);
  const tierBefore = getConditionTier(conditionBefore);
  const tierAfter = getConditionTier(conditionAfter);

  const gain = result?.levelGain ?? 0;
  const levelAfter = result
    ? (subjectOfItem(subject.kind, result.item)?.level ?? subject.level + gain)
    : subject.level;
  const levelBefore = levelAfter - gain;

  const caption = {
    working: t("scene.restore.working", { name: subject.name }),
    done: t("scene.restore.done", { grade: labels.condition(toGrade) }),
  };

  const stage = (phase: ScenePhase) => {
    const restored = phase !== "working";

    return (
      <>
        <StageLight
          color={restored ? toGrade.color : fromGrade.color}
          strength={restored ? "2e" : "14"}
        />

        <div className='relative'>
          {/* The clean instrument — there all along. */}
          <SubjectArt subject={subject} />

          {/* The wear over it, taken off by one pass from the headstock down —
              along the instrument, not across it: a guitar stands upright, and
              a sideways wipe spent most of its time crossing empty air. */}
          <motion.div
            className='absolute inset-0'
            style={{ filter: WORN }}
            initial={{ clipPath: "inset(0% 0 0 0)" }}
            animate={{
              clipPath: restored ? "inset(100% 0 0 0)" : "inset(0% 0 0 0)",
            }}
            transition={{ duration: WIPE_FOR, ease: EASE.inOut }}>
            <SubjectArt subject={subject} />
          </motion.div>

          {/*
            The scan line: a bright copy of the instrument itself, shown through
            a thin band. Being the instrument, it can only ever light the
            instrument — the transparent art around it stays transparent, so no
            box of light shows in the air around the shape. While the work goes
            on it keeps passing faintly; on the reveal it rides the wipe's edge.
          */}
          <motion.div
            key={restored ? "pass" : "polish"}
            className='absolute inset-0'
            style={{ filter: SCAN_LIGHT }}
            initial={{ clipPath: band(0), opacity: 0 }}
            animate={{
              clipPath: band(1),
              opacity: restored ? [0, 1, 1, 0] : [0, 0.55, 0.55, 0],
            }}
            transition={
              restored
                ? {
                    duration: WIPE_FOR,
                    ease: EASE.inOut,
                    opacity: {
                      inherit: true,
                      times: [0, 0.08, 0.85, 1],
                      ease: "linear",
                    },
                  }
                : {
                    duration: 1.4,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0.5,
                    opacity: {
                      inherit: true,
                      times: [0, 0.15, 0.85, 1],
                      ease: "linear",
                    },
                  }
            }>
            <SubjectArt subject={subject} />
          </motion.div>
        </div>

        {restored ? (
          <>
            <ImpactFlash delay={WIPE_FOR - 0.1} />
            <ImpactRings color={toGrade.color} delay={WIPE_FOR - 0.05} />
            <SparkBurst
              color={toGrade.color}
              delay={WIPE_FOR - 0.05}
              count={14}
            />
          </>
        ) : (
          GLINTS.map((glint, i) => (
            <motion.span
              key={i}
              aria-hidden
              className='absolute h-1.5 w-1.5 rounded-full bg-white will-change-transform'
              style={{ x: glint.x, y: glint.y }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 1, 0], scale: [0.3, 1.4, 0.3] }}
              transition={{
                delay: glint.delay,
                duration: 0.6,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 1.2,
              }}
            />
          ))
        )}
      </>
    );
  };

  const footer = (phase: ScenePhase) => {
    const restored = phase !== "working";

    return (
      <>
        {/* Grade: what it was, then what it is. */}
        <div className='flex items-center gap-3 text-sm font-bold'>
          <motion.span
            style={{ color: fromGrade.color }}
            animate={{ opacity: restored ? 0.5 : 1 }}
            transition={{ duration: 0.3 }}>
            {labels.condition(fromGrade)}
          </motion.span>
          {restored && (
            <>
              <ArrowRight size={14} className='text-zinc-600' />
              <motion.span
                className='text-base font-black will-change-transform'
                style={{ color: toGrade.color }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: WIPE_FOR - 0.05,
                  opacity: { duration: 0.15, delay: WIPE_FOR - 0.05 },
                }}>
                {labels.condition(toGrade)}
              </motion.span>
            </>
          )}
        </div>

        {/* The meter, refilled on the same pass as the wipe. */}
        <div className='flex w-56 items-center gap-1'>
          {Array.from({ length: CONDITION_TIERS }).map((_, i) => (
            <span
              key={i}
              className='relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-800'>
              {i < tierBefore && (
                <span
                  className='absolute inset-0'
                  style={{ background: fromGrade.color, opacity: 0.6 }}
                />
              )}
              {restored && i < tierAfter && (
                <motion.span
                  className='absolute inset-0 origin-left will-change-transform'
                  style={{ background: toGrade.color }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    delay: (i / CONDITION_TIERS) * WIPE_FOR,
                    duration: WIPE_FOR / CONDITION_TIERS + 0.1,
                    ease: "easeOut",
                  }}
                />
              )}
            </span>
          ))}
        </div>

        <div className='flex flex-col items-center gap-1'>
          <span className='text-xs font-semibold text-zinc-500'>
            {t("merge_anim.level")}
          </span>
          <div className='flex items-baseline gap-3'>
            <span className='font-display text-6xl font-black tabular-nums text-zinc-100'>
              {restored ? (
                <CountUp
                  from={levelBefore}
                  to={levelAfter}
                  delay={WIPE_FOR}
                  duration={COUNT_FOR}
                />
              ) : (
                levelBefore
              )}
            </span>
            {restored && gain > 0 && (
              <motion.span
                className='text-2xl font-black tabular-nums text-cyan-400 will-change-transform'
                initial={{ opacity: 0, y: 10, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 16,
                  delay: WIPE_FOR,
                  opacity: { duration: 0.15, delay: WIPE_FOR },
                }}>
                +{gain}
              </motion.span>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <ArsenalScene
      ready={!!result}
      windUp={1.3}
      revealFor={WIPE_FOR + COUNT_FOR + 0.2}
      color={toGrade.color}
      caption={caption}
      summary={t("toasts.restored", {
        grade: labels.condition(toGrade),
        gain,
      })}
      stage={stage}
      footer={footer}
      sound='levelUp'
      onClose={onClose}
    />
  );
};
