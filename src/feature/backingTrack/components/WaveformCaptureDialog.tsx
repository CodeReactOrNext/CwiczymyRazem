import { cn } from "assets/lib/utils";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import { AudioLines, Check, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { YouTubeProps } from "react-youtube";
import YouTube from "react-youtube";

import type { YouTubeClockReading } from "../hooks/useYouTubeWaveform";
import { useYouTubeWaveform } from "../hooks/useYouTubeWaveform";

/** YouTube's own state number for "playing". The rest are paused, buffering,
 *  ended or unstarted, none of which is a moment of the recording. */
const YT_PLAYING = 1;

/**
 * How long a pass runs for.
 *
 * A waveform is worth having in proportion to how much of the song you are
 * actually aligning against, which is usually one section rather than five
 * minutes — and every second of it is a second of capture running. So the
 * choice is made up front and the pass stops itself.
 */
const LENGTHS: { label: string; seconds: number | null }[] = [
  { label: "15 s", seconds: 15 },
  { label: "30 s", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "Until I stop", seconds: null },
];

const button =
  "flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-700 hover:text-zinc-100";

type Phase = "idle" | "capturing" | "saving" | "done";

interface WaveformCaptureDialogProps {
  videoId: string;
  /**
   * Second of the video to open on.
   *
   * A capture is nearly always wanted around the part being aligned, and
   * scrubbing there by hand every time is a chore the screen already knows the
   * answer to.
   */
  startAtSec?: number;
  /** The store now holds more of this video than it did — re-read it. */
  onCaptured: () => void;
  onClose: () => void;
}

/**
 * Captures a stretch of a video's waveform, on its own, away from everything.
 *
 * A YouTube video's audio is behind a cross-origin iframe, so the only way to
 * see its shape is to hear it play and measure what comes out of the tab. That
 * used to run quietly alongside practice, which put a screen capture, a second
 * audio graph and a growing buffer on the same thread as the metronome, the tab
 * and the microphone — and a session that stutters is a worse trade than a
 * waveform you have to ask for.
 *
 * So it is asked for here: its own player, its own moment, a length picked in
 * advance, and nothing else running. What it learns is written to the same
 * store the lanes read, so closing this dialog is all it takes for the picture
 * to appear on the timeline.
 */
export function WaveformCaptureDialog({
  videoId,
  startAtSec = 0,
  onCaptured,
  onClose,
}: WaveformCaptureDialogProps) {
  const playerRef = useRef<{
    playVideo: () => void;
    pauseVideo: () => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    getPlaybackRate: () => number;
    getPlayerState: () => number;
  } | null>(null);

  const { isElectron } = useElectronWindowControls();
  const [phase, setPhase] = useState<Phase>("idle");
  const [lengthSec, setLengthSec] = useState<number | null>(30);
  const [remainingSec, setRemainingSec] = useState(0);

  const getClock = useCallback((): YouTubeClockReading | null => {
    const player = playerRef.current;
    if (!player) return null;
    try {
      return {
        currentTime: player.getCurrentTime() ?? 0,
        duration: player.getDuration() ?? 0,
        rate: player.getPlaybackRate() ?? 1,
        isPlaying: player.getPlayerState() === YT_PLAYING,
      };
      // A player that has been torn down under us throws rather than answering.
    } catch {
      return null;
    }
  }, []);

  const waveform = useYouTubeWaveform({
    videoId,
    getClock,
    listen: phase === "capturing",
  });

  // Publishing is what makes the coverage figure move while a pass runs.
  const watch = waveform.watch;
  useEffect(() => watch(), [watch]);

  const { stop, flush } = waveform;
  const finish = useCallback(async () => {
    playerRef.current?.pauseVideo();
    stop();
    setPhase("saving");
    // Awaited, unlike the fire-and-forget write a pass normally ends with: the
    // copy of the hook drawing the timeline reads this back the moment we say
    // so, and reading before the write lands would show it the old picture.
    await flush();
    setPhase("done");
    onCaptured();
  }, [flush, onCaptured, stop]);

  const begin = () => {
    // `start` is what carries the click into the capture: on the web the
    // platform only hands over tab audio off a user gesture.
    waveform.start();
    setRemainingSec(lengthSec ?? 0);
    setPhase("capturing");
    playerRef.current?.playVideo();
  };

  // ── The clock that ends the pass ────────────────────────────────────────
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  useEffect(() => {
    if (phase !== "capturing" || lengthSec === null) return undefined;

    const endsAt = Date.now() + lengthSec * 1000;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemainingSec(left);
      if (left === 0) void finishRef.current();
    }, 200);
    return () => window.clearInterval(id);
  }, [phase, lengthSec]);

  /**
   * Leaving mid-pass keeps what was heard rather than throwing it away.
   *
   * Half a capture is still half a waveform, and it cost the same play-through
   * either way — so closing finishes the pass properly instead of abandoning it
   * and leaving the timeline showing the picture from before.
   */
  const close = () => {
    if (phase === "capturing") void finish();
    onClose();
  };

  // Escape closes this and not the editor behind it, the same way the mixer
  // menu does — the first press should shut what is actually on top.
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      closeRef.current();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  // Whatever happens to the dialog, the capture is not left running.
  useEffect(() => () => stop(), [stop]);

  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      // Its own controls, unlike the session's player: picking the stretch to
      // capture is the whole point, and that means scrubbing.
      controls: 1,
      modestbranding: 1,
      rel: 0,
      start: Math.max(0, Math.floor(startAtSec)),
    },
  };

  const heard = Math.round(waveform.coverage * 100);
  const isCapturing = phase === "capturing";
  const unsupported = waveform.status === "unsupported";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-6",
        // Centred, so on a short window the card's top edge would otherwise
        // slide under the desktop title bar — see AlignmentScreen.
        isElectron && "pt-[56px]",
      )}>
      <div className='flex w-full max-w-2xl flex-col gap-5 rounded-xl bg-zinc-900 p-6'>
        <div className='flex items-start gap-4'>
          <div className='flex flex-col gap-1'>
            <h3 className='text-base font-semibold text-zinc-100'>
              Capture the waveform
            </h3>
            <p className='text-xs leading-relaxed text-zinc-400'>
              The video&apos;s audio can only be measured by hearing it play, so
              this plays it and listens — on its own, with the session stopped,
              so nothing has to share a thread with it.
            </p>
          </div>
          <button
            type='button'
            onClick={close}
            aria-label='Close'
            className='ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-700 hover:text-zinc-100'>
            <X className='h-4 w-4' />
          </button>
        </div>

        <div className='aspect-video w-full overflow-hidden rounded-lg bg-black'>
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={(event) => {
              playerRef.current = event.target as typeof playerRef.current;
            }}
            className='h-full w-full'
            iframeClassName='h-full w-full'
          />
        </div>

        {unsupported ? (
          <p className='text-xs leading-relaxed text-amber-400'>
            This browser can&apos;t hand over tab audio, so there is no waveform
            to capture. Chrome and Edge can; Firefox and Safari cannot — or use
            the desktop app.
          </p>
        ) : (
          <>
            <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
              <span className='text-xs font-semibold text-zinc-400'>
                Capture for
              </span>
              <div className='flex flex-wrap items-center gap-1 rounded-lg bg-zinc-950/60 p-1'>
                {LENGTHS.map(({ label, seconds }) => (
                  <button
                    key={label}
                    type='button'
                    disabled={isCapturing}
                    onClick={() => setLengthSec(seconds)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      "disabled:opacity-40",
                      lengthSec === seconds
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                    )}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-4'>
              {isCapturing ? (
                <button
                  type='button'
                  onClick={() => void finish()}
                  className={cn(button, "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20")}>
                  <Square className='h-3.5 w-3.5' />
                  Stop
                  {lengthSec !== null && (
                    <span className='tabular-nums'>{remainingSec}s</span>
                  )}
                </button>
              ) : (
                <button
                  type='button'
                  disabled={phase === "saving"}
                  onClick={begin}
                  className={cn(button, "disabled:opacity-40")}>
                  <AudioLines className='h-3.5 w-3.5' />
                  {phase === "done" ? "Capture more" : "Start capture"}
                </button>
              )}

              {isCapturing && (
                <span
                  aria-hidden
                  className='h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-cyan-400'
                />
              )}

              <span className='text-xs tabular-nums text-zinc-400'>
                {heard > 0 ? `${heard}% of the video heard` : "Nothing heard yet"}
              </span>

              {phase === "done" && (
                <span className='flex items-center gap-1.5 text-xs font-medium text-emerald-400'>
                  <Check className='h-3.5 w-3.5' />
                  Saved
                </span>
              )}

              {phase === "done" && (
                <button
                  type='button'
                  onClick={close}
                  className={cn(button, "ml-auto")}>
                  Done
                </button>
              )}
            </div>

            {waveform.error ? (
              <p className='text-xs text-amber-400'>{waveform.error}</p>
            ) : (
              <p className='text-xs leading-relaxed text-zinc-500'>
                Scrub to the part you are aligning before starting — a capture
                only draws what it hears. Everything the tab plays is heard, so
                leave the rest of the app quiet while it runs.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
