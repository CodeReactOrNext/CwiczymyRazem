"use client";

import { getFusionQuote } from "feature/arsenal/data/fusion";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

import type { PartId } from "../../types/arsenal.types";
import { CountUp } from "../CaseOpeningModal/CountUp";
import { PartIcon } from "../Parts/PartIcon";
import { TierPlate } from "../TierPlate";
import type { ScenePhase } from "./ArsenalScene";
import { ArsenalScene } from "./ArsenalScene";
import {
  ImpactFlash,
  ImpactRings,
  SparkBurst,
  SparkConverge,
  StageLight,
} from "./sceneFx";
import type { ActiveScene } from "./sceneStore";

type ReworkRequest = Extract<ActiveScene, { type: "rework" }>;

/** The plates drawn on the orbit — a stack of 40 is still drawn as eight. */
const MAX_ORBIT = 8;
const ORBIT_RADIUS = 92;
/** When the plates meet in the middle and the new part comes out. */
const IMPACT = 0.4;

interface OrbitProps {
  angles: number[];
  fused: boolean;
  color: string;
  partId: PartId;
}

/**
 * The stack going in. While it waits it circles; once the answer is in every
 * plate is pulled to the middle at once.
 *
 * The spin is a motion value advanced by hand rather than a looping animation,
 * so it can simply stop where it is: a looping `rotate` swapped for a new target
 * swings the whole ring back to zero first, and the plates visibly jump.
 */
const Orbit = ({ angles, fused, color, partId }: OrbitProps) => {
  const spin = useMotionValue(0);
  // Set by hand, so MotionConfig's reduced-motion switch never sees it.
  const reduceMotion = useReducedMotion();
  useAnimationFrame((_, delta) => {
    if (!fused && !reduceMotion) spin.set(spin.get() + delta * 0.06);
  });

  return (
    <motion.div
      className='absolute flex items-center justify-center will-change-transform'
      style={{ rotate: spin }}>
      {angles.map((angle, i) => (
        <motion.div
          key={i}
          className='absolute will-change-transform'
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
          animate={
            fused
              ? { opacity: [1, 1, 0], x: 0, y: 0, scale: 0.3 }
              : {
                  opacity: 1,
                  x: Math.cos(angle) * ORBIT_RADIUS,
                  y: Math.sin(angle) * ORBIT_RADIUS,
                  scale: 1,
                }
          }
          transition={
            fused
              ? { duration: IMPACT, ease: "easeIn" }
              : { delay: i * 0.05, type: "spring", stiffness: 200, damping: 18 }
          }>
          <TierPlate color={color} size={44}>
            <PartIcon partId={partId} size={26} />
          </TierPlate>
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Reworking parts up a tier, as a fusion.
 *
 * The stack that goes in circles the bench in its own tier's colour while the
 * request is out; when it lands the pieces are pulled into the middle, meet, and
 * one part of the next tier comes out of the flash. The light turns from the old
 * tier's colour to the new one's at that instant — the colour change *is* the
 * upgrade, so nothing else on screen needs to say "Premium".
 */
export const ReworkScene = ({
  scene,
  onClose,
}: {
  scene: ReworkRequest;
  onClose: () => void;
}) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const { partId, tier, crafts, result } = scene;

  const quote = getFusionQuote(partId, tier, crafts);
  const inputQty = result?.spent.qty ?? quote?.inputQty ?? crafts;
  const outputTier = result?.produced.tier ?? quote?.outputTier ?? tier;
  const produced = result?.produced.qty ?? crafts;

  const inColor = PART_TIER_COLORS[tier];
  const outColor = PART_TIER_COLORS[outputTier];
  const plates = Math.min(inputQty, MAX_ORBIT);
  const orbit = Array.from(
    { length: plates },
    (_, i) => (i / plates) * Math.PI * 2,
  );

  const caption = {
    working: t("scene.rework.working", {
      count: inputQty,
      part: labels.partName(tier, partId),
    }),
    done: t("scene.rework.done"),
  };

  const stage = (phase: ScenePhase) => {
    const fused = phase !== "working";

    return (
      <>
        <StageLight
          color={fused ? outColor : inColor}
          strength={fused ? "38" : "1f"}
        />

        <Orbit angles={orbit} fused={fused} color={inColor} partId={partId} />

        {fused ? (
          <>
            <ImpactFlash delay={IMPACT - 0.05} />
            <ImpactRings color={outColor} delay={IMPACT} size={120} />
            <SparkBurst
              color={outColor}
              delay={IMPACT}
              count={16}
              distance={115}
            />

            {/* What came out. */}
            <motion.div
              className='absolute will-change-transform'
              initial={{ opacity: 0, scale: 0.3, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                // One spring for the pop: it overshoots and settles in a single
                // motion, where a 0.3 → 1.25 → 1 list stops dead at the peak.
                type: "spring",
                stiffness: 260,
                damping: 15,
                delay: IMPACT,
                opacity: { duration: 0.12, delay: IMPACT },
              }}>
              <TierPlate color={outColor} size={112}>
                <PartIcon partId={partId} size={68} />
              </TierPlate>
            </motion.div>
          </>
        ) : (
          <SparkConverge color={inColor} count={8} radius={130} loop />
        )}
      </>
    );
  };

  const footer = (phase: ScenePhase) => {
    if (phase === "working" || !result) return null;

    return (
      <motion.div
        className='flex flex-col items-center gap-1.5'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: IMPACT + 0.2, duration: 0.3 }}>
        <span className='flex items-baseline gap-2'>
          <span className='font-display text-5xl font-black tabular-nums text-zinc-100'>
            ×<CountUp to={produced} delay={IMPACT + 0.2} duration={0.6} />
          </span>
        </span>
        <span className='text-base font-black' style={{ color: outColor }}>
          {labels.partName(outputTier, partId)}
        </span>
        <span className='text-xs text-zinc-500'>
          {t("scene.rework.from", {
            count: inputQty,
            part: labels.partName(tier, partId),
          })}
        </span>
      </motion.div>
    );
  };

  return (
    <ArsenalScene
      ready={!!result}
      windUp={1.1}
      revealFor={IMPACT + 0.9}
      color={outColor}
      caption={caption}
      summary={t("toasts.reworked", {
        qty: produced,
        part: labels.partName(outputTier, partId),
      })}
      stage={stage}
      footer={footer}
      onClose={onClose}
    />
  );
};
