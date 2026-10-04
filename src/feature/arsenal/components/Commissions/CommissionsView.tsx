import type { CommissionTarget } from "feature/arsenal/data/commission";
import {
  getCommissionQuote,
  getTargetSubject,
} from "feature/arsenal/data/commission";
import type {
  ArsenalUserData,
  WorkshopKind,
} from "feature/arsenal/types/arsenal.types";
import { getCommissionCatalog } from "feature/arsenal/utils/commissionCatalog";
import type { DexRarityFilter } from "feature/arsenal/utils/dexWall";
import { DEX_RARITY_CHIPS } from "feature/arsenal/utils/dexWall";
import { Guitar, Layers } from "lucide-react";
import { useMemo, useState } from "react";

import { RARITY_STYLES } from "../RarityBadge";
import { Segment, SegmentGroup } from "../SegmentedControl";
import { CommissionCard } from "./CommissionCard";
import { CommissionDialog } from "./CommissionDialog";

interface CommissionsViewProps {
  data: Pick<
    ArsenalUserData,
    "inventory" | "effectInventory" | "dexGuitars" | "dexEffects" | "parts"
  >;
  fame: number;
}

/**
 * The bench's order form: every model still missing from the Dex, built stock
 * to order. The level gate sits around this view in the Arsenal, so by the time
 * it renders the player may order anything on it — see `data/commission.ts` for
 * the prices and the rules.
 */
export const CommissionsView = ({ data, fame }: CommissionsViewProps) => {
  const [kind, setKind] = useState<WorkshopKind>("guitar");
  const [rarity, setRarity] = useState<DexRarityFilter>("all");
  const [ordering, setOrdering] = useState<CommissionTarget | null>(null);

  const wallet = useMemo(() => data.parts ?? [], [data.parts]);
  const catalog = useMemo(() => getCommissionCatalog(data), [data]);

  const counts: Record<WorkshopKind, number> = {
    guitar: catalog.filter((e) => e.target.kind === "guitar").length,
    effect: catalog.filter((e) => e.target.kind === "effect").length,
  };

  const visible = useMemo(
    () =>
      catalog
        .filter(
          ({ target }) =>
            target.kind === kind &&
            (rarity === "all" || target.def.rarity === rarity),
        )
        .map((entry) => ({
          ...entry,
          quote: getCommissionQuote(
            getTargetSubject(entry.target),
            wallet,
            fame,
          ),
        })),
    [catalog, kind, rarity, wallet, fame],
  );

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center gap-3'>
            <span className='h-6 w-0.5 rounded-full bg-cyan-400' aria-hidden />
            <h2 className='font-display text-2xl font-black text-zinc-100'>
              Commissions
            </h2>
          </div>
          <p className='text-sm text-zinc-500'>
            Any model missing from your Dex, built stock to order — once each.
          </p>
        </div>
        <p className='text-sm text-zinc-400'>
          <span className='font-bold tabular-nums text-zinc-100'>
            {catalog.length}
          </span>{" "}
          left to build
        </p>
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <SegmentGroup>
          <Segment active={kind === "guitar"} onClick={() => setKind("guitar")}>
            <Guitar size={14} />
            Guitars
            <span className='text-zinc-500'>{counts.guitar}</span>
          </Segment>
          <Segment active={kind === "effect"} onClick={() => setKind("effect")}>
            <Layers size={14} />
            Pedals
            <span className='text-zinc-500'>{counts.effect}</span>
          </Segment>
        </SegmentGroup>

        <SegmentGroup>
          <Segment active={rarity === "all"} onClick={() => setRarity("all")}>
            All
          </Segment>
          {DEX_RARITY_CHIPS.map((r) => (
            <Segment key={r} active={rarity === r} onClick={() => setRarity(r)}>
              <span
                className='h-1.5 w-1.5 rounded-full'
                style={{ backgroundColor: RARITY_STYLES[r].baseColor }}
              />
              {r}
            </Segment>
          ))}
        </SegmentGroup>
      </div>

      <div className='rounded-lg bg-arsenal-bg p-3 sm:p-4'>
        {visible.length === 0 ? (
          <p className='py-16 text-center text-sm text-zinc-500'>
            {catalog.length === 0
              ? "Your Dex is complete — there is nothing left for the bench to build."
              : "Nothing left to build here. Try another rarity or kind."}
          </p>
        ) : (
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
            {visible.map(({ key, target, quote }) => (
              <CommissionCard
                key={key}
                target={target}
                price={quote.fame}
                affordable={quote.canAfford}
                onClick={() => setOrdering(target)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mounted only while an order is open: the dialog owns a mutation, and
          the form should not need a query client just to be browsed. */}
      {ordering && (
        <CommissionDialog
          target={ordering}
          wallet={wallet}
          fame={fame}
          onClose={() => setOrdering(null)}
        />
      )}
    </div>
  );
};
