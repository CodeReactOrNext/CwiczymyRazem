import { useQuery } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import {
  getCommunityExercises,
  getUserCommunityExercises,
} from "feature/communityExercises/services/communityExerciseService";
import type { CommunityExercise } from "feature/communityExercises/types";
import type { Exercise, SongPracticeMode } from "feature/exercisePlan/types/exercise.types";
import { songToExercise } from "feature/exercisePlan/utils/songToExercise";
import { ChordSelectionDialog } from "feature/exercisePlan/views/PracticeSession/components/ChordSelectionDialog";
import { ScaleSelectionDialog } from "feature/exercisePlan/views/PracticeSession/components/ScaleSelectionDialog";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { getAllUserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookOpen, ChevronDown, Globe, Music, Plus, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";

import { AddExerciseTimeDialog } from "./components/AddExerciseTimeDialog";
import type { PendingPlanSong } from "./components/AddSongToPlanDialog";
import { AddSongToPlanDialog } from "./components/AddSongToPlanDialog";
import { ExerciseFilters } from "./components/ExerciseFilters";
import { ExerciseGrid } from "./components/ExerciseGrid";
import { ExercisePreviewDialog } from "./components/ExercisePreviewDialog";
import { SelectedExercisesList } from "./components/SelectedExercisesList";
import { SongPickerList } from "./components/SongPickerList";
import { CreateCustomExerciseDialog } from "./CreateCustomExerciseDialog";
import { useExerciseSelection } from "./hooks/useExerciseSelection";

interface SelectExercisesStepProps {
  selectedExercises: Exercise[];
  onExercisesSelect: (exercises: Exercise[]) => void;
  onNext: () => void;
}

type SourceTab = "library" | "community" | "mine" | "songs";

const SOURCE_TABS: { id: SourceTab; label: string; icon: LucideIcon }[] = [
  { id: "library", label: "Library", icon: BookOpen },
  { id: "community", label: "Community", icon: Globe },
  { id: "mine", label: "My Exercises", icon: User },
  { id: "songs", label: "Songs", icon: Music },
];

/** Prefix keeps ids from the community collection apart from the built-in
 *  library ones — and makes the same exercise resolve to the same id whether it
 *  was picked from the Community tab or from My Exercises. */
const communityExerciseId = (id: string) => `community-${id}`;

const communityToExercise = (ce: CommunityExercise): Exercise => ({
  id: communityExerciseId(ce.id),
  title: ce.title,
  description: ce.description,
  category: ce.category,
  difficulty: ce.difficulty,
  timeInMinutes: ce.timeInMinutes,
  instructions: ce.instructions,
  tips: ce.tips,
  metronomeSpeed: ce.metronomeSpeed,
  relatedSkills: ce.relatedSkills,
  tablature: ce.tablature,
  videoUrl: ce.videoUrl,
  imageUrl: ce.imageUrl,
  gpFileUrl: ce.gpFileUrl,
  backingTracks: ce.backingTracks,
});

const matchesSearch = (exercise: Exercise, search: string) =>
  search === "" ||
  exercise.title.toLowerCase().includes(search.toLowerCase()) ||
  exercise.description?.toLowerCase().includes(search.toLowerCase());

export const SelectExercisesStep = ({
  selectedExercises,
  onExercisesSelect,
  onNext,
}: SelectExercisesStepProps) => {
  const { t } = useTranslation("plans");
  const [isCustomExerciseDialogOpen, setIsCustomExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined);
  const [customExerciseMode, setCustomExerciseMode] = useState<"create" | "edit" | "clone">("create");
  const [isScaleDialogOpen, setIsScaleDialogOpen] = useState(false);
  const [isChordDialogOpen, setIsChordDialogOpen] = useState(false);
  const [pendingExercise, setPendingExercise] = useState<Exercise | undefined>(undefined);
  const [editingBuiltinExercise, setEditingBuiltinExercise] = useState<Exercise | undefined>(undefined);
  const [previewingExercise, setPreviewingExercise] = useState<Exercise | undefined>(undefined);
  const [sourceTab, setSourceTab] = useState<SourceTab>("library");
  const [communityExercises, setCommunityExercises] = useState<Exercise[]>([]);
  const [communitySearch, setCommunitySearch] = useState("");
  const [communityLoading, setCommunityLoading] = useState(false);
  const communityFetched = useRef(false);
  const userAuth = useAppSelector(selectUserAuth);
  const [myExercises, setMyExercises] = useState<CommunityExercise[]>([]);
  const [mySearch, setMySearch] = useState("");
  const [myLoading, setMyLoading] = useState(false);
  const myFetched = useRef(false);
  const [pendingSong, setPendingSong] = useState<PendingPlanSong | null>(null);

  // What each song can be practised with — the attached Guitar Pro file and
  // the sections marked on its video. Fetched only once songs come into play
  // (the Songs tab, or a plan that already holds one); the keys are shared
  // with the songs page, so this is usually a cache hit.
  const hasSongItems = selectedExercises.some((exercise) => !!exercise.songData);
  const songDataEnabled = !!userAuth && (sourceTab === "songs" || hasSongItems);
  const { data: songProgressList } = useQuery({
    queryKey: ["user-song-progress", userAuth],
    queryFn: () => getAllUserSongProgress(userAuth as string),
    enabled: songDataEnabled,
    staleTime: 5 * 60 * 1000,
  });
  const { data: userSongs } = useQuery({
    queryKey: ["user-songs", userAuth],
    queryFn: () => getUserSongs(userAuth as string),
    enabled: songDataEnabled,
    staleTime: 10 * 60 * 1000,
  });
  const gpSongIds = useMemo(
    () =>
      new Set(
        (songProgressList ?? [])
          .filter((progress) => !!progress.gpFileId)
          .map((progress) => progress.songId)
      ),
    [songProgressList]
  );
  const sectionCountBySongId = useMemo(() => {
    if (!userSongs) return null;
    const map = new Map<string, number>();
    [...userSongs.learning, ...userSongs.wantToLearn, ...userSongs.learned].forEach((song) =>
      map.set(song.id, song.totalSections ?? 0)
    );
    return map;
  }, [userSongs]);

  useEffect(() => {
    if (sourceTab !== "community" || communityFetched.current) return;
    communityFetched.current = true;
    setCommunityLoading(true);
    getCommunityExercises()
      .then(data => setCommunityExercises(data.map(communityToExercise)))
      .finally(() => setCommunityLoading(false));
  }, [sourceTab]);

  // The user's own exercises — unlike the Community tab this includes the ones
  // that were never published, so a private draft can still go into a plan.
  const loadMyExercises = useCallback(() => {
    if (!userAuth) return;
    myFetched.current = true;
    setMyLoading(true);
    getUserCommunityExercises(userAuth)
      .then(setMyExercises)
      .finally(() => setMyLoading(false));
  }, [userAuth]);

  useEffect(() => {
    if (sourceTab !== "mine" || myFetched.current) return;
    loadMyExercises();
  }, [sourceTab, loadMyExercises]);

  // Only worth refetching when the list is already on screen — otherwise the
  // first visit to the tab loads it fresh anyway.
  const handleSavedToLibrary = () => {
    if (myFetched.current) loadMyExercises();
  };

  const filteredCommunityExercises = communityExercises.filter(e =>
    matchesSearch(e, communitySearch)
  );

  const myLibraryExercises = useMemo(
    () => myExercises.map(communityToExercise),
    [myExercises]
  );

  const privateExerciseIds = useMemo(
    () =>
      new Set(
        myExercises.filter(e => !e.isPublic).map(e => communityExerciseId(e.id))
      ),
    [myExercises]
  );

  const filteredMyExercises = myLibraryExercises.filter(e =>
    matchesSearch(e, mySearch)
  );

  const {
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    selectedSkill,
    availableSkills,
    groupedExercises,
    filteredExercises,
    handleExerciseToggle,
    setSearchQuery,
    setSelectedCategory,
    setSelectedDifficulty,
    setSelectedSkill,
  } = useExerciseSelection({
    selectedExercises,
    onExercisesSelect,
  });

  const handleExerciseToggleWithTimeModal = (exercise: Exercise) => {
    const isAlreadySelected = selectedExercises.some((e) => e.id === exercise.id);
    if (isAlreadySelected) {
      handleExerciseToggle(exercise);
    } else {
      setPendingExercise(exercise);
    }
  };

  const handleTimeConfirm = (exercise: Exercise, timeInMinutes: number) => {
    const isAlreadySelected = selectedExercises.some((e) => e.id === exercise.id);
    if (isAlreadySelected) {
      onExercisesSelect(selectedExercises.map((e) => (e.id === exercise.id ? { ...e, timeInMinutes } : e)));
    } else {
      onExercisesSelect([...selectedExercises, { ...exercise, timeInMinutes }]);
    }
    setPendingExercise(undefined);
  };

  const handleCustomExerciseCreate = (exercise: Exercise) => {
    if (customExerciseMode === "edit") {
        onExercisesSelect(selectedExercises.map(e => e.id === exercise.id ? exercise : e));
    } else {
        onExercisesSelect([...selectedExercises, exercise]);
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    if (exercise.id.startsWith("custom-")) {
      setEditingExercise(exercise);
      setCustomExerciseMode("edit");
      setIsCustomExerciseDialogOpen(true);
    } else if (exercise.id.startsWith("scale_")) {
      setEditingBuiltinExercise(exercise);
      setIsScaleDialogOpen(true);
    } else if (exercise.id.startsWith("chord_changes_")) {
      setEditingBuiltinExercise(exercise);
      setIsChordDialogOpen(true);
    }
  };

  const handleCloneExercise = (exercise: Exercise) => {
      setEditingExercise(exercise);
      setCustomExerciseMode("clone");
      setIsCustomExerciseDialogOpen(true);
  };

  const handleCreateCustomOpen = () => {
      setEditingExercise(undefined);
      setCustomExerciseMode("create");
      setIsCustomExerciseDialogOpen(true);
  };

  const handleCreateScaleOpen = () => {
      setEditingBuiltinExercise(undefined);
      setIsScaleDialogOpen(true);
  };

  const handleCreateChordOpen = () => {
      setEditingBuiltinExercise(undefined);
      setIsChordDialogOpen(true);
  };

  const handleScaleGenerated = (generatedExercise: Exercise) => {
      if (editingBuiltinExercise) {
         onExercisesSelect(selectedExercises.map(e => e.id === editingBuiltinExercise.id ? generatedExercise : e));
      } else {
         onExercisesSelect([...selectedExercises, generatedExercise]);
      }
      setIsScaleDialogOpen(false);
      setEditingBuiltinExercise(undefined);
  };

  const handleEditTimeRequest = (exercise: Exercise) => {
    // A song item's dialog also carries its practice mode, so the time button
    // reopens that one instead of the plain exercise time dialog.
    if (exercise.songData) {
      const { songId, title, artist, coverUrl, mode } = exercise.songData;
      setPendingSong({
        id: songId,
        title,
        artist,
        coverUrl,
        hasGpFile: gpSongIds.has(songId),
        sectionCount: sectionCountBySongId?.get(songId) ?? null,
        current: { timeInMinutes: exercise.timeInMinutes, mode },
      });
      return;
    }
    setPendingExercise(exercise);
  };

  // A song is settled in its own dialog before it lands in the plan: how it
  // will be practised (attached tab or section map) and how long its slot is.
  const handlePickSong = (song: Song) => {
    setPendingSong({
      id: song.id,
      title: song.title,
      artist: song.artist,
      coverUrl: song.coverUrl,
      hasGpFile: gpSongIds.has(song.id),
      sectionCount: song.totalSections ?? 0,
    });
  };

  const handleSongConfirm = (timeInMinutes: number, mode: SongPracticeMode) => {
    if (!pendingSong) return;
    const item = songToExercise(pendingSong, timeInMinutes, mode);
    const isAlreadySelected = selectedExercises.some((e) => e.id === item.id);
    onExercisesSelect(
      isAlreadySelected
        ? selectedExercises.map((e) => (e.id === item.id ? item : e))
        : [...selectedExercises, item]
    );
    setPendingSong(null);
  };

  const handleReorder = (reordered: Exercise[]) => {
    onExercisesSelect(reordered);
  };

  // The Community and My Exercises tabs render the same list UI — only the
  // source, its search box and the empty state differ.
  const isMineTab = sourceTab === "mine";
  const remoteSearch = isMineTab ? mySearch : communitySearch;
  const setRemoteSearch = isMineTab ? setMySearch : setCommunitySearch;
  const remoteLoading = isMineTab ? myLoading : communityLoading;
  const remoteExercises = isMineTab ? filteredMyExercises : filteredCommunityExercises;
  const remoteEmptyMessage = remoteSearch
    ? t("select.no_search_match")
    : isMineTab
      ? t("select.no_own")
      : t("select.no_community");

  const handleChordGenerated = (generatedExercise: Exercise) => {
      if (editingBuiltinExercise) {
         onExercisesSelect(selectedExercises.map(e => e.id === editingBuiltinExercise.id ? generatedExercise : e));
      } else {
         onExercisesSelect([...selectedExercises, generatedExercise]);
      }
      setIsChordDialogOpen(false);
      setEditingBuiltinExercise(undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className='space-y-6'>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Selected list: narrow column on the right from lg, below the library on phones. */}
        <div className="order-2 lg:col-span-4 lg:sticky top-6 min-w-0 flex flex-col gap-4">
          <SelectedExercisesList
            selectedExercises={selectedExercises}
            onToggleExercise={handleExerciseToggle}
            onEditExercise={handleEditExercise}
            onCloneExercise={handleCloneExercise}
            onEditTimeRequest={handleEditTimeRequest}
            onReorder={handleReorder}
          />
        </div>

        <div className="order-1 lg:col-span-8 space-y-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Source tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-zinc-900 rounded-lg p-1 w-fit">
            {SOURCE_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSourceTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-bold transition-colors ${
                  sourceTab === id
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Building a new exercise is a side path — one menu, not three buttons ahead of the library. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 rounded-lg bg-zinc-800/60 px-4 text-sm font-semibold text-zinc-200 hover:bg-zinc-700/60 hover:text-white">
                <Plus className="h-4 w-4" />
                {t("select.create_exercise")}
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={handleCreateScaleOpen}>{t("select.scale_exercise")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={handleCreateChordOpen}>{t("select.chord_exercise")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={handleCreateCustomOpen}>{t("select.custom_exercise")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>

          {sourceTab === "library" ? (
            <>
              <ExerciseFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedDifficulty={selectedDifficulty}
                onDifficultyChange={setSelectedDifficulty}
                selectedSkill={selectedSkill}
                onSkillChange={setSelectedSkill}
                availableSkills={availableSkills}
                groupedExercises={groupedExercises}
              />

              <ExerciseGrid
                exercises={filteredExercises}
                selectedExercises={selectedExercises}
                onToggleExercise={handleExerciseToggleWithTimeModal}
                onPreviewExercise={setPreviewingExercise}
              />
            </>
          ) : sourceTab === "songs" ? (
            <SongPickerList
              userId={userAuth}
              selectedExercises={selectedExercises}
              gpSongIds={gpSongIds}
              onPickSong={handlePickSong}
              onRemoveSong={handleExerciseToggle}
            />
          ) : (
            <>
              <input
                type="text"
                value={remoteSearch}
                onChange={e => setRemoteSearch(e.target.value)}
                placeholder={isMineTab ? t("select.search_mine") : t("select.search_community")}
                className="w-full h-10 rounded-lg border border-white/10 bg-zinc-900 px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50"
              />
              {remoteLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500" />
                </div>
              ) : remoteExercises.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/5 p-12 text-center">
                  <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed">
                    {remoteEmptyMessage}
                  </p>
                </div>
              ) : (
                <ExerciseGrid
                  exercises={remoteExercises}
                  selectedExercises={selectedExercises}
                  onToggleExercise={handleExerciseToggleWithTimeModal}
                  onPreviewExercise={setPreviewingExercise}
                  privateExerciseIds={isMineTab ? privateExerciseIds : undefined}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Below lg the app bottom nav (58px + safe area) covers the viewport edge — sit above it. */}
      <div className="sticky bottom-[calc(58px_+_0.75rem_+_env(safe-area-inset-bottom,0px))] z-40 flex items-center justify-between gap-3 rounded-lg bg-zinc-900/95 px-4 py-3 backdrop-blur-md lg:bottom-4 lg:z-20 lg:px-5">
        <p className="text-sm text-zinc-300">
          {selectedExercises.length === 0 ? (
            t("select.pick_one")
          ) : (
            <>
              <span className="font-bold text-white">{selectedExercises.length}</span>{" "}
              {selectedExercises.length === 1 ? t("select.exercise_one") : t("select.exercises")} ·{" "}
              <span className="font-bold text-white">
                {Math.round(selectedExercises.reduce((sum, e) => sum + e.timeInMinutes, 0))} {t("min")}
              </span>
            </>
          )}
        </p>
        <Button
          onClick={onNext}
          disabled={selectedExercises.length === 0}
          className="shrink-0 flex items-center gap-2 h-11 px-6 bg-white text-black hover:bg-zinc-200 rounded-lg font-bold transition-all disabled:opacity-40">
          {t("select.next_step")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <CreateCustomExerciseDialog
        open={isCustomExerciseDialogOpen}
        onOpenChange={setIsCustomExerciseDialogOpen}
        onExerciseCreate={handleCustomExerciseCreate}
        onSavedToLibrary={handleSavedToLibrary}
        initialData={editingExercise}
        mode={customExerciseMode}
      />

      <AddExerciseTimeDialog
        exercise={pendingExercise ?? null}
        onConfirm={handleTimeConfirm}
        onCancel={() => setPendingExercise(undefined)}
      />

      <AddSongToPlanDialog
        song={pendingSong}
        onConfirm={handleSongConfirm}
        onCancel={() => setPendingSong(null)}
      />

      <ExercisePreviewDialog
        exercise={previewingExercise ?? null}
        onClose={() => setPreviewingExercise(undefined)}
        hidePlanActions
      />

      <ScaleSelectionDialog
        isOpen={isScaleDialogOpen}
        onClose={() => setIsScaleDialogOpen(false)}
        onExerciseGenerated={handleScaleGenerated}
        initialExercise={editingBuiltinExercise}
      />

      <ChordSelectionDialog
        isOpen={isChordDialogOpen}
        onClose={() => setIsChordDialogOpen(false)}
        onExerciseGenerated={handleChordGenerated}
        initialExercise={editingBuiltinExercise}
      />
    </motion.div>
  );
};
