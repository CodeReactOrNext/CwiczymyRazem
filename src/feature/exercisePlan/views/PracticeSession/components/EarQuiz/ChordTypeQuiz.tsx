import { cn } from "assets/lib/utils";
import {
  buildChordMidi,
  CHORD_QUALITIES,
} from "feature/exercisePlan/logic/earQuiz/chordQualities";
import type { ChordQualityId } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import type { ChordTypeQuestion } from "feature/exercisePlan/logic/earQuiz/questions";
import { useTranslation } from "hooks/useTranslation";
import { AudioWaveform } from "lucide-react";
import { useState } from "react";

import { useEarQuizPlayback } from "../../hooks/useEarQuizPlayback";
import {
  AnswerTile,
  ListenButton,
  QuizNote,
  QuizPrimarySlot,
  QuizQuestion,
  QuizSecondaryButton,
} from "./EarQuizChrome";

interface ChordTypeQuizProps {
  question: ChordTypeQuestion;
  isAnswered: boolean;
  isCorrect: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}

const CHORD_DURATION = 2.6;
const STRUM_SPREAD = 0.03;
/** Slow enough that each chord tone is a separate event to the ear. */
const ARPEGGIO_SPREAD = 0.42;

export function ChordTypeQuiz({
  question,
  isAnswered,
  isCorrect,
  onAnswer,
  onNext,
}: ChordTypeQuizProps) {
  const { t } = useTranslation("session");
  const { isPlaying, play, stop } = useEarQuizPlayback();
  const [picked, setPicked] = useState<ChordQualityId | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  /** Which option is sounding, once the tiles have turned into players. */
  const [auditioned, setAuditioned] = useState<ChordQualityId | null>(null);

  const strum = (midis: number[], spread: number) =>
    play(
      [{ midis, at: 0, duration: CHORD_DURATION, spread }],
      CHORD_DURATION + spread * midis.length,
    );

  const playChord = (spread: number) => {
    strum(question.midis, spread);
    setAuditioned(null);
    setHasPlayed(true);
  };

  // The primary button doubles as a stop; the arpeggio button always restarts,
  // otherwise pressing it mid-chord would just cut the sound off.
  const toggleChord = () => (isPlaying ? stop() : playChord(STRUM_SPREAD));

  // Answered, every tile plays its own quality on the round's root, so the
  // wrong guess can be heard right next to the chord it was mistaken for.
  const handlePick = (quality: ChordQualityId) => {
    if (isAnswered) {
      strum(buildChordMidi(question.rootMidi, quality), STRUM_SPREAD);
      setAuditioned(quality);
      return;
    }
    setPicked(quality);
    onAnswer(quality === question.quality);
  };

  const answerQuality = CHORD_QUALITIES[question.quality];
  const qualityName = (id: ChordQualityId) =>
    t(`quiz.chords.${id}.name`, CHORD_QUALITIES[id].name);

  const verdict = isAnswered
    ? {
        isCorrect,
        answer: `${question.rootName}${answerQuality.suffix} — ${qualityName(question.quality)}`,
        explanation: t(
          `quiz.chords.${question.quality}.character`,
          answerQuality.character,
        ),
      }
    : null;

  return (
    <>
      <div className='flex flex-col items-center gap-3'>
        <QuizQuestion question={t("quiz.which_chord")} verdict={verdict} />
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <QuizPrimarySlot isAnswered={isAnswered} onNext={onNext}>
            <ListenButton
              onClick={toggleChord}
              isPlaying={isPlaying}
              label={t("quiz.play_chord")}
              hasPlayed={hasPlayed}
            />
          </QuizPrimarySlot>
          <QuizSecondaryButton
            onClick={() => playChord(ARPEGGIO_SPREAD)}
            icon={<AudioWaveform />}>
            {isAnswered ? t("quiz.hear_again_slowly") : t("quiz.one_note")}
          </QuizSecondaryButton>
        </div>
        <QuizNote hint={t("quiz.root_moves")} verdict={verdict} />
      </div>

      <div
        className={cn(
          "grid gap-3",
          question.options.length > 4
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-2",
        )}>
        {question.options.map((id) => {
          const quality = CHORD_QUALITIES[id];
          const state = !isAnswered
            ? "idle"
            : id === question.quality
              ? "correct"
              : id === picked
                ? "wrong"
                : "muted";
          return (
            <AnswerTile
              key={id}
              onClick={() => handlePick(id)}
              state={state}
              title={qualityName(id)}
              subtitle={quality.formula}
              listenLabel={
                isAnswered
                  ? t("quiz.hear_from_root", {
                      name: qualityName(id),
                      root: question.rootName,
                    })
                  : undefined
              }
              isSounding={isPlaying && auditioned === id}
            />
          );
        })}
      </div>
    </>
  );
}
