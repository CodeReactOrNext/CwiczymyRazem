import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import {
  createCommunityExercise,
  getCommunityExerciseById,
  updateCommunityExercise,
} from "feature/communityExercises/services/communityExerciseService";
import type { CreateCommunityExerciseInput } from "feature/communityExercises/types";
import type {
  DifficultyLevel,
  ExerciseCategory,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkillId } from "feature/skills/skills.types";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Globe,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: "technique", label: "Technique" },
  { value: "theory", label: "Theory" },
  { value: "hearing", label: "Ear Training" },
  { value: "creativity", label: "Creativity" },
  { value: "mixed", label: "Mixed" },
];

const DIFFICULTIES: {
  value: DifficultyLevel;
  label: string;
  color: string;
  dot: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    color: "text-sky-400",
    dot: "bg-sky-400",
  },
  {
    value: "easy",
    label: "Easy",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  {
    value: "medium",
    label: "Medium",
    color: "text-amber-400",
    dot: "bg-amber-400",
  },
  { value: "hard", label: "Hard", color: "text-rose-400", dot: "bg-rose-400" },
];

// Group the skill chips under the same category labels the browse UI uses —
// a flat wall of 20+ chips is unscannable.
const SKILL_GROUPS: { category: string; label: string }[] = [
  { category: "technique", label: "Technique" },
  { category: "theory", label: "Theory" },
  { category: "hearing", label: "Ear Training" },
  { category: "creativity", label: "Creativity" },
];

const fieldClass = (hasError?: boolean) =>
  cn(
    "w-full rounded-lg bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-cyan-500/60",
    hasError && "ring-1 ring-rose-500/60",
  );

const labelClass = "text-xs font-bold tracking-wide text-zinc-500";

function FormSection({
  title,
  description,
  children,
  error,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <section className='space-y-3 rounded-lg bg-zinc-900/40 p-6'>
      <div className='space-y-1'>
        <h2 className='text-sm font-bold text-zinc-100'>{title}</h2>
        {description && <p className='text-xs text-zinc-500'>{description}</p>}
      </div>
      {children}
      {error && <p className='text-xs text-rose-400'>{error}</p>}
    </section>
  );
}

