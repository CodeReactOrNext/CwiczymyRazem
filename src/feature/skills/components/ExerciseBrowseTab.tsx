import { Chip, chipVariants } from "assets/components/ui/chip";
import { Sheet, SheetContent, SheetTitle } from "assets/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { ExercisePreviewDialog } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/ExercisePreviewDialog";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { BpmProgressData } from "feature/exercisePlan/services/bpmProgressService";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { generateBpmStages } from "feature/exercisePlan/utils/generateBpmStages";
import { getExerciseFamily, getVariantLabel } from "feature/exercisePlan/utils/getExerciseFamily";
import { getExerciseModes, PRACTICE_MODE_LABELS, PRACTICE_MODES, type PracticeMode } from "feature/exercisePlan/utils/getExerciseModes";
import { hasExerciseProgress } from "feature/exercisePlan/utils/hasExerciseProgress";
import { isClickAnsweredMode } from "feature/exercisePlan/utils/huntModes";
import { isExerciseNew } from "feature/exercisePlan/utils/isExerciseNew";
import { getExerciseUserRank } from "feature/leadboard/services/getExerciseUserRank";
import { getSkillAccentClass, SkillIconTile } from "feature/skills/components/SkillIconTile";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkill, GuitarSkillId } from "feature/skills/skills.types";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { toggleFavoriteExercise } from "feature/user/store/userSlice.favoriteActions";
import { useTranslation } from "hooks/useTranslation";
import { ArrowUpDown, Check, ChevronRight, Ear, Hand, Heart, Info, LayoutGrid, Lightbulb, Lock, Music, Search, SlidersHorizontal, Timer, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

import type { DashboardExercise } from "./SkillDashboard";

interface ExerciseBrowseTabProps {
  progressMap: Map<string, BpmProgressData>;
  isPremium: boolean;
  onStartExercise: (challenge: DashboardExercise) => void;
  onShowUpgrade: () => void;
  onShowLeaderboard: (id: string, title: string) => void;
}

const DIFFICULTY_HEX: Record<string, string> = {
  beginner: "#38bdf8", // sky-400
  easy: "#34d399", // emerald-400
  medium: "#fbbf24", // amber-400
  hard: "#fb7185", // rose-400
};

const DIFFICULTY_RANK: Record<string, number> = { beginner: 0, easy: 1, medium: 2, hard: 3 };

/** Accuracy that counts an unladdered exercise (ear quiz, click hunt) as mastered. */
const MASTERY_ACCURACY = 90;

const exTitle = (ex: { title: unknown; id: string }): string =>
  typeof ex.title === "string" ? ex.title : ex.id;

/** Everything the browse tab is allowed to show, resolved once. */
const LIBRARY_EXERCISES = exercisesAgregat.filter(
  ex => !ex.isHiddenFromLibrary && !ex.isPlayalong
) as Exercise[];

/** BPM ladders and modes never change, so they are built once, not per render. */
const BPM_STAGES = new Map<string, number[]>(
  LIBRARY_EXERCISES.map(ex => [ex.id, generateBpmStages(ex.metronomeSpeed)])
);

const EXERCISE_MODES = new Map<string, PracticeMode[]>(
  LIBRARY_EXERCISES.map(ex => [ex.id, getExerciseModes(ex)])
);

/**
 * A set is one drill with different settings — the 34 Strumming patterns, the 24
 * finger permutations, the fretboard hunts per string. Every member carries
 * identical category/difficulty/skill metadata, so a flat table could never tell
 * them apart and four consecutive pages read as the same exercise. Grouping is
 * what makes the library scannable. See getExerciseFamily.
 */
interface ExerciseSet {
  id: string;
  title: string;
  exercises: Exercise[];
}

const EXERCISE_SETS: ExerciseSet[] = (() => {
  const byId = new Map<string, ExerciseSet>();
  LIBRARY_EXERCISES.forEach(ex => {
    const family = getExerciseFamily(ex);
    const existing = byId.get(family.id);
    if (existing) existing.exercises.push(ex);
    else byId.set(family.id, { id: family.id, title: family.title, exercises: [ex] });
  });
  // Inside a set the variants read as a progression, so order by difficulty.
  byId.forEach(set =>
    set.exercises.sort((a, b) => {
      const rank = (DIFFICULTY_RANK[a.difficulty] ?? 99) - (DIFFICULTY_RANK[b.difficulty] ?? 99);
      return rank !== 0 ? rank : exTitle(a).localeCompare(exTitle(b));
    })
  );
  return Array.from(byId.values());
})();

type StatusId = "new" | "untouched" | "inProgress" | "mastered" | "favorite";

const STATUSES: { id: StatusId; label: string }[] = [
  { id: "new", label: "New" },
  { id: "untouched", label: "Not tried" },
  { id: "inProgress", label: "In progress" },
  { id: "mastered", label: "Mastered" },
  { id: "favorite", label: "Favorites" },
];

type LengthId = "short" | "mid" | "long";

const LENGTHS: { id: LengthId; label: string; test: (minutes: number) => boolean }[] = [
  { id: "short", label: "Under 2 min", test: m => m < 2 },
  { id: "mid", label: "2–5 min", test: m => m >= 2 && m <= 5 },
  { id: "long", label: "Over 5 min", test: m => m > 5 },
];

const MODE_ICONS: Record<PracticeMode, typeof Timer> = {
  bpm: Timer,
  tab: Music,
  strum: ArrowUpDown,
  fretboard: LayoutGrid,
  ear: Ear,
  open: Lightbulb,
  noGuitar: Hand,
};

/**
 * Words players type that appear nowhere in a title or description. Keyed by
 * skill id and by practice mode, so an exercise inherits the aliases of
 * everything it is. Without them "shred", "warm up" and "no guitar" all return
 * nothing at all — the average description is only ~90 characters long.
 */
const SEARCH_ALIASES: Record<string, string> = {
  alternate_picking: "shred speed fast picking hand right hand tremolo",
  finger_independence: "warm up warmup spider stretch fingers dexterity chromatic",
  rhythm: "metronome timing strum strumming groove pocket subdivision",
  music_theory: "fretboard neck note names frets intervals memorize",
  ear_training: "ear hearing listening aural relative pitch",
  bending: "bend bends expression pitch",
  improvisation: "solo soloing jam improv licks",
  sweep_picking: "sweep arpeggio arpeggios neoclassical",
  tapping: "tap two hand",
  audio_production: "tone sound pick attack",
  chords: "chord changes voicings voice leading progression",
  scales: "scale pentatonic modes",
  legato: "hammer on pull off slur",
  string_skipping: "skip wide intervals",
  hybrid_picking: "fingers and pick chicken country",
  articulation: "muting palm mute dynamics clean attack",
  phrasing: "melody space breathing licks",
  vibrato: "expression wobble sustain",
  bpm: "metronome tempo bpm speed ladder click",
  tab: "tab tablature notation read sheet",
  strum: "strum strumming rhythm guitar campfire",
  fretboard: "fretboard neck note finder",
  ear: "quiz listening ear test",
  open: "free practice open exploration",
  noGuitar: "no guitar without guitar bus couch silent phone unplugged",
};

const filterPill = (active: boolean, big = false) =>
  cn(
    chipVariants({ color: active ? "cyan" : "gray" }),
    "cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    // The sheet's pills are finger-sized; the desktop bar keeps its compact look.
    big ? "px-3.5 py-2 text-[13px]" : "px-3 py-1.5 text-[12px]"
  );

export const ExerciseBrowseTab = ({
  progressMap,
  isPremium,
  onStartExercise,
  onShowUpgrade,
  onShowLeaderboard,
}: ExerciseBrowseTabProps) => {
  const { t } = useTranslation(["common", "skills"]);
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(selectUserInfo);
  const userAuth = useAppSelector(selectUserAuth);
  const favoriteExerciseIds = useMemo(
    () => userInfo?.favoriteExerciseIds ?? [],
    [userInfo?.favoriteExerciseIds]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<GuitarSkillId[]>([]);
  const [selectedModes, setSelectedModes] = useState<PracticeMode[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<StatusId[]>([]);
  const [selectedLength, setSelectedLength] = useState<LengthId | null>(null);
  const [expandedSets, setExpandedSets] = useState<string[]>([]);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [leaderboardRanks, setLeaderboardRanks] = useState<Record<string, number>>({});
  // Mobile only - filters live in a bottom sheet so the list keeps the screen.
  const [showFilters, setShowFilters] = useState(false);
  // Desktop only - the 22 skill pills open on demand instead of filling three rows.
  const [showSkills, setShowSkills] = useState(false);

  const activeFilterCount =
    selectedSkills.length + selectedModes.length + selectedStatuses.length + (selectedLength ? 1 : 0);

  // The sheet is hidden from `sm` up, so a rotation/resize while it is open
  // would otherwise leave an invisible overlay swallowing clicks.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setShowFilters(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const clearFilters = () => {
    setSelectedSkills([]);
    setSelectedModes([]);
    setSelectedStatuses([]);
    setSelectedLength(null);
  };

  const toggle = <T,>(values: T[], value: T): T[] =>
    values.includes(value) ? values.filter(v => v !== value) : [...values, value];

  // ── Per-exercise state ───────────────────────────────────────────────────
  const isMastered = useMemo(() => {
    return (exercise: Exercise): boolean => {
      const progress = progressMap.get(exercise.id);
      if (!progress) return false;
      const stages = BPM_STAGES.get(exercise.id) ?? [];
      // A laddered exercise is finished when every tempo has been cleared.
      if (stages.length > 0) return (progress.completedBpms?.length ?? 0) >= stages.length;
      const accuracy = progress.micHighScoreAccuracy ?? progress.clickHighScoreAccuracy;
      return accuracy != null && accuracy >= MASTERY_ACCURACY;
    };
  }, [progressMap]);

  // Searchable text per exercise. Rebuilt only when the translator changes, so
  // typing does not re-derive skill labels for 200 exercises on every keystroke.
  const searchIndex = useMemo(() => {
    const index = new Map<string, string>();
    LIBRARY_EXERCISES.forEach(ex => {
      const modes = EXERCISE_MODES.get(ex.id) ?? [];
      const parts = [
        exTitle(ex),
        getExerciseFamily(ex).title,
        typeof ex.description === "string" ? ex.description : "",
        ex.whyItMatters ?? "",
        ...ex.relatedSkills.map(skill => String(t(`skills:skills.${skill}.name` as never))),
        ...ex.relatedSkills.map(skill => SEARCH_ALIASES[skill] ?? ""),
        ...modes.map(mode => PRACTICE_MODE_LABELS[mode]),
        ...modes.map(mode => SEARCH_ALIASES[mode] ?? ""),
      ];
      index.set(ex.id, parts.join(" ").toLowerCase());
    });
    return index;
  }, [t]);

  const searchWords = useMemo(
    () => searchQuery.toLowerCase().split(/\s+/).filter(Boolean),
    [searchQuery]
  );

  /**
   * One exercise against the filter bar. `skip` lets a facet leave itself out of
   * the test, so each pill can show how many exercises it would bring in rather
   * than how many survive its own selection.
   */
  const matchesFilters = useMemo(() => {
    return (
      exercise: Exercise,
      skip?: "skills" | "modes" | "statuses" | "length"
    ): boolean => {
      if (skip !== "skills" && selectedSkills.length > 0) {
        if (!exercise.relatedSkills.some(skill => selectedSkills.includes(skill))) return false;
      }
      if (skip !== "modes" && selectedModes.length > 0) {
        const modes = EXERCISE_MODES.get(exercise.id) ?? [];
        if (!modes.some(mode => selectedModes.includes(mode))) return false;
      }
      if (skip !== "length" && selectedLength) {
        const length = LENGTHS.find(l => l.id === selectedLength);
        if (length && !length.test(exercise.timeInMinutes ?? 0)) return false;
      }
      if (skip !== "statuses" && selectedStatuses.length > 0) {
        const attempted = hasExerciseProgress(progressMap.get(exercise.id));
        const matched = selectedStatuses.some(status => {
          if (status === "new") return isExerciseNew(exercise);
          if (status === "untouched") return !attempted;
          if (status === "mastered") return isMastered(exercise);
          if (status === "inProgress") return attempted && !isMastered(exercise);
          return favoriteExerciseIds.includes(exercise.id);
        });
        if (!matched) return false;
      }
      if (searchWords.length > 0) {
        const haystack = searchIndex.get(exercise.id) ?? "";
        if (!searchWords.every(word => haystack.includes(word))) return false;
      }
      return true;
    };
  }, [
    selectedSkills,
    selectedModes,
    selectedLength,
    selectedStatuses,
    searchWords,
    searchIndex,
    progressMap,
    favoriteExerciseIds,
    isMastered,
  ]);

  // ── Sets to render ───────────────────────────────────────────────────────
  const visibleSets = useMemo(
    () =>
      EXERCISE_SETS.map(set => {
        const cleared = set.exercises.filter(isMastered).length;
        const started = set.exercises.filter(
          ex => hasExerciseProgress(progressMap.get(ex.id)) && !isMastered(ex)
        ).length;
        return {
          set,
          cleared,
          started,
          matches: set.exercises.filter(ex => matchesFilters(ex)),
        };
      })
        .filter(entry => entry.matches.length > 0)
        .sort((a, b) => {
          // Sets holding something new come first, then anything half-finished
          // (picking practice back up beats starting over), then alphabetically
          // — a stable order the player can learn. Sorting by size instead would
          // just front-load the three biggest families every single visit.
          const aNew = a.matches.some(ex => isExerciseNew(ex));
          const bNew = b.matches.some(ex => isExerciseNew(ex));
          if (aNew !== bNew) return aNew ? -1 : 1;
          if (a.started !== b.started) return b.started - a.started;
          return a.set.title.localeCompare(b.set.title);
        }),
    [matchesFilters, isMastered, progressMap]
  );

  const totalMatches = visibleSets.reduce((sum, entry) => sum + entry.matches.length, 0);

  /** Mastered / started across everything currently on screen. */
  const matchedProgress = useMemo(() => {
    const matched = visibleSets.flatMap(entry => entry.matches);
    return {
      mastered: matched.filter(isMastered).length,
      started: matched.filter(
        ex => hasExerciseProgress(progressMap.get(ex.id)) && !isMastered(ex)
      ).length,
    };
  }, [visibleSets, isMastered, progressMap]);

  /**
   * Sets grouped under the skill they train. Without this the list is 45 cards
   * in a flat alphabetical run, where four Ear Training sets sit apart from each
   * other and every card has to repeat its own skill name and icon. The group
   * header carries both once, so a card is left with just its name.
   */
  const skillGroupedSets = useMemo(() => {
    const bySkill = new Map<GuitarSkillId, typeof visibleSets>();
    visibleSets.forEach(entry => {
      const skill = entry.set.exercises[0].relatedSkills[0];
      const bucket = bySkill.get(skill);
      if (bucket) bucket.push(entry);
      else bySkill.set(skill, [entry]);
    });

    const categoryOrder = ["technique", "theory", "hearing", "creativity"];
    return Array.from(bySkill.entries())
      .map(([skillId, sets]) => {
        const skill = guitarSkills.find(s => s.id === skillId);
        return {
          skillId,
          skill,
          label: String(t(`skills:skills.${skillId}.name` as never)),
          category: skill?.category ?? "technique",
          sets,
        };
      })
      // Category first so the browser reads in the same order as the Skill Tree,
      // then alphabetically — a fixed order that does not move between visits.
      .sort((a, b) => {
        const byCategory =
          categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        return byCategory !== 0 ? byCategory : a.label.localeCompare(b.label);
      });
  }, [visibleSets, t]);

  /**
   * Ten of the nineteen skills own exactly one set, and a full header wrapping a
   * single one-line card is more chrome than content. Those fall into one group
   * at the end, where the cards carry their own tile and skill name instead.
   */
  const { groupedSkills, looseSets } = useMemo(
    () => ({
      groupedSkills: skillGroupedSets.filter(group => group.sets.length > 1),
      looseSets: skillGroupedSets
        .filter(group => group.sets.length === 1)
        .flatMap(group => group.sets.map(entry => ({ ...entry, group }))),
    }),
    [skillGroupedSets]
  );

  // ── Facet counts, so a pill never leads to an empty screen ───────────────
  const skillCounts = useMemo(() => {
    const counts = new Map<GuitarSkillId, number>();
    LIBRARY_EXERCISES.forEach(ex => {
      if (!matchesFilters(ex, "skills")) return;
      ex.relatedSkills.forEach(skill => counts.set(skill, (counts.get(skill) ?? 0) + 1));
    });
    return counts;
  }, [matchesFilters]);

  const modeCounts = useMemo(() => {
    const counts = new Map<PracticeMode, number>();
    LIBRARY_EXERCISES.forEach(ex => {
      if (!matchesFilters(ex, "modes")) return;
      (EXERCISE_MODES.get(ex.id) ?? []).forEach(mode =>
        counts.set(mode, (counts.get(mode) ?? 0) + 1)
      );
    });
    return counts;
  }, [matchesFilters]);

  // Every pill row carries a count, not just the modes — a row without them read
  // as the less important one.
  const statusCounts = useMemo(() => {
    const counts = new Map<StatusId, number>();
    LIBRARY_EXERCISES.forEach(ex => {
      if (!matchesFilters(ex, "statuses")) return;
      const attempted = hasExerciseProgress(progressMap.get(ex.id));
      const mastered = isMastered(ex);
      const bump = (id: StatusId) => counts.set(id, (counts.get(id) ?? 0) + 1);
      if (isExerciseNew(ex)) bump("new");
      if (!attempted) bump("untouched");
      if (mastered) bump("mastered");
      if (attempted && !mastered) bump("inProgress");
      if (favoriteExerciseIds.includes(ex.id)) bump("favorite");
    });
    return counts;
  }, [matchesFilters, progressMap, isMastered, favoriteExerciseIds]);

  const lengthCounts = useMemo(() => {
    const counts = new Map<LengthId, number>();
    LIBRARY_EXERCISES.forEach(ex => {
      if (!matchesFilters(ex, "length")) return;
      const length = LENGTHS.find(l => l.test(ex.timeInMinutes ?? 0));
      if (length) counts.set(length.id, (counts.get(length.id) ?? 0) + 1);
    });
    return counts;
  }, [matchesFilters]);

  /** How many skills the picker would show — the number on its collapsed row. */
  const availableSkillCount = useMemo(
    () => guitarSkills.filter(skill => (skillCounts.get(skill.id) ?? 0) > 0).length,
    [skillCounts]
  );

  /** Skills grouped under their category, with the empty ones dropped. */
  const skillGroups = useMemo(() => {
    const categories: { category: string; label: string }[] = [
      { category: "technique", label: "Technique" },
      { category: "theory", label: "Theory" },
      { category: "hearing", label: "Hearing" },
      { category: "creativity", label: "Creativity" },
    ];
    return categories
      .map(({ category, label }) => ({
        label,
        skills: guitarSkills
          .filter(skill => skill.category === category)
          .filter(skill => (skillCounts.get(skill.id) ?? 0) > 0 || selectedSkills.includes(skill.id))
          .sort((a, b) =>
            String(t(`skills:skills.${a.id}.name` as never)).localeCompare(
              String(t(`skills:skills.${b.id}.name` as never))
            )
          ),
      }))
      .filter(group => group.skills.length > 0);
  }, [skillCounts, selectedSkills, t]);

  // ── Leaderboard ranks, fetched only for rows actually on screen ──────────
  // The old table fetched a rank per row of the current page; with no paging
  // that would be 200 count queries, so ranks load when a set is opened.
  const expandedExerciseIds = useMemo(
    () =>
      visibleSets
        .filter(entry => expandedSets.includes(entry.set.id))
        .flatMap(entry => entry.matches.map(ex => ex.id)),
    [visibleSets, expandedSets]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchRanks = async () => {
      const results = await Promise.all(
        expandedExerciseIds.map(async id => {
          const progress = progressMap.get(id);
          const score =
            progress?.micHighScore || progress?.earTrainingHighScore || progress?.clickHighScore;
          if (!score || score <= 0) return null;
          const rank = await getExerciseUserRank(id, score);
          return rank === null ? null : { id, rank };
        })
      );

      if (cancelled) return;
      const fetched: Record<string, number> = {};
      results.forEach(result => {
        if (result) fetched[result.id] = result.rank;
      });
      if (Object.keys(fetched).length > 0) {
        setLeaderboardRanks(prev => ({ ...prev, ...fetched }));
      }
    };

    if (userAuth && expandedExerciseIds.length > 0) fetchRanks();

    return () => {
      cancelled = true;
    };
  }, [expandedExerciseIds, progressMap, userAuth]);

  const buildChallenge = (exercise: Exercise): DashboardExercise => {
    const skillId = exercise.relatedSkills[0] || "general";
    const skillData = guitarSkills.find(s => s.id === skillId);
    const category =
      skillData?.category || (exercise.category !== "mixed" ? exercise.category : "technique");
    return {
      id: exercise.id,
      title: exTitle(exercise),
      description: typeof exercise.description === "string" ? exercise.description : "",
      category,
      requiredSkillId: skillId,
      requiredLevel: exercise.difficulty === "hard" ? 2 : exercise.difficulty === "medium" ? 1 : 0,
      rewardDescription: "Practice complete",
      exercises: [exercise],
      unlockDescription: "",
      streakDays: 0,
      intensity: "medium",
      shortGoal: "",
      accentColor: "#ffffff",
      difficulty: exercise.difficulty,
      tablature: exercise.tablature,
    };
  };

  const handleToggleFavorite = (exerciseId: string) => {
    if (!userAuth) return;
    dispatch(
      toggleFavoriteExercise({
        exerciseId,
        isFavorite: !favoriteExerciseIds.includes(exerciseId),
      })
    );
  };

  const handleStart = (exercise: Exercise) => {
    if (exercise.premium && !isPremium) {
      onShowUpgrade();
      return;
    }
    onStartExercise(buildChallenge(exercise));
  };

  const handleStartPreview = () => {
    if (!previewExercise) return;
    const exercise = previewExercise;
    setPreviewExercise(null);
    handleStart(exercise);
  };

  const formatMinutes = (minutes: number) =>
    minutes < 1 ? `${Math.round(minutes * 60)} s` : `${Number(minutes.toFixed(1))} min`;

  const rankClass = (rank: number) =>
    rank === 1
      ? "bg-amber-500/20 text-amber-500"
      : rank === 2
        ? "bg-zinc-300/20 text-zinc-300"
        : rank === 3
          ? "bg-amber-700/20 text-amber-600"
          : "bg-zinc-800/60 text-zinc-400";

  // ── Filter controls, shared by the desktop bar and the mobile sheet ──────
  const groupLabel = "text-[11px] font-bold tracking-wider text-zinc-500";

  const skillPills = (big = false) =>
    skillGroups.map(group => (
      <div key={group.label} className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-zinc-600">{group.label}</span>
        {group.skills.map(skill => {
          const Icon = skill.icon;
          const active = selectedSkills.includes(skill.id);
          return (
            <button
              key={skill.id}
              onClick={() => setSelectedSkills(prev => toggle(prev, skill.id))}
              aria-pressed={active}
              className={cn(filterPill(active, big), "flex items-center gap-1.5")}
            >
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
              {String(t(`skills:skills.${skill.id}.name` as never))}
              <span className="tabular-nums opacity-50">{skillCounts.get(skill.id) ?? 0}</span>
            </button>
          );
        })}
      </div>
    ));

  const modePills = (big = false) =>
    PRACTICE_MODES.filter(
      mode => (modeCounts.get(mode) ?? 0) > 0 || selectedModes.includes(mode)
    ).map(mode => {
      const Icon = MODE_ICONS[mode];
      const active = selectedModes.includes(mode);
      return (
        <button
          key={mode}
          onClick={() => setSelectedModes(prev => toggle(prev, mode))}
          aria-pressed={active}
          className={cn(filterPill(active, big), "flex items-center gap-1.5")}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {PRACTICE_MODE_LABELS[mode]}
          <span className="tabular-nums opacity-50">{modeCounts.get(mode) ?? 0}</span>
        </button>
      );
    });

  const statusPills = (big = false) =>
    STATUSES.map(status => (
      <button
        key={status.id}
        onClick={() => setSelectedStatuses(prev => toggle(prev, status.id))}
        aria-pressed={selectedStatuses.includes(status.id)}
        className={cn(filterPill(selectedStatuses.includes(status.id), big), "flex items-center gap-1.5")}
      >
        {status.label}
        <span className="tabular-nums opacity-50">{statusCounts.get(status.id) ?? 0}</span>
      </button>
    ));

  const lengthPills = (big = false) => [
    <button
      key="any"
      onClick={() => setSelectedLength(null)}
      aria-pressed={selectedLength === null}
      className={filterPill(selectedLength === null, big)}
    >
      Any length
    </button>,
    ...LENGTHS.map(length => {
      const active = selectedLength === length.id;
      return (
        <button
          key={length.id}
          onClick={() => setSelectedLength(active ? null : length.id)}
          aria-pressed={active}
          className={cn(filterPill(active, big), "flex items-center gap-1.5")}
        >
          {length.label}
          <span className="tabular-nums opacity-50">{lengthCounts.get(length.id) ?? 0}</span>
        </button>
      );
    }),
  ];

  const activeFilterChips = [
    ...selectedSkills.map(skill => ({
      key: `skill-${skill}`,
      label: String(t(`skills:skills.${skill}.name` as never)),
      clear: () => setSelectedSkills(prev => prev.filter(s => s !== skill)),
    })),
    ...selectedModes.map(mode => ({
      key: `mode-${mode}`,
      label: PRACTICE_MODE_LABELS[mode],
      clear: () => setSelectedModes(prev => prev.filter(m => m !== mode)),
    })),
    ...selectedStatuses.map(status => ({
      key: `status-${status}`,
      label: STATUSES.find(s => s.id === status)?.label ?? status,
      clear: () => setSelectedStatuses(prev => prev.filter(s => s !== status)),
    })),
    ...(selectedLength
      ? [
          {
            key: "length",
            label: LENGTHS.find(l => l.id === selectedLength)?.label ?? "",
            clear: () => setSelectedLength(null),
          },
        ]
      : []),
  ];

  // ── One variant row inside an expanded set ──────────────────────────────
  const renderExerciseRow = (exercise: Exercise, showVariantLabel: boolean) => {
    const progress = progressMap.get(exercise.id);
    const stages = BPM_STAGES.get(exercise.id) ?? [];
    const completedBpms = progress?.completedBpms ?? [];
    const hasBpmProgress = stages.length > 0 && completedBpms.length > 0;
    const bpmPct = hasBpmProgress ? Math.round((completedBpms.length / stages.length) * 100) : 0;
    const micScore = progress?.micHighScore;
    const earScore = progress?.earTrainingHighScore;
    const clickScore = progress?.clickHighScore;
    const attempted = hasExerciseProgress(progress);
    const mastered = isMastered(exercise);
    const isLocked = !!exercise.premium && !isPremium;
    const isFavorite = favoriteExerciseIds.includes(exercise.id);
    const rank = leaderboardRanks[exercise.id];
    const hasLeaderboard =
      stages.length > 0 ||
      !!exercise.riddleConfig ||
      isClickAnsweredMode(exercise.noteHuntConfig?.mode) ||
      (!!exercise.tablature && exercise.tablature.length > 0);

    const resultText = hasBpmProgress
      ? `${Math.max(...completedBpms)} BPM`
      : micScore != null && micScore > 0
        ? progress?.micHighScoreAccuracy != null
          ? `${progress.micHighScoreAccuracy}%`
          : `${micScore} pts`
        : earScore != null && earScore > 0
          ? `${earScore} pts`
          : clickScore != null && clickScore > 0
            ? progress?.clickHighScoreAccuracy != null
              ? `${progress.clickHighScoreAccuracy}%`
              : `${clickScore} pts`
            // Open exercises — improv prompts, play-alongs, ear quizzes — have no
            // number to show, so the fact it was played is the whole result.
            : progress?.completedAt
              ? "Done"
              : null;

    return (
      <div
        key={exercise.id}
        // The row is the unit you act on, so it marks itself under the pointer.
        // Its hover step stays below the icon buttons' own, which sit on top of
        // it — otherwise hovering an icon would look like hovering the row.
        className="flex items-center gap-2.5 rounded px-2 py-3 transition-colors duration-150 hover:bg-zinc-800/60 active:bg-zinc-800/40 sm:gap-3 sm:bg-zinc-800/30 sm:px-3"
      >
        {/* Only a finished or started exercise gets a mark. An empty circle on
            every untouched row said nothing and was most of what the eye saw.
            The slot keeps its width so the names stay in one column. */}
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {mastered ? (
            <Check className="h-3 w-3 text-emerald-400" strokeWidth={3} />
          ) : attempted ? (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="In progress" />
          ) : null}
        </span>

        {/* Name, level and length travel together, so the row reads as one
            phrase instead of two islands with a blank gap between them.
            No "New" chip here — the set header already carries it, and the New
            filter narrows the rows to exactly those. */}
        <button
          onClick={() => setPreviewExercise(exercise)}
          // The colour sits here, not on the span: an explicit `text-zinc-300`
          // on the child ignored the button's `hover:text-white`, so the name
          // never actually reacted to the pointer.
          className="flex min-w-0 flex-1 items-baseline gap-2.5 truncate text-left text-zinc-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
          title={exTitle(exercise)}
        >
          <span className="truncate text-[14px]">
            {showVariantLabel ? getVariantLabel(exercise) : exTitle(exercise)}
          </span>
          <span
            className="hidden shrink-0 text-[12px] font-semibold capitalize lg:inline"
            style={{ color: DIFFICULTY_HEX[exercise.difficulty] ?? DIFFICULTY_HEX.easy }}
          >
            {exercise.difficulty}
          </span>
          <span className="hidden shrink-0 text-[12px] tabular-nums text-zinc-600 lg:inline">
            {formatMinutes(exercise.timeInMinutes ?? 0)}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          {rank != null && (
            <span
              className={cn(
                "flex h-[22px] min-w-[30px] items-center justify-center rounded px-1 text-[12px] font-bold tabular-nums",
                rankClass(rank)
              )}
            >
              #{rank}
            </span>
          )}
          {resultText ? (
            hasBpmProgress ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-[72px] text-right text-[12px] font-bold tabular-nums text-zinc-300">
                    {resultText}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-zinc-200">
                      {completedBpms.length} / {stages.length} tempos · {bpmPct}%
                    </span>
                    <div className="h-1 w-32 overflow-hidden rounded-full bg-zinc-700">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: `${bpmPct}%` }}
                      />
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="w-[72px] text-right text-[12px] font-bold tabular-nums text-zinc-300">
                {resultText}
              </span>
            )
          ) : (
            <span className="hidden w-16 sm:block" />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {userAuth && (
            <button
              onClick={() => handleToggleFavorite(exercise.id)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50",
                isFavorite
                  ? "text-rose-400 hover:bg-rose-500/20"
                  : "text-zinc-500 hover:bg-white/10 hover:text-rose-300"
              )}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={isFavorite}
            >
              <Heart size={15} className={cn(isFavorite && "fill-current")} />
            </button>
          )}
          <button
            onClick={() => setPreviewExercise(exercise)}
            className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
            title="Exercise details"
            aria-label="Exercise details"
          >
            <Info size={15} />
          </button>
          {hasLeaderboard && (
            <button
              onClick={() => onShowLeaderboard(exercise.id, exTitle(exercise))}
              className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-amber-500/20 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50"
              title="Leaderboard"
              aria-label="Leaderboard"
            >
              <Trophy size={15} />
            </button>
          )}
        </div>

        {isLocked ? (
          <button
            onClick={onShowUpgrade}
            className="flex shrink-0 items-center gap-1 rounded bg-amber-500/10 px-3 py-2 text-[13px] font-bold text-amber-500 transition-colors hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50"
          >
            <Lock size={12} />
            Pro
          </button>
        ) : (
          <button
            onClick={() => handleStart(exercise)}
            className="flex shrink-0 items-center gap-1 rounded bg-zinc-100 py-2 pl-3 pr-3.5 text-[13px] font-bold text-zinc-950 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <ChevronRight size={14} strokeWidth={2.5} />
            Start
          </button>
        )}
      </div>
    );
  };

  /**
   * One collapsible set. `skill` is passed only for the sets that sit outside a
   * skill group — inside a group the header already names the skill, so a badge
   * on every card would just repeat it.
   */
  const renderSetCard = (
    entry: (typeof visibleSets)[number],
    skill?: { category: string; icon?: GuitarSkill["icon"]; label: string }
  ) => {
    const { set, matches } = entry;
    const isExpanded = expandedSets.includes(set.id);
    const isSingle = set.exercises.length === 1;

    return (
      <div
        key={set.id}
        className="overflow-hidden rounded-lg border border-white/[0.02] bg-white/[0.02] backdrop-blur-sm"
      >
        {/* `group` and the hover live on the header, not on the card. On the card
            they fired from anywhere inside it, so pointing at a variant row lit
            up the header and nudged its chevron while the row itself stayed
            dead — the pointer never marked what it was actually over. */}
        <button
          onClick={() => setExpandedSets(prev => toggle(prev, set.id))}
          aria-expanded={isExpanded}
          className="group flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors duration-200 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 sm:px-4"
        >
          {skill && (
            <SkillIconTile category={skill.category} icon={skill.icon} size="sm" />
          )}

          <span className="truncate text-[15px] font-semibold text-zinc-100">{set.title}</span>

          {!isSingle && (
            <span className="shrink-0 text-[12px] tabular-nums text-zinc-600">
              {matches.length < set.exercises.length
                ? `${matches.length}/${set.exercises.length}`
                : set.exercises.length}
            </span>
          )}

          {matches.some(ex => isExerciseNew(ex)) && (
            <Chip color="cyan" className="shrink-0 rounded px-1.5 py-0 text-[10px] tracking-wider">
              New
            </Chip>
          )}

          {skill && (
            <span
              className={cn(
                "hidden truncate text-[12px] font-semibold sm:inline",
                getSkillAccentClass(skill.category)
              )}
            >
              {skill.label}
            </span>
          )}

          <ChevronRight
            className={cn(
              "ml-auto h-4 w-4 shrink-0 text-zinc-700 transition-all duration-300 group-hover:text-zinc-200",
              isExpanded ? "rotate-90" : "group-hover:translate-x-1"
            )}
          />
        </button>

        {isExpanded && (
          <div className="flex flex-col gap-1 px-2 pb-3 sm:px-3">
            {/* Shown here rather than on every collapsed card: 45 of these
                paragraphs at once is the wall we came from. Padding matches a row
                so the left edges line up. */}
            {set.exercises[0].whyItMatters && (
              <p className="max-w-2xl px-2 pb-2 text-[13px] leading-relaxed text-zinc-500 sm:px-3">
                {set.exercises[0].whyItMatters}
              </p>
            )}
            {matches.map(exercise => renderExerciseRow(exercise, !isSingle))}
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-24 pt-5 sm:gap-6 sm:pt-6 lg:px-6">
        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 rounded-lg bg-zinc-900/60 p-3 sm:gap-4 sm:p-5">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search: shred, warm up, no guitar, chord changes…"
                // text-base on mobile stops iOS Safari zooming in on focus.
                className="h-11 w-full rounded-lg bg-zinc-800/70 pl-9 pr-9 text-base text-zinc-200 transition-colors placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 sm:h-10 sm:text-[15px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-zinc-500 transition-colors hover:text-zinc-300"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-bold transition-colors sm:hidden",
                activeFilterCount > 0 ? "bg-cyan-500/15 text-cyan-400" : "bg-zinc-800/70 text-zinc-400"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500/25 px-1 text-[11px] tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Applied filters stay visible on mobile while the sheet is closed */}
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:hidden">
              {activeFilterChips.map(chip => (
                <button
                  key={chip.key}
                  onClick={chip.clear}
                  className={cn(filterPill(true), "flex items-center gap-1 pr-2")}
                >
                  {chip.label}
                  <X className="h-3 w-3 opacity-60" />
                </button>
              ))}
            </div>
          )}

          {/* Desktop: filters inline */}
          <div className="hidden flex-col gap-3.5 sm:flex">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(groupLabel, "mr-1")}>How you practice</span>
                {modePills()}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(groupLabel, "mr-1")}>Status</span>
                {statusPills()}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(groupLabel, "mr-1")}>Length</span>
                {lengthPills()}
              </div>
            </div>

            {/* All 22 skills laid out flat took three rows and buried everything
                under it, so they open on demand and the chosen ones stay in view. */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowSkills(open => !open)}
                aria-expanded={showSkills}
                className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <ChevronRight
                  className={cn("h-3.5 w-3.5 transition-transform", showSkills && "rotate-90")}
                />
                Skill
                {/* Without a number this row was a grey word with a chevron and
                    nothing to say it hid 22 filters. */}
                {selectedSkills.length > 0 ? (
                  <span className="tabular-nums text-cyan-400">
                    {selectedSkills.length} selected
                  </span>
                ) : (
                  <span className="tabular-nums font-medium text-zinc-600">
                    {availableSkillCount}
                  </span>
                )}
              </button>

              {!showSkills &&
                selectedSkills.map(skill => (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkills(prev => toggle(prev, skill))}
                    className={cn(filterPill(true), "flex items-center gap-1 pr-2")}
                  >
                    {String(t(`skills:skills.${skill}.name` as never))}
                    <X className="h-3 w-3 opacity-60" />
                  </button>
                ))}
            </div>

            {showSkills && (
              <div className="flex flex-col gap-2.5 rounded-lg bg-zinc-950/40 p-3">{skillPills()}</div>
            )}

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 self-start text-[12px] font-bold text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Mobile: filters live in a bottom sheet so the list keeps the screen */}
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent
            side="bottom"
            className="flex max-h-[85vh] flex-col gap-0 rounded-t-lg bg-zinc-950 p-0 sm:hidden"
          >
            <SheetTitle className="px-5 pb-2 pt-5 text-lg font-bold text-white">Filters</SheetTitle>

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 py-4">
              <div className="flex flex-col gap-2.5">
                <span className={groupLabel}>Skill</span>
                <div className="flex flex-col gap-3">{skillPills(true)}</div>
              </div>
              <div className="flex flex-col gap-2.5">
                <span className={groupLabel}>How you practice</span>
                <div className="flex flex-wrap gap-2">{modePills(true)}</div>
              </div>
              <div className="flex flex-col gap-2.5">
                <span className={groupLabel}>Status</span>
                <div className="flex flex-wrap gap-2">{statusPills(true)}</div>
              </div>
              <div className="flex flex-col gap-2.5">
                <span className={groupLabel}>Length</span>
                <div className="flex flex-wrap gap-2">{lengthPills(true)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-zinc-950 px-5 pb-6 pt-4">
              <button
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className="h-11 rounded-lg bg-zinc-900 px-4 text-sm font-bold text-zinc-400 transition-colors disabled:opacity-40"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="h-11 flex-1 rounded-lg bg-zinc-100 text-sm font-bold text-zinc-950 transition-colors active:bg-zinc-300"
              >
                Show {totalMatches} exercise{totalMatches !== 1 ? "s" : ""}
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Sets ── */}
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-zinc-500">
            {visibleSets.length} set{visibleSets.length !== 1 ? "s" : ""} · {totalMatches} exercise
            {totalMatches !== 1 ? "s" : ""}
            {/* The library size alone said nothing about the player. */}
            {matchedProgress.mastered > 0 && (
              <span className="text-emerald-400"> · {matchedProgress.mastered} mastered</span>
            )}
            {matchedProgress.started > 0 && (
              <span className="text-amber-400"> · {matchedProgress.started} in progress</span>
            )}
          </p>

          <div className="flex flex-col gap-8">
            {groupedSkills.map(group => (
              <div key={group.skillId} className="flex flex-col gap-2">
                {/* The skill is stated once here instead of on every card, which
                    also stops identical tiles stacking up inside a group. */}
                <div className="flex items-center gap-3 px-1">
                  <SkillIconTile category={group.category} icon={group.skill?.icon} size="sm" />
                  <span className={cn('text-base font-bold', getSkillAccentClass(group.category))}>
                    {group.label}
                  </span>
                  <span className="text-[12px] tabular-nums text-zinc-600">
                    {group.sets.length} sets
                  </span>
                </div>

                {group.sets.map(entry => renderSetCard(entry))}
              </div>
            ))}

            {looseSets.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 px-1">
                  <span className="text-base font-bold text-zinc-400">One-off skills</span>
                  <span className="text-[12px] tabular-nums text-zinc-600">
                    {looseSets.length} sets
                  </span>
                </div>

                {looseSets.map(entry =>
                  renderSetCard(entry, {
                    category: entry.group.category,
                    icon: entry.group.skill?.icon,
                    label: entry.group.label,
                  })
                )}
              </div>
            )}

            {visibleSets.length === 0 && (
              <div className="flex flex-col items-center gap-4 rounded-lg bg-zinc-900/40 px-4 py-12 text-center">
                <p className="text-sm text-zinc-500">No exercises match the current filters.</p>
                {(activeFilterCount > 0 || searchQuery) && (
                  <button
                    onClick={() => {
                      clearFilters();
                      setSearchQuery("");
                    }}
                    className="h-9 rounded-lg bg-zinc-800 px-4 text-[13px] font-bold text-zinc-200 transition-colors hover:bg-zinc-700"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <ExercisePreviewDialog
          exercise={previewExercise}
          onClose={() => setPreviewExercise(null)}
          onStart={handleStartPreview}
        />
      </div>
    </TooltipProvider>
  );
};
