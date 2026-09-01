import { cn } from "assets/lib/utils";
import { CurrencyIcon } from "components/CurrencyIcons/withCurrencyIcons";
import { Boxes, Plug } from "lucide-react";

import type { HardwareKind } from "../../data/rigHardware";
import { boardTierOf, nextTier, supplyTierOf } from "../../data/rigHardware";
import { useUpgradeRig } from "../../hooks/useUpgradeRig";
import type { RigSetup } from "../../types/arsenal.types";
import { RIG_BUTTON } from "./RigSection";

/**
 * The two things the board itself is made of, as two buttons.
 *
 * They used to be a pair of shop cards under the board, each reciting what is
 * bolted in, what the next rung gives and what it costs. That is three lines to
 * say one thing: there is a bigger one, and it costs this much. So they sit up
 * with the rest of the board's controls instead.
 *
 * Each one says which half of the rig it upgrades rather than what the next
 * rung is called: "Forge Supply 8" means nothing to a player who has never
 * owned one, while "Upgrade power supply" is unmistakable from across the
 * screen. The rung's name, and what is bolted in now, are on the tooltip.
 *
 * At the top of a ladder the button stays, greyed, saying so.
 */

interface HardwareButtonProps {
  icon: React.ReactNode;
  /** Which half of the rig this buys — the whole label. */
  label: string;
  /** The rung bolted in now. It is on the tooltip, not on the button. */
  owned: string;
  /** The next rung, or `null` at the top of the ladder. */
  next: { name: string; fame: number } | null;
  fame: number;
  pending: boolean;
  onBuy: () => void;
}

const HardwareButton = ({
  icon,
  label,
  owned,
  next,
  fame,
  pending,
  onBuy,
}: HardwareButtonProps) => {
  const affordable = next !== null && fame >= next.fame;

  return (
    <button
      onClick={onBuy}
      disabled={next === null || !affordable || pending}
      title={
        next === null
          ? `${owned} — the biggest one made`
          : affordable
            ? `${owned} → ${next.name}`
            : `${next.name} costs ${next.fame} Fame — ${next.fame - fame} more needed`
      }
      className={cn(RIG_BUTTON, affordable && !pending && "text-cyan-300")}>
      {icon}
      {next === null
        ? `${label} maxed`
        : pending
          ? "Buying…"
          : `Upgrade ${label.toLowerCase()}`}
      {next !== null && (
        <span className='flex items-center gap-1 tabular-nums'>
          <CurrencyIcon currency='fame' className='mr-0 h-3.5 w-3.5' />
          {next.fame}
        </span>
      )}
    </button>
  );
};

interface RigHardwarePanelProps {
  rig: RigSetup;
  /** The wallet, so a rung is greyed out rather than sold out of reach. */
  fame: number;
}

export const RigHardwarePanel = ({ rig, fame }: RigHardwarePanelProps) => {
  const { mutate: buy, isPending, variables } = useUpgradeRig();

  const board = boardTierOf(rig.boardTier);
  const supply = supplyTierOf(rig.supplyTier);
  const pendingFor = (kind: HardwareKind) => isPending && variables === kind;

  return (
    <>
      <HardwareButton
        icon={<Boxes size={12} strokeWidth={2.5} />}
        label='Pedalboard'
        owned={board.name}
        next={nextTier("board", board.id)}
        fame={fame}
        pending={pendingFor("board")}
        onBuy={() => buy("board")}
      />
      <HardwareButton
        icon={<Plug size={12} strokeWidth={2.5} />}
        label='Power supply'
        owned={supply.name}
        next={nextTier("supply", supply.id)}
        fame={fame}
        pending={pendingFor("supply")}
        onBuy={() => buy("supply")}
      />
    </>
  );
};
