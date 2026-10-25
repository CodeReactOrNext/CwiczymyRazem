"use client";

import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "lib/motion/motion";

import type {
  EffectInventoryItem,
  InventoryItem,
} from "../../types/arsenal.types";
import { EffectCard } from "../GuitarInventory/EffectCard";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import type { ScenePhase } from "./ArsenalScene";
import { ArsenalScene } from "./ArsenalScene";
import {
  HammerStrikes,
  ImpactFlash,
  ImpactRings,
  SparkBurst,
  SparkConverge,
  StageLight,
  STRIKE_FLINCH,
  SubjectArt,
} from "./sceneFx";
import type { ActiveScene } from "./sceneStore";

type DeliveryRequest = Extract<ActiveScene, { type: "delivery" }>;

/** When the card turns over. */
const FLIP_FOR = 0.65;

/** Unlit, so the shape is there and the instrument is not — yet. */
const SILHOUETTE = "brightness(0) invert(0.16)";

/**
 * A new instrument arriving: built to order at the bench, or bought off the
 * trader's counter.
 *
 * While the request is out the model stands as an unlit silhouette — hammered
 * at, for a commission; for a purchase, Fame running into it. When it lands the
 * silhouette goes in a flash and the real card turns over in its place, the card
 * the player will find in their stash. Showing the card rather than a line of
 * text is the point: what they paid for should be something they can look at.
 */
export const DeliveryScene = ({
  scene,
  onClose,
}: {
  scene: DeliveryRequest;
  onClose: () => void;
}) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const { subject, source, result } = scene;
  const item = result?.item;
  const isNewToDex =
    source === "commission" ||
    (!!result && "isNewToDex" in result && !!result.isNewToDex);

  const caption = {
    working: t(`scene.delivery.working_${source}`, { name: subject.name }),
    done: t(`scene.delivery.done_${source}`),
  };

  // The wind-up: the unlit model, and whatever is working on it.
  const waiting = (
    <motion.div
      key='waiting'
      className='absolute inset-0 flex items-center justify-center'
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}>
      <motion.div
        className='absolute will-change-transform'
        style={{ filter: SILHOUETTE }}
        {...(source === "commission"
          ? STRIKE_FLINCH
          : {
              animate: { scale: [1, 1.02, 1] },
              transition: { duration: 1.4, repeat: Infinity, ease: "easeOut" },
            })}>
        <SubjectArt subject={subject} />
      </motion.div>

      {source === "commission" ? (
        <HammerStrikes />
      ) : (
        <SparkConverge color='#fbbf24' count={10} radius={140} loop />
      )}
    </motion.div>
  );

  const stage = (phase: ScenePhase) => {
    const arrived = phase !== "working" && !!item;

    return (
      <>
        <StageLight color={subject.color} strength={arrived ? "30" : "18"} />
        <AnimatePresence>{!arrived && waiting}</AnimatePresence>
        {arrived && (
          <>
            <ImpactFlash />
            <ImpactRings color={subject.color} size={160} />
            <SparkBurst
              color={subject.color}
              count={18}
              distance={150}
              spread={40}
            />
          </>
        )}

        {/*
          The card turns over where the silhouette stood. It is mounted as soon
          as the server has minted it — hidden, while the wind-up still runs — so
          the cost of building a full card is paid before the flip, not on the
          flip's first frame.
        */}
        {item && (
          <div className='absolute' style={{ perspective: 1200 }}>
            <motion.div
              className='w-[250px] will-change-transform'
              initial={{ opacity: 0, rotateY: -90, scale: 0.85 }}
              animate={
                arrived
                  ? { opacity: 1, rotateY: 0, scale: 1 }
                  : { opacity: 0, rotateY: -90, scale: 0.85 }
              }
              transition={{
                rotateY: { duration: FLIP_FOR, ease: EASE.out },
                // A spring lands the size in one motion; a 0.85 → 1.04 → 1
                // list stopped dead at the overshoot.
                scale: { type: "spring", stiffness: 220, damping: 18 },
                opacity: { duration: 0.15 },
              }}>
              {subject.kind === "guitar" ? (
                <GuitarCard item={item as InventoryItem} readOnly />
              ) : (
                <EffectCard item={item as EffectInventoryItem} readOnly />
              )}
            </motion.div>
          </div>
        )}
      </>
    );
  };

  const footer = (phase: ScenePhase) =>
    phase === "working" ? null : (
      <motion.div
        className='flex flex-col items-center gap-1 text-center'
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: FLIP_FOR, duration: 0.3 }}>
        {isNewToDex && (
          <span className='text-sm font-bold' style={{ color: subject.color }}>
            {t("scene.delivery.new_dex")}
          </span>
        )}
      </motion.div>
    );

  return (
    <ArsenalScene
      ready={!!item}
      windUp={source === "commission" ? 1.5 : 0.9}
      revealFor={FLIP_FOR + 0.3}
      autoClose={null}
      color={subject.color}
      caption={caption}
      summary={t("scene.delivery.sr", { name: subject.name })}
      stageClassName='h-[25rem] sm:h-[27rem]'
      stage={stage}
      footer={footer}
      sound='levelUp'
      onClose={onClose}
    />
  );
};
