import type { MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAlphaTabPlayer } from "../../../hooks/useAlphaTabPlayer";
import { useExamBackingAudio } from "../../../hooks/useExamBackingAudio";
import type { AudioTrackConfig } from "../../../hooks/useTablatureAudio";
import { useTablatureAudio } from "../../../hooks/useTablatureAudio";
import type { BackingTrack } from "../../../types/exercise.types";
import type { TablatureMeasure } from "../../../types/exercise.types";
import { loadGlobalTrackVolume, saveGlobalTrackVolume } from "../helpers/practiceSessionSettings";

interface UseSessionAudioOptions {
  activeTablature:         TablatureMeasure[] | undefined;
  dynamicBackingTracks:    BackingTrack[] | undefined;
  effectiveRawGpFile:      File | undefined;
  isAudioMuted:            boolean;
  isAudioPlaying:          boolean;
  effectiveBpm:            number;
  /** Overall boost on top of every track's own volume (1 = normal, up to 2 = +100%). */
  masterVolume:            number;
  currentExerciseId:       string;
  selectedGpTrackIdx:      number;
  tabRepeatCount:          number;
  loopsCompletedRef:       MutableRefObject<number>;
  isMetronomeMuted:        boolean;
  showAlphaTabScore:       boolean;
  examMode:                boolean;
  examBacking:             { url: string; sourceBpm: number } | undefined;
  metronomeAudioContext:   AudioContext | null | undefined;
  metronomeStartTime:      number | null;
  metronomeAudioStartTime: number | null;
  stopMetronome:           () => void;
  stopTimer:               () => void;
  setTimerTime:            (t: number) => void;
  setHasPlayedRiddleOnce:  (v: boolean) => void;
  onAlphaTabAudioContextReady: (ctx: AudioContext) => void;
  /** Incremented on explicit restarts so AlphaTab resets to beat 0 instead of resuming. */
  tabRestartKey:           number;
  /** One-shot GP-audio seek target (in beats) owned by the metronome; keeps AlphaTab aligned with bar-click seeks. */
  pendingSeekBeatRef?:     MutableRefObject<number | null>;
  /** Per-string semitone offset from standard tuning, applied to the custom (non-GP) synth so the
   *  background guitar matches the player's chosen tuning. */
  tuningOffsets?:          readonly number[];
}

