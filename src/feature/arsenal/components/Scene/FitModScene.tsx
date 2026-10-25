"use client";

import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { motion } from "framer-motion";

import { CountUp } from "../CaseOpeningModal/CountUp";
import { MOD_ACCENT } from "../TierPlate";
import { ModArt } from "../Workshop/ModArt";
import type { ScenePhase } from "./ArsenalScene";
import { ArsenalScene } from "./ArsenalScene";
import {
  ImpactFlash,
  ImpactRings,
  SparkBurst,
  SparkConverge,
  StageLight,
  SubjectArt,
} from "./sceneFx";
import type { ActiveScene } from "./sceneStore";
import { subjectOfItem } from "./sceneSubject";

type FitRequest = Extract<ActiveScene, { type: "fit" }>;

/** Where the mod waits, off the instrument's shoulder. */
const PARKED = { x: -130, y: -78 };
/** When it lands. */
const IMPACT = 0.38;
const COUNT_FROM = IMPACT + 0.05;
const COUNT_FOR = 0.9;

/**
 * A mod out of the stash going onto an instrument.
 *
 * The bench shows this as a result card; from the stash it used to be a toast
 * that said "+4 level" over a dialog closing. Here the mod hangs beside the
 * instrument while the request is out, then goes into it — the hit is purple,
 * because that is what a mod is everywhere in the arsenal — and the Item Level
 * rolls up by exactly what the server granted.
 */
export const FitModScene = ({
  scene,
  onClose,
}: {
  scene: FitRequest;
  onClose: () => void;
}) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const { subject, featureId, label, result } = scene;

  const modName = labels.mod(featureId, label);
  const after = result
    ? (subjectOfItem(subject.kind, result.item)?.level ??
      subject.level + result.levelGain)
    : subject.level;
  const gain = result?.levelGain ?? 0;
  const before = after - gain;

  const caption = {
    working: t("scene.fit.working", { mod: modName, name: subject.name }),
    done: t("scene.fit.done"),
  };

  const stage = (phase: ScenePhase) => {
    const landed = phase !== "working";

    return (
      <>
        <StageLight
          color={landed ? MOD_ACCENT : subject.color}
          strength={landed ? "2e" : "1f"}
        />

        {/* The instrument. It takes the hit. */}
        <motion.div
          className='absolute will-change-transform'
          // A bump on the hit — scale only: the flash over the stage does the
          // lighting, where a brightness filter on the art repainted it per frame.
          animate={landed ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{
            delay: IMPACT,
            duration: 0.45,
            times: [0, 0.25, 1],
            ease: ["easeOut", "easeInOut"],
          }}>
          <SubjectArt subject={subject} />
        </motion.div>

        {/* The mod: hovers while it waits, then goes in. */}
        <motion.div
          className='absolute will-change-transform'
          initial={{ opacity: 0, ...PARKED, scale: 0.8 }}
          animate={
            landed
              ? { opacity: [1, 1, 0], x: 0, y: 0, scale: 0.35, rotate: 20 }
              : {
                  opacity: 1,
                  ...PARKED,
                  y: [PARKED.y, PARKED.y - 10, PARKED.y],
                  scale: 1,
                }
          }
          transition={
            landed
              ? { duration: IMPACT, ease: "easeIn" }
              : {
                  y: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
                  default: { duration: 0.35 },
                }
          }>
          <ModArt modId={featureId} size={84} />
        </motion.div>

        {landed ? (
          <>
            <ImpactFlash delay={IMPACT - 0.05} />
            <ImpactRings color={MOD_ACCENT} delay={IMPACT} />
            <SparkBurst color={MOD_ACCENT} delay={IMPACT} count={14} />
          </>
        ) : (
          <SparkConverge color={MOD_ACCENT} count={8} radius={120} loop />
        )}
      </>
    );
  };

  const footer = (phase: ScenePhase) => (
    <>
      <div className='flex items-center gap-2.5'>
        <ModArt modId={featureId} size={28} />
        <span className='text-sm font-bold' style={{ color: MOD_ACCENT }}>
          {modName}
          {result ? ` +${result.points}` : ""}
        </span>
      </div>

      <div className='flex flex-col items-center gap-1'>
        <span className='text-xs font-semibold text-zinc-500'>
          {t("merge_anim.level")}
        </span>
        <div className='flex items-baseline gap-3'>
          <span className='font-display text-6xl font-black tabular-nums text-zinc-100'>
            {phase === "working" ? (
              before
            ) : (
              <CountUp
                from={before}
                to={after}
                delay={COUNT_FROM}
                duration={COUNT_FOR}
              />
            )}
          </span>
          {phase !== "working" && gain !== 0 && (
            <motion.span
              className='text-2xl font-black tabular-nums'
              style={{ color: MOD_ACCENT }}
              initial={{ opacity: 0, y: 10, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 16,
                delay: COUNT_FROM,
                opacity: { duration: 0.15, delay: COUNT_FROM },
              }}>
              {gain > 0 ? "+" : ""}
              {gain}
            </motion.span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <ArsenalScene
      ready={!!result}
      windUp={0.8}
      revealFor={COUNT_FROM + COUNT_FOR + 0.2}
      color={MOD_ACCENT}
      caption={caption}
      summary={t("toasts.mod_fitted", {
        name: modName,
        points: result?.points ?? 0,
      })}
      stage={stage}
      footer={footer}
      sound='levelUp'
      onClose={onClose}
    />
  );
};