const PublishExercisePage: NextPageWithLayout = () => {
  const router = useRouter();
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);

  const editId =
    typeof router.query.edit === "string" ? router.query.edit : null;
  const isEditing = !!editId;

  const [tablature, setTablature] = useState<TablatureMeasure[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExerciseCategory>("technique");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [selectedSkills, setSelectedSkills] = useState<GuitarSkillId[]>([]);
  const [timeInMinutes, setTimeInMinutes] = useState(5);
  const [bpmMin, setBpmMin] = useState(60);
  const [bpmMax, setBpmMax] = useState(120);
  const [bpmRecommended, setBpmRecommended] = useState(80);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [tips, setTips] = useState<string[]>([""]);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = localStorage.getItem("tab-editor-draft");
    if (raw) {
      try {
        setTablature(JSON.parse(raw));
      } catch {}
    }
  }, []);

  // In edit mode, load the existing exercise and prefill the form.
  useEffect(() => {
    if (!editId) return;
    getCommunityExerciseById(editId).then((ex) => {
      if (!ex) return;
      setTitle(ex.title);
      setDescription(ex.description);
      setCategory(ex.category);
      setDifficulty(ex.difficulty);
      setSelectedSkills(ex.relatedSkills ?? []);
      setTimeInMinutes(ex.timeInMinutes);
      if (ex.metronomeSpeed) {
        setBpmMin(ex.metronomeSpeed.min);
        setBpmMax(ex.metronomeSpeed.max);
        setBpmRecommended(ex.metronomeSpeed.recommended);
      }
      setInstructions(ex.instructions?.length ? ex.instructions : [""]);
      setTips(ex.tips?.length ? ex.tips : [""]);
      setIsPublic(ex.isPublic);
      // Fall back to the saved tablature if the editor draft was lost.
      setTablature((prev) => (prev.length > 0 ? prev : (ex.tablature ?? [])));
    });
  }, [editId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (instructions.filter((i) => i.trim()).length === 0)
      newErrors.instructions = "At least one instruction is required.";
    if (bpmMin < 20 || bpmMax > 300 || bpmMin >= bpmMax)
      newErrors.bpm = "BPM range is invalid. Min must be lower than Max.";
    if (bpmRecommended < bpmMin || bpmRecommended > bpmMax)
      newErrors.bpm = "Recommended BPM must be between Min and Max.";
    if (tablature.length === 0)
      newErrors.tablature =
        "No tablature data found. Go back to the Tab Editor and click Publish from there.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!userAuth || !userInfo) {
      setErrors({ auth: "You must be logged in to publish an exercise." });
      return;
    }

    setIsSubmitting(true);

    const input: CreateCommunityExerciseInput = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      relatedSkills: selectedSkills,
      metronomeSpeed: { min: bpmMin, max: bpmMax, recommended: bpmRecommended },
      timeInMinutes,
      instructions: instructions.filter((i) => i.trim()),
      tips: tips.filter((t) => t.trim()),
      tablature,
      isPublic,
    };

    const ok = isEditing
      ? await updateCommunityExercise(editId, input)
      : !!(await createCommunityExercise(
          input,
          userAuth,
          userInfo.displayName || "Anonymous",
        ));

    setIsSubmitting(false);

    if (ok) {
      localStorage.removeItem("tab-editor-draft");
      setSubmitted(true);
    } else {
      setErrors({ submit: "Something went wrong. Please try again." });
    }
  };

  const toggleSkill = (skillId: GuitarSkillId) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : [...prev, skillId],
    );
  };

  const updateListItem = (
    list: string[],
    setList: (v: string[]) => void,
    idx: number,
    value: string,
  ) => {
    const next = [...list];
    next[idx] = value;
    setList(next);
  };

  const addListItem = (list: string[], setList: (v: string[]) => void) => {
    setList([...list, ""]);
  };

  const removeListItem = (
    list: string[],
    setList: (v: string[]) => void,
    idx: number,
  ) => {
    if (list.length === 1) return;
    setList(list.filter((_, i) => i !== idx));
  };

  const bpmValid =
    bpmMin >= 20 &&
    bpmMax <= 300 &&
    bpmMin < bpmMax &&
    bpmRecommended >= bpmMin &&
    bpmRecommended <= bpmMax;

  // Live readiness checklist for the summary rail — mirrors validate() so the
  // user sees what's missing before hitting Publish instead of after.
  const checklist: { label: string; done: boolean }[] = [
    { label: "Tablature loaded", done: tablature.length > 0 },
    { label: "Title", done: !!title.trim() },
    { label: "Description", done: !!description.trim() },
    {
      label: "At least one instruction",
      done: instructions.some((i) => i.trim()),
    },
    { label: "Valid BPM range", done: bpmValid },
  ];
  const readyCount = checklist.filter((c) => c.done).length;
  const isReady = readyCount === checklist.length;

  const activeDifficulty = DIFFICULTIES.find((d) => d.value === difficulty);
  const activeCategory = CATEGORIES.find((c) => c.value === category);

  if (submitted) {
    return (
      <div className='flex min-h-[70vh] items-center justify-center p-8'>
        <div className='w-full max-w-md space-y-6 text-center'>
          <div
            className={cn(
              "mx-auto flex h-16 w-16 items-center justify-center rounded-lg",
              isPublic ? "bg-emerald-500/20" : "bg-cyan-500/20",
            )}>
            {isPublic ? (
              <Check className='text-emerald-400' size={32} />
            ) : (
              <Lock className='text-cyan-400' size={32} />
            )}
          </div>
          <div className='space-y-2'>
            <h2 className='text-2xl font-black tracking-tight text-zinc-100'>
              {isEditing
                ? "Changes Saved!"
                : isPublic
                  ? "Exercise Published!"
                  : "Exercise Saved Privately!"}
            </h2>
            <p className='text-sm leading-relaxed text-zinc-400'>
              {isEditing
                ? "Your exercise has been updated."
                : isPublic
                  ? "Your exercise is now live in the Community library. Other users can discover, practice, and rate it."
                  : "Your exercise is saved privately. Only you can see and practice it. You can make it public at any time."}
            </p>
          </div>
          <div className='flex justify-center gap-3'>
            <Button
              onClick={() =>
                router.push(
                  isEditing ? "/my-exercises" : "/profile/skills?tab=community",
                )
              }
              className={cn(
                "shadow-none",
                isPublic
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-cyan-500 text-black hover:bg-cyan-400",
              )}>
              {isEditing
                ? "Back to My Exercises"
                : isPublic
                  ? "View in Library"
                  : "View My Exercises"}
            </Button>
            <Button
              variant='secondary'
              onClick={() => router.push("/tab-editor")}>
              Back to Editor
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Publish Exercise | Riff Quest</title>
      </Head>
      <div className='mx-auto w-full max-w-6xl space-y-8 px-4 py-8'>
        {/* Header */}
        <div className='space-y-4'>
          <BackLink
            label='Back to Editor'
            onClick={() => router.push("/tab-editor")}
          />
          <div>
            <h1 className='text-3xl font-black tracking-tight text-zinc-100'>
              {isEditing ? "Edit Exercise" : "Publish Exercise"}
            </h1>
            <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
              {isEditing
                ? "Update the details of your exercise below. Changes are saved immediately."
                : "Share your exercise with the community. Fill in the details below so others know how to practice it."}
            </p>
          </div>
        </div>

        <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start'>
          <div className='min-w-0 space-y-8'>
            {/* Tablature preview */}
            <FormSection title='Tablature Preview'>
              {tablature.length > 0 ? (
                <div className='space-y-2'>
                  <div className='overflow-hidden rounded-lg'>
                    <TablatureViewer
                      measures={tablature}
                      bpm={80}
                      isPlaying={false}
                      startTime={null}
                      className='h-[220px]'
                    />
                  </div>
                  <p className='text-xs text-zinc-600'>
                    {tablature.length} measure
                    {tablature.length !== 1 ? "s" : ""} · loaded from Tab Editor
                  </p>
                </div>
              ) : (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-lg p-4",
                    errors.tablature ? "bg-rose-500/5" : "bg-zinc-950/40",
                  )}>
                  <AlertCircle
                    size={16}
                    className='mt-0.5 shrink-0 text-rose-400'
                  />
                  <p className='text-sm text-zinc-400'>
                    {errors.tablature ||
                      "No tablature found. Please go back to the Tab Editor and click Publish from there."}
                  </p>
                </div>
              )}
            </FormSection>

            {/* Title & Description */}
            <FormSection title='Basics'>
              <div className='space-y-2'>
                <div className='flex items-baseline justify-between'>
                  <label className={labelClass}>
                    Title <span className='text-rose-500'>*</span>
                  </label>
                  <span className='text-[10px] tabular-nums text-zinc-600'>
                    {title.length}/100
                  </span>
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='e.g. Spider Exercise — 1-2-3-4 Permutation'
                  maxLength={100}
                  className={fieldClass(!!errors.title)}
                />
                {errors.title && (
                  <p className='text-xs text-rose-400'>{errors.title}</p>
                )}
              </div>

              <div className='space-y-2'>
                <div className='flex items-baseline justify-between'>
                  <label className={labelClass}>
                    Description <span className='text-rose-500'>*</span>
                  </label>
                  <span className='text-[10px] tabular-nums text-zinc-600'>
                    {description.length}/500
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly explain what this exercise trains and who it's for."
                  rows={3}
                  maxLength={500}
                  className={cn(
                    fieldClass(!!errors.description),
                    "resize-none",
                  )}
                />
                {errors.description && (
                  <p className='text-xs text-rose-400'>{errors.description}</p>
                )}
              </div>

              <div className='grid grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <label className={labelClass}>Category</label>
                  <div className='relative'>
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as ExerciseCategory)
                      }
                      className={cn(fieldClass(), "appearance-none")}>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className={labelClass}>Difficulty</label>
                  <div className='flex gap-2'>
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDifficulty(d.value)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-3 text-xs font-bold transition-colors",
                          difficulty === d.value
                            ? `bg-zinc-800 ${d.color}`
                            : "bg-zinc-950/60 text-zinc-500 hover:text-zinc-300",
                        )}>
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            difficulty === d.value ? d.dot : "bg-zinc-700",
                          )}
                        />
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Time & tempo */}
            <FormSection
              title='Timing'
              description='Set the tempo range users should practice this exercise at.'
              error={errors.bpm}>
              <div className='space-y-2'>
                <label className={labelClass}>
                  Estimated Practice Time (minutes)
                </label>
                <input
                  type='number'
                  min={1}
                  max={60}
                  value={timeInMinutes}
                  onChange={(e) =>
                    setTimeInMinutes(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className={cn(fieldClass(), "w-32")}
                />
              </div>

              <div className='space-y-2'>
                <label className={labelClass}>
                  BPM Range <span className='text-rose-500'>*</span>
                </label>
                <div className='grid grid-cols-3 gap-4'>
                  {(
                    [
                      { label: "Min BPM", value: bpmMin, set: setBpmMin },
                      {
                        label: "Recommended",
                        value: bpmRecommended,
                        set: setBpmRecommended,
                      },
                      { label: "Max BPM", value: bpmMax, set: setBpmMax },
                    ] as const
                  ).map((f) => (
                    <div key={f.label} className='space-y-1'>
                      <label className='text-[10px] font-bold text-zinc-600'>
                        {f.label}
                      </label>
                      <input
                        type='number'
                        min={20}
                        max={300}
                        value={f.value}
                        onChange={(e) => f.set(parseInt(e.target.value) || 60)}
                        className={cn(fieldClass(!!errors.bpm), "py-2")}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </FormSection>

            {/* Related skills */}
            <FormSection
              title='Related Skills'
              description={
                selectedSkills.length > 0
                  ? `${selectedSkills.length} selected — used to surface your exercise to players training these skills.`
                  : "Pick the skills this exercise trains — it helps others find it."
              }>
              <div className='space-y-4'>
                {SKILL_GROUPS.map((group) => {
                  const groupSkills = guitarSkills.filter(
                    (s) => s.category === group.category,
                  );
                  if (groupSkills.length === 0) return null;
                  return (
                    <div key={group.category} className='space-y-2'>
                      <span className='text-[11px] font-semibold text-zinc-600'>
                        {group.label}
                      </span>
                      <div className='flex flex-wrap gap-2'>
                        {groupSkills.map((skill) => {
                          const isSelected = selectedSkills.includes(skill.id);
                          return (
                            <button
                              key={skill.id}
                              onClick={() => toggleSkill(skill.id)}
                              className={cn(
                                "rounded px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                                isSelected
                                  ? "bg-cyan-500/15 text-cyan-300"
                                  : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200",
                              )}>
                              {skill.id.replace(/_/g, " ")}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </FormSection>

            {/* Instructions */}
            <FormSection
              title='Step-by-step Instructions'
              description='Tell the user exactly how to perform this exercise.'
              error={errors.instructions}>
              <div className='space-y-3'>
                {instructions.map((inst, idx) => (
                  <div key={idx} className='flex items-start gap-2'>
                    <span className='mt-3 w-5 text-center text-xs font-bold text-zinc-600'>
                      {idx + 1}.
                    </span>
                    <input
                      value={inst}
                      onChange={(e) =>
                        updateListItem(
                          instructions,
                          setInstructions,
                          idx,
                          e.target.value,
                        )
                      }
                      placeholder={`Step ${idx + 1}…`}
                      className={cn(fieldClass(), "flex-1 py-2.5")}
                    />
                    <button
                      onClick={() =>
                        removeListItem(instructions, setInstructions, idx)
                      }
                      aria-label='Remove step'
                      className='mt-2 p-1.5 text-zinc-600 transition-colors hover:text-rose-400'
                      disabled={instructions.length === 1}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addListItem(instructions, setInstructions)}
                className='flex items-center gap-2 text-xs font-semibold text-zinc-500 transition-colors hover:text-cyan-400'>
                <Plus size={14} />
                Add step
              </button>
            </FormSection>

            {/* Tips */}
            <FormSection
              title='Practice Tips (optional)'
              description='Share helpful hints, common mistakes to avoid, or variations to try.'>
              <div className='space-y-3'>
                {tips.map((tip, idx) => (
                  <div key={idx} className='flex items-start gap-2'>
                    <span className='mt-3 w-5 text-center text-xs font-bold text-zinc-600'>
                      ·
                    </span>
                    <input
                      value={tip}
                      onChange={(e) =>
                        updateListItem(tips, setTips, idx, e.target.value)
                      }
                      placeholder={`Tip ${idx + 1}…`}
                      className={cn(fieldClass(), "flex-1 py-2.5")}
                    />
                    <button
                      onClick={() => removeListItem(tips, setTips, idx)}
                      aria-label='Remove tip'
                      className='mt-2 p-1.5 text-zinc-600 transition-colors hover:text-rose-400'
                      disabled={tips.length === 1}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addListItem(tips, setTips)}
                className='flex items-center gap-2 text-xs font-semibold text-zinc-500 transition-colors hover:text-cyan-400'>
                <Plus size={14} />
                Add tip
              </button>
            </FormSection>

            {/* Visibility picker */}
            <FormSection title='Visibility'>
              <div className='grid grid-cols-2 gap-3'>
                <button
                  type='button'
                  onClick={() => setIsPublic(true)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg p-4 text-left transition-colors",
                    isPublic
                      ? "bg-emerald-500/10"
                      : "bg-zinc-950/40 hover:bg-zinc-900/60",
                  )}>
                  <div className='flex items-center gap-2'>
                    <Globe
                      size={16}
                      className={
                        isPublic ? "text-emerald-400" : "text-zinc-500"
                      }
                    />
                    <span
                      className={cn(
                        "text-sm font-bold",
                        isPublic ? "text-zinc-100" : "text-zinc-400",
                      )}>
                      Public
                    </span>
                    {isPublic && (
                      <Check size={12} className='ml-auto text-emerald-400' />
                    )}
                  </div>
                  <p className='text-xs leading-relaxed text-zinc-500'>
                    Visible to all users in the Community library. Others can
                    practice and rate it.
                  </p>
                </button>
                <button
                  type='button'
                  onClick={() => setIsPublic(false)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg p-4 text-left transition-colors",
                    !isPublic
                      ? "bg-cyan-500/10"
                      : "bg-zinc-950/40 hover:bg-zinc-900/60",
                  )}>
                  <div className='flex items-center gap-2'>
                    <Lock
                      size={16}
                      className={!isPublic ? "text-cyan-400" : "text-zinc-500"}
                    />
                    <span
                      className={cn(
                        "text-sm font-bold",
                        !isPublic ? "text-zinc-100" : "text-zinc-400",
                      )}>
                      Private
                    </span>
                    {!isPublic && (
                      <Check size={12} className='ml-auto text-cyan-400' />
                    )}
                  </div>
                  <p className='text-xs leading-relaxed text-zinc-500'>
                    Only visible to you. Saved to your personal library. You can
                    make it public later.
                  </p>
                </button>
              </div>
              {isPublic && (
                <p className='text-xs leading-relaxed text-zinc-500'>
                  By publishing publicly, you agree that this exercise will be
                  visible to all users under your username{" "}
                  <span className='font-semibold text-cyan-400'>
                    {userInfo?.displayName || "your account"}
                  </span>
                  . The community may rate it. Moderators may remove exercises
                  that violate community guidelines.
                </p>
              )}
            </FormSection>
          </div>

          {/* Summary rail — live preview of the listing, readiness checklist and
            the submit action, always in view on desktop instead of 2000px down. */}
          <aside className='space-y-4 pb-16 lg:sticky lg:top-24'>
            <div className='space-y-5 rounded-lg bg-zinc-900/40 p-5'>
              <div className='space-y-3'>
                <h2 className='text-sm font-bold text-zinc-100'>Summary</h2>
                <p className='min-h-[20px] text-sm font-semibold text-zinc-200'>
                  {title.trim() || (
                    <span className='font-normal text-zinc-600'>
                      Untitled exercise
                    </span>
                  )}
                </p>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-300'>
                    {activeCategory?.label}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold",
                      activeDifficulty?.color,
                    )}>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        activeDifficulty?.dot,
                      )}
                    />
                    {activeDifficulty?.label}
                  </span>
                </div>
                <p className='text-xs leading-relaxed text-zinc-500'>
                  {tablature.length} measure{tablature.length !== 1 ? "s" : ""}{" "}
                  · {timeInMinutes} min · {bpmRecommended} BPM
                  {selectedSkills.length > 0 &&
                    ` · ${selectedSkills.length} skill${
                      selectedSkills.length !== 1 ? "s" : ""
                    }`}
                </p>
                <p className='flex items-center gap-1.5 text-xs font-semibold'>
                  {isPublic ? (
                    <>
                      <Globe size={12} className='text-emerald-400' />
                      <span className='text-emerald-400'>Public</span>
                    </>
                  ) : (
                    <>
                      <Lock size={12} className='text-cyan-400' />
                      <span className='text-cyan-400'>Private</span>
                    </>
                  )}
                </p>
              </div>

              <div className='space-y-2.5'>
                <div className='flex items-baseline justify-between'>
                  <span className={labelClass}>Ready to publish</span>
                  <span className='text-[10px] tabular-nums text-zinc-600'>
                    {readyCount}/{checklist.length}
                  </span>
                </div>
                <ul className='space-y-1.5'>
                  {checklist.map((item) => (
                    <li
                      key={item.label}
                      className='flex items-center gap-2 text-xs'>
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          item.done
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-zinc-800 text-zinc-600",
                        )}>
                        {item.done && <Check size={10} />}
                      </span>
                      <span
                        className={
                          item.done ? "text-zinc-400" : "text-zinc-500"
                        }>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {errors.auth && (
                <div className='flex items-start gap-2 rounded-lg bg-rose-500/5 p-3'>
                  <AlertCircle
                    size={14}
                    className='mt-0.5 shrink-0 text-rose-400'
                  />
                  <p className='text-xs text-rose-400'>{errors.auth}</p>
                </div>
              )}
              {errors.submit && (
                <div className='flex items-start gap-2 rounded-lg bg-rose-500/5 p-3'>
                  <AlertCircle
                    size={14}
                    className='mt-0.5 shrink-0 text-rose-400'
                  />
                  <p className='text-xs text-rose-400'>{errors.submit}</p>
                </div>
              )}

              <div className='space-y-2'>
                <Button
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting || !isReady}
                  className={cn(
                    "w-full shadow-none",
                    isPublic
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "bg-cyan-500 text-black hover:bg-cyan-400",
                  )}>
                  {isSubmitting
                    ? isEditing
                      ? "Saving…"
                      : isPublic
                        ? "Publishing…"
                        : "Saving…"
                    : isEditing
                      ? "Save Changes"
                      : isPublic
                        ? "Publish Exercise"
                        : "Save Privately"}
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => router.push("/tab-editor")}
                  className='w-full'>
                  Cancel
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

PublishExercisePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId='my-exercises'
      subtitle='Publish Exercise'
      variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default PublishExercisePage;
