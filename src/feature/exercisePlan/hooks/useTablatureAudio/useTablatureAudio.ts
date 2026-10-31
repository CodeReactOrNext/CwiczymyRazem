import { clearActiveBand, setActiveBand } from "feature/autoBacking/synth/activeBand";
import { AmbientBand, velocityOf } from "feature/autoBacking/synth/ambientBand";
import { rageEntryTime } from "feature/autoBacking/synth/rageEntry";
import { onOutputDeviceChange, readPersistedOutputDeviceId } from "hooks/useNativeOutputDevice";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Soundfont from "soundfont-player";
import { applySinkId } from "utils/applyAudioSinkId";

import type { TablatureBeat, TablatureNote, TabTrackType } from "../../types/exercise.types";
import { createTempoRulerFromMeasures } from "../../views/PracticeSession/hooks/tempoBeatClock";
import { BASS_STRING_MIDI, MAIN_TRACK_BOOST } from "./audio.constants";
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
  tuningOffsets,
  rage = false,
}: UseTablatureAudioProps) => {
  // ── Audio graph refs ──────────────────────────────────────────────────────
  const ownAudioContextRef   = useRef<AudioContext | null>(null);
  const audioContextRef      = useRef<AudioContext | null>(null);
  const masterGainRef        = useRef<GainNode | null>(null);
  const trackGainsRef        = useRef<Record<string, GainNode>>({});
  const trackPannersRef      = useRef<Record<string, StereoPannerNode>>({});
  /** Where a track's notes go in: its gain, or a generated track's compressor. */
  const trackInputsRef       = useRef<Record<string, AudioNode>>({});
  /** A generated track's reverb/echo sends, taken after its fader. */
  const trackSendsRef        = useRef<Record<string, AudioNode[]>>({});
  const timeoutRef           = useRef<number | null>(null);

  // ── Absolute-clock playback state ─────────────────────────────────────────
  // beatIdx grows monotonically — audio time = startAudioTime
  //   + floor(beatIdx / N) * loopDuration  +  warpedOffsets[beatIdx % N]
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

  // ── The generated backing's synthesised band ──────────────────────────────
  const bandRef = useRef<AmbientBand | null>(null);

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
  // The band's echo follows the session tempo.
  useEffect(() => { bandRef.current?.setTempo(bpm); }, [bpm, externalAudioContext]);
  // Declared before the context effect, so a new band is handed the mood there.
  const rageRef = useRef(rage);
  useEffect(() => {
    rageRef.current = rage;
    const band = bandRef.current;
    const ctx = audioContextRef.current;
    const start = audioStartTimePropRef.current;
    // Calm, or not playing: at once. A rage mid-run swells in to the next bar.
    if (!band || !rage || !ctx || start === null) {
      band?.setRage(rage);
      return;
    }
    const at = rageEntryTime(ctx.currentTime, start, bpmRef.current || 120);
    band.swell(ctx.currentTime + 0.02, at);
    band.setRage(true, at);
  }, [rage, externalAudioContext]);

  const trackDataRef = useRef<Record<string, {
    flattened:     TablatureBeat[];
    /** Beat start positions in warped beats — x secondsPerBeat gives audio seconds. */
    warpedOffsets:   number[];
    /** Each beat's sounding length in warped beats, so a note in a fast bar is shorter. */
    warpedDurations: number[];
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
      // Positions are stored in *warped* beats (see createTempoRuler): a bar
      // marked faster than the base tempo takes up proportionally fewer of them.
      // Every read below still multiplies by a single secondsPerBeat, so the
      // scheduler needs to know nothing about tempo automation — and the user's
      // BPM knob keeps scaling the whole piece.
      const ruler = createTempoRulerFromMeasures(track.measures);
      const warpedOffsets:   number[] = [];
      const warpedDurations: number[] = [];
      let cursor = 0;
      for (const beat of flattened) {
        const start = ruler.toWarped(cursor);
        warpedOffsets.push(start);
        cursor += beat.duration;
        warpedDurations.push(ruler.toWarped(cursor) - start);
      }

      let loopStartIdx = 0; let loopStartBeat = 0;
      for (const m of track.measures) {
        if (!m.firstLoopOnly) break;
        loopStartIdx  += m.beats.length;
        loopStartBeat += m.beats.reduce((s, b) => s + b.duration, 0);
      }

      let loopEndIdx = flattened.length; let loopEndBeat = cursor;
      for (let i = track.measures.length - 1; i >= 0; i--) {
        if (!track.measures[i].lastLoopOnly) break;
        loopEndIdx  -= track.measures[i].beats.length;
        loopEndBeat -= track.measures[i].beats.reduce((s, b) => s + b.duration, 0);
      }

      const loopStartOff = ruler.toWarped(loopStartBeat);
      const loopEndOff   = ruler.toWarped(loopEndBeat);

      trackDataRef.current[track.id] = {
        flattened, warpedOffsets, warpedDurations, totalDuration: ruler.toWarped(cursor),
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
      applySinkId(ownAudioContextRef.current, readPersistedOutputDeviceId());
    }
    if (audioContextRef.current) {
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      trackGainsRef.current   = {};
      trackPannersRef.current = {};
      trackInputsRef.current  = {};
      trackSendsRef.current   = {};
      bandRef.current         = new AmbientBand(audioContextRef.current, masterGainRef.current);
      bandRef.current.setTempo(bpmRef.current || 120);
      bandRef.current.setRage(rageRef.current);
      setActiveBand(bandRef.current);
    }
    const band = bandRef.current;
    return () => {
      if (band) clearActiveBand(band);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      ownAudioContextRef.current?.close();
      // Soundfont players created below are bound to *this* context instance —
      // once it's closed they'd silently fail (AudioBufferSourceNode errors, no
      // sound) if left dangling in the refs. Clear them here so playNote falls
      // back to the plain-oscillator synth until the loader effect (which shares
      // this same dependency) supplies fresh players for the new context.
      guitarPlayerRef.current = mutedGuitarPlayerRef.current = bassPlayerRef.current = vocalsPlayerRef.current = null;
      bandRef.current = null;
    };
  }, [externalAudioContext]);

  // Move an already-open, app-owned context to a newly picked output device live.
  // Never touches an adopted/external context (e.g. the metronome's) — that
  // context's own owner is responsible for its sink.
  useEffect(() => onOutputDeviceChange((id) => {
    if (audioContextRef.current === ownAudioContextRef.current) applySinkId(ownAudioContextRef.current, id);
  }), []);

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
  // disabled is intentionally included: re-enabling (e.g. leaving the Notation view)
  // must re-arm loading, since the context-close cleanup above may have cleared the
  // players while this effect was disabled and skipping.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalAudioContext, audioContextRef.current, disabled]);

  // ── Per-track gain + panner ───────────────────────────────────────────────
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !masterGainRef.current) return;
    const currentIds = new Set(activeTracks.map(t => t.id));
    Object.keys(trackGainsRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        trackGainsRef.current[id]?.disconnect();
        trackPannersRef.current[id]?.disconnect();
        const input = trackInputsRef.current[id];
        if (input && input !== trackGainsRef.current[id]) {
          input.disconnect();
          bandRef.current?.removeInsert(input);
        }
        trackSendsRef.current[id]?.forEach(send => send.disconnect());
        delete trackGainsRef.current[id];
        delete trackPannersRef.current[id];
        delete trackInputsRef.current[id];
        delete trackSendsRef.current[id];
      }
    });
    activeTracks.forEach(track => {
      const existing = trackGainsRef.current[track.id];
      if (!existing || existing.context !== ctx) {
        if (existing) { trackGainsRef.current[track.id]?.disconnect(); trackPannersRef.current[track.id]?.disconnect(); }
        const gain   = ctx.createGain();
        const panner = ctx.createStereoPanner();
        panner.pan.value = track.pan ?? 0;
        // A generated track plays through the band's own chain (ducker,
        // chorus or saturator, compressor), sends to its hall and echo, and
        // comes out through the band's limited bus.
        const band = track.generated ? bandRef.current : null;
        gain.connect(panner); panner.connect(band ? band.bus : masterGainRef.current!);
        trackGainsRef.current[track.id]  = gain;
        trackPannersRef.current[track.id] = panner;
        trackInputsRef.current[track.id] = band ? band.insert(track.trackType, gain) : gain;
        if (band) trackSendsRef.current[track.id] = band.attachSends(track.trackType, gain);
      } else {
        const panner = trackPannersRef.current[track.id];
        if (panner) panner.pan.value = track.pan ?? 0;
      }
      // The player's own instrument sits a little above whatever backs it.
      const targetGain = track.isMuted ? 0 : track.volume * (track.id === "main" ? MAIN_TRACK_BOOST : 1);
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
    trackType: TabTrackType = "guitar",
    generated = false,
    trackOffsets?: readonly number[],
  ) => {
    const ctx       = audioContextRef.current;
    const trackGain = trackInputsRef.current[trackId] ?? trackGainsRef.current[trackId];
    // ctx.state === "closed" can happen for one scheduler tick right after the
    // context-owning effect tears down (e.g. switching audio sources) — skip
    // silently rather than throwing into a dead AudioContext.
    if (!ctx || ctx.state === "closed" || !trackGain || !isFinite(time)) return;

    // The generated backing plays on its own synthesised band.
    const band = generated ? bandRef.current : null;
    if (band) {
      const t = Math.max(ctx.currentTime + 0.001, time);
      // A boss score's layers come and go with the player's run.
      if (!band.plays(note.layer, t)) return;
      const seconds = Math.max(0.05, duration);
      const bassOpen = BASS_STRING_MIDI[note.string - 1];
      if (trackType === "drums") {
        band.playDrum(trackId, note, t, trackGain);
        return;
      }
      if (trackType === "bass" && bassOpen !== undefined) {
        band.playBass(trackId, bassOpen + note.fret, velocityOf(note), t, seconds, trackGain);
        return;
      }
      if (trackType === "arp" && note.midiNote !== undefined) {
        band.playArp(note.midiNote, velocityOf(note), t, seconds, trackGain, note.string);
        return;
      }
      if (trackType === "keys" && note.midiNote !== undefined) {
        band.playPad(`${trackId}:${note.string}`, note.string - 1, note.midiNote, velocityOf(note), t, seconds, trackGain);
        return;
      }
    }

    if (trackType === "drums") {
      playDrumNote(ctx, note, time, trackGain);
    } else {
      const players: StringPlayers = {
        guitar:      guitarPlayerRef.current,
        mutedGuitar: mutedGuitarPlayerRef.current,
        bass:        bassPlayerRef.current,
        vocals:      vocalsPlayerRef.current,
      };
      // A track in the player's own tuning carries it; otherwise the shared
      // offsets retune guitar tracks only (a backing bass keeps standard tuning).
      const offsets = trackOffsets ?? (trackType === "guitar" ? tuningOffsets : undefined);
      playStringNote(ctx, note, time, trackGain, Math.max(0.01, duration), trackType, trackId, activeNodesRef.current, players, offsets);
    }
  }, [tuningOffsets]);

  // ── Scheduler ─────────────────────────────────────────────────────────────
  // Beat times computed ABSOLUTELY from startAudioTime — no accumulation drift.
  // beatAudioTime(i) = startAudioTime
  //   + floor(i / N) * loopDurationSeconds   ← which loop
  //   + warpedOffsets[i % N] * secondsPerBeat ← position in loop
  const scheduler = useCallback(() => {
    if (timeoutRef.current) { window.clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    const ctx = audioContextRef.current;
    if (!ctx || !isPlayingRef.current) return;

    if (startAudioTimeRef.current === null) {
      let anchor = audioStartTimePropRef.current;
      if (anchor == null) {
        // Standalone usage (e.g. Tab Editor) owns its AudioContext and gets no
        // external anchor — seed one from our own clock instead of waiting forever.
        // When an external context is supplied (PracticeSession), keep waiting for
        // the shared anchor so all tracks stay in sync with the metronome.
        const ownsContext = audioContextRef.current === ownAudioContextRef.current;
        if (!ownsContext) { timeoutRef.current = window.setTimeout(scheduler, 10); return; }
        anchor = ctx.currentTime + 0.1;
      }
      startAudioTimeRef.current = anchor;
      const spb = 60 / (bpmRef.current || 120);
      const newStates: Record<string, { beatIdx: number }> = {};
      activeTracksRef.current.forEach(track => {
        const data = trackDataRef.current[track.id];
        let startIdx = 0;
        if (data && data.warpedOffsets.length > 0) {
          // Skip beats that are already in the past so they don't all fire at once
          for (let i = 0; i < data.warpedOffsets.length; i++) {
            if (anchor + data.warpedOffsets[i] * spb >= ctx.currentTime - 0.1) break;
            startIdx = i + 1;
          }
        }
        newStates[track.id] = { beatIdx: startIdx };
      });
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
          beatAudioTime = startAudio + data.warpedOffsets[localIdx] * secondsPerBeat;
        } else {
          const relOff = (data.warpedOffsets[localIdx] - loopStartOff) * secondsPerBeat;
          beatAudioTime = startAudio + firstLoopSec + (loopCount - 1) * loopDurSec + relOff;
        }

        if (beatAudioTime >= lookaheadTime) break;
        if (localIdx >= N) { state.beatIdx++; continue; }

        const beat         = data.flattened[localIdx];
        const beatDuration = Math.max(0.05, data.warpedDurations[localIdx] * secondsPerBeat);
        const t = Math.max(ctx.currentTime + 0.001, beatAudioTime);
        // The start-up skip above only walks the first pass. Resuming after it
        // (the anchor counts every loop played) left whole passes in the past,
        // and they all sounded at once — walk through them silently instead.
        const isLate = beatAudioTime < ctx.currentTime - 0.1;

        if (!track.isMuted && !isLate) {
          beat.notes.forEach((n: TablatureNote) => {
            playNote(n, t, track.id, beatDuration, track.trackType ?? "guitar", track.generated, track.tuningOffsets);
          });
        }

        const isLastLoop   = rc > 0 && loopCount === rc - 1;
        const loopBoundary = isLastLoop ? N - 1 : loopEndIdx - 1;
        // A pass that ended before the pause was already reported back then.
        if (localIdx === loopBoundary && track.id === refTrackId && !isLate) {
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
      bandRef.current?.stopAll();
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
