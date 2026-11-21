import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { Kostek } from "components/Mascot/Kostek";
import {
  tabNavListClass,
  tabNavTriggerClass,
} from "components/PageTabs/tabNav";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { DuelJoinDialog } from "feature/duels/components/DuelJoinDialog";
import { DuelOnboarding } from "feature/duels/components/DuelOnboarding";
import {
  DuelRanking,
  DuelRankPeek,
} from "feature/duels/components/DuelRanking";
import { DuelResultScreen } from "feature/duels/components/DuelResultScreen";
import type { DuelRulesView } from "feature/duels/components/DuelRulesDialog";
import { DuelRulesDialog } from "feature/duels/components/DuelRulesDialog";
import { DuelScreen } from "feature/duels/components/DuelScreen";
import { DuelSlotTile } from "feature/duels/components/DuelSlotTile";
import { DuelStatsStrip } from "feature/duels/components/DuelStatsStrip";
import { LatestDuels, RecentDuels } from "feature/duels/components/RecentDuels";
import { getDuelExercise } from "feature/duels/data/duelPool";
import {
  useCancelDuelTicket,
  useDuelOverview,
  useJoinDuel,
  useNow,
} from "feature/duels/hooks/useDuels";
import { useDuelsSeen } from "feature/duels/hooks/useDuelsSeen";
import { duelErrorCode } from "feature/duels/services/duels.service";
import type { DuelJoinResult } from "feature/duels/types/duel.types";
import { DUEL_MAX_OPEN } from "feature/duels/utils/duelRules";
import type { DuelsTab } from "feature/duels/utils/duelScreens";
import {
  buildDuelSlots,
  parseDuelsTab,
  unseenResult,
} from "feature/duels/utils/duelScreens";
import {
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

const queryParam = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : null;

/**
 * The duels page, split the Duolingo way — one thing per screen:
 *
 * - Home: the app's page banner carrying the rating, then three tabs. "Duels"
 *   is three slot tiles with one key each and the last few results; "Ranking"
 *   and "History" hold the rest.
 * - `?duel=<id>`: one running duel on its own screen (a lesson start).
 * - `?result=<id>`: a settled duel's result screen (a lesson end). A result the
 *   player hasn't seen yet is offered by a banner on Home.
 * - The first visit, before any duel, gets three intro screens instead.
 *
 * Screens live in the URL, so the phone's back button walks back through them
 * and a notification's `?duel=` link lands on the right one.
 */
export const DuelsView = () => {
  const { t } = useTranslation("duels");
  const router = useRouter();
  const uid = useAppSelector(selectUserAuth) ?? null;
  const myName = useAppSelector(selectUserName) ?? "";
  const myAvatar = useAppSelector(selectUserAvatar) ?? "";
  const now = useNow();
  const {
    data: overview,
    isLoading,
    isError,
    isFetching,
  } = useDuelOverview(uid);
  const { seen, markResultSeen, markOnboarded } = useDuelsSeen();
  const join = useJoinDuel(uid);
  const cancel = useCancelDuelTicket(uid);

  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [rulesView, setRulesView] = useState<DuelRulesView | null>(null);
  const [lastJoin, setLastJoin] = useState<DuelJoinResult | null>(null);

  const tab = parseDuelsTab(router.query.tab);
  const duelParam = queryParam(router.query.duel);
  const resultParam = queryParam(router.query.result);

  const go = (query: Record<string, string>, replace = false) => {
    const url = { pathname: "/duels", query };
    if (replace) router.replace(url, undefined, { shallow: true });
    else router.push(url, undefined, { shallow: true });
  };
  const setTab = (next: DuelsTab) =>
    go(next === "duels" ? {} : { tab: next }, true);

  const active = overview?.active ?? [];
  const recent = overview?.recent ?? [];
  // A notification's ?duel= link points at a duel that may have settled since — then it's a result.
  const openDuel = duelParam
    ? (active.find((duel) => duel.id === duelParam) ?? null)
    : null;
  const resultId = resultParam ?? (openDuel ? null : duelParam);
  const resultDuel = resultId
    ? (recent.find((duel) => duel.id === resultId) ?? null)
    : null;
  const pending = seen && overview ? unseenResult(recent, seen) : null;

  // Shown once is seen — the banner won't offer it again.
  const shownResultId = resultDuel?.id;
  useEffect(() => {
    if (shownResultId) markResultSeen(shownResultId);
  }, [shownResultId, markResultSeen]);

  const showOnboarding =
    !!overview &&
    !!seen &&
    !seen.onboarded &&
    !duelParam &&
    !resultParam &&
    overview.played === 0 &&
    overview.active.length === 0 &&
    overview.tickets.length === 0;

  const slots = overview ? buildDuelSlots(overview, DUEL_MAX_OPEN) : [];
  const used = slots.filter((slot) => slot.kind !== "free").length;
  const isFull = !!overview && used >= DUEL_MAX_OPEN;

  const joinErrorCode = join.isError ? duelErrorCode(join.error) : null;
  const joinErrorText =
    joinErrorCode === "LIMIT"
      ? t("queue.error_limit", { max: DUEL_MAX_OPEN })
      : join.isError
        ? t("queue.error")
        : null;

  const openJoin = () => {
    join.reset();
    setIsJoinOpen(true);
  };
  const confirmJoin = () =>
    join.mutate(undefined, {
      onSuccess: (result) => {
        setIsJoinOpen(false);
        setLastJoin(result);
        // Paired on the spot: straight to the duel, like starting a lesson.
        if (result.kind === "matched") go({ duel: result.duelId });
      },
    });

  const status = lastJoin
    ? lastJoin.kind === "matched"
      ? t("queue.matched")
      : t("queue.queued")
    : "";

  const dialogs = (
    <>
      <DuelJoinDialog
        open={isJoinOpen}
        onOpenChange={setIsJoinOpen}
        waitingOthers={overview?.waitingOthers ?? 0}
        onConfirm={confirmJoin}
        isJoining={join.isPending}
        errorText={joinErrorText}
      />
      <DuelRulesDialog
        view={rulesView}
        onViewChange={setRulesView}
        rating={overview?.rating ?? 0}
      />
      <p className='sr-only' role='status'>
        {status}
      </p>
    </>
  );

  const shell = (content: ReactNode) => (
    <div className='flex min-h-screen flex-col px-4 pb-16 pt-6 md:px-8 lg:px-10'>
      {content}
      {dialogs}
    </div>
  );

  // ── Focused screens: no tabs, nothing else on the page ──

  if (openDuel) {
    return shell(
      <DuelScreen
        uid={uid}
        duel={openDuel}
        now={now}
        myName={myName}
        myAvatar={myAvatar}
        onSettledEarly={(duelId) => go({ result: duelId }, true)}
      />,
    );
  }

  if (resultDuel && overview) {
    return shell(
      <DuelResultScreen
        duel={resultDuel}
        overview={overview}
        onContinue={() => go(tab === "history" ? { tab } : {}, true)}
      />,
    );
  }

  // Settled a moment ago (both pressed Ready): wait for the refetch to bring it in.
  if (resultId && (isLoading || isFetching)) {
    return shell(
      <div className='mx-auto flex w-full max-w-md flex-col items-center gap-6 py-10'>
        <Skeleton className='size-28 rounded-full' />
        <Skeleton className='h-10 w-48 rounded-lg' />
        <Skeleton className='h-24 w-full rounded-2xl' />
      </div>,
    );
  }

  if (showOnboarding) {
    return shell(<DuelOnboarding onDone={markOnboarded} />);
  }

  // ── Home ──

  return (
    <div className='flex min-h-screen flex-col'>
      <HeroBanner
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        backgroundContent={<HeroPattern />}
        className='w-full !rounded-none !shadow-none'
        rightContent={
          <DuelStatsStrip
            overview={overview}
            onEloClick={() => setRulesView("elo")}
          />
        }
      />

      {/* Horizontal padding matches the banner's, so the tabs and the tiles
          line up with the title above them. */}
      <div className='flex flex-col gap-6 px-6 pb-16 pt-6 md:px-8 lg:px-10'>
        <Tabs
          value={tab}
          onValueChange={(next) => setTab(next as DuelsTab)}
          className='space-y-8'>
          <TabsList className={tabNavListClass}>
            <TabsTrigger value='duels' className={tabNavTriggerClass}>
              {t("tabs.duels")}
            </TabsTrigger>
            <TabsTrigger value='ranking' className={tabNavTriggerClass}>
              {t("tabs.ranking")}
            </TabsTrigger>
            <TabsTrigger value='history' className={tabNavTriggerClass}>
              {t("tabs.history")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='duels' className='mt-0'>
            <div className='grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]'>
              <div className='flex min-w-0 flex-col gap-6'>
                {isError && (
                  <p className='px-1 text-sm text-zinc-400'>{t("error")}</p>
                )}

                {pending && (
                  <div className='flex items-center gap-4 rounded-2xl bg-emerald-500/10 p-4 sm:px-5'>
                    <Kostek mood='idle' className='h-11 shrink-0' />
                    <div className='min-w-0 flex-1'>
                      <p className='font-semibold text-zinc-50'>
                        {t("pending.title")}
                      </p>
                      <p className='truncate text-sm text-zinc-400'>
                        {t("pending.vs", {
                          name: pending.opponent.revealed
                            ? pending.opponent.displayName
                            : t("active.anonymous"),
                          exercise:
                            getDuelExercise(pending.exerciseId)?.title ??
                            pending.exerciseId,
                        })}
                      </p>
                    </div>
                    <Button
                      onClick={() => go({ result: pending.id })}
                      className='h-10 shrink-0 border-b-zinc-400 bg-white px-5 text-zinc-950 hover:bg-zinc-200'>
                      {t("pending.open")}
                    </Button>
                  </div>
                )}

                <section className='flex flex-col gap-4'>
                  <div className='flex items-baseline justify-between gap-3 px-1'>
                    <h2 className='text-base font-semibold text-zinc-100 lg:text-lg'>
                      {t("slots.title")}
                    </h2>
                    {overview && (
                      <span className='text-sm tabular-nums text-zinc-500'>
                        {t("slots.used", { used, max: DUEL_MAX_OPEN })}
                      </span>
                    )}
                  </div>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5'>
                    {overview
                      ? slots.map((slot, i) => (
                          <DuelSlotTile
                            key={
                              slot.kind === "active"
                                ? slot.duel.id
                                : slot.kind === "searching"
                                  ? slot.ticketId
                                  : `free-${i}`
                            }
                            slot={slot}
                            now={now}
                            waitingOthers={overview.waitingOthers}
                            onJoin={openJoin}
                            joinDisabled={isFull || join.isPending}
                            onCancel={(ticketId) => cancel.mutate(ticketId)}
                            isCancelling={cancel.isPending}
                          />
                        ))
                      : Array.from({ length: DUEL_MAX_OPEN }, (_, i) => (
                          <Skeleton
                            key={i}
                            className='h-[15.5rem] rounded-2xl lg:h-[19rem]'
                          />
                        ))}
                  </div>
                </section>

                <LatestDuels feed={overview?.feed ?? []} ownDuels={recent} />

                <Button
                  variant='ghost'
                  size='lg'
                  className='h-11 w-full xl:hidden'
                  onClick={() => setRulesView("rules")}>
                  {t("rules_short.open")}
                </Button>
              </div>

              <aside className='hidden min-w-0 flex-col gap-6 xl:flex'>
                {overview ? (
                  <DuelRankPeek
                    overview={overview}
                    uid={uid}
                    myName={myName}
                    myAvatar={myAvatar}
                    onOpenRanking={() => setTab("ranking")}
                  />
                ) : (
                  <Skeleton className='h-60 w-full rounded-2xl' />
                )}
                <section className='flex flex-col gap-4 rounded-2xl bg-zinc-900/60 p-5'>
                  <div className='flex items-center gap-4'>
                    <Kostek mood='duel' className='h-14 shrink-0' />
                    <div className='min-w-0'>
                      <p className='font-semibold text-zinc-100'>
                        {t("rules_short.first_time")}
                      </p>
                      <p className='text-sm text-zinc-400'>
                        {t("rules_short.first_time_body")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    className='h-10 w-full'
                    onClick={() => setRulesView("rules")}>
                    {t("rules_short.open")}
                  </Button>
                </section>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value='ranking' className='mt-0'>
            {overview ? (
              <DuelRanking
                overview={overview}
                uid={uid}
                myName={myName}
                myAvatar={myAvatar}
              />
            ) : (
              <Skeleton className='h-80 w-full max-w-2xl rounded-2xl' />
            )}
          </TabsContent>

          <TabsContent value='history' className='mt-0'>
            {overview ? (
              <RecentDuels duels={recent} />
            ) : (
              <Skeleton className='h-80 w-full max-w-2xl rounded-2xl' />
            )}
          </TabsContent>
        </Tabs>
      </div>
      {dialogs}
    </div>
  );
};
