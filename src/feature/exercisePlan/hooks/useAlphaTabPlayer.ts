import { useEffect, useRef } from 'react';
import * as alphaTabLib from '@coderline/alphatab';

export interface AlphaTabTrackConfig {
  isMuted: boolean;
  volume: number;
}

export interface UseAlphaTabPlayerProps {
  rawGpFile: File | null;
  /** User-set BPM (from metronome). AlphaTab playbackSpeed = bpm / originalBpm */
  bpm: number;
  /** True only when audio should play (after count-in) */
  isPlaying: boolean;
  /** startTime changes on each new play session — used to restart AlphaTab */
  startTime: number | null;
  onLoopComplete?: () => void;
  /** Called immediately after api.play() on each loop restart — use to re-anchor the cursor. */
  onLoopRestart?: () => void;
  /** Called once when AlphaTab's internal AudioContext becomes available (after playerReady). */
  onAudioContextReady?: (ctx: AudioContext) => void;
  /**
   * Volume for AlphaTab's built-in metronome click track (0 = off, 1 = normal).
   * Set to 0 when the user has muted the metronome, > 0 otherwise.
   * Our custom metronome should be muted during GP playback so AlphaTab's click is the only source.
   */
  metronomeVolume?: number;
  /** Per-track mute/volume — MUST be memoized by the caller to avoid effect loops */
  trackConfigs?: Record<string, AlphaTabTrackConfig>;
  /** MUST be memoized by the caller */
  backingTrackIds?: string[];
}

/**
 * Drives AlphaTab's built-in AlphaSynth synthesizer (sonivox.sf2) for GP file playback.
 * AlphaTabApi is created only when rawGpFile is first provided — never for regular exercises.
 * display:none prevents score rendering (no canvas OOM).
 */
export interface AlphaTabPlayerHandle {
  /** Call directly (without React render) to start playback — e.g. from metronome onPlayStart. */
  play: () => void;
}

