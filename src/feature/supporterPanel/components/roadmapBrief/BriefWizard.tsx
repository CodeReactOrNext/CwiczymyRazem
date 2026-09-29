import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import type { RoadmapSongRef } from "feature/aiCoach/types/roadmap.types";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import { LibrarySongPicker } from "feature/supporterPanel/components/roadmapBrief/LibrarySongPicker";
import { QuestionScreen } from "feature/supporterPanel/components/roadmapBrief/QuestionScreen";
import { AnimatePresence, motion } from "framer-motion";
import type { BriefAnswer, RoadmapBrief } from "lib/roadmaps/generation/brief";
import type { PreflightResult } from "lib/roadmaps/generation/preflight";
import {
  bankQuestion,
  type BankQuestionId,
  INCLUDE_OPTIONS,
  PRACTICE_STYLE_OPTIONS,
  type QuestionOption,
} from "lib/roadmaps/generation/questionBank";
import {
  ArrowLeft,
  ArrowRight,
  Music,
  Pencil,
  Quote,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

/** One screen of the wizard: a question from the bank, one the model wrote, the facts screen, or the summary. */
type Screen =
  | { kind: "notes" }
  | { kind: "bank"; id: BankQuestionId; options: QuestionOption[] }
  | {
      kind: "custom";
      id: string;
      question: string;
      options: QuestionOption[];
      multi: boolean;
    }
  | { kind: "confirm" };

const MULTI_KINDS = new Set(["checkboxes", "modelCheckboxes"]);

/** What a checkbox question starts with: everything ticked, the player unticks. */
const defaultValues = (id: BankQuestionId): string[] => {
  if (id === "includes") return Object.values(INCLUDE_OPTIONS);
  if (id === "practiceStyle") return Object.values(PRACTICE_STYLE_OPTIONS);
  return [];
};

const MAX_NOTES = 300;

const slide = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 32 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -32 }),
};

interface BriefWizardProps {
  preflight: PreflightResult;
  cost: number;
  tokensLeft?: number;
  canAfford: boolean;
  /** Back to the goal itself. */
  onBack: () => void;
  onGenerate: (brief: RoadmapBrief | null) => void;
}

/**
 * The questions the preflight picked, one per screen, then a summary and the
 * button that pays. Every screen can be skipped — the brief is a set of
 * constraints the player chose to give, never a form to fill — and the
 * summary lets them jump back to any answer before the tokens go.
 */
