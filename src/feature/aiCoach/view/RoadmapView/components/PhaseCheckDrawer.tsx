import { Chip } from "assets/components/ui/chip";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "assets/components/ui/drawer";
import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  Lock,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import React, { useMemo, useRef, useState } from "react";

import { fetchPhaseQuiz } from "../../../services/phaseQuiz.service";
import type {
  PhaseQuiz,
  PhaseQuizQuestion,
} from "../../../types/phaseCheck.types";
import type { RoadmapPhase } from "../../../types/roadmap.types";
import {
  getPhaseCheckState,
  isPassingScore,
  PHASE_CHECK_PASS_MARK,
  PHASE_CHECK_QUESTIONS,
} from "../../../utils/phaseCheck";
import { getStepStatus } from "../../../utils/stepStatus";

/** A question with its options in the order this attempt shows them. */
interface DealtQuestion {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

const shuffle = <T,>(list: T[]): T[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** A fresh deal: questions in a new order, options in a new order, answer re-pointed. */
const deal = (questions: PhaseQuizQuestion[]): DealtQuestion[] =>
  shuffle(questions).map((question) => {
    const order = shuffle(question.options.map((_, index) => index));
    return {
      id: question.id,
      prompt: question.prompt,
      options: order.map((index) => question.options[index]),
      answerIndex: order.indexOf(question.answerIndex),
      explanation: question.explanation,
    };
  });

type Stage =
  | { name: "intro" }
  | { name: "loading" }
  | { name: "error"; message: string }
  | {
      name: "question";
      questions: DealtQuestion[];
      index: number;
      picked: number | null;
      score: number;
    }
  | { name: "result"; questions: DealtQuestion[]; score: number };

const OPTION_LETTERS = ["A", "B", "C", "D"];

const ActionButton = ({
  onClick,
  children,
  disabled,
  tone = "primary",
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "primary" | "quiet";
}) => (
  <button
    type='button'
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
      tone === "primary"
        ? "bg-zinc-100 text-zinc-900 hover:bg-white"
        : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
    )}>
    {children}
  </button>
);

interface PhaseCheckBodyProps {
  phase: RoadmapPhase;
  phaseIdx: number;
  roadmapId: string;
  adminPassword?: string;
  /** Somebody else's roadmap: the quiz can be read about, not sat. */
  readOnly: boolean;
  onResult: (phaseId: string, score: number, total: number) => void;
}

