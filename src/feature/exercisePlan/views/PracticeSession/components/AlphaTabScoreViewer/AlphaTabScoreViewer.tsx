import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "assets/lib/utils";
import { useAlphaTabApi } from "./useAlphaTabApi";
import { TrackSelector } from "./TrackSelector";
import { ScoreControls, SPEEDS } from "./ScoreControls";
import type { AlphaTabScoreViewerProps } from "./types";

/**
 * Interactive AlphaTab score/tab viewer.
 *
 * Playback (play/stop/BPM) is driven by the session's existing controls via
 * props — no duplicate play button. Audio belongs to this component when
 * active; the session's useAlphaTabPlayer is disabled while this is shown.
 */
export const AlphaTabScoreViewer = ({
  rawGpFile,
  mode = "score",
  isPlaying,
  startTime,
  bpm,
  volume = 1,
  className,
}: AlphaTabScoreViewerProps) => {
  // Refs kept in sync so AT callbacks always read the latest values
  const origBpmRef         = useRef(120);
  const isPlayingRef       = useRef(isPlaying);
  const bpmRef             = useRef(bpm);
  const speedMultiplierRef = useRef(1);
  const volumeRef          = useRef(volume);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { bpmRef.current = bpm; },             [bpm]);
  useEffect(() => { volumeRef.current = volume; },       [volume]);

  const [isLooping,  setIsLooping]  = useState(false);
  const [metronome,  setMetronome]  = useState(false);
  const [speedIdx,   setSpeedIdx]   = useState<number>(SPEEDS.indexOf(1));

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
    mode,
    volumeRef,
    isPlayingRef,
    bpmRef,
    origBpmRef,
    speedMultiplierRef,
  });

  // ── Playback: driven by session controls ─────────────────────────────────
  // startTime changing = new session → always restart from the beginning.
  // isPlaying toggling = play / stop at current position.
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !uiReady) return;

    if (isPlaying) {
      api.stop();
      api.play();
    } else {
      api.stop();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, startTime, uiReady]);

  // ── BPM: update speed without restarting playback ────────────────────────
  // BUG-FIX: always combine session BPM ratio with the user's speed multiplier
  // so neither source overwrites the other.
  useEffect(() => {
    if (apiRef.current && uiReady) {
      apiRef.current.playbackSpeed =
        (bpm / (origBpmRef.current || 120)) * speedMultiplierRef.current;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, uiReady]);

  // ── Volume: sync with session mute toggle ─────────────────────────────────
  // uiReady in deps: re-applies volume the moment AT becomes ready, covering
  // the case where isAudioMuted changes before playerReady fires.
  useEffect(() => {
    if (apiRef.current && uiReady) apiRef.current.masterVolume = volume;
  }, [volume, uiReady]);

  // ── Extra controls ────────────────────────────────────────────────────────
  const handleLoopToggle = useCallback(() => {
    const next = !isLooping;
    if (apiRef.current) apiRef.current.isLooping = next;
    setIsLooping(next);
  }, [isLooping]);

  const handleMetronomeToggle = useCallback(() => {
    const next = !metronome;
    if (apiRef.current) apiRef.current.metronomeVolume = next ? 1 : 0;
    setMetronome(next);
  }, [metronome]);

  // BUG-FIX: speed buttons now compound with session BPM instead of
  // overwriting it — both use the same (bpmRatio × multiplier) formula.
  const handleSpeedChange = useCallback((dir: 1 | -1) => {
    const next = Math.max(0, Math.min(SPEEDS.length - 1, speedIdx + dir));
    speedMultiplierRef.current = SPEEDS[next];
    if (apiRef.current && uiReady) {
      apiRef.current.playbackSpeed =
        (bpmRef.current / (origBpmRef.current || 120)) * SPEEDS[next];
    }
    setSpeedIdx(next);
  }, [speedIdx, uiReady]);

  return (
    <div className={cn("w-full flex flex-col rounded-xl overflow-hidden", className)}>

      {/* Score viewport — must be the scrollable parent so AT cursor follows */}
      <div
        ref={scrollRef}
        className="w-full overflow-auto bg-white"
        style={{ minHeight: 300, maxHeight: 500 }}
      >
        <div ref={containerRef} />
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
          isLooping={isLooping}
          metronomeOn={metronome}
          speedIdx={speedIdx}
          onLoopToggle={handleLoopToggle}
          onMetronomeToggle={handleMetronomeToggle}
          onSpeedChange={handleSpeedChange}
        />
      </div>
    </div>
  );
};
