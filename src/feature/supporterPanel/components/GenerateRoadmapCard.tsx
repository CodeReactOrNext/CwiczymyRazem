import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import type { RoadmapVisibility } from "feature/aiCoach/types/roadmap.types";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import { GenerationStepper } from "feature/supporterPanel/components/GenerationStepper";
import { useGenerateRoadmap } from "feature/supporterPanel/hooks/useGenerateRoadmap";
import type { RoadmapGoalContext } from "feature/supporterPanel/types/roadmapJob.types";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
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
import { roadmapGenerationCost } from "lib/roadmaps/visibility";
import {
  AlertTriangle,
  ChevronDown,
  Globe,
  Lightbulb,
  Lock,
  Sparkles,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useDeferredValue, useState } from "react";

const MAX_GOAL_LENGTH = 500;
const MIN_GOAL_LENGTH = 5;

/** Starting points for an empty form — a click fills both fields, nothing more. */
const GOAL_EXAMPLES = [
  {
    title: "Blues like Stevie Ray Vaughan",
    goal: "Play Texas blues like Stevie Ray Vaughan: the shuffle rhythm, big bends and wide vibrato, and his signature licks over a 12-bar blues.",
  },
  {
    title: "Back after a break",
    goal: "Get my playing back after a few months off: calluses and stamina without injury, clean chord changes, timing, and the songs I used to play.",
  },
  {
    title: "Sing and play",
    goal: "Sing and play at the same time: strumming that runs on autopilot while the voice leads, starting with easy songs.",
  },
  {
    title: "Tight metal rhythm",
    goal: "Tight metal rhythm guitar: downpicking endurance, palm muting and gallops, locked to a metronome.",
  },
];

