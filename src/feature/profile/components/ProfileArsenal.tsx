import { CursorTooltip } from "components/UI/CursorTooltip/CursorTooltip";
import { EffectCard } from "feature/arsenal/components/GuitarInventory/EffectCard";
import { GuitarCard } from "feature/arsenal/components/GuitarInventory/GuitarCard";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import {
  BoardJack,
  SignalCable,
} from "feature/arsenal/components/Rig/SignalCable";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getItemLevel } from "feature/arsenal/data/itemStats";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import {
  CHAIN_TIERS,
  evaluateChain,
  readChainNodes,
} from "feature/arsenal/data/signalChain";
import type {
  ArsenalUserData,
  InventoryItem,
  PedalboardPlacement,
} from "feature/arsenal/types/arsenal.types";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
// Layout is shared with the editable board (PedalboardView) so a pedal sits in
// exactly the same place here as it does in the owner's arsenal — including the
// repair of boards saved before pedals were kept from overlapping.
import {
  createJackResolver,
  createWidthResolver,
  layoutBoard,
  PEDAL_H_PCT,
} from "feature/arsenal/utils/pedalboardLayout";
import { doc, getDoc } from "firebase/firestore";
import { Guitar, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { db } from "utils/firebase/client/firebase.utils";

/** How a visitor's eye is told what they are looking at. Chip pattern, no border. */
const CHAIN_TONES = {
  good: "bg-emerald-500/10 text-emerald-400",
  warn: "bg-amber-500/10 text-amber-400",
  bad: "bg-red-500/10 text-red-400",
  idle: "bg-zinc-800/60 text-zinc-400",
} as const;

interface TooltipData {
  x: number;
  y: number;
  content: React.ReactNode;
}

const RpgTooltip = ({ tooltip }: { tooltip: TooltipData }) => (
  <CursorTooltip x={tooltip.x} y={tooltip.y}>
    {tooltip.content}
  </CursorTooltip>
);

interface GuitarSlotReadonlyProps {
  item: InventoryItem | null;
  slotIndex: number;
  onHover: (e: React.MouseEvent, data: TooltipData | null) => void;
  onSelect: (content: React.ReactNode) => void;
}

const GuitarSlotReadonly = ({
  item,
  slotIndex,
  onHover,
  onSelect,
}: GuitarSlotReadonlyProps) => {
  const guitar = item ? GUITARS_BY_ID.get(item.guitarId) : null;
  const rs = guitar ? RARITY_STYLES[guitar.rarity] : null;
  const level = item && guitar ? getItemLevel(item, guitar) : 0;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!guitar || !item || !rs) return;
    onHover(e, {
      x: e.clientX,
      y: e.clientY,
      content: <GuitarCard item={item} readOnly />,
    });
  };

  const handleClick = () => {
    if (!guitar || !item || !rs) return;
    onHover(null as any, null);
    onSelect(<GuitarCard item={item} readOnly />);
  };

  if (!guitar || !rs) {
    return (
      <div
        className='relative flex flex-col items-center justify-center gap-2 rounded-lg bg-zinc-800/40'
        style={{ height: 320 }}>
        <Guitar className='h-7 w-7 text-zinc-600' />
        <span className='text-[11px] tracking-wide text-zinc-500'>
          Slot {slotIndex + 1}
        </span>
      </div>
    );
  }

  return (
    <div
      className='relative flex cursor-pointer select-none flex-col overflow-hidden rounded-lg'
      style={{
        height: 320,
        background: `linear-gradient(175deg, ${rs.baseColor}18 0%, #0c0c10 35%, #0c0c10 100%)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHover(null as any, null)}
      onClick={handleClick}>
      {/* Header */}
      <div className='flex flex-col gap-0.5 px-3 pb-0 pt-4'>
        <p
          className='truncate text-xs font-semibold leading-none tracking-wide'
          style={{ color: rs.baseColor }}>
          {guitar.brand}
        </p>
        <p className='truncate text-xl font-bold leading-tight text-white'>
          {guitar.name}
        </p>
      </div>

      {/* Image */}
      <div className='relative flex flex-1 items-center justify-center overflow-hidden'>
        {/* Level emblem (every guitar has a level) */}
        {level > 0 && (
          <div
            className='absolute left-2 top-2 z-20 flex flex-col items-center justify-center rounded-full'
            style={{
              width: 38,
              height: 38,
              background:
                "radial-gradient(circle at 50% 35%, #1c1c22, #0d0d10)",
              border: `1.5px solid ${rs.baseColor}`,
              boxShadow: `0 0 10px ${rs.baseColor}55, inset 0 0 6px rgba(0,0,0,0.6)`,
            }}
            title='Guitar level'>
            <span className='text-[15px] font-black leading-none text-white'>
              {level}
            </span>
          </div>
        )}

        {/* Subtle structural grid */}
        <div
          className='pointer-events-none absolute inset-0 z-0'
          style={{
            backgroundImage: [
              `linear-gradient(${rs.baseColor} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${rs.baseColor} 1px, transparent 1px)`,
            ].join(","),
            backgroundSize: "22px 22px",
            opacity: 0.04,
          }}
        />
        {/* Neutral spotlight so dark guitars separate from the background */}
        <div
          className='pointer-events-none absolute inset-0 z-0'
          style={{
            background: `radial-gradient(60% 55% at 50% 48%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, transparent 72%)`,
          }}
        />
        {/* Rarity glow backdrop */}
        <div className='pointer-events-none absolute inset-0 z-0 flex translate-y-[60px] items-center justify-center opacity-50'>
          <div
            className='absolute h-[170px] w-[170px] rounded-full blur-[34px]'
            style={{
              background: `radial-gradient(circle at center, ${rs.baseColor}66 0%, ${rs.baseColor}1f 45%, transparent 72%)`,
            }}
          />
        </div>
        <img
          src={getRankBadgeSrc(guitar.imageId, "medium")}
          alt={guitar.name}
          className='relative z-10 -rotate-45 object-contain'
          style={{ height: 240, width: 240 }}
        />
      </div>
    </div>
  );
};

interface PedalReadonlyProps {
  placement: PedalboardPlacement;
  /** Width in board-%, from the shared layout so both views agree. */
  wPct: number;
  effectInventory: ArsenalUserData["effectInventory"];
  onHover: (e: React.MouseEvent, data: TooltipData | null) => void;
  onSelect: (content: React.ReactNode) => void;
}

const PedalReadonly = ({
  placement,
  wPct,
  effectInventory,
  onHover,
  onSelect,
}: PedalReadonlyProps) => {
  const invItem = effectInventory.find((e) => e.id === placement.itemId);
  const effect = invItem ? EFFECTS_BY_ID.get(invItem.effectId) : null;
  const rs = effect ? RARITY_STYLES[effect.rarity] : null;
  if (!effect || !rs) return null;

  const handleMouseMove = (e: React.MouseEvent) => {
    onHover(e, {
      x: e.clientX,
      y: e.clientY,
      content: <EffectCard item={invItem!} readOnly />,
    });
  };

  const handleClick = () => {
    onHover(null as any, null);
    onSelect(<EffectCard item={invItem!} readOnly />);
  };

  return (
    <div
      className='absolute cursor-pointer'
      style={{
        left: `${placement.xPct}%`,
        top: `${placement.yPct}%`,
        width: `${wPct}%`,
        height: `${PEDAL_H_PCT}%`,
        filter: `drop-shadow(0 5px 10px rgba(0,0,0,0.85))`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHover(null as any, null)}
      onClick={handleClick}>
      <img
        src={getEffectImageSrc(effect.imageId, "full")}
        alt={effect.name}
        className='h-full w-full object-contain'
        draggable={false}
      />
      <div
        className='absolute bottom-[10%] left-1/2 -translate-x-1/2 rounded-full'
        style={{
          width: 5,
          height: 5,
          backgroundColor: rs.baseColor,
          boxShadow: `0 0 6px 2px ${rs.baseColor}90`,
        }}
      />
    </div>
  );
};

interface ProfileArsenalProps {
  userAuth: string;
}

export const ProfileArsenal = ({ userAuth }: ProfileArsenalProps) => {
  const [arsenal, setArsenal] = useState<ArsenalUserData | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  // Clicking/tapping an item opens its card in a centered modal, matching the
  // arsenal editor and the activity view.
  const [pinnedCard, setPinnedCard] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    getDoc(doc(db, "users", userAuth)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.arsenal) setArsenal(data.arsenal as ArsenalUserData);
      }
    });
  }, [userAuth]);

  if (!arsenal) return null;

  const { rig, inventory, effectInventory } = arsenal;
  const hasPedals = (rig?.pedalboardItems?.length ?? 0) > 0;
  const hasGuitars = rig?.guitarSlots?.some(Boolean) ?? false;
  if (!hasPedals && !hasGuitars) return null;

  // The same layout pass the editor runs, so a board stored with pedals piled
  // on top of each other still reads cleanly here.
  const widthOf = createWidthResolver(effectInventory ?? []);
  const jacksOf = createJackResolver(effectInventory ?? []);
  const board = layoutBoard(rig?.pedalboardItems ?? [], widthOf);

  // The same verdict the owner sees on their own board, so a visitor can tell a
  // properly wired rig from a pile of pedals — and so can its owner, from the
  // outside, which is half of why anybody bothers to tidy one.
  const verdict = evaluateChain(
    readChainNodes(board.placed, effectInventory ?? []),
  );
  const chainTier = CHAIN_TIERS[verdict.tier];

  const guitarItems: (InventoryItem | null)[] = (
    [null, null, null] as (string | null)[]
  )
    .map((_, i) => rig?.guitarSlots?.[i] ?? null)
    .map((slotId) =>
      slotId ? (inventory?.find((item) => item.id === slotId) ?? null) : null,
    );

  const handleTooltip = (_e: React.MouseEvent, data: TooltipData | null) => {
    setTooltip(data);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip) {
      setTooltip((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
      );
    }
  };

  return (
    <div
      className='rounded-lg bg-zinc-900/30 p-4 sm:p-6'
      onMouseMove={handleMouseMove}>
      <h2 className='mb-6 flex items-center gap-3 text-2xl font-bold text-white'>
        Rig
        <span
          className='inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm font-black tabular-nums text-cyan-300'
          title='Total rig level (equipped guitars + pedalboard)'>
          Lv {getRigLevel(arsenal)}
        </span>
      </h2>

      {/* Guitar Slots */}
      {hasGuitars && (
        <div className='mb-6'>
          <p className='mb-3 text-xs font-semibold tracking-wide text-zinc-400'>
            Guitars
          </p>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            {guitarItems.map((item, i) => (
              <GuitarSlotReadonly
                key={i}
                item={item}
                slotIndex={i}
                onHover={handleTooltip}
                onSelect={setPinnedCard}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pedalboard */}
      {hasPedals && (
        <div>
          <div className='mb-3 flex flex-wrap items-center gap-3'>
            <p className='text-xs font-semibold tracking-wide text-zinc-400'>
              Pedalboard
            </p>
            {verdict.links.length > 0 && (
              <span
                title={chainTier.note}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-bold tracking-wide ${CHAIN_TONES[chainTier.tone]}`}>
                {chainTier.label}
                {verdict.rate > 0 && (
                  <span className='tabular-nums text-amber-400/90'>
                    +{verdict.rate.toFixed(1)}/h
                  </span>
                )}
              </span>
            )}
          </div>
          <div
            style={{
              background:
                "linear-gradient(160deg, #2e2e2e 0%, #1c1c1c 50%, #222 100%)",
              borderRadius: 12,
              padding: "10px 14px 14px",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
              border: "2px solid #383838",
            }}>
            {/* Top bar: latches + label */}
            <div className='mb-2.5 flex items-center justify-between px-1'>
              <div className='flex gap-2'>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 32,
                      height: 11,
                      background:
                        "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)",
                      borderRadius: 3,
                      boxShadow:
                        "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
                    }}
                  />
                ))}
              </div>
              <span className='text-[8px] font-black tracking-[0.35em] text-zinc-600'>
                Pedalboard
              </span>
              <div className='flex gap-2'>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 32,
                      height: 11,
                      background:
                        "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)",
                      borderRadius: 3,
                      boxShadow:
                        "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Board surface */}
            <div
              className='relative w-full overflow-hidden'
              style={{
                aspectRatio: "16 / 7",
                borderRadius: 6,
                backgroundImage:
                  "radial-gradient(circle, #272727 1.4px, transparent 1.4px)",
                backgroundSize: "9px 9px",
                backgroundColor: "#141414",
                boxShadow: verdict.flawless
                  ? "inset 0 4px 16px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(52,211,153,0.10), inset 0 0 44px rgba(16,185,129,0.11)"
                  : "inset 0 4px 16px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.02)",
              }}>
              <BoardJack kind='in' />
              <BoardJack kind='out' />

              {/* Black loom here, colours only on the owner's own board in the
                  Arsenal: a visitor cannot rewire what they are looking at. */}
              <SignalCable
                verdict={verdict}
                widthOf={widthOf}
                jacksOf={jacksOf}
                plain
              />

              {/* Pedals */}
              {board.placed.map((placement) => (
                <PedalReadonly
                  key={placement.itemId}
                  placement={placement}
                  wPct={widthOf(placement.itemId)}
                  effectInventory={effectInventory ?? []}
                  onHover={handleTooltip}
                  onSelect={setPinnedCard}
                />
              ))}
            </div>

            {/* Bottom handles */}
            <div className='mt-2.5 flex items-center justify-between px-3'>
              <div
                style={{
                  width: 52,
                  height: 9,
                  background: "linear-gradient(180deg,#555,#2a2a2a)",
                  borderRadius: 4,
                  boxShadow:
                    "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              />
              <div className='flex gap-6'>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle at 35% 35%,#3a3a3a,#0a0a0a)",
                      boxShadow:
                        "0 3px 5px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  width: 52,
                  height: 9,
                  background: "linear-gradient(180deg,#555,#2a2a2a)",
                  borderRadius: 4,
                  boxShadow:
                    "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              />
            </div>
          </div>

          {/* Equipped, but the board ran out of room for them. */}
          {board.overflow.length > 0 && (
            <div className='mt-4 flex flex-col gap-2'>
              <p className='text-xs font-semibold tracking-wide text-zinc-500'>
                Off the board
              </p>
              <div className='flex flex-wrap items-end gap-5'>
                {board.overflow.map((placement) => {
                  const invItem = (effectInventory ?? []).find(
                    (e) => e.id === placement.itemId,
                  );
                  const effect = invItem
                    ? EFFECTS_BY_ID.get(invItem.effectId)
                    : null;
                  if (!effect || !invItem) return null;

                  return (
                    <img
                      key={placement.itemId}
                      src={getEffectImageSrc(effect.imageId, "small")}
                      alt={effect.name}
                      className='h-12 w-auto cursor-pointer object-contain opacity-50 transition-opacity hover:opacity-100'
                      draggable={false}
                      onMouseMove={(e) =>
                        handleTooltip(e, {
                          x: e.clientX,
                          y: e.clientY,
                          content: <EffectCard item={invItem} readOnly />,
                        })
                      }
                      onMouseLeave={() => handleTooltip(null as any, null)}
                      onClick={() =>
                        setPinnedCard(<EffectCard item={invItem} readOnly />)
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tooltip && !pinnedCard && <RpgTooltip tooltip={tooltip} />}

      {pinnedCard &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'
            onClick={() => setPinnedCard(null)}>
            <div
              className='relative w-full max-w-[320px]'
              onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setPinnedCard(null)}
                aria-label='Close'
                className='absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-zinc-300 shadow-lg hover:text-white'>
                <X size={15} />
              </button>
              {pinnedCard}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