export function useSessionAudio({
  activeTablature, dynamicBackingTracks, effectiveRawGpFile,
  isAudioMuted, isAudioPlaying, effectiveBpm, masterVolume,
  currentExerciseId, selectedGpTrackIdx, tabRepeatCount, loopsCompletedRef,
  isMetronomeMuted, showAlphaTabScore, examMode, examBacking,
  metronomeAudioContext, metronomeStartTime, metronomeAudioStartTime,
  stopMetronome, stopTimer, setTimerTime, setHasPlayedRiddleOnce,
  onAlphaTabAudioContextReady, tabRestartKey, pendingSeekBeatRef, tuningOffsets,
}: UseSessionAudioOptions) {
  // ── Track configs ──────────────────────────────────────────────────────────

  const [trackConfigs, setTrackConfigs] = useState<Record<string, { volume: number; isMuted: boolean }>>({});

  useEffect(() => {
    const configs: Record<string, { volume: number; isMuted: boolean }> = {
      main: { volume: loadGlobalTrackVolume("main") ?? 1.0, isMuted: isAudioMuted },
    };
    if (dynamicBackingTracks) {
      const backingVolume = loadGlobalTrackVolume("backing") ?? 0.8;
      dynamicBackingTracks.forEach(track => {
        configs[track.id] = { volume: backingVolume, isMuted: false };
      });
    }
    setTrackConfigs(configs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExerciseId, selectedGpTrackIdx]);

  // Keep main track mute in sync with global toggle
  useEffect(() => {
    setTrackConfigs(prev => ({ ...prev, main: { ...prev.main, isMuted: isAudioMuted } }));
  }, [isAudioMuted]);

  // Track volume is a device-wide preference — persist it so the next exercise (or
  // session) starts at the same level instead of resetting to the hardcoded default.
  useEffect(() => {
    if (trackConfigs.main) saveGlobalTrackVolume("main", trackConfigs.main.volume);
    const backingTrack = Object.entries(trackConfigs).find(([id]) => id !== "main");
    if (backingTrack) saveGlobalTrackVolume("backing", backingTrack[1].volume);
  }, [trackConfigs]);

  const audioTracks = useMemo((): AudioTrackConfig[] => {
    const tracks: AudioTrackConfig[] = [{
      id: "main", name: "Główny Instrument",
      measures:  activeTablature || [],
      volume:    trackConfigs.main?.volume ?? 1,
      isMuted:   trackConfigs.main?.isMuted ?? isAudioMuted,
      trackType: "guitar", pan: 0,
    }];
    if (dynamicBackingTracks) {
      dynamicBackingTracks.forEach(track => {
        tracks.push({
          id: track.id, name: track.name, measures: track.measures,
          volume:    trackConfigs[track.id]?.volume ?? 0.8,
          isMuted:   trackConfigs[track.id]?.isMuted ?? false,
          trackType: track.trackType, pan: track.pan,
        });
      });
    }
    return tracks;
  }, [activeTablature, dynamicBackingTracks, trackConfigs, isAudioMuted]);

  // ── AlphaTab loop anchor (re-sync cursor on every loop restart) ────────────

  const [alphaTabLoopAnchor, setAlphaTabLoopAnchor] = useState<number | null>(null);
  const [gpAudioActive,      setGpAudioActive]      = useState(false);

  const metronomeAudioContextRef = useRef(metronomeAudioContext);
  metronomeAudioContextRef.current = metronomeAudioContext;

  useEffect(() => { setGpAudioActive(!!effectiveRawGpFile && isAudioPlaying); }, [effectiveRawGpFile, isAudioPlaying]);
  useEffect(() => { if (!isAudioPlaying) setAlphaTabLoopAnchor(null); },       [isAudioPlaying]);

  const effectiveAudioStartTime = alphaTabLoopAnchor ?? metronomeAudioStartTime;

  const alphaTabTrackConfigs  = useMemo(() =>
    Object.fromEntries(Object.entries(trackConfigs).map(([k, v]) => [k, { isMuted: v.isMuted, volume: v.volume }])),
  [trackConfigs]);

  const alphaTabBackingTrackIds = useMemo(() =>
    (dynamicBackingTracks ?? []).map(t => t.id),
  [dynamicBackingTracks]);

  // ── AlphaTab synthesizer (GP files) ───────────────────────────────────────

  useAlphaTabPlayer({
    rawGpFile:  effectiveRawGpFile ?? null,
    bpm:        effectiveBpm,
    isPlaying:  !!effectiveRawGpFile && isAudioPlaying && !showAlphaTabScore,
    startTime:  metronomeStartTime,
    onLoopComplete: () => { setHasPlayedRiddleOnce(true); },
    onLoopRestart:  useCallback(() => {
      const ctx = metronomeAudioContextRef.current;
      if (ctx) setAlphaTabLoopAnchor(ctx.currentTime);
    }, []),
    onAudioContextReady: useCallback((ctx: AudioContext) => {
      onAlphaTabAudioContextReady(ctx);
    }, [onAlphaTabAudioContextReady]),
    metronomeVolume: isMetronomeMuted ? 0 : 1,
    masterVolume,
    trackConfigs:    alphaTabTrackConfigs,
    backingTrackIds: alphaTabBackingTrackIds,
    resetKey:        tabRestartKey,
    pendingSeekBeatRef,
  });

  // ── Exam backing track ─────────────────────────────────────────────────────

  useExamBackingAudio({
    url:       examBacking?.url ?? "",
    sourceBpm: examBacking?.sourceBpm ?? 60,
    targetBpm: effectiveBpm,
    isPlaying: isAudioPlaying,
    enabled:   !!(examMode && examBacking),
    onEnded: () => {
      if (examMode) { stopTimer(); setTimerTime(999_999_999); }
    },
  });

  // ── Custom synthesis (no GP file) ─────────────────────────────────────────

  useEffect(() => { loopsCompletedRef.current = 0; }, [currentExerciseId]);

  // Disabled whenever the AlphaTab score/notation view is shown — that view owns
  // its own synth (either the GP file's or a generated-alphaTex render of the same
  // tablature), so leaving this custom synth running too would double up the audio.
  const { soundfontsReady, schedulerTickRef: tabSchedulerTickRef } = useTablatureAudio({
    tracks:     audioTracks,
    bpm:        effectiveBpm,
    isPlaying:  !effectiveRawGpFile && !showAlphaTabScore && isAudioPlaying,
    startTime:  metronomeStartTime,
    onLoopComplete: () => {
      setHasPlayedRiddleOnce(true);
      if (tabRepeatCount > 0) {
        loopsCompletedRef.current += 1;
        if (loopsCompletedRef.current >= tabRepeatCount) {
          loopsCompletedRef.current = 0;
          stopMetronome();
          stopTimer();
        }
      }
    },
    audioContext:   metronomeAudioContext,
    audioStartTime: effectiveAudioStartTime,
    disabled:       !!effectiveRawGpFile || showAlphaTabScore,
    repeatCount:    tabRepeatCount,
    tuningOffsets,
  });

  return useMemo(() => ({
    audioTracks, trackConfigs, setTrackConfigs,
    soundfontsReady, gpAudioActive, effectiveAudioStartTime,
    alphaTabTrackConfigs, backingTrackIds: alphaTabBackingTrackIds, tabSchedulerTickRef,
  }), [
    audioTracks, trackConfigs, soundfontsReady, gpAudioActive,
    effectiveAudioStartTime, alphaTabTrackConfigs, alphaTabBackingTrackIds
  ]);
}
