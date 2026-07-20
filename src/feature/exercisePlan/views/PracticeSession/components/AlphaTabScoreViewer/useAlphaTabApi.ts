import * as alphaTabLib from "@coderline/alphatab";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { onOutputDeviceChange, readPersistedOutputDeviceId } from "hooks/useNativeOutputDevice";
import { useEffect, useRef, useState } from "react";
import { applyAlphaTabOutputDevice } from "utils/applyAudioSinkId";

import { tablatureToAlphaTex } from "./tablatureToAlphaTex";
import type { Track } from "./types";

interface UseAlphaTabApiOptions {
  /** Real Guitar Pro file — takes priority when present. */
  rawGpFile?: File;
  /** Fallback for exercises with no Guitar Pro file: rendered via generated alphaTex. */
  measures?: TablatureMeasure[];
  /** Tempo baked into the generated alphaTex when there's no rawGpFile (ignored otherwise). */
  baseTempo?: number;
  mode: "score" | "tab";
  /** Ref — always current value of volume, safe to read inside async callbacks */
  volumeRef: React.MutableRefObject<number>;
  bpmRef: React.MutableRefObject<number>;
  origBpmRef: React.MutableRefObject<number>;
  /** Per-track mute/volume for the underlying synth — MUST be memoized by the caller. */
  trackConfigs?: Record<string, { isMuted: boolean; volume: number }>;
  /** Dynamic backing-track ids, used to map `trackConfigs` onto the score's tracks — MUST be memoized by the caller. */
  backingTrackIds?: string[];
}

interface UseAlphaTabApiReturn {
  apiRef: React.MutableRefObject<any>;
  scrollRef: React.MutableRefObject<HTMLDivElement | null>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  uiReady: boolean;
  uiPlaying: boolean;
  tracks: Track[];
  selectedTrackIdx: number;
  currentMs: number;
  totalMs: number;
  handleTrackSelect: (idx: number) => void;
}

/**
 * Manages the AlphaTabApi lifecycle for a single (rawGpFile, mode) pair.
 * Teardown + recreation happens automatically when either changes.
 */
export function useAlphaTabApi({
  rawGpFile,
  measures,
  baseTempo = 120,
  mode,
  volumeRef,
  bpmRef,
  origBpmRef,
  trackConfigs = {},
  backingTrackIds = [],
}: UseAlphaTabApiOptions): UseAlphaTabApiReturn {
  const scrollRef    = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef       = useRef<any>(null);
  const scoreRef     = useRef<any>(null);

  const [uiReady,          setUiReady]          = useState(false);
  const [uiPlaying,        setUiPlaying]        = useState(false);
  const [tracks,           setTracks]           = useState<Track[]>([]);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);
  const [currentMs,        setCurrentMs]        = useState(0);
  const [totalMs,          setTotalMs]          = useState(0);

  useEffect(() => {
    if (!containerRef.current || !scrollRef.current || typeof window === "undefined") return;
    if (!rawGpFile && (!measures || measures.length === 0)) return;

    const AlphaTabApi = (alphaTabLib as any).AlphaTabApi;
    if (!AlphaTabApi) return;

    scoreRef.current = null;
    setUiReady(false);
    setUiPlaying(false);
    setTracks([]);
    setSelectedTrackIdx(0);
    setCurrentMs(0);
    setTotalMs(0);

    const origin = window.location.origin;
    const api = new AlphaTabApi(containerRef.current, {
      core: {
        scriptFile:    `${origin}/alphatab/alphaTab.min.js`,
        fontDirectory: `${origin}/alphatab/font/`,
        // Populate per-note bounds so we can overlay hit/miss colour on each
        // fret number (see useNoteHeadFeedback).
        includeNoteBounds: true,
      },
      display: {
        // `staves` is a runtime property, not a setting — it was ignored, so the
        // profile fell back to Default (notation + tab). Use staveProfile: with
        // mode="tab" we render tablature ONLY, so note-head bounds land on the
        // fret numbers (see useNoteHeadFeedback) instead of the notation heads.
        staveProfile: mode === "tab" ? "Tab" : "ScoreTab",
      },
      player: {
        enablePlayer:  true,
        enableCursor:  true,
        soundFont:     `${origin}/soundfont/sonivox.sf2`,
        outputMode:    0,
        scrollElement: scrollRef.current,
      },
    });

    apiRef.current = api;

    // AlphaTab owns its audio graph internally with no setSinkId access — it has
    // its own public device-selection API instead. Keep it on the same output as
    // ASIO capture (Electron) so the driver doesn't get contested.
    const unsubOutputDevice = onOutputDeviceChange((id) => applyAlphaTabOutputDevice(api, id));

    api.scoreLoaded.on((score: any) => {
      if (score?.tempo > 0) origBpmRef.current = score.tempo;
      scoreRef.current = score;

      if (Array.isArray(score?.tracks) && score.tracks.length > 0) {
        setTracks(
          score.tracks.map((t: any, i: number) => ({
            name: t.name?.trim() || `Track ${i + 1}`,
            idx:  i,
          })),
        );
        setSelectedTrackIdx(0);
        // Render first track only; user can switch via handleTrackSelect
        api.renderTracks([score.tracks[0]]);
      }
    });

    api.playerReady.on(() => {
      // volumeRef.current is always the latest value — no closure staleness
      api.masterVolume    = volumeRef.current;
      api.isLooping       = true;
      api.playbackSpeed   = bpmRef.current / (origBpmRef.current || 120);
      applyAlphaTabOutputDevice(api, readPersistedOutputDeviceId());

      // Single play path: the caller's isPlaying effect starts playback (with a
      // seek to the current session position). Auto-playing here too caused a
      // double play()/stop() on the fresh synth → AudioBufferSourceNode errors.
      setUiReady(true);
    });

    api.playerStateChanged.on((args: any) => {
      // args: PlayerStateChangedEventArgs { state: PlayerState(0|1), stopped: bool }
      const state = typeof args === "object" && args !== null ? args.state : args;
      setUiPlaying(Number(state) === 1);
    });

    api.playerPositionChanged.on((args: any) => {
      if (args?.currentTime !== undefined) setCurrentMs(args.currentTime);
      if (args?.endTime > 0)              setTotalMs(args.endTime);
    });

    api.playerFinished.on(() => {
      setUiPlaying(false);
      setCurrentMs(0);
    });

    if (rawGpFile) {
      rawGpFile.arrayBuffer().then((buf) => {
        if (apiRef.current === api) api.load(new Uint8Array(buf));
      });
    } else if (measures && measures.length > 0) {
      // No Guitar Pro file (built-in exercises never ship one) — render the score from
      // our own tablature format by converting it to alphaTex instead of api.load().
      api.tex(tablatureToAlphaTex(measures, baseTempo));
    }

    return () => {
      unsubOutputDevice();
      try { api.stop();    } catch { /* ignore */ }
      try { api.destroy(); } catch { /* ignore */ }
      apiRef.current   = null;
      scoreRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawGpFile, measures, mode]);

  // Per-track mute / volume — independent of which track is rendered visually.
  // trackConfigs and backingTrackIds MUST be memoized by the caller.
  // uiReady in deps: re-applies once the score/tracks are actually available.
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
  }, [trackConfigs, backingTrackIds, uiReady]);

  const handleTrackSelect = (idx: number) => {
    const score = scoreRef.current;
    if (!apiRef.current || !score?.tracks?.[idx]) return;
    apiRef.current.renderTracks([score.tracks[idx]]);
    setSelectedTrackIdx(idx);
  };

  return {
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
  };
}
