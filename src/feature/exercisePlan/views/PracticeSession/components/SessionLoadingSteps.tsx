import { cn } from "assets/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { memo } from "react";

type LoadingStepState = "done" | "running" | "waiting";

export interface LoadingStep {
  key: string;
  label: string;
  state: LoadingStepState;
}

interface GpLoadingInput {
  /** Finding the file the song's tab lives in, or downloading it. */
  fetching: boolean;
  /** The file is in hand. */
  hasFile: boolean;
  /** Reading the tracks out of it. */
  parsing: boolean;
  /** The player has its sounds and the whole song loaded. */
  audioReady: boolean;
}

export interface GpLoadingLabels {
  file: string;
  parse: string;
  sound: string;
}

/**
 * What a Guitar Pro exercise still has to get through before it can be played:
 * the file, the tracks read out of it, and the player's sounds and song (a long
 * score's MIDI is generated for every track on load). None while there is no
 * file to wait for.
 */
export function gpLoadingSteps({ fetching, hasFile, parsing, audioReady }: GpLoadingInput, labels: GpLoadingLabels): LoadingStep[] {
  if (!fetching && !hasFile) return [];
  const after = (done: boolean): LoadingStepState => (!hasFile ? "waiting" : done ? "done" : "running");
  return [
    { key: "file", label: labels.file, state: hasFile ? "done" : "running" },
    { key: "parse", label: labels.parse, state: after(!parsing) },
    { key: "sound", label: labels.sound, state: after(audioReady) },
  ];
}

export const isStillLoading = (steps: readonly LoadingStep[]): boolean => steps.some((step) => step.state !== "done");

/** The steps, one per line, each marked done, in progress or still to come. */
export const SessionLoadingSteps = memo(function SessionLoadingSteps({ steps }: { steps: readonly LoadingStep[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {steps.map(({ key, label, state }) => (
        <li
          key={key}
          className={cn(
            "flex items-center gap-3 text-sm",
            state === "done" && "text-zinc-400",
            state === "running" && "text-zinc-100",
            state === "waiting" && "text-zinc-600",
          )}
        >
          {state === "done" && <Check className="h-4 w-4 text-emerald-400" aria-hidden />}
          {state === "running" && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" aria-hidden />}
          {state === "waiting" && <span className="mx-1 h-2 w-2 rounded-full bg-zinc-700" aria-hidden />}
          {label}
        </li>
      ))}
    </ul>
  );
});
