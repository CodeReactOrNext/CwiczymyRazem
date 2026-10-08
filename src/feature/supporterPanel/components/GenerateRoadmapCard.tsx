import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import type { RoadmapVisibility } from "feature/aiCoach/types/roadmap.types";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import { GenerationStepper } from "feature/supporterPanel/components/GenerationStepper";
import { BriefWizard } from "feature/supporterPanel/components/roadmapBrief/BriefWizard";
import { PreflightChecking } from "feature/supporterPanel/components/roadmapBrief/PreflightChecking";
import { useGenerateRoadmap } from "feature/supporterPanel/hooks/useGenerateRoadmap";
import { preflightRoadmap } from "feature/supporterPanel/services/roadmapJob.service";
import type { RoadmapGoalContext } from "feature/supporterPanel/types/roadmapJob.types";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import { AnimatePresence, motion } from "framer-motion";
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
import type { PreflightResult } from "lib/roadmaps/generation/preflight";
import { roadmapGenerationCost } from "lib/roadmaps/visibility";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Globe,
  Lightbulb,
  Lock,
  Sparkles,
  X,
} from "lucide-react";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { useDeferredValue, useState } from "react";

/**
 * Where the composer is before anything is paid: writing the goal, the few
 * seconds the preflight takes, or the questions it picked.
 */
type ComposerPhase = "goal" | "checking" | "brief";

const MAX_GOAL_LENGTH = 500;
const MIN_GOAL_LENGTH = 5;

/**
 * Starting points for an empty form — a click fills both fields, nothing more.
 * Title and goal live in `supporter:panel.generate.examples.<i>`.
 */
const GOAL_EXAMPLES = [0, 1, 2, 3];

/** Label and hint are `supporter:panel.generate.visibility.<value>`. */
const VISIBILITY_OPTIONS = [
  { value: "public", Icon: Globe },
  { value: "private", Icon: Lock },
] as const;

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className='space-y-2.5'>
    <p className='text-sm font-semibold text-zinc-300'>{label}</p>
    {children}
  </div>
);

const segmentClass = (selected: boolean) =>
  cn(
    "flex min-h-10 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-500",
    selected
      ? "bg-zinc-700 text-zinc-50"
      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
  );

const EMPTY_CONTEXT: RoadmapGoalContext = { favourites: "", canPlay: "" };

const contextInputClass =
  "w-full rounded-lg bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-600";

/**
 * The optional part of the brief: who they love listening to and what they can
 * already play. Folded away by default — the goal alone is
 * enough to generate from — and each answer makes the plan fit a little better.
 */
