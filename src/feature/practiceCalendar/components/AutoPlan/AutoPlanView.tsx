import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { Switch } from "assets/components/ui/switch";
import { cn } from "assets/lib/utils";
import { PageTabs } from "components/PageTabs/PageTabs";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { LIBRARY_TABS } from "constants/navTabs";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { selectUserAuth } from "feature/user/store/userSlice";
import { ArrowLeft, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

import { useCalendar } from "../../hooks/useCalendar";
import { useCalendarDisplay } from "../../hooks/useCalendarDisplay";
import type { PlannerSources } from "../../hooks/usePlannerSources";
import { usePlannerSources } from "../../hooks/usePlannerSources";
import type {
  CalendarDays,
  PlannerPrefs,
  PlannerSourcesToggle,
  PracticeArea,
} from "../../types/calendar.types";
import { PLAYER_LEVELS, PRACTICE_AREAS } from "../../types/calendar.types";
import { AREA_DOT } from "../../utils/areaStyles";
import { toDateKey } from "../../utils/calendarDates";
import { isItemDone } from "../../utils/calendarItems";
import {
  DEFAULT_PLANNER_PREFS,
  MAX_ITEMS_PER_DAY,
  MAX_MINUTES_PER_DAY,
  MIN_ITEMS_PER_DAY,
  MIN_MINUTES_PER_DAY,
  planDays,
} from "../../utils/planner";
import type { PlanRange } from "../../utils/planRange";
import { isPlanRange, PLAN_RANGES, rangeDates } from "../../utils/planRange";
import { Field, Segmented, Stepper } from "../PlannerControls";
import { PlanPreview } from "../PlanPreview";
import { PlanSection } from "./PlanSection";
import { SkillPicker } from "./SkillPicker";
import { WeekdayMinutes } from "./WeekdayMinutes";

const QUICK_MINUTES = [15, 30, 45, 60, 90, 120];

interface AutoPlannerProps {
  today: string;
  initialPrefs: PlannerPrefs;
  initialRange: PlanRange;
  sources: PlannerSources;
  existing: CalendarDays;
  onApply: (
    days: CalendarDays,
    prefs: PlannerPrefs,
    range: PlanRange,
  ) => Promise<void>;
}

/** The form and its live preview, mounted once the saved settings are in. */
const AutoPlanner = ({
  today,
  initialPrefs,
  initialRange,
  sources,
  existing,
  onApply,
}: AutoPlannerProps) => {
  const { formatDate, formatMinutes, t } = useCalendarDisplay();
  const [prefs, setPrefs] = useState<PlannerPrefs>(initialPrefs);
  const [range, setRange] = useState<PlanRange>(initialRange);
  const [advanced, setAdvanced] = useState(
    () => initialPrefs.skills.length > 0,
  );
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [now] = useState(() => Date.now());
  const [isSaving, setIsSaving] = useState(false);

  const patch = (change: Partial<PlannerPrefs>) =>
    setPrefs((current) => ({ ...current, ...change }));
  const toggleSource = (key: keyof PlannerSourcesToggle) =>
    patch({ sources: { ...prefs.sources, [key]: !prefs.sources[key] } });
  const toggleFocus = (area: PracticeArea) =>
    patch({
      focus: prefs.focus.includes(area)
        ? prefs.focus.filter((candidate) => candidate !== area)
        : [...prefs.focus, area],
    });

  const dates = useMemo(() => rangeDates(range, today), [range, today]);
  const { songs, goals, roadmapSteps, lastPracticed } = sources;
  const result = useMemo(
    () =>
      planDays({
        dates,
        prefs,
        catalog: exercisesAgregat,
        songs,
        goals,
        roadmapSteps,
        lastPracticed,
        now,
        existing,
        seed,
      }),
    [
      dates,
      prefs,
      songs,
      goals,
      roadmapSteps,
      lastPracticed,
      now,
      existing,
      seed,
    ],
  );

  const dayCount = dates.filter(
    (date) => (result.days[date] ?? []).length > 0,
  ).length;

  const apply = async () => {
    setIsSaving(true);
    try {
      await onApply(result.days, prefs, range);
    } finally {
      setIsSaving(false);
    }
  };

  const learning = songs.filter((entry) => entry.status === "learning").length;
  const wishlist = songs.length - learning;
  const sourceRows: {
    key: keyof PlannerSourcesToggle;
    label: string;
    detail: string | null;
    empty: string;
    href: string;
  }[] = [
    {
      key: "songs",
      label: t("planner.sources.songs"),
      detail:
        songs.length > 0
          ? [
              learning > 0 &&
                t("planner.sources.songs_learning", { count: learning }),
              wishlist > 0 &&
                t("planner.sources.songs_wishlist", { count: wishlist }),
            ]
              .filter(Boolean)
              .join(" · ")
          : null,
      empty: t("planner.sources.songs_empty"),
      href: "/songs",
    },
    {
      key: "goals",
      label: t("planner.sources.goals"),
      detail:
        goals.length > 0
          ? goals
              .slice(0, 2)
              .map((goal) => `${goal.title} · ${goal.bpm} BPM`)
              .join(", ") + (goals.length > 2 ? ` +${goals.length - 2}` : "")
          : null,
      empty: t("planner.sources.goals_empty"),
      href: "/goals",
    },
    {
      key: "roadmaps",
      label: t("planner.sources.roadmaps"),
      detail:
        roadmapSteps.length > 0
          ? roadmapSteps
              .slice(0, 2)
              .map((step) => `${step.roadmapTitle}: ${step.title}`)
              .join(", ")
          : null,
      empty: t("planner.sources.roadmaps_empty"),
      href: "/ai-coach",
    },
  ];

  const advancedCount = [
    Object.keys(prefs.minutesByWeekday).length > 0,
    prefs.skills.length > 0,
    prefs.variety !== DEFAULT_PLANNER_PREFS.variety,
    prefs.intensity !== DEFAULT_PLANNER_PREFS.intensity,
    prefs.maxItemsPerDay !== DEFAULT_PLANNER_PREFS.maxItemsPerDay,
    prefs.warmup !== DEFAULT_PLANNER_PREFS.warmup,
    prefs.lightDay !== DEFAULT_PLANNER_PREFS.lightDay,
    prefs.keepManual !== DEFAULT_PLANNER_PREFS.keepManual,
  ].filter(Boolean).length;

  const applyButton = (className?: string) => (
    <Button
      onClick={apply}
      disabled={isSaving || result.totalMinutes === 0}
      className={cn(
        "h-12 rounded-lg border-b-black/25 bg-white px-6 font-bold text-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200",
        className,
      )}>
      <Sparkles className='h-4 w-4' />
      {t("planner.apply", { count: dayCount })}
    </Button>
  );

  return (
    <>
      <div className='grid items-start gap-4 px-3 pb-32 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:gap-8 lg:px-8 lg:pb-12'>
        <div className='space-y-4'>
          <PlanSection index={1} title={t("planner.range.label")}>
            <Segmented
              ariaLabel={t("planner.range.label")}
              value={range}
              onChange={setRange}
              options={PLAN_RANGES.map((value) => {
                const span = rangeDates(value, today);
                return {
                  value,
                  label: t(`planner.range.${value}`),
                  hint: `${formatDate(span[0], { day: "numeric", month: "short" })} – ${formatDate(span[span.length - 1], { day: "numeric", month: "short" })}`,
                };
              })}
            />
          </PlanSection>

          <PlanSection
            index={2}
            title={t("planner.minutes.label")}
            aside={
              <span className='text-2xl font-semibold tabular-nums text-zinc-100'>
                {formatMinutes(prefs.minutesPerDay)}
              </span>
            }>
            <div className='space-y-5'>
              <Slider
                value={[prefs.minutesPerDay]}
                min={MIN_MINUTES_PER_DAY}
                max={MAX_MINUTES_PER_DAY}
                step={5}
                onValueChange={([value]) => patch({ minutesPerDay: value })}
                aria-label={t("planner.minutes.label")}
                className='py-3 [&_[data-slot=slider-range]]:bg-zinc-100 [&_[data-slot=slider-track]]:bg-zinc-800 [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-zinc-100 lg:[&_[role=slider]]:h-5 lg:[&_[role=slider]]:w-5'
              />
              <div className='flex flex-wrap gap-2'>
                {QUICK_MINUTES.map((minutes) => (
                  <button
                    key={minutes}
                    type='button'
                    onClick={() => patch({ minutesPerDay: minutes })}
                    aria-pressed={prefs.minutesPerDay === minutes}
                    className={cn(
                      "h-9 rounded-lg px-3.5 text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                      prefs.minutesPerDay === minutes
                        ? "bg-zinc-700 text-zinc-100"
                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                    )}>
                    {formatMinutes(minutes)}
                  </button>
                ))}
              </div>
            </div>
          </PlanSection>

          <PlanSection index={3} title={t("planner.level.label")}>
            <div className='space-y-9'>
              <Segmented
                ariaLabel={t("planner.level.label")}
                value={prefs.level}
                onChange={(level) => patch({ level })}
                options={PLAYER_LEVELS.map((level) => ({
                  value: level,
                  label: t(`levels.${level}.name`),
                  hint: t(`levels.${level}.hint`),
                }))}
              />
              <Field
                label={t("planner.focus.label")}
                hint={t("planner.focus.hint")}>
                <div className='flex flex-wrap gap-2'>
                  {PRACTICE_AREAS.map((area) => {
                    const active = prefs.focus.includes(area);
                    const unavailable =
                      area === "songs" &&
                      (!prefs.sources.songs || songs.length === 0);
                    return (
                      <button
                        key={area}
                        type='button'
                        aria-pressed={active}
                        disabled={unavailable}
                        onClick={() => toggleFocus(area)}
                        className={cn(
                          "flex h-10 items-center gap-2.5 rounded-lg px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:opacity-40",
                          active
                            ? "bg-zinc-700 text-zinc-100"
                            : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                        )}>
                        <span
                          className={cn("h-2 w-2 rounded-full", AREA_DOT[area])}
                        />
                        {t(`areas.${area}`)}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </PlanSection>

          <PlanSection
            index={4}
            title={t("planner.sources.label")}
            hint={t("planner.sources.hint")}>
            <ul className='space-y-6'>
              {sourceRows.map((row) => {
                const hasAny = row.detail !== null;
                return (
                  <li key={row.key} className='flex items-center gap-5'>
                    <div className='min-w-0 flex-1'>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          hasAny ? "text-zinc-100" : "text-zinc-400",
                        )}>
                        {row.label}
                      </p>
                      {hasAny ? (
                        <p className='mt-1 truncate text-sm text-zinc-400'>
                          {row.detail}
                        </p>
                      ) : (
                        <Link
                          href={row.href}
                          className='mt-1 inline-block rounded text-sm text-zinc-500 underline decoration-zinc-700 underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:text-zinc-200'>
                          {row.empty}
                        </Link>
                      )}
                    </div>
                    <Switch
                      checked={hasAny && prefs.sources[row.key]}
                      disabled={!hasAny}
                      onChange={() => toggleSource(row.key)}
                      aria-label={row.label}
                    />
                  </li>
                );
              })}
            </ul>
          </PlanSection>

          <PlanSection
            index={5}
            title={t("planner.advanced.label")}
            hint={t("planner.advanced.hint")}
            aside={
              <button
                type='button'
                onClick={() => setAdvanced((open) => !open)}
                aria-expanded={advanced}
                className='flex h-9 shrink-0 items-center gap-2 rounded-lg bg-zinc-800 px-3 text-sm font-medium text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700'>
                {advancedCount > 0 && (
                  <span className='tabular-nums text-zinc-400'>
                    {advancedCount}
                  </span>
                )}
                {advanced
                  ? t("planner.advanced.hide")
                  : t("planner.advanced.show")}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-zinc-400 transition-transform",
                    advanced && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            }>
            {advanced && (
              <div className='space-y-12'>
                <Field
                  label={t("planner.skills.label")}
                  hint={t("planner.skills.hint")}
                  aside={
                    prefs.skills.length > 0 && (
                      <button
                        type='button'
                        onClick={() => patch({ skills: [] })}
                        className='h-8 shrink-0 rounded px-2.5 text-sm text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'>
                        {t("planner.skills.clear", {
                          count: prefs.skills.length,
                        })}
                      </button>
                    )
                  }>
                  <SkillPicker
                    value={prefs.skills}
                    onChange={(skills) => patch({ skills })}
                  />
                </Field>

                <Field
                  label={t("planner.weekdays.label")}
                  hint={t("planner.weekdays.hint")}>
                  <WeekdayMinutes
                    minutesPerDay={prefs.minutesPerDay}
                    value={prefs.minutesByWeekday}
                    onChange={(minutesByWeekday) => patch({ minutesByWeekday })}
                  />
                </Field>

                <div className='grid gap-12 xl:grid-cols-2 xl:gap-8'>
                  <Field label={t("planner.variety.label")}>
                    <Segmented
                      ariaLabel={t("planner.variety.label")}
                      value={prefs.variety}
                      onChange={(variety) => patch({ variety })}
                      options={(["steady", "balanced", "explore"] as const).map(
                        (value) => ({
                          value,
                          label: t(`planner.variety.${value}`),
                          hint: t(`planner.variety.${value}_hint`),
                        }),
                      )}
                    />
                  </Field>
                  <Field label={t("planner.intensity.label")}>
                    <Segmented
                      ariaLabel={t("planner.intensity.label")}
                      value={prefs.intensity}
                      onChange={(intensity) => patch({ intensity })}
                      options={(["light", "steady", "push"] as const).map(
                        (value) => ({
                          value,
                          label: t(`planner.intensity.${value}`),
                          hint: t(`planner.intensity.${value}_hint`),
                        }),
                      )}
                    />
                  </Field>
                </div>

                <ul className='space-y-7'>
                  <li className='flex items-center gap-5'>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium text-zinc-100'>
                        {t("planner.max_items.label")}
                      </p>
                      <p className='mt-1 text-sm text-zinc-400'>
                        {t("planner.max_items.hint")}
                      </p>
                    </div>
                    <Stepper
                      value={prefs.maxItemsPerDay}
                      min={MIN_ITEMS_PER_DAY}
                      max={MAX_ITEMS_PER_DAY}
                      onChange={(maxItemsPerDay) => patch({ maxItemsPerDay })}
                      label={t("planner.max_items.label")}
                    />
                  </li>
                  {(
                    [
                      ["warmup", prefs.warmup],
                      ["lightDay", prefs.lightDay],
                      ["keepManual", prefs.keepManual],
                    ] as const
                  ).map(([key, checked]) => (
                    <li key={key} className='flex items-center gap-5'>
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-medium text-zinc-100'>
                          {t(`planner.toggles.${key}`)}
                        </p>
                        <p className='mt-1 text-sm text-zinc-400'>
                          {t(`planner.toggles.${key}_hint`)}
                        </p>
                      </div>
                      <Switch
                        checked={checked}
                        onChange={() => patch({ [key]: !checked })}
                        aria-label={t(`planner.toggles.${key}`)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </PlanSection>
        </div>

        <aside className='rounded-lg bg-zinc-900/40 p-5 sm:p-7 lg:sticky lg:top-6'>
          <PlanPreview
            dates={dates}
            today={today}
            result={result}
            onReshuffle={() => setSeed((current) => current + 1)}
          />
          <div className='mt-10 space-y-4'>
            {/* On a phone the bar at the bottom carries it. */}
            {applyButton("hidden w-full lg:inline-flex")}
            <p className='text-center text-xs leading-relaxed text-zinc-500'>
              {prefs.keepManual
                ? t("planner.footer_keep")
                : t("planner.footer_replace")}
            </p>
          </div>
        </aside>
      </div>

      {/* On a phone the preview sits below the form, so the fill stays in reach. */}
      <div className='fixed inset-x-0 bottom-[var(--mobile-nav-height,0px)] z-30 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:hidden'>
        <div className='flex items-center gap-4'>
          <div className='min-w-0 flex-1'>
            <p className='text-base font-semibold tabular-nums text-zinc-100'>
              {formatMinutes(result.totalMinutes)}
            </p>
            <p className='truncate text-xs text-zinc-400'>
              {t("planner.summary.blocks", {
                count: dates.reduce(
                  (sum, date) => sum + (result.days[date] ?? []).length,
                  0,
                ),
              })}
            </p>
          </div>
          {applyButton("shrink-0")}
        </div>
      </div>
    </>
  );
};

/**
 * The auto-planner page: the days and the time, the level and what to lean
 * on, which of the player's songs, goals and roadmaps to draw from, and the
 * finer knobs — skills included — behind "Advanced". The plan is redrawn
 * live beside the form, and only written when the player fills the days.
 */
export const AutoPlanView = () => {
  const router = useRouter();
  const uid = useAppSelector(selectUserAuth);
  const { t } = useCalendarDisplay();
  const calendar = useCalendar(uid);
  const sources = usePlannerSources(uid);
  const [today] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    posthog.capture("calendar_autoplan_viewed");
  }, []);

  const queryRange = router.query.range;
  const initialRange: PlanRange = isPlanRange(queryRange)
    ? queryRange
    : "rest_of_week";
  const isReady = !calendar.isLoading && !sources.isLoading;

  // A slot played elsewhere today counts as done, so the plan keeps it.
  const existing = useMemo<CalendarDays>(
    () =>
      Object.fromEntries(
        Object.entries(calendar.days).map(([date, items]) => [
          date,
          items.map((item) => ({
            ...item,
            done: isItemDone(item, date, sources.practicedStamps),
          })),
        ]),
      ),
    [calendar.days, sources.practicedStamps],
  );

  const apply = async (
    days: CalendarDays,
    prefs: PlannerPrefs,
    range: PlanRange,
  ) => {
    try {
      await Promise.all([calendar.setDays(days), calendar.savePrefs(prefs)]);
      const filled = Object.values(days).filter(
        (items) => items.length > 0,
      ).length;
      posthog.capture("calendar_autoplan_applied", {
        range,
        days: filled,
        minutes_per_day: prefs.minutesPerDay,
        level: prefs.level,
        focus: prefs.focus,
        skills: prefs.skills.length,
        variety: prefs.variety,
        intensity: prefs.intensity,
      });
      toast.success(t("toast.planned", { count: filled }));
      const first = Object.keys(days).sort()[0];
      await router.push(first ? `/calendar?week=${first}` : "/calendar");
    } catch {
      toast.error(t("toast.error"));
    }
  };

  return (
    <div className='flex min-h-screen flex-col overflow-visible rounded-lg bg-second-600'>
      <HeroBanner
        title={t("planner.title")}
        subtitle={t("planner.subtitle")}
        eyebrow={t("page.title")}
        eyebrowClassName='text-cyan-400/80'
        backgroundContent={<HeroPattern />}
        className='mb-6 min-h-[100px] w-full !rounded-none !shadow-none md:min-h-[90px] lg:min-h-[100px]'
      />

      <div className='px-3 md:px-6 lg:px-8'>
        <PageTabs
          tabs={LIBRARY_TABS}
          activeHref='/calendar'
          ariaLabel='Library sections'
        />
      </div>

      <div className='px-3 pb-6 pt-6 md:px-6 md:pt-8 lg:px-8'>
        <Link
          href='/calendar'
          className='-ml-2 inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'>
          <ArrowLeft className='h-4 w-4' aria-hidden />
          {t("planner.back")}
        </Link>
      </div>

      {isReady ? (
        <AutoPlanner
          today={today}
          initialPrefs={calendar.prefs ?? DEFAULT_PLANNER_PREFS}
          initialRange={initialRange}
          sources={sources}
          existing={existing}
          onApply={apply}
        />
      ) : (
        <div
          className='grid items-start gap-6 px-3 pb-12 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:gap-8 lg:px-8'
          aria-busy>
          <div className='space-y-4'>
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className='h-40 animate-pulse rounded-lg bg-zinc-900/40'
              />
            ))}
          </div>
          <div className='h-[32rem] animate-pulse rounded-lg bg-zinc-900/40' />
        </div>
      )}
    </div>
  );
};