const VISIBILITY_OPTIONS = [
  {
    value: "public",
    Icon: Globe,
    label: "Public",
    hint: "Shows up in Player Roadmaps, so other players can learn from it too.",
  },
  {
    value: "private",
    Icon: Lock,
    label: "Private",
    hint: "Only you see it. Costs more, because nobody else gets to learn from it.",
  },
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
            Tell the coach more
            <span className='ml-2 font-normal text-zinc-500'>
              {filled ? `${filled} of 2 answered` : "optional"}
            </span>
          </span>
          <span className='block text-xs text-zinc-500'>
            Favourite artists and songs, what you can already play.
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
            <Field label='Artists or songs you love'>
              <input
                type='text'
                value={context.favourites}
                maxLength={MAX_CONTEXT_FIELD_LENGTH}
                onChange={(event) =>
                  onChange({ ...context, favourites: event.target.value })
                }
                placeholder='e.g. John Mayer, Slow Dancing in a Burning Room'
                className={contextInputClass}
              />
            </Field>
            <Field label='What you can already play'>
              <input
                type='text'
                value={context.canPlay}
                maxLength={MAX_CONTEXT_FIELD_LENGTH}
                onChange={(event) =>
                  onChange({ ...context, canPlay: event.target.value })
                }
                placeholder='e.g. open chords, the minor pentatonic box'
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
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<RoadmapLevel>("Intermediate");
  const [visibility, setVisibility] = useState<RoadmapVisibility>("public");
  const [context, setContext] = useState<RoadmapGoalContext>(EMPTY_CONTEXT);
  // Folded to one bar until asked for: the form is a long way to scroll past
  // for everyone who came to browse the roadmaps below it.
  const [expanded, setExpanded] = useState(false);
  const { status, stage, progress, error, start, reset } = useGenerateRoadmap({
    onDone: (roadmapId) => {
      setTitle("");
      setGoal("");
      setExpanded(false);
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

  const handleGenerate = async () => {
    if (!goalReady || !canAfford) return;
    await start(title.trim(), goal.trim(), level, visibility, context);
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
              Build a roadmap around your goal
            </h2>
            <p className='mt-0.5 text-sm text-zinc-400'>
              Describe what you want to play — the coach lays out the phases,
              exercises and songs.
            </p>
          </div>
        </div>

        <button
          type='button'
          onClick={() => setExpanded(true)}
          className='flex shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white'>
          <Sparkles size={15} />
          Create a roadmap
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
            {running
              ? "Writing your roadmap"
              : "Build a roadmap around your goal"}
          </h2>
          <p className='max-w-2xl text-sm leading-relaxed text-zinc-400'>
            {running
              ? "It takes a few minutes and runs on our side — you can leave this page or close the tab, and you will get a notification when it is ready. Stay here and it opens on its own."
              : "Describe what you want to be able to play. The coach lays out the phases, exercises, lessons and songs to get you there."}
          </p>
        </div>

        <div className='flex shrink-0 items-center gap-2'>
          {tokensLeft !== undefined && !running && (
            <span className='flex w-fit items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-2 text-sm text-zinc-400'>
              <SupportToken size={16} />
              <span className='font-bold tabular-nums text-zinc-100'>
                {tokensLeft}
              </span>
              {tokensLeft === 1 ? "token" : "tokens"} left
            </span>
          )}
          {status === "idle" && (
            <button
              type='button'
              onClick={() => setExpanded(false)}
              aria-label='Close the roadmap builder'
              title='Close'
              className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100'>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {status === "idle" && (
        <div className='mt-8 space-y-8'>
          <Field label='Title'>
            <input
              type='text'
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              onChange={(event) => setTitle(event.target.value)}
              placeholder='e.g. Play like Mark Knopfler'
              className='w-full rounded-lg bg-zinc-800/50 px-4 py-3 text-base font-semibold text-zinc-100 outline-none placeholder:font-normal placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-600'
            />
          </Field>

          <Field label='What do you want to be able to play?'>
            <div className='rounded-lg bg-zinc-800/50 focus-within:ring-1 focus-within:ring-zinc-600'>
              <textarea
                rows={3}
                maxLength={MAX_GOAL_LENGTH}
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                aria-label='Description'
                placeholder='e.g. I want to improvise over blues in any key and stop getting lost in the solo…'
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
                    {GOAL_EXAMPLES.map((example) => (
                      <button
                        key={example.title}
                        type='button'
                        onClick={() => {
                          setTitle(example.title);
                          setGoal(example.goal);
                        }}
                        className='rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-700 hover:text-zinc-200'>
                        {example.title}
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
            <Field label='Your level'>
              <div className='grid grid-cols-2 gap-1 rounded-lg bg-zinc-800/40 p-1 sm:grid-cols-4'>
                {ROADMAP_LEVELS.map((candidate) => (
                  <button
                    key={candidate}
                    type='button'
                    onClick={() => setLevel(candidate)}
                    aria-pressed={level === candidate}
                    className={segmentClass(level === candidate)}>
                    {candidate}
                  </button>
                ))}
              </div>
            </Field>

            {/* A public roadmap gives the community something back for the
                compute, so it is the cheaper one. */}
            <Field label='Who can see it'>
              <div className='grid grid-cols-2 gap-1 rounded-lg bg-zinc-800/40 p-1'>
                {VISIBILITY_OPTIONS.map(({ value, Icon, label }) => (
                  <button
                    key={value}
                    type='button'
                    onClick={() => setVisibility(value)}
                    aria-pressed={visibility === value}
                    className={segmentClass(visibility === value)}>
                    <Icon size={14} className='shrink-0' />
                    {label}
                    <span className='text-zinc-500'>·</span>
                    <TokenAmount value={roadmapGenerationCost(value)} />
                  </button>
                ))}
              </div>
              <p className='text-sm text-zinc-500'>
                {selectedVisibility?.hint}
              </p>
            </Field>
          </div>

          <div className='flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm leading-relaxed text-zinc-500'>
              {!canAfford ? (
                <>
                  This one needs{" "}
                  <span className='font-bold text-zinc-200'>{cost}</span> tokens
                  and you have{" "}
                  <span className='font-bold text-zinc-200'>{tokensLeft}</span>.{" "}
                  <a
                    href={BMC_URL}
                    target='_blank'
                    rel='noreferrer'
                    className='font-semibold text-amber-300 underline-offset-2 hover:underline'>
                    Every donation adds tokens
                  </a>
                </>
              ) : (
                "Takes a few minutes. You can leave while it writes — we will notify you."
              )}
            </p>

            <button
              type='button'
              onClick={() => void handleGenerate()}
              disabled={!goalReady || !canAfford}
              className='flex min-h-11 shrink-0 items-center justify-center gap-2.5 rounded-lg bg-amber-400 px-5 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 hover:bg-amber-300'>
              <Sparkles size={16} />
              Generate roadmap
              <span className='rounded-md bg-zinc-950/10 px-1.5 py-0.5'>
                <TokenAmount value={cost} />
              </span>
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
            Try again
          </button>
        </div>
      )}
    </section>
  );
};
