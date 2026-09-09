let context: AudioContext | null = null;

/**
 * Sounds a single open-string pitch so the tuner is still useful without a
 * microphone — tuning by ear against a reference is how most players learn.
 * Two partials and a slow decay is enough to read as a plucked string; anything
 * richer would need samples this page has no reason to download.
 */
export function playReferenceTone(hz: number, durationSec = 2.2): void {
  if (typeof window === "undefined") return;
  const AudioContextClass =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  if (!context) context = new AudioContextClass();
  const ctx = context;
  if (ctx.state === "suspended") void ctx.resume();

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
  master.connect(ctx.destination);

  [1, 2].forEach((partial, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(hz * partial, now);
    gain.gain.value = index === 0 ? 1 : 0.25;
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + durationSec + 0.05);
  });
}
