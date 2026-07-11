import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  onPlayStart,
  onTick,
  externalAudioContext,
}: UseMetronomeProps) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countInRemaining, setCountInRemaining] = useState<number>(0);
  // 0..1 click volume. ~0.35 maps to the historical 0.3 peak gain; 1 peaks at 0.85.
  const [volume, setVolume] = useState(0.5);
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
  const startTimeRef         = useRef<number | null>(null);
  const audioStartTimeRef    = useRef<number | null>(null);
  const beatCounterRef       = useRef<number>(0);
  const isMutedRef           = useRef(isMuted);
  const mutePlaybackClickRef = useRef(mutePlaybackClick);
  const volumeRef            = useRef(volume);
  const pausedElapsedTimeRef = useRef<number>(0);
  const pausedAudioElapsedRef= useRef<number>(0);
  // Beat position the next GP playback (AlphaTab) should seek to, or null to
  // start/resume normally. Set by seekToBeats, cleared on restart, consumed once
  // by the AlphaTab player before it calls play(). Without this the GP audio
  // ignores bar-click seeks (visual cursor jumps, audio does not).
  const pendingSeekBeatRef   = useRef<number | null>(null);

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

  const playSound = useCallback((time: number, isAccent: boolean = false, muted: boolean = false) => {
    if (!audioContextRef.current || muted) return;

    const peak = 0.85 * volumeRef.current;
    if (peak <= 0.0001) return;

    const context    = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode   = context.createGain();

    oscillator.type            = 'sine';
    oscillator.frequency.value = isAccent ? 1200 : 800;

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

    const lookahead      = 0.1; // 100ms
    const secondsPerBeat = 60.0 / (bpm * speedMultiplier);
    const ctx            = audioContextRef.current;

    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
      if (countInTargetRef.current > 0) {
        // Count-in beeps stay audible even when `mutePlaybackClick` is set (e.g. AlphaTab
        // notation is shown): AlphaTab itself hasn't started playing yet at this point
        // (see PracticeSession's isAudioPlaying gate), so nothing else would click here.
        playSound(nextNoteTimeRef.current, countInTargetRef.current === 4, isMutedRef.current);

        const currentCount = countInTargetRef.current;
        setTimeout(() => setCountInRemaining(currentCount), 0);

        countInTargetRef.current -= 1;
      } else {
        if (startTimeRef.current === null) {
          const msUntilBeat = Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000);
          // When resuming from a pause, snap the resume offset to a WHOLE number of
          // beats. Otherwise resuming mid-beat (e.g. at beat 5.3) makes the click grid
          // land at 5.3 / 6.3 / … instead of on the beat, drifting away from the notes.
          // On a fresh start pausedElapsed is 0, so this is a no-op there.
          const beatsPaused      = secondsPerBeat > 0 ? Math.round((pausedAudioElapsedRef.current / 1000) / secondsPerBeat) : 0;
          const snappedElapsedMs = beatsPaused * secondsPerBeat * 1000;
          startTimeRef.current = Date.now() + msUntilBeat - snappedElapsedMs;
          if (audioContextRef.current) {
            audioStartTimeRef.current = nextNoteTimeRef.current - (snappedElapsedMs / 1000);
          }
          // Continue the accent grid from the resumed beat so downbeats stay aligned.
          beatCounterRef.current = beatsPaused;
          onPlayStartRef.current?.();
          const wall  = startTimeRef.current;
          const audio = audioStartTimeRef.current;
          setTimeout(() => {
            setCountInRemaining(0);
            setPlaybackAnchor({ wall, audio });
          }, 0);
        }
        // Once real playback has started, `mutePlaybackClick` hands the click over to
        // another clock (e.g. AlphaTab's own built-in metronome) so the two can't drift.
        playSound(
          nextNoteTimeRef.current,
          beatCounterRef.current % 4 === 0,
          isMutedRef.current || mutePlaybackClickRef.current,
        );
        beatCounterRef.current += 1;
      }

      nextNoteTimeRef.current += secondsPerBeat;
    }
  }, [bpm, speedMultiplier, playSound]);

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

    const useCountIn = !options?.skipCountIn;
    nextNoteTimeRef.current   = ctx.currentTime;
    countInTargetRef.current  = useCountIn ? 4 : 0;
    startTimeRef.current      = null;
    audioStartTimeRef.current = null;
    beatCounterRef.current    = 0;
    setCountInRemaining(useCountIn ? 4 : 0);
    setPlaybackAnchor({ wall: null, audio: null });

    const node = ensureWorkletNode();
    if (node) {
      node.port.postMessage({ type: 'start' });
    } else {
      scheduler();
    }

    setIsPlaying(true);
  }, [scheduler, ensureWorkletNode]);

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

  const seekToBeats = useCallback((beats: number) => {
    // Use startTimeRef (not React state) so callers can seek immediately after stopMetronome()
    // without waiting for the next React render cycle.
    if (startTimeRef.current !== null) return;
    const secondsPerBeat = 60.0 / (bpm * (speedMultiplier || 1));
    const elapsedMs = beats * secondsPerBeat * 1000;
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
    toggleMetronome,
    startMetronome,
    stopMetronome,
    restartMetronome,
    seekToBeats,
    pendingSeekBeatRef,
    handleSetRecommendedBpm,
    recommendedBpm,
    startTime: playbackAnchor.wall,
    audioContext: audioContextRef.current,
    audioStartTime: playbackAnchor.audio,
  }), [
    bpm, isPlaying, countInRemaining, minBpm, maxBpm,
    setBpm, volume, setVolume, toggleMetronome, startMetronome, stopMetronome,
    restartMetronome, seekToBeats, handleSetRecommendedBpm, recommendedBpm,
    playbackAnchor,
  ]);
};
