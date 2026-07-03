import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { ArrowRight, Check, Ear, Eye, Mic, Play, Square, Trophy, Volume2, X } from "lucide-react";

import type { RiddleProgress } from "../hooks/useRiddleSequenceMatcher";

interface EarTrainingViewProps {
  onPlayRiddle: () => void;
  onReveal: () => void;
  onNextRiddle: () => void;
  onGuessed: () => void;
  score: number;
  highScore?: number | null;
  isRevealed: boolean;
  isGuessed?: boolean;
  isPlaying: boolean;
  canGuess: boolean;
  difficulty: "easy" | "medium" | "hard";
  isMicEnabled?: boolean;
  riddleProgress?: RiddleProgress | null;
  className?: string;
  onRecordsClick?: () => void;
}

const difficultyDot: Record<EarTrainingViewProps["difficulty"], string> = {
  easy: "bg-emerald-400",
  medium: "bg-blue-400",
  hard: "bg-orange-400",
};

export const EarTrainingView = ({
  onPlayRiddle,
  onReveal,
  onNextRiddle,
  onGuessed,
  score,
  highScore,
  isRevealed,
  isGuessed,
  isPlaying,
  canGuess,
  difficulty,
  isMicEnabled,
  riddleProgress,
  className,
  onRecordsClick,
}: EarTrainingViewProps) => {
  const listening = !!riddleProgress?.listening;
  const showDots = !!isMicEnabled && !!riddleProgress && riddleProgress.total > 0 && !isRevealed;
  const isNewBest = highScore != null && highScore > 0 && score > highScore;

  const status = isRevealed
    ? isGuessed
      ? { title: "Correct — point earned", caption: "The tab below shows the melody. Replay it to compare." }
      : { title: "Answer revealed", caption: "Compare with the tab below — did you play it right?" }
    : isPlaying
      ? { title: "Playing melody…", caption: isMicEnabled ? "Press stop when you're ready to answer" : "Listen closely, then echo it on your guitar" }
      : !canGuess
        ? { title: "Listen & repeat", caption: "Play the melody, then find it on your guitar" }
        : listening
          ? { title: "Your turn", caption: "Play the notes you heard — dots fill on correct notes" }
          : { title: "Your turn", caption: isMicEnabled ? "Play your answer, or replay the melody" : "Play it back, then check the answer" };

  return (
    <div className={cn("mx-auto w-full max-w-xl", className)}>
      <div className="rounded-xl border border-white/5 bg-zinc-900/70 px-4 py-3.5 sm:px-5 sm:py-4">

        {/* Header: label + score */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", difficultyDot[difficulty])} />
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Ear training
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
            <span className="text-zinc-500">
              Score <span className="font-bold text-zinc-100">{score}</span>
            </span>
            {highScore != null && highScore > 0 && (
              <button
                type="button"
                onClick={onRecordsClick}
                className={cn(
                  "flex items-center gap-1",
                  isNewBest ? "text-amber-400" : "text-zinc-500",
                  onRecordsClick && "transition-colors hover:text-zinc-300",
                )}
              >
                <Trophy className="h-3 w-3" />
                {isNewBest
                  ? <span className="font-bold">New best</span>
                  : <>Best <span className="font-bold">{highScore}</span></>}
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              isRevealed && isGuessed
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                : isPlaying
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                  : listening
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/5 text-zinc-500",
            )}
          >
            {isRevealed && isGuessed ? (
              <Check className="h-4 w-4" />
            ) : isRevealed ? (
              <Eye className="h-4 w-4" />
            ) : isPlaying ? (
              <Volume2 className="h-4 w-4 animate-pulse" />
            ) : listening ? (
              <Mic className="h-4 w-4" />
            ) : (
              <Ear className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-medium", isRevealed && isGuessed ? "text-emerald-300" : "text-zinc-200")}>
              {status.title}
            </p>
            <p className="text-xs text-zinc-500">{status.caption}</p>
          </div>

          {/* Sequence progress (mic mode) */}
          {showDots && riddleProgress && (
            <div className="flex shrink-0 flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: riddleProgress.total }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-all duration-200",
                      i < riddleProgress.matched
                        ? "bg-emerald-400"
                        : i === riddleProgress.matched && listening
                          ? "animate-pulse bg-white/10 ring-1 ring-emerald-400/60"
                          : "bg-white/10",
                    )}
                  />
                ))}
              </div>
              <span className="h-3 font-mono text-[10px] leading-3 text-zinc-600">
                {listening ? riddleProgress.heardNote ?? " " : " "}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        {!isRevealed ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isPlaying ? "secondary" : "default"}
              className="h-9 flex-1 font-semibold sm:max-w-[180px]"
              onClick={onPlayRiddle}
            >
              {isPlaying
                ? <><Square className="mr-1.5 h-3.5 w-3.5" /> Stop</>
                : <><Play className="mr-1.5 h-3.5 w-3.5" /> Play</>}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-4 text-zinc-400 hover:text-zinc-100"
              onClick={onReveal}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" /> Show answer
            </Button>
          </div>
        ) : !isGuessed ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-3 text-zinc-400 hover:text-zinc-100"
              onClick={onPlayRiddle}
              title={isPlaying ? "Stop" : "Replay melody"}
            >
              {isPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="sm"
              className="h-9 flex-1 bg-emerald-500/90 font-semibold text-emerald-950 hover:bg-emerald-400"
              onClick={() => { onGuessed(); onNextRiddle(); }}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" /> I had it&nbsp;<span className="opacity-70">+1</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-9 flex-1 bg-white/5 text-zinc-300 hover:bg-white/10"
              onClick={onNextRiddle}
            >
              <X className="mr-1.5 h-3.5 w-3.5" /> Missed it
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-3 text-zinc-400 hover:text-zinc-100"
              onClick={onPlayRiddle}
              title={isPlaying ? "Stop" : "Replay melody"}
            >
              {isPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="sm"
              className="h-9 flex-1 bg-emerald-500/90 font-semibold text-emerald-950 hover:bg-emerald-400"
              onClick={onNextRiddle}
            >
              Next melody <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};
