import { Button } from "assets/components/ui/button";
import {
  getCommunityExercises,
  getUserCommunityExercises,
} from "feature/communityExercises/services/communityExerciseService";
import type { CommunityExercise } from "feature/communityExercises/types";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { ChordSelectionDialog } from "feature/exercisePlan/views/PracticeSession/components/ChordSelectionDialog";
import { ScaleSelectionDialog } from "feature/exercisePlan/views/PracticeSession/components/ScaleSelectionDialog";
import { selectUserAuth } from "feature/user/store/userSlice";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookOpen, Globe, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useAppSelector } from "store/hooks";

import { AddExerciseTimeDialog } from "./components/AddExerciseTimeDialog";
import { ExerciseFilters } from "./components/ExerciseFilters";
import { ExerciseGrid } from "./components/ExerciseGrid";
import { ExercisePreviewDialog } from "./components/ExercisePreviewDialog";
import { SelectedExercisesList } from "./components/SelectedExercisesList";
import { CreateCustomExerciseDialog } from "./CreateCustomExerciseDialog";
import { useExerciseSelection } from "./hooks/useExerciseSelection";

interface SelectExercisesStepProps {
  selectedExercises: Exercise[];
  onExercisesSelect: (exercises: Exercise[]) => void;
  onNext: () => void;
}

type SourceTab = "library" | "community" | "mine";

const SOURCE_TABS: { id: SourceTab; label: string; icon: LucideIcon }[] = [
  { id: "library", label: "Library", icon: BookOpen },
  { id: "community", label: "Community", icon: Globe },
  { id: "mine", label: "My Exercises", icon: User },
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
  const { t } = useTranslation(["exercises", "common"]);
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
    setPendingExercise(exercise);
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
    ? "No exercises match your search."
    : isMineTab
      ? "You haven't created any exercises yet. Build one in the Tab Editor — it shows up here whether you publish it or keep it private."
      : "No community exercises published yet.";

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
      className='space-y-8'>
      <div className='pb-8 flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-3xl font-bold text-zinc-100'>
            {t("exercises:my_plans.create_dialog.exercises")}
          </h2>
          <p className='text-sm text-zinc-500 font-medium max-w-md leading-relaxed mt-1'>
            {t("exercises:my_plans.create_dialog.select_exercises_description")}
          </p>
        </div>
        <Button
          onClick={onNext}
          disabled={selectedExercises.length === 0}
          className="shrink-0 flex items-center gap-2 h-11 px-6 bg-white text-black hover:bg-zinc-200 rounded-lg font-bold transition-all disabled:opacity-40">
          Next step
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 lg:sticky top-6 min-w-0 flex flex-col gap-4">
          <div className="hidden lg:flex flex-wrap gap-2">
            {[
              { label: "Create Scale Exercise",  onClick: handleCreateScaleOpen,  cls: "border-indigo-500/30 bg-indigo-950/40 text-indigo-300 hover:border-indigo-400/60 hover:bg-indigo-950/60 hover:text-indigo-200" },
              { label: "Create Chord Exercise",  onClick: handleCreateChordOpen,  cls: "border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-950/60 hover:text-emerald-200" },
              { label: "Create Custom Exercise", onClick: handleCreateCustomOpen, cls: "border-zinc-600/40 bg-zinc-900/40 text-zinc-400 hover:border-zinc-500/60 hover:bg-zinc-800/50 hover:text-zinc-200" },
            ].map(({ label, onClick, cls }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`inline-flex items-center gap-2 h-8 px-3 rounded-lg border text-xs font-bold tracking-tight transition-colors ${cls}`}
              >
                <FaPlus className="h-2.5 w-2.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          <SelectedExercisesList
            selectedExercises={selectedExercises}
            onToggleExercise={handleExerciseToggle}
            onEditExercise={handleEditExercise}
            onCloneExercise={handleCloneExercise}
            onEditTimeRequest={handleEditTimeRequest}
            onReorder={handleReorder}
          />
        </div>

        <div className="lg:col-span-7 space-y-6 min-w-0">
          {/* Source tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-zinc-900 border border-white/5 rounded-lg p-1 w-fit">
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

              <div className="flex lg:hidden flex-wrap gap-2">
                {[
                  { label: "Create Scale Exercise",  onClick: handleCreateScaleOpen,  cls: "border-indigo-500/30 bg-indigo-950/40 text-indigo-300 hover:border-indigo-400/60 hover:bg-indigo-950/60 hover:text-indigo-200" },
                  { label: "Create Chord Exercise",  onClick: handleCreateChordOpen,  cls: "border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-950/60 hover:text-emerald-200" },
                  { label: "Create Custom Exercise", onClick: handleCreateCustomOpen, cls: "border-zinc-600/40 bg-zinc-900/40 text-zinc-400 hover:border-zinc-500/60 hover:bg-zinc-800/50 hover:text-zinc-200" },
                ].map(({ label, onClick, cls }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={onClick}
                    className={`inline-flex items-center gap-2 h-8 px-3 rounded-lg border text-xs font-bold tracking-tight transition-all ${cls}`}
                  >
                    <FaPlus className="h-2.5 w-2.5 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>

              <ExerciseGrid
                exercises={filteredExercises}
                selectedExercises={selectedExercises}
                onToggleExercise={handleExerciseToggleWithTimeModal}
                onPreviewExercise={setPreviewingExercise}
              />
            </>
          ) : (
            <>
              <input
                type="text"
                value={remoteSearch}
                onChange={e => setRemoteSearch(e.target.value)}
                placeholder={isMineTab ? "Search your exercises…" : "Search community exercises…"}
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

      <ExercisePreviewDialog
        exercise={previewingExercise ?? null}
        onClose={() => setPreviewingExercise(undefined)}
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
