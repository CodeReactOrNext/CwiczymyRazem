import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, PRESSABLE } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "assets/components/ui/select";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import { LoadingSwap } from "components/LoadingSwap/LoadingSwap";
import { SearchInput } from "components/SearchInput/SearchInput";
import Avatar from "components/UI/Avatar";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { communityExercisesQuery } from "feature/communityExercises/hooks/communityExerciseQueries";
import {
  getUserRatingForExercise,
  getUserThanksForExercise,
  rateExercise,
  thankExercise,
} from "feature/communityExercises/services/communityExerciseService";
import type { CommunityExercise } from "feature/communityExercises/types";
import {
  INSTRUMENT_FILTERS,
  type InstrumentFilter,
  matchesInstrumentFilter,
} from "feature/communityExercises/utils/exerciseInstrumentFilter";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import type { DashboardExercise } from "feature/skills/components/SkillDashboard";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import {
  ChevronLeft,
  ChevronRight,
  HandHeart,
  Play,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";
import { firebaseGetUserTooltipData } from "utils/firebase/client/firebase.utils";

const buildChallenge = (ex: CommunityExercise): DashboardExercise => ({
  id: ex.id,
  title: ex.title,
  description: ex.description,
  category: ex.category as any,
  requiredSkillId: ex.relatedSkills[0] || "general",
  requiredLevel:
    ex.difficulty === "hard" ? 2 : ex.difficulty === "medium" ? 1 : 0,
  rewardDescription: "Practice complete",
  exercises: [
    {
      id: ex.id,
      title: ex.title,
      description: ex.description,
      difficulty: ex.difficulty,
      category: ex.category,
      timeInMinutes: ex.timeInMinutes,
      instructions: ex.instructions,
      tips: ex.tips,
      metronomeSpeed: ex.metronomeSpeed,
      relatedSkills: ex.relatedSkills,
      tablature: ex.tablature,
      ...(ex.instrument === "bass" && { instrument: ex.instrument }),
      // Set on exercises saved from the plan creator instead of the Tab Editor —
      // without the GP file a published one opens as an empty exercise.
      videoUrl: ex.videoUrl,
      imageUrl: ex.imageUrl,
      gpFileUrl: ex.gpFileUrl,
      backingTracks: ex.backingTracks,
    },
  ],
  unlockDescription: "",
  streakDays: 0,
  intensity: "medium",
  shortGoal: "",
  accentColor: "#ffffff",
  difficulty: ex.difficulty,
  tablature: ex.tablature,
  communityExerciseId: ex.id,
  communityExerciseAuthorId: ex.authorId,
});

const PAGE_SIZE = 10;

const STAR_VALUES = [1, 2, 3, 4, 5];

const CATEGORY_FILTERS = [
  "all",
  "technique",
  "theory",
  "hearing",
  "creativity",
  "mixed",
];

const DIFFICULTY_FILTERS = ["all", "easy", "medium", "hard"];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const TITLE_CLASS = "text-xl font-bold leading-snug tracking-normal text-white";

/** One star + average — a five-star strip would cost the row the width its title needs. */
const AverageRating = ({
  average,
  count,
}: {
  average: number;
  count: number;
}) => {
  const { t } = useTranslation("community");
  if (count === 0) {
    return (
      <span className='whitespace-nowrap text-[13px] text-zinc-400'>
        {t("no_ratings")}
      </span>
    );
  }
  return (
    <span
      className='flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold tabular-nums text-zinc-200'
      title={t("rated_by", { avg: average.toFixed(1), count })}>
      <Star
        fill='currentColor'
        strokeWidth={1.5}
        className='h-3.5 w-3.5 text-amber-400'
      />
      {average.toFixed(1)}
      <span className='font-normal text-zinc-400'>({count})</span>
    </span>
  );
};

interface RateStarsProps {
  exerciseId: string;
  userRating: number | null;
  onRate: (exerciseId: string, rating: number) => void;
  isLoading: boolean;
}

const RateStars = ({
  exerciseId,
  userRating,
  onRate,
  isLoading,
}: RateStarsProps) => {
  const { t } = useTranslation("community");
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? userRating ?? 0;

  return (
    <div className='flex items-center'>
      {STAR_VALUES.map((star) => (
        <button
          key={star}
          disabled={isLoading}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onRate(exerciseId, star)}
          aria-label={t("rate_stars", { count: star })}
          className={cn(
            "flex h-9 w-7 items-center justify-center rounded transition-colors disabled:cursor-wait",
            FOCUS_RING,
            star <= display
              ? "text-amber-400"
              : "text-zinc-500 hover:text-zinc-300",
          )}>
          <Star
            size={18}
            strokeWidth={1.5}
            fill={star <= display ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
};

interface ExerciseActions {
  userRating: number | null;
  onRate: (exerciseId: string, rating: number) => void;
  isRatingLoading: boolean;
  isOwnExercise: boolean;
  hasThanked: boolean;
  isThanksLoading: boolean;
  onThank: (exerciseId: string) => void;
  onStart: (exercise: CommunityExercise) => void;
}

interface ExercisePaneProps extends ExerciseActions {
  exercise: CommunityExercise;
  authorAvatar?: string | null;
  /** The heading element — the dialog needs its own title primitive. */
  title: ReactNode;
  /** Sits right of the heading. */
  aside?: ReactNode;
}

/**
 * Everything about one exercise: who wrote it, the tab, how to play it, and the
 * rating/thanks/start actions. It fills the same Dialog the catalog opens an
 * exercise in (a bottom sheet on a phone); Start stays pinned under the
 * scrolling part.
 */
const ExercisePane = ({
  exercise,
  authorAvatar,
  title,
  aside,
  userRating,
  onRate,
  isRatingLoading,
  isOwnExercise,
  hasThanked,
  isThanksLoading,
  onThank,
  onStart,
}: ExercisePaneProps) => {
  const { t } = useTranslation(["community", "exercises"]);
  const tips = exercise.tips?.filter(Boolean) ?? [];
  const meta = [
    t(`exercises:categories.${exercise.category}`, exercise.category),
    t(`exercises:difficulty.${exercise.difficulty}`, exercise.difficulty),
    exercise.instrument === "bass" ? t("instrument_bass") : null,
    exercise.metronomeSpeed
      ? `${exercise.metronomeSpeed.min}–${exercise.metronomeSpeed.max} BPM`
      : null,
    `${exercise.timeInMinutes} min`,
    `${exercise.playCount || 0} ${t("plays")}`,
  ].filter(Boolean);

  return (
    <>
      <div className='flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-5 pb-4 pt-6 sm:px-8 sm:pt-8'>
        <div className='flex flex-col gap-3'>
          <div className='flex items-start justify-between gap-3'>
            {title}
            {aside}
          </div>
          <UserTooltip userId={exercise.authorId}>
            <Link
              href={`/user/${exercise.authorId}`}
              aria-label={t("view_profile", { name: exercise.authorUsername })}
              className={cn(
                "flex w-fit items-center gap-2.5 rounded text-[13px] font-semibold text-zinc-300 transition-colors hover:text-white",
                FOCUS_RING,
              )}>
              <Avatar
                size='xs'
                name={exercise.authorUsername}
                avatarURL={authorAvatar || undefined}
                className='shrink-0'
              />
              {exercise.authorUsername}
            </Link>
          </UserTooltip>
          <p className='text-[13px] leading-relaxed text-zinc-400'>
            {meta.join(" · ")}
          </p>
        </div>

        {exercise.tablature?.length > 0 && (
          <div className='shrink-0 overflow-hidden rounded-lg'>
            <TablatureViewer
              measures={exercise.tablature}
              stringCount={exercise.instrument === "bass" ? 4 : undefined}
              bpm={exercise.metronomeSpeed?.recommended ?? 80}
              isPlaying={false}
              startTime={null}
              className='h-[240px]'
            />
          </div>
        )}

        {exercise.description && (
          <div className='space-y-2.5'>
            <p className='text-xs font-semibold text-zinc-400'>{t("about")}</p>
            <p className='text-[15px] leading-relaxed text-zinc-300'>
              {exercise.description}
            </p>
          </div>
        )}

        {exercise.instructions?.length > 0 && (
          <div className='space-y-3'>
            <p className='text-xs font-semibold text-zinc-400'>
              {t("instructions")}
            </p>
            <ol className='list-none space-y-2.5'>
              {exercise.instructions.map((inst, i) => (
                <li
                  key={i}
                  className='flex gap-3 text-[15px] leading-relaxed text-zinc-300'>
                  <span className='w-4 shrink-0 font-semibold tabular-nums text-zinc-400'>
                    {i + 1}
                  </span>
                  {inst}
                </li>
              ))}
            </ol>
          </div>
        )}

        {tips.length > 0 && (
          <div className='space-y-3'>
            <p className='text-xs font-semibold text-zinc-400'>{t("tips")}</p>
            <ul className='space-y-2.5'>
              {tips.map((tip, i) => (
                <li
                  key={i}
                  className='text-[15px] leading-relaxed text-zinc-300'>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className='flex flex-col gap-2'>
          <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
            <div className='flex items-center gap-2.5'>
              <span className='text-[13px] text-zinc-400'>
                {t("your_rating")}
              </span>
              <RateStars
                exerciseId={exercise.id}
                userRating={userRating}
                onRate={onRate}
                isLoading={isRatingLoading}
              />
            </div>
            <button
              onClick={() => onThank(exercise.id)}
              disabled={isOwnExercise || hasThanked || isThanksLoading}
              className={cn(
                PRESSABLE,
                "flex h-10 items-center gap-2 rounded-lg border-b-black/30 px-3.5 text-[13px] text-amber-300 transition-colors disabled:cursor-not-allowed",
                FOCUS_RING,
                hasThanked
                  ? "bg-amber-500/15"
                  : "bg-amber-500/10 disabled:opacity-40 hover:bg-amber-500/20 disabled:hover:bg-amber-500/10",
              )}>
              <HandHeart size={16} />
              {hasThanked ? t("thanked") : t("thank_author")}
            </button>
          </div>
          <p className='text-xs tabular-nums text-zinc-400'>
            {t("thanked_times", { count: exercise.thanksCount || 0 })}
          </p>
        </div>
      </div>

      <div className='px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-8 sm:pb-8'>
        <Button
          size='lg'
          onClick={() => onStart(exercise)}
          className='w-full'>
          <Play fill='currentColor' />
          {t("start")}
        </Button>
      </div>
    </>
  );
};

interface ExerciseRowProps {
  exercise: CommunityExercise;
  authorAvatar?: string | null;
  onSelect: (id: string) => void;
  onStart: (exercise: CommunityExercise) => void;
}

/**
 * One exercise in the list — a row on desktop, a card on a phone. The row
 * itself opens the details dialog; the key on the right starts it.
 */
const ExerciseRow = ({
  exercise,
  authorAvatar,
  onSelect,
  onStart,
}: ExerciseRowProps) => {
  const { t } = useTranslation(["community", "exercises"]);
  const sub = [
    exercise.authorUsername,
    t(`exercises:categories.${exercise.category}`, exercise.category),
    t(`exercises:difficulty.${exercise.difficulty}`, exercise.difficulty),
    exercise.instrument === "bass" ? t("instrument_bass") : null,
    `${exercise.timeInMinutes} min`,
  ].filter(Boolean);
  const plays = `${exercise.playCount || 0} ${t("plays")}`;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg p-5 transition-colors xl:p-0 xl:pr-5",
        "bg-zinc-900/40 hover:bg-zinc-800/40",
      )}>
      <button
        onClick={() => onSelect(exercise.id)}
        aria-label={t("show_details", { title: exercise.title })}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-4 rounded-lg text-left xl:py-5 xl:pl-5",
          FOCUS_RING,
        )}>
        <Avatar
          size='sm'
          name={exercise.authorUsername}
          avatarURL={authorAvatar || undefined}
          className='shrink-0'
        />
        <span className='flex min-w-0 flex-1 flex-col gap-1.5'>
          <span className='line-clamp-2 break-words text-base font-semibold leading-snug text-white xl:line-clamp-1'>
            {exercise.title}
          </span>
          <span className='truncate text-[13px] text-zinc-400'>
            {sub.join(" · ")}
          </span>
          <span className='flex items-center gap-2 text-[13px] tabular-nums text-zinc-400 xl:hidden'>
            <AverageRating
              average={exercise.averageRating}
              count={exercise.ratingCount}
            />
            <span>· {plays}</span>
          </span>
        </span>
        <span className='hidden w-28 shrink-0 justify-end xl:flex'>
          <AverageRating
            average={exercise.averageRating}
            count={exercise.ratingCount}
          />
        </span>
        <span className='hidden w-28 shrink-0 whitespace-nowrap text-right text-[13px] tabular-nums text-zinc-400 xl:block'>
          {plays}
        </span>
      </button>
      <button
        onClick={() => onStart(exercise)}
        aria-label={`${t("start")}: ${exercise.title}`}
        className={cn(
          PRESSABLE,
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-b-black/30 bg-zinc-700 text-zinc-100 transition-colors hover:bg-zinc-600 xl:h-10 xl:w-11",
          FOCUS_RING,
        )}>
        <Play size={13} fill='currentColor' />
      </button>
    </div>
  );
};

interface FilterOption {
  value: string;
  label: string;
}

/** A filter as one key: its name plus the current choice, the options in a menu. */
const FilterSelect = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) => {
  const current = options.find((option) => option.value === value);
  const isAll = value === "all";

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={cn(
          "border-0",
          PRESSABLE,
          "h-10 w-full gap-2 border-b-black/30 bg-zinc-800 px-4 text-sm text-zinc-100 transition-colors hover:bg-zinc-700 sm:w-auto",
        )}>
        {/* A div, not spans: the trigger clamps its direct spans, which would undo `hidden`. */}
        <div className='flex min-w-0 items-center gap-2'>
          <span className='hidden font-medium text-zinc-400 sm:inline'>
            {label}
          </span>
          {isAll ? (
            <>
              <span className='truncate sm:hidden'>{label}</span>
              <span className='hidden sm:inline'>{current?.label}</span>
            </>
          ) : (
            <span className='truncate'>{current?.label}</span>
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const NO_EXERCISES: CommunityExercise[] = [];

interface CommunityExercisesTabProps {
  onStartExercise: (challenge: DashboardExercise) => void;
}

export const CommunityExercisesTab = ({
  onStartExercise,
}: CommunityExercisesTabProps) => {
  const { t } = useTranslation(["community", "exercises"]);
  const userAuth = useAppSelector(selectUserAuth);
  const queryClient = useQueryClient();
  const { data: exercises = NO_EXERCISES, isPending: isLoading } = useQuery(
    communityExercisesQuery(),
  );
  // Local bumps (a rating, a thanks, a play) go into the cached list.
  const setExercises = (
    update: (prev: CommunityExercise[]) => CommunityExercise[],
  ) =>
    queryClient.setQueryData(communityExercisesQuery().queryKey, (prev) =>
      update(prev ?? []),
    );
  const [userRatings, setUserRatings] = useState<Record<string, number | null>>(
    {},
  );
  const [authorAvatars, setAuthorAvatars] = useState<
    Record<string, string | null>
  >({});
  const [ratingLoading, setRatingLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [userThanks, setUserThanks] = useState<Record<string, boolean>>({});
  const [thanksLoading, setThanksLoading] = useState<Record<string, boolean>>(
    {},
  );
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // ?communityExercise=<id> (e.g. "View" on My exercises) opens that exercise's
  // details straight away, once the list holds it — until the player closes it.
  const [linkDismissed, setLinkDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedInstrument, setSelectedInstrument] =
    useState<InstrumentFilter>("all");
  const [page, setPage] = useState(1);

  // Keyed by the ids, not the list: a rating or a play count bumped in the list
  // (or the list re-read in the background) must not read every rating again.
  const exerciseIdsKey = exercises.map((ex) => ex.id).join(",");

  useEffect(() => {
    if (!userAuth || !exerciseIdsKey) return;
    const fetchRatings = async () => {
      const pairs = await Promise.all(
        exerciseIdsKey.split(",").map(async (id) => ({
          id,
          rating: await getUserRatingForExercise(id, userAuth),
        })),
      );
      const map: Record<string, number | null> = {};
      pairs.forEach((p) => {
        map[p.id] = p.rating;
      });
      setUserRatings(map);
    };
    fetchRatings();
  }, [userAuth, exerciseIdsKey]);

  useEffect(() => {
    if (!userAuth || !exerciseIdsKey) return;
    const fetchThanks = async () => {
      const pairs = await Promise.all(
        exerciseIdsKey.split(",").map(async (id) => ({
          id,
          thanked: await getUserThanksForExercise(id, userAuth),
        })),
      );
      const map: Record<string, boolean> = {};
      pairs.forEach((p) => {
        map[p.id] = p.thanked;
      });
      setUserThanks(map);
    };
    fetchThanks();
  }, [userAuth, exerciseIdsKey]);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = exercises.filter((ex) => {
      if (selectedDifficulty !== "all" && ex.difficulty !== selectedDifficulty)
        return false;
      if (selectedCategory !== "all" && ex.category !== selectedCategory)
        return false;
      if (!matchesInstrumentFilter(ex, selectedInstrument)) return false;
      if (
        q &&
        !ex.title.toLowerCase().includes(q) &&
        !ex.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    // Most practised first; equal play counts fall back to the rating order.
    return filtered.sort(
      (a, b) =>
        (b.playCount || 0) - (a.playCount || 0) ||
        (b.averageRating || 0) - (a.averageRating || 0),
    );
  }, [
    exercises,
    searchQuery,
    selectedDifficulty,
    selectedCategory,
    selectedInstrument,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExercises.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const pageExercises = filteredExercises.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    setPage(1);
  };

  const handleInstrumentChange = (instrument: InstrumentFilter) => {
    setSelectedInstrument(instrument);
    setPage(1);
  };

  // Fetch author avatars for the visible page (deduped, cached across pages).
  useEffect(() => {
    const missingIds = Array.from(
      new Set(pageExercises.map((ex) => ex.authorId).filter(Boolean)),
    ).filter((id) => !(id in authorAvatars));
    if (missingIds.length === 0) return undefined;

    let cancelled = false;
    Promise.all(
      missingIds.map(async (id) => ({
        id,
        data: await firebaseGetUserTooltipData(id),
      })),
    ).then((results) => {
      if (cancelled) return;
      setAuthorAvatars((prev) => {
        const next = { ...prev };
        results.forEach(({ id, data }) => {
          next[id] = data?.avatar ?? null;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pageExercises, authorAvatars]);

  const handleRate = async (exerciseId: string, rating: number) => {
    if (!userAuth) return;
    setRatingLoading((prev) => ({ ...prev, [exerciseId]: true }));
    const ok = await rateExercise(exerciseId, userAuth, rating);
    if (ok) {
      setUserRatings((prev) => ({ ...prev, [exerciseId]: rating }));
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          const prevRating = userRatings[exerciseId];
          const wasRated = prevRating !== null && prevRating !== undefined;
          const newCount = wasRated ? ex.ratingCount : ex.ratingCount + 1;
          const newSum = wasRated
            ? ex.averageRating * ex.ratingCount - (prevRating ?? 0) + rating
            : ex.averageRating * ex.ratingCount + rating;
          return {
            ...ex,
            ratingCount: newCount,
            averageRating: newCount > 0 ? newSum / newCount : 0,
          };
        }),
      );
    }
    setRatingLoading((prev) => ({ ...prev, [exerciseId]: false }));
  };

  const handleStart = (exercise: CommunityExercise) => {
    // The session itself records the play (useCommunityPlayCount); this only
    // keeps the number on the card in step without a refetch.
    if (userAuth && userAuth !== exercise.authorId) {
      setExercises((prev) =>
        prev.map((ex) =>
          ex.id === exercise.id
            ? { ...ex, playCount: (ex.playCount || 0) + 1 }
            : ex,
        ),
      );
    }
    onStartExercise(buildChallenge(exercise));
  };

  const handleThank = async (exerciseId: string) => {
    if (!userAuth) return;
    setThanksLoading((prev) => ({ ...prev, [exerciseId]: true }));
    const result = await thankExercise(exerciseId);
    if (result.ok) {
      setUserThanks((prev) => ({ ...prev, [exerciseId]: true }));
      setExercises((prev) =>
        prev.map((ex) =>
          ex.id === exerciseId
            ? { ...ex, thanksCount: (ex.thanksCount || 0) + 1 }
            : ex,
        ),
      );
    } else if (result.alreadyThanked) {
      setUserThanks((prev) => ({ ...prev, [exerciseId]: true }));
    }
    setThanksLoading((prev) => ({ ...prev, [exerciseId]: false }));
  };

  const linkedId =
    typeof router.query.communityExercise === "string"
      ? router.query.communityExercise
      : null;
  const isLinkOpen =
    !!linkedId && !linkDismissed && exercises.some((ex) => ex.id === linkedId);

  const handleSelect = (id: string) => {
    setLinkDismissed(true);
    setSelectedId(id);
    setDetailOpen(true);
  };

  const handleDetailOpenChange = (open: boolean) => {
    if (!open && isLinkOpen) {
      // Keep the linked exercise on screen while the dialog animates out.
      setSelectedId(linkedId);
      setLinkDismissed(true);
    }
    setDetailOpen(open);
  };

  const handleStartAndClose = (exercise: CommunityExercise) => {
    setLinkDismissed(true);
    setDetailOpen(false);
    handleStart(exercise);
  };

  const categoryOptions = CATEGORY_FILTERS.map((cat) => ({
    value: cat,
    label: cat === "all" ? t("all") : t(`exercises:categories.${cat}`, cat),
  }));
  const difficultyOptions = DIFFICULTY_FILTERS.map((d) => ({
    value: d,
    label: d === "all" ? t("all") : t(`exercises:difficulty.${d}`, d),
  }));
  const instrumentOptions = INSTRUMENT_FILTERS.map((i) => ({
    value: i,
    label: i === "all" ? t("all") : t(`instrument_${i}`),
  }));

  // Stays set while the dialog closes, so it never empties mid-animation.
  const detailId = isLinkOpen ? linkedId : selectedId;
  const detailExercise = exercises.find((ex) => ex.id === detailId);

  const paneProps = (ex: CommunityExercise) => ({
    exercise: ex,
    authorAvatar: authorAvatars[ex.authorId],
    userRating: userRatings[ex.id] ?? null,
    onRate: handleRate,
    isRatingLoading: !!ratingLoading[ex.id],
    isOwnExercise: !!userAuth && userAuth === ex.authorId,
    hasThanked: !!userThanks[ex.id],
    isThanksLoading: !!thanksLoading[ex.id],
    onThank: handleThank,
    onStart: handleStartAndClose,
  });

  const pagerKey = cn(
    PRESSABLE,
    "flex h-11 items-center gap-1.5 rounded-lg border-b-black/30 bg-zinc-800 px-3 text-xs text-zinc-300 transition-colors disabled:opacity-40 hover:enabled:bg-zinc-700 hover:enabled:text-white xl:h-9",
    FOCUS_RING,
  );

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-24 pt-6 lg:px-6'>
      {/* Search + filters */}
      <div className='flex flex-col gap-4 rounded-lg bg-zinc-900/60 p-5 xl:bg-transparent xl:p-0'>
        <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
          <SearchInput
            containerClassName='sm:min-w-[260px] sm:flex-1'
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
          />
          <div className='grid grid-cols-3 gap-2 sm:flex sm:gap-3'>
            <FilterSelect
              label={t("category")}
              value={selectedCategory}
              options={categoryOptions}
              onChange={handleCategoryChange}
            />
            <FilterSelect
              label={t("difficulty")}
              value={selectedDifficulty}
              options={difficultyOptions}
              onChange={handleDifficultyChange}
            />
            <FilterSelect
              label={t("instrument")}
              value={selectedInstrument}
              options={instrumentOptions}
              onChange={(value) =>
                handleInstrumentChange(value as InstrumentFilter)
              }
            />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className='h-4 w-48' />
        ) : (
          <p className='text-[13px] text-zinc-400'>
            {t(filteredExercises.length === 1 ? "count_one" : "count", {
              count: filteredExercises.length,
            })}{" "}
            · {t("sorted_by_plays")}
          </p>
        )}
      </div>

      <LoadingSwap
        isLoading={isLoading}
        skeleton={
          <div className='flex flex-col gap-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant='block' className='h-[92px]' />
            ))}
          </div>
        }>
        {pageExercises.length === 0 ? (
          <EmptyState
            mood={exercises.length === 0 ? "wait" : "lookAround"}
            title={exercises.length === 0 ? t("empty") : t("no_match")}
          />
        ) : (
            <div className='flex min-w-0 flex-1 flex-col gap-6'>
              <div className='flex flex-col gap-3'>
                {pageExercises.map((ex) => (
                  <ExerciseRow
                    key={ex.id}
                    exercise={ex}
                    authorAvatar={authorAvatars[ex.authorId]}
                    onSelect={handleSelect}
                    onStart={handleStart}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className='flex items-center justify-between gap-3 rounded-lg bg-zinc-900/40 p-3 xl:bg-transparent xl:p-0'>
                  <button
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                    aria-label={t("previous")}
                    className={pagerKey}>
                    <ChevronLeft size={14} />
                    <span className='hidden sm:inline'>{t("previous")}</span>
                  </button>
                  <p className='text-[13px] tabular-nums text-zinc-400 sm:hidden'>
                    {t("page_of", { page: safePage, total: totalPages })}
                  </p>
                  <div className='hidden items-center gap-1 sm:flex'>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => {
                        const isActive = p === safePage;
                        const isNear =
                          Math.abs(p - safePage) <= 2 ||
                          p === 1 ||
                          p === totalPages;
                        if (!isNear) {
                          return Math.abs(p - safePage) === 3 ? (
                            <span
                              key={p}
                              className='px-1 text-xs text-zinc-400'>
                              …
                            </span>
                          ) : null;
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "h-8 min-w-[32px] rounded px-2 text-xs font-semibold tabular-nums transition-colors",
                              FOCUS_RING,
                              isActive
                                ? "bg-zinc-700 text-white"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                            )}>
                            {p}
                          </button>
                        );
                      },
                    )}
                  </div>
                  <button
                    onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                    disabled={safePage === totalPages}
                    aria-label={t("next")}
                    className={pagerKey}>
                    <span className='hidden sm:inline'>{t("next")}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
        )}
      </LoadingSwap>

      {/* One container for an exercise's details, app-wide: the Dialog the
          catalog uses — centred on desktop, a bottom sheet on a phone. */}
      <Dialog open={detailOpen || isLinkOpen} onOpenChange={handleDetailOpenChange}>
        <DialogContent className='flex max-h-[85vh] flex-col gap-0 overflow-hidden bg-zinc-950 p-0 sm:max-w-4xl sm:overflow-hidden lg:max-w-5xl'>
          {detailExercise && (
            <ExercisePane
              key={detailExercise.id}
              {...paneProps(detailExercise)}
              title={
                <DialogTitle className={cn(TITLE_CLASS, "pr-12")}>
                  {detailExercise.title}
                </DialogTitle>
              }
            />
          )}
          <DialogDescription className='sr-only'>
            {detailExercise?.authorUsername}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};
