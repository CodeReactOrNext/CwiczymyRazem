import {
  useClaimAchievementRewards,
  useRewardLedger,
} from "hooks/useRewardLedger";
import { useTranslation } from "hooks/useTranslation";
import { type ReactNode, useCallback, useMemo, useState } from "react";

import { resolveAchievementReward } from "../../data/achievementRewards";
import { useAchievementContext } from "../../hooks/useAchievementContext";
import { useAchievementStats } from "../../hooks/useAchievementStats";
import type { AchievementList } from "../../types";
import { buildAchievementPanelState } from "../../utils/achievementPanelState";
import { AchievementRow } from "./AchievementRow";
import {
  AchievementsSummary,
  type CollectedRewards,
} from "./AchievementsSummary";

/**
 * The whole collection: one count, then one list, commonest badge first.
 *
 * Neither grouped nor broken down by rarity. A badge's rarity is already on its
 * art, how far along it is is already on its row, and the share of players who
 * hold it is the column the list is ordered by — so a second set of bars above
 * the list only competed with the one number a player came to read.
 *
 * Deliberately not wrapped in a card of its own: the rows are the cards, and the
 * styleguide allows exactly one card level on mobile.
 */
export const AchievementsPanel = ({
  userAchievements,
  afterSummary,
}: {
  userAchievements: AchievementList[];
  /**
   * A section that belongs between the count and the list — the season
   * finishes. Below 77 rows nobody would reach it; above the count it pushed
   * the collection itself off the first screen.
   */
  afterSummary?: ReactNode;
}) => {
  const { t } = useTranslation("achievements");
  const context = useAchievementContext();
  const { data: stats } = useAchievementStats();
  const { data: ledger } = useRewardLedger();
  const rewards = ledger?.achievements;
  const { mutate: claim, isPending: isClaimingOne } =
    useClaimAchievementRewards();
  // "Collect all" says what it paid on the summary card, so it skips the toast.
  const { mutate: claimEverything, isPending: isClaimingAll } =
    useClaimAchievementRewards({ quiet: true });
  const isClaiming = isClaimingOne || isClaimingAll;
  const [collected, setCollected] = useState<CollectedRewards | null>(null);

  // Which badges have already been paid for. Empty while the ledger loads,
  // which reads as "nothing collected yet" — the claim button it briefly shows
  // is harmless, because the server decides what is actually owed.
  const claimedIds = useMemo(
    () => new Set(rewards?.claimed ?? []),
    [rewards?.claimed]
  );

  const claimOne = useCallback(
    (id: AchievementList) => claim([id]),
    [claim]
  );
  const claimAll = useCallback(
    () =>
      claimEverything(undefined, {
        onSuccess: (result) =>
          setCollected({ count: result.claimed.length, reward: result.reward }),
      }),
    [claimEverything],
  );

  const state = useMemo(
    () => buildAchievementPanelState(userAchievements, context, stats ?? null),
    [userAchievements, context, stats]
  );

  // Badges one logged session away from unlocking — and from paying out.
  const readyCount = useMemo(
    () => state.entries.filter((entry) => entry.state === "ready").length,
    [state.entries],
  );

  return (
    <div className='flex flex-col gap-6'>
      <AchievementsSummary
        owned={state.owned}
        total={state.total}
        waiting={rewards ? rewards.claimable.length : null}
        pending={rewards?.pending ?? null}
        readyCount={readyCount}
        caseTokens={ledger?.caseTokens ?? 0}
        collected={collected}
        isClaiming={isClaimingAll}
        onClaimAll={claimAll}
      />

      {afterSummary}

      <div className='flex flex-col gap-2'>
        <div className='flex justify-end px-1'>
          <span className='text-[0.6875rem] text-zinc-500'>{t("panel.globalColumn")}</span>
        </div>

        <div className='flex flex-col gap-1.5'>
          {state.entries.map((entry) => (
            <AchievementRow
              key={entry.data.id}
              entry={entry}
              context={context}
              reward={resolveAchievementReward(entry.data.id)}
              isClaimed={claimedIds.has(entry.data.id)}
              isClaiming={isClaiming}
              onClaim={claimOne}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
