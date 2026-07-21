import { cn } from "assets/lib/utils";
import { useEffect, useRef } from "react";

import { CountInOverlay } from "../CountInOverlay";
import { useTablatureSettings } from "../tablatureSettings";
import { ScoreControls } from "./ScoreControls";
import { TrackSelector } from "./TrackSelector";
import type { AlphaTabScoreViewerProps } from "./types";
import { useAlphaTabApi } from "./useAlphaTabApi";
import { useNoteHeadFeedback } from "./useNoteHeadFeedback";

/**
 * Interactive AlphaTab score/tab viewer.
 *
 * Playback (play/stop/BPM) is driven by the session's existing controls via
 * props — no duplicate play button. Audio belongs to this component when
 * active; the session's useAlphaTabPlayer is disabled while this is shown.
 */
export const AlphaTabScoreViewer = ({
  rawGpFile,
  measures,
  baseTempo,
  mode = "score",
  isPlaying,
  countInRemaining,
  startTime,
  bpm,
  volume = 1,
  isMetronomeMuted = false,
  trackConfigs,
  backingTrackIds,
  className,
  hitNotes,
  missedNotes,
  heightPx,
  resizeHandle,
}: AlphaTabScoreViewerProps) => {
  const notationDarkMode = useTablatureSettings((s) => s.notationDarkMode);
  const notationZoom = useTablatureSettings((s) => s.notationZoom);
  const notationSpacing = useTablatureSettings((s) => s.notationSpacing);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  // Refs kept in sync so AT callbacks always read the latest values
  const origBpmRef         = useRef(120);
  const bpmRef             = useRef(bpm);
  const volumeRef          = useRef(volume);
  // Guards api.stop() — AlphaSynth throws if stopped before it has ever played.
  const hasStartedRef      = useRef(false);

  useEffect(() => { bpmRef.current = bpm; },             [bpm]);
  useEffect(() => { volumeRef.current = volume; },       [volume]);

  const {
    apiRef,
    scrollRef,
    containerRef,
    uiReady,
    uiPlaying,
    tracks,
    selectedTrackIdx,
    currentMs,
    totalMs,
    handleTrackSelect,
  } = useAlphaTabApi({
    rawGpFile,
    measures,
    baseTempo,
    mode,
    volumeRef,
    bpmRef,
    origBpmRef,
    notationDarkMode,
    notationZoom,
    notationSpacing,
    trackConfigs,
    backingTrackIds,
  });

  // Colour the actual fret numbers green on a hit / red on a miss.
  useNoteHeadFeedback({ apiRef, overlayRef, uiReady, measures, hitNotes, missedNotes, selectedTrackIdx });

  // ── Playback: driven by session controls ─────────────────────────────────
  // startTime changing = new session → always restart from the beginning.
  // isPlaying toggling = play / stop at current position.
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !uiReady) return;

    if (isPlaying) {
      // Only stop once it has actually played — stopping a fresh AlphaSynth throws.
      if (hasStartedRef.current) { try { api.stop(); } catch { /* ignore */ } }
      // Toggling the view mid-playback remounts this AlphaTab instance; without a
      // seek it would restart the audio at the top. startTime is the metronome's
      // back-dated master clock, so this continues from the session's position.
      if (startTime) {
        const beats = ((Date.now() - startTime) / 1000) * (bpmRef.current / 60);
        if (beats > 0.1) {
          try { api.tickPosition = Math.max(0, Math.round(beats * 960)); } catch { /* ignore */ }
        }
      }
      try { api.play(); } catch { /* ignore */ }
      hasStartedRef.current = true;
    } else if (hasStartedRef.current) {
      try { api.stop(); } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, startTime, uiReady]);

  // ── BPM: update speed without restarting playback ────────────────────────
  useEffect(() => {
    if (apiRef.current && uiReady) {
      apiRef.current.playbackSpeed = bpm / (origBpmRef.current || 120);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, uiReady]);

  // ── Volume: sync with session mute toggle ─────────────────────────────────
  // uiReady in deps: re-applies volume the moment AT becomes ready, covering
  // the case where isAudioMuted changes before playerReady fires.
  useEffect(() => {
    if (apiRef.current && uiReady) apiRef.current.masterVolume = volume;
  }, [volume, uiReady]);

  // ── Metronome: AlphaTab's own built-in click, driven by the session's mute
  // toggle — the single metronome source while notation is shown (see
  // useSessionAudio, which mutes the separate device-metronome click for this
  // view) so the click can never drift from the notation playback's own clock.
  useEffect(() => {
    if (apiRef.current && uiReady) apiRef.current.metronomeVolume = isMetronomeMuted ? 0 : 1;
  }, [isMetronomeMuted, uiReady]);

  return (
    <div className={cn("w-full flex flex-col rounded-xl overflow-hidden", className)}>

      {/* Score viewport — must be the scrollable parent so AT cursor follows.
          Wrapped in a relative box so the resize handle can sit over its bottom edge. */}
      <div className="relative">
        <div
          ref={scrollRef}
          className={cn(
            "w-full overflow-auto",
            notationDarkMode ? "bg-zinc-950 notation-dark" : "bg-white",
          )}
          style={heightPx ? { height: heightPx } : { minHeight: 300, maxHeight: 500 }}
        >
          {/* position:relative wrapper so the overlay shares AlphaTab's coordinate
              space and scrolls together with the rendered score. */}
          <div className="relative">
            <div ref={containerRef} />
            <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-20" />
          </div>
        </div>
        <CountInOverlay count={countInRemaining} bpm={bpm} />
        {resizeHandle}
      </div>

      {/* Controls bar */}
      <div className="bg-zinc-900 px-3 py-2 flex flex-col gap-1.5">
        <TrackSelector
          tracks={tracks}
          selectedIdx={selectedTrackIdx}
          onSelect={handleTrackSelect}
        />
        <ScoreControls
          currentMs={currentMs}
          totalMs={totalMs}
          uiReady={uiReady}
          uiPlaying={uiPlaying}
        />
      </div>
    </div>
  );
};
