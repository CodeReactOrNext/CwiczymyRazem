import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { FreeCaseIcon } from "components/Rewards/FreeCaseIcon";
import { useTranslation } from "hooks/useTranslation";

interface OpenCaseButtonProps {
  canAfford: boolean;
  isOpening: boolean;
  onClick: () => void;
  /** What the press takes: this much Fame, or one free case. */
  payment: { kind: "fame"; cost: number } | { kind: "token" };
  /** How many cases the press opens. */
  count: number;
  /**
   * `featured` is the one loud CTA on the screen — amber. Shelf cards use
   * `soft`, so five keys don't compete with the featured one and each other.
   */
  variant: "featured" | "soft";
  className?: string;
}

/** The one key that opens a case. The price rides on it and nowhere else. */
export const OpenCaseButton = ({
  canAfford,
  isOpening,
  onClick,
  payment,
  count,
  variant,
  className,
}: OpenCaseButtonProps) => {
  const { t } = useTranslation("arsenal");
  const isFeatured = variant === "featured";
  // The visible word stays short so it fits beside a five-digit price in every
  // language; what exactly the press does is in the accessible name.
  const action =
    payment.kind === "token"
      ? t("cases.open_free")
      : count > 1
        ? t("cases.open_pack", { count })
        : t("cases.open_case");

  return (
    <button
      type='button'
      aria-label={
        payment.kind === "fame" ? `${action} · ${payment.cost}` : action
      }
      onClick={onClick}
      disabled={!canAfford || isOpening}
      className={cn(
        PRESSABLE,
        "flex h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-lg border-b-black/30 px-4 text-sm font-bold transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        !canAfford
          ? "cursor-not-allowed bg-arsenal-bg text-arsenal-text-tertiary"
          : isFeatured
            ? "bg-amber-400 text-zinc-950 hover:bg-amber-300"
            : "bg-arsenal-accent/15 text-arsenal-accent hover:bg-arsenal-accent/25",
        isOpening && "cursor-wait opacity-70",
        className,
      )}>
      <span>{isOpening
          ? t("cases.opening")
          : isFeatured
            ? t("cases.open_case")
            : t("cases.open")}</span>
      {payment.kind === "token" ? (
        <FreeCaseIcon size={20} />
      ) : (
        <span
          className={cn(
            "flex items-center gap-1.5 tabular-nums",
            !canAfford
              ? "text-red-400"
              : // Gold on the amber key would vanish into it.
                !isFeatured && "text-amber-400",
          )}>
          <img
            src='/images/tokens/coin.png'
            alt=''
            className={cn(
              "h-5 w-5 object-contain",
              !canAfford && "opacity-50 grayscale",
            )}
          />
          {payment.cost.toLocaleString()}
        </span>
      )}
    </button>
  );
};
