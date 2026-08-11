import { parsePairs } from "./parseProps";

/** Low → high ramp, reused for every "worse to better" scale in the wiki. */
const RAMP = [
  "bg-zinc-800/60 text-zinc-300",
  "bg-emerald-950/40 text-emerald-400",
  "bg-cyan-950/40 text-cyan-400",
  "bg-purple-950/40 text-purple-400",
  "bg-amber-950/40 text-amber-400",
  "bg-orange-950/40 text-orange-400",
];

interface TierScaleProps {
  /** Pipe-separated tiers, worst first — `"Common::Most drops|Rare::Uncommon find"`. */
  items: string;
  caption?: string;
}

/**
 * A left-to-right scale of named tiers (song tiers, gear rarities, item condition).
 * The colour ramp does the explaining, so the text doesn't have to say "better".
 */
export const TierScale = ({ items, caption }: TierScaleProps) => {
  const tiers = parsePairs(items);

  return (
    <div className='not-prose my-10'>
      <div className='flex flex-wrap gap-3'>
        {tiers.map((tier, index) => (
          <div
            key={tier.title}
            className='min-w-[7rem] flex-1 rounded-lg bg-zinc-900/40 p-4'>
            <span
              className={`inline-block rounded px-2.5 py-1 text-xs font-bold ${
                RAMP[Math.min(index, RAMP.length - 1)]
              }`}>
              {tier.title}
            </span>
            {tier.description && (
              <p className='mt-2.5 text-xs leading-relaxed text-zinc-400'>
                {tier.description}
              </p>
            )}
          </div>
        ))}
      </div>
      {caption && <p className='mt-3 text-xs text-zinc-500'>{caption}</p>}
    </div>
  );
};
