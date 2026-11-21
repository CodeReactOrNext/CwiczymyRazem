import { cn } from "assets/lib/utils";
import { CurrencyIcon } from "components/CurrencyIcons/withCurrencyIcons";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";

import type { HardwareKind } from "../../data/rigHardware";
import { boardTierOf, nextTier, supplyTierOf } from "../../data/rigHardware";
import { useUpgradeRig } from "../../hooks/useUpgradeRig";
import type { RigSetup } from "../../types/arsenal.types";
import { RIG_BUTTON, RIG_TILE } from "./RigSection";

/**
 * The two things the board itself is made of, as two tiles under it: which
 * half of the rig, and the key that upgrades it, with its price.
 *
 * No model names and no specs on the tile. "Forge Supply 8" means nothing to a
 * player who has never owned one, and what the next rung is called, or that
 * the wallet is short and by how much, is on the key's tooltip — spelled out
 * on the tile it nags about a purchase nobody asked about.
 *
 * They sit under the board, not in its heading: the heading keeps the actions
 * used every visit, and a case is bought a handful of times in a whole game.
 *
 * At the top of a ladder the tile goes: a greyed "maxed" beside a live offer
 * is one more thing to read that asks nothing of the player.
 */

interface HardwareTileProps {
  /** Which half of the rig this is. */
  label: string;
  /** The rung bolted in now — on the tooltip only. */
  owned: string;
  next: { name: string; fame: number };
  fame: number;
  pending: boolean;
  onBuy: () => void;
}

const HardwareTile = ({
  label,
  owned,
  next,
  fame,
  pending,
  onBuy,
}: HardwareTileProps) => {
  const { t } = useArsenalLabels();
  const affordable = fame >= next.fame;

  return (
    <div
      className={cn(
        RIG_TILE,
        "flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-6 py-5",
      )}>
      <span className='text-base font-semibold text-zinc-100'>{label}</span>

      <button
        onClick={onBuy}
        disabled={!affordable || pending}
        title={
          affordable
            ? `${owned} → ${next.name}`
            : t("rig.hardware_costs", {
                name: next.name,
                fame: next.fame,
                missing: next.fame - fame,
              })
        }
        className={cn(RIG_BUTTON, affordable && !pending && "text-white")}>
        {pending ? t("buy.buying") : t("rig.upgrade")}
        <span className='flex items-center gap-1 tabular-nums'>
          <CurrencyIcon currency='fame' className='mr-0 h-3.5 w-3.5' />
          {next.fame}
        </span>
      </button>
    </div>
  );
};

interface RigHardwarePanelProps {
  rig: RigSetup;
  /** The wallet, so a rung is greyed out rather than sold out of reach. */
  fame: number;
}

export const RigHardwarePanel = ({ rig, fame }: RigHardwarePanelProps) => {
  const { mutate: buy, isPending, variables } = useUpgradeRig();
  const { t } = useArsenalLabels();

  const board = boardTierOf(rig.boardTier);
  const supply = supplyTierOf(rig.supplyTier);
  const nextBoard = nextTier("board", board.id);
  const nextSupply = nextTier("supply", supply.id);
  const pendingFor = (kind: HardwareKind) => isPending && variables === kind;

  if (!nextBoard && !nextSupply) return null;

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
      {nextBoard && (
        <HardwareTile
          label={t("rig.pedalboard_hw")}
          owned={board.name}
          next={nextBoard}
          fame={fame}
          pending={pendingFor("board")}
          onBuy={() => buy("board")}
        />
      )}
      {nextSupply && (
        <HardwareTile
          label={t("rig.power_supply_hw")}
          owned={supply.name}
          next={nextSupply}
          fame={fame}
          pending={pendingFor("supply")}
          onBuy={() => buy("supply")}
        />
      )}
    </div>
  );
};
