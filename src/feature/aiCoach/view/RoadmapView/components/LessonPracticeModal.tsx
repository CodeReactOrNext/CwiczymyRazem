import { Button, buttonVariants } from "assets/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { SKILL_CATEGORY_ICONS } from "components/Icon/skillCategoryIcons";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import type { YouTubeLessonResult } from "feature/aiCoach/types/youtubeLesson.types";
import {
  clearLessonProgress,
  loadLessonProgress,
  saveLessonProgress,
} from "feature/aiCoach/utils/lessonProgress";
import { LESSON_TITLE_PREFIX } from "feature/logs/utils/loggedPractice";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserAvatar,
  setActivity,
} from "feature/user/store/userSlice";
import { updateUserStats } from "feature/user/store/userSlice.asyncThunk";
import { updateQuestProgress } from "feature/user/store/userSlice.questActions";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import useTimer from "hooks/useTimer";
import { useTranslation } from "hooks/useTranslation";
import { Check, Pause, Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons/lib";
import type { YouTubeProps } from "react-youtube";
import YouTube from "react-youtube";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { DailyQuestTaskType } from "types/api.types";
import type { SkillsType } from "types/skillsTypes";
import { getClientReportContext, hasRestDays } from "utils/gameLogic";

const SKILL_OPTIONS: {
  id: SkillsType;
  label: string;
  Icon: IconType;
}[] = [
  { id: "technique", label: "Technique", Icon: SKILL_CATEGORY_ICONS.technique },
  { id: "theory", label: "Theory", Icon: SKILL_CATEGORY_ICONS.theory },
  { id: "hearing", label: "Hearing", Icon: SKILL_CATEGORY_ICONS.hearing },
  {
    id: "creativity",
    label: "Creativity",
    Icon: SKILL_CATEGORY_ICONS.creativity,
  },
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

/** Closing a window with less on the clock than this needs no confirmation. */
const CONFIRM_LEAVE_AFTER_MS = 10_000;

/** The one IFrame API call this window needs. */
interface LessonPlayer {
  getCurrentTime: () => number;
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
 *
 * A Radix dialog rather than a hand-rolled portal so it layers correctly over
 * the step drawer (also Radix): pointer events, focus and Escape all go to the
 * window on top.
 *
 * A lesson can run for an hour, so the window is hard to lose: a click on the
 * backdrop does nothing, Escape and the close button ask first, and the
 * stopwatch plus the spot in the video are saved — reopening the lesson
 * carries on where it stopped.
 */
const LessonPracticeModal = ({
  lesson,
  onFinish,
  onClose,
}: LessonPracticeModalProps) => {
  const { t } = useTranslation(["ai_coach", "common"]);
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const userAvatar = useAppSelector(selectUserAvatar);
  const restDays = useAppSelector((state) =>
    hasRestDays(selectCurrentUserStats(state))
  );
  const { reportList } = useActivityLog(userAuth || "");
  const timer = useTimer();
  const [restored] = useState(() => loadLessonProgress(lesson.videoId));
  const [elapsed, setElapsed] = useState(restored?.elapsedMs ?? 0);
  const [skill, setSkill] = useState<SkillsType>("technique");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
  const playerRef = useRef<LessonPlayer | null>(null);
  const lastVideoSecondsRef = useRef(restored?.videoSeconds ?? 0);
  // Set once the time is logged, so the unmount doesn't save it back.
  const finishedRef = useRef(false);

  const isRunning = timer.timerEnabled;

  const persistProgress = useCallback(() => {
    if (finishedRef.current) return;
    try {
      const current = playerRef.current?.getCurrentTime() ?? 0;
      // Until the player has loaded and cued its start it reports 0 — keep the
      // saved spot then instead of overwriting it.
      if (current > 0) lastVideoSecondsRef.current = current;
    } catch {
      // The player is already torn down (unmount) — the last reading stands.
    }
    saveLessonProgress(lesson.videoId, {
      elapsedMs: timer.getTime(),
      videoSeconds: lastVideoSecondsRef.current,
    });
  }, [lesson.videoId, timer]);

  // Auto-start the stopwatch as the video begins (from where the last visit
  // stopped), keep the display in sync and the progress saved.
  useEffect(() => {
    if (restored) timer.setInitialStartTime(restored.elapsedMs);
    timer.startTimer();
    const unsubscribe = timer.subscribe((time) => {
      setElapsed(time);
      persistProgress();
    });
    // A refresh or a closed tab never reaches the unmount below.
    const persistWhenHidden = () => {
      if (document.visibilityState === "hidden") persistProgress();
    };
    window.addEventListener("pagehide", persistProgress);
    document.addEventListener("visibilitychange", persistWhenHidden);
    return () => {
      unsubscribe();
      timer.stopTimer();
      window.removeEventListener("pagehide", persistProgress);
      document.removeEventListener("visibilitychange", persistWhenHidden);
      persistProgress();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shows the player as practicing in "Live now" while the window is open — and lets anyone there
  // open the same lesson.
  useEffect(() => {
    dispatch(
      setActivity({
        planTitle: "AI Coach lesson",
        exerciseTitle: lesson.title,
        timestamp: Date.now(),
        lessonVideoId: lesson.videoId,
      }),
    );
    return () => {
      dispatch(setActivity(null));
    };
  }, [dispatch, lesson.title, lesson.videoId]);

  const handleToggle = () => {
    if (isRunning) timer.stopTimer();
    else timer.startTimer();
  };

  const requestClose = () => {
    if (isSubmitting) return;
    if (timer.getTime() < CONFIRM_LEAVE_AFTER_MS) {
      onClose();
      return;
    }
    setIsConfirmingLeave(true);
  };

  const markFinished = () => {
    finishedRef.current = true;
    clearLessonProgress(lesson.videoId);
  };

  const handleFinish = async () => {
    if (isSubmitting) return;
    timer.stopTimer();
    const time = timer.getTime();
    if (time < 1000) {
      markFinished();
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
      techniqueMinutes:
        skill === "technique" ? skillTime.minutes : zero.minutes,
      theoryHours: skill === "theory" ? skillTime.hours : zero.hours,
      theoryMinutes: skill === "theory" ? skillTime.minutes : zero.minutes,
      hearingHours: skill === "hearing" ? skillTime.hours : zero.hours,
      hearingMinutes: skill === "hearing" ? skillTime.minutes : zero.minutes,
      creativityHours: skill === "creativity" ? skillTime.hours : zero.hours,
      creativityMinutes:
        skill === "creativity" ? skillTime.minutes : zero.minutes,
      habbits: [],
      countBackDays: 0,
      reportTitle: `${LESSON_TITLE_PREFIX}${lesson.title}`,
      // Lets other players open the same lesson straight from the activity feed.
      lessonVideoId: lesson.videoId,
      avatarUrl: userAvatar ?? null,
      ...getClientReportContext(
        ((reportList as any[]) ?? []).map((report) => report.date),
        restDays,
      ),
    };

    try {
      await dispatch(updateUserStats({ inputData })).unwrap();
      dispatch(
        updateQuestProgress({ type: "practice_total_time", amount: minutes }),
      );
      dispatch(updateQuestProgress({ type: "long_session", amount: minutes }));
      dispatch(
        updateQuestProgress({ type: SKILL_TIME_QUEST[skill], amount: minutes }),
      );
      toast.success(t("lesson_modal.logged", { minutes }));
      markFinished();
      onFinish();
    } catch {
      toast.error(t("lesson_modal.log_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startAt = Math.floor(restored?.videoSeconds ?? 0);
  const playerOpts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      rel: 0,
      ...(startAt > 0 ? { start: startAt } : {}),
    },
  };

  return (
    <>
      <Dialog
        open
        onOpenChange={(isOpen) => {
          if (!isOpen) requestClose();
        }}>
        <DialogContent
          hideCloseButton
          // A stray click beside the video must not end an hour-long session.
          onInteractOutside={(event) => event.preventDefault()}
          overlayClassName='z-[1000] bg-black/85 backdrop-blur-sm'
          // As wide as the screen allows while the 16:9 video plus the header
          // and controls (~20rem) still fit in 92dvh — no scrolling to reach
          // "Finish". The sm: overrides beat the base dialog's sm:max-w-lg/p-6.
          className='z-[1000] flex h-[100dvh] w-full flex-col gap-0 overflow-y-auto border-0 bg-zinc-950 p-0 shadow-none sm:h-auto sm:max-h-[92dvh] sm:max-w-[min(94vw,1600px,max(32rem,calc((92dvh_-_20rem)*16/9)))] sm:overflow-y-auto sm:rounded-lg sm:p-0 short:p-0'>
          {/* ── Header ── */}
          <div className='flex items-start justify-between gap-4 px-5 pb-4 pt-5'>
            <div className='min-w-0'>
              <p className='mb-1 text-xs font-medium text-cyan-400'>
                {t("lesson_modal.session")}
              </p>
              <DialogTitle className='truncate text-sm font-bold leading-snug tracking-normal text-zinc-100'>
                {lesson.title}
              </DialogTitle>
              <DialogDescription className='sr-only'>
                {t("lesson_modal.description")}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button
                type='button'
                aria-label={t("drawer.close")}
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0")}>
                <X />
              </button>
            </DialogClose>
          </div>

          {/* ── Video ── */}
          <div className='relative aspect-video w-full shrink-0 bg-black'>
            <YouTube
              videoId={lesson.videoId}
              opts={playerOpts}
              title={lesson.title}
              onReady={(event: { target: unknown }) => {
                playerRef.current = event.target as LessonPlayer;
              }}
              className='absolute inset-0 h-full w-full'
              iframeClassName='h-full w-full'
            />
          </div>

          {/* ── Timer + controls ── */}
          <div className='flex flex-col gap-5 px-5 py-5'>
            <div className='flex items-center justify-between gap-4'>
              <div className='flex items-center gap-3'>
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    isRunning ? "animate-pulse bg-emerald-500" : "bg-zinc-600",
                  )}
                />
                <span className='font-mono text-3xl font-bold tabular-nums text-zinc-100'>
                  {formatElapsed(elapsed)}
                </span>
              </div>
              <Button
                type='button'
                variant='subtle'
                size='sm'
                onClick={handleToggle}>
                {isRunning ? (
                  <>
                    <Pause /> {t("lesson_modal.pause")}
                  </>
                ) : (
                  <>
                    <Play /> {t("lesson_modal.resume")}
                  </>
                )}
              </Button>
            </div>

            {/* Skill category — where this time is logged */}
            <div className='flex flex-col gap-2'>
              <p className='text-xs font-semibold text-zinc-400'>
                {t("lesson_modal.log_as")}
              </p>
              <SegmentedControl<SkillsType>
                label={t("lesson_modal.log_as")}
                selected={[skill]}
                onSelect={setSkill}
                options={SKILL_OPTIONS.map(({ id, label, Icon }) => ({
                  value: id,
                  label: t(`common:categories.${id}`, label),
                  icon: <Icon className='h-4 w-4 shrink-0' />,
                }))}
              />
            </div>

            <Button
              type='button'
              size='lg'
              onClick={handleFinish}
              loading={isSubmitting}
              className='w-full sm:w-auto sm:self-end'>
              {!isSubmitting && <Check />}
              {isSubmitting
                ? t("lesson_modal.logging")
                : t("lesson_modal.finish")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asked on Escape and the close button once there is time on the clock.
        Leaving keeps the progress saved, so this is a speed bump, not a loss. */}
      <Dialog open={isConfirmingLeave} onOpenChange={setIsConfirmingLeave}>
        <DialogContent
          hideCloseButton
          overlayClassName='z-[1001] bg-black/60'
          className='left-1/2 top-1/2 z-[1001] h-auto w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-6 rounded-lg border-0 bg-zinc-900 p-6 shadow-none'>
          <div className='flex flex-col gap-2'>
            <DialogTitle className='text-lg font-bold leading-snug tracking-normal text-zinc-100'>
              {t("lesson_modal.leave_title")}
            </DialogTitle>
            <DialogDescription className='text-sm leading-relaxed text-zinc-400'>
              {t("lesson_modal.leave_body", { time: formatElapsed(elapsed) })}
            </DialogDescription>
          </div>
          <div className='flex flex-col-reverse gap-2 sm:flex-row'>
            <button
              type='button'
              onClick={onClose}
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "flex-1")}>
              {t("lesson_modal.leave")}
            </button>
            <DialogClose asChild>
              <button
                type='button'
                className={cn(buttonVariants({ size: "lg" }), "flex-1")}>
                {t("lesson_modal.keep_practicing")}
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LessonPracticeModal;
