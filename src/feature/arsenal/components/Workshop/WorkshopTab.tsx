import { countScrapParts } from "feature/arsenal/utils/scrap";
import { Hammer, TrendingUp, Wrench } from "lucide-react";

import type { ScrapPart } from "../../types/arsenal.types";

interface WorkshopTabProps {
  /** The player's salvaged parts — the raw material this tab will consume. */
  parts: ScrapPart[];
}

const PLANNED = [
  { icon: Hammer, label: "Build guitars from parts" },
  { icon: TrendingUp, label: "Upgrade the ones you own" },
  { icon: Wrench, label: "Repair worn instruments" },
];

/** Placeholder for the crafting half of the scrap loop. */
export const WorkshopTab = ({ parts }: WorkshopTabProps) => {
  const total = countScrapParts(parts);

  return (
    <div className="flex flex-col items-center gap-8 rounded-xl bg-zinc-900/40 px-6 py-20 text-center">
      <Hammer size={44} className="text-zinc-700" />

      <div className="flex flex-col items-center gap-3">
        <span className="rounded-full bg-cyan-500/10 px-4 py-1.5 text-[11px] font-bold capitalize tracking-[0.15em] text-cyan-300">
          Coming soon
        </span>
        <h2 className="text-2xl font-black capitalize tracking-wide text-white">Workshop</h2>
      </div>

      <div className="flex flex-col items-start gap-3">
        {PLANNED.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon size={16} className="text-zinc-600" />
            <span className="text-sm text-zinc-400">{label}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-600">
        {total > 0
          ? `Your ${total} salvaged ${total === 1 ? "part" : "parts"} will be spendable here.`
          : "Scrap gear from your collection to stockpile parts for it."}
      </p>
    </div>
  );
};
