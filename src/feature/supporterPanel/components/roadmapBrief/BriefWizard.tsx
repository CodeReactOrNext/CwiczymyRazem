import { Button } from "assets/components/ui/button";
import { Textarea } from "assets/components/ui/textarea";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import type { RoadmapSongRef } from "feature/aiCoach/types/roadmap.types";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import {
  BuilderFrame,
  BuilderHeading,
} from "feature/supporterPanel/components/roadmapBrief/BuilderFrame";
import { LibrarySongPicker } from "feature/supporterPanel/components/roadmapBrief/LibrarySongPicker";
import { QuestionScreen } from "feature/supporterPanel/components/roadmapBrief/QuestionScreen";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import type { BriefAnswer, RoadmapBrief } from "lib/roadmaps/generation/brief";
import type { PreflightResult } from "lib/roadmaps/generation/preflight";
import {
  bankQuestion,
  type BankQuestionId,
  INCLUDE_OPTIONS,
  PRACTICE_STYLE_OPTIONS,
  type QuestionOption,
} from "lib/roadmaps/generation/questionBank";
import { ArrowRight, Music, Pencil, Quote, Sparkles } from "lucide-react";
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
  /** Screens the builder showed before these, for the bar across the top. */
  stepsBefore: number;
  /** Back to the screen before the questions. */
  onBack: () => void;
  onClose: () => void;
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
  stepsBefore,
  onBack,
  onClose,
  onGenerate,
}: BriefWizardProps) => {
  const { t } = useTranslation("supporter");
  // The bank is written in English, and the brief the model reads stays that
  // way; only what is shown here is said in the player's language.
  const bankText = (id: BankQuestionId) => {
    const bank = bankQuestion(id);
    return {
      question: t(`panel.brief.bank.${id}.question`, bank.question),
      hint: bank.hint && t(`panel.brief.bank.${id}.hint`, bank.hint),
    };
  };
  const localOptions = (id: BankQuestionId, options: QuestionOption[]) =>
    options.map((option) => ({
      ...option,
      label: t(
        `panel.brief.bank.${id}.options.${option.value}.label`,
        option.label,
      ),
      hint:
        option.hint &&
        t(`panel.brief.bank.${id}.options.${option.value}.hint`, option.hint),
    }));
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
        const shown = localOptions(item.id, item.options);
        return {
          at,
          question: bankText(item.id).question,
          answer: chosen
            .map((v) => shown.find((o) => o.value === v)?.label ?? v)
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
          question: t("panel.brief.told_coach"),
          answer: notes.trim(),
        };
      }
      return null;
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));

  const songsScreenAt = screens.findIndex(
    (item) => item.kind === "bank" && item.id === "songs",
  );

  const note = isConfirm ? (
    !canAfford ? (
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
      t("panel.brief.takes_minutes")
    )
  ) : (
    t("panel.brief.n_of", { n: index + 1, total: questionCount })
  );

  const actions = isConfirm ? (
    <Button
      type='button'
      size='lg'
      onClick={() => onGenerate(buildBrief())}
      disabled={!canAfford}>
      <Sparkles size={16} />
      {t("panel.brief.generate")}
      <span className='flex items-center gap-1 rounded bg-zinc-950/10 px-1.5 py-0.5 tabular-nums'>
        <SupportToken size={15} />
        {cost}
      </span>
    </Button>
  ) : (
    <>
      <Button
        type='button'
        variant='ghost'
        size='lg'
        onClick={() => go(index + 1)}>
        {t("panel.brief.skip")}
      </Button>
      <Button type='button' size='lg' onClick={() => go(index + 1)}>
        {t("panel.brief.next")}
        <ArrowRight size={15} />
      </Button>
    </>
  );

  return (
    <BuilderFrame
      progress={(stepsBefore + index + 1) / (stepsBefore + screens.length)}
      onBack={() => (index === 0 ? onBack() : go(index - 1))}
      onClose={onClose}
      tokensLeft={tokensLeft}
      note={note}
      actions={actions}>
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
              <div className='space-y-7'>
                <BuilderHeading
                  title={t("panel.brief.obscure_title")}
                  hint={preflight.reason || t("panel.brief.obscure_body")}
                />
                <Textarea
                  rows={3}
                  value={notes}
                  maxLength={MAX_NOTES}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={t("panel.brief.notes_placeholder")}
                  className='resize-none px-4 py-3 leading-relaxed'
                />
              </div>
            )}

            {screen.kind === "bank" && screen.id === "songs" && (
              <div className='space-y-7'>
                <BuilderHeading
                  title={bankText("songs").question}
                  hint={bankText("songs").hint}
                />
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
                question={bankText(screen.id).question}
                hint={bankText(screen.id).hint}
                options={localOptions(screen.id, screen.options)}
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
              <div className='space-y-7'>
                <BuilderHeading title={t("panel.brief.summary")} />
                <div className='flex gap-3 rounded-lg bg-zinc-800/40 px-5 py-4'>
                  <Quote
                    size={16}
                    className='mt-1 shrink-0 text-amber-300/80'
                  />
                  <div className='space-y-1'>
                    <p className='text-xs font-semibold text-zinc-400'>
                      {t("panel.brief.how_read")}
                    </p>
                    <p className='text-sm leading-relaxed text-zinc-100'>
                      {preflight.understood || t("panel.brief.as_written")}
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
                          <span className='text-zinc-400'>
                            {t("panel.brief.songs_in_it")}{" "}
                          </span>
                          <span className='text-zinc-100'>
                            {songs.map((song) => song.title).join(", ")}
                          </span>
                        </span>
                        {songsScreenAt >= 0 && (
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => go(songsScreenAt)}
                            aria-label={t("panel.brief.change_songs")}
                            className='shrink-0 text-zinc-400'>
                            <Pencil />
                          </Button>
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
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon-sm'
                          onClick={() => go(line.at)}
                          aria-label={t("panel.brief.change", {
                            question: line.question,
                          })}
                          className='shrink-0 text-zinc-400'>
                          <Pencil />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {!songs.length && !summary.length && (
                  <p className='text-sm text-zinc-500'>
                    {t("panel.brief.nothing_to_add")}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </BuilderFrame>
  );
};
