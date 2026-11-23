import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import type { RoadmapVisibility } from "feature/aiCoach/types/roadmap.types";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import { GenerationStepper } from "feature/supporterPanel/components/GenerationStepper";
import { BriefWizard } from "feature/supporterPanel/components/roadmapBrief/BriefWizard";
import {
  BuilderFrame,
  BuilderHeading,
} from "feature/supporterPanel/components/roadmapBrief/BuilderFrame";
import { PlanApproval } from "feature/supporterPanel/components/roadmapBrief/PlanApproval";
import { PreflightChecking } from "feature/supporterPanel/components/roadmapBrief/PreflightChecking";
import { QuestionScreen } from "feature/supporterPanel/components/roadmapBrief/QuestionScreen";
import { useGenerateRoadmap } from "feature/supporterPanel/hooks/useGenerateRoadmap";
import { preflightRoadmap } from "feature/supporterPanel/services/roadmapJob.service";
import type { RoadmapGoalContext } from "feature/supporterPanel/types/roadmapJob.types";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { AnimatePresence, motion } from "framer-motion";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import type { RoadmapBrief } from "lib/roadmaps/generation/brief";
import {
  goalHint,
  MAX_CONTEXT_FIELD_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_TITLE_LENGTH,
} from "lib/roadmaps/generation/goalContext";
import {
  ROADMAP_LEVELS,
  type RoadmapLevel,
} from "lib/roadmaps/generation/levels";
import { suggestRoadmapLevel } from "lib/roadmaps/generation/playerFacts";
import type { PreflightResult } from "lib/roadmaps/generation/preflight";
import { roadmapGenerationCost } from "lib/roadmaps/visibility";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { useDeferredValue, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

/**
 * Where the builder is before anything is paid: the player's own screens, the
 * few seconds the preflight takes, or the questions it picked.
 */
type BuilderPhase = "form" | "checking" | "brief";

/** The player's own screens, in order — one thing asked on each. */
const FORM_STEPS = ["goal", "level", "more", "visibility"] as const;

/**
 * How many questions the coach is assumed to ask before the preflight says —
 * only so the bar across the top does not jump when the real number lands.
 */
const ASSUMED_QUESTIONS = 3;

const MAX_GOAL_LENGTH = 500;
const MIN_GOAL_LENGTH = 5;

/**
 * Starting points for an empty form — a click fills both fields, nothing more.
 * Title and goal live in `supporter:panel.generate.examples.<i>`.
 */
const GOAL_EXAMPLES = [0, 1, 2, 3];

const VISIBILITIES: RoadmapVisibility[] = ["public", "private"];

const EMPTY_CONTEXT: RoadmapGoalContext = { favourites: "", canPlay: "" };

const Field = ({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) => (
  <div className='space-y-2.5'>
    <label htmlFor={id} className='block text-sm font-semibold text-zinc-300'>
      {label}
    </label>
    {children}
  </div>
);

const fieldInputClass = "h-12 px-4 text-base md:text-base";

interface RoadmapBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The finished roadmap's id — once, whether this tab ran it or only watched. */
  onGenerated: (roadmapId: string) => void;
  wallet?: SupporterWallet;
}

/**
 * Lets a supporter generate their own AI roadmap — the same pipeline the admin
 * queue runs (a drafted skeleton, a review pass, house-style descriptions per
 * phase, then lessons), run as a background job on the server: the open tab
 * pushes it along and shows its progress, and it finishes without the tab too.
 *
 * It takes the whole screen and asks one thing at a time, the way a Journey
 * lesson does: the goal, the level, a little about the player, who sees it,
 * then the questions the coach picked — one bar across the top, one row of
 * actions at the bottom, the price on the last button only.
 *
 * It costs tokens, like everything else in the panel — charged once per goal
 * by the server, so a retry of the same goal is free. The wallet is only for
 * the price tag and the disabled button; the server is what actually says no.
 *
 * The job outlives the screen: closed while it writes, the builder leaves a
 * row on the page that says so and opens it again. When the roadmap lands it
 * is handed over and the builder resets.
 */
export const RoadmapBuilder = ({
  open,
  onOpenChange,
  onGenerated,
  wallet,
}: RoadmapBuilderProps) => {
  const { t } = useTranslation(["supporter", "ai_coach"]);
  const { isElectron } = useElectronWindowControls();
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  // The level screen opens on what the account says about the player — how
  // long they have played — instead of on "Intermediate" for everybody.
  const stats = useAppSelector(selectCurrentUserStats);
  const [pickedLevel, setLevel] = useState<RoadmapLevel | null>(null);
  const level =
    pickedLevel ?? suggestRoadmapLevel(stats ? { statistics: stats } : null);
  const [visibility, setVisibility] = useState<RoadmapVisibility>("public");
  const [context, setContext] = useState<RoadmapGoalContext>(EMPTY_CONTEXT);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<BuilderPhase>("form");
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  // What the preflight said no to — a goal that is not about guitar. Shown by
  // the goal, where it can be fixed.
  const [goalNotice, setGoalNotice] = useState<string | null>(null);
  const {
    status,
    stage,
    progress,
    error,
    job,
    start,
    approve,
    reset,
  } = useGenerateRoadmap({
    onDone: (roadmapId) => {
      posthog.capture("roadmap_generation_done", { roadmapId });
      setTitle("");
      setGoal("");
      setContext(EMPTY_CONTEXT);
      setStep(0);
      setPhase("form");
      setPreflight(null);
      reset();
      onOpenChange(false);
      onGenerated(roadmapId);
    },
  });
  const cost = roadmapGenerationCost(visibility);
  const tokensLeft = wallet?.left;
  const canAfford = tokensLeft === undefined || tokensLeft >= cost;
  const goalReady =
    title.trim().length >= MIN_TITLE_LENGTH &&
    goal.trim().length >= MIN_GOAL_LENGTH;
  const running = status === "running";
  const awaiting = status === "awaiting" && !!job?.skeleton?.length;

  // The funnel: who opens the builder, who gets a plan to read, who loses one.
  useEffect(() => {
    if (open) posthog.capture("roadmap_builder_opened");
  }, [open]);
  useEffect(() => {
    if (awaiting) posthog.capture("roadmap_plan_shown");
  }, [awaiting]);
  useEffect(() => {
    if (status === "error") posthog.capture("roadmap_generation_failed");
  }, [status]);

  const answerPlan = async (feedback?: string) => {
    posthog.capture("roadmap_plan_answered", { changes: Boolean(feedback) });
    return approve(feedback);
  };
  // Deferred, so matching a few dozen goals never gets in the way of typing.
  // The title and the description together are what the goal is about.
  const deferredGoal = useDeferredValue(`${title} ${goal}`.trim());
  const hint = goalHint(deferredGoal);
  const formStep = FORM_STEPS[step];
  const close = () => onOpenChange(false);

  /**
   * The free look before paying. A goal that is not about guitar goes back to
   * the goal screen; a check that fails lets the player generate anyway — the
   * questions are an improvement, not a gate.
   */
  const runPreflight = async () => {
    if (!goalReady) return;
    setGoalNotice(null);
    setPhase("checking");
    try {
      const result = await preflightRoadmap({
        title: title.trim(),
        goal: goal.trim(),
        level,
        context,
      });
      posthog.capture("roadmap_preflight", {
        verdict: result.verdict,
        asked: result.questions.asked.map((question) => question.id),
        custom: result.questions.custom.length,
        songsFound: result.songsFound.length,
        songsMissing: result.songsMissing.length,
      });
      if (result.verdict === "not_guitar") {
        setGoalNotice(result.reason || t("panel.generate.not_guitar"));
        setStep(0);
        setPhase("form");
        return;
      }
      setPreflight(result);
      setPhase("brief");
    } catch (caught) {
      posthog.capture("roadmap_preflight_failed", {
        message: caught instanceof Error ? caught.message : "unknown",
      });
      setPreflight({
        verdict: "ok",
        reason: "",
        understood: "",
        questions: { asked: [], custom: [] },
        songsFound: [],
        songsMissing: [],
      });
      setPhase("brief");
    }
  };

  const handleGenerate = async (brief: RoadmapBrief | null) => {
    if (!goalReady || !canAfford) return;
    posthog.capture("roadmap_brief_submitted", {
      answered: brief?.answers.map((answer) => answer.id) ?? [],
      songs: brief?.songs.length ?? 0,
      otherSongs: Boolean(brief?.otherSongs),
      notes: Boolean(brief?.notes),
    });
    const started = await start(
      title.trim(),
      goal.trim(),
      level,
      visibility,
      context,
      brief,
    );
    if (started) {
      posthog.capture("roadmap_generation_started", {
        level,
        levelChanged: pickedLevel !== null,
        visibility,
        cost,
      });
    }
  };

  const next = () => {
    if (step < FORM_STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    void runPreflight();
  };

  const formNote = !canAfford ? (
    <>
      <Interpolate
        text={t("panel.generate.needs")}
        values={{
          cost: <span className='font-bold text-zinc-200'>{cost}</span>,
          left: <span className='font-bold text-zinc-200'>{tokensLeft}</span>,
        }}
      />{" "}
      <a
        href={BMC_URL}
        target='_blank'
        rel='noreferrer'
        className='font-semibold text-amber-300 underline-offset-2 hover:underline'>
        {t("panel.generate.donation_adds")}
      </a>
    </>
  ) : (
    <Interpolate
      text={t("panel.generate.next_free")}
      values={{
        cost: (
          <span className='inline-flex items-center gap-1 align-middle font-bold tabular-nums text-zinc-200'>
            <SupportToken size={13} />
            {cost}
          </span>
        ),
      }}
    />
  );

  const formActions = (
    <>
      {formStep === "more" && (
        <Button type='button' variant='ghost' size='lg' onClick={next}>
          {t("panel.brief.skip")}
        </Button>
      )}
      <Button
        type='button'
        size='lg'
        onClick={next}
        disabled={formStep === "goal" && !goalReady}>
        {t("panel.generate.continue")}
        <ArrowRight size={16} />
      </Button>
    </>
  );

  const form = (
    <BuilderFrame
      progress={(step + 1) / (FORM_STEPS.length + ASSUMED_QUESTIONS)}
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
      onClose={close}
      tokensLeft={tokensLeft}
      note={formNote}
      actions={formActions}>
      {formStep === "goal" && (
        <div className='space-y-7'>
          <BuilderHeading
            title={t("panel.generate.goal_label")}
            hint={t("panel.generate.goal_body")}
          />

          <AnimatePresence>
            {goalNotice && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className='flex items-start gap-3 rounded-lg bg-red-950/20 px-4 py-3'>
                <AlertTriangle
                  size={16}
                  className='mt-0.5 shrink-0 text-red-400'
                />
                <p className='text-sm leading-relaxed text-red-200'>
                  {goalNotice}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <Field id='roadmap-title' label={t("panel.generate.title_label")}>
            <Input
              id='roadmap-title'
              type='text'
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("panel.generate.title_placeholder")}
              className={cn(
                fieldInputClass,
                "font-semibold placeholder:font-normal",
              )}
            />
          </Field>

          <Field id='roadmap-goal' label={t("panel.generate.description")}>
            <div className='rounded-lg bg-zinc-800/60 focus-within:ring-1 focus-within:ring-zinc-500'>
              <textarea
                id='roadmap-goal'
                rows={4}
                maxLength={MAX_GOAL_LENGTH}
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder={t("panel.generate.goal_placeholder")}
                className='block w-full resize-none bg-transparent px-4 pb-2 pt-4 text-base leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500'
              />
              <div className='flex items-end justify-between gap-4 px-4 pb-3'>
                {hint && (title || goal) ? (
                  <p className='flex items-start gap-2 text-xs leading-relaxed text-zinc-400'>
                    <Lightbulb
                      size={13}
                      className='mt-0.5 shrink-0 text-amber-300/80'
                    />
                    {hint}
                  </p>
                ) : (
                  <span />
                )}
                <span className='shrink-0 text-xs tabular-nums text-zinc-500'>
                  {goal.length}/{MAX_GOAL_LENGTH}
                </span>
              </div>
            </div>
          </Field>

          {!title && !goal && (
            <div className='flex flex-wrap gap-2'>
              {GOAL_EXAMPLES.map((i) => (
                <Button
                  key={i}
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setTitle(t(`panel.generate.examples.${i}.title`));
                    setGoal(t(`panel.generate.examples.${i}.goal`));
                  }}>
                  {t(`panel.generate.examples.${i}.title`)}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {formStep === "level" && (
        <QuestionScreen
          question={t("panel.generate.level")}
          options={ROADMAP_LEVELS.map((candidate) => ({
            value: candidate,
            label: t(`ai_coach:levels.${candidate}`, candidate),
          }))}
          multi={false}
          values={[level]}
          onChange={([value]) => setLevel(value as RoadmapLevel)}
        />
      )}

      {formStep === "more" && (
        <div className='space-y-7'>
          <BuilderHeading
            title={t("panel.generate.more.title")}
            hint={t("panel.generate.more.body")}
          />
          <Field
            id='roadmap-favourites'
            label={t("panel.generate.more.favourites")}>
            <Input
              id='roadmap-favourites'
              type='text'
              value={context.favourites}
              maxLength={MAX_CONTEXT_FIELD_LENGTH}
              onChange={(event) =>
                setContext({ ...context, favourites: event.target.value })
              }
              placeholder={t("panel.generate.more.favourites_placeholder")}
              className={fieldInputClass}
            />
          </Field>
          <Field
            id='roadmap-can-play'
            label={t("panel.generate.more.can_play")}>
            <Input
              id='roadmap-can-play'
              type='text'
              value={context.canPlay}
              maxLength={MAX_CONTEXT_FIELD_LENGTH}
              onChange={(event) =>
                setContext({ ...context, canPlay: event.target.value })
              }
              placeholder={t("panel.generate.more.can_play_placeholder")}
              className={fieldInputClass}
            />
          </Field>
        </div>
      )}

      {/* A public roadmap gives the community something back for the
          compute, so it is the cheaper one. */}
      {formStep === "visibility" && (
        <QuestionScreen
          question={t("panel.generate.who_sees")}
          options={VISIBILITIES.map((value) => ({
            value,
            label: t(`panel.generate.visibility.${value}.label`),
            hint: t(`panel.generate.visibility.${value}.hint`),
          }))}
          multi={false}
          values={[visibility]}
          onChange={([value]) => setVisibility(value as RoadmapVisibility)}
          renderTrailing={(option) => (
            <span className='flex shrink-0 items-center gap-1.5 text-sm font-bold tabular-nums'>
              <SupportToken size={15} />
              {roadmapGenerationCost(option.value as RoadmapVisibility)}
            </span>
          )}
        />
      )}
    </BuilderFrame>
  );

  // What happened to the tokens is said on the screen itself: a job in
  // flight, or one that failed, takes the builder over until it is settled.
  const outcome = (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex shrink-0 justify-end px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-6'>
        <Button
          type='button'
          variant='subtle'
          size='icon'
          onClick={close}
          aria-label={t("panel.generate.close_builder")}>
          <X />
        </Button>
      </div>
      <div className='flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-4 pb-10 sm:px-8'>
        <div className='mx-auto w-full max-w-xl space-y-8'>
          {running ? (
            <>
              <BuilderHeading
                title={t("panel.generate.writing")}
                hint={t("panel.generate.running_body")}
              />
              <GenerationStepper stage={stage} progress={progress} />
              <Button type='button' variant='ghost' size='lg' onClick={close}>
                {t("panel.generate.back_to_roadmaps")}
              </Button>
            </>
          ) : (
            <>
              <BuilderHeading title={t("panel.generate.title")} />
              <div className='flex items-start gap-3 rounded-lg bg-red-950/20 px-4 py-3'>
                <AlertTriangle
                  size={16}
                  className='mt-0.5 shrink-0 text-red-400'
                />
                <p className='text-sm leading-relaxed text-red-300'>{error}</p>
              </div>
              <Button type='button' size='lg' onClick={reset}>
                {t("panel.try_again")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Closed with a job on it: the one place that still says so. */}
      {!open && (running || awaiting || status === "error") && (
        <button
          type='button'
          onClick={() => onOpenChange(true)}
          className='flex w-full items-center gap-4 rounded-lg bg-zinc-900 px-5 py-4 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800/80'>
          {running || awaiting ? (
            <Sparkles className='h-4 w-4 shrink-0 text-amber-300' />
          ) : (
            <AlertTriangle className='h-4 w-4 shrink-0 text-red-400' />
          )}
          <span className='min-w-0 flex-1 text-sm font-semibold text-zinc-200'>
            {awaiting
              ? t("panel.approval.waiting")
              : running
                ? t("panel.generate.writing")
                : error}
          </span>
          {running && (
            <span className='text-sm font-semibold tabular-nums text-amber-200'>
              {Math.round(progress)}%
            </span>
          )}
          <ChevronRight className='h-4 w-4 shrink-0 text-zinc-500' />
        </button>
      )}

      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              // Over the phone's bottom tab bar (z-[100]) and every in-app
              // dialog layer, under the Electron title bar — the same place a
              // roadmap step's lesson takes.
              "fixed inset-x-0 bottom-0 z-[120] flex flex-col bg-zinc-950 focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0",
              isElectron ? "top-10" : "top-0",
            )}>
            <DialogPrimitive.Title className='sr-only'>
              {t("panel.generate.title")}
            </DialogPrimitive.Title>

            {awaiting && job?.skeleton ? (
              <PlanApproval
                // A reshaped plan is a new one to read: the note field starts empty.
                key={job.updatedAt}
                skeleton={job.skeleton}
                feedbackLeft={job.feedbackLeft ?? false}
                tokensLeft={tokensLeft}
                onAnswer={answerPlan}
                onClose={close}
              />
            ) : running || status === "error" ? (
              outcome
            ) : phase === "checking" ? (
              <BuilderFrame
                progress={
                  FORM_STEPS.length / (FORM_STEPS.length + ASSUMED_QUESTIONS)
                }
                onClose={close}
                tokensLeft={tokensLeft}>
                <PreflightChecking />
              </BuilderFrame>
            ) : phase === "brief" && preflight ? (
              <BriefWizard
                preflight={preflight}
                cost={cost}
                tokensLeft={tokensLeft}
                canAfford={canAfford}
                stepsBefore={FORM_STEPS.length}
                onBack={() => {
                  setPhase("form");
                  setPreflight(null);
                }}
                onClose={close}
                onGenerate={(brief) => void handleGenerate(brief)}
              />
            ) : (
              form
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
};
