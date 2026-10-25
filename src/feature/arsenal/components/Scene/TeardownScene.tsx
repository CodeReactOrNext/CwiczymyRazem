"use client";

import { cn } from "assets/lib/utils";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import { getModDef } from "feature/arsenal/data/workshop";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { countScrapParts } from "feature/arsenal/utils/scrap";
import { motion } from "framer-motion";

import type {
  BulkScrapResult,
  ScrapPart,
  ScrapResult,
} from "../../types/arsenal.types";
import { CountUp } from "../CaseOpeningModal/CountUp";
import { PartIcon } from "../Parts/PartIcon";
import { MOD_ACCENT, TierPlate } from "../TierPlate";
import { ModArt } from "../Workshop/ModArt";
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

type TeardownRequest = Extract<ActiveScene, { type: "teardown" }>;

/**
 * The timeline of the payoff, in seconds from the moment the server answers:
 *
 *   0.00  the front piece flashes and comes apart in four, the stack behind it
 *         a beat later
 *   0.30  the parts it held drop onto the counter one stack at a time
 *   then  the mod that survived, if one did, lands last and on its own
 */
const PARTS_FROM = 0.3;
const PART_STEP = 0.07;
/** More stacks than this fold into a "+N more" chip — the row stays one row. */
const MAX_STACKS = 10;

/** How long a piece takes to come apart and fall away. */
const SHATTER_FOR = 0.8;
/** Out fast, slowing as it goes — gentler at the start than a stock ease-out. */
const SHARD_EASE = [0.2, 0.7, 0.4, 1] as const;

/** The four quarters a piece breaks into, and which way each one flies. */
const SHARDS = [
  { clip: "inset(0 50% 50% 0)", dx: -1, dy: -1 },
  { clip: "inset(0 0 50% 50%)", dx: 1, dy: -1 },
  { clip: "inset(50% 50% 0 0)", dx: -1, dy: 1 },
  { clip: "inset(50% 0 0 50%)", dx: 1, dy: 1 },
];

const isSingle = (
  result: ScrapResult | BulkScrapResult,
): result is ScrapResult => !("scrappedCount" in result);

const stackKey = (p: ScrapPart) => `${p.partId}:${p.tier}`;

/**
 * Taking gear apart, made into a moment.
 *
 * Scrapping used to be a toast: the card vanished and a sentence said how many
 * parts it was worth. Here the piece shakes on the bench while the request is
 * out, breaks apart when it lands, and what it held drops out of it — each stack
 * in its tier's colour, so a Legendary neck coming out of a Mythic reads as the
 * prize it is. A mod that survives comes out last, alone, in mod purple: it is
 * the one thing in a teardown worth stopping for.
 */