const GoalContextFields = ({
  context,
  onChange,
}: {
  context: RoadmapGoalContext;
  onChange: (next: RoadmapGoalContext) => void;
}) => {
  const { t } = useTranslation("supporter");
  const [open, setOpen] = useState(false);
  const filled = [context.favourites.trim(), context.canPlay.trim()].filter(
    Boolean,
  ).length;

  return (
    <div className='rounded-lg bg-zinc-800/30'>
      <button
        type='button'
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className='flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800/40'>
        <span className='min-w-0 flex-1'>
          <span className='block text-sm font-semibold text-zinc-200'>
            {t("panel.generate.more.title")}
            <span className='ml-2 font-normal text-zinc-500'>
              {filled
                ? t("panel.generate.more.answered", { count: filled })
                : t("panel.optional")}
            </span>
          </span>
          <span className='block text-xs text-zinc-500'>
            {t("panel.generate.more.body")}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className='space-y-5 px-4 pb-5 pt-2'>
          <div className='grid gap-5 md:grid-cols-2'>
            <Field label={t("panel.generate.more.favourites")}>
              <input
                type='text'
                value={context.favourites}
                maxLength={MAX_CONTEXT_FIELD_LENGTH}
                onChange={(event) =>
                  onChange({ ...context, favourites: event.target.value })
                }
                placeholder={t("panel.generate.more.favourites_placeholder")}
                className={contextInputClass}
              />
            </Field>
            <Field label={t("panel.generate.more.can_play")}>
              <input
                type='text'
                value={context.canPlay}
                maxLength={MAX_CONTEXT_FIELD_LENGTH}
                onChange={(event) =>
                  onChange({ ...context, canPlay: event.target.value })
                }
                placeholder={t("panel.generate.more.can_play_placeholder")}
                className={contextInputClass}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
};

const TokenAmount = ({ value }: { value: number }) => (
  <span className='flex items-center gap-1 tabular-nums'>
    <SupportToken size={15} />
    {value}
  </span>
);

/** The same amount inside a sentence. */
const TokenAmountInline = ({ value }: { value: number }) => (
  <span className='inline-flex items-center gap-1 align-middle font-bold tabular-nums text-zinc-200'>
    <SupportToken size={13} />
    {value}
  </span>
);

/**
 * Lets a supporter generate their own AI roadmap — the same pipeline the admin
 * queue runs (a drafted skeleton, a review pass, house-style descriptions per
 * phase, then lessons), run as a background job on the server: the open tab
 * pushes it along and shows its progress, and it finishes without the tab too.
 *
 * It is a composer that is always open rather than a strip to expand: a title
 * for the roadmap, then a description of the goal, are the whole invitation,
 * so they are the first thing shown. Level and visibility sit under it as two segmented rows, and the one
 * button at the bottom carries the price.
 *
 * It costs tokens, like everything else in the panel — charged once per goal
 * by the server, so a retry of the same goal is free. The wallet is only for
 * the price tag and the disabled button; the server is what actually says no.
 *
 * When the roadmap lands, the card hands it over and resets: the review
 * happens on the roadmap itself, with the reviewer's notes beside the map.
 */
export const GenerateRoadmapCard = ({
  onGenerated,
  wallet,
}: {
  /** The finished roadmap's id — once, whether this tab ran it or only watched. */
  onGenerated: (roadmapId: string) => void;
  wallet?: SupporterWallet;
}) => {
  const { t } = useTranslation(["supporter", "ai_coach"]);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<RoadmapLevel>("Intermediate");
  const [visibility, setVisibility] = useState<RoadmapVisibility>("public");
  const [context, setContext] = useState<RoadmapGoalContext>(EMPTY_CONTEXT);
  // Folded to one bar until asked for: the form is a long way to scroll past
  // for everyone who came to browse the roadmaps below it.
  const [expanded, setExpanded] = useState(false);
  const [phase, setPhase] = useState<ComposerPhase>("goal");
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  // What the preflight said no to — a goal that is not about guitar, or a
  // check that could not run. Shown by the goal, where it can be fixed.
  const [goalNotice, setGoalNotice] = useState<string | null>(null);
  const { status, stage, progress, error, start, reset } = useGenerateRoadmap({
    onDone: (roadmapId) => {
      setTitle("");
      setGoal("");
      setExpanded(false);
      setPhase("goal");
      setPreflight(null);
      reset();
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
  // Deferred, so matching a few dozen goals never gets in the way of typing.
  // The title and the description together are what the goal is about.
  const deferredGoal = useDeferredValue(`${title} ${goal}`.trim());
  const hint = goalHint(deferredGoal);
  const selectedVisibility = VISIBILITY_OPTIONS.find(
    (option) => option.value === visibility,
  );

  /**
   * The free look before paying. A goal that is not about guitar stops here;
   * a check that fails lets the player generate anyway — the questions are an
   * improvement, not a gate.
   */
  const handleContinue = async () => {
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
        setPhase("goal");
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
    await start(title.trim(), goal.trim(), level, visibility, context, brief);
  };

  const backToGoal = () => {
    setPhase("goal");
    setPreflight(null);
  };

  // A job in flight, or one that failed, always shows — folding it away would
  // hide the only place that says what happened to the tokens.
  if (!expanded && status === "idle") {
    return (
      <section className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-5 sm:flex-row sm:items-center sm:justify-between md:px-6'>
        <div className='flex items-start gap-3.5'>
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-300'>
            <Sparkles size={18} />
          </span>
          <div>
            <h2 className='text-base font-bold text-white'>
              {t("panel.generate.title")}
            </h2>
            <p className='mt-0.5 text-sm text-zinc-400'>
              {t("panel.generate.folded_body")}
            </p>
          </div>
        </div>

        <button
          type='button'
          onClick={() => setExpanded(true)}
          className='flex shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white'>
          <Sparkles size={15} />
          {t("panel.generate.create")}
          <span className='ml-0.5 flex items-center gap-1 rounded bg-zinc-900/10 px-1.5 py-0.5 tabular-nums'>
            <SupportToken size={14} />
            {roadmapGenerationCost("public")}
          </span>
        </button>
      </section>
    );
  }

  return (
    <section className='rounded-lg bg-zinc-900/40 p-6 md:p-8'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-1.5'>
          <h2 className='text-lg font-bold text-zinc-100'>
            {running ? t("panel.generate.writing") : t("panel.generate.title")}
          </h2>
          <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
            {running
              ? t("panel.generate.running_body")
              : phase === "brief"
                ? t("panel.generate.brief_body")
                : t("panel.generate.goal_body")}
          </p>
        </div>

        <div className='flex shrink-0 items-center gap-2'>
          {tokensLeft !== undefined && !running && (
            <span className='flex w-fit items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-2 text-sm text-zinc-400'>
              <SupportToken size={16} />
              <span className='font-bold tabular-nums text-zinc-100'>
                {tokensLeft}
              </span>
              {t("panel.generate.tokens_left", { count: tokensLeft })}
            </span>
          )}
          {status === "idle" && (
            <button
              type='button'
              onClick={() => {
                setExpanded(false);
                backToGoal();
              }}
              aria-label={t("panel.generate.close_builder")}
              title={t("panel.close")}
              className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100'>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {status === "idle" && phase === "checking" && (
        <div className='mt-4'>
          <PreflightChecking />
        </div>
      )}

      {status === "idle" && phase === "brief" && preflight && (
        <div className='mt-8'>
          <BriefWizard
            preflight={preflight}
            cost={cost}
            tokensLeft={tokensLeft}
            canAfford={canAfford}
            onBack={backToGoal}
            onGenerate={(brief) => void handleGenerate(brief)}
          />
        </div>
      )}

      {status === "idle" && phase === "goal" && (
        <div className='mt-8 space-y-8'>
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

          <Field label={t("panel.generate.title_label")}>
            <input
              type='text'
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("panel.generate.title_placeholder")}
              className='w-full rounded-lg bg-zinc-800/50 px-4 py-3 text-base font-semibold text-zinc-100 outline-none placeholder:font-normal placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-600'
            />
          </Field>

          <Field label={t("panel.generate.goal_label")}>
            <div className='rounded-lg bg-zinc-800/50 focus-within:ring-1 focus-within:ring-zinc-600'>
              <textarea
                rows={3}
                maxLength={MAX_GOAL_LENGTH}
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                aria-label={t("panel.generate.description")}
                placeholder={t("panel.generate.goal_placeholder")}
                className='block w-full resize-none bg-transparent px-4 pb-2 pt-4 text-base leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500'
              />
              <div className='flex items-end justify-between gap-4 px-4 pb-3'>
                {title || goal ? (
                  hint ? (
                    <p className='flex items-start gap-2 text-xs leading-relaxed text-zinc-400'>
                      <Lightbulb
                        size={13}
                        className='mt-0.5 shrink-0 text-amber-300/80'
                      />
                      {hint}
                    </p>
                  ) : (
                    <span />
                  )
                ) : (
                  <div className='flex flex-wrap gap-2'>
                    {GOAL_EXAMPLES.map((i) => (
                      <button
                        key={i}
                        type='button'
                        onClick={() => {
                          setTitle(t(`panel.generate.examples.${i}.title`));
                          setGoal(t(`panel.generate.examples.${i}.goal`));
                        }}
                        className='rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-700 hover:text-zinc-200'>
                        {t(`panel.generate.examples.${i}.title`)}
                      </button>
                    ))}
                  </div>
                )}
                <span className='shrink-0 text-xs tabular-nums text-zinc-600'>
                  {goal.length}/{MAX_GOAL_LENGTH}
                </span>
              </div>
            </div>
          </Field>

          <GoalContextFields context={context} onChange={setContext} />

          <div className='grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
            <Field label={t("panel.generate.level")}>
              <div className='grid grid-cols-2 gap-1 rounded-lg bg-zinc-800/40 p-1 sm:grid-cols-4'>
                {ROADMAP_LEVELS.map((candidate) => (
                  <button
                    key={candidate}
                    type='button'
                    onClick={() => setLevel(candidate)}
                    aria-pressed={level === candidate}
                    className={segmentClass(level === candidate)}>
                    {t(`ai_coach:levels.${candidate}`, candidate)}
                  </button>
                ))}
              </div>
            </Field>

            {/* A public roadmap gives the community something back for the
                compute, so it is the cheaper one. */}
            <Field label={t("panel.generate.who_sees")}>
              <div className='grid grid-cols-2 gap-1 rounded-lg bg-zinc-800/40 p-1'>
                {VISIBILITY_OPTIONS.map(({ value, Icon }) => (
                  <button
                    key={value}
                    type='button'
                    onClick={() => setVisibility(value)}
                    aria-pressed={visibility === value}
                    className={segmentClass(visibility === value)}>
                    <Icon size={14} className='shrink-0' />
                    {t(`panel.generate.visibility.${value}.label`)}
                    <span className='text-zinc-500'>·</span>
                    <TokenAmount value={roadmapGenerationCost(value)} />
                  </button>
                ))}
              </div>
              <p className='text-sm text-zinc-500'>
                {selectedVisibility &&
                  t(
                    `panel.generate.visibility.${selectedVisibility.value}.hint`,
                  )}
              </p>
            </Field>
          </div>

          <div className='flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm leading-relaxed text-zinc-500'>
              {!canAfford ? (
                <>
                  <Interpolate
                    text={t("panel.generate.needs")}
                    values={{
                      cost: (
                        <span className='font-bold text-zinc-200'>{cost}</span>
                      ),
                      left: (
                        <span className='font-bold text-zinc-200'>
                          {tokensLeft}
                        </span>
                      ),
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
                  values={{ cost: <TokenAmountInline value={cost} /> }}
                />
              )}
            </p>

            <button
              type='button'
              onClick={() => void handleContinue()}
              disabled={!goalReady}
              className='flex min-h-11 shrink-0 items-center justify-center gap-2.5 rounded-lg bg-zinc-100 px-5 text-sm font-bold text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 hover:bg-white'>
              {t("panel.generate.continue")}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {running && (
        <div className='mt-8'>
          <GenerationStepper stage={stage} progress={progress} />
        </div>
      )}

      {status === "error" && (
        <div className='mt-8 flex items-center gap-3 rounded-lg bg-red-950/20 px-4 py-3'>
          <AlertTriangle size={16} className='shrink-0 text-red-400' />
          <p className='text-sm text-red-300'>{error}</p>
          <button
            type='button'
            onClick={reset}
            className='ml-auto shrink-0 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-bold text-zinc-200 hover:bg-zinc-700'>
            {t("panel.try_again")}
          </button>
        </div>
      )}
    </section>
  );
};
