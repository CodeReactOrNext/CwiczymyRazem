import { HonorMark } from "feature/guilds/components/HonorMark";
import { TAKE_HONOR_COST } from "feature/guilds/utils/guildHonor.utils";

/**
 * The price band under a shelf piece's hover card: what taking it costs in
 * honor.
 *
 * Drawn as a solid blue block with the price at heading size, not as a
 * caption — the card above it is dark and busy, and a grey line under it was
 * the one thing on screen a member could miss. Blue matches the shield
 * artwork `HonorMark` wears, so the band is read as "this costs honor"
 * before the number is.
 *
 * Only the price, deliberately — the onlooker's own balance is theirs to check
 * elsewhere (the shelf header, the take card), not printed on a tile anyone
 * hovering can see.
 *
 * The price is flat — see `TAKE_HONOR_COST` — the same for one guitar or a
 * whole stack of parts, so there is nothing here to multiply any more.
 */
export const HonorPriceTag = () => (
  <div className='mt-2 rounded-lg bg-blue-950/95 px-4 py-3'>
    <span className='flex items-center gap-3'>
      <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/20'>
        <HonorMark size={26} />
      </span>
      <span className='leading-tight'>
        <span className='block text-[11px] font-semibold text-blue-200/70'>
          Take it for
        </span>
        <span className='block text-xl font-black tabular-nums text-blue-100'>
          {TAKE_HONOR_COST.toLocaleString()} honor
        </span>
      </span>
    </span>
  </div>
);
