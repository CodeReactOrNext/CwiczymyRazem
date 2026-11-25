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

import { useAnswerKeys } from "../../hooks/useAnswerKeys";
import { useAutoListen } from "../../hooks/useAutoListen";
import { useEarQuizPlayback } from "../../hooks/useEarQuizPlayback";
import type { EarQuizBodyProps } from "./earQuizBody.types";
import { AnswerTile, ListenAidKey, ListenKey, QuizPrompt } from "./EarQuizChrome";

interface ChordTypeQuizProps extends EarQuizBodyProps {
  question: ChordTypeQuestion;
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
  autoPlay = false,
  keysEnabled = false,
}: ChordTypeQuizProps) {
  const { t } = useTranslation("session");
  const { isPlaying, play, stop } = useEarQuizPlayback();
  const [picked, setPicked] = useState<ChordQualityId | null>(null);
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
        onHear: () => playChord(ARPEGGIO_SPREAD),
        onContinue: onNext,
        answer: `${question.rootName}${answerQuality.suffix} — ${qualityName(question.quality)}`,
        detail: t(
          `quiz.chords.${question.quality}.character`,
          answerQuality.character,
        ),
      }
    : null;

  useAutoListen(autoPlay && !isAnswered, () => playChord(STRUM_SPREAD));
  useAnswerKeys(question.options.length, (index) => handlePick(question.options[index]), keysEnabled);

  return (
    <>
      <QuizPrompt question={t("quiz.which_chord")} verdict={verdict}>
        <ListenKey onClick={toggleChord} isPlaying={isPlaying && auditioned === null} label={t("quiz.play_chord")} />
        <ListenAidKey
          onClick={() => playChord(ARPEGGIO_SPREAD)}
          icon={<AudioWaveform aria-hidden />}
          label={t("quiz.one_note")}
        />
      </QuizPrompt>

      <div
        className={cn(
          "grid gap-3",
          question.options.length > 4
            ? "grid-cols-2 sm:grid-cols-4 shortwide:grid-cols-2 shortwide:gap-2"
            : "grid-cols-2 shortwide:gap-2",
        )}>
        {question.options.map((id, index) => {
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
              number={index + 1}
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
