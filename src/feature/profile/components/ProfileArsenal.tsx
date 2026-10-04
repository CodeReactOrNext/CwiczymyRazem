import { CursorTooltip } from "components/UI/CursorTooltip/CursorTooltip";
import { CardModal } from "feature/arsenal/components/CardModal";
import { EffectCard } from "feature/arsenal/components/GuitarInventory/EffectCard";
import { GuitarRack } from "feature/arsenal/components/Rig/GuitarRack";
import { PedalboardCase } from "feature/arsenal/components/Rig/PedalboardCase";
import type { PoweredPedal } from "feature/arsenal/components/Rig/PowerLoom";
import {
  PedalDcPlug,
  PowerLoom,
  PowerRail,
} from "feature/arsenal/components/Rig/PowerLoom";
import { RigHeadline } from "feature/arsenal/components/Rig/RigStatsPanel";
import { SignalCable } from "feature/arsenal/components/Rig/SignalCable";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { readPowerState } from "feature/arsenal/data/powerSupply";
import { boardTierOf, supplyTierOf } from "feature/arsenal/data/rigHardware";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import {
  CHAIN_TIERS,
  evaluateChain,
  readChainNodes,
} from "feature/arsenal/data/signalChain";
import { useUserArsenal } from "feature/arsenal/hooks/useUserArsenal";
import type {
  ArsenalUserData,
  PedalboardPlacement,
} from "feature/arsenal/types/arsenal.types";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
// Layout is shared with the editable board (PedalboardView) so a pedal sits in
// exactly the same place here as it does in the owner's arsenal — including the
// repair of boards saved before pedals were kept from overlapping.
import type { BoardGeometry } from "feature/arsenal/utils/pedalboardLayout";
import {
  createDcResolver,
  createJackResolver,
  createWidthResolver,
  geometryFor,
  heightPctFor,
  layoutBoard,
  rowIndexOf,
} from "feature/arsenal/utils/pedalboardLayout";
import type { RowSpan } from "feature/arsenal/utils/powerLayout";
import { dcJackAt, railFor } from "feature/arsenal/utils/powerLayout";
import { useState } from "react";

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

interface PedalReadonlyProps {
  /** The case it is standing on, for the plug's proportions. */
  geo: BoardGeometry;
  placement: PedalboardPlacement;
  /** Width and height in board-%, from the shared layout so both views agree. */
  wPct: number;
  hPct: number;
  /** False when nothing on the brick is feeding it, so it is drawn switched off. */
  powered: boolean;
  /**
   * Where the DC plug sits on it, in fractions of its own box — `null` when no
   * cable is in it. Separate from `powered` because a board saved before the
   * brick existed is lit without a single cable on it.
   */
  plug: { x: number; y: number } | null;
  effectInventory: ArsenalUserData["effectInventory"];
  onHover: (e: React.MouseEvent, data: TooltipData | null) => void;
  onSelect: (content: React.ReactNode) => void;
}

/**
 * A pedal on someone else's board, drawn the way the owner's editor draws one
 * at rest — no shadow, no LED, just switched off when nothing powers it — minus
 * everything a visitor cannot do to it.
 */
const PedalReadonly = ({
  geo,
  placement,
  wPct,
  hPct,
  powered,
  plug,
  effectInventory,
  onHover,
  onSelect,
}: PedalReadonlyProps) => {
  const invItem = effectInventory.find((e) => e.id === placement.itemId);
  const effect = invItem ? EFFECTS_BY_ID.get(invItem.effectId) : null;
  if (!effect) return null;

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
        height: `${hPct}%`,
        // Above the loom, the way the editor's pedals are. Without it the
        // cable's own `z-index: 1` wins and every plug is painted across the
        // enclosure it is supposed to disappear into.
        zIndex: 2,
        filter: powered ? "none" : "grayscale(0.7) brightness(0.55)",
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
      {/* The plug in its inlet, over the artwork — the same one the owner's
          board draws, so a socket set into the top face reads as filled here
          too. */}
      {plug && (
        <PedalDcPlug
          dc={plug}
          widthUnits={(wPct / 100) * geo.viewW}
          heightUnits={(hPct / 100) * geo.viewH}
        />
      )}
    </div>
  );
};

interface ProfileArsenalProps {
  userAuth: string;
}

