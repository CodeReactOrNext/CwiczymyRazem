import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_TABS } from "constants/navTabs";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { selectUserAuth } from "feature/user/store/userSlice";
import { AnimatePresence } from "framer-motion";
import { Dumbbell, Music, Plus, Target } from "lucide-react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

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

const LEVEL_DOT: Record<FreshnessLevel, string> = {
  rusty: "bg-orange-400",
  cooling: "bg-zinc-300",
  fresh: "bg-emerald-400",
};

type SessionSource = "stalest" | "row" | "draw";

/** Three blank cards for the empty state, one per kind of thing that goes in. */
const EMPTY_HAND = [
  { Icon: Music, className: "-rotate-[10deg] translate-x-5 translate-y-2" },
  { Icon: Dumbbell, className: "z-10" },
  { Icon: Target, className: "rotate-[10deg] -translate-x-5 translate-y-2" },
];

/**
 * The Rotation panel: what the player chose to keep in their hands, stalest
 * first, and a short session with any of it one tap away. The session runs in
 * place, like Auto Plan, and comes back here once the report is filed — where
 * the list has re-sorted on the stamps that report left.
 */
export const RotationView = () => {
  const router = useRouter();
  const uid = useAppSelector(selectUserAuth);
  const { describe, t } = useRotationDisplay();
  const { items, lastPracticed, isLoading, addItem, removeItem, markDone } =
    useRotation(uid);

  const [now] = useState(() => Date.now());
  const [dialog, setDialog] = useState<"add" | "draw" | null>(null);
  const [activePlan, setActivePlan] = useState<ExercisePlan | null>(null);
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
  const stalestPlan = useMemo(
    () =>
      buildRotationPlan(
        playable.slice(0, STALEST_SESSION_SIZE).map((entry) => entry.item),
        exercisesAgregat,
        lastPracticed,
        now,
      ),
    [playable, lastPracticed, now],
  );

  const startSession = (plan: ExercisePlan | null, source: SessionSource) => {
    if (!plan) {
      toast.error(t("toast.nothing_to_play"));
      return;
    }
    posthog.capture("rotation_session_started", {
      source,
      items: plan.exercises.length,
    });
    setDialog(null);
    setActivePlan(plan);
  };

  const playItems = (picked: RotationItem[], source: SessionSource) =>
    startSession(
      buildRotationPlan(picked, exercisesAgregat, lastPracticed, now),
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

  if (activePlan) {
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
        />
      </MainContainer>
    );
  }

  return (
    <div className='flex min-h-screen flex-col overflow-visible rounded-lg bg-second-600'>
      <HeroBanner
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        eyebrow={t("page.eyebrow")}
        eyebrowClassName='text-orange-400/80'
        backgroundContent={<HeroPattern withShuffle />}
        className='mb-6 min-h-[100px] w-full !rounded-none !shadow-none md:min-h-[90px] lg:min-h-[100px]'
      />

      <div className='px-3 md:px-6 lg:px-8'>
        <PageTabs
          tabs={LIBRARY_TABS}
          activeHref='/rotation'
          ariaLabel='Library sections'
        />
      </div>

      <div className='space-y-12 px-3 py-6 md:px-6 md:py-8 lg:px-8'>
        {isLoading ? (
          <div className='space-y-4' aria-busy>
            <div className='h-44 animate-pulse rounded-lg bg-zinc-900/40' />
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className='h-[4.5rem] animate-pulse rounded-lg bg-zinc-900/40'
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className='flex flex-col items-center rounded-lg bg-zinc-900/40 px-6 py-16 text-center sm:py-20'>
            <div className='flex' aria-hidden>
              {EMPTY_HAND.map(({ Icon, className }, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex h-24 w-[4.5rem] items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 ring-4 ring-zinc-950",
                    className,
                  )}>
                  <Icon className='h-6 w-6' />
                </div>
              ))}
            </div>
            <p className='mt-10 text-lg font-semibold text-zinc-100'>
              {t("empty.title")}
            </p>
            <p className='mt-3 max-w-md text-sm leading-relaxed text-zinc-400'>
              {t("empty.body")}
            </p>
            <Button
              onClick={() => setDialog("add")}
              className='mt-10 h-12 rounded-lg bg-white px-7 font-bold text-black focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200'>
              <span className='flex items-center gap-2.5'>
                <Plus className='h-4 w-4' />
                {t("empty.cta")}
              </span>
            </Button>
          </div>
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
                <h2 className='flex items-baseline gap-3 text-base font-semibold text-zinc-100'>
                  {t("list_title")}
                  <span className='text-sm font-normal tabular-nums text-zinc-500'>
                    {entries.length}
                  </span>
                </h2>
                <Button
                  onClick={() => setDialog("add")}
                  className='h-10 rounded-lg bg-zinc-800 px-5 font-semibold text-zinc-100 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700'>
                  <span className='flex items-center gap-2'>
                    <Plus className='h-4 w-4' />
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
    </div>
  );
};
