"use client";

import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { CountUp } from "../CaseOpeningModal/CountUp";
import type { ScenePhase } from "./ArsenalScene";
import { ArsenalScene } from "./ArsenalScene";
import {
  HammerStrikes,
  ImpactFlash,
  ImpactRings,
  SparkBurst,
  StageLight,
  STRIKE_FLINCH,
  SubjectArt,
} from "./sceneFx";
import type { ActiveScene } from "./sceneStore";
import { subjectOfItem } from "./sceneSubject";

type BuildRequest = Extract<ActiveScene, { type: "build" }>;

/**
 * The timeline of the payoff, in seconds from the moment the server answers:
 *
 *   0.00  the last blow lands — flash, rings, sparks in the rarity's colour
 *   0.10  the Item Level rolls up by what the build was worth
 *   0.45  on a promotion only: a second, bigger hit in the *new* rarity's
 *         colour, and the rarity's name turns over to the new one
 */
const COUNT_FROM = 0.1;
const COUNT_FOR = 0.9;
const PROMOTE_AT = 0.45;

/**
 * A build level bought at the bench.
 *
 * While the request is out the instrument stands lit on the bench and the
 * hammer goes at it. When it lands the level rolls up — and when the build was
 * the one that promotes the item, the scene hits twice: once for the work, once
 * for the new rarity, whose colour takes over the stage. A promotion is the
 * rarest thing the bench does, so it is the one beat allowed to be bigger.
 */
export const BuildScene = ({
  scene,
  onClose,
}: {
  scene: BuildRequest;
  onClose: () => void;
}) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const { subject, result } = scene;

  const after = result ? subjectOfItem(subject.kind, result.item) : null;
  const gain = result?.levelGain ?? 0;
  const levelAfter = after?.level ?? subject.level + gain;
  const levelBefore = levelAfter - gain;
  const promoted = !!after && after.rarity !== subject.rarity;
  const finalColor = after?.color ?? subject.color;

  const caption = {
    working: t("scene.build.working", { name: subject.name }),
    done:
      promoted && after
        ? t("scene.build.promoted", { rarity: labels.rarity(after.rarity) })
        : t("workshop.build_n", { build: result?.buildLevel ?? "" }),
  };

  const stage = (phase: ScenePhase) => {
    const landed = phase !== "working";

    return (
      <>
        <StageLight color={subject.color} strength={landed ? "30" : "1f"} />
        {/* The new rarity's light comes up over the old one on the second hit. */}
        {landed && promoted && after && (
          <motion.div
            aria-hidden
            className='pointer-events-none absolute inset-0'
            style={{
              background: `radial-gradient(closest-side, ${after.color}3d 0%, transparent 100%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: PROMOTE_AT, duration: 0.45, ease: "linear" }}
          />
        )}

        <motion.div
          className='absolute will-change-transform'
          {...(landed
            ? {
                animate: { scale: [1, 1.12, 1] },
                transition: {
                  duration: 0.5,
                  times: [0, 0.2, 1],
                  ease: ["easeOut", "easeInOut"],
                },
              }
            : STRIKE_FLINCH)}>
          <SubjectArt subject={subject} />
        </motion.div>

        {landed ? (
          <>
            <ImpactFlash />
            <ImpactRings color={subject.color} />
            <SparkBurst color={subject.color} count={14} />
            {promoted && after && (
              <>
                <ImpactFlash delay={PROMOTE_AT} />
                <ImpactRings
                  color={after.color}
                  delay={PROMOTE_AT}
                  size={170}
                />
                <SparkBurst
                  color={after.color}
                  delay={PROMOTE_AT}
                  count={22}
                  distance={160}
                  spread={40}
                />
              </>
            )}
          </>
        ) : (
          <HammerStrikes />
        )}
      </>
    );
  };

  const footer = (phase: ScenePhase) => {
    const landed = phase !== "working";

    return (
      <>
        {landed && promoted && after && (
          <div className='flex items-center gap-3'>
            <motion.span
              className='rounded px-3 py-1.5 text-sm font-bold'
              style={{
                backgroundColor: `${subject.color}14`,
                color: subject.color,
              }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: PROMOTE_AT, duration: 0.3 }}>
              {labels.rarity(subject.rarity)}
            </motion.span>
            <ArrowRight size={16} className='text-zinc-600' />
            <motion.span
              className='rounded px-4 py-1.5 text-base font-black will-change-transform'
              style={{
                backgroundColor: `${after.color}1f`,
                color: after.color,
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 15,
                delay: PROMOTE_AT,
                opacity: { duration: 0.15, delay: PROMOTE_AT },
              }}>
              {labels.rarity(after.rarity)}
            </motion.span>
          </div>
        )}

        <div className='flex flex-col items-center gap-1'>
          <span className='text-xs font-semibold text-zinc-500'>
            {t("merge_anim.level")}
          </span>
          <div className='flex items-baseline gap-3'>
            <span className='font-display text-6xl font-black tabular-nums text-zinc-100'>
              {landed ? (
                <CountUp
                  from={levelBefore}
                  to={levelAfter}
                  delay={COUNT_FROM}
                  duration={COUNT_FOR}
                />
              ) : (
                levelBefore
              )}
            </span>
            {landed && gain > 0 && (
              <motion.span
                className='text-2xl font-black tabular-nums text-cyan-400 will-change-transform'
                initial={{ opacity: 0, y: 10, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 16,
                  delay: COUNT_FROM,
                  opacity: { duration: 0.15, delay: COUNT_FROM },
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
      windUp={1.2}
      revealFor={promoted ? PROMOTE_AT + 1.3 : COUNT_FROM + COUNT_FOR + 0.25}
      autoClose={promoted ? 3.4 : 2.6}
      color={finalColor}
      caption={caption}
      summary={t("toasts.build_done", {
        build: result?.buildLevel ?? "",
        gain,
      })}
      stage={stage}
      footer={footer}
      sound='levelUp'
      onClose={onClose}
    />
  );
};
