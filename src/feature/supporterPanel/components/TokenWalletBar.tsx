import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";

interface TokenWalletBarProps {
  wallet: SupporterWallet;
  className?: string;
}

/**
 * The wallet, spelled out in the page header.
 *
 * Tokens left is the number every tab spends, so it is the only one the header
 * carries. An "of N earned" total reads like an allowance somebody handed out,
 * which is not what this is — tokens arrive with the badge and with donations,
 * and the pile is however big it happens to be.
 */
export const TokenWalletBar = ({ wallet, className }: TokenWalletBarProps) => (
  <div
    className={cn(
      "flex items-center gap-2.5 rounded-lg bg-cyan-500/10 px-4 py-2.5",
      className,
    )}>
    <SupportToken size={26} />
    <span className='text-xl font-bold tabular-nums leading-none text-cyan-300'>
      {wallet.left}
    </span>
    <span className='text-xs text-zinc-400'>tokens to spend</span>
  </div>
);
