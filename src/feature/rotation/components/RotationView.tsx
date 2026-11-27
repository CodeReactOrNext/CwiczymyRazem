import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import MainContainer from "components/MainContainer";
import { PAGE_CONTENT, PAGE_GUTTER, PageShell } from "components/PageShell/PageShell";
import { PageTabs } from "components/PageTabs/PageTabs";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_HERO_CLASS, LIBRARY_TABS } from "constants/navTabs";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { useSessionEntryGate } from "feature/sessionEntry/useSessionEntryGate";
import { useSongDurations } from "feature/songs/hooks/useSongDurations";
import { selectUserAuth } from "feature/user/store/userSlice";
import { updateQuestProgress } from "feature/user/store/userSlice.questActions";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";

import { rotationTimerHref } from "../hooks/useCustomRotationItem";
import { useRotation } from "../hooks/useRotation";
import { useRotationDisplay } from "../hooks/useRotationDisplay";
import type {
  FreshnessLevel,
  RotationEntry,
  RotationItem,
} from "../types/rotation.types";
import {
  buildRotationPlan,
  FRESHNESS_LEVELS,
  groupByLevel,
  isSessionPlayable,
  planMinutes,
  rotationKey,
  STALEST_SESSION_SIZE,
  toRotationEntries,
} from "../utils/rotation.utils";
import { AddToRotationDialog } from "./AddToRotationDialog";
import { DrawCardDialog } from "./DrawCardDialog";
import { RotationRow } from "./RotationRow";
import { RotationSpotlight } from "./RotationSpotlight";
import { StartSessionDialog } from "./StartSessionDialog";

const LEVEL_DOT: Record<FreshnessLevel, string> = {
  rusty: "bg-orange-400",
  cooling: "bg-zinc-300",
  fresh: "bg-emerald-400",
};

type SessionSource = "stalest" | "row" | "draw";

/**
 * The Rotation panel: what the player chose to keep in their hands, stalest
 * first, and a short session with any of it one tap away. The session runs in
 * place, like Auto Plan, and comes back here once the report is filed — where
 * the list has re-sorted on the stamps that report left.
 */
