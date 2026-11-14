import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { TOKENS_PER_DOLLAR } from "feature/supporterPanel/constants/supporterPanel.constants";

/**
 * The whole token economy in one picture: what a dollar turns into. Everything
 * else about tokens — welcome grants, prices — is left to the panel, where the
 * numbers sit on the buttons that spend them.
 */
export const TokenExchange = ({ className }: { className?: string }) => (
  <p
    aria-label={`$1 = ${TOKENS_PER_DOLLAR}`}
    className={cn(
      "flex items-center gap-3 text-3xl font-semibold tabular-nums",
      className,
    )}>
    <span className='text-zinc-100'>$1</span>
    <span aria-hidden className='text-zinc-600'>
      =
    </span>
    <span className='flex items-center gap-2 text-amber-300'>
      <SupportToken size={28} />
      {TOKENS_PER_DOLLAR}
    </span>
  </p>
);
