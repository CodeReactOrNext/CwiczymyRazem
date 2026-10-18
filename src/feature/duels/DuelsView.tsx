import { Skeleton } from "assets/components/ui/skeleton";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { ActiveDuelCard } from "feature/duels/components/ActiveDuelCard";
import { DuelEmptyState } from "feature/duels/components/DuelEmptyState";
import { DuelFeed } from "feature/duels/components/DuelFeed";
import { DuelQueueCard } from "feature/duels/components/DuelQueueCard";
import { DuelRanking } from "feature/duels/components/DuelRanking";
import { DuelRatingSummary } from "feature/duels/components/DuelRatingSummary";
import { DuelRules } from "feature/duels/components/DuelRules";
import { RecentDuels } from "feature/duels/components/RecentDuels";
import { useDuelOverview, useNow } from "feature/duels/hooks/useDuels";
import type { DuelJoinResult } from "feature/duels/types/duel.types";
import {
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

/**
 * The duels page: your rating up top; then what you have running (the thing
 * to do here), where a new duel starts, how your last ones ended, and how
 * everybody else's went; the ladder and the rules on the side.
 */
export const DuelsView = () => {
  const { t } = useTranslation("duels");
  const router = useRouter();
  const uid = useAppSelector(selectUserAuth) ?? null;
  const myName = useAppSelector(selectUserName) ?? "";
  const myAvatar = useAppSelector(selectUserAvatar) ?? "";
  const now = useNow();
  const { data: overview, isLoading, isError } = useDuelOverview(uid);

  // A duel opened from a notification (?duel=…), the one just paired, or the
  // one both players just finished early.
  const [lastJoin, setLastJoin] = useState<DuelJoinResult | null>(null);
  const [settledId, setSettledId] = useState<string | null>(null);
  const justPairedId = lastJoin?.kind === "matched" ? lastJoin.duelId : null;
  const linkedId =
    typeof router.query.duel === "string" ? router.query.duel : null;
  const highlightedId = settledId ?? justPairedId ?? linkedId;
  const hasOverview = !!overview;

  const active = overview?.active ?? [];
  const recent = overview?.recent ?? [];
  // A duel settled early moves from the cards to the recent list — scroll again once it lands there.
  const isHighlightedRecent = recent.some((duel) => duel.id === highlightedId);

  useEffect(() => {
    if (!highlightedId || !hasOverview) return;
    document
      .getElementById(`duel-${highlightedId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlightedId, hasOverview, isHighlightedRecent]);

  const queueCard = (
    <DuelQueueCard
      uid={uid}
      overview={overview}
      now={now}
      onJoined={(result) => {
        setSettledId(null);
        setLastJoin(result);
      }}
    />
  );

  return (
    <div className='flex min-h-screen flex-col'>
      <HeroBanner
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        rightContent={<DuelRatingSummary overview={overview} />}
        backgroundContent={<HeroPattern />}
      />

      {/* Screen readers hear how the button press went; the page shows it as the new card or ticket. */}
      <p className='sr-only' role='status'>
        {settledId
          ? t("ready.settled")
          : lastJoin
            ? lastJoin.kind === "matched"
              ? t("queue.matched")
              : t("queue.queued")
            : ""}
      </p>

      <div className='grid grid-cols-1 gap-6 px-4 pb-16 pt-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 lg:px-10'>
        <div className='flex min-w-0 flex-col gap-6'>
          {isError && (
            <p className='px-1 text-sm text-zinc-400'>{t("error")}</p>
          )}

          {isLoading || !overview ? (
            <>
              {queueCard}
              {isLoading && <Skeleton className='h-72 w-full rounded-lg' />}
            </>
          ) : active.length > 0 ? (
            <>
              <section className='flex flex-col gap-4'>
                <h2 className='flex items-baseline gap-2 px-1 text-base font-semibold text-zinc-100'>
                  {t("active.title")}
                  <span className='text-sm font-normal tabular-nums text-zinc-500'>
                    {active.length}
                  </span>
                </h2>
                {active.map((duel) => (
                  <ActiveDuelCard
                    key={duel.id}
                    uid={uid}
                    duel={duel}
                    now={now}
                    myName={myName}
                    myAvatar={myAvatar}
                    isHighlighted={duel.id === linkedId}
                    isNew={duel.id === justPairedId}
                    onSettledEarly={setSettledId}
                  />
                ))}
              </section>
              {queueCard}
            </>
          ) : (
            <>
              {queueCard}
              <DuelEmptyState
                myName={myName}
                myAvatar={myAvatar}
                isSearching={overview.tickets.length > 0}
              />
            </>
          )}

          {recent.length > 0 && (
            <RecentDuels duels={recent} highlightedId={highlightedId} />
          )}

          {overview && <DuelFeed feed={overview.feed} now={now} />}
        </div>

        <aside className='flex min-w-0 flex-col gap-6'>
          {overview ? (
            <DuelRanking
              overview={overview}
              uid={uid}
              myName={myName}
              myAvatar={myAvatar}
            />
          ) : (
            <Skeleton className='h-80 w-full rounded-lg' />
          )}
          <DuelRules />
        </aside>
      </div>
    </div>
  );
};
