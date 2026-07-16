import { cn } from "assets/lib/utils";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import {
  getCommunityExercises,
  getUserRatingForExercise,
  getUserThanksForExercise,
  incrementExercisePlayCount,
  rateExercise,
  thankExercise,
} from "feature/communityExercises/services/communityExerciseService";
import type { CommunityExercise } from "feature/communityExercises/types";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import type { DashboardExercise } from "feature/skills/components/SkillDashboard";
import { selectUserAuth } from "feature/user/store/userSlice";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronRight as StartIcon,
  Guitar,
  HandHeart,
  Search,
  Star,
} from "lucide-react";
import Link from "next/link";
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

const CATEGORY_COLORS: Record<string, string> = {
  technique: "bg-blue-500/15 text-blue-400",
  theory: "bg-violet-500/15 text-violet-400",
  hearing: "bg-cyan-500/15 text-cyan-400",
  creativity: "bg-green-500/15 text-green-400",
  mixed: "bg-zinc-500/15 text-zinc-400",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-sky-500/15 text-sky-400",
  easy: "bg-emerald-500/15 text-emerald-400",
  medium: "bg-amber-500/15 text-amber-400",
  hard: "bg-rose-500/15 text-rose-400",
};

const CategoryBadge = ({ category }: { category: string }) => (
  <span
    className={cn(
      "rounded px-2 py-0.5 text-[10px] font-bold capitalize tracking-wider",
      CATEGORY_COLORS[category] ?? CATEGORY_COLORS.mixed,
    )}>
    {category}
  </span>
);

const DifficultyBadge = ({ difficulty }: { difficulty: string }) => (
  <span
    className={cn(
      "rounded px-2 py-0.5 text-[10px] font-bold capitalize tracking-wider",
      DIFFICULTY_COLORS[difficulty],
    )}>
    {difficulty}
  </span>
);

const AuthorAvatar = ({
  authorId,
  authorUsername,
  avatar,
}: {
  authorId: string;
  authorUsername: string;
  avatar?: string | null;
}) => {
  const initial = authorUsername?.[0]?.toUpperCase() ?? "?";
  return (
    <UserTooltip userId={authorId}>
      <Link
        href={`/user/${authorId}`}
        onClick={(e) => e.stopPropagation()}
        className='shrink-0'
        aria-label={`View ${authorUsername}'s profile`}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={authorUsername}
            className='h-8 w-8 rounded-full object-cover ring-1 ring-zinc-700 transition-all hover:ring-cyan-500/60'
          />
        ) : (
          <span className='flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 ring-1 ring-zinc-700 transition-all hover:ring-cyan-500/60'>
            {initial}
          </span>
        )}
      </Link>
    </UserTooltip>
  );
};

const StatCounters = ({
  playCount,
  thanksCount,
}: {
  playCount: number;
  thanksCount: number;
}) => (
  <>
    <span
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap text-xs font-medium tabular-nums",
        playCount > 0 ? "text-cyan-400" : "text-zinc-500",
      )}
      title={`Practiced ${playCount} times`}>
      <Guitar size={15} />
      {playCount}
      <span className='font-normal'>plays</span>
    </span>
    <span
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap text-xs font-medium tabular-nums",
        thanksCount > 0 ? "text-amber-400" : "text-zinc-500",
      )}
      title={`The author was thanked ${thanksCount} times`}>
      <HandHeart size={15} />
      {thanksCount}
      <span className='font-normal'>thanks</span>
    </span>
  </>
);

const RankBadge = ({
  rank,
  ratingCount,
}: {
  rank: number;
  ratingCount: number;
}) => {
  if (rank > 3 || ratingCount === 0) return null;
  return (
    <span className='shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-400'>
      #{rank}
    </span>
  );
};