export const BriefWizard = ({
  preflight,
  cost,
  tokensLeft,
  canAfford,
  onBack,
  onGenerate,
}: BriefWizardProps) => {
  const screens = useMemo<Screen[]>(() => {
    const list: Screen[] = [];
    if (preflight.verdict === "too_obscure") list.push({ kind: "notes" });
    for (const asked of preflight.questions.asked) {
      const bank = bankQuestion(asked.id);
      list.push({
        kind: "bank",
        id: asked.id,
        options: asked.options ?? bank.options ?? [],
      });
    }
    for (const custom of preflight.questions.custom) {
      list.push({ kind: "custom", ...custom });
    }
    list.push({ kind: "confirm" });
    return list;
  }, [preflight]);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [values, setValues] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const asked of preflight.questions.asked) {
      initial[asked.id] = defaultValues(asked.id);
    }
    return initial;
  });
  const [songs, setSongs] = useState<RoadmapSongRef[]>(preflight.songsFound);
  const [otherSongs, setOtherSongs] = useState(
    preflight.songsMissing.map((song) => song.title).join(", "),
  );
  const [notes, setNotes] = useState("");

  const go = (next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex(Math.max(0, Math.min(screens.length - 1, next)));
  };

  const screen = screens[index];
  const questionCount = screens.length - 1;
  const isConfirm = screen.kind === "confirm";

  const buildBrief = (): RoadmapBrief | null => {
    const answers: BriefAnswer[] = [];
    for (const item of screens) {
      if (item.kind === "bank") {
        const chosen = values[item.id] ?? [];
        const options = item.options;
        // A checkbox question with everything ticked says nothing new.
        const multi = MULTI_KINDS.has(bankQuestion(item.id).kind);
        if (!chosen.length || (multi && chosen.length === options.length)) {
          continue;
        }
        answers.push({
          id: item.id,
          question: bankQuestion(item.id).question,
          values: chosen,
          labels: chosen.map(
            (value) => options.find((o) => o.value === value)?.label ?? value,
          ),
        });
      } else if (item.kind === "custom") {
        const chosen = values[item.id] ?? [];
        if (!chosen.length) continue;
        answers.push({
          id: item.id,
          question: item.question,
          values: chosen,
          labels: chosen.map(
            (value) =>
              item.options.find((o) => o.value === value)?.label ?? value,
          ),
        });
      }
    }
    const brief: RoadmapBrief = {
      answers,
      songs,
      otherSongs: otherSongs.trim(),
      notes: notes.trim(),
    };
    return answers.length || songs.length || brief.otherSongs || brief.notes
      ? brief
      : null;
  };

  /** One line per answered screen, for the summary — with where to jump to change it. */
  const summary = screens
    .map((item, at) => {
      if (item.kind === "bank") {
        const chosen = values[item.id] ?? [];
        if (!chosen.length) return null;
        const bank = bankQuestion(item.id);
        return {
          at,
          question: bank.question,
          answer: chosen
            .map((v) => item.options.find((o) => o.value === v)?.label ?? v)
            .join(", "),
        };
      }
      if (item.kind === "custom") {
        const chosen = values[item.id] ?? [];
        if (!chosen.length) return null;
        return {
          at,
          question: item.question,
          answer: chosen
            .map((v) => item.options.find((o) => o.value === v)?.label ?? v)
            .join(", "),
        };
      }
      if (item.kind === "notes" && notes.trim()) {
        return {
          at,
          question: "What you told the coach",
          answer: notes.trim(),
        };
      }
      return null;
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));

  const songsScreenAt = screens.findIndex(
    (item) => item.kind === "bank" && item.id === "songs",
  );

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between gap-4'>
        <button
          type='button'
          onClick={() => (index === 0 ? onBack() : go(index - 1))}
          className='flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100'>
          <ArrowLeft size={15} />
          {index === 0 ? "Edit the goal" : "Back"}
        </button>

        {questionCount > 0 && (
          <ol className='flex items-center gap-1.5' aria-label='Progress'>
            {screens.map((item, at) => (
              <motion.li
                key={at}
                animate={{
                  width: at === index ? 22 : 8,
                  opacity: at <= index ? 1 : 0.35,
                }}
                className={cn(
                  "h-2 rounded-full",
                  at < index
                    ? "bg-emerald-400/80"
                    : at === index
                      ? "bg-amber-400"
                      : "bg-zinc-600",
                )}
                aria-current={at === index ? "step" : undefined}
                title={item.kind === "confirm" ? "Summary" : undefined}
              />
            ))}
          </ol>
        )}
      </div>

      <div className='relative min-h-[260px] overflow-hidden'>
        <AnimatePresence mode='wait' custom={direction} initial={false}>
          <motion.div
            key={index}
            custom={direction}
            variants={slide}
            initial='enter'
            animate='center'
            exit='exit'
            transition={{ duration: 0.22, ease: "easeOut" }}>
            {screen.kind === "notes" && (
              <div className='space-y-5'>
                <div className='space-y-1.5'>
                  <h3 className='text-lg font-bold text-zinc-100'>
                    The coach does not know this one well
                  </h3>
                  <p className='text-sm leading-relaxed text-zinc-400'>
                    {preflight.reason ||
                      "Name two or three songs or techniques you want from it, and the plan is built on those rather than on guesses."}
                  </p>
                </div>
                <textarea
                  rows={3}
                  value={notes}
                  maxLength={MAX_NOTES}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder='e.g. the intro riff of Song A, the way they use open strings in Song B, the fingerpicked verse of Song C'
                  className='block w-full resize-none rounded-lg bg-zinc-800/50 px-4 py-3 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-600'
                />
              </div>
            )}

            {screen.kind === "bank" && screen.id === "songs" && (
              <div className='space-y-6'>
                <div className='space-y-1.5'>
                  <h3 className='text-lg font-bold text-zinc-100'>
                    {bankQuestion("songs").question}
                  </h3>
                  <p className='text-sm text-zinc-400'>
                    {bankQuestion("songs").hint}
                  </p>
                </div>
                <LibrarySongPicker
                  songs={songs}
                  onChange={setSongs}
                  otherSongs={otherSongs}
                  onOtherSongsChange={setOtherSongs}
                  missing={preflight.songsMissing}
                />
              </div>
            )}

            {screen.kind === "bank" && screen.id !== "songs" && (
              <QuestionScreen
                question={bankQuestion(screen.id).question}
                hint={bankQuestion(screen.id).hint}
                options={screen.options}
                multi={MULTI_KINDS.has(bankQuestion(screen.id).kind)}
                values={values[screen.id] ?? []}
                onChange={(next) =>
                  setValues((prev) => ({ ...prev, [screen.id]: next }))
                }
              />
            )}

            {screen.kind === "custom" && (
              <QuestionScreen
                question={screen.question}
                options={screen.options}
                multi={screen.multi}
                values={values[screen.id] ?? []}
                onChange={(next) =>
                  setValues((prev) => ({ ...prev, [screen.id]: next }))
                }
              />
            )}

            {screen.kind === "confirm" && (
              <div className='space-y-6'>
                <div className='flex gap-3 rounded-lg bg-zinc-800/40 px-5 py-4'>
                  <Quote
                    size={16}
                    className='mt-1 shrink-0 text-amber-300/80'
                  />
                  <div className='space-y-1'>
                    <p className='text-xs font-semibold text-zinc-400'>
                      How the coach read your goal
                    </p>
                    <p className='text-sm leading-relaxed text-zinc-100'>
                      {preflight.understood ||
                        "A roadmap built around the goal as you wrote it."}
                    </p>
                  </div>
                </div>

                {(songs.length > 0 || summary.length > 0) && (
                  <ul className='space-y-1'>
                    {songs.length > 0 && (
                      <li className='flex items-start gap-3 rounded-lg px-3 py-2'>
                        <Music
                          size={15}
                          className='mt-0.5 shrink-0 text-zinc-500'
                        />
                        <span className='min-w-0 flex-1 text-sm'>
                          <span className='text-zinc-400'>Songs in it: </span>
                          <span className='text-zinc-100'>
                            {songs.map((song) => song.title).join(", ")}
                          </span>
                        </span>
                        {songsScreenAt >= 0 && (
                          <button
                            type='button'
                            onClick={() => go(songsScreenAt)}
                            aria-label='Change the songs'
                            className='rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100'>
                            <Pencil size={14} />
                          </button>
                        )}
                      </li>
                    )}
                    {summary.map((line) => (
                      <li
                        key={line.at}
                        className='flex items-start gap-3 rounded-lg px-3 py-2'>
                        <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600' />
                        <span className='min-w-0 flex-1 text-sm'>
                          <span className='text-zinc-400'>
                            {line.question}{" "}
                          </span>
                          <span className='text-zinc-100'>{line.answer}</span>
                        </span>
                        <button
                          type='button'
                          onClick={() => go(line.at)}
                          aria-label={`Change: ${line.question}`}
                          className='rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100'>
                          <Pencil size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!songs.length && !summary.length && (
                  <p className='text-sm text-zinc-500'>
                    Nothing to add — the coach takes it from here.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className='flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-sm leading-relaxed text-zinc-500'>
          {isConfirm ? (
            !canAfford ? (
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
            )
          ) : (
            `${index + 1} of ${questionCount} — every one can be skipped.`
          )}
        </p>

        <div className='flex shrink-0 items-center gap-2'>
          {!isConfirm && (
            <button
              type='button'
              onClick={() => go(index + 1)}
              className='rounded-lg px-4 py-2.5 text-sm font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100'>
              Skip
            </button>
          )}
          {isConfirm ? (
            <button
              type='button'
              onClick={() => onGenerate(buildBrief())}
              disabled={!canAfford}
              className='flex min-h-11 items-center justify-center gap-2.5 rounded-lg bg-amber-400 px-5 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 hover:bg-amber-300'>
              <Sparkles size={16} />
              Generate roadmap
              <span className='flex items-center gap-1 rounded-md bg-zinc-950/10 px-1.5 py-0.5 tabular-nums'>
                <SupportToken size={15} />
                {cost}
              </span>
            </button>
          ) : (
            <button
              type='button'
              onClick={() => go(index + 1)}
              className='flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-5 text-sm font-bold text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white'>
              Next
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
