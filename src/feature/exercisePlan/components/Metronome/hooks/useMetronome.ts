import { onOutputDeviceChange, readPersistedOutputDeviceId } from "hooks/useNativeOutputDevice";
import type { MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applySinkId } from "utils/applyAudioSinkId";

import type { TempoRuler } from "../../../views/PracticeSession/hooks/tempoBeatClock";
import {
  type AccentLevel,
  cycleAccentLevel,
  DEFAULT_ACCENT_PATTERN,
  getAccentLevel,
  type GridUnit,
  resizeAccentPattern,
  stepsPerBeat as stepsPerBeatOf,
  subdivisionCountFor,
} from "../utils/accentPattern";
import { CLICK_TONES, type ClickKind } from "../utils/clickTones";
import { getCountInBeats } from "../utils/countInDuration";
import type { MetronomeGrid } from "../utils/meterGrid";

// AudioWorklet processor — runs on the audio thread, fires ticks every ~25ms.
// Using an inline Blob URL avoids the need to serve a separate .js file.
const WORKLET_CODE = `
class MetronomeProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this._intervalSec = 0.025;
    this._nextTick    = -1;
    this._running     = false;
    this.port.onmessage = ({ data }) => {
      if (data.type === 'start') { this._running = true;  this._nextTick = -1; }
      if (data.type === 'stop')  { this._running = false; }
    };
  }
  process() {
    if (!this._running) return true;
    if (this._nextTick < 0) this._nextTick = currentTime;
    if (currentTime >= this._nextTick) {
      this.port.postMessage({ type: 'tick' });
      this._nextTick += this._intervalSec;
    }
    return true;
  }
}
registerProcessor('metronome-processor', MetronomeProcessor);
`;

interface UseMetronomeProps {
  initialBpm?: number;
  minBpm?: number;
  maxBpm?: number;
  recommendedBpm?: number;
  isMuted?: boolean;
  /**
   * Mutes only the steady click *after* the count-in finishes (e.g. because another
   * clock — AlphaTab's own built-in metronome — takes over once real playback starts).
   * The count-in beeps themselves stay audible, since during count-in nothing else is
   * playing yet to click in their place.
   */
  mutePlaybackClick?: boolean;
  speedMultiplier?: number;
  enabled?: boolean;
  /**
   * Tempo curve the click has to follow, for a song aligned against a band that
   * doesn't play to a grid (see feature/backingTrack — the Align screen writes it).
   * Null, or an omitted ref, keeps the plain constant-tempo behaviour.
   *
   * A ref rather than a value because of an ordering knot: the curve is derived
   * from the backing track's alignment, which is itself positioned against this
   * metronome's own clock, so it cannot exist until after this hook has run. The
   * scheduler reads it at tick time, by which point it is filled in.
   *
   * The metronome still owns `bpm`: the ruler only says how each bar relates to
   * it, so the speed slider keeps scaling the whole piece.
   */
  tempoRulerRef?: MutableRefObject<TempoRuler | null>;
  onPlayStart?: () => void;
  /** Called on every ~25ms worklet tick — use to drive external schedulers */
  onTick?: () => void;
  /**
   * When provided the metronome schedules its sounds on this context instead of
   * creating an internal one.  Pass AlphaTab's AudioContext when a GP file is active
   * so that metronome clicks and GP audio share the same audio graph / clock.
   */
  externalAudioContext?: AudioContext | null;
}

