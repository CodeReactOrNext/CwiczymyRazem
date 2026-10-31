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
import { hasTablatureNotes } from "feature/exercisePlan/utils/hasTablatureNotes";
import {
  clearTabEditorDraft,
  readTabEditorDraft,
  readTabEditorDraftInstrument,
} from "feature/exercisePlan/utils/tabEditorDraft";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkillId } from "feature/skills/skills.types";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import { Interpolate } from "lib/i18n/Interpolate";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Compass,
  FileMusic,
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
import type { Instrument } from "utils/audio/tunings";

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
  const { t } = useTranslation("library");
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);

  const editId =
    typeof router.query.edit === "string" ? router.query.edit : null;
  const isEditing = !!editId;
  // Every way back to the editor has to carry the exercise being edited —
  // dropping it turned the round-trip into a brand new exercise, so "Save
  // changes" came back as "Publish exercise" and the filled-in details were
  // replaced by an empty form.
  const editorHref = editId ? `/tab-editor?edit=${editId}` : "/tab-editor";
  // Set by the "Publish" button on My Exercises when the exercise still needs
  // details filled in — the form opens with Public already picked.
  const publishRequested = router.query.publish === "1";

  const [tablature, setTablature] = useState<TablatureMeasure[]>([]);
  const [instrument, setInstrument] = useState<Instrument>("guitar");
  // A Guitar Pro upload from the plan creator. The Tab Editor can't open those,
  // so the way back leads to My Exercises instead of an empty grid.
  const [hasGpFile, setHasGpFile] = useState(false);
  const backHref = hasGpFile ? "/my-exercises" : editorHref;
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
    if (!router.isReady) return;
    const draft = readTabEditorDraft(editId);
    if (draft) {
      setTablature(draft);
      setInstrument(readTabEditorDraftInstrument(editId) ?? "guitar");
    }
  }, [router.isReady, editId]);

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
      setIsPublic(ex.isPublic || publishRequested);
      setHasGpFile(!!ex.gpFileUrl);
      // Fall back to the saved tablature if the editor draft was lost.
      setTablature((prev) => (prev.length > 0 ? prev : (ex.tablature ?? [])));
      if (!readTabEditorDraft(editId)) setInstrument(ex.instrument ?? "guitar");
    });
  }, [editId, publishRequested]);

  // Some exercises genuinely have no tab (they're driven by their steps alone),
  // so an untouched grid from the editor is a valid submission — it's just
  // stored as no tablature at all, which is what makes the session render the
  // open-exercise panel instead of an empty tab.
  const hasTab = hasTablatureNotes(tablature);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = t("publish.err_title");
    if (!description.trim()) newErrors.description = t("publish.err_description");
    if (instructions.filter((i) => i.trim()).length === 0)
      newErrors.instructions = t("publish.err_instructions");
    if (bpmMin < 20 || bpmMax > 300 || bpmMin >= bpmMax)
      newErrors.bpm = t("publish.err_bpm_range");
    if (bpmRecommended < bpmMin || bpmRecommended > bpmMax)
      newErrors.bpm = t("publish.err_bpm_recommended");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!userAuth || !userInfo) {
      setErrors({ auth: t("publish.err_auth") });
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
      tablature: hasTab ? tablature : [],
      // Always written, so turning a bass tab back into a guitar one sticks on update.
      instrument,
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
      clearTabEditorDraft();
      setSubmitted(true);
    } else {
      setErrors({ submit: t("publish.err_submit") });
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
    { label: t("publish.title_label"), done: !!title.trim() },
    { label: t("publish.description_label"), done: !!description.trim() },
    {
      label: t("publish.check_instruction"),
      done: instructions.some((i) => i.trim()),
    },
    { label: t("publish.check_bpm"), done: bpmValid },
  ];
  const readyCount = checklist.filter((c) => c.done).length;
  const isReady = readyCount === checklist.length;

  const activeDifficulty = DIFFICULTIES.find((d) => d.value === difficulty);
  const activeCategory = CATEGORIES.find((c) => c.value === category);
  const categoryName = (value: string) => t(`common:categories.${value}`, value);
  const difficultyName = (value: string) => t(`common:difficulty.${value}`, value);

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
                ? t("publish.done_saved")
                : isPublic
                  ? t("publish.done_published")
                  : t("publish.done_private")}
            </h2>
            <p className='text-sm leading-relaxed text-zinc-400'>
              {isEditing
                ? t("publish.done_saved_body")
                : isPublic
                  ? t("publish.done_published_body")
                  : t("publish.done_private_body")}
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
                ? t("my_exercises.back")
                : isPublic
                  ? t("publish.view_library")
                  : t("publish.view_mine")}
            </Button>
            {!hasGpFile && (
              <Button
                variant='secondary'
                onClick={() => router.push(editorHref)}>
                {t("publish.back_editor")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${t("publish.title")} | Riff Quest`}</title>
      </Head>
      <div className='mx-auto w-full max-w-6xl space-y-8 px-4 py-8'>
        {/* Header */}
        <div className='space-y-4'>
          <BackLink
            label={
              hasGpFile ? t("my_exercises.back") : t("publish.back_editor")
            }
            onClick={() => router.push(backHref)}
          />
          <div>
            <h1 className='text-3xl font-black tracking-tight text-zinc-100'>
              {isEditing ? t("publish.edit_title") : t("publish.title")}
            </h1>
            <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
              {isEditing ? t("publish.edit_subtitle") : t("publish.subtitle")}
            </p>
          </div>
        </div>

        <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start'>
          <div className='min-w-0 space-y-8'>
            {/* Tablature preview */}
            <FormSection
              title={
                hasGpFile
                  ? t("publish.gp_tab")
                  : hasTab
                    ? t("publish.tab_preview")
                    : t("publish.no_tab")
              }>
              {hasGpFile ? (
                <div className='flex items-start gap-3 rounded-lg bg-zinc-950/40 p-4'>
                  <FileMusic size={16} className='mt-0.5 shrink-0 text-cyan-400' />
                  <div className='space-y-1'>
                    <p className='text-sm text-zinc-300'>
                      {t("publish.gp_tab_body")}
                    </p>
                    <p className='text-xs leading-relaxed text-zinc-500'>
                      {t("publish.gp_tab_hint")}
                    </p>
                  </div>
                </div>
              ) : hasTab ? (
                <div className='space-y-2'>
                  <div className='overflow-hidden rounded-lg'>
                    <TablatureViewer
                      measures={tablature}
                      stringCount={instrument === "bass" ? 4 : undefined}
                      bpm={80}
                      isPlaying={false}
                      startTime={null}
                      className='h-[220px]'
                    />
                  </div>
                  <p className='text-xs text-zinc-600'>
                    {t("publish.measures_loaded", { count: tablature.length })}
                  </p>
                </div>
              ) : (
                <div className='flex items-start gap-3 rounded-lg bg-zinc-950/40 p-4'>
                  <Compass size={16} className='mt-0.5 shrink-0 text-indigo-400' />
                  <div className='space-y-1'>
                    <p className='text-sm text-zinc-300'>
                      {t("publish.open_exercise")}
                    </p>
                    <p className='text-xs leading-relaxed text-zinc-500'>
                      {t("publish.open_exercise_hint")}
                    </p>
                  </div>
                </div>
              )}
            </FormSection>

            {/* Title & Description */}
            <FormSection title={t("publish.basics")}>
              <div className='space-y-2'>
                <div className='flex items-baseline justify-between'>
                  <label className={labelClass}>
                    {t("publish.title_label")}{" "}
                    <span className='text-rose-500'>*</span>
                  </label>
                  <span className='text-[10px] tabular-nums text-zinc-600'>
                    {title.length}/100
                  </span>
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("publish.title_placeholder")}
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
                    {t("publish.description_label")}{" "}
                    <span className='text-rose-500'>*</span>
                  </label>
                  <span className='text-[10px] tabular-nums text-zinc-600'>
                    {description.length}/500
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("publish.description_placeholder")}
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
                  <label className={labelClass}>{t("publish.category")}</label>
                  <div className='relative'>
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as ExerciseCategory)
                      }
                      className={cn(fieldClass(), "appearance-none")}>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {categoryName(c.value)}
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
                  <label className={labelClass}>{t("publish.difficulty")}</label>
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
                        {difficultyName(d.value)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Time & tempo */}
            <FormSection
              title={t("publish.timing")}
              description={t("publish.timing_hint")}
              error={errors.bpm}>
              <div className='space-y-2'>
                <label className={labelClass}>
                  {t("publish.time_label")}
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
                  {t("publish.bpm_range")}{" "}
                  <span className='text-rose-500'>*</span>
                </label>
                <div className='grid grid-cols-3 gap-4'>
                  {(
                    [
                      { label: t("publish.min_bpm"), value: bpmMin, set: setBpmMin },
                      {
                        label: t("publish.recommended"),
                        value: bpmRecommended,
                        set: setBpmRecommended,
                      },
                      { label: t("publish.max_bpm"), value: bpmMax, set: setBpmMax },
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
              title={t("publish.skills")}
              description={
                selectedSkills.length > 0
                  ? t("publish.skills_selected", { count: selectedSkills.length })
                  : t("publish.skills_pick")
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
                        {categoryName(group.category)}
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
                              {t(`common:skills.${skill.id}`, skill.id.replace(/_/g, " "))}
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
              title={t("publish.steps")}
              description={t("publish.steps_hint")}
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
                      placeholder={t("publish.step_n", { n: idx + 1 })}
                      className={cn(fieldClass(), "flex-1 py-2.5")}
                    />
                    <button
                      onClick={() =>
                        removeListItem(instructions, setInstructions, idx)
                      }
                      aria-label={t("publish.remove_step")}
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
                {t("publish.add_step")}
              </button>
            </FormSection>

            {/* Tips */}
            <FormSection
              title={t("publish.tips")}
              description={t("publish.tips_hint")}>
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
                      placeholder={t("publish.tip_n", { n: idx + 1 })}
                      className={cn(fieldClass(), "flex-1 py-2.5")}
                    />
                    <button
                      onClick={() => removeListItem(tips, setTips, idx)}
                      aria-label={t("publish.remove_tip")}
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
                {t("publish.add_tip")}
              </button>
            </FormSection>

            {/* Visibility picker */}
            <FormSection title={t("publish.visibility")}>
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
                      {t("my_exercises.public")}
                    </span>
                    {isPublic && (
                      <Check size={12} className='ml-auto text-emerald-400' />
                    )}
                  </div>
                  <p className='text-xs leading-relaxed text-zinc-500'>
                    {t("publish.public_hint")}
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
                      {t("my_exercises.private")}
                    </span>
                    {!isPublic && (
                      <Check size={12} className='ml-auto text-cyan-400' />
                    )}
                  </div>
                  <p className='text-xs leading-relaxed text-zinc-500'>
                    {t("publish.private_hint")}
                  </p>
                </button>
              </div>
              {isPublic && (
                <p className='text-xs leading-relaxed text-zinc-500'>
                  <Interpolate
                    text={t("publish.public_terms")}
                    values={{
                      name: (
                        <span className='font-semibold text-cyan-400'>
                          {userInfo?.displayName || t("publish.your_account")}
                        </span>
                      ),
                    }}
                  />
                </p>
              )}
            </FormSection>
          </div>

          {/* Summary rail — live preview of the listing, readiness checklist and
            the submit action, always in view on desktop instead of 2000px down. */}
          <aside className='space-y-4 pb-16 lg:sticky lg:top-24'>
            <div className='space-y-5 rounded-lg bg-zinc-900/40 p-5'>
              <div className='space-y-3'>
                <h2 className='text-sm font-bold text-zinc-100'>
                  {t("publish.summary")}
                </h2>
                <p className='min-h-[20px] text-sm font-semibold text-zinc-200'>
                  {title.trim() || (
                    <span className='font-normal text-zinc-600'>
                      {t("publish.untitled")}
                    </span>
                  )}
                </p>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-300'>
                    {activeCategory && categoryName(activeCategory.value)}
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
                    {activeDifficulty && difficultyName(activeDifficulty.value)}
                  </span>
                </div>
                <p className='text-xs leading-relaxed text-zinc-500'>
                  {hasGpFile
                    ? t("publish.summary_line_gp", {
                        minutes: timeInMinutes,
                        bpm: bpmRecommended,
                      })
                    : t("publish.summary_line", {
                        count: tablature.length,
                        measures: tablature.length,
                        minutes: timeInMinutes,
                        bpm: bpmRecommended,
                      })}
                  {selectedSkills.length > 0 &&
                    ` · ${t("publish.skills_count", { count: selectedSkills.length })}`}
                </p>
                <p className='flex items-center gap-1.5 text-xs font-semibold'>
                  {isPublic ? (
                    <>
                      <Globe size={12} className='text-emerald-400' />
                      <span className='text-emerald-400'>{t("my_exercises.public")}</span>
                    </>
                  ) : (
                    <>
                      <Lock size={12} className='text-cyan-400' />
                      <span className='text-cyan-400'>{t("my_exercises.private")}</span>
                    </>
                  )}
                </p>
              </div>

              <div className='space-y-2.5'>
                <div className='flex items-baseline justify-between'>
                  <span className={labelClass}>{t("publish.ready")}</span>
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
                      ? t("publish.saving")
                      : isPublic
                        ? t("publish.publishing")
                        : t("publish.saving")
                    : isEditing
                      ? t("publish.save_changes")
                      : isPublic
                        ? t("publish.title")
                        : t("publish.save_private")}
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => router.push(backHref)}
                  className='w-full'>
                  {t("cancel")}
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