export const useAlphaTabPlayer = ({
  rawGpFile,
  bpm,
  isPlaying,
  startTime,
  onLoopComplete,
  onLoopRestart,
  onAudioContextReady,
  metronomeVolume = 1,
  trackConfigs = {},
  backingTrackIds = [],
}: UseAlphaTabPlayerProps) => {
  const apiRef             = useRef<any>(null);
  const playRef            = useRef<AlphaTabPlayerHandle['play'] | null>(null);
  const scoreRef           = useRef<any>(null);
  const originalBpmRef     = useRef<number>(120);
  const isReadyRef         = useRef(false);
  const pendingPlayRef     = useRef(false);
  const currentFileRef     = useRef<File | null>(null);
  const isPlayingRef       = useRef(isPlaying);
  const bpmRef             = useRef(bpm);
  const onLoopCompleteRef       = useRef(onLoopComplete);
  const onLoopRestartRef        = useRef(onLoopRestart);
  const onAudioContextReadyRef  = useRef(onAudioContextReady);
  // Guards api.stop() — must not be called before api.play() has run at least once.
  const hasStartedRef           = useRef(false);

  useEffect(() => { isPlayingRef.current             = isPlaying;            }, [isPlaying]);
  useEffect(() => { bpmRef.current                   = bpm;                  }, [bpm]);
  useEffect(() => { onLoopCompleteRef.current        = onLoopComplete;       }, [onLoopComplete]);
  useEffect(() => { onLoopRestartRef.current         = onLoopRestart;        }, [onLoopRestart]);
  useEffect(() => { onAudioContextReadyRef.current   = onAudioContextReady;  }, [onAudioContextReady]);

  // ── Create AlphaTabApi — only when rawGpFile first arrives ────────────────
  // Guard: apiRef.current !== null prevents re-creation if rawGpFile object changes
  // (file reloads are handled by the separate load effect below).
  useEffect(() => {
    if (!rawGpFile || apiRef.current || typeof window === 'undefined') return;

    const AlphaTabApi = (alphaTabLib as any).AlphaTabApi;
    if (!AlphaTabApi) return;

    const div = document.createElement('div');
    // display:none prevents score rendering — canvas is never created → no OOM.
    // AlphaSynth initialises independently and still fires playerReady.
    div.style.cssText = 'display:none;';
    document.body.appendChild(div);

    // scriptFile must be an absolute URL — blob: workers cannot resolve relative paths.
    const origin = window.location.origin;
    const api = new AlphaTabApi(div, {
      core: {
        // Standalone script so AlphaTab can spawn its rendering web worker from it.
        // Must be an absolute URL — blob: workers cannot resolve relative paths.
        scriptFile:    `${origin}/alphatab/alphaTab.min.js`,
        fontDirectory: `${origin}/alphatab/font/`,
      },
      player: {
        enablePlayer: true,
        soundFont:    `${origin}/soundfont/sonivox.sf2`,
        // AudioWorklets run on a dedicated audio thread — no main-thread blocking.
        // outputMode: 0 = WebAudioAudioWorklets (default)
        outputMode: 0,
        scrollElement: div,
      },
    });

    apiRef.current = api;

    api.scoreLoaded.on((score: any) => {
      scoreRef.current = score;
      if (score?.tempo > 0) originalBpmRef.current = score.tempo;
    });

    api.playerReady.on(() => {
      isReadyRef.current = true;
      // Expose AlphaTab's AudioContext — accessed via the (non-hard-private) output.context field.
      const atCtx = (api.player as any)?.output?.context as AudioContext | undefined;
      if (atCtx) onAudioContextReadyRef.current?.(atCtx);
      // Expose imperative play handle — usable without React render cycle
      playRef.current = () => {
        api.playbackSpeed = bpmRef.current / (originalBpmRef.current || 120);
        if (hasStartedRef.current) api.stop();
        api.play();
        hasStartedRef.current = true;
      };
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false;
        playRef.current();
      }
    });

    api.playerFinished.on(() => {
      onLoopCompleteRef.current?.();
      if (isPlayingRef.current) {
        api.stop();
        api.play();
        // Notify caller immediately after play() so it can re-anchor the cursor clock.
        // Each loop restart introduces a small scheduling offset; re-anchoring prevents
        // that offset from accumulating across loops.
        onLoopRestartRef.current?.();
      }
    });

    return () => {
      if (hasStartedRef.current) { try { api.stop(); } catch { /* ignore */ } }
      try { api.destroy(); } catch { /* ignore */ }
      isReadyRef.current     = false;
      pendingPlayRef.current = false;
      hasStartedRef.current  = false;
      currentFileRef.current = null;
      div.remove();
      playRef.current  = null;
      apiRef.current   = null;
      scoreRef.current = null;
    };
  // rawGpFile in deps: effect re-evaluates when file arrives (null→File transition).
  // The apiRef.current guard prevents double-creation if deps fire again with same state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawGpFile]);

  // ── Load file into existing API ───────────────────────────────────────────
  useEffect(() => {
    const api = apiRef.current;
    if (!rawGpFile || !api || rawGpFile === currentFileRef.current) return;

    currentFileRef.current = rawGpFile;
    isReadyRef.current     = false;
    pendingPlayRef.current = false;
    hasStartedRef.current  = false;

    rawGpFile.arrayBuffer().then(buf => {
      if (apiRef.current === api) api.load(new Uint8Array(buf));
    });
  }, [rawGpFile]);

  // ── BPM update — just adjust speed, never restart ────────────────────────
  // Separated from play/stop so a metronome slider change does not trigger
  // api.stop() → api.play() (which would cause "stop without start" in the worklet).
  useEffect(() => {
    const api = apiRef.current;
    if (api) api.playbackSpeed = bpm / (originalBpmRef.current || 120);
  }, [bpm]);

  // ── AlphaTab built-in metronome volume ────────────────────────────────────
  // countInVolume stays 0 — our metronome handles the count-in clicks.
  // metronomeVolume is driven by the caller (0 when user mutes, 1 otherwise).
  useEffect(() => {
    const api = apiRef.current;
    if (api) api.metronomeVolume = metronomeVolume;
  }, [metronomeVolume]);

  // ── Playback control ──────────────────────────────────────────────────────
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;

    if (isPlaying) {
      api.playbackSpeed = bpmRef.current / (originalBpmRef.current || 120);
      if (isReadyRef.current) {
        if (hasStartedRef.current) api.stop();
        api.play();
        hasStartedRef.current = true;
      } else {
        pendingPlayRef.current = true;
      }
    } else {
      pendingPlayRef.current = false;
      if (hasStartedRef.current) { try { api.stop(); } catch { /* ignore */ } }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, startTime]);

  // ── Per-track mute / volume ───────────────────────────────────────────────
  // trackConfigs and backingTrackIds MUST be memoized by the caller.
  useEffect(() => {
    const api   = apiRef.current;
    const score = scoreRef.current;
    if (!api || !score?.tracks) return;

    const backingIndices = new Set(
      backingTrackIds
        .map(id => parseInt(id.replace('track-', ''), 10))
        .filter(n => !isNaN(n))
    );
    let mainTrackIdx = -1;
    for (let i = 0; i < score.tracks.length; i++) {
      if (!backingIndices.has(i)) { mainTrackIdx = i; break; }
    }

    score.tracks.forEach((track: any, idx: number) => {
      const config = idx === mainTrackIdx
        ? trackConfigs['main']
        : trackConfigs[`track-${idx}`];
      if (config) {
        api.changeTrackMute([track], config.isMuted);
        api.changeTrackVolume([track], Math.max(0, config.volume));
      }
    });
  }, [trackConfigs, backingTrackIds]);

  return { playRef };
};
