import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { extractVideoId } from "feature/songs/utils/youtube.utils";
import { useTranslation } from "hooks/useTranslation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  FileAudio,
  Film,
  FolderOpen,
  Maximize2,
  Minimize2,
  Music2,
  Plus,
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
/** Label and description are `backing_track:sources.<value>`. */
const SOURCES: BackingSource[] = ["off", "file", "youtube"];

/** A card inside the setup panel. Separated by background, never by a line. */
const panel = "flex flex-col gap-4 rounded-xl bg-zinc-900/60 p-4";
const panelTitle = "text-sm font-semibold text-zinc-100";
const panelText = "text-xs leading-relaxed text-zinc-400";

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
  const { t } = useTranslation("backing_track");
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
    <div className='flex w-fit items-center gap-1 rounded-lg bg-zinc-950/60 p-1'>
      {SOURCES.map((value) => (
        <button
          key={value}
          type='button'
          onClick={() => setSource(value)}
          aria-pressed={source === value}
          className={cn(
            "rounded-md px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            source === value
              ? "bg-cyan-500/10 text-cyan-400"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
          )}>
          {t(`sources.${value}.label`)}
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
          {t("bar.use_video")}
        </button>
      </div>
      {urlError && (
        <p className='text-xs text-red-400'>
          {t("bar.bad_link")}
        </p>
      )}
    </div>
  );

  const tempoFixes = onSessionBpmChange && nearestAchievableBpms.length > 0 && (
    <div className='flex flex-wrap items-center gap-2'>
      <span className='text-xs text-zinc-400'>{t("bar.locks_at")}</span>
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
      {isCinema ? t("bar.leave_cinema") : t("bar.cinema")}
    </button>
  );

  const nameOf = (trackId: string) => library.find((track) => track.id === trackId)?.name;

  /** Local files: what is on disk, which of it plays, and how loud. */
  const soundPanel = (
    <div className={panel}>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-col gap-1'>
          <span className={panelTitle}>{t("sound.title")}</span>
          <p className={panelText}>{t("sound.body")}</p>
        </div>
        <button
          type='button'
          onClick={importTracks}
          disabled={isImporting}
          className={cn(
            buttonClass,
            "flex shrink-0 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50",
          )}>
          <FolderOpen className='h-3.5 w-3.5 text-zinc-400' />
          {isImporting ? t("sound.importing") : t("sound.add_files")}
        </button>
      </div>

      {isTrackLoading && <p className={panelText}>{t("sound.loading")}</p>}

      {library.length === 0 ? (
        <p className={panelText}>
          {t("sound.empty")}
        </p>
      ) : (
        <div className='flex max-h-44 flex-col gap-1.5 overflow-y-auto'>
          {library.map((track) => {
            const stemIndex = stems.findIndex((stem) => stem.trackId === track.id);
            const isStem = stemIndex >= 0;
            return (
              <div
                key={track.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  isStem ? "bg-cyan-500/10" : "bg-zinc-800/40 hover:bg-zinc-800/70",
                )}>
                <button
                  type='button'
                  onClick={() => (isStem ? removeStem(track.id) : addStem(track.id))}
                  aria-label={
                    isStem
                      ? t("sound.remove_from_song", { name: track.name })
                      : t("sound.add_to_song", { name: track.name })
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
                      {t("sound.layer", { n: stemIndex + 1 })}
                    </span>
                  )}
                </button>
                <button
                  type='button'
                  onClick={() => deleteTrack(track.id)}
                  aria-label={t("sound.delete", { name: track.name })}
                  className='rounded p-1.5 text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white/5 hover:text-zinc-100'>
                  <Trash2 className='h-3.5 w-3.5' />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {stems.length > 0 && (
        <div className='flex flex-col gap-3 rounded-lg bg-zinc-950/40 p-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className={cn(sectionLabel, "w-28 shrink-0")}>
              {t("sound.recording_tempo")}
            </span>
            <input
              type='number'
              min={20}
              max={400}
              aria-label={t("sound.tempo_aria")}
              value={bpmDraft ?? Math.round(alignment.sourceBpm)}
              onChange={(e) => setBpmDraft(e.target.value)}
              onBlur={(e) => commitBpm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitBpm(e.currentTarget.value)}
              className='h-8 w-16 rounded-lg bg-zinc-800/60 px-2 text-sm tabular-nums text-zinc-100 outline-none transition-colors focus:bg-zinc-800'
            />
            <span className='text-xs text-zinc-400'>BPM</span>
            <button
              type='button'
              onClick={() => setAlignment({ sourceBpm: sessionBpm })}
              className={buttonClass}>
              {t("sound.match_session")}
            </button>
            {/* A warning that the recording is being stretched past
                where it still sounds like itself has to look like one. */}
            <span
              className={cn(
                "text-xs tabular-nums",
                isCleanStretch(playbackRate) ? "text-zinc-500" : "text-amber-400",
              )}>
              {t("sound.plays_at", { rate: playbackRate.toFixed(2) })}
              {isCleanStretch(playbackRate) ? "" : ` — ${t("sound.stretched")}`}
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <span className={cn(sectionLabel, "w-28 shrink-0")}>
              {t("sound.volume")}
            </span>
            <button
              type='button'
              onClick={() => setAlignment({ muted: !alignment.muted })}
              aria-label={alignment.muted ? t("sound.unmute") : t("sound.mute")}
              className={cn(
                "rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                alignment.muted
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
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
              className='max-w-xs flex-1'
            />
          </div>
        </div>
      )}
    </div>
  );

  /** Borrowed picture: the video from YouTube, the sound from the files. */
  const videoPanel = (
    <div className={panel}>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='flex items-baseline gap-2'>
            <span className={panelTitle}>{t("video.title")}</span>
            <span className='text-xs text-zinc-500'>{t("video.optional")}</span>
          </span>
          <p className={panelText}>{t("video.body")}</p>
        </div>
        <button
          type='button'
          onClick={() => setVideoOverlay(!videoOverlay)}
          aria-pressed={videoOverlay}
          className={cn(
            buttonClass,
            "flex shrink-0 items-center gap-2",
            videoOverlay && "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20",
          )}>
          <Film className='h-3.5 w-3.5' />
          {videoOverlay ? t("video.hide") : t("video.show")}
        </button>
      </div>

      {videoOverlay && !youtubeVideoId && videoPicker}

      {videoOverlay && youtubeVideoId && (
        <>
          {!youtubeCanFollowTempo && (
            <>
              <p className='flex items-start gap-2 text-xs leading-relaxed text-amber-400'>
                <TriangleAlert className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                {t("video.no_speed", { bpm: Math.round(sessionBpm) })}
              </p>
              {tempoFixes}
            </>
          )}

          <div className='flex flex-wrap items-center gap-2'>
            <span className={cn(sectionLabel, "w-28 shrink-0")}>
              {t("video.sync")}
            </span>
            <button
              type='button'
              onClick={(e) => nudgeVideo(e.shiftKey ? -NUDGE_COARSE_FACTOR : -1)}
              title={t("nudge.earlier", { ms: NUDGE_MS * NUDGE_COARSE_FACTOR })}
              aria-label={t("video.nudge_earlier")}
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
              title={t("nudge.later", { ms: NUDGE_MS * NUDGE_COARSE_FACTOR })}
              aria-label={t("video.nudge_later")}
              className={nudgeButton}>
              <ChevronRight className='h-4 w-4' />
            </button>
            <button
              type='button'
              onClick={() => setYouTubeVideoId(null)}
              className={cn(buttonClass, "ml-auto")}>
              {t("video.change")}
            </button>
          </div>
        </>
      )}
    </div>
  );

  /** A YouTube source: the link, and only what affects the lock. */
  const youtubePanel = (
    <div className={panel}>
      {youtubeVideoId ? (
        <>
          {youtubeCanFollowTempo ? (
            <p className='flex items-start gap-2 text-xs leading-relaxed text-emerald-400'>
              <Check className='mt-0.5 h-3.5 w-3.5 shrink-0' />
              {t("youtube.locked", { rate: playbackRate.toFixed(2) })}
            </p>
          ) : (
            <>
              <p className='flex items-start gap-2 text-xs leading-relaxed text-amber-400'>
                <TriangleAlert className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                {t("youtube.runs_free", { bpm: Math.round(sessionBpm) })}
              </p>
              {tempoFixes}
            </>
          )}
          <div>
            <button type='button' onClick={() => setYouTubeVideoId(null)} className={buttonClass}>
              {t("video.change")}
            </button>
          </div>
        </>
      ) : (
        <>
          <span className={panelTitle}>{t("youtube.paste")}</span>
          {videoPicker}
        </>
      )}
    </div>
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
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2.5'>
        {sourceSwitch}
        <p className={panelText}>{t(`sources.${source}.description`)}</p>
      </div>

      {source === "youtube" && youtubePanel}

      {source === "file" &&
        (desktopAvailable ? (
          <div className='grid gap-4 lg:grid-cols-2'>
            {soundPanel}
            {videoPanel}
          </div>
        ) : (
          <p className={cn(panel, panelText)}>
            {t("sound.desktop_only")}
          </p>
        ))}

      {error && <p className='text-xs text-red-400'>{error}</p>}
    </div>
  );

  /**
   * Whether the recording has been placed against the tab at all. Nothing pinned
   * and the start never moved means it is playing wherever it happened to begin,
   * which is almost never on the tab's first beat.
   */
  const isLinedUp =
    Math.round(alignment.offsetMs) !== 0 || (alignment.tempoAnchors?.length ?? 0) > 0;

  /** Enough to know what is loaded without opening the editor. */
  const summary =
    source === "file"
      ? stems.length === 1
        ? (nameOf(stems[0].trackId) ?? t("bar.files", { count: 1 }))
        : t("bar.files", { count: stems.length })
      : t("sources.youtube.label");

  const primaryButton =
    "flex items-center gap-2 rounded-lg bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-cyan-500/25";

  return (
    <div
      className={cn(
        isCinema
          ? "contents"
          : "mb-4 flex w-full flex-wrap items-center gap-x-5 gap-y-3 rounded-xl bg-zinc-900/40 p-3 text-left",
        !isCinema && className,
      )}>
      {/* Mounted here and nowhere else. Moving the player in the tree destroys
          the iframe, and the video re-buffers every time. */}
      {youtubeVideoId && (source === "youtube" || videoOverlay) && videoFrame}

      {!isCinema && (
        <div className='flex min-w-[16rem] flex-1 flex-wrap items-center gap-x-6 gap-y-3 px-1'>
          <div className='flex min-w-0 flex-1 items-start gap-3'>
            <Music2
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                !hasActiveSource
                  ? "text-zinc-400"
                  : isLinedUp
                    ? "text-emerald-400"
                    : "text-amber-400",
              )}
            />
            <div className='flex min-w-0 flex-col gap-1'>
              <div className='flex min-w-0 items-baseline gap-2'>
                <span className='shrink-0 text-sm font-semibold text-zinc-100'>
                  {hasActiveSource ? t("bar.title") : t("bar.title_empty")}
                </span>
                {hasActiveSource && (
                  <span className='truncate text-xs text-zinc-400'>{summary}</span>
                )}
              </div>
              <p
                className={cn(
                  "text-xs leading-relaxed",
                  hasActiveSource && !isLinedUp ? "text-amber-400" : "text-zinc-400",
                )}>
                {!hasActiveSource
                  ? t("bar.hint_empty")
                  : !isLinedUp
                    ? t("bar.hint_unaligned")
                    : t("bar.hint_aligned")}
              </p>
            </div>
          </div>

          <div className='flex shrink-0 items-center gap-2'>
            {!hasActiveSource ? (
              <button type='button' onClick={() => openAligning(true)} className={primaryButton}>
                <Plus className='h-3.5 w-3.5' />
                {t("bar.add_recording")}
              </button>
            ) : !isLinedUp ? (
              <button type='button' onClick={() => openAligning(true)} className={primaryButton}>
                <Crosshair className='h-3.5 w-3.5' />
                {t("bar.line_up")}
              </button>
            ) : (
              <button
                type='button'
                onClick={() => openAligning(true)}
                className={cn(buttonClass, "flex items-center gap-2")}>
                <SlidersHorizontal className='h-3.5 w-3.5 text-zinc-400' />
                {t("bar.sync_mix")}
              </button>
            )}
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
          {t("bar.leave_cinema_esc")}
        </button>
      )}
    </div>
  );
}
