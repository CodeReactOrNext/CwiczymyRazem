import { useEffect, useRef } from "react";

interface UseExamBackingAudioProps {
  url: string;
  sourceBpm: number;
  targetBpm: number;
  isPlaying: boolean;
  enabled: boolean;
  onEnded?: () => void;
  onDurationReady?: (durationSec: number) => void;
}

function getOrCreateCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext {
  if (!ref.current || ref.current.state === "closed") {
     
    ref.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return ref.current;
}

export function useExamBackingAudio(props: UseExamBackingAudioProps) {
  const { url, sourceBpm, targetBpm, isPlaying, enabled, onEnded, onDurationReady } = props;

  const ctxRef          = useRef<AudioContext | null>(null);
  const bufferRef       = useRef<AudioBuffer | null>(null);
  const sourceRef       = useRef<AudioBufferSourceNode | null>(null);
  const gainRef         = useRef<GainNode | null>(null);
  const loadedRef       = useRef("");
  const onEndedRef      = useRef(onEnded);
  const onDurationRef   = useRef(onDurationReady);
  onEndedRef.current    = onEnded;
  onDurationRef.current = onDurationReady;

  // Load buffer once when url/enabled change
  useEffect(() => {
    if (!enabled || !url) return;
    if (loadedRef.current === url) return;
    loadedRef.current = url;
    bufferRef.current = null;

    const ctx = getOrCreateCtx(ctxRef);
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
      .then(ab => ctx.decodeAudioData(ab))
      .then(buf => { bufferRef.current = buf; })
      .catch(e => console.warn("[ExamBacking] load failed:", e));
  }, [url, enabled]);

  // Start / stop on first beat
  useEffect(() => {
    const stopSource = () => {
      try { sourceRef.current?.stop(); } catch { /* already stopped */ }
      sourceRef.current = null;
    };

    if (!enabled || !isPlaying || !bufferRef.current) {
      stopSource();
      return;
    }

    const ctx = getOrCreateCtx(ctxRef);

    const startNow = () => {
      stopSource();
      if (!gainRef.current || gainRef.current.context !== ctx) {
        const g = ctx.createGain();
        g.gain.value = 0.8;
        g.connect(ctx.destination);
        gainRef.current = g;
      }
      const src = ctx.createBufferSource();
      src.buffer = bufferRef.current!;
      src.playbackRate.value = 1;
      src.loop = true;
      src.connect(gainRef.current!);
      // src.onended = () => onEndedRef.current?.(); // Don't fire onEnded since it loops infinitely now
      onDurationRef.current?.(bufferRef.current!.duration);
      src.start(0);
      sourceRef.current = src;
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(startNow);
    } else {
      startNow();
    }

    return stopSource;
  }, [enabled, isPlaying, sourceBpm, targetBpm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { sourceRef.current?.stop(); } catch { /* */ }
      ctxRef.current?.close().catch(() => {});
    };
  }, []);
}
