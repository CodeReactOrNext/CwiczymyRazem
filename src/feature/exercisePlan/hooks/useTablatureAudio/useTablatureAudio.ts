import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Soundfont from "soundfont-player";

import type { TablatureBeat, TablatureNote } from "../../types/exercise.types";
import { playDrumNote } from "./synth.drums";
import type { StringPlayers } from "./synth.strings";
import { playStringNote } from "./synth.strings";
import type { AudioTrackConfig, UseTablatureAudioProps } from "./types";

export const useTablatureAudio = ({
  tracks: inputTracks,
  measures,
  isMuted: legacyIsMuted = false,
  bpm,
  isPlaying,
  startTime,
  onLoopComplete,
  audioContext: externalAudioContext,
  audioStartTime,
  disabled = false,
  repeatCount = 0,
}: UseTablatureAudioProps) => {
  // ── Audio graph refs ──────────────────────────────────────────────────────
  const ownAudioContextRef   = useRef<AudioContext | null>(null);
  const audioContextRef      = useRef<AudioContext | null>(null);
  const masterGainRef        = useRef<GainNode | null>(null);
  const trackGainsRef        = useRef<Record<string, GainNode>>({});
  const trackPannersRef      = useRef<Record<string, StereoPannerNode>>({});
  const timeoutRef           = useRef<number | null>(null);

  // ── Absolute-clock playback state ─────────────────────────────────────────
  // beatIdx grows monotonically — audio time = startAudioTime
  //   + floor(beatIdx / N) * loopDuration  +  offsets[beatIdx % N]
  // No floating-point accumulation between tracks.
  const startAudioTimeRef        = useRef<number | null>(null);
  const audioStartTimePropRef    = useRef<number | null>(null);
  const repeatCountRef           = useRef(repeatCount);
  useEffect(() => { repeatCountRef.current = repeatCount; }, [repeatCount]);
  const trackStatesRef           = useRef<Record<string, { beatIdx: number }>>({});
  const pendingLoopCompleteTimeoutsRef = useRef<Set<number>>(new Set());

  audioStartTimePropRef.current = audioStartTime ?? null;

  // ── Active soundfont nodes for note-off (key = `${trackId}-${string}`) ───
  const activeNodesRef = useRef<Map<string, any>>(new Map());

  // ── Soundfont instrument players ──────────────────────────────────────────
  const guitarPlayerRef      = useRef<Soundfont.Player | null>(null);
  const mutedGuitarPlayerRef = useRef<Soundfont.Player | null>(null);
  const bassPlayerRef        = useRef<Soundfont.Player | null>(null);
  const vocalsPlayerRef      = useRef<Soundfont.Player | null>(null);
  const [soundfontsReady, setSoundfontsReady] = useState(false);

  const schedulerTickRef = useRef<(() => void) | null>(null);
  const isPlayingRef     = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // ── Track data ────────────────────────────────────────────────────────────
  const activeTracks = useMemo(() => {
    if (inputTracks) return inputTracks;
    if (measures) return [{ id: "main", measures, volume: 1, isMuted: legacyIsMuted }];
    return [] as AudioTrackConfig[];
  }, [inputTracks, measures, legacyIsMuted]);

  const activeTracksRef = useRef(activeTracks);
  useEffect(() => { activeTracksRef.current = activeTracks; }, [activeTracks]);

  const bpmRef = useRef(bpm);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  const trackDataRef = useRef<Record<string, {
    flattened:     TablatureBeat[];
    offsets:       number[];
    totalDuration: number;
    loopStartIdx:  number;
    loopStartOff:  number;
    loopDuration:  number;
    loopEndIdx:    number;
    loopEndOff:    number;
  }>>({});

  useEffect(() => {
    trackDataRef.current = {};
    activeTracks.forEach(track => {
      const flattened = track.measures.flatMap(m => m.beats);
      const offsets: number[] = [];
      let cursor = 0;
      for (const beat of flattened) { offsets.push(cursor); cursor += beat.duration; }

      let loopStartIdx = 0; let loopStartOff = 0;
      for (const m of track.measures) {
        if (!m.firstLoopOnly) break;
        loopStartIdx += m.beats.length;
        loopStartOff += m.beats.reduce((s, b) => s + b.duration, 0);
      }

      let loopEndIdx = flattened.length; let loopEndOff = cursor;
      for (let i = track.measures.length - 1; i >= 0; i--) {
        if (!track.measures[i].lastLoopOnly) break;
        loopEndIdx -= track.measures[i].beats.length;
        loopEndOff -= track.measures[i].beats.reduce((s, b) => s + b.duration, 0);
      }

      trackDataRef.current[track.id] = {
        flattened, offsets, totalDuration: cursor,
        loopStartIdx, loopStartOff, loopDuration: loopEndOff - loopStartOff,
        loopEndIdx, loopEndOff,
      };
    });
  }, [activeTracks]);

  // ── AudioContext + master gain ─────────────────────────────────────────────
  useEffect(() => {
    if (externalAudioContext) {
      audioContextRef.current = externalAudioContext;
    } else {
      ownAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ownAudioContextRef.current;
    }
    if (audioContextRef.current) {
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      trackGainsRef.current   = {};
      trackPannersRef.current = {};
    }
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      ownAudioContextRef.current?.close();
    };
  }, [externalAudioContext]);

  // ── Load soundfont instruments ────────────────────────────────────────────
  useEffect(() => {
    if (disabled) return;
    const ctx = audioContextRef.current;
    if (!ctx) return;
    guitarPlayerRef.current = mutedGuitarPlayerRef.current = bassPlayerRef.current = vocalsPlayerRef.current = null;
    setSoundfontsReady(false);
    let cancelled = false;
    Promise.all([
      Soundfont.instrument(ctx, "electric_guitar_clean" as Soundfont.InstrumentName),
      Soundfont.instrument(ctx, "electric_guitar_muted" as Soundfont.InstrumentName),
      Soundfont.instrument(ctx, "electric_bass_pick"    as Soundfont.InstrumentName),
      Soundfont.instrument(ctx, "choir_aahs"            as Soundfont.InstrumentName),
    ]).then(([guitar, mutedGuitar, bass, vocals]) => {
      if (cancelled) return;
      guitarPlayerRef.current = guitar; mutedGuitarPlayerRef.current = mutedGuitar;
      bassPlayerRef.current   = bass;   vocalsPlayerRef.current      = vocals;
      setSoundfontsReady(true);
    }).catch(() => { /* synthesis fallback will be used */ });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalAudioContext, audioContextRef.current]);

  // ── Per-track gain + panner ───────────────────────────────────────────────
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !masterGainRef.current) return;
    const currentIds = new Set(activeTracks.map(t => t.id));
    Object.keys(trackGainsRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        trackGainsRef.current[id]?.disconnect();
        trackPannersRef.current[id]?.disconnect();
        delete trackGainsRef.current[id];
        delete trackPannersRef.current[id];
      }
    });
    activeTracks.forEach(track => {
      const existing = trackGainsRef.current[track.id];
      if (!existing || existing.context !== ctx) {
        if (existing) { trackGainsRef.current[track.id]?.disconnect(); trackPannersRef.current[track.id]?.disconnect(); }
        const gain   = ctx.createGain();
        const panner = ctx.createStereoPanner();
        panner.pan.value = track.pan ?? 0;
        gain.connect(panner); panner.connect(masterGainRef.current!);
        trackGainsRef.current[track.id]  = gain;
        trackPannersRef.current[track.id] = panner;
      } else {
        const panner = trackPannersRef.current[track.id];
        if (panner) panner.pan.value = track.pan ?? 0;
      }
      const targetGain = track.isMuted ? 0 : track.volume;
      trackGainsRef.current[track.id].gain.setTargetAtTime(targetGain, ctx.currentTime, 0.02);
    });
  }, [activeTracks, externalAudioContext]);

  const onLoopCompleteRef = useRef(onLoopComplete);
  useEffect(() => { onLoopCompleteRef.current = onLoopComplete; }, [onLoopComplete]);

  // ── Note dispatcher ───────────────────────────────────────────────────────
  const playNote = useCallback((
    note: TablatureNote,
    time: number,
    trackId: string,
    duration: number,
    trackType: "guitar" | "bass" | "drums" | "vocals" = "guitar",
  ) => {
    const ctx       = audioContextRef.current;
    const trackGain = trackGainsRef.current[trackId];
    if (!ctx || !trackGain || !isFinite(time)) return;

    if (trackType === "drums") {
      playDrumNote(ctx, note, time, trackGain);
    } else {
      const players: StringPlayers = {
        guitar:      guitarPlayerRef.current,
        mutedGuitar: mutedGuitarPlayerRef.current,
        bass:        bassPlayerRef.current,
        vocals:      vocalsPlayerRef.current,
      };
      playStringNote(ctx, note, time, trackGain, Math.max(0.01, duration), trackType, trackId, activeNodesRef.current, players);
    }
  }, []);

  // ── Scheduler ─────────────────────────────────────────────────────────────
  // Beat times computed ABSOLUTELY from startAudioTime — no accumulation drift.
  // beatAudioTime(i) = startAudioTime
  //   + floor(i / N) * loopDurationSeconds   ← which loop
  //   + offsets[i % N] * secondsPerBeat       ← position in loop
  const scheduler = useCallback(() => {
    if (timeoutRef.current) { window.clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    const ctx = audioContextRef.current;
    if (!ctx || !isPlayingRef.current) return;

    if (startAudioTimeRef.current === null) {
      const anchor = audioStartTimePropRef.current;
      if (anchor == null) { timeoutRef.current = window.setTimeout(scheduler, 10); return; }
      startAudioTimeRef.current = anchor;
      const newStates: Record<string, { beatIdx: number }> = {};
      activeTracksRef.current.forEach(track => { newStates[track.id] = { beatIdx: 0 }; });
      trackStatesRef.current = newStates;
      activeNodesRef.current.clear();
    }

    const lookaheadTime  = ctx.currentTime + 0.25;
    const secondsPerBeat = 60 / (bpmRef.current || 120);
    const tracks         = activeTracksRef.current;
    const refTrackId     = tracks.length > 0 ? tracks[0].id : null;
    const startAudio     = startAudioTimeRef.current;

    tracks.forEach(track => {
      const data  = trackDataRef.current[track.id];
      const state = trackStatesRef.current[track.id];
      if (!data || data.flattened.length === 0 || !state) return;

      const N             = data.flattened.length;
      const { loopStartIdx, loopStartOff, loopDuration, totalDuration, loopEndIdx, loopEndOff } = data;
      const rc            = repeatCountRef.current;
      const N_core        = loopEndIdx - loopStartIdx;
      const firstLoopBeats = loopEndIdx;
      const firstLoopSec   = loopEndOff * secondsPerBeat;
      const loopDurSec     = (loopDuration > 0 ? loopDuration : totalDuration) * secondsPerBeat;

      while (true) {
        let loopCount: number;
        let localIdx: number;

        if (rc === 0 || rc === 1) {
          if (rc === 1) {
            loopCount = 0; localIdx = state.beatIdx < N ? state.beatIdx : N - 1;
          } else if (state.beatIdx < firstLoopBeats || loopStartIdx === 0 && loopEndIdx === N) {
            if (state.beatIdx < firstLoopBeats) { loopCount = 0; localIdx = state.beatIdx; }
            else { const a = state.beatIdx - firstLoopBeats; loopCount = 1 + Math.floor(a / N_core); localIdx = loopStartIdx + (a % N_core); }
          } else { const a = state.beatIdx - firstLoopBeats; loopCount = 1 + Math.floor(a / N_core); localIdx = loopStartIdx + (a % N_core); }
        } else {
          if (state.beatIdx < firstLoopBeats) { loopCount = 0; localIdx = state.beatIdx; }
          else {
            const afterFirst  = state.beatIdx - firstLoopBeats;
            const totalMiddle = (rc - 2) * N_core;
            if (afterFirst < totalMiddle) { loopCount = 1 + Math.floor(afterFirst / N_core); localIdx = loopStartIdx + (afterFirst % N_core); }
            else { loopCount = rc - 1; localIdx = loopStartIdx + (afterFirst - totalMiddle); }
          }
        }

        let beatAudioTime: number;
        if (loopCount === 0) {
          beatAudioTime = startAudio + data.offsets[localIdx] * secondsPerBeat;
        } else {
          const relOff = (data.offsets[localIdx] - loopStartOff) * secondsPerBeat;
          beatAudioTime = startAudio + firstLoopSec + (loopCount - 1) * loopDurSec + relOff;
        }

        if (beatAudioTime >= lookaheadTime) break;
        if (localIdx >= N) { state.beatIdx++; continue; }

        const beat         = data.flattened[localIdx];
        const beatDuration = Math.max(0.05, beat.duration * secondsPerBeat);
        const t = Math.max(ctx.currentTime + 0.001, beatAudioTime);

        if (!track.isMuted) {
          beat.notes.forEach((n: TablatureNote) => {
            playNote(n, t, track.id, beatDuration, track.trackType ?? "guitar");
          });
        }

        const isLastLoop   = rc > 0 && loopCount === rc - 1;
        const loopBoundary = isLastLoop ? N - 1 : loopEndIdx - 1;
        if (localIdx === loopBoundary && track.id === refTrackId) {
          const delayMs = (beatAudioTime + beatDuration - ctx.currentTime) * 1000;
          const tid = window.setTimeout(() => {
            pendingLoopCompleteTimeoutsRef.current.delete(tid);
            onLoopCompleteRef.current?.();
          }, Math.max(0, delayMs + 500));
          pendingLoopCompleteTimeoutsRef.current.add(tid);
        }

        state.beatIdx++;
      }
    });

    timeoutRef.current = window.setTimeout(scheduler, 200);
  }, [playNote]);

  // ── Start / stop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    if (isPlaying) {
      if (audioContextRef.current?.state === "suspended") audioContextRef.current.resume();
      startAudioTimeRef.current = null;
      schedulerTickRef.current  = scheduler;
      scheduler();
    } else {
      schedulerTickRef.current  = null;
      startAudioTimeRef.current = null;
      activeNodesRef.current.forEach(node => { try { node.stop(); } catch { /* already ended */ } });
      activeNodesRef.current.clear();
      trackStatesRef.current = {};
      pendingLoopCompleteTimeoutsRef.current.forEach(id => window.clearTimeout(id));
      pendingLoopCompleteTimeoutsRef.current.clear();
    }

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      pendingLoopCompleteTimeoutsRef.current.forEach(id => window.clearTimeout(id));
    };
  }, [isPlaying, scheduler]);

  return { soundfontsReady, schedulerTickRef };
};
