import { cn } from "assets/lib/utils";
import { CASE_PACK_SIZES } from "feature/arsenal/data/caseDefinitions";
import { useTranslation } from "hooks/useTranslation";

interface PackButtonsProps {
  /** Price of one open — the pack is this times its size. */
  fameCost: number;
  currentFame: number;
  isOpening: boolean;
  onOpen: (count: number) => void;
  className?: string;
}

/**
 * Open several at once: one animation, one summary, the same price per open.
 *
 * Quiet on purpose — the single open stays the card's button, and these are the
 * shortcut for a player who has already decided how many they are buying.
 */
export const PackButtons = ({
  fameCost,
  currentFame,
  isOpening,
  onOpen,
  className,
}: PackButtonsProps) => {
  const { t } = useTranslation("arsenal");

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {CASE_PACK_SIZES.map((size) => {
        const cost = fameCost * size;
        const canAfford = currentFame >= cost;
        return (
          <button
            key={size}
            type='button'
            onClick={() => onOpen(size)}
            disabled={!canAfford || isOpening}
            aria-label={t("cases.open_pack", { count: size })}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-arsenal-accent/60",
              canAfford
                ? "bg-arsenal-bg text-zinc-200 hover:bg-arsenal-card"
                : "cursor-not-allowed bg-arsenal-bg text-arsenal-text-tertiary",
              isOpening && "cursor-wait opacity-70",
            )}>
            <span className='tabular-nums'>×{size}</span>
            <span
              className={cn(
                "flex items-center gap-1.5 tabular-nums",
                canAfford ? "text-amber-400" : "text-red-400",
              )}>
              <img
                src='/images/coin.png'
                alt=''
                className={cn(
                  "h-4 w-4 object-contain",
                  !canAfford && "opacity-50 grayscale",
                )}
              />
              {cost}
            </span>
          </button>
        );
      })}
    </div>
  );
};