export const useMetronome = ({
  initialBpm = 60,
  minBpm = 40,
  maxBpm = 208,
  recommendedBpm = 60,
  isMuted = false,
  mutePlaybackClick = false,
  speedMultiplier = 1,
  enabled = true,
  tempoRulerRef,
  onPlayStart,
  onTick,
  externalAudioContext,
}: UseMetronomeProps) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countInRemaining, setCountInRemaining] = useState<number>(0);
  // 0..1 click volume. ~0.35 maps to the historical 0.3 peak gain; 1 peaks at 0.85.
  const [volume, setVolume] = useState(0.5);
  // Clicks per beat: 1 = plain quarter notes (no subdivision), 2 = eighth notes,
  // 3 = eighth-note triplets, 4 = sixteenth notes.
  const [subdivision, setSubdivision] = useState(1);
  // One entry per beat in the bar — its length *is* the time signature's
  // numerator (custom meters), each entry's value is that beat's accent level.
  const [accentPattern, setAccentPattern] = useState<AccentLevel[]>(DEFAULT_ACCENT_PATTERN);
  // What one accentPattern entry is worth — a quarter (4, the default) or an eighth (8).
  // See GridUnit: 8 is what lets 7/8 and compound groupings be clicked at all.
  const [gridUnit, setGridUnit] = useState<GridUnit>(4);
  // Set by an exercise whose whole point IS the click grid (the meter drills):
  // editing the beats or the accents there would take the drill apart, so the
  // controls go read-only until another exercise hands over a grid of its own.
  const [accentLocked, setAccentLocked] = useState(false);
  // How the current grid reads ("3/4", "3/4 ↔ 5/8") — shown next to the click
  // grid so the player can see which meter is being clicked. Null when the grid
  // is the plain default or something the player built by hand.
  const [gridLabel, setGridLabel] = useState<string | null>(null);
  // Entries each bar of the grid takes, so the UI can break its rows on the bar
  // lines instead of wherever the row happens to run out.
  const [gridBarLengths, setGridBarLengths] = useState<number[] | null>(null);
  // Which beat in the pattern is currently sounding — drives the UI's playhead highlight.
  const [currentBeat, setCurrentBeat] = useState(0);
  // Playback anchor mirrored into React state. The refs are set on the audio
  // thread's first scheduled beat, which on a skipCountIn start (loop restart,
  // live seek) changes no state at all — without this mirror the memoized
  // return value would keep exposing startTime/audioStartTime = null forever.
  const [playbackAnchor, setPlaybackAnchor] = useState<{ wall: number | null; audio: number | null }>({ wall: null, audio: null });

  const audioContextRef      = useRef<AudioContext | null>(null);
  const nextNoteTimeRef      = useRef<number>(0);
  const workletNodeRef       = useRef<AudioWorkletNode | null>(null);
  const workletReadyRef      = useRef(false);
  const countInTargetRef     = useRef<number>(0);
  // Count-in length in quarter notes — one 4/4 bar, or two at fast tempos (see
  // getCountInBeats). Held so the scheduler can tell which beat of it is sounding.
  const countInStartRef      = useRef<number>(4);
  const startTimeRef         = useRef<number | null>(null);
  const audioStartTimeRef    = useRef<number | null>(null);
  const beatCounterRef       = useRef<number>(0);
  // How many accent-grid entries have sounded — the index into accentPattern.
  // Under the default quarter grid this advances once per beat and so tracks
  // beatCounterRef exactly; under an eighth grid it advances twice as often,
  // which is the whole point. Kept separate from beatCounterRef because that one
  // is incremented at the *start* of a beat and so points at the next beat for
  // the rest of it — fine for the playback anchor, wrong for indexing accents.
  const stepCounterRef       = useRef<number>(0);
  // Position within the current beat's subdivision grid — 0 is always the beat
  // itself, anything else is a subdivision tick between beats.
  const subdivisionIndexRef  = useRef<number>(0);
  const isMutedRef           = useRef(isMuted);
  // Mirrors accentLocked so the edit callbacks can reject a change without
  // taking the state as a dependency (they are handed to memoized toolbars).
  const accentLockedRef      = useRef(false);
  const mutePlaybackClickRef = useRef(mutePlaybackClick);
  const volumeRef            = useRef(volume);
  const pausedElapsedTimeRef = useRef<number>(0);
  const pausedAudioElapsedRef= useRef<number>(0);
  // Beat position the next GP playback (AlphaTab) should seek to, or null to
  // start/resume normally. Set by seekToBeats, cleared on restart, consumed once
  // by the AlphaTab player before it calls play(). Without this the GP audio
  // ignores bar-click seeks (visual cursor jumps, audio does not).
  const pendingSeekBeatRef   = useRef<number | null>(null);
  const ownsContextRef       = useRef(true);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Keep schedulerRef current so the worklet message handler never captures a stale closure.
  const schedulerRef    = useRef<(() => void) | null>(null);
  const onPlayStartRef  = useRef(onPlayStart);
  const onTickRef       = useRef(onTick);
  useEffect(() => { onPlayStartRef.current = onPlayStart; }, [onPlayStart]);
  useEffect(() => { onTickRef.current = onTick; },         [onTick]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    mutePlaybackClickRef.current = mutePlaybackClick;
  }, [mutePlaybackClick]);

  useEffect(() => {
    setBpm(initialBpm);
  }, [initialBpm]);

  // ── AudioContext + AudioWorklet setup ───────────────────────────────────────
  // When externalAudioContext is provided (e.g. AlphaTab's context for GP files),
  // we skip creating our own and add the worklet module to the shared context instead.
  // This ensures metronome clicks and GP/guitar audio share the same audio graph and clock.
  useEffect(() => {
    if (!enabled) return;

    const ownsContext = !externalAudioContext;
    const ctx: AudioContext = externalAudioContext
      ?? new (window.AudioContext || (window as any).webkitAudioContext)();

    audioContextRef.current = ctx;
    ownsContextRef.current  = ownsContext;
    if (ownsContext) applySinkId(ctx, readPersistedOutputDeviceId());
    workletNodeRef.current?.disconnect();
    workletNodeRef.current  = null;
    workletReadyRef.current = false;

    const blob    = new Blob([WORKLET_CODE], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    ctx.audioWorklet.addModule(blobUrl).then(() => {
      URL.revokeObjectURL(blobUrl);
      workletReadyRef.current = true;
    }).catch((err) => {
      console.error('[useMetronome] AudioWorklet failed to load:', err);
      URL.revokeObjectURL(blobUrl);
    });

    return () => {
      workletNodeRef.current?.port.postMessage({ type: 'stop' });
      workletNodeRef.current?.disconnect();
      workletNodeRef.current  = null;
      workletReadyRef.current = false;
      // Only close the context if we created it — never close an external context.
      if (ownsContext) ctx.close();
    };
  // externalAudioContext intentionally included: when AlphaTab's context becomes
  // available we reinitialise the worklet on that context (happens before first play).

  }, [enabled, externalAudioContext]);

  // Move an already-open, app-owned context to a newly picked output device live
  // (e.g. user changes the interface mid-session in the Setup step). Never touches
  // an adopted/external context — its owner (AlphaTab) applies its own device.
  useEffect(() => onOutputDeviceChange((id) => {
    if (ownsContextRef.current && audioContextRef.current) applySinkId(audioContextRef.current, id);
  }), []);

  const playSound = useCallback((time: number, kind: ClickKind = 'beat', muted: boolean = false) => {
    if (!audioContextRef.current || muted) return;

    const { frequency, gainScale } = CLICK_TONES[kind];
    const peak = 0.85 * volumeRef.current * gainScale;
    if (peak <= 0.0001) return;

    const context    = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode   = context.createGain();

    oscillator.type            = 'sine';
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(peak, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.1);
  }, []);

  // ── Scheduler — called on every worklet tick (~25ms, audio thread) ─────────
  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    const lookahead        = 0.1; // 100ms
    const secondsPerBeat   = 60.0 / (bpm * speedMultiplier);
    const subdivisionCount = subdivisionCountFor(subdivision, gridUnit);
    const stepsPerBeat     = stepsPerBeatOf(gridUnit);
    // Ticks between two accent-grid entries. Always a whole number: an eighth grid
    // forces subdivisionCount even, so a grid entry never falls between ticks.
    const ticksPerStep     = subdivisionCount / stepsPerBeat;
    const ctx              = audioContextRef.current;

    // Tempo automation, if this song carries any. Everything below works in the
    // ruler's warped-beat space (see createTempoRuler), where one warped beat is
    // always secondsPerBeat long — a bar the band pushed through simply spans
    // fewer of them. With no ruler the two spaces are identical and this
    // collapses back to the plain constant-tempo arithmetic.
    const ruler = tempoRulerRef?.current ?? null;
    const hasTempoMap = !!ruler && !ruler.isConstant;
    const warped   = (beat: number) => (hasTempoMap ? ruler!.toWarped(beat) : beat);
    const unwarped = (w: number)    => (hasTempoMap ? ruler!.fromWarped(w)  : w);
    /** Seconds occupied by `beats` of score starting at `fromBeat`. */
    const stepSeconds = (fromBeat: number, beats: number): number =>
      (warped(fromBeat + beats) - warped(fromBeat)) * secondsPerBeat;

    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
      if (countInTargetRef.current > 0) {
        // Count-in beeps stay audible even when `mutePlaybackClick` is set (e.g. AlphaTab
        // notation is shown): AlphaTab itself hasn't started playing yet at this point
        // (see PracticeSession's isAudioPlaying gate), so nothing else would click here.
        // Always a plain 4/4 bar of quarter notes, whatever grid the exercise plays in
        // — see COUNT_IN_BEATS. Subdivision only kicks in once real playback starts.
        const countInBeatIndex = countInStartRef.current - countInTargetRef.current;
        const countInLevel     = getAccentLevel(DEFAULT_ACCENT_PATTERN, countInBeatIndex);
        playSound(nextNoteTimeRef.current, countInLevel === 2 ? 'accent' : 'beat', isMutedRef.current);

        const currentCount = countInTargetRef.current;
        setTimeout(() => setCountInRemaining(currentCount), 0);

        countInTargetRef.current -= 1;
        // The count-in leads into bar 1, so it ticks at bar 1's tempo — one whole
        // quarter note at a time, independent of what a grid entry is worth.
        nextNoteTimeRef.current  += stepSeconds(0, 1);
      } else {
        // Only a true beat (subdivision index 0) drives the playback anchor and the
        // 4-beat accent grid — subdivision ticks in between are just extra clicks.
        const isBeat = subdivisionIndexRef.current === 0;

        if (isBeat && startTimeRef.current === null) {
          const msUntilBeat = Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000);
          // When resuming from a pause, snap the resume offset to a WHOLE number of
          // beats. Otherwise resuming mid-beat (e.g. at beat 5.3) makes the click grid
          // land at 5.3 / 6.3 / … instead of on the beat, drifting away from the notes.
          // On a fresh start pausedElapsed is 0, so this is a no-op there.
          const pausedWarped     = secondsPerBeat > 0 ? (pausedAudioElapsedRef.current / 1000) / secondsPerBeat : 0;
          const beatsPaused      = Math.round(unwarped(pausedWarped));
          const snappedElapsedMs = warped(beatsPaused) * secondsPerBeat * 1000;
          startTimeRef.current = Date.now() + msUntilBeat - snappedElapsedMs;
          if (audioContextRef.current) {
            audioStartTimeRef.current = nextNoteTimeRef.current - (snappedElapsedMs / 1000);
          }
          // Continue the accent grid from the resumed beat so downbeats stay aligned.
          beatCounterRef.current = beatsPaused;
          stepCounterRef.current = beatsPaused * stepsPerBeat;
          onPlayStartRef.current?.();
          const wall  = startTimeRef.current;
          const audio = audioStartTimeRef.current;
          setTimeout(() => {
            setCountInRemaining(0);
            setPlaybackAnchor({ wall, audio });
          }, 0);
        }

        // Where this tick sits in the score, which is what decides the gap to the
        // next one under a tempo map.
        //
        // beatCounterRef is bumped on the tick that *opens* a beat, so for the rest
        // of that beat it already names the next one — subtracting it back is what
        // keeps a subdivision tick from being read a whole beat too late. Constant
        // tempo hides the difference (stepSeconds ignores `fromBeat` when the ruler
        // is flat), so this only ever showed on a tempo-mapped exercise played with
        // subdivisions — which an eighth grid now always is.
        const beatAtTick  = beatCounterRef.current - (subdivisionIndexRef.current === 0 ? 0 : 1);
        const tickBeatPos = beatAtTick + subdivisionIndexRef.current / subdivisionCount;

        // Once real playback has started, `mutePlaybackClick` hands the click over to
        // another clock (e.g. AlphaTab's own built-in metronome) so the two can't drift.
        const muted = isMutedRef.current || mutePlaybackClickRef.current;
        // A grid entry, not a beat, is what carries an accent — the two are the same
        // tick under the default quarter grid, and every other tick under an eighth one.
        const isStep = subdivisionIndexRef.current % ticksPerStep === 0;
        if (isStep) {
          const stepIndex = stepCounterRef.current;
          const level     = getAccentLevel(accentPattern, stepIndex);
          if (level !== 0) playSound(nextNoteTimeRef.current, level === 2 ? 'accent' : 'beat', muted);
          stepCounterRef.current += 1;
          const patternPosition = accentPattern.length > 0 ? stepIndex % accentPattern.length : 0;
          setTimeout(() => setCurrentBeat(patternPosition), 0);
        } else {
          playSound(nextNoteTimeRef.current, 'sub', muted);
        }
        if (isBeat) beatCounterRef.current += 1;

        subdivisionIndexRef.current = (subdivisionIndexRef.current + 1) % subdivisionCount;
        nextNoteTimeRef.current    += stepSeconds(tickBeatPos, 1 / subdivisionCount);
      }
    }
  }, [bpm, speedMultiplier, subdivision, gridUnit, accentPattern, playSound]);

  // Keep schedulerRef in sync with the latest scheduler closure.
  useEffect(() => {
    schedulerRef.current = scheduler;
  }, [scheduler]);

  // ── Worklet node lifecycle ─────────────────────────────────────────────────
  const ensureWorkletNode = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !workletReadyRef.current) return null;

    if (!workletNodeRef.current) {
      const node = new AudioWorkletNode(ctx, 'metronome-processor');
      node.port.onmessage = ({ data }) => {
        if (data.type === 'tick') {
          schedulerRef.current?.();
          onTickRef.current?.();
        }
      };
      // Must be connected to the audio graph for process() to run.
      node.connect(ctx.destination);
      workletNodeRef.current = node;
    }

    return workletNodeRef.current;
  }, []);

  const startMetronome = useCallback((options?: { skipCountIn?: boolean }) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') ctx.resume();

    const useCountIn  = !options?.skipCountIn;
    const countInBeats = getCountInBeats(bpm * (speedMultiplier || 1));
    nextNoteTimeRef.current   = ctx.currentTime;
    countInTargetRef.current  = useCountIn ? countInBeats : 0;
    countInStartRef.current   = countInBeats;
    startTimeRef.current      = null;
    audioStartTimeRef.current = null;
    beatCounterRef.current    = 0;
    stepCounterRef.current    = 0;
    subdivisionIndexRef.current = 0;
    setCountInRemaining(useCountIn ? countInBeats : 0);
    setPlaybackAnchor({ wall: null, audio: null });
    setCurrentBeat(0);

    const node = ensureWorkletNode();
    if (node) {
      node.port.postMessage({ type: 'start' });
    } else {
      scheduler();
    }

    setIsPlaying(true);
  }, [scheduler, ensureWorkletNode, bpm, speedMultiplier]);

  const stopMetronome = useCallback(() => {
    workletNodeRef.current?.port.postMessage({ type: 'stop' });

    if (startTimeRef.current !== null) {
      pausedElapsedTimeRef.current = Date.now() - startTimeRef.current;
    }
    if (audioStartTimeRef.current !== null && audioContextRef.current) {
      pausedAudioElapsedRef.current =
        (audioContextRef.current.currentTime - audioStartTimeRef.current) * 1000;
    }
    startTimeRef.current      = null;
    audioStartTimeRef.current = null;
    countInTargetRef.current  = 0;
    setCountInRemaining(0);
    setPlaybackAnchor({ wall: null, audio: null });
    setIsPlaying(false);
  }, []);

  const restartMetronome = useCallback(() => {
    stopMetronome();
    pausedElapsedTimeRef.current  = 0;
    pausedAudioElapsedRef.current = 0;
    beatCounterRef.current        = 0;
    stepCounterRef.current        = 0;
    subdivisionIndexRef.current   = 0;
    pendingSeekBeatRef.current    = null; // back to the top → GP audio starts at 0
  }, [stopMetronome]);

  const toggleMetronome = useCallback(() => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  }, [isPlaying, startMetronome, stopMetronome]);

  useEffect(() => {
    if (isPlaying && countInRemaining === 0 && startTimeRef.current) {
      startMetronome();
    }
  }, [bpm]); // Intentionally not including others to avoid restarts on other prop changes

  const handleSetRecommendedBpm = useCallback(() => {
    setBpm(recommendedBpm);
  }, [recommendedBpm]);

  // Change the meter's beat count (its numerator, e.g. 4/4 → 5/4). New beats
  // start as plain clicks; existing accents are kept.
  const setBeatsPerBar = useCallback((count: number) => {
    if (accentLockedRef.current) return;
    setAccentPattern((prev) => resizeAccentPattern(prev, count));
  }, []);

  // Click-to-cycle a single beat's accent: plain → accent → muted → plain.
  const cycleBeatAccent = useCallback((index: number) => {
    if (accentLockedRef.current) return;
    setAccentPattern((prev) => prev.map((level, i) => (i === index ? cycleAccentLevel(level) : level)));
  }, []);

  /**
   * Replace the whole click grid at once — the unit an entry is worth and the
   * accents themselves. Set together because they are meaningless apart: seven
   * entries mean a bar of 7/8 under an eighth grid and 7/4 under a quarter one.
   *
   * This is how an exercise hands the metronome its own meter — either the one
   * it declares (Exercise.metronomeGrid) or the one derived from its tab. A grid
   * spanning several bars is how the click follows a meter that changes: the
   * pattern covers the whole 3/4 + 5/8 cycle, so the accents move with it.
   *
   * `locked` is for the grids that are the exercise itself rather than a
   * starting point. Everywhere else the +/- and click-to-accent controls stay in
   * charge of whatever the player does to the grid afterwards.
   */
  const setAccentGrid = useCallback((grid: MetronomeGrid, locked = false) => {
    setGridUnit(grid.unit);
    // Taken as given, not resized: a grid spelling out a whole 12/8 + 4/4 pair is
    // longer than the +/- control's own limit, and clamping it there would drop
    // the second bar of the pair on the floor.
    setAccentPattern([...grid.pattern]);
    setGridLabel(grid.label ?? null);
    setGridBarLengths(grid.barLengths.length > 1 ? grid.barLengths : null);
    accentLockedRef.current = locked;
    setAccentLocked(locked);
  }, []);

  /**
   * Score beat the next play() will start from.
   *
   * Only meaningful while stopped — it reads the paused anchor, which is stale
   * the moment playback is running. The Align screen draws its playhead here so
   * that pressing Stop leaves a marker on the spot instead of snapping the
   * whole view back to bar 1, and so that clicking the tab to seek shows where
   * the seek landed.
   *
   * Each metronome answers for its own resume rule rather than publishing the
   * raw elapsed time, because the two devices do not share one: this one snaps
   * to a whole beat and the mobile one does not.
   */
  const getResumeBeat = useCallback((): number => {
    const secondsPerBeat = 60.0 / (bpm * (speedMultiplier || 1));
    if (!(secondsPerBeat > 0)) return 0;
    const ruler = tempoRulerRef?.current ?? null;
    const hasTempoMap = !!ruler && !ruler.isConstant;
    const warped = (pausedAudioElapsedRef.current / 1000) / secondsPerBeat;
    const beat = hasTempoMap ? ruler!.fromWarped(warped) : warped;
    // Whole beats, matching the scheduler's own snap on resume — a marker half
    // a beat off from where playback begins is worse than no marker.
    return Math.max(0, Math.round(beat));
  }, [bpm, speedMultiplier, tempoRulerRef]);

  const seekToBeats = useCallback((beats: number) => {
    // Use startTimeRef (not React state) so callers can seek immediately after stopMetronome()
    // without waiting for the next React render cycle.
    if (startTimeRef.current !== null) return;
    const secondsPerBeat = 60.0 / (bpm * (speedMultiplier || 1));
    // The seek target is a score beat but elapsed time is warped beats, so a
    // jump into a slowed-down section has to cost more seconds than beats.
    const ruler = tempoRulerRef?.current ?? null;
    const warpedBeats = ruler && !ruler.isConstant ? ruler.toWarped(beats) : beats;
    const elapsedMs = warpedBeats * secondsPerBeat * 1000;
    pausedElapsedTimeRef.current  = elapsedMs;
    pausedAudioElapsedRef.current = elapsedMs;
    pendingSeekBeatRef.current    = beats; // GP audio jumps here on the next play()
  }, [bpm, speedMultiplier]);

  return useMemo(() => ({
    bpm,
    isPlaying,
    countInRemaining,
    minBpm,
    maxBpm,
    setBpm,
    volume,
    setVolume,
    subdivision,
    setSubdivision,
    accentPattern,
    gridUnit,
    accentLocked,
    gridLabel,
    gridBarLengths,
    setBeatsPerBar,
    cycleBeatAccent,
    setAccentGrid,
    currentBeat,
    toggleMetronome,
    startMetronome,
    stopMetronome,
    restartMetronome,
    seekToBeats,
    getResumeBeat,
    pendingSeekBeatRef,
    handleSetRecommendedBpm,
    recommendedBpm,
    startTime: playbackAnchor.wall,
    audioContext: audioContextRef.current,
    audioStartTime: playbackAnchor.audio,
  }), [
    bpm, isPlaying, countInRemaining, minBpm, maxBpm,
    setBpm, volume, setVolume, subdivision, setSubdivision,
    accentPattern, gridUnit, accentLocked, gridLabel, gridBarLengths, setBeatsPerBar, cycleBeatAccent, setAccentGrid, currentBeat,
    toggleMetronome, startMetronome, stopMetronome,
    restartMetronome, seekToBeats, getResumeBeat, handleSetRecommendedBpm, recommendedBpm,
    playbackAnchor,
  ]);
};
