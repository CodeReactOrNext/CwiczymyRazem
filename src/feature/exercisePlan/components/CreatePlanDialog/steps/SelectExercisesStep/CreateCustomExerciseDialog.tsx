
import { Button } from "assets/components/ui/button";
import { Checkbox } from "assets/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { Textarea } from "assets/components/ui/textarea";
import { cn } from "assets/lib/utils";
import { createCommunityExercise } from "feature/communityExercises/services/communityExerciseService";
import type { CreateCommunityExerciseInput } from "feature/communityExercises/types";
import {
  SETUP_DIALOG_BODY,
  SETUP_DIALOG_CONTENT,
  SETUP_DIALOG_FOOTER,
  SETUP_FIELD,
  SETUP_SURFACE,
} from "feature/exercisePlan/components/setupDialogStyles";
import type {
    BackingTrack,
    DifficultyLevel,
    Exercise,
    ExerciseCategory,
    TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";
import { ImportTablature } from "feature/songs/components/ImportTablature/ImportTablature";
import { uploadUserGpFile } from "feature/songs/services/userGpFiles.service";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { FileMusic, Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import type { Instrument } from "utils/audio/tunings";

interface CreateCustomExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExerciseCreate: (exercise: Exercise) => void;
  /** Fired after a copy landed in the user's own exercise library. */
  onSavedToLibrary?: () => void;
  initialData?: Exercise;
  mode?: "create" | "edit" | "clone";
}

export const CreateCustomExerciseDialog = ({
  open,
  onOpenChange,
  onExerciseCreate,
  onSavedToLibrary,
  initialData,
  mode = "create",
}: CreateCustomExerciseDialogProps) => {
  const { t } = useTranslation(["exercises", "common", "plans"]);
  const userId = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("5");
  const [category, setCategory] = useState<ExerciseCategory>("technique");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");

  const [instructions, setInstructions] = useState<string[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState("");

  const [tips, setTips] = useState<string[]>([]);
  const [currentTip, setCurrentTip] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isImageValid, setIsImageValid] = useState(true);

  const [useMetronome, setUseMetronome] = useState(false);
  const [minBpm, setMinBpm] = useState("60");
  const [maxBpm, setMaxBpm] = useState("180");
  const [recommendedBpm, setRecommendedBpm] = useState("80");

  // GP file state
  const [gpTablature, setGpTablature] = useState<TablatureMeasure[] | null>(null);
  const [gpBackingTracks, setGpBackingTracks] = useState<BackingTrack[] | null>(null);
  const [gpInstrument, setGpInstrument] = useState<Instrument>("guitar");
  const [gpFileName, setGpFileName] = useState<string | null>(null);
  const [gpRawFile, setGpRawFile] = useState<File | null>(null);
  const [gpFileCleared, setGpFileCleared] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Mirrors the exercise into the user's own library (privately), so an
  // exercise written here isn't stranded inside this one plan — it shows up on
  // /my-exercises and in the "My Exercises" source tab like any other.
  const [saveToLibrary, setSaveToLibrary] = useState(mode === "create");
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);

  // Effect to reset/initialize when open status changes
  useEffect(() => {
    if (open) {
      // Only a brand-new exercise defaults to being saved — editing or cloning
      // an existing one shouldn't quietly pile up copies in the library.
      setSaveToLibrary(mode === "create");
      if (initialData && (mode === "edit" || mode === "clone")) {
        setTitle(initialData.title);
        setDescription(initialData.description);
        setDuration(initialData.timeInMinutes.toString());
        setCategory(initialData.category);
        setDifficulty(initialData.difficulty);
        setInstructions(initialData.instructions);
        setTips(initialData.tips);
        setVideoUrl(initialData.videoUrl || "");
        setImageUrl(initialData.imageUrl || "");

        if (initialData.metronomeSpeed) {
          setUseMetronome(true);
          setMinBpm(initialData.metronomeSpeed.min.toString());
          setMaxBpm(initialData.metronomeSpeed.max.toString());
          setRecommendedBpm(initialData.metronomeSpeed.recommended.toString());
        } else {
          setUseMetronome(false);
        }

        setGpFileCleared(false);
        if (initialData.gpFileUrl) {
          setGpFileName("(uploaded GP file)");
          setGpTablature(null);
          setGpBackingTracks(null);
        } else if (initialData.tablature && initialData.tablature.length > 0) {
          setGpTablature(initialData.tablature);
          setGpBackingTracks(initialData.backingTracks ?? null);
          setGpInstrument(initialData.instrument ?? "guitar");
          setGpFileName("(existing GP data)");
        } else {
          setGpFileName(null);
          setGpTablature(null);
          setGpBackingTracks(null);
        }
      } else if (mode === "create") {
          resetForm();
      }
    }
  }, [open, initialData, mode]);

  const handleGpImported = (
    measures: TablatureMeasure[],
    fileName: string,
    tempo: number,
    trackName: string,
    backingTracks: BackingTrack[],
    rawFile: File,
    instrument: Instrument
  ) => {
    setGpTablature(measures);
    setGpInstrument(instrument);
    setGpBackingTracks(backingTracks);
    setGpFileName(fileName);
    setGpRawFile(rawFile);

    // Auto-fill title if still empty
    if (!title.trim()) {
      const base = fileName.replace(/\.gp\w*$/i, "");
      setTitle(trackName ? `${base} - ${trackName}` : base);
    }

    // Auto-set metronome from file tempo
    setUseMetronome(true);
    const bpm = tempo.toString();
    setRecommendedBpm(bpm);
    setMinBpm(Math.max(40, Math.round(tempo * 0.5)).toString());
    setMaxBpm(Math.min(300, Math.round(tempo * 1.5)).toString());
  };

  const clearGpFile = () => {
    setGpTablature(null);
    setGpBackingTracks(null);
    setGpFileName(null);
    setGpRawFile(null);
    setGpFileCleared(true);
  };

  const handleAddInstruction = () => {
      if (currentInstruction.trim()) {
          setInstructions([...instructions, currentInstruction.trim()]);
          setCurrentInstruction("");
      }
  };

  const handleRemoveInstruction = (index: number) => {
      setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleAddTip = () => {
      if (currentTip.trim()) {
          setTips([...tips, currentTip.trim()]);
          setCurrentTip("");
      }
  };

  const handleRemoveTip = (index: number) => {
      setTips(tips.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!title.trim()) {
        toast.error(t("exercises:custom_exercise.title_required"));
        return;
    }

    const finalInstructions = currentInstruction.trim()
      ? [...instructions, currentInstruction.trim()]
      : instructions;
    const finalTips = currentTip.trim()
      ? [...tips, currentTip.trim()]
      : tips;

    let gpFileUrl: string | undefined;
    if (gpRawFile) {
      if (!userId) {
        toast.error(t("plans:custom.login_required"));
        return;
      }
      setIsUploading(true);
      try {
        const uploaded = await uploadUserGpFile(userId, gpRawFile);
        gpFileUrl = uploaded.downloadUrl;
      } catch {
        toast.error(t("plans:custom.upload_error"));
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // Preserve existing gpFileUrl in edit mode when no new file was uploaded (unless user explicitly cleared it)
    const effectiveGpFileUrl = gpFileUrl ?? (mode === "edit" && !gpFileCleared ? initialData?.gpFileUrl : undefined);
    const hasGpFile = !!effectiveGpFileUrl;

    const newExercise: Exercise = {
      id: mode === "edit" ? (initialData?.id || `custom-${Date.now()}`) : `custom-${Date.now()}`,
      title: title,
      description: description,
      difficulty,
      category,
      timeInMinutes: parseInt(duration) || 5,
      instructions: finalInstructions,
      tips: finalTips,
      metronomeSpeed: useMetronome ? {
        min: parseInt(minBpm) || 60,
        max: parseInt(maxBpm) || 180,
        recommended: parseInt(recommendedBpm) || 80,
      } : null,
      relatedSkills: [],
      videoUrl: (gpTablature || hasGpFile) ? null : (videoUrl.trim() || null),
      imageUrl: (gpTablature || hasGpFile) ? null : (imageUrl.trim() || null),
      // Only store inline tablature when there is no GP file URL — avoids Firestore 1MB limit
      ...(!hasGpFile && gpTablature && { tablature: gpTablature }),
      ...(!hasGpFile && gpBackingTracks && gpBackingTracks.length > 0 && { backingTracks: gpBackingTracks }),
      ...(!hasGpFile && gpTablature && gpInstrument === "bass" && { instrument: gpInstrument }),
      ...(effectiveGpFileUrl && { gpFileUrl: effectiveGpFileUrl }),
    };

    let librarySave: "saved" | "failed" | null = null;
    if (saveToLibrary && userId) {
      const libraryInput: CreateCommunityExerciseInput = {
        title: newExercise.title,
        description: newExercise.description,
        category: newExercise.category,
        difficulty: newExercise.difficulty,
        relatedSkills: newExercise.relatedSkills,
        metronomeSpeed: newExercise.metronomeSpeed,
        timeInMinutes: newExercise.timeInMinutes,
        instructions: newExercise.instructions,
        tips: newExercise.tips,
        tablature: newExercise.tablature ?? [],
        videoUrl: newExercise.videoUrl ?? null,
        imageUrl: newExercise.imageUrl ?? null,
        ...(newExercise.gpFileUrl && { gpFileUrl: newExercise.gpFileUrl }),
        ...(newExercise.backingTracks && { backingTracks: newExercise.backingTracks }),
        ...(newExercise.instrument && { instrument: newExercise.instrument }),
        // Always private — the plan creator is not a publishing flow. The user
        // can publish it later from My Exercises.
        isPublic: false,
      };

      setIsSavingToLibrary(true);
      const savedId = await createCommunityExercise(
        libraryInput,
        userId,
        userInfo?.displayName || t("plans:custom.anonymous")
      );
      setIsSavingToLibrary(false);
      librarySave = savedId ? "saved" : "failed";
      if (savedId) onSavedToLibrary?.();
    }

    onExerciseCreate(newExercise);
    onOpenChange(false);

    const savedToLibrary = librarySave === "saved"
      ? { description: t("plans:custom.saved_privately") }
      : undefined;

    if (mode === "edit") {
        toast.success(t("exercises:custom_exercise.edit_success"), savedToLibrary);
    } else if (mode === "clone") {
        toast.success(t("exercises:custom_exercise.clone_success"), savedToLibrary);
    } else {
        toast.success(t("exercises:custom_exercise.created_success"), savedToLibrary);
    }

    if (librarySave === "failed") {
      toast.error(t("plans:custom.library_save_error"));
    }

    resetForm();
  };

  const resetForm = () => {
      setTitle("");
      setDescription("");
      setDuration("5");
      setCategory("technique");
      setDifficulty("medium");
      setInstructions([]);
      setTips([]);
      setCurrentInstruction("");
      setCurrentTip("");
      setVideoUrl("");
      setImageUrl("");
      setIsImageValid(true);
      setUseMetronome(false);
      setMinBpm("60");
      setMaxBpm("180");
      setRecommendedBpm("80");
      setGpTablature(null);
      setGpBackingTracks(null);
      setGpFileName(null);
      setGpRawFile(null);
      setGpFileCleared(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SETUP_DIALOG_CONTENT}>
        <DialogHeader className='shrink-0'>
          <DialogTitle>
            {mode === "edit"
              ? t("exercises:custom_exercise.edit_button")
              : t("exercises:custom_exercise.title")}
          </DialogTitle>
          <DialogDescription>
            {t("exercises:custom_exercise.description")}
          </DialogDescription>
        </DialogHeader>

        <div className={SETUP_DIALOG_BODY}>
          <form
            id='create-exercise-form'
            onSubmit={handleSubmit}
            className='flex flex-col gap-8'>
            {/* GP File Upload */}
            <div className='space-y-2'>
              <Label>
                {t("plans:custom.gp_file")}{" "}
                <span className='font-normal text-zinc-400'>
                  {t("plans:optional")}
                </span>
              </Label>

              {gpFileName ? (
                <div className={cn(
                    "flex items-center justify-between gap-3 py-2 pl-4 pr-2",
                    SETUP_SURFACE
                  )}>
                  <div className='flex min-w-0 items-center gap-2.5'>
                    <FileMusic className='h-4 w-4 shrink-0 text-zinc-400' />
                    <span className='truncate text-sm font-medium text-zinc-100'>
                      {gpFileName}
                    </span>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={clearGpFile}
                    aria-label={t("plans:custom.remove_gp")}
                    title={t("plans:custom.remove_gp")}>
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              ) : (
                <ImportTablature onImported={handleGpImported} />
              )}
            </div>

            {/* Title and Description Group */}
            <div className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='title'>
                  {t("exercises:custom_exercise.exercise_title")}
                </Label>
                <Input
                  className={SETUP_FIELD}
                  id='title'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("plans:custom.title_placeholder")}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>
                  {t("exercises:custom_exercise.exercise_desc")}
                </Label>
                <Textarea
                  id='description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='...'
                  className={cn(SETUP_FIELD, "h-auto min-h-[100px] resize-none py-3")}
                />
              </div>

              {/* Video URL — hidden when GP file loaded */}
              {!gpTablature && (
                <div className='space-y-2'>
                  <Label htmlFor='videoUrl'>
                    {t("exercises:custom_exercise.video_url", {
                      defaultValue: "YouTube Link",
                    })}
                  </Label>
                  <Input
                    className={SETUP_FIELD}
                    id='videoUrl'
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder='https://www.youtube.com/watch?v=...'
                  />
                </div>
              )}

              {/* Image URL — hidden when GP file loaded */}
              {!gpTablature && (
                <div className='space-y-2'>
                  <Label htmlFor='imageUrl'>
                    {t("exercises:custom_exercise.image_url", {
                      defaultValue: "Image URL (Tab/Score)",
                    })}
                  </Label>
                  <Input
                    className={SETUP_FIELD}
                    id='imageUrl'
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setIsImageValid(true);
                    }}
                    placeholder='https://example.com/image.png'
                  />
                  {imageUrl && (
                    <div className={cn(
                        "relative mt-2 aspect-[3.5/1] w-full overflow-hidden",
                        SETUP_SURFACE
                      )}>
                      <img
                        src={imageUrl}
                        alt={t("plans:details.preview")}
                        className='h-full w-full object-contain'
                        onError={() => setIsImageValid(false)}
                        onLoad={() => setIsImageValid(true)}
                      />
                      {!isImageValid && (
                        <div className='absolute inset-0 flex items-center justify-center bg-zinc-950/80 text-xs font-medium text-rose-400'>
                          {t("exercises:custom_exercise.invalid_image", {
                            defaultValue: "Invalid image URL",
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Properties Grid */}
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='duration'>
                  {t("exercises:custom_exercise.duration")}
                </Label>
                <Input
                  className={SETUP_FIELD}
                  id='duration'
                  type='number'
                  min='1'
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='difficulty'>
                  {t("exercises:custom_exercise.difficulty")}
                </Label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                  <SelectTrigger id='difficulty' className={SETUP_FIELD}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='beginner'>
                      {t("exercises:difficulty.beginner")}
                    </SelectItem>
                    <SelectItem value='easy'>
                      {t("exercises:difficulty.easy")}
                    </SelectItem>
                    <SelectItem value='medium'>
                      {t("exercises:difficulty.medium")}
                    </SelectItem>
                    <SelectItem value='hard'>
                      {t("exercises:difficulty.hard")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor='category'>
                  {t("exercises:custom_exercise.category")}
                </Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as ExerciseCategory)}>
                  <SelectTrigger id='category' className={SETUP_FIELD}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='technique'>
                      {t("exercises:categories.technique")}
                    </SelectItem>
                    <SelectItem value='theory'>
                      {t("exercises:categories.theory")}
                    </SelectItem>
                    <SelectItem value='creativity'>
                      {t("exercises:categories.creativity")}
                    </SelectItem>
                    <SelectItem value='hearing'>
                      {t("exercises:categories.hearing")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Metronome Settings */}
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Checkbox
                  id='metronome'
                  checked={useMetronome}
                  onCheckedChange={(checked) => setUseMetronome(!!checked)}
                />
                <Label htmlFor='metronome' className='cursor-pointer'>
                  {t("exercises:custom_exercise.use_metronome", {
                    defaultValue: "Use Metronome",
                  })}
                </Label>
              </div>

              {useMetronome && (
                <div className='grid grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='minBpm'>{t("plans:custom.min_bpm")}</Label>
                    <Input
                      className={SETUP_FIELD}
                      id='minBpm'
                      type='number'
                      value={minBpm}
                      onChange={(e) => setMinBpm(e.target.value)}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='maxBpm'>{t("plans:custom.max_bpm")}</Label>
                    <Input
                      className={SETUP_FIELD}
                      id='maxBpm'
                      type='number'
                      value={maxBpm}
                      onChange={(e) => setMaxBpm(e.target.value)}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='recBpm'>{t("plans:custom.rec_bpm")}</Label>
                    <Input
                      className={SETUP_FIELD}
                      id='recBpm'
                      type='number'
                      value={recommendedBpm}
                      onChange={(e) => setRecommendedBpm(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className='space-y-2'>
              <Label htmlFor='instruction-input'>
                {t("exercises:custom_exercise.instructions")}
              </Label>
              <div className='flex gap-2'>
                <Input
                  className={SETUP_FIELD}
                  id='instruction-input'
                  value={currentInstruction}
                  onChange={(e) => setCurrentInstruction(e.target.value)}
                  placeholder={t(
                    "exercises:custom_exercise.add_instruction_placeholder"
                  )}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddInstruction())
                  }
                />
                <Button
                  type='button'
                  variant='secondary'
                  size='icon'
                  onClick={handleAddInstruction}
                  aria-label={t("exercises:custom_exercise.instructions")}
                  className='h-11 w-11 shrink-0'>
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              {instructions.length > 0 ? (
                <ul className='space-y-2 pt-2'>
                  {instructions.map((inst, index) => (
                    <li
                      key={index}
                      className={cn(
                        "flex items-start gap-3 py-2 pl-3 pr-2 text-sm",
                        SETUP_SURFACE
                      )}>
                      <span className='mt-1.5 shrink-0 text-xs tabular-nums text-zinc-400'>
                        {index + 1}.
                      </span>
                      <span className='flex-1 break-words pt-1 leading-relaxed text-zinc-200'>
                        {inst}
                      </span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => handleRemoveInstruction(index)}
                        aria-label={t("common:button.remove" as any)}
                        className='shrink-0'>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-xs text-zinc-400'>
                  {t("exercises:custom_exercise.no_instructions_hint", {
                    defaultValue: "No instructions added yet.",
                  })}
                </p>
              )}
            </div>

            {/* Tips */}
            <div className='space-y-2'>
              <Label htmlFor='tip-input'>
                {t("exercises:custom_exercise.tips")}
              </Label>
              <div className='flex gap-2'>
                <Input
                  className={SETUP_FIELD}
                  id='tip-input'
                  value={currentTip}
                  onChange={(e) => setCurrentTip(e.target.value)}
                  placeholder={t("exercises:custom_exercise.add_tip_placeholder")}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddTip())
                  }
                />
                <Button
                  type='button'
                  variant='secondary'
                  size='icon'
                  onClick={handleAddTip}
                  aria-label={t("exercises:custom_exercise.tips")}
                  className='h-11 w-11 shrink-0'>
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              {tips.length > 0 ? (
                <ul className='space-y-2 pt-2'>
                  {tips.map((tip, index) => (
                    <li
                      key={index}
                      className={cn(
                        "flex items-start gap-3 py-2 pl-3 pr-2 text-sm",
                        SETUP_SURFACE
                      )}>
                      <span className='flex-1 break-words pt-1 leading-relaxed text-zinc-200'>
                        {tip}
                      </span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => handleRemoveTip(index)}
                        aria-label={t("common:button.remove" as any)}
                        className='shrink-0'>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-xs text-zinc-400'>
                  {t("exercises:custom_exercise.no_tips_hint", {
                    defaultValue: "No tips added yet.",
                  })}
                </p>
              )}
            </div>

            {/* Keep a copy outside this plan */}
            {userId && (
              <div className='flex items-start gap-3'>
                <Checkbox
                  id='saveToLibrary'
                  checked={saveToLibrary}
                  onCheckedChange={(checked) => setSaveToLibrary(!!checked)}
                  className='mt-0.5 shrink-0'
                />
                <div className='space-y-1'>
                  <Label htmlFor='saveToLibrary' className='cursor-pointer'>
                    {t("plans:custom.save_to_mine")}
                  </Label>
                  <p className='text-xs leading-relaxed text-zinc-400'>
                    {t("plans:custom.save_to_mine_hint")}
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className={SETUP_DIALOG_FOOTER}>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t("common:cancel" as any)}
          </Button>
          <Button
            type='submit'
            form='create-exercise-form'
            disabled={isUploading || isSavingToLibrary}>
            {isUploading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {t("plans:custom.uploading")}
              </>
            ) : isSavingToLibrary ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {t("plans:saving")}
              </>
            ) : mode === "edit" ? (
              t("exercises:custom_exercise.save_button")
            ) : (
              t("common:create" as any)
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
