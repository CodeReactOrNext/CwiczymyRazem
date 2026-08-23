import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { extractVideoId } from "feature/songs/utils/youtube.utils";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileAudio,
  Film,
  FolderOpen,
  Maximize2,
  Minimize2,
  Music2,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { YouTubeProps } from "react-youtube";
import YouTube from "react-youtube";

import type { BackingTrackController } from "../hooks/useBackingTrackSession";
import type { BackingSource } from "../types/backingTrack.types";
import type { TabSourceMeasure } from "../utils/alignment";
import { isCleanStretch } from "../utils/backingSync";
import { AlignmentScreen } from "./AlignmentScreen";
import type { MixerTrack } from "./TrackMixer";

/** One nudge, in ms. Shift multiplies it — see NUDGE_COARSE_FACTOR. */
const NUDGE_MS = 20;
const NUDGE_COARSE_FACTOR = 5;
const SOURCES: { value: BackingSource; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "file", label: "File" },
  { value: "youtube", label: "YouTube" },
];

const buttonClass =
  "rounded-lg bg-zinc-800/40 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100";

const nudgeButton =
  "flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/40 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100";

const sectionLabel = "text-xs font-semibold text-zinc-400";

interface BackingTrackBarProps {
  controller: BackingTrackController;
  /** Session tempo without the practice speed multiplier. */
  sessionBpm: number;
  /** The session's transport, so the alignment screen can start and stop it —
   *  lining a recording up means listening to it, and walking back to the
   *  session's own play button would close this screen. */
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  /** Clicking the tab lane in the alignment screen plays from that beat. */
  onSeekToBeat?: (beat: number) => void;
  /** Fires as the full-screen editor opens and closes, so the session can hand
   *  over the keyboard while it is up. */
  onAligningChange?: (isAligning: boolean) => void;
  /** Moves the session tempo, for the one-click "tempo the video can hold" fix. */
  onSessionBpmChange?: (bpm: number) => void;
  /** Metronome's meter, so the alignment ruler numbers real bars. */
  beatsPerBar?: number;
  /** The exercise tablature, drawn as real tab in the alignment screen. */
  measures?: TabSourceMeasure[];
  /** The Guitar Pro instruments, so their levels are reachable while aligning. */
  mixerTracks?: MixerTrack[];
  onMixerChange?: (id: string, next: { volume?: number; isMuted?: boolean }) => void;
  className?: string;
}

/**
 * Backing-track controls, docked directly above the tablature.
 *
 * Inline rather than behind a dialog: the video *is* the thing you look at while
 * playing, so it belongs in the same column as the tab, and the sync nudge has
 * to be reachable without covering the notation.
 *
 * The controls differ per source on purpose. A local file is an arbitrary
 * recording, so it needs its own tempo and level. A YouTube video is the song
 * itself, played by a service with its own volume and its own fixed speeds —
 * a "recording tempo" field there would only invite people to break the lock.
 */
