import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import {
  getModResaleValue,
  getPartResaleValue,
} from "feature/arsenal/data/resale";
import { getModDef } from "feature/arsenal/data/workshop";
import { useFuseParts } from "feature/arsenal/hooks/useFuseParts";
import { useListItem } from "feature/arsenal/hooks/useMarketplace";
import { useSellPart } from "feature/arsenal/hooks/useSellPart";
import { useSellSalvagedMod } from "feature/arsenal/hooks/useSellSalvagedMod";
import { groupWalletByPart } from "feature/arsenal/utils/scrap";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";

import type {
  PartId,
  PartTier,
  SalvagedMod,
  ScrapPart,
} from "../../types/arsenal.types";
import { SellConfirmDialog } from "../GuitarInventory/SellConfirmDialog";
import { ListItemDialog } from "../Marketplace/ListItemDialog";
import { PartIcon } from "../Parts/PartIcon";
import { SectionLabel } from "../SectionLabel";
import { TierPlate } from "../TierPlate";
import { ModArt } from "../Workshop/ModArt";
import { SalvagedModCard } from "./SalvagedModCard";
import { ScrapPartCard } from "./ScrapPartCard";
import { StashItemDialog } from "./StashItemDialog";

/** A part stack or a rescued mod the player tapped, waiting on its card. */
type Detail =
  | { kind: "part"; partId: PartId; tier: PartTier; qty: number }
  | { kind: "mod"; mod: SalvagedMod }
  | null;

/** The same sale, one confirm step later. */
type Pending =
  | { kind: "part"; partId: PartId; tier: PartTier; qty: number }
  | { kind: "mod"; mod: SalvagedMod }
  | null;

interface SalvageShelfProps {
  parts: ScrapPart[];
  mods: SalvagedMod[];
}

const rowClass =
  "flex items-center gap-3 rounded-lg bg-zinc-800/40 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 hover:bg-zinc-800/70";

/**
 * Loose parts and rescued mods, as a list you can act on.
 *
 * The stash board hangs both of these in sockets, but the board needs a pointer
 * and a wide screen, so the card view — which is all a phone gets — would leave
 * a player holding parts and mods with no way to look at them or cash them out.
 * Same cards, same confirm, one row each instead of a socket.
 */
