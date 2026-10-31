import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { RotationThumb } from "feature/rotation/components/RotationThumb";
import { Check, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { CalendarItemDisplay } from "../hooks/useCalendarDisplay";
import { useCalendarDisplay } from "../hooks/useCalendarDisplay";
import type { PlannerSources } from "../hooks/usePlannerSources";
import type {
  CalendarItem,
  CalendarItemKind,
  PracticeArea,
} from "../types/calendar.types";
import { PRACTICE_AREAS } from "../types/calendar.types";
import { AREA_DOT } from "../utils/areaStyles";
import { newItemId } from "../utils/calendarItems";
import { categoryToArea } from "../utils/planner";
import { Stepper } from "./PlannerControls";

type Tab = "exercise" | "song" | "goal" | "roadmap" | "custom";
const TABS: Tab[] = ["exercise", "song", "goal", "roadmap", "custom"];

const DEFAULT_MINUTES: Record<Tab, number> = {
  exercise: 10,
  song: 10,
  goal: 10,
  roadmap: 10,
  custom: 15,
};

const MAX_LISTED = 60;

type Draft = Omit<CalendarItem, "id" | "minutes" | "auto" | "done" | "role">;

interface AddItemDialogProps {
  dateLabel: string;
  sources: PlannerSources;
  onAdd: (item: CalendarItem) => Promise<unknown>;
  onClose: () => void;
}

interface CandidateRowProps {
  display: CalendarItemDisplay;
  area: PracticeArea;
  isAdded: boolean;
  label: string;
  onAdd: () => void;
}

const CandidateRow = ({
  display,
  area,
  isAdded,
  label,
  onAdd,
}: CandidateRowProps) => (
  <li>
    <button
      type='button'
      onClick={onAdd}
      aria-label={label}
      className='flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800/70'>
      <RotationThumb
        display={display}
        className='h-10 w-10'
        iconClassName='h-4 w-4'
      />
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-medium text-zinc-100'>
          {display.title}
        </span>
        <span className='mt-0.5 flex items-center gap-2 truncate text-xs text-zinc-400'>
          <span
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", AREA_DOT[area])}
          />
          <span className='truncate'>{display.subtitle}</span>
        </span>
      </span>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          isAdded
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-zinc-800 text-zinc-300",
        )}>
        {isAdded ? <Check className='h-4 w-4' /> : <Plus className='h-4 w-4' />}
      </span>
    </button>
  </li>
);

/**
 * Puts something on one day by hand: an exercise from the catalog, a song
 * being learned, an open goal, the next roadmap step, or anything of the
 * player's own. Each tap adds one slot at the length set on top; the dialog
 * stays open for the next.
 */