const AverageStars = ({
  average,
  count,
}: {
  average: number;
  count: number;
}) => {
  if (count === 0) {
    return (
      <span className='whitespace-nowrap text-[11px] text-zinc-500'>
        No ratings yet
      </span>
    );
  }
  const pct = Math.max(0, Math.min(100, (average / 5) * 100));
  return (
    <div className='flex items-center gap-1.5'>
      <div className='relative shrink-0'>
        <div className='flex items-center gap-0.5 text-zinc-700'>
          {STAR_VALUES.map((s) => (
            <Star key={s} size={14} strokeWidth={1.5} />
          ))}
        </div>
        <div
          className='absolute inset-y-0 left-0 overflow-hidden'
          style={{ width: `${pct}%` }}>
          <div className='flex w-max items-center gap-0.5 text-amber-400'>
            {STAR_VALUES.map((s) => (
              <Star key={s} size={14} strokeWidth={1.5} fill='currentColor' />
            ))}
          </div>
        </div>
      </div>
      <span className='text-[11px] font-bold tabular-nums text-zinc-300'>
        {average.toFixed(1)}
      </span>
      <span className='text-[10px] tabular-nums text-zinc-500'>({count})</span>
    </div>
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
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? userRating ?? 0;

  return (
    <div className='flex items-center gap-0.5'>
      {STAR_VALUES.map((star) => (
        <button
          key={star}
          disabled={isLoading}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onRate(exerciseId, star)}
          aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
          className={cn(
            "rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-wait",
            star <= display
              ? "text-amber-400"
              : "text-zinc-600 hover:text-zinc-400",
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

interface ExerciseDetailsProps {
  exercise: CommunityExercise;
  userRating: number | null;
  onRate: (exerciseId: string, rating: number) => void;
  isRatingLoading: boolean;
  isOwnExercise: boolean;
  hasThanked: boolean;
  isThanksLoading: boolean;
  onThank: (exerciseId: string) => void;
  showHeader?: boolean;
}

const ExerciseDetails = ({
  exercise,
  userRating,
  onRate,
  isRatingLoading,
  isOwnExercise,
  hasThanked,
  isThanksLoading,
  onThank,
  showHeader = false,
}: ExerciseDetailsProps) => (
  <div className='space-y-6' onClick={(e) => e.stopPropagation()}>
    {showHeader && (
      <div className='space-y-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <h3 className='font-display text-lg font-semibold leading-snug text-white'>
            {exercise.title}
          </h3>
          <CategoryBadge category={exercise.category} />
          <DifficultyBadge difficulty={exercise.difficulty} />
        </div>
        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400'>
          {exercise.metronomeSpeed && (
            <span className='font-mono'>
              {exercise.metronomeSpeed.min}–{exercise.metronomeSpeed.max} BPM
            </span>
          )}
          <span>{exercise.timeInMinutes} min</span>
          <span className='flex items-center gap-1.5'>
            <Guitar size={14} className='text-cyan-400' />
            practiced {exercise.playCount || 0} times
          </span>
          <span className='flex items-center gap-1.5'>
            <HandHeart size={14} className='text-amber-400' />
            thanked {exercise.thanksCount || 0} times
          </span>
        </div>
      </div>
    )}

    {exercise.tablature?.length > 0 && (
      <div className='overflow-hidden rounded-lg border border-zinc-800'>
        <TablatureViewer
          measures={exercise.tablature}
          bpm={exercise.metronomeSpeed?.recommended ?? 80}
          isPlaying={false}
          startTime={null}
          className='h-[280px]'
        />
      </div>
    )}

    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10'>
      {exercise.description && (
        <div className='space-y-1'>
          <p className='text-xs font-semibold text-zinc-500'>About</p>
          <p className='text-sm leading-relaxed text-zinc-300'>
            {exercise.description}
          </p>
        </div>
      )}

      {exercise.instructions?.length > 0 && (
        <div className='space-y-2'>
          <p className='text-xs font-semibold text-zinc-500'>Instructions</p>
          <ol className='list-none space-y-1.5'>
            {exercise.instructions.map((inst, i) => (
              <li key={i} className='flex gap-2 text-sm text-zinc-300'>
                <span className='shrink-0 font-bold tabular-nums text-zinc-500'>
                  {i + 1}.
                </span>
                {inst}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>

    {exercise.tips?.filter(Boolean).length > 0 && (
      <div className='space-y-2'>
        <p className='text-xs font-semibold text-zinc-500'>Tips</p>
        <ul className='space-y-1'>
          {exercise.tips.filter(Boolean).map((tip, i) => (
            <li key={i} className='flex gap-2 text-sm text-zinc-400'>
              <span className='text-zinc-500'>·</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className='flex flex-wrap items-center justify-between gap-4'>
      <div className='flex items-center gap-3'>
        <span className='text-sm text-zinc-400'>Your rating</span>
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
          "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed",
          hasThanked
            ? "bg-amber-500/15 text-amber-300"
            : "bg-amber-500/10 text-amber-300 disabled:opacity-40 hover:bg-amber-500/20 disabled:hover:bg-amber-500/10",
        )}>
        <HandHeart size={16} />
        {hasThanked ? "Thanked" : "Thank the author"}
      </button>
    </div>
  </div>
);

interface ExerciseRowProps extends ExerciseDetailsProps {
  authorAvatar?: string | null;
  onExpand: (id: string) => void;
  isExpanded: boolean;
  onStart: (exercise: CommunityExercise) => void;
  rank: number;
}

const StartButton = ({
  exercise,
  onStart,
}: {
  exercise: CommunityExercise;
  onStart: (exercise: CommunityExercise) => void;
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onStart(exercise);
    }}
    className='flex items-center gap-1.5 rounded bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white'>
    <StartIcon size={12} strokeWidth={2.5} />
    Start
  </button>
);

const ExerciseRow = ({
  exercise,
  authorAvatar,
  userRating,
  onRate,
  isRatingLoading,
  onExpand,
  isExpanded,
  onStart,
  isOwnExercise,
  hasThanked,
  isThanksLoading,
  onThank,
  rank,
}: ExerciseRowProps) => {
  const cellBg = cn(
    "border-y border-zinc-800 bg-zinc-900/40 transition-colors group-hover:bg-zinc-800/40",
    isExpanded && "bg-zinc-800/40",
  );

  return (
    <>
      <tr
        className='group cursor-pointer'
        onClick={() => onExpand(exercise.id)}>
        {/* Title + author */}
        <td className={cn(cellBg, "rounded-l-lg border-l py-4 pl-4 pr-3")}>
          <div className='flex items-center gap-3'>
            <ChevronDown
              size={14}
              className={cn(
                "shrink-0 text-zinc-500 transition-transform",
                isExpanded && "rotate-180",
              )}
            />
            <AuthorAvatar
              authorId={exercise.authorId}
              authorUsername={exercise.authorUsername}
              avatar={authorAvatar}
            />
            <div className='flex min-w-0 flex-col gap-0.5'>
              <span className='flex items-center gap-2'>
                <span
                  className='line-clamp-2 break-words font-semibold leading-snug text-white'
                  title={exercise.title}>
                  {exercise.title}
                </span>
                <RankBadge rank={rank} ratingCount={exercise.ratingCount} />
              </span>
              <UserTooltip userId={exercise.authorId}>
                <Link
                  href={`/user/${exercise.authorId}`}
                  onClick={(e) => e.stopPropagation()}
                  className='w-fit max-w-full truncate text-[11px] font-medium text-zinc-400 transition-colors hover:text-cyan-400'>
                  {exercise.authorUsername}
                </Link>
              </UserTooltip>
            </div>
          </div>
        </td>

        {/* Category */}
        <td className={cn(cellBg, "px-3 py-4")}>
          <CategoryBadge category={exercise.category} />
        </td>

        {/* Difficulty */}
        <td className={cn(cellBg, "px-3 py-4")}>
          <DifficultyBadge difficulty={exercise.difficulty} />
        </td>

        {/* BPM */}
        <td
          className={cn(
            cellBg,
            "font-mono whitespace-nowrap px-3 py-4 text-xs text-zinc-400",
          )}>
          {exercise.metronomeSpeed ? (
            `${exercise.metronomeSpeed.min}–${exercise.metronomeSpeed.max}`
          ) : (
            <span className='text-zinc-500'>—</span>
          )}
        </td>

        {/* Min */}
        <td className={cn(cellBg, "px-3 py-4 text-xs text-zinc-400")}>
          {exercise.timeInMinutes}m
        </td>

        {/* Plays */}
        <td className={cn(cellBg, "whitespace-nowrap px-3 py-4")}>
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium tabular-nums",
              (exercise.playCount || 0) > 0 ? "text-cyan-400" : "text-zinc-500",
            )}
            title={`Practiced ${exercise.playCount || 0} times`}>
            <Guitar size={14} />
            {exercise.playCount || 0}
          </span>
        </td>

        {/* Thanks */}
        <td className={cn(cellBg, "whitespace-nowrap px-3 py-4")}>
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium tabular-nums",
              (exercise.thanksCount || 0) > 0
                ? "text-amber-400"
                : "text-zinc-500",
            )}
            title={`The author was thanked ${exercise.thanksCount || 0} times`}>
            <HandHeart size={14} />
            {exercise.thanksCount || 0}
          </span>
        </td>

        {/* Rating */}
        <td className={cn(cellBg, "whitespace-nowrap px-3 py-4")}>
          <div className='flex justify-end'>
            <AverageStars
              average={exercise.averageRating}
              count={exercise.ratingCount}
            />
          </div>
        </td>

        {/* Start */}
        <td className={cn(cellBg, "rounded-r-lg border-r py-4 pl-3 pr-4")}>
          <StartButton exercise={exercise} onStart={onStart} />
        </td>
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr>
          <td
            colSpan={9}
            className='rounded-lg border border-zinc-800 bg-zinc-900/40 p-6'>
            <ExerciseDetails
              exercise={exercise}
              userRating={userRating}
              onRate={onRate}
              isRatingLoading={isRatingLoading}
              isOwnExercise={isOwnExercise}
              hasThanked={hasThanked}
              isThanksLoading={isThanksLoading}
              onThank={onThank}
              showHeader
            />
          </td>
        </tr>
      )}
    </>
  );
};

const ExerciseCard = ({
  exercise,
  authorAvatar,
  userRating,
  onRate,
  isRatingLoading,
  onExpand,
  isExpanded,
  onStart,
  isOwnExercise,
  hasThanked,
  isThanksLoading,
  onThank,
  rank,
}: ExerciseRowProps) => (
  <div
    className='cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:bg-zinc-800/40'
    onClick={() => onExpand(exercise.id)}>
    <div className='flex items-start gap-3'>
      <AuthorAvatar
        authorId={exercise.authorId}
        authorUsername={exercise.authorUsername}
        avatar={authorAvatar}
      />
      <div className='min-w-0 flex-1'>
        <span className='flex items-center gap-2'>
          <span
            className='line-clamp-2 break-words font-semibold leading-snug text-white'
            title={exercise.title}>
            {exercise.title}
          </span>
          <RankBadge rank={rank} ratingCount={exercise.ratingCount} />
        </span>
        <UserTooltip userId={exercise.authorId}>
          <Link
            href={`/user/${exercise.authorId}`}
            onClick={(e) => e.stopPropagation()}
            className='w-fit text-[11px] font-medium text-zinc-400 transition-colors hover:text-cyan-400'>
            {exercise.authorUsername}
          </Link>
        </UserTooltip>
        <div className='mt-2 flex flex-wrap items-center gap-1.5'>
          <CategoryBadge category={exercise.category} />
          <DifficultyBadge difficulty={exercise.difficulty} />
        </div>
      </div>
      <ChevronDown
        size={16}
        className={cn(
          "mt-1 shrink-0 text-zinc-500 transition-transform",
          isExpanded && "rotate-180",
        )}
      />
    </div>

    <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
      <div className='flex flex-wrap items-center gap-3 text-[11px] text-zinc-400'>
        {exercise.metronomeSpeed && (
          <span className='font-mono whitespace-nowrap'>
            {exercise.metronomeSpeed.min}–{exercise.metronomeSpeed.max} BPM
          </span>
        )}
        <span>{exercise.timeInMinutes}m</span>
        <StatCounters
          playCount={exercise.playCount || 0}
          thanksCount={exercise.thanksCount || 0}
        />
        {exercise.ratingCount > 0 && (
          <span className='flex items-center gap-1 font-bold tabular-nums text-amber-400'>
            <Star size={12} fill='currentColor' strokeWidth={1.5} />
            {exercise.averageRating.toFixed(1)}
            <span className='font-normal text-zinc-500'>
              ({exercise.ratingCount})
            </span>
          </span>
        )}
      </div>
      <StartButton exercise={exercise} onStart={onStart} />
    </div>

    {isExpanded && (
      <div className='mt-5'>
        <ExerciseDetails
          exercise={exercise}
          userRating={userRating}
          onRate={onRate}
          isRatingLoading={isRatingLoading}
          isOwnExercise={isOwnExercise}
          hasThanked={hasThanked}
          isThanksLoading={isThanksLoading}
          onThank={onThank}
        />
      </div>
    )}
  </div>
);

interface CommunityExercisesTabProps {
  onStartExercise: (challenge: DashboardExercise) => void;
}

export const CommunityExercisesTab = ({
  onStartExercise,
}: CommunityExercisesTabProps) => {
  const userAuth = useAppSelector(selectUserAuth);
  const [exercises, setExercises] = useState<CommunityExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getCommunityExercises().then((data) => {
      setExercises(data);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!userAuth || exercises.length === 0) return;
    const fetchRatings = async () => {
      const pairs = await Promise.all(
        exercises.map(async (ex) => ({
          id: ex.id,
          rating: await getUserRatingForExercise(ex.id, userAuth),
        })),
      );
      const map: Record<string, number | null> = {};
      pairs.forEach((p) => {
        map[p.id] = p.rating;
      });
      setUserRatings(map);
    };
    fetchRatings();
  }, [userAuth, exercises]);

  useEffect(() => {
    if (!userAuth || exercises.length === 0) return;
    const fetchThanks = async () => {
      const pairs = await Promise.all(
        exercises.map(async (ex) => ({
          id: ex.id,
          thanked: await getUserThanksForExercise(ex.id, userAuth),
        })),
      );
      const map: Record<string, boolean> = {};
      pairs.forEach((p) => {
        map[p.id] = p.thanked;
      });
      setUserThanks(map);
    };
    fetchThanks();
  }, [userAuth, exercises]);

  const filteredExercises = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return exercises.filter((ex) => {
      if (selectedDifficulty !== "all" && ex.difficulty !== selectedDifficulty)
        return false;
      if (selectedCategory !== "all" && ex.category !== selectedCategory)
        return false;
      if (
        q &&
        !ex.title.toLowerCase().includes(q) &&
        !ex.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [exercises, searchQuery, selectedDifficulty, selectedCategory]);

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
    if (userAuth && userAuth !== exercise.authorId) {
      incrementExercisePlayCount(exercise.id, exercise.authorId, userAuth);
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

  const filterPill = (active: boolean) =>
    cn(
      "whitespace-nowrap rounded px-3 py-1 text-[11px] font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      active
        ? "bg-cyan-500/15 text-cyan-300"
        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
    );

  const rowProps = (ex: CommunityExercise, idx: number) => ({
    exercise: ex,
    authorAvatar: authorAvatars[ex.authorId],
    userRating: userRatings[ex.id] ?? null,
    onRate: handleRate,
    isRatingLoading: !!ratingLoading[ex.id],
    onExpand: (id: string) => setExpandedId(expandedId === id ? null : id),
    isExpanded: expandedId === ex.id,
    onStart: handleStart,
    isOwnExercise: !!userAuth && userAuth === ex.authorId,
    hasThanked: !!userThanks[ex.id],
    isThanksLoading: !!thanksLoading[ex.id],
    onThank: handleThank,
    rank: (safePage - 1) * PAGE_SIZE + idx + 1,
  });

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-24 pt-6 lg:px-6'>
      {/* Filters */}
      <div className='flex flex-col gap-4 rounded-lg bg-zinc-900/60 p-5'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500' />
          <input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder='Search community exercises…'
            className='h-9 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/70 pl-9 pr-4 text-sm text-zinc-200 transition-colors placeholder:text-zinc-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20'
          />
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <span className='mr-1 text-[10px] font-bold capitalize tracking-wider text-zinc-500'>
            Category
          </span>
          {["all", "technique", "theory", "hearing", "creativity", "mixed"].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={filterPill(selectedCategory === cat)}>
                {cat === "all" ? "All" : cat}
              </button>
            ),
          )}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <span className='mr-1 text-[10px] font-bold capitalize tracking-wider text-zinc-500'>
            Difficulty
          </span>
          {["all", "easy", "medium", "hard"].map((d) => (
            <button
              key={d}
              onClick={() => handleDifficultyChange(d)}
              className={filterPill(selectedDifficulty === d)}>
              {d === "all" ? "All" : d}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className='flex flex-col gap-3'>
        <p className='text-xs text-zinc-500'>
          {filteredExercises.length} exercise
          {filteredExercises.length !== 1 ? "s" : ""} · sorted by rating
          {totalPages > 1 && (
            <span className='ml-1'>
              — page {safePage} / {totalPages}
            </span>
          )}
        </p>

        {isLoading ? (
          <div className='flex flex-col gap-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className='h-16 animate-pulse rounded-lg bg-zinc-900/40'
              />
            ))}
          </div>
        ) : pageExercises.length === 0 ? (
          <div className='rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-12 text-center text-sm text-zinc-500'>
            {exercises.length === 0
              ? "No community exercises yet. Be the first to publish one!"
              : "No exercises match the current filters."}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className='hidden overflow-x-auto lg:block'>
              <table className='w-full table-fixed border-separate border-spacing-y-3 text-sm'>
                <thead>
                  <tr>
                    <th className='px-4 pb-2 text-left text-[11px] font-bold tracking-wider text-zinc-500'>
                      Exercise
                    </th>
                    <th className='w-28 px-3 pb-2 text-left text-[11px] font-bold tracking-wider text-zinc-500'>
                      Category
                    </th>
                    <th className='w-28 px-3 pb-2 text-left text-[11px] font-bold tracking-wider text-zinc-500'>
                      Difficulty
                    </th>
                    <th className='w-24 px-3 pb-2 text-left text-[11px] font-bold tracking-wider text-zinc-500'>
                      BPM
                    </th>
                    <th className='w-16 px-3 pb-2 text-left text-[11px] font-bold tracking-wider text-zinc-500'>
                      Min
                    </th>
                    <th className='w-20 px-3 pb-2 text-left text-[11px] font-bold tracking-wider text-zinc-500'>
                      Plays
                    </th>
                    <th className='w-20 px-3 pb-2 text-left text-[11px] font-bold tracking-wider text-zinc-500'>
                      Thanks
                    </th>
                    <th className='w-44 px-3 pb-2 text-right text-[11px] font-bold tracking-wider text-zinc-500'>
                      Rating
                    </th>
                    <th className='w-28 px-3 pb-2'></th>
                  </tr>
                </thead>
                <tbody>
                  {pageExercises.map((ex, idx) => (
                    <ExerciseRow key={ex.id} {...rowProps(ex, idx)} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className='flex flex-col gap-3 lg:hidden'>
              {pageExercises.map((ex, idx) => (
                <ExerciseCard key={ex.id} {...rowProps(ex, idx)} />
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between pt-1'>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className='flex items-center gap-1.5 rounded bg-zinc-800/50 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-30 hover:enabled:bg-zinc-800 hover:enabled:text-zinc-200'>
              <ChevronLeft size={13} />
              Previous
            </button>
            <div className='flex items-center gap-1'>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isActive = p === safePage;
                const isNear =
                  Math.abs(p - safePage) <= 2 || p === 1 || p === totalPages;
                if (!isNear) {
                  return Math.abs(p - safePage) === 3 ? (
                    <span key={p} className='px-1 text-xs text-zinc-500'>
                      …
                    </span>
                  ) : null;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-7 min-w-[28px] rounded px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      isActive
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200",
                    )}>
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className='flex items-center gap-1.5 rounded bg-zinc-800/50 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-30 hover:enabled:bg-zinc-800 hover:enabled:text-zinc-200'>
              Next
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