export const RotationView = () => {
  const router = useRouter();
  const uid = useAppSelector(selectUserAuth);
  const dispatch = useAppDispatch();
  const { describe, t } = useRotationDisplay();
  const { items, lastPracticed, isLoading, addItem, removeItem, markDone } =
    useRotation(uid);

  const [now] = useState(() => Date.now());
  const [dialog, setDialog] = useState<"add" | "draw" | null>(null);
  const [activePlan, setActivePlan] = useState<ExercisePlan | null>(null);
  // A session picked but not yet started: the player still chooses its timer.
  const [pending, setPending] = useState<{
    plan: ExercisePlan;
    source: SessionSource;
  } | null>(null);
  const [openTimer, setOpenTimer] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    posthog.capture("rotation_viewed");
  }, []);

  const entries = useMemo(
    () => toRotationEntries(items, lastPracticed, now),
    [items, lastPracticed, now],
  );
  const groups = useMemo(() => groupByLevel(entries), [entries]);
  const levels = FRESHNESS_LEVELS.filter((level) => groups[level].length > 0);
  // Untimed custom items are ticked off, never played in a session, so the
  // hand and the bundle are dealt from the rest.
  const playable = useMemo(
    () => entries.filter((entry) => isSessionPlayable(entry.item)),
    [entries],
  );
  const nextUp = playable.slice(0, STALEST_SESSION_SIZE);
  // Each song's slot fits its length; until the lengths arrive (or for a song
  // Spotify doesn't know) it gets the default slot.
  const songIds = useMemo(
    () => items.filter((item) => item.type === "song").map((item) => item.id),
    [items],
  );
  const songDurations = useSongDurations(songIds);
  const stalestPlan = useMemo(
    () =>
      buildRotationPlan(
        playable.slice(0, STALEST_SESSION_SIZE).map((entry) => entry.item),
        exercisesAgregat,
        lastPracticed,
        now,
        Math.random,
        songDurations,
      ),
    [playable, lastPracticed, now, songDurations],
  );

  const startSession = (plan: ExercisePlan | null, source: SessionSource) => {
    if (!plan) {
      toast.error(t("toast.nothing_to_play"));
      return;
    }
    setDialog(null);
    setPending({ plan, source });
  };

  /** The timer chosen: on the clock, or counting up until the player finishes. */
  const beginSession = (open: boolean) => {
    if (!pending) return;
    posthog.capture("rotation_session_started", {
      source: pending.source,
      items: pending.plan.exercises.length,
      timer: open ? "open" : "set",
    });
    setOpenTimer(open);
    setActivePlan(pending.plan);
    setPending(null);
  };

  const playItems = (picked: RotationItem[], source: SessionSource) =>
    startSession(
      buildRotationPlan(
        picked,
        exercisesAgregat,
        lastPracticed,
        now,
        Math.random,
        songDurations,
      ),
      source,
    );

  /**
   * One item's own action: a custom item opens the Free Timer (which carries
   * it to the report), or is ticked off when it has no timer; anything else
   * starts a session with just it.
   */
  const playEntry = async ({ item }: RotationEntry, source: SessionSource) => {
    if (item.type !== "custom") {
      playItems([item], source);
      return;
    }
    if (item.timer) {
      posthog.capture("rotation_custom_timer_opened", { source });
      void router.push(rotationTimerHref(item.id));
      return;
    }
    setDialog(null);
    try {
      await markDone(item.id);
      dispatch(updateQuestProgress({ type: "rotation_item" }));
      posthog.capture("rotation_custom_done", { source });
      toast.success(t("toast.done", { title: describe(item).title }));
    } catch {
      toast.error(t("toast.error"));
    }
  };

  const handleAdd = async (item: Omit<RotationItem, "addedAt">) => {
    const added = await addItem(item);
    if (added) posthog.capture("rotation_item_added", { type: item.type });
    return added;
  };

  const handleRemove = async (entry: RotationEntry) => {
    const { item } = entry;
    try {
      await removeItem(item);
      toast(t("toast.removed", { title: describe(item).title }), {
        action: {
          label: t("toast.undo"),
          onClick: () => void addItem(item),
        },
      });
    } catch {
      toast.error(t("toast.error"));
    }
  };

  const sessionOpen = useSessionEntryGate(!!activePlan);

  if (activePlan && sessionOpen) {
    return (
      <MainContainer>
        <PracticeSession
          plan={activePlan}
          onClose={() => setActivePlan(null)}
          onFinish={() => {
            setIsFinishing(true);
            router.push("/report?returnTo=/rotation");
          }}
          isFinishing={isFinishing}
          freeMode={openTimer}
        />
      </MainContainer>
    );
  }

  return (
    <PageShell>
      <HeroBanner
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        eyebrow={t("page.eyebrow")}
        className={LIBRARY_HERO_CLASS}
        backgroundContent={<HeroPattern withShuffle />}
      />

      <div className={cn(PAGE_GUTTER, "pt-6")}>
        <PageTabs
          tabs={LIBRARY_TABS}
          activeHref='/rotation'
          ariaLabel='Library sections'
        />
      </div>

      <div className={cn("space-y-12", PAGE_CONTENT)}>
        {isLoading ? (
          <div className='space-y-4' aria-busy>
            <Skeleton variant='block' className='h-44' />
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} variant='block' className='h-[4.5rem]' />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            title={t("empty.title")}
            description={t("empty.body")}
            action={
              <Button size='lg' onClick={() => setDialog("add")}>
                <Plus />
                {t("empty.cta")}
              </Button>
            }
          />
        ) : (
          <>
            <RotationSpotlight
              nextUp={nextUp}
              rustyCount={groups.rusty.length}
              minutes={stalestPlan ? planMinutes(stalestPlan) : 0}
              onPlayStalest={() => startSession(stalestPlan, "stalest")}
              onDraw={() => setDialog("draw")}
              isStarting={!!activePlan}
            />

            <section className='space-y-8'>
              <div className='flex items-center justify-between gap-4'>
                <SectionHeader
                  title={t("list_title")}
                  count={entries.length}
                  className='mb-0'
                />
                <Button
                  variant='secondary'
                  size='lg'
                  onClick={() => setDialog("add")}>
                  <span className='flex items-center gap-2'>
                    <Plus />
                    {t("add")}
                  </span>
                </Button>
              </div>

              {levels.map((level) => (
                <div key={level} className='space-y-5'>
                  {/* With everything in one group the heading would only
                        repeat the list title, so it shows once there are two. */}
                  {levels.length > 1 && (
                    <div className='flex items-center gap-3'>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          LEVEL_DOT[level],
                        )}
                      />
                      <h3 className='text-sm font-medium text-zinc-200'>
                        {t(`levels.${level}`)}
                      </h3>
                      <span className='text-xs tabular-nums text-zinc-500'>
                        {groups[level].length}
                      </span>
                    </div>
                  )}
                  <ul className='space-y-3'>
                    <AnimatePresence initial={false}>
                      {groups[level].map((entry) => (
                        <RotationRow
                          key={rotationKey(entry.item)}
                          entry={entry}
                          onPlay={() => playEntry(entry, "row")}
                          onRemove={() => handleRemove(entry)}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              ))}
            </section>
          </>
        )}
      </div>

      {dialog === "add" && uid && (
        <AddToRotationDialog
          uid={uid}
          items={items}
          onAdd={handleAdd}
          onRemove={removeItem}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "draw" && (
        <DrawCardDialog
          entries={entries}
          onPlay={(entry) => playEntry(entry, "draw")}
          onClose={() => setDialog(null)}
          isStarting={!!activePlan}
        />
      )}
      {pending && (
        <StartSessionDialog
          minutes={planMinutes(pending.plan)}
          onStart={beginSession}
          onClose={() => setPending(null)}
        />
      )}
    </PageShell>
  );
};
