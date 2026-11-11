import { Button } from "assets/components/ui/button";
import { FreeCaseIcon } from "components/Rewards/FreeCaseIcon";
import { RewardSummary } from "components/Rewards/RewardSummary";
import { useTranslation } from "hooks/useTranslation";
import { Gift, PackageOpen } from "lucide-react";

import type { AchievementReward } from "../../data/achievementRewards";

interface ClaimRewardsBannerProps {
  /** How many earned badges have not been collected yet. */
  waiting: number;
  /** What all of them are worth together. */
  pending: AchievementReward;
  /** Unspent free cases already in the account. */
  caseTokens: number;
  isClaiming: boolean;
  onClaimAll: () => void;
}

/**
 * The one thing on this page a player can act on: collect everything at once.
 *
 * Only rendered while something is actually waiting — a permanent "nothing to
 * collect" strip would be a second headline competing with the progress bar
 * above it for the rest of the account's life. The free cases already in hand
 * are the exception: those stay visible so a player can see they are holding
 * one, and remember to go and spend it.
 */
export const ClaimRewardsBanner = ({
  waiting,
  pending,
  caseTokens,
  isClaiming,
  onClaimAll,
}: ClaimRewardsBannerProps) => {
  const { t } = useTranslation("achievements");
  const tokensKey =
    caseTokens === 1
      ? "panel.rewards.tokensHeldOne"
      : "panel.rewards.tokensHeld";

  if (waiting === 0 && caseTokens === 0) return null;

  if (waiting === 0) {
    return (
      <div className='flex items-center gap-3 rounded-lg bg-zinc-800/50 px-5 py-4'>
        <FreeCaseIcon size={22} />
        <p className='text-sm text-zinc-300'>
          {t(tokensKey, { count: caseTokens })}
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-5 rounded-lg bg-zinc-800/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8'>
      <div className='flex min-w-0 flex-col gap-2'>
        <p className='flex items-center gap-2 text-sm font-bold text-zinc-100'>
          <Gift
            size={16}
            className='shrink-0 text-amber-300'
            strokeWidth={2.5}
          />
          {t(
            waiting === 1
              ? "panel.rewards.waitingOne"
              : "panel.rewards.waiting",
            {
              count: waiting,
            },
          )}
        </p>
        <RewardSummary reward={pending} size='lg' />
        {caseTokens > 0 && (
          <p className='text-[0.6875rem] text-zinc-500'>
            {t(tokensKey, { count: caseTokens })}
          </p>
        )}
      </div>

      {/* The app's own key, full width on a phone where it sits under the
          list, and sized up on desktop — it is the only action on the page. */}
      <Button
        size='lg'
        onClick={onClaimAll}
        loading={isClaiming}
        className='w-full shrink-0 px-6 sm:w-auto'>
        {!isClaiming && <PackageOpen className='mr-2' />}
        {isClaiming ? t("panel.rewards.claiming") : t("panel.rewards.claimAll")}
      </Button>
    </div>
  );
};
