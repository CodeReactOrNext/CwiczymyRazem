import type { CommissionTarget } from "feature/arsenal/data/commission";
import {
  getCommissionQuote,
  getTargetSubject,
} from "feature/arsenal/data/commission";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import type {
  ArsenalUserData,
  WorkshopKind,
} from "feature/arsenal/types/arsenal.types";
import { getCommissionCatalog } from "feature/arsenal/utils/commissionCatalog";
import type { DexRarityFilter } from "feature/arsenal/utils/dexWall";
import { DEX_RARITY_CHIPS } from "feature/arsenal/utils/dexWall";
import { useMemo, useState } from "react";

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
 *
 * The view is the two filters and the grid. The tab already names it, so it has
 * no title; how much is left is said once, on the kind it is left in; and a
 * rarity's colour is on the cards, not repeated as a dot on every filter.
 */
export const CommissionsView = ({ data, fame }: CommissionsViewProps) => {
  const [kind, setKind] = useState<WorkshopKind>("guitar");
  const labels = useArsenalLabels();
  const { t } = labels;
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
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <SegmentGroup>
          <Segment active={kind === "guitar"} onClick={() => setKind("guitar")}>
            {t("collection.scope.guitars")}
            <span className='tabular-nums text-zinc-500'>{counts.guitar}</span>
          </Segment>
          <Segment active={kind === "effect"} onClick={() => setKind("effect")}>
            {t("collection.scope.pedals")}
            <span className='tabular-nums text-zinc-500'>{counts.effect}</span>
          </Segment>
        </SegmentGroup>

        <SegmentGroup>
          <Segment active={rarity === "all"} onClick={() => setRarity("all")}>
            {t("collection.scope.all")}
          </Segment>
          {DEX_RARITY_CHIPS.map((r) => (
            <Segment key={r} active={rarity === r} onClick={() => setRarity(r)}>
              {labels.rarity(r)}
            </Segment>
          ))}
        </SegmentGroup>
      </div>

      <div className='rounded-lg bg-arsenal-bg p-4 sm:p-5'>
        {visible.length === 0 ? (
          <p className='py-16 text-center text-sm text-zinc-500'>
            {catalog.length === 0
              ? t("commissions.dex_complete")
              : t("commissions.nothing_here")}
          </p>
        ) : (
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
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