export const TeardownScene = ({
  scene,
  onClose,
}: {
  scene: TeardownRequest;
  onClose: () => void;
}) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const { subjects, count, result } = scene;
  const front = subjects[0];
  const color = front?.color ?? "#a1a1aa";

  const parts = result?.parts ?? [];
  const shown = parts.slice(0, MAX_STACKS);
  const hidden = parts.length - shown.length;
  const total = countScrapParts(parts);

  const salvaged = result && isSingle(result) ? result.salvaged : null;
  const salvagedDef = salvaged
    ? getModDef(salvaged.kind, salvaged.featureId)
    : null;
  const salvagedName = salvaged
    ? labels.mod(salvaged.featureId, salvagedDef?.label ?? salvaged.featureId)
    : "";
  const bulkMods = result && !isSingle(result) ? result.salvagedCount : 0;

  const partsEnd = PARTS_FROM + shown.length * PART_STEP + 0.35;
  const modAt = partsEnd;
  const revealFor = partsEnd + (salvaged || bulkMods > 0 ? 0.7 : 0.15);

  const many = count > 1;
  const caption = {
    working: many
      ? t("scene.teardown.working_many", { count })
      : t("scene.teardown.working_one", { name: front?.name ?? "" }),
    done: t("scene.teardown.done"),
  };
  const summary = many
    ? t(
        front?.kind === "effect"
          ? "toasts.scrapped_pedals"
          : "toasts.scrapped_guitars",
        {
          // Protected copies are skipped, so the server's count is the true one.
          count: result && !isSingle(result) ? result.scrappedCount : count,
          parts: total,
        },
      )
    : t("toasts.scrapped", { count: total });

  const stage = (phase: ScenePhase) => {
    const broken = phase !== "working";
    return (
      <>
        <StageLight color={color} strength={broken ? "33" : "1f"} />

        {/* The stack, back to front, so the piece on top is the one that breaks
            first and the rest follow it. */}
        {[...subjects].reverse().map((subject, reversedIndex) => {
          const depth = subjects.length - 1 - reversedIndex;
          const offset = { x: depth * 16, y: -depth * 12, rotate: depth * 5 };

          return (
            <motion.div
              key={depth}
              className='absolute will-change-transform'
              initial={{ opacity: 0, ...offset }}
              animate={{ opacity: 1 - depth * 0.18, ...offset }}
              transition={{ duration: 0.3 }}>
              {broken && depth === 0 ? (
                <div className='relative'>
                  {SHARDS.map((shard, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "will-change-transform",
                        i === 0 ? "relative" : "absolute inset-0",
                      )}
                      style={{ clipPath: shard.clip }}
                      initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                      animate={{
                        x: shard.dx * 95,
                        // Up off the bench, then down: two segments that meet
                        // at the top of the arc, where the speed is zero anyway.
                        y: [0, shard.dy * 30 - 26, shard.dy * 50 + 90],
                        rotate: shard.dx * 30,
                        opacity: [1, 1, 0],
                      }}
                      transition={{
                        duration: SHATTER_FOR,
                        ease: SHARD_EASE,
                        y: {
                          inherit: true,
                          times: [0, 0.3, 1],
                          ease: ["easeOut", "easeIn"],
                        },
                        opacity: {
                          inherit: true,
                          times: [0, 0.55, 1],
                          ease: "linear",
                        },
                      }}>
                      <SubjectArt subject={subject} size={many ? "md" : "lg"} />
                    </motion.div>
                  ))}
                </div>
              ) : broken ? (
                // The rest of the pile is knocked off whole: four shards per
                // piece would be a dozen large images in flight for one beat
                // nobody looks at.
                <motion.div
                  className='will-change-transform'
                  initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                  animate={{
                    x: (depth % 2 === 0 ? -1 : 1) * 110,
                    y: [0, -20, 120],
                    rotate: (depth % 2 === 0 ? -1 : 1) * 24,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    delay: depth * 0.06,
                    duration: SHATTER_FOR,
                    ease: SHARD_EASE,
                    y: {
                      inherit: true,
                      times: [0, 0.3, 1],
                      ease: ["easeOut", "easeIn"],
                    },
                    opacity: {
                      inherit: true,
                      times: [0, 0.5, 1],
                      ease: "linear",
                    },
                  }}>
                  <SubjectArt subject={subject} size={many ? "md" : "lg"} />
                </motion.div>
              ) : (
                // On the bench: it rattles while the tools go at it.
                <motion.div
                  className='will-change-transform'
                  animate={
                    depth === 0
                      ? {
                          x: [0, -3, 3, -2, 2, 0],
                          rotate: [0, -1.2, 1.2, -0.8, 0.8, 0],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 0.45,
                    repeat: Infinity,
                    repeatDelay: 0.25,
                  }}>
                  <SubjectArt subject={subject} size={many ? "md" : "lg"} />
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {broken ? (
          <>
            <ImpactFlash />
            <ImpactRings color={color} />
            <SparkBurst color={color} count={16} distance={120} />
          </>
        ) : (
          // Sparks off the tools, a few at a time, for as long as it takes.
          <SparkBurst
            color='#d4d4d8'
            count={6}
            distance={70}
            spread={20}
            repeatEvery={0.9}
          />
        )}
      </>
    );
  };

  const footer = (phase: ScenePhase) => {
    // The scene's middle row holds the stage still, so no placeholder needed.
    if (phase === "working" || !result) return null;

    return (
      <>
        <div className='flex flex-col items-center gap-1'>
          <span className='font-display text-5xl font-black tabular-nums text-zinc-100'>
            +
            <CountUp
              to={total}
              delay={PARTS_FROM}
              duration={partsEnd - PARTS_FROM}
            />
          </span>
          <span className='text-xs font-semibold text-zinc-500'>
            {t("scene.teardown.parts")}
          </span>
        </div>

        <div className='flex flex-wrap justify-center gap-2'>
          {shown.map((part, i) => (
            <motion.div
              key={stackKey(part)}
              className='will-change-transform'
              title={`${part.qty}× ${labels.partName(part.tier, part.partId)}`}
              initial={{ opacity: 0, y: -90, scale: 0.4 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: PARTS_FROM + i * PART_STEP,
                type: "spring",
                stiffness: 300,
                damping: 22,
                opacity: {
                  duration: 0.15,
                  delay: PARTS_FROM + i * PART_STEP,
                },
              }}>
              <TierPlate
                color={PART_TIER_COLORS[part.tier]}
                size={52}
                count={part.qty}>
                <PartIcon partId={part.partId} size={32} />
              </TierPlate>
            </motion.div>
          ))}
          {hidden > 0 && (
            <motion.span
              className='flex h-[52px] items-center rounded-md bg-zinc-800/60 px-3 text-xs font-bold text-zinc-300'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: PARTS_FROM + shown.length * PART_STEP }}>
              {t("scene.more", { count: hidden })}
            </motion.span>
          )}
        </div>

        {salvaged && (
          <motion.div
            className='relative flex items-center gap-3 rounded-lg bg-zinc-900/80 py-2 pl-2 pr-4'
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: modAt,
              // A spring overshoots and settles in one motion, where a
              // 0.6 → 1.08 → 1 list would stop at the peak.
              scale: {
                type: "spring",
                stiffness: 320,
                damping: 18,
                delay: modAt,
              },
              opacity: { duration: 0.2, delay: modAt },
            }}>
            <span className='relative flex items-center justify-center'>
              <ImpactRings color={MOD_ACCENT} delay={modAt} size={56} />
              <ModArt modId={salvaged.featureId} size={44} />
            </span>
            <span className='text-sm font-bold' style={{ color: MOD_ACCENT }}>
              {t("toasts.mod_pulled", {
                name: salvagedName,
                points: salvaged.points,
              })}
            </span>
          </motion.div>
        )}

        {bulkMods > 0 && (
          <motion.span
            className='text-sm font-bold'
            style={{ color: MOD_ACCENT }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: modAt, duration: 0.3 }}>
            {t("bulk.mods_pulled", { count: bulkMods })}
          </motion.span>
        )}
      </>
    );
  };

  return (
    <ArsenalScene
      ready={!!result}
      revealFor={revealFor}
      autoClose={salvaged || bulkMods > 0 ? 3.4 : 2.6}
      color={color}
      caption={caption}
      summary={summary}
      stage={stage}
      footer={footer}
      onClose={onClose}
    />
  );
};
