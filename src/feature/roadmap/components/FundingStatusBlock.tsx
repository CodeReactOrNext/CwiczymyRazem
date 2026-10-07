import { cn } from "assets/lib/utils";
import { tierLabel } from "feature/roadmap/utils/tierText";
import { useTranslation } from "hooks/useTranslation";
import { Check, TriangleAlert } from "lucide-react";

import { MONTHLY_RUNNING_COST } from "../data/roadmap.data";
import { getFundingStatus } from "../utils/fundingStatus";

interface FundingStatusBlockProps {
  /** Lifetime total with ROADMAP_RAISED_OFFSET already subtracted. */
  totalRaised: number;
  raisedThisMonth: number;
  className?: string;
}

/**
 * Compact funding stat: headline, bar, footnote. Shared by the dashboard
 * SupportBanner and the /roadmap pitch so the funding story reads the same
 * wherever it shows up.
 *
 * The bar always tracks the goal that is still open. While the month's server
 * cost is unpaid that's the cost; once it's covered the headline and the bar
 * hand over to the next roadmap unlock and the covered cost drops to the
 * footnote.
 */
export const FundingStatusBlock = ({
  totalRaised,
  raisedThisMonth,
  className,
}: FundingStatusBlockProps) => {
  const { t } = useTranslation("supporter");
  const { covered, isCovered, costPct, nextTier, toGo, tierPct, showsTier } =
    getFundingStatus(totalRaised, raisedThisMonth);
  const NextTierIcon = nextTier?.icon;

  return (
    <div className={cn("min-w-0", className)}>
      <div className='flex items-center justify-between gap-4 text-xs sm:text-sm'>
        {showsTier && nextTier ? (
          <>
            <span className='flex min-w-0 items-center gap-1.5 text-zinc-300'>
              {NextTierIcon && (
                <NextTierIcon size={14} className='shrink-0 text-cyan-400' />
              )}
              <span className='truncate'>
                {t("funding.next_unlock")}{" "}
                <span className='font-medium text-zinc-100'>
                  {tierLabel(nextTier, t)}
                </span>
              </span>
            </span>
            <span className='shrink-0 font-semibold text-cyan-400'>
              {t("funding.to_go", { amount: toGo })}
            </span>
          </>
        ) : (
          <>
            <span className='flex min-w-0 items-center gap-1.5'>
              {isCovered ? (
                <Check size={14} className='shrink-0 text-emerald-400' />
              ) : (
                <TriangleAlert size={14} className='shrink-0 text-orange-400' />
              )}
              <span
                className={cn(
                  "truncate font-medium",
                  isCovered ? "text-zinc-300" : "text-orange-200",
                )}>
                {isCovered ? t("funding.covered") : t("funding.needs_help")}
              </span>
            </span>
            {!isCovered && (
              <span className='shrink-0 font-semibold text-zinc-100'>
                ${covered} / ${MONTHLY_RUNNING_COST}
              </span>
            )}
          </>
        )}
      </div>

      <div className='mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
        <div
          className={cn(
            "h-full rounded-full transition-all",
            showsTier
              ? "bg-gradient-to-r from-cyan-500 to-cyan-400"
              : isCovered
                ? "bg-emerald-400"
                : "bg-gradient-to-r from-orange-500 to-orange-400",
          )}
          style={{ width: `${showsTier ? tierPct : costPct}%` }}
        />
      </div>

      <div className='mt-3 flex items-center justify-between gap-4 text-xs text-zinc-500'>
        {showsTier ? (
          <span className='flex min-w-0 items-center gap-1.5'>
            <Check size={12} className='shrink-0 text-emerald-400' />
            <span className='truncate'>{t("funding.covered")}</span>
          </span>
        ) : nextTier ? (
          <>
            <span className='flex min-w-0 items-center gap-1.5'>
              {NextTierIcon && <NextTierIcon size={12} className='shrink-0' />}
              <span className='truncate'>
                {t("funding.next_unlock")}{" "}
                <span className='font-medium text-zinc-300'>
                  {tierLabel(nextTier, t)}
                </span>
              </span>
            </span>
            <span className='shrink-0 font-medium text-zinc-300'>
              {t("funding.to_go", { amount: toGo })}
            </span>
          </>
        ) : (
          <span className='font-medium text-emerald-400'>
            {t("funding.all_funded")}
          </span>
        )}
      </div>
    </div>
  );
};
