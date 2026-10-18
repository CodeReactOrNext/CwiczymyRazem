import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { YouTubeProps } from "react-youtube";
import YouTube from "react-youtube";

import type { BackingTrackController } from "../hooks/useBackingTrackSession";
import type { TabSourceMeasure } from "../utils/alignment";
import type { SyncTrack } from "../utils/autoSync";
import { shiftedBy } from "../utils/tempoMap";
import { BackingTrackEditor } from "./BackingTrackEditor";
import { NUDGE_COARSE_FACTOR, NUDGE_MS } from "./OffsetStepper";
import type { MixerTrack } from "./TrackMixer";

// The session owns the transport, so a viewer-driven scrub would be yanked back
// on the next tick — YouTube's own controls stay hidden.
const YOUTUBE_OPTS: YouTubeProps["opts"] = {
  height: "100%",
  width: "100%",
  playerVars: {
    controls: 0,
    disablekb: 1,
    modestbranding: 1,
    rel: 0,
    enablejsapi: 1,
  },
};

/** Sits above the editor, which itself clears the session view. */
const ABOVE_EDITOR_Z = 100000000;

interface BackingTrackBarProps {
  controller: BackingTrackController;
  /** The session's transport, so the editor can start and stop it — syncing
   *  means listening, and walking back to the session's own play button would
   *  close the editor. */
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  /** Clicking the tab lane in the editor plays from that beat. */
  onSeekToBeat?: (beat: number) => void;
  /** Whether the editor is up. Owned by the session: the button that opens it
   *  sits beside the tab (BackingTrackButton), and the session hands over the
   *  keyboard while it is open. */
  isAligning?: boolean;
  onAligningChange?: (isAligning: boolean) => void;
  /** Moves the session tempo along with the recording's — see the editor. */
  onSessionBpmChange?: (bpm: number) => void;
  /** The session tempo now, so undoing automatic sync can put it back. */
  sessionBpm?: number;
  /** Metronome's meter, so the editor numbers real bars. */
  beatsPerBar?: number;
  /** The exercise tablature, drawn as real tab in the editor. */
  measures?: TabSourceMeasure[];
  /** Every track of the Guitar Pro file — what automatic sync listens for. */
  syncTracks?: SyncTrack[];
  /** The Guitar Pro instruments, so their levels are reachable while syncing. */
  mixerTracks?: MixerTrack[];
  onMixerChange?: (id: string, next: { volume?: number; isMuted?: boolean }) => void;
  className?: string;
}

/**
 * Everything the backing track puts on screen in the session: the video above
 * the tablature (when there is one), the editor, and the [ ] nudge keys.
 *
 * The video is mounted here and nowhere else. Moving a YouTube iframe in the
 * tree destroys it and the video buffers again, so every place it appears —
 * above the tab, full-screen behind it (cinema), in the editor's video box —
 * is the same element restyled in place. Without a video this takes no room at
 * all; the way into the editor is BackingTrackButton.
 */
