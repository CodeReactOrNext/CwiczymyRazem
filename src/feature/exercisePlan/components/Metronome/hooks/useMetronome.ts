import { useCallback, useEffect, useRef, useState } from "react";

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
  speedMultiplier = 1,
  enabled = true,
  onPlayStart,
  onTick,
  externalAudioContext,
}: UseMetronomeProps) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countInRemaining, setCountInRemaining] = useState<number>(0);

  const audioContextRef      = useRef<AudioContext | null>(null);
  const nextNoteTimeRef      = useRef<number>(0);
  const workletNodeRef       = useRef<AudioWorkletNode | null>(null);
  const workletReadyRef      = useRef(false);
  const countInTargetRef     = useRef<number>(0);
  const startTimeRef         = useRef<number | null>(null);
  const audioStartTimeRef    = useRef<number | null>(null);
  const beatCounterRef       = useRef<number>(0);
  const isMutedRef           = useRef(isMuted);
  const pausedElapsedTimeRef = useRef<number>(0);
  const pausedAudioElapsedRef= useRef<number>(0);

  // Keep schedulerRef current so the worklet message handler never captures a stale closure.
  const schedulerRef    = useRef<(() => void) | null>(null);
  const onPlayStartRef  = useRef(onPlayStart);
  const onTickRef       = useRef(onTick);
  useEffect(() => { onPlayStartRef.current = onPlayStart; }, [onPlayStart]);
  useEffect(() => { onTickRef.current = onTick; },         [onTick]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, externalAudioContext]);

  const playSound = useCallback((time: number, isAccent: boolean = false) => {
    if (!audioContextRef.current || isMutedRef.current) return;

    const context    = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode   = context.createGain();

    oscillator.type            = 'sine';
    oscillator.frequency.value = isAccent ? 1200 : 800;

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.3, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

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
        playSound(nextNoteTimeRef.current, countInTargetRef.current === 4);

        const currentCount = countInTargetRef.current;
        setTimeout(() => setCountInRemaining(currentCount), 0);

        countInTargetRef.current -= 1;
      } else {
        if (startTimeRef.current === null) {
          const msUntilBeat = Math.max(0, (nextNoteTimeRef.current - ctx.currentTime) * 1000);
          startTimeRef.current = Date.now() + msUntilBeat - pausedElapsedTimeRef.current;
          if (audioContextRef.current) {
            audioStartTimeRef.current = nextNoteTimeRef.current - (pausedAudioElapsedRef.current / 1000);
          }
          beatCounterRef.current = 0;
          onPlayStartRef.current?.();
          setTimeout(() => setCountInRemaining(0), 0);
        }
        playSound(nextNoteTimeRef.current, beatCounterRef.current % 4 === 0);
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

  const startMetronome = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') ctx.resume();

    nextNoteTimeRef.current  = ctx.currentTime;
    countInTargetRef.current = 4;
    startTimeRef.current     = null;
    audioStartTimeRef.current= null;
    beatCounterRef.current   = 0;
    setCountInRemaining(4);

    const node = ensureWorkletNode();
    if (node) {
      node.port.postMessage({ type: 'start' });
    } else {
      // Worklet not yet ready — run the first tick immediately so there's no silent gap.
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
    setIsPlaying(false);
  }, []);

  const restartMetronome = useCallback(() => {
    stopMetronome();
    pausedElapsedTimeRef.current  = 0;
    pausedAudioElapsedRef.current = 0;
    beatCounterRef.current        = 0;
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

  return {
    bpm,
    isPlaying,
    countInRemaining,
    minBpm,
    maxBpm,
    setBpm,
    toggleMetronome,
    startMetronome,
    stopMetronome,
    restartMetronome,
    handleSetRecommendedBpm,
    recommendedBpm,
    startTime: startTimeRef.current,
    audioContext: audioContextRef.current,
    audioStartTime: audioStartTimeRef.current,
  };
};