export const SalvageShelf = ({ parts, mods }: SalvageShelfProps) => {
  const { mutate: sellPart, isPending: isSellingPart } = useSellPart();
  const { mutate: fusePartsStack, isPending: isFusingPart } = useFuseParts();
  const { mutate: sellMod, isPending: isSellingMod } = useSellSalvagedMod();
  const { mutate: listOnMarket, isPending: isListing } = useListItem();
  const currentFame = useAppSelector(selectCurrentUserStats)?.fame || 0;
  const [detail, setDetail] = useState<Detail>(null);
  const [pending, setPending] = useState<Pending>(null);
  /** A mod on its way to the market rather than the bin. */
  const [listMod, setListMod] = useState<SalvagedMod | null>(null);

  // One row per part *and* tier: a Rare screw and a Common one are separate
  // stacks everywhere else in the game, and they sell for different money.
  const stacks = useMemo(
    () =>
      groupWalletByPart(parts).flatMap((row) =>
        row.tiers.map((tier) => ({ partId: row.partId, ...tier })),
      ),
    [parts],
  );

  if (stacks.length === 0 && mods.length === 0) return null;

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-4'>
      <SectionLabel>Salvage</SectionLabel>

      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
        {stacks.map((stack) => {
          const color = PART_TIER_COLORS[stack.tier];
          return (
            <button
              key={`${stack.partId}-${stack.tier}`}
              onClick={() => setDetail({ kind: "part", ...stack })}
              className={rowClass}>
              <TierPlate color={color} size={44}>
                <PartIcon partId={stack.partId} size={30} />
              </TierPlate>
              <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                <span className='truncate text-sm font-bold text-zinc-100'>
                  {getPartLabel(stack.partId)}
                </span>
                <span className='text-xs font-semibold' style={{ color }}>
                  {stack.tier}
                </span>
              </span>
              <span className='text-lg font-black tabular-nums text-zinc-300'>
                ×{stack.qty}
              </span>
            </button>
          );
        })}

        {mods.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setDetail({ kind: "mod", mod })}
            className={rowClass}>
            <ModArt modId={mod.featureId} size={44} />
            <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <span className='truncate text-sm font-bold text-zinc-100'>
                {getModDef(mod.kind, mod.featureId)?.label ?? mod.featureId}
              </span>
              <span className='text-xs font-semibold text-purple-300/70'>
                Salvaged mod
              </span>
            </span>
            <span className='text-lg font-black tabular-nums text-purple-300'>
              +{mod.points}
            </span>
          </button>
        ))}
      </div>

      <StashItemDialog
        isOpen={detail !== null}
        onClose={() => setDetail(null)}
        title={
          detail === null
            ? ""
            : detail.kind === "part"
              ? `${detail.tier} ${getPartLabel(detail.partId)}`
              : (getModDef(detail.mod.kind, detail.mod.featureId)?.label ??
                detail.mod.featureId)
        }>
        {detail?.kind === "part" && (
          <ScrapPartCard
            partId={detail.partId}
            tier={detail.tier}
            qty={detail.qty}
            onSellClick={(qty) => {
              setDetail(null);
              setPending({ ...detail, qty });
            }}
            isSelling={isSellingPart}
            onFuseClick={(crafts) => {
              setDetail(null);
              fusePartsStack({
                partId: detail.partId,
                tier: detail.tier,
                crafts,
              });
            }}
            isFusing={isFusingPart}
            fame={currentFame}
          />
        )}
        {detail?.kind === "mod" && (
          <SalvagedModCard
            mod={detail.mod}
            onSellClick={() => {
              setDetail(null);
              setPending(detail);
            }}
            isSelling={isSellingMod}
            onListClick={() => {
              const { mod } = detail;
              setDetail(null);
              setListMod(mod);
            }}
            isListing={isListing}
          />
        )}
      </StashItemDialog>

      {pending && (
        <SellConfirmDialog
          isOpen
          itemType={pending.kind === "mod" ? "Mod" : "Parts"}
          itemName={
            pending.kind === "mod"
              ? `${getModDef(pending.mod.kind, pending.mod.featureId)?.label ?? pending.mod.featureId} +${pending.mod.points}`
              : `${pending.tier} ${getPartLabel(pending.partId)} ×${pending.qty}`
          }
          fameReward={
            pending.kind === "mod"
              ? getModResaleValue(
                  pending.mod.kind,
                  pending.mod.featureId,
                  pending.mod.points,
                )
              : getPartResaleValue(pending.partId, pending.tier, pending.qty)
          }
          onConfirm={() => {
            if (pending.kind === "mod") {
              sellMod(pending.mod.id, { onSuccess: () => setPending(null) });
              return;
            }
            sellPart(
              { partId: pending.partId, tier: pending.tier, qty: pending.qty },
              { onSuccess: () => setPending(null) },
            );
          }}
          onCancel={() => setPending(null)}
          isLoading={isSellingPart || isSellingMod}
        />
      )}

      {/* The phone's only route to the market for a mod — the stash board this
          shelf stands in for needs a pointer and a wide screen. */}
      {listMod && (
        <ListItemDialog
          isOpen
          itemType='Mod'
          itemName={`${getModDef(listMod.kind, listMod.featureId)?.label ?? listMod.featureId} +${listMod.points}`}
          minPrice={getModResaleValue(
            listMod.kind,
            listMod.featureId,
            listMod.points,
          )}
          currentFame={currentFame}
          onConfirm={(price) =>
            listOnMarket(
              { itemType: "mod", inventoryItemId: listMod.id, price },
              { onSuccess: () => setListMod(null) },
            )
          }
          onCancel={() => setListMod(null)}
          isLoading={isListing}
        />
      )}
    </div>
  );
};