const PhaseCheckBody = ({
  phase,
  phaseIdx,
  roadmapId,
  adminPassword,
  readOnly,
  onResult,
}: PhaseCheckBodyProps) => {
  const { t } = useTranslation("ai_coach");
  const [stage, setStage] = useState<Stage>({ name: "intro" });
  const quizRef = useRef<PhaseQuiz | null>(null);

  const state = getPhaseCheckState(phase);
  const openSteps = useMemo(
    () => phase.steps.filter((step) => getStepStatus(step) !== "done"),
    [phase.steps],
  );

  const start = async () => {
    setStage({ name: "loading" });
    try {
      const quiz =
        quizRef.current ??
        (await fetchPhaseQuiz(roadmapId, phase.id, adminPassword));
      quizRef.current = quiz;
      setStage({
        name: "question",
        questions: deal(quiz.questions),
        index: 0,
        picked: null,
        score: 0,
      });
    } catch (error) {
      setStage({
        name: "error",
        message:
          error instanceof Error ? error.message : t("check.load_failed"),
      });
    }
  };

  const pick = (option: number) => {
    if (stage.name !== "question" || stage.picked !== null) return;
    const correct = option === stage.questions[stage.index].answerIndex;
    setStage({
      ...stage,
      picked: option,
      score: stage.score + (correct ? 1 : 0),
    });
  };

  const next = () => {
    if (stage.name !== "question" || stage.picked === null) return;
    const last = stage.index === stage.questions.length - 1;
    if (last) {
      onResult(phase.id, stage.score, stage.questions.length);
      setStage({
        name: "result",
        questions: stage.questions,
        score: stage.score,
      });
    } else {
      setStage({ ...stage, index: stage.index + 1, picked: null });
    }
  };

  const chip =
    state === "passed"
      ? {
          color: "emerald" as const,
          label: t("check.passed"),
          dot: "bg-emerald-400",
        }
      : state === "ready"
        ? {
            color: "amber" as const,
            label: t("check.ready"),
            dot: "bg-amber-400",
          }
        : {
            color: "gray" as const,
            label: t("check.locked"),
            dot: "bg-zinc-500",
          };

  let body: React.ReactNode;

  if (stage.name === "loading") {
    body = (
      <div className='flex flex-col items-center gap-4 rounded-lg bg-zinc-900/40 px-6 py-14 text-center'>
        <Loader2 className='h-6 w-6 animate-spin text-cyan-400' />
        <div>
          <p className='text-sm font-semibold text-zinc-200'>
            {t("check.writing")}
          </p>
          <p className='mt-1 text-xs text-zinc-400'>
            {t("check.writing_body")}
          </p>
        </div>
      </div>
    );
  } else if (stage.name === "error") {
    body = (
      <div className='flex flex-col items-center gap-3 rounded-lg bg-zinc-900/40 px-6 py-12 text-center'>
        <p className='text-sm font-semibold text-zinc-200'>
          {t("check.failed")}
        </p>
        <p className='text-xs text-zinc-400'>{stage.message}</p>
        <ActionButton onClick={start} tone='quiet'>
          <RefreshCw className='h-3.5 w-3.5' /> {t("drawer.try_again")}
        </ActionButton>
      </div>
    );
  } else if (stage.name === "question") {
    const question = stage.questions[stage.index];
    const revealed = stage.picked !== null;
    body = (
      <div className='flex flex-col gap-6'>
        <div className='flex items-center gap-1' aria-hidden>
          {stage.questions.map((q, i) => (
            <span
              key={q.id}
              className={cn(
                "flex-1 rounded-full transition-colors",
                i === stage.index ? "h-2 bg-zinc-400" : "h-1",
                i < stage.index && "bg-zinc-600",
                i > stage.index && "bg-zinc-800",
              )}
            />
          ))}
        </div>

        <div>
          <p className='text-[11px] font-semibold text-zinc-500'>
            {t("check.question_of", {
              n: stage.index + 1,
              total: stage.questions.length,
            })}
          </p>
          <p className='mt-2 text-base font-semibold leading-relaxed text-zinc-100'>
            {question.prompt}
          </p>
        </div>

        <div role='radiogroup' className='flex flex-col gap-2'>
          {question.options.map((option, index) => {
            const isAnswer = index === question.answerIndex;
            const isPicked = index === stage.picked;
            return (
              <button
                key={index}
                type='button'
                role='radio'
                aria-checked={isPicked}
                disabled={revealed}
                onClick={() => pick(index)}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default",
                  !revealed &&
                    "bg-zinc-900/40 text-zinc-200 hover:bg-zinc-800/60",
                  revealed && isAnswer && "bg-emerald-500/10 text-emerald-200",
                  revealed &&
                    isPicked &&
                    !isAnswer &&
                    "bg-rose-500/10 text-rose-200",
                  revealed &&
                    !isAnswer &&
                    !isPicked &&
                    "bg-zinc-900/20 text-zinc-500",
                )}>
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold",
                    revealed && isAnswer
                      ? "bg-emerald-500/20 text-emerald-300"
                      : revealed && isPicked
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-zinc-800 text-zinc-400",
                  )}>
                  {revealed && isAnswer ? (
                    <Check className='h-3.5 w-3.5' />
                  ) : revealed && isPicked ? (
                    <X className='h-3.5 w-3.5' />
                  ) : (
                    OPTION_LETTERS[index]
                  )}
                </span>
                <span className='leading-relaxed'>{option}</span>
              </button>
            );
          })}
        </div>

        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className='flex flex-col gap-4'>
            {question.explanation && (
              <div className='rounded-lg bg-cyan-500/10 px-5 py-4'>
                <p className='text-xs font-semibold text-cyan-400'>
                  {stage.picked === question.answerIndex
                    ? t("check.right")
                    : t("check.not_quite")}
                </p>
                <p className='mt-2 text-sm leading-relaxed text-zinc-200'>
                  {question.explanation}
                </p>
              </div>
            )}
            <div className='flex justify-end'>
              <ActionButton onClick={next}>
                {stage.index === stage.questions.length - 1
                  ? t("check.see_result")
                  : t("check.next_question")}
                <ChevronRight className='h-4 w-4' />
              </ActionButton>
            </div>
          </motion.div>
        )}
      </div>
    );
  } else if (stage.name === "result") {
    const total = stage.questions.length;
    const passed = isPassingScore(stage.score, total);
    body = (
      <div className='flex flex-col gap-6'>
        <div
          className={cn(
            "flex flex-col items-center gap-3 rounded-lg px-6 py-10 text-center",
            passed ? "bg-emerald-500/10" : "bg-zinc-900/40",
          )}>
          {passed ? (
            <CheckCircle2 className='h-8 w-8 text-emerald-400' />
          ) : (
            <XCircle className='h-8 w-8 text-zinc-500' />
          )}
          <p className='font-display text-3xl font-black tabular-nums text-zinc-100'>
            {stage.score}/{total}
          </p>
          <p
            className={cn(
              "text-sm font-semibold",
              passed ? "text-emerald-300" : "text-zinc-200",
            )}>
            {passed ? t("check.passed_title") : t("check.not_yet")}
          </p>
          <p className='max-w-xs text-xs leading-relaxed text-zinc-400'>
            {passed
              ? phaseIdx === 0
                ? t("check.first_phase_done")
                : t("check.phase_done", { n: phaseIdx + 1 })
              : t("check.need", {
                  need: Math.min(total, PHASE_CHECK_PASS_MARK),
                  total,
                })}
          </p>
        </div>

        <div className='flex flex-wrap items-center justify-end gap-2'>
          <ActionButton onClick={start} tone='quiet'>
            <RefreshCw className='h-3.5 w-3.5' />
            {passed ? t("check.take_again") : t("drawer.try_again")}
          </ActionButton>
          <DrawerClose asChild>
            <button
              type='button'
              className='flex items-center justify-center gap-2 rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-bold text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white'>
              {t("check.back_to_map")}
            </button>
          </DrawerClose>
        </div>
      </div>
    );
  } else {
    // Intro
    body = (
      <div className='flex flex-col gap-6'>
        <div className='rounded-lg bg-zinc-900/40 px-5 py-5'>
          <p className='text-sm leading-relaxed text-zinc-300'>
            {t("check.intro", {
              questions: PHASE_CHECK_QUESTIONS,
              pass: PHASE_CHECK_PASS_MARK,
            })}
          </p>
        </div>

        {phase.check && phase.check.attempts > 0 && (
          <div className='flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-400'>
            <span>
              {t("check.best_run")}{" "}
              <span className='font-semibold tabular-nums text-zinc-200'>
                {phase.check.bestScore}/{phase.check.total}
              </span>
            </span>
            <span>{t("check.attempts", { count: phase.check.attempts })}</span>
            {phase.check.passedAt && (
              <span className='flex items-center gap-1.5 text-emerald-400'>
                <Check className='h-3.5 w-3.5' /> {t("check.passed")}
              </span>
            )}
          </div>
        )}

        {state === "locked" ? (
          <div className='flex flex-col gap-3'>
            <p className='flex items-center gap-2 text-sm font-semibold text-zinc-200'>
              <Lock className='h-4 w-4 text-zinc-500' />
              {t("check.finish_first")}
            </p>
            <ul className='flex flex-col gap-1.5'>
              {openSteps.map((step) => (
                <li
                  key={step.id}
                  className='flex items-center gap-2.5 rounded-lg bg-zinc-900/40 px-4 py-2.5 text-sm text-zinc-300'>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      getStepStatus(step) === "in-progress"
                        ? "bg-amber-400"
                        : "bg-zinc-600",
                    )}
                  />
                  {step.title}
                </li>
              ))}
            </ul>
          </div>
        ) : readOnly ? (
          <p className='text-sm text-zinc-500'>{t("check.read_only")}</p>
        ) : (
          <div className='flex justify-end'>
            <ActionButton onClick={start}>
              <ClipboardCheck className='h-4 w-4' />
              {state === "passed" ? t("check.take_again") : t("check.start")}
            </ActionButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <header className='flex flex-col gap-4 px-5 pb-5 pt-5 sm:px-7 sm:pt-6'>
        <div className='flex items-center justify-between gap-3'>
          <p className='truncate text-xs font-semibold text-zinc-400'>
            {t("phase_n", { n: phaseIdx + 1 })} · {phase.title}
          </p>
          <DrawerClose asChild>
            <button
              type='button'
              aria-label={t("drawer.close")}
              className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100'>
              <X className='h-4 w-4' />
            </button>
          </DrawerClose>
        </div>

        <div className='flex flex-col gap-3'>
          <DrawerTitle className='font-display text-xl font-bold leading-snug tracking-normal text-zinc-100 sm:text-2xl'>
            {t("checkpoint.locked")}
          </DrawerTitle>
          <DrawerDescription className='sr-only'>
            {t("check.sr_description", { n: phaseIdx + 1, title: phase.title })}
          </DrawerDescription>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <Chip color={chip.color}>
              <span className={cn("h-1.5 w-1.5 rounded-full", chip.dot)} />
              {chip.label}
            </Chip>
            <span className='text-xs text-zinc-400'>
              {t("check.steps_done", {
                done: phase.steps.length - openSteps.length,
                total: phase.steps.length,
              })}
            </span>
          </div>
        </div>
      </header>

      <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-1 sm:px-7'>
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={stage.name === "question" ? `q-${stage.index}` : stage.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}>
            {body}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

interface PhaseCheckDrawerProps {
  open: boolean;
  /** Stays set while the drawer slides out, so the panel never empties mid-animation. */
  phase: RoadmapPhase | null;
  phaseIdx: number;
  roadmapId: string;
  adminPassword?: string;
  readOnly: boolean;
  onClose: () => void;
  onResult: (phaseId: string, score: number, total: number) => void;
}

/**
 * The checkpoint at the end of a phase: a short quiz written from the phase's
 * own steps, in the same panel the steps open in. Passing it is what clears the
 * phase; the reward at the finish line waits for every one of them.
 */
export const PhaseCheckDrawer: React.FC<PhaseCheckDrawerProps> = ({
  open,
  phase,
  phaseIdx,
  roadmapId,
  adminPassword,
  readOnly,
  onClose,
  onResult,
}) => (
  <Drawer
    open={open}
    onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}
    direction='right'
    shouldScaleBackground={false}>
    <DrawerContent
      hideHandle
      overlayClassName='bg-black/60'
      className='bottom-[calc(58px_+_env(safe-area-inset-bottom,0px))] left-auto right-0 top-0 mt-0 h-auto w-full max-w-xl rounded-none border-0 bg-zinc-950 outline-none lg:bottom-0'>
      {phase && (
        <PhaseCheckBody
          key={phase.id}
          phase={phase}
          phaseIdx={phaseIdx}
          roadmapId={roadmapId}
          adminPassword={adminPassword}
          readOnly={readOnly}
          onResult={onResult}
        />
      )}
    </DrawerContent>
  </Drawer>
);
