import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Eye, Trophy } from "lucide-react";

import type { RiddleProgress } from "../hooks/useRiddleSequenceMatcher";
import { EarQuizLayout, ListenKey, QuizPrompt } from "./EarQuiz/EarQuizChrome";

interface EarTrainingViewProps {
  onPlayRiddle: () => void;
  onReveal: () => void;
  score: number;
  highScore?: number | null;
  isRevealed: boolean;
  isPlaying: boolean;
  canGuess: boolean;
  isMicEnabled?: boolean;
  riddleProgress?: RiddleProgress | null;
  className?: string;
  onRecordsClick?: () => void;
}

/**
 * Play by Ear: hear the melody, find it on the guitar. Once the answer is up the
 * strip over the session bar takes over (EarRiddleStrip), and sideways this
 * steps aside for the tab.
 */
export const EarTrainingView = ({
  onPlayRiddle,
  onReveal,
  score,
  highScore,
  isRevealed,
  isPlaying,
  canGuess,
  isMicEnabled,
  riddleProgress,
  className,
  onRecordsClick,
}: EarTrainingViewProps) => {
  const { t } = useTranslation("session");
  const listening = !!riddleProgress?.listening;
  const showNotes = !!isMicEnabled && !!riddleProgress && riddleProgress.total > 0;
  const isNewBest = highScore != null && highScore > 0 && score > highScore;

  const caption = isRevealed
    ? t("ear.compare")
    : isPlaying
      ? t("ear.plays_once")
      : !canGuess
        ? t("ear.listen_repeat_caption")
        : listening
          ? t("ear.listening_caption")
          : isMicEnabled ? t("ear.your_turn_mic") : t("ear.your_turn_memory");

  return (
    <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-2 text-left", isRevealed && "shortwide:hidden", className)}>
      <div className='flex min-h-5 items-center justify-end gap-4 text-sm tabular-nums text-zinc-400'>
        <span>{t("ear.score")} <span className='font-bold text-zinc-100'>{score}</span></span>
        {highScore != null && highScore > 0 && (
          <button
            type='button'
            onClick={onRecordsClick}
            className={cn(
              "flex items-center gap-1.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              isNewBest ? "text-amber-400" : "text-zinc-400",
              onRecordsClick && "transition-colors hover:text-zinc-200",
            )}>
            <Trophy aria-hidden className='h-3.5 w-3.5' />
            {isNewBest
              ? <span className='font-bold'>{t("ear.new_best")}</span>
              : <span>{t("ear.best")} <span className='font-bold'>{highScore}</span></span>}
          </button>
        )}
      </div>

      <EarQuizLayout>
        <QuizPrompt question={t("ear.listen_play_back")} hint={<span aria-live='polite'>{caption}</span>}>
          <ListenKey
            onClick={onPlayRiddle}
            isPlaying={isPlaying}
            label={canGuess ? t("ear.replay") : t("quiz.play")}
          />
        </QuizPrompt>

        {!isRevealed && (
          <div className='flex flex-col items-center gap-4'>
            {showNotes && (
              <div
                className='grid w-full gap-3 shortwide:gap-2'
                style={{ gridTemplateColumns: `repeat(${Math.min(riddleProgress.total, 6)}, minmax(0, 1fr))` }}>
                {Array.from({ length: riddleProgress.total }, (_, i) => {
                  const found = i < riddleProgress.matched;
                  return (
                    <span
                      key={i}
                      translate='no'
                      className={cn(
                        "flex h-20 items-center justify-center rounded-lg font-display text-2xl font-extrabold transition-colors duration-fast shortwide:h-14 shortwide:text-xl",
                        found ? "bg-emerald-900 text-emerald-200" : "bg-zinc-950 text-zinc-500 shortwide:bg-zinc-900",
                      )}>
                      {found
                        ? riddleProgress.matchedNotes[i]
                        // What the mic hears, in the place it would fill.
                        : i === riddleProgress.matched && listening ? riddleProgress.heardNote : null}
                    </span>
                  );
                })}
              </div>
            )}
            <Button variant='ghost' onClick={onReveal}>
              <Eye /> {isMicEnabled ? t("ear.stuck_reveal") : t("ear.show_answer")}
            </Button>
          </div>
        )}
      </EarQuizLayout>
    </div>
  );
};
