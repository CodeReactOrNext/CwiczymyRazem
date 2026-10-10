import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { DisplayBay } from "feature/arsenal/components/Rig/GuitarRack";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { type ReactNode, useMemo, useState } from "react";

import {
  getBody,
  MAX_STICKERS,
  STICKER_SIZE,
  STOCK_PARTS,
} from "../data/guitarParts";
import type {
  ComponentSlot,
  Loadout,
  OwnedComponent,
  PlacedSticker,
} from "../types/guitarBuilder.types";
import {
  buildLevel,
  fitProblem,
  getComponent,
  type Owned,
  RARITY_ORDER,
  resolveOwned,
  toGuitarBuild,
} from "../utils/components";
import { BuildPlate, type LevelPulse } from "./BuildPlate";
import { ComponentCard } from "./ComponentCard";
import { GuitarCanvas } from "./GuitarCanvas";
import { SlotTabs } from "./SlotTabs";
import { StickerPanel } from "./StickerPanel";

export const SLOTS: ComponentSlot[] = [
  "body",
  "neck",
  "head",
  "pickups",
  "finish",
  "pickguard",
  "sticker",
];

/** Offsets (body px) around a body's sticker spot, in the order they're used. */
const STICKER_SPREAD: [number, number][] = [
  [0, 0],
  [95, 75],
  [-85, 95],
  [115, -65],
  [-105, -55],
  [15, 165],
  [190, 30],
  [-165, 20],
  [85, 190],
  [-55, -140],
  [200, 150],
  [-150, 160],
];

/** Slots a guitar can go without — clicking the fitted one takes it off. */
const OPTIONAL: ComponentSlot[] = ["finish", "pickguard"];

export const EMPTY_LOADOUT: Loadout = {
  body: null,
  neck: null,
  head: null,
  pickups: null,
  finish: null,
  pickguard: null,
};

const byRarityThenLevel = (a: Owned, b: Owned) =>
  RARITY_ORDER.indexOf(b.def.rarity) - RARITY_ORDER.indexOf(a.def.rarity) ||
  b.level - a.level;

export interface WorkbenchState {
  loadout: Loadout;
  stickers: PlacedSticker[];
  summary: ReturnType<typeof buildLevel>;
}

interface GuitarWorkbenchProps {
  stash: OwnedComponent[];
  initialLoadout: Loadout;
  initialStickers?: PlacedSticker[];
  slot: ComponentSlot;
  onSlotChange: (slot: ComponentSlot) => void;
  /** Parts to flag as just dropped. */
  newUids?: Set<string>;
  /** Under the plate: the Build button and its price, in the Arsenal. */
  action?: (state: WorkbenchState) => ReactNode;
  /** Shown instead of the part grid when the open slot has nothing in it. */
  emptySlot?: ReactNode;
  /** The player's name for the build, shown on the plate when set. */
  name?: string | null;
}

/**
 * The bench itself: the build hanging in its lit bay with its plate, and the
 * parts to hang on it. Remount it (`key`) to start over from new initials.
 */