export function BackingTrackBar({
  controller,
  sessionBpm,
  isPlaying,
  onTogglePlay,
  onSeekToBeat,
  onAligningChange,
  onSessionBpmChange,
  beatsPerBar = 4,
  measures,
  mixerTracks,
  onMixerChange,
  className,
}: BackingTrackBarProps) {
  const {
    source,
    setSource,
    desktopAvailable,
    library,
    isImporting,
    importTracks,
    deleteTrack,
    stems,
    addStem,
    removeStem,
    youtubeVideoId,
    setYouTubeVideoId,
    onYouTubePlayerReady,
    youtubeCanFollowTempo,
    youtubeAchievableBpms,
    alignment,
    setAlignment,
    playbackRate,
    isTrackLoading,
    error,
    isCinema,
    setCinema,
    videoOverlay,
    setVideoOverlay,
    videoAlignment,
    setVideoAlignment,
  } = controller;

  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [bpmDraft, setBpmDraft] = useState<string | null>(null);
  const [isAligning, setIsAligning] = useState(false);

  const openAligning = (open: boolean) => {
    setIsAligning(open);
    onAligningChange?.(open);
  };
  const [lastSourceBpm, setLastSourceBpm] = useState(alignment.sourceBpm);

  // A tempo change from anywhere else wins over an abandoned draft — adjusted
  // during render, the pattern React documents for resetting state on a prop.
  if (lastSourceBpm !== alignment.sourceBpm) {
    setLastSourceBpm(alignment.sourceBpm);
    setBpmDraft(null);
  }

  const hasActiveSource =
    (source === "file" && stems.length > 0) || (source === "youtube" && !!youtubeVideoId);

  const nudge = useCallback(
    (steps: number) => setAlignment({ offsetMs: alignment.offsetMs + steps * NUDGE_MS }),
    [alignment.offsetMs, setAlignment],
  );

  // The picture moves on its own: the video and the recording are two different
  // takes, so a nudge to one would put the other out.
  const nudgeVideo = useCallback(
    (steps: number) =>
      setVideoAlignment({
        offsetMs: videoAlignment.offsetMs + steps * NUDGE_MS,
      }),
    [videoAlignment.offsetMs, setVideoAlignment],
  );

  // [ and ] shift the track live. Chosen because the session already spends
  // Space, J/K, the arrows and Enter (see ShortcutsLegend), and because they sit
  // under the right hand without looking away from the tab.
  useEffect(() => {
    if (!hasActiveSource) return;

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
  }, [hasActiveSource, nudge]);

  // Escape is the universal "give me my screen back".
  useEffect(() => {
    if (!isCinema) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCinema(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCinema, setCinema]);

  // The session owns the transport, so a viewer-driven scrub would be yanked
  // back on the next tick — YouTube's own controls stay hidden.
  const youtubeOpts: YouTubeProps["opts"] = {
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

  // Only the handful either side of where the user already is — the full list of
  // eight is a wall of numbers nobody reads.
  const nearestAchievableBpms = [...youtubeAchievableBpms]
    .sort((a, b) => Math.abs(a - sessionBpm) - Math.abs(b - sessionBpm))
    .slice(0, 3)
    .sort((a, b) => a - b);

  const commitBpm = (raw: string) => {
    const parsed = Number(raw);
    setBpmDraft(null);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setAlignment({ sourceBpm: Math.min(400, Math.max(20, parsed)) });
  };

  const handleSaveUrl = () => {
    const videoId = extractVideoId(urlInput.trim());
    if (!videoId) {
      setUrlError(true);
      return;
    }
    setYouTubeVideoId(videoId);
    setUrlInput("");
    setUrlError(false);
  };

  const sourceSwitch = (
    <div className='flex items-center gap-1.5 rounded-lg bg-zinc-800/40 p-1'>
      {SOURCES.map(({ value, label }) => (
        <button
          key={value}
          type='button'
          onClick={() => setSource(value)}
          className={cn(
            "rounded px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            source === value
              ? "bg-cyan-500/10 text-cyan-400"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
          )}>
          {label}
        </button>
      ))}
    </div>
  );

  // One element, rendered wherever the active source puts it. Cinema stays a
  // class switch on purpose: moving the player in the tree would destroy the
  // iframe and make the video re-buffer on every toggle.
  const videoFrame = (
    <div
      className={cn(
        "overflow-hidden bg-black",
        isCinema
          ? // Fixed, so it escapes this bar and fills the session. It paints
            // before the notation in DOM order, which is exactly the layering
            // we want: video behind, tab on top.
            "fixed inset-0 z-0"
          : "aspect-video w-72 shrink-0 rounded-lg",
      )}>
      <div
        className={cn(
          isCinema
            ? // Cover the viewport whatever its shape: a 16:9 box grown to the
              // larger of "as wide as the screen" and "as tall as the screen",
              // then centred so the overflow is even.
              "absolute left-1/2 top-1/2 h-[max(100vh,56.25vw)] w-[max(100vw,177.78vh)] -translate-x-1/2 -translate-y-1/2"
            : "h-full w-full",
        )}>
        <YouTube
          videoId={youtubeVideoId ?? undefined}
          opts={youtubeOpts}
          onReady={onYouTubePlayerReady}
          className='h-full w-full'
          iframeClassName='h-full w-full'
        />
      </div>
      {isCinema && (
        // Notation has to stay readable over a moving picture.
        <div className='absolute inset-0 bg-zinc-950/60' />
      )}
    </div>
  );

  const videoPicker = (
    <div className='flex flex-col gap-2.5'>
      <div className='flex flex-wrap items-center gap-2'>
        <input
          className={cn(
            "h-9 min-w-0 flex-1 rounded-lg bg-zinc-800/40 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:bg-zinc-800/60",
            urlError && "bg-red-500/10",
          )}
          placeholder='youtube.com/watch?v=…'
          value={urlInput}
          onChange={(e) => {
            setUrlInput(e.target.value);
            setUrlError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSaveUrl()}
        />
        <button type='button' onClick={handleSaveUrl} className={buttonClass}>
          Use video
        </button>
      </div>
      {urlError && (
        <p className='text-xs text-red-400'>
          That isn&apos;t a YouTube link — try youtube.com/watch?v=… or youtu.be/…
        </p>
      )}
    </div>
  );

  const tempoFixes = onSessionBpmChange && nearestAchievableBpms.length > 0 && (
    <div className='flex flex-wrap items-center gap-2'>
      <span className='text-xs text-zinc-400'>Locks at</span>
      {nearestAchievableBpms.map((bpm) => (
        <button
          key={bpm}
          type='button'
          onClick={() => onSessionBpmChange(bpm)}
          className={cn(buttonClass, "tabular-nums")}>
          {bpm} BPM
        </button>
      ))}
    </div>
  );

  const cinemaButton = (
    <button
      type='button'
      onClick={() => setCinema(!isCinema)}
      className={cn(
        buttonClass,
        "flex items-center gap-2",
        isCinema && "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20",
      )}>
      {isCinema ? <Minimize2 className='h-3.5 w-3.5' /> : <Maximize2 className='h-3.5 w-3.5' />}
      {isCinema ? "Leave cinema" : "Cinema"}
    </button>
  );


  /**
   * Every control the backing track has, rendered inside the alignment screen
   * rather than here.
   *
   * The bar used to carry all of this above the tablature, which meant the
   * notation started a third of the way down the page. The full-screen editor is
   * where this work actually happens, so that is where the controls live; the
   * bar keeps only what has to be reachable without opening anything.
   */
  const settingsBody = (
    <>
      <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>{sourceSwitch}</div>
      {!isCinema && source === "off" && (
        <p className='mt-4 text-xs leading-relaxed text-zinc-400'>
          Play a recording of this song alongside the tab, locked to the same clock — pausing,
          restarting or clicking a bar takes it along.
        </p>
      )}
      {/* ── YouTube: the video itself, plus only what affects the lock ────── */}
      {source === "youtube" && (
        <div className={isCinema ? undefined : "mt-4"}>
          {youtubeVideoId ? (
            <div className={isCinema ? undefined : "flex flex-wrap items-start gap-5"}>

              {!isCinema && (
                <div className='flex min-w-[16rem] flex-1 flex-col gap-3'>
                  {youtubeCanFollowTempo ? (
                    <p className='text-xs leading-relaxed text-emerald-400'>
                      Locked to the tab at {playbackRate.toFixed(2)}× — the video holds this tempo
                      exactly.
                    </p>
                  ) : (
                    <>
                      <p className='flex items-start gap-2 text-xs leading-relaxed text-amber-400'>
                        <TriangleAlert className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                        YouTube only plays at its own fixed speeds and {Math.round(sessionBpm)} BPM
                        isn&apos;t one of them, so the video runs free instead of being yanked back
                        into place.
                      </p>
                      {tempoFixes}
                    </>
                  )}

                  <div className='flex flex-wrap items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => setYouTubeVideoId(null)}
                      className={buttonClass}>
                      Change video
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            videoPicker
          )}
        </div>
      )}
      {/* ── File: an arbitrary recording, so it needs its own tempo and level ─ */}
      {source === "file" && (
        <div className={isCinema ? "contents" : "mt-4 flex flex-col gap-4"}>
          {!isCinema && !desktopAvailable && (
            <p className='text-xs leading-relaxed text-zinc-400'>
              Backing-track files live on your computer, so this source is part of the desktop app.
              In the browser, use YouTube instead.
            </p>
          )}
          {!isCinema && desktopAvailable && (
            <>
              <div className='flex flex-wrap items-center gap-3'>
                <button
                  type='button'
                  onClick={importTracks}
                  disabled={isImporting}
                  className={cn(
                    buttonClass,
                    "flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50",
                  )}>
                  <FolderOpen className='h-3.5 w-3.5 text-zinc-400' />
                  {isImporting ? "Importing…" : "Add files"}
                </button>
                <span className='text-xs text-zinc-400'>
                  Pick several at once — backing, guitar, vocals — and they play as layers of one
                  recording.
                </span>
                {isTrackLoading && <span className='text-xs text-zinc-400'>Loading stems…</span>}
              </div>

              {library.length > 0 && (
                <div className='flex max-h-40 flex-col gap-1.5 overflow-y-auto'>
                  {library.map((track) => {
                    const stemIndex = stems.findIndex((stem) => stem.trackId === track.id);
                    const isStem = stemIndex >= 0;
                    return (
                      <div
                        key={track.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                          isStem ? "bg-cyan-500/10" : "bg-zinc-800/40",
                        )}>
                        <button
                          type='button'
                          onClick={() => (isStem ? removeStem(track.id) : addStem(track.id))}
                          aria-label={
                            isStem
                              ? `Remove ${track.name} from this song`
                              : `Add ${track.name} to this song`
                          }
                          className='flex min-w-0 flex-1 items-center gap-2.5 text-left focus-visible:outline-none'>
                          {isStem ? (
                            <Check className='h-3.5 w-3.5 shrink-0 text-cyan-400' />
                          ) : (
                            <FileAudio className='h-3.5 w-3.5 shrink-0 text-zinc-400' />
                          )}
                          <span
                            className={cn(
                              "truncate text-sm font-medium",
                              isStem ? "text-cyan-400" : "text-zinc-200",
                            )}>
                            {track.name}
                          </span>
                          {isStem && (
                            <span className='shrink-0 text-xs text-cyan-400'>
                              Layer {stemIndex + 1}
                            </span>
                          )}
                        </button>
                        <button
                          type='button'
                          onClick={() => deleteTrack(track.id)}
                          aria-label={`Delete ${track.name} from the library`}
                          className='rounded p-1.5 text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white/5 hover:text-zinc-100'>
                          <Trash2 className='h-3.5 w-3.5' />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {stems.length > 0 && (
                <div className='flex flex-wrap items-center gap-x-8 gap-y-4'>
                  <div className='flex items-center gap-2'>
                    <span className={sectionLabel}>Recording tempo</span>
                    <input
                      type='number'
                      min={20}
                      max={400}
                      value={bpmDraft ?? Math.round(alignment.sourceBpm)}
                      onChange={(e) => setBpmDraft(e.target.value)}
                      onBlur={(e) => commitBpm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && commitBpm(e.currentTarget.value)}
                      className='h-8 w-16 rounded-lg bg-zinc-800/40 px-2 text-sm tabular-nums text-zinc-100 outline-none transition-colors focus:bg-zinc-800/60'
                    />
                    <button
                      type='button'
                      onClick={() => setAlignment({ sourceBpm: sessionBpm })}
                      className={buttonClass}>
                      Match session
                    </button>
                    {/* A warning that the recording is being stretched past
                        where it still sounds like itself has to look like one. */}
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        isCleanStretch(playbackRate) ? "text-zinc-400" : "text-amber-400",
                      )}>
                      {playbackRate.toFixed(2)}×
                      {isCleanStretch(playbackRate) ? "" : " — stretched hard"}
                    </span>
                  </div>

                  <div className='flex min-w-[14rem] flex-1 items-center gap-3'>
                    <span className={sectionLabel}>Master</span>
                    <button
                      type='button'
                      onClick={() => setAlignment({ muted: !alignment.muted })}
                      aria-label={
                        alignment.muted ? "Unmute the backing track" : "Mute the backing track"
                      }
                      className={cn(
                        "rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        alignment.muted
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
                      )}>
                      {alignment.muted ? (
                        <VolumeX className='h-3.5 w-3.5' />
                      ) : (
                        <Volume2 className='h-3.5 w-3.5' />
                      )}
                    </button>
                    <Slider
                      value={[alignment.volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={([value]) => setAlignment({ volume: value })}
                      className='flex-1'
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Borrowed picture: the video from YouTube, the sound from here ─ */}
          {desktopAvailable && (
            <div className={isCinema ? "contents" : "flex flex-wrap items-start gap-5"}>
              {!isCinema && (
                <button
                  type='button'
                  onClick={() => setVideoOverlay(!videoOverlay)}
                  className={cn(
                    buttonClass,
                    "flex items-center gap-2",
                    videoOverlay && "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20",
                  )}>
                  <Film className='h-3.5 w-3.5' />
                  Video
                </button>
              )}


              {!isCinema && videoOverlay && !youtubeVideoId && (
                <div className='min-w-[16rem] flex-1'>{videoPicker}</div>
              )}

              {!isCinema && videoOverlay && youtubeVideoId && (
                <div className='flex min-w-[16rem] flex-1 flex-col gap-3'>
                  <p className='text-xs leading-relaxed text-zinc-400'>
                    Picture only — the video is muted and your files stay the sound. Both run off
                    the session clock, and each keeps its own sync.
                  </p>

                  {!youtubeCanFollowTempo && (
                    <>
                      <p className='flex items-start gap-2 text-xs leading-relaxed text-amber-400'>
                        <TriangleAlert className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                        YouTube has no speed for {Math.round(sessionBpm)} BPM, so the picture runs
                        free. What you hear stays locked either way.
                      </p>
                      {tempoFixes}
                    </>
                  )}

                  <div className='flex items-center gap-2'>
                    <span className={sectionLabel}>Video sync</span>
                    <button
                      type='button'
                      onClick={(e) => nudgeVideo(e.shiftKey ? -NUDGE_COARSE_FACTOR : -1)}
                      title={`Earlier — hold Shift for ${NUDGE_MS * NUDGE_COARSE_FACTOR} ms`}
                      aria-label='Nudge the video earlier'
                      className={nudgeButton}>
                      <ChevronLeft className='h-4 w-4' />
                    </button>
                    <span className='min-w-[4.5rem] text-center text-xs font-bold tabular-nums text-zinc-200'>
                      {videoAlignment.offsetMs > 0 ? "+" : ""}
                      {Math.round(videoAlignment.offsetMs)} ms
                    </span>
                    <button
                      type='button'
                      onClick={(e) => nudgeVideo(e.shiftKey ? NUDGE_COARSE_FACTOR : 1)}
                      title={`Later — hold Shift for ${NUDGE_MS * NUDGE_COARSE_FACTOR} ms`}
                      aria-label='Nudge the video later'
                      className={nudgeButton}>
                      <ChevronRight className='h-4 w-4' />
                    </button>
                  </div>

                  <div className='flex flex-wrap items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => setYouTubeVideoId(null)}
                      className={buttonClass}>
                      Change video
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!isCinema && error && <p className='mt-3 text-xs text-red-400'>{error}</p>}
    </>
  );

  /** Enough to know what is loaded without opening the editor. */
  const summary =
    source === "off"
      ? "Off"
      : source === "file"
        ? `${stems.length} ${stems.length === 1 ? "stem" : "stems"}`
        : youtubeVideoId
          ? "YouTube"
          : "No video yet";

  return (
    <div
      className={cn(
        isCinema ? "contents" : "mb-4 w-full rounded-lg bg-zinc-900/40 p-3 text-left",
        !isCinema && className,
      )}>
      {/* Mounted here and nowhere else. Moving the player in the tree destroys
          the iframe, and the video re-buffers every time. */}
      {youtubeVideoId && (source === "youtube" || videoOverlay) && videoFrame}

      {!isCinema && (
        <div className='flex flex-wrap items-center gap-3'>
          <Music2 className='h-4 w-4 text-zinc-400' />
          <span className='text-sm font-semibold text-zinc-200'>Backing track</span>
          <span className='text-xs text-zinc-400'>{summary}</span>

          <div className='ml-auto flex items-center gap-2'>
            <button
              type='button'
              onClick={() => openAligning(true)}
              className={cn(buttonClass, "flex items-center gap-2")}>
              <SlidersHorizontal className='h-3.5 w-3.5 text-zinc-400' />
              {hasActiveSource ? "Mixer & sync" : "Set up"}
            </button>
            {(source === "youtube" || videoOverlay) && youtubeVideoId && cinemaButton}
          </div>
        </div>
      )}

      {isAligning && (
        <AlignmentScreen
          controller={controller}
          beatsPerBar={beatsPerBar}
          measures={measures}
          mixerTracks={mixerTracks}
          onMixerChange={onMixerChange}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onSeekToBeat={onSeekToBeat}
          onSessionBpmChange={onSessionBpmChange}
          setup={settingsBody}
          onClose={() => openAligning(false)}
        />
      )}

      {isCinema && (
        // The only chrome cinema keeps: enough to get back out without guessing.
        <button
          type='button'
          onClick={() => setCinema(false)}
          className='fixed right-6 top-6 z-10 flex items-center gap-2 rounded-lg bg-zinc-950/70 px-3 py-2 text-xs font-medium text-zinc-300 opacity-40 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:opacity-100'>
          <Minimize2 className='h-3.5 w-3.5' />
          Leave cinema — Esc
        </button>
      )}
    </div>
  );
}
