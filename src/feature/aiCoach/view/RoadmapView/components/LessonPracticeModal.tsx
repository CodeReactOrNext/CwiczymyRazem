import type { YouTubeLessonResult } from "feature/aiCoach/types/youtubeLesson.types";
import { selectUserAvatar } from "feature/user/store/userSlice";
import { updateUserStats } from "feature/user/store/userSlice.asyncThunk";
import { updateQuestProgress } from "feature/user/store/userSlice.questActions";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import useTimer from "hooks/useTimer";
import { Check, Loader2, Pause, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaBrain, FaMusic } from "react-icons/fa";
import { IoMdHand } from "react-icons/io";
import { MdSchool } from "react-icons/md";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { DailyQuestTaskType } from "types/api.types";
import type { SkillsType } from "types/skillsTypes";

const SKILL_OPTIONS: { id: SkillsType; label: string; Icon: typeof MdSchool }[] = [
  { id: "technique", label: "Technique", Icon: IoMdHand },
  { id: "theory", label: "Theory", Icon: MdSchool },
  { id: "hearing", label: "Hearing", Icon: FaMusic },
  { id: "creativity", label: "Creativity", Icon: FaBrain },
];

const SKILL_TIME_QUEST: Record<SkillsType, DailyQuestTaskType> = {
  technique: "practice_technique_time",
  theory: "practice_theory_time",
  hearing: "practice_hearing_time",
  creativity: "practice_creativity_time",
};

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

interface LessonPracticeModalProps {
  lesson: YouTubeLessonResult;
  /** Called after the elapsed time (if any) has been logged — the caller marks the lesson watched and closes this modal. */
  onFinish: () => void;
  onClose: () => void;
}

/**
 * Opens a YouTube lesson inside a practice-session window: the video plays
 * embedded while a stopwatch tracks how long the user practiced. Finishing
 * logs the elapsed time straight away (same accounting as the report page,
 * skipping the form) instead of navigating anywhere.
 */
const LessonPracticeModal = ({ lesson, onFinish, onClose }: LessonPracticeModalProps) => {
  const dispatch = useAppDispatch();
  const userAvatar = useAppSelector(selectUserAvatar);
  const timer = useTimer();
  const [elapsed, setElapsed] = useState(0);
  const [skill, setSkill] = useState<SkillsType>("technique");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRunning = timer.timerEnabled;

  // Auto-start the stopwatch as the video begins, and keep the display in sync.
  useEffect(() => {
    timer.startTimer();
    const unsubscribe = timer.subscribe((time) => setElapsed(time));
    return () => {
      unsubscribe();
      timer.stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock background scroll while the window is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleToggle = () => {
    if (isRunning) timer.stopTimer();
    else timer.startTimer();
  };

  const handleFinish = async () => {
    if (isSubmitting) return;
    timer.stopTimer();
    const time = timer.getTime();
    if (time < 1000) {
      onFinish();
      return;
    }

    setIsSubmitting(true);
    const minutes = Math.max(1, Math.round(time / 60000));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const zero = { hours: "0", minutes: "0" };
    const skillTime = { hours: hours.toString(), minutes: mins.toString() };

    const inputData: ReportFormikInterface = {
      techniqueHours: skill === "technique" ? skillTime.hours : zero.hours,
      techniqueMinutes: skill === "technique" ? skillTime.minutes : zero.minutes,
      theoryHours: skill === "theory" ? skillTime.hours : zero.hours,
      theoryMinutes: skill === "theory" ? skillTime.minutes : zero.minutes,
      hearingHours: skill === "hearing" ? skillTime.hours : zero.hours,
      hearingMinutes: skill === "hearing" ? skillTime.minutes : zero.minutes,
      creativityHours: skill === "creativity" ? skillTime.hours : zero.hours,
      creativityMinutes: skill === "creativity" ? skillTime.minutes : zero.minutes,
      habbits: [],
      countBackDays: 0,
      reportTitle: `Lesson: ${lesson.title}`,
      avatarUrl: userAvatar ?? null,
      clientTodayISO: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })(),
      clientNowISO: new Date().toISOString(),
    };

    try {
      await dispatch(updateUserStats({ inputData })).unwrap();
      dispatch(updateQuestProgress({ type: "practice_total_time", amount: minutes }));
      dispatch(updateQuestProgress({ type: "long_session", amount: minutes }));
      dispatch(updateQuestProgress({ type: SKILL_TIME_QUEST[skill], amount: minutes }));
      toast.success(`Logged ${minutes} min of practice.`);
      onFinish();
    } catch {
      toast.error("Failed to log practice time.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-zinc-800 shadow-2xl">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800/60 px-5 py-4">
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-cyan-500/70">
              Practice session
            </p>
            <h2 className="truncate text-sm font-bold text-zinc-100">{lesson.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-400 transition-background hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Video ── */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${lesson.videoId}?autoplay=1&rel=0`}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* ── Timer + controls ── */}
        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`h-2 w-2 shrink-0 rounded-full ${isRunning ? "animate-pulse bg-green-500" : "bg-zinc-600"}`} />
              <span className="font-mono text-3xl font-bold tabular-nums text-zinc-100">
                {formatElapsed(elapsed)}
              </span>
            </div>
            <button
              onClick={handleToggle}
              className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700"
            >
              {isRunning ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Resume</>}
            </button>
          </div>

          {/* Skill category — where this time is logged */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Log time as
            </p>
            <div className="grid grid-cols-4 gap-2">
              {SKILL_OPTIONS.map(({ id, label, Icon }) => {
                const active = skill === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSkill(id)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-[11px] font-semibold transition-all ${
                      active
                        ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40"
                        : "bg-zinc-900/60 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleFinish}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-500 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isSubmitting ? "Logging time…" : "Finish & log time"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LessonPracticeModal;