export const GuitarWorkbench = ({
  stash,
  initialLoadout,
  initialStickers = [],
  slot,
  onSlotChange,
  newUids,
  action,
  emptySlot,
  name,
}: GuitarWorkbenchProps) => {
  const [loadout, setLoadout] = useState<Loadout>(initialLoadout);
  const [stickers, setStickers] = useState<PlacedSticker[]>(initialStickers);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null,
  );
  const [pulse, setPulse] = useState<LevelPulse | null>(null);
  const settle = useAnimationControls();
  const reduceMotion = useReducedMotion();

  const body = resolveOwned(stash, loadout.body, "body");
  const build = useMemo(
    () => toGuitarBuild(stash, loadout, stickers, STOCK_PARTS),
    [stash, loadout, stickers],
  );
  const summary = useMemo(
    () => buildLevel(stash, loadout, stickers),
    [stash, loadout, stickers],
  );

  const items = useMemo(
    () =>
      stash
        .map((item) => ({ ...item, def: getComponent(item.defId) }))
        .filter((item): item is Owned => item.def?.slot === slot)
        .sort(byRarityThenLevel),
    [stash, slot],
  );

  const placedIds = new Set(stickers.map((sticker) => sticker.id));
  const selectedSticker =
    stickers.find((sticker) => sticker.id === selectedStickerId) ?? null;

  const isFitted = (item: Owned) =>
    item.def.slot === "sticker"
      ? placedIds.has(item.uid)
      : loadout[item.def.slot as keyof Loadout] === item.uid;

  /**
   * The little moment a part goes on: the guitar gives a short settle in its
   * bay, as if the part just clicked home, and the plate shows what it was
   * worth. Nothing glows — it's a nudge, not a fanfare.
   */
  const celebrate = (delta: number, color: string, fitted: boolean) => {
    if (delta !== 0)
      setPulse((prev) => ({ key: (prev?.key ?? 0) + 1, delta, color }));
    if (!fitted || reduceMotion) return;
    void settle.start({
      scale: [1, 1.035, 0.992, 1],
      rotate: [0, -0.8, 0.35, 0],
      transition: { duration: 0.5, ease: "easeOut" },
    });
  };

  const placeSticker = (item: Owned<"sticker">) => {
    if (placedIds.has(item.uid)) {
      setSelectedStickerId(item.uid);
      return;
    }
    if (stickers.length >= MAX_STICKERS) return;
    const peeled = [...stickers];
    // the body's clearest patch, then around it, so a run of stickers
    // spreads over the body instead of piling up in one place
    const { stickerSpot } = getBody(build.bodyKey);
    const [dx, dy] = STICKER_SPREAD[stickers.length % STICKER_SPREAD.length];
    setStickers((current) => [
      ...current,
      {
        id: item.uid,
        key: item.def.stickerKey,
        x: stickerSpot.x + dx,
        y: stickerSpot.y + dy,
        size: STICKER_SIZE.initial,
        rotation: 0,
      },
    ]);
    setSelectedStickerId(item.uid);
    const withIt = [
      ...peeled,
      {
        id: item.uid,
        key: item.def.stickerKey,
        x: 0,
        y: 0,
        size: 0,
        rotation: 0,
      },
    ];
    celebrate(
      buildLevel(stash, loadout, withIt).total - summary.total,
      getRarityColor(item.def.rarity),
      true,
    );
  };

  const handleCard = (item: Owned) => {
    if (item.def.slot === "sticker") {
      placeSticker(item as Owned<"sticker">);
      return;
    }
    const key = item.def.slot as keyof Loadout;
    if (fitProblem(item.def, body?.def ?? null)) return;
    const takeOff = loadout[key] === item.uid && OPTIONAL.includes(key);
    if (!takeOff && loadout[key] === item.uid) return;
    const next = { ...loadout, [key]: takeOff ? null : item.uid };
    setLoadout(next);
    celebrate(
      buildLevel(stash, next, stickers).total - summary.total,
      getRarityColor(item.def.rarity),
      !takeOff,
    );
  };

  const changeSticker = (id: string, patch: Partial<PlacedSticker>) =>
    setStickers((current) =>
      current.map((sticker) =>
        sticker.id === id ? { ...sticker, ...patch } : sticker,
      ),
    );

  const slotHint = (target: ComponentSlot) => {
    if (target === "sticker") {
      return stickers.length ? `${stickers.length}` : "–";
    }
    const fitted = resolveOwned(stash, loadout[target], target);
    return fitted ? `Lvl ${fitted.level}` : "–";
  };

  return (
    <div className='grid items-start gap-8 md:grid-cols-[22rem_1fr] lg:grid-cols-[26rem_1fr]'>
      {/* the build hangs in the same lit bay as the rig and profile wall,
          with its plate and level breakdown under it, and stays in view
          while parts are swapped */}
      <div className='md:sticky md:top-4'>
        <div
          className='rounded-lg bg-arsenal-card p-1.5'
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div className='overflow-hidden rounded bg-black/60'>
            <DisplayBay
              className='h-[30rem] md:h-[40rem]'
              color={
                summary.complete ? getRarityColor(summary.rarity) : undefined
              }
              level={summary.complete ? summary.total : undefined}
              rarity={summary.rarity}>
              {/* nothing hangs until a body is picked — stock art in its
                  place read as a guitar the player already had */}
              {body ? (
                <motion.div animate={settle} className='h-full w-full'>
                  <GuitarCanvas
                    build={build}
                    selectedStickerId={selectedStickerId}
                    onSelectSticker={(id) => {
                      setSelectedStickerId(id);
                      if (id) onSlotChange("sticker");
                    }}
                    onMoveSticker={(id, x, y) => changeSticker(id, { x, y })}
                    rotated
                    className='h-full w-full object-contain'
                  />
                </motion.div>
              ) : null}
            </DisplayBay>
            <div className='space-y-5 bg-arsenal-section px-6 py-5'>
              <BuildPlate
                name={
                  name || (body ? `Custom ${body.def.name}` : "Custom build")
                }
                summary={summary}
                pulse={pulse}
              />
              {action?.({ loadout, stickers, summary })}
            </div>
          </div>
        </div>
      </div>

      <section className='min-w-0 space-y-5'>
        <SlotTabs
          slots={SLOTS}
          active={slot}
          onSelect={onSlotChange}
          hint={slotHint}
        />

        {slot === "sticker" && (
          <StickerPanel
            selected={selectedSticker}
            hasStickers={stickers.length > 0}
            onChange={changeSticker}
            onRemove={(id) => {
              setStickers((current) => current.filter((s) => s.id !== id));
              setSelectedStickerId(null);
            }}
            onClear={() => {
              setStickers([]);
              setSelectedStickerId(null);
            }}
          />
        )}

        {items.length === 0 && emptySlot ? (
          emptySlot
        ) : (
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4'>
            {items.map((item) => (
              <ComponentCard
                key={item.uid}
                owned={item}
                active={isFitted(item)}
                isNew={newUids?.has(item.uid)}
                problem={fitProblem(item.def, body?.def ?? null)}
                onClick={() => handleCard(item)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