export function BackingTrackBar({
  controller,
  isPlaying,
  onTogglePlay,
  onSeekToBeat,
  isAligning = false,
  onAligningChange,
  onSessionBpmChange,
  sessionBpm,
  beatsPerBar = 4,
  measures,
  syncTracks,
  mixerTracks,
  onMixerChange,
  className,
}: BackingTrackBarProps) {
  const { t } = useTranslation("backing_track");
  const {
    stems,
    youtubeVideoId,
    onYouTubePlayerReady,
    alignment,
    setAlignment,
    isCinema,
    setCinema,
    videoOverlay,
  } = controller;

  // The whole recording — bar 1 and every pinned bar together.
  const nudge = useCallback(
    (steps: number) => setAlignment(shiftedBy(alignment, steps * NUDGE_MS)),
    [alignment, setAlignment],
  );

  // [ and ] shift the recording live, editor open or not. Chosen because the
  // session already spends Space, J/K, the arrows and Enter (see
  // ShortcutsLegend), and because they sit under the right hand.
  const hasRecording = stems.length > 0;
  useEffect(() => {
    if (!hasRecording) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key !== "[" && event.key !== "]") return;
      event.preventDefault();
      const steps = event.key === "[" ? -1 : 1;
      nudge(event.shiftKey ? steps * NUDGE_COARSE_FACTOR : steps);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasRecording, nudge]);

  // Escape is the universal "give me my screen back".
  useEffect(() => {
    if (!isCinema || isAligning) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCinema(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCinema, isAligning, setCinema]);

  // ── The editor's video box ──────────────────────────────────────────────
  // The editor draws an empty box; the player is laid over it, measured from
  // the page, because it cannot move into it.
  const [slotElement, setSlotElement] = useState<HTMLDivElement | null>(null);
  /** The box, and the scrolling column it sits in — the picture is clipped
   *  to the column so it never hangs over the editor's title or transport. */
  const [slot, setSlot] = useState<{ rect: DOMRect; clip: DOMRect | null } | null>(null);

  useEffect(() => {
    if (!slotElement) return;
    const column = slotElement.closest<HTMLElement>("[data-video-clip]");
    const measure = () =>
      setSlot({
        rect: slotElement.getBoundingClientRect(),
        clip: column?.getBoundingClientRect() ?? null,
      });
    // An observer reports the box once as soon as it starts watching, which is
    // the first measurement — no synchronous read needed here.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(slotElement);
    window.addEventListener("resize", measure);
    // Capture, so a scroll of the column (which does not bubble) is heard too.
    window.addEventListener("scroll", measure, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [slotElement]);

  const showVideo = !!youtubeVideoId && videoOverlay;
  const inEditor = isAligning && !!slotElement && !!slot;

  /** How much of the box the column hides on each side, as a clip-path. */
  const slotClip = (() => {
    if (!slot?.clip) return undefined;
    const { rect, clip } = slot;
    const top = Math.max(0, clip.top - rect.top);
    const bottom = Math.max(0, rect.bottom - clip.bottom);
    if (top + bottom >= rect.height) return "inset(50%)";
    return `inset(${top}px 0 ${bottom}px 0 round 8px)`;
  })();

  const videoFrame = (
    <div
      className={cn(
        "overflow-hidden bg-black",
        inEditor
          ? "fixed rounded-lg"
          : isCinema
            ? // Fixed, so it escapes this bar and fills the session. It paints
              // before the notation in DOM order — video behind, tab on top.
              "fixed inset-0 z-0"
            : "aspect-video w-72 shrink-0 rounded-lg",
      )}
      style={
        inEditor && slot
          ? {
              left: slot.rect.left,
              top: slot.rect.top,
              width: slot.rect.width,
              height: slot.rect.height,
              zIndex: ABOVE_EDITOR_Z,
              clipPath: slotClip,
            }
          : undefined
      }>
      <div
        className={cn(
          isCinema && !inEditor
            ? // Cover the viewport whatever its shape: a 16:9 box grown to the
              // larger of "as wide as the screen" and "as tall as the screen".
              "absolute left-1/2 top-1/2 h-[max(100vh,56.25vw)] w-[max(100vw,177.78vh)] -translate-x-1/2 -translate-y-1/2"
            : "h-full w-full",
        )}>
        <YouTube
          videoId={youtubeVideoId ?? undefined}
          opts={YOUTUBE_OPTS}
          onReady={onYouTubePlayerReady}
          className='h-full w-full'
          iframeClassName='h-full w-full'
        />
      </div>
      {isCinema && !inEditor && (
        // Notation has to stay readable over a moving picture.
        <div className='absolute inset-0 bg-zinc-950/60' />
      )}
    </div>
  );

  return (
    <>
      {showVideo && (
        <div className={cn(isCinema ? "contents" : "relative mb-4 w-fit", !isCinema && className)}>
          {videoFrame}
          {!isCinema && !isAligning && (
            // On the picture itself, the way a player's own full-screen button is.
            <button
              type='button'
              onClick={() => setCinema(true)}
              className='absolute bottom-2 right-2 flex items-center gap-2 rounded-lg bg-zinc-950/70 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-950/90 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
              <Maximize2 className='h-3.5 w-3.5' />
              {t("bar.cinema")}
            </button>
          )}
        </div>
      )}

      {isAligning && (
        <BackingTrackEditor
          controller={controller}
          beatsPerBar={beatsPerBar}
          measures={measures}
          syncTracks={syncTracks}
          mixerTracks={mixerTracks}
          onMixerChange={onMixerChange}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onSeekToBeat={onSeekToBeat}
          onSessionBpmChange={onSessionBpmChange}
          sessionBpm={sessionBpm}
          videoSlotRef={setSlotElement}
          onClose={() => onAligningChange?.(false)}
        />
      )}

      {isCinema && !isAligning && (
        // The only chrome cinema keeps: enough to get back out without guessing.
        <button
          type='button'
          onClick={() => setCinema(false)}
          className='fixed right-6 top-6 z-10 flex items-center gap-2 rounded-lg bg-zinc-950/70 px-3 py-2 text-xs font-medium text-zinc-300 opacity-40 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:opacity-100'>
          <Minimize2 className='h-3.5 w-3.5' />
          {t("bar.leave_cinema_esc")}
        </button>
      )}
    </>
  );
}