export const ProfileArsenal = ({ userAuth }: ProfileArsenalProps) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  // Clicking/tapping an item opens its card in a centered modal, matching the
  // arsenal editor and the activity view.
  const [pinnedCard, setPinnedCard] = useState<React.ReactNode | null>(null);
  // Shared with the profile's hero — one read of this player's document feeds
  // the rig here and the guitar card hanging off their avatar.
  const { data: arsenal } = useUserArsenal(userAuth);

  if (!arsenal) return null;

  const { rig, inventory, effectInventory } = arsenal;
  const hasPedals = (rig?.pedalboardItems?.length ?? 0) > 0;
  const hasGuitars = rig?.guitarSlots?.some(Boolean) ?? false;
  if (!hasPedals && !hasGuitars) return null;

  // The case and the brick this player has bought. A visitor sees the hardware
  // its owner actually owns — a small board really is drawn small, which is
  // half of what makes a big one worth having.
  const geo = geometryFor(boardTierOf(rig?.boardTier));
  const supply = supplyTierOf(rig?.supplyTier);
  const rail = railFor(geo, supply);

  // The same layout pass the editor runs, so a board stored with pedals piled
  // on top of each other still reads cleanly here.
  const widthOf = createWidthResolver(geo, effectInventory ?? []);
  const jacksOf = createJackResolver(effectInventory ?? []);
  const dcOf = createDcResolver(jacksOf);
  const board = layoutBoard(geo, rig?.pedalboardItems ?? [], widthOf);

  // What the owner's brick is carrying. A board saved before the brick existed
  // has no links at all, and is read as fully powered — the same rule the owner's
  // own board and the report API follow, so all three agree about one rig.
  const legacyPower = !Array.isArray(rig?.power);
  const power = readPowerState(supply, board.placed, rig?.power);
  const isPowered = (itemId: string) =>
    legacyPower || power.poweredIds.has(itemId);

  // The same verdict the owner sees on their own board, so a visitor can tell a
  // properly wired rig from a pile of pedals — and so can its owner, from the
  // outside, which is half of why anybody bothers to tidy one.
  const verdict = evaluateChain(
    readChainNodes(
      geo,
      board.placed,
      effectInventory ?? [],
      legacyPower ? undefined : isPowered,
    ),
  );

  // Every DC cable, and the rest of each row for the runs that have to climb
  // through a gap to reach the top one.
  const patched: PoweredPedal[] = power.links.flatMap((link) => {
    const item = board.placed.find((i) => i.itemId === link.itemId);
    if (!item) return [];
    const wPct = widthOf(link.itemId);
    return [
      {
        itemId: link.itemId,
        out: link.out,
        row: rowIndexOf(geo, item.yPct),
        jack: dcJackAt(
          geo,
          item.xPct,
          item.yPct,
          wPct,
          dcOf(link.itemId),
          heightPctFor(geo, widthOf, link.itemId),
        ),
        left: (item.xPct / 100) * geo.viewW,
        right: ((item.xPct + wPct) / 100) * geo.viewW,
      },
    ];
  });

  const rowSpans = board.placed.reduce<Record<number, RowSpan[]>>(
    (acc, item) => {
      const row = rowIndexOf(geo, item.yPct);
      const wPct = widthOf(item.itemId);
      (acc[row] ??= []).push({
        left: (item.xPct / 100) * geo.viewW,
        right: ((item.xPct + wPct) / 100) * geo.viewW,
      });
      return acc;
    },
    {},
  );
  const chainTier = CHAIN_TIERS[verdict.tier];

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
      {/* The level as the owner reads it on their own Rig tab: a figure, not
          a chip — set against the title, on the same bottom line. */}
      <div className='mb-6 flex items-end justify-between gap-6'>
        <h2 className='text-2xl font-bold text-white'>Rig</h2>
        <RigHeadline
          caption='Rig level'
          value={getRigLevel(arsenal)}
          tone='level'
          title='Total rig level (equipped guitars + pedalboard)'
        />
      </div>

      {/* The same lit wall the owner hangs them on in the Arsenal, read-only:
          no buttons, no condition, just each guitar and its level. */}
      {hasGuitars && (
        <div className='mb-6'>
          <p className='mb-3 text-xs font-semibold tracking-wide text-zinc-400'>
            Guitars
          </p>
          <GuitarRack
            slots={rig?.guitarSlots ?? [null, null, null]}
            inventory={inventory ?? []}
            onHover={(e, content) =>
              setTooltip(
                e && content ? { x: e.clientX, y: e.clientY, content } : null,
              )
            }
            onShowCard={(content) => {
              setTooltip(null);
              setPinnedCard(content);
            }}
            switchOn
          />
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
          {/* The owner's own case, so the board reads the same from outside.
              The supply racked on it is dead here: no LEDs, nothing to plug in. */}
          <PedalboardCase
            geo={geo}
            flawless={verdict.flawless}
            rail={
              <PowerRail
                rail={rail}
                used={new Set(patched.map((pedal) => pedal.out))}
                live={false}
              />
            }>
            {/* Power under everything, picking up where the rail's stubs
                  left off at the deck's top edge. */}
            <PowerLoom
              rail={rail}
              patched={patched}
              rowSpans={rowSpans}
              live={false}
            />

            {/* Black loom here, colours only on the owner's own board in the
                  Arsenal: a visitor cannot rewire what they are looking at. */}
            <SignalCable
              geo={geo}
              verdict={verdict}
              widthOf={widthOf}
              jacksOf={jacksOf}
              plain
            />

            {/* Pedals */}
            {board.placed.map((placement) => (
              <PedalReadonly
                geo={geo}
                key={placement.itemId}
                placement={placement}
                wPct={widthOf(placement.itemId)}
                hPct={heightPctFor(geo, widthOf, placement.itemId)}
                powered={isPowered(placement.itemId)}
                plug={
                  power.poweredIds.has(placement.itemId)
                    ? dcOf(placement.itemId)
                    : null
                }
                effectInventory={effectInventory ?? []}
                onHover={handleTooltip}
                onSelect={setPinnedCard}
              />
            ))}
          </PedalboardCase>

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

      {pinnedCard && (
        <CardModal onClose={() => setPinnedCard(null)}>{pinnedCard}</CardModal>
      )}
    </div>
  );
};