export const AddItemDialog = ({
  dateLabel,
  sources,
  onAdd,
  onClose,
}: AddItemDialogProps) => {
  const { describe, formatMinutes, t } = useCalendarDisplay();
  const [tab, setTab] = useState<Tab>("exercise");
  const [search, setSearch] = useState("");
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES.exercise);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [customTitle, setCustomTitle] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [customArea, setCustomArea] = useState<PracticeArea>("creativity");

  const candidates = useMemo<{ key: string; draft: Draft }[]>(() => {
    if (tab === "exercise") {
      return exercisesAgregat
        .filter((exercise) => !exercise.songData)
        .map((exercise) => ({
          key: `exercise:${exercise.id}`,
          draft: {
            kind: "exercise",
            area: categoryToArea(exercise.category),
            exerciseId: exercise.id,
          },
        }));
    }
    if (tab === "song") {
      return sources.songs.map(({ song }) => ({
        key: `song:${song.id}`,
        draft: { kind: "song", area: "songs", song },
      }));
    }
    if (tab === "goal") {
      return sources.goals.map((goal) => {
        const exercise = exercisesAgregat.find(
          (candidate) => candidate.id === goal.exerciseId,
        );
        return {
          key: `goal:${goal.goalId}`,
          draft: {
            kind: "goal",
            area: exercise ? categoryToArea(exercise.category) : "technique",
            exerciseId: goal.exerciseId,
            goalId: goal.goalId,
            bpm: goal.bpm,
            title: goal.title,
          },
        };
      });
    }
    if (tab === "roadmap") {
      return sources.roadmapSteps.map((step) => {
        const exercise = step.exerciseId
          ? exercisesAgregat.find(
              (candidate) => candidate.id === step.exerciseId,
            )
          : undefined;
        return {
          key: `roadmap:${step.roadmapId}:${step.stepId}`,
          draft: {
            kind: "roadmap",
            area: step.song
              ? "songs"
              : exercise
                ? categoryToArea(exercise.category)
                : "technique",
            roadmapId: step.roadmapId,
            stepId: step.stepId,
            title: step.title,
            note: step.roadmapTitle,
            ...(exercise && { exerciseId: exercise.id }),
            ...(step.song && { song: step.song }),
          },
        };
      });
    }
    return [];
  }, [tab, sources]);

  const listed = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return candidates
      .map((candidate) => ({
        ...candidate,
        display: describe({
          ...candidate.draft,
          id: candidate.key,
          minutes: 0,
          auto: false,
          done: false,
          role: "main",
        }),
      }))
      .filter(
        ({ display }) =>
          !needle ||
          display.title.toLowerCase().includes(needle) ||
          display.subtitle.toLowerCase().includes(needle),
      )
      .slice(0, MAX_LISTED);
  }, [candidates, search, describe]);

  const add = async (key: string, draft: Draft) => {
    try {
      await onAdd({
        ...draft,
        id: newItemId(),
        minutes,
        auto: false,
        done: false,
        role: "main",
      });
      setAdded((current) => new Set(current).add(key));
    } catch {
      toast.error(t("toast.error"));
    }
  };

  const addCustom = async () => {
    const title = customTitle.trim();
    if (!title) return;
    await add(`custom:${title}`, {
      kind: "custom" as CalendarItemKind,
      area: customArea,
      title,
      ...(customNote.trim() && { note: customNote.trim() }),
    });
    setCustomTitle("");
    setCustomNote("");
    toast.success(t("add.custom_added", { title }));
  };

  const emptyState: Record<
    Exclude<Tab, "exercise" | "custom">,
    { text: string; href: string }
  > = {
    song: { text: t("planner.sources.songs_empty"), href: "/songs" },
    goal: { text: t("planner.sources.goals_empty"), href: "/goals" },
    roadmap: { text: t("planner.sources.roadmaps_empty"), href: "/ai-coach" },
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='flex flex-col gap-6 border-0 bg-zinc-900 shadow-none sm:max-h-[90vh] sm:max-w-lg sm:p-8'>
        <div className='space-y-2 pr-10'>
          <DialogTitle className='text-xl font-bold text-zinc-100'>
            {t("add.title", { day: dateLabel })}
          </DialogTitle>
          <DialogDescription className='text-sm text-zinc-400'>
            {t("add.description")}
          </DialogDescription>
        </div>

        <div className='space-y-4'>
          <div className='-mx-1 flex gap-1 overflow-x-auto px-1 pb-1'>
            {TABS.map((value) => (
              <button
                key={value}
                type='button'
                onClick={() => {
                  setTab(value);
                  setSearch("");
                  setMinutes(DEFAULT_MINUTES[value]);
                }}
                aria-pressed={tab === value}
                className={cn(
                  "h-9 shrink-0 rounded-lg px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                  tab === value
                    ? "bg-zinc-700 text-zinc-100"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                )}>
                {t(`kinds.${value}`)}
              </button>
            ))}
          </div>

          <div className='flex items-center justify-between gap-4'>
            <span className='text-sm text-zinc-400'>{t("add.length")}</span>
            <div className='flex items-center gap-3'>
              <span className='w-16 text-right text-sm font-semibold tabular-nums text-zinc-100'>
                {formatMinutes(minutes)}
              </span>
              <Stepper
                value={minutes / 5}
                min={1}
                max={24}
                onChange={(steps) => setMinutes(steps * 5)}
                label={t("add.length")}
              />
            </div>
          </div>

          {(tab === "exercise" || tab === "song") && (
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("add.search")}
              aria-label={t("add.search")}
              startIcon={<Search className='h-4 w-4 text-zinc-500' />}
              className='h-11 border-0 bg-zinc-800/60 text-zinc-100'
            />
          )}
        </div>

        <div className='-mx-2 min-h-[12rem] flex-1 overflow-y-auto px-2'>
          {tab === "custom" ? (
            <form
              className='space-y-5 px-1'
              onSubmit={(event) => {
                event.preventDefault();
                void addCustom();
              }}>
              <Input
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
                placeholder={t("add.custom_title")}
                aria-label={t("add.custom_title")}
                maxLength={80}
                className='h-11 border-0 bg-zinc-800/60 text-zinc-100'
              />
              <Input
                value={customNote}
                onChange={(event) => setCustomNote(event.target.value)}
                placeholder={t("add.custom_note")}
                aria-label={t("add.custom_note")}
                maxLength={140}
                className='h-11 border-0 bg-zinc-800/60 text-zinc-100'
              />
              <div
                role='radiogroup'
                aria-label={t("add.custom_area")}
                className='flex flex-wrap gap-2'>
                {PRACTICE_AREAS.map((area) => (
                  <button
                    key={area}
                    type='button'
                    role='radio'
                    aria-checked={customArea === area}
                    onClick={() => setCustomArea(area)}
                    className={cn(
                      "flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                      customArea === area
                        ? "bg-zinc-700 text-zinc-100"
                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                    )}>
                    <span
                      className={cn("h-2 w-2 rounded-full", AREA_DOT[area])}
                    />
                    {t(`areas.${area}`)}
                  </button>
                ))}
              </div>
              <Button
                type='submit'
                disabled={!customTitle.trim()}
                className='h-11 w-full rounded-lg border-b-black/40 bg-zinc-800 text-zinc-100 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-700'>
                <Plus className='h-4 w-4' />
                {t("add.custom_submit")}
              </Button>
            </form>
          ) : listed.length === 0 ? (
            tab !== "exercise" && candidates.length === 0 ? (
              <Link
                href={emptyState[tab].href}
                className='block rounded px-1 py-4 text-sm text-zinc-400 underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:text-zinc-200 hover:underline'>
                {emptyState[tab].text}
              </Link>
            ) : (
              <p className='px-1 py-4 text-sm text-zinc-500'>
                {t("add.no_results")}
              </p>
            )
          ) : (
            <ul className='space-y-1'>
              {listed.map(({ key, draft, display }) => (
                <CandidateRow
                  key={key}
                  display={display}
                  area={draft.area}
                  isAdded={added.has(key)}
                  label={t("add.add_item", { title: display.title })}
                  onAdd={() => add(key, draft)}
                />
              ))}
            </ul>
          )}
        </div>

        <Button
          onClick={onClose}
          className='h-11 rounded-lg border-b-black/25 bg-white font-bold text-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200'>
          {t("add.done")}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
