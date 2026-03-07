import { useEffect, useRef, useState } from "react";
import * as alphaTabLib from "@coderline/alphatab";
import type { Track } from "./types";

interface UseAlphaTabApiOptions {
  rawGpFile: File;
  mode: "score" | "tab";
  /** Ref — always current value of volume, safe to read inside async callbacks */
  volumeRef: React.MutableRefObject<number>;
  /** Ref kept in sync by the caller — read inside AT callbacks */
  isPlayingRef: React.MutableRefObject<boolean>;
  bpmRef: React.MutableRefObject<number>;
  origBpmRef: React.MutableRefObject<number>;
  speedMultiplierRef: React.MutableRefObject<number>;
}

export interface UseAlphaTabApiReturn {
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
  mode,
  volumeRef,
  isPlayingRef,
  bpmRef,
  origBpmRef,
  speedMultiplierRef,
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
      },
      display: {
        staves: [{ id: mode }],
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

    api.scoreLoaded.on((score: any) => {
      if (score?.tempo > 0) origBpmRef.current = score.tempo;
      scoreRef.current = score;

      if (Array.isArray(score?.tracks) && score.tracks.length > 0) {
        setTracks(
          score.tracks.map((t: any, i: number) => ({
            name: t.name?.trim() || `Ścieżka ${i + 1}`,
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
      api.metronomeVolume = 0;
      api.isLooping       = false;
      // BUG-FIX: apply combined speed (session BPM × user multiplier) at startup
      api.playbackSpeed   = (bpmRef.current / (origBpmRef.current || 120)) * speedMultiplierRef.current;

      setUiReady(true);

      if (isPlayingRef.current) api.play();
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

    rawGpFile.arrayBuffer().then((buf) => {
      if (apiRef.current === api) api.load(new Uint8Array(buf));
    });

    return () => {
      try { api.stop();    } catch { /* ignore */ }
      try { api.destroy(); } catch { /* ignore */ }
      apiRef.current   = null;
      scoreRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawGpFile, mode]);

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
