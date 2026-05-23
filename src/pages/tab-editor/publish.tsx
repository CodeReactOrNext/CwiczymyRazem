import { cn } from "assets/lib/utils";
import { createCommunityExercise } from "feature/communityExercises/services/communityExerciseService";
import type { CreateCommunityExerciseInput } from "feature/communityExercises/types";
import type { DifficultyLevel, ExerciseCategory, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { TablatureViewer } from "feature/exercisePlan/views/PracticeSession/components/TablatureViewer";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import type { GuitarSkillId } from "feature/skills/skills.types";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout";
import { AlertCircle, ArrowLeft, Check, ChevronDown, Plus, Trash2, X } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
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

const DIFFICULTIES: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: "easy", label: "Easy", color: "text-emerald-400" },
  { value: "medium", label: "Medium", color: "text-amber-400" },
  { value: "hard", label: "Hard", color: "text-rose-400" },
];

const PublishExercisePage: NextPageWithLayout = () => {
  const router = useRouter();
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);

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
  const [agreedToPublic, setAgreedToPublic] = useState(false);
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (instructions.filter(i => i.trim()).length === 0) newErrors.instructions = "At least one instruction is required.";
    if (bpmMin < 20 || bpmMax > 300 || bpmMin >= bpmMax) newErrors.bpm = "BPM range is invalid. Min must be lower than Max.";
    if (bpmRecommended < bpmMin || bpmRecommended > bpmMax) newErrors.bpm = "Recommended BPM must be between Min and Max.";
    if (!agreedToPublic) newErrors.consent = "You must agree to publish publicly.";
    if (tablature.length === 0) newErrors.tablature = "No tablature data found. Go back to the Tab Editor and click Publish from there.";
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
      instructions: instructions.filter(i => i.trim()),
      tips: tips.filter(t => t.trim()),
      tablature,
    };

    const id = await createCommunityExercise(
      input,
      userAuth,
      userInfo.displayName || "Anonymous"
    );

    setIsSubmitting(false);

    if (id) {
      localStorage.removeItem("tab-editor-draft");
      setSubmitted(true);
    } else {
      setErrors({ submit: "Something went wrong. Please try again." });
    }
  };

  const toggleSkill = (skillId: GuitarSkillId) => {
    setSelectedSkills(prev =>
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  };

  const updateListItem = (list: string[], setList: (v: string[]) => void, idx: number, value: string) => {
    const next = [...list];
    next[idx] = value;
    setList(next);
  };

  const addListItem = (list: string[], setList: (v: string[]) => void) => {
    setList([...list, ""]);
  };

  const removeListItem = (list: string[], setList: (v: string[]) => void, idx: number) => {
    if (list.length === 1) return;
    setList(list.filter((_, i) => i !== idx));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center mx-auto">
            <Check className="text-emerald-400" size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Exercise Published!</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your exercise is now live in the Community library. Other users can discover, practice, and rate it.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/profile/skills?tab=community")}
              className="px-5 py-2.5 bg-emerald-500 text-black text-sm font-bold rounded-lg hover:bg-emerald-400 transition-all"
            >
              View in Library
            </button>
            <button
              onClick={() => router.push("/tab-editor")}
              className="px-5 py-2.5 bg-white/5 border border-white/10 text-white text-sm font-bold rounded-lg hover:bg-white/10 transition-all"
            >
              Back to Editor
            </button>
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
      <div className="min-h-screen bg-[#050505] text-white">
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

          {/* Header */}
          <div className="space-y-4">
            <button
              onClick={() => router.push("/tab-editor")}
              className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-semibold transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Editor
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">Publish Exercise</h1>
              <p className="text-zinc-400 mt-1 text-sm leading-relaxed">
                Share your exercise with the community. Fill in the details below so others know how to practice it.
              </p>
            </div>
          </div>

          {/* Tablature preview */}
          {tablature.length > 0 ? (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tablature Preview</label>
              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <TablatureViewer
                  measures={tablature}
                  bpm={80}
                  isPlaying={false}
                  startTime={null}
                  className="h-40"
                />
              </div>
              <p className="text-xs text-zinc-600">
                {tablature.length} measure{tablature.length !== 1 ? "s" : ""} · loaded from Tab Editor
              </p>
            </div>
          ) : (
            <div className={cn("border rounded-lg p-4 flex items-start gap-3", errors.tablature ? "border-rose-500/40 bg-rose-500/5" : "border-zinc-800 bg-zinc-900/40")}>
              <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
              <p className="text-sm text-zinc-400">
                {errors.tablature || "No tablature found. Please go back to the Tab Editor and click Publish from there."}
              </p>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Spider Exercise — 1-2-3-4 Permutation"
              maxLength={100}
              className={cn(
                "w-full bg-zinc-900 border rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-500/50 transition-colors",
                errors.title ? "border-rose-500/60" : "border-zinc-800"
              )}
            />
            {errors.title && <p className="text-xs text-rose-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Briefly explain what this exercise trains and who it's for."
              rows={3}
              maxLength={500}
              className={cn(
                "w-full bg-zinc-900 border rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-500/50 transition-colors resize-none",
                errors.description ? "border-rose-500/60" : "border-zinc-800"
              )}
            />
            {errors.description && <p className="text-xs text-rose-400">{errors.description}</p>}
          </div>

          {/* Category + Difficulty */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Category</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ExerciseCategory)}
                  className="w-full appearance-none bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-colors"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={cn(
                      "flex-1 py-3 rounded-lg text-xs font-bold border transition-all",
                      difficulty === d.value
                        ? `border-current ${d.color} bg-white/5`
                        : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Estimated Practice Time (minutes)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={timeInMinutes}
              onChange={e => setTimeInMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-32 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          {/* Metronome speed */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              BPM Range <span className="text-rose-500">*</span>
            </label>
            <p className="text-xs text-zinc-600">Set the tempo range users should practice this exercise at.</p>
            <div className={cn("grid grid-cols-3 gap-4", errors.bpm ? "ring-1 ring-rose-500/40 rounded-lg p-3" : "")}>
              {([
                { label: "Min BPM", value: bpmMin, set: setBpmMin },
                { label: "Recommended", value: bpmRecommended, set: setBpmRecommended },
                { label: "Max BPM", value: bpmMax, set: setBpmMax },
              ] as const).map(f => (
                <div key={f.label} className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-600">{f.label}</label>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={f.value}
                    onChange={e => f.set(parseInt(e.target.value) || 60)}
                    className={cn(
                      "w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50 transition-colors",
                      errors.bpm ? "border-rose-500/60" : "border-zinc-800"
                    )}
                  />
                </div>
              ))}
            </div>
            {errors.bpm && <p className="text-xs text-rose-400">{errors.bpm}</p>}
          </div>

          {/* Related skills */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Related Skills</label>
            <div className="flex flex-wrap gap-2">
              {guitarSkills.map(skill => {
                const isSelected = selectedSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-semibold border transition-all capitalize",
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    )}
                  >
                    {skill.id.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Step-by-step Instructions <span className="text-rose-500">*</span>
            </label>
            <p className="text-xs text-zinc-600">Tell the user exactly how to perform this exercise.</p>
            {instructions.map((inst, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="mt-3 text-xs font-bold text-zinc-600 w-5 text-center">{idx + 1}.</span>
                <input
                  value={inst}
                  onChange={e => updateListItem(instructions, setInstructions, idx, e.target.value)}
                  placeholder={`Step ${idx + 1}…`}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button
                  onClick={() => removeListItem(instructions, setInstructions, idx)}
                  className="mt-2 p-1.5 text-zinc-600 hover:text-rose-400 transition-colors"
                  disabled={instructions.length === 1}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {errors.instructions && <p className="text-xs text-rose-400">{errors.instructions}</p>}
            <button
              onClick={() => addListItem(instructions, setInstructions)}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-cyan-400 transition-colors"
            >
              <Plus size={14} />
              Add step
            </button>
          </div>

          {/* Tips */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Practice Tips (optional)</label>
            <p className="text-xs text-zinc-600">Share helpful hints, common mistakes to avoid, or variations to try.</p>
            {tips.map((tip, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="mt-3 text-xs font-bold text-zinc-600 w-5 text-center">·</span>
                <input
                  value={tip}
                  onChange={e => updateListItem(tips, setTips, idx, e.target.value)}
                  placeholder={`Tip ${idx + 1}…`}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button
                  onClick={() => removeListItem(tips, setTips, idx)}
                  className="mt-2 p-1.5 text-zinc-600 hover:text-rose-400 transition-colors"
                  disabled={tips.length === 1}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => addListItem(tips, setTips)}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-cyan-400 transition-colors"
            >
              <Plus size={14} />
              Add tip
            </button>
          </div>

          {/* Public consent */}
          <div className={cn(
            "border rounded-lg p-5 space-y-3",
            errors.consent ? "border-rose-500/40 bg-rose-500/5" : "border-zinc-800 bg-zinc-900/40"
          )}>
            <h3 className="text-sm font-bold text-white">Publishing Agreement</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              By publishing this exercise, you agree that it will be <strong className="text-white">publicly visible</strong> to all users under your username <strong className="text-cyan-400">{userInfo?.displayName || "your account"}</strong>.
              The community may rate and comment on your exercise. Moderators may edit or remove exercises that violate community guidelines.
              You retain credit for your contribution.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToPublic}
                onChange={e => setAgreedToPublic(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-cyan-500"
              />
              <span className="text-sm text-zinc-300">
                I understand and agree to publish this exercise publicly.
              </span>
            </label>
            {errors.consent && <p className="text-xs text-rose-400">{errors.consent}</p>}
          </div>

          {/* Auth error */}
          {errors.auth && (
            <div className="border border-rose-500/40 bg-rose-500/5 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <p className="text-sm text-rose-400">{errors.auth}</p>
            </div>
          )}
          {errors.submit && (
            <div className="border border-rose-500/40 bg-rose-500/5 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <p className="text-sm text-rose-400">{errors.submit}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4 pb-16">
            <button
              onClick={() => router.push("/tab-editor")}
              className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-bold rounded-lg hover:bg-zinc-800 hover:text-white transition-all"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              {isSubmitting ? "Publishing…" : "Publish Exercise"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

PublishExercisePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="profile" subtitle="Publish Exercise" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default PublishExercisePage;
