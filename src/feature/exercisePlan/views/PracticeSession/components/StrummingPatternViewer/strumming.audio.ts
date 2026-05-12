const CHORD_FREQS: Record<string, number[]> = {
  default: [82.41, 110.0, 146.83, 196.0, 246.94, 329.63],
  Em:  [82.41, 123.47, 164.81, 196.0, 246.94, 329.63],
  Am:  [110.0, 146.83, 220.0, 261.63, 329.63, 440.0],
  G:   [98.0,  146.83, 196.0, 246.94, 293.66, 392.0],
  C:   [130.81, 164.81, 261.63, 329.63, 392.0, 523.25],
  D:   [146.83, 220.0, 293.66, 369.99, 440.0, 587.33],
  E:   [82.41,  123.47, 164.81, 207.65, 246.94, 329.63],
  A:   [110.0,  146.83, 220.0, 277.18, 329.63, 440.0],
  F:   [87.31,  130.81, 174.61, 261.63, 349.23, 523.25],
  "E5": [82.41, 123.47, 164.81, 246.94, 0, 0],
  "A5": [110.0, 146.83, 220.0, 329.63, 0, 0],
  "G5": [98.0,  146.83, 196.0, 293.66, 0, 0],
  "E9": [82.41, 123.47, 164.81, 207.65, 277.18, 329.63],
  Am7: [110.0, 146.83, 196.0, 261.63, 329.63, 440.0],
};

function ksString(ctx: AudioContext, freq: number, t: number, decay: number, vol: number, dest: AudioNode) {
  const sr        = ctx.sampleRate;
  const periodLen = Math.max(2, Math.round(sr / freq));
  const buf       = ctx.createBuffer(1, periodLen, sr);
  const data      = buf.getChannelData(0);
  for (let i = 0; i < periodLen; i++) data[i] = Math.random() * 2 - 1;
  for (let pass = 0; pass < 3; pass++)
    for (let i = 1; i < periodLen; i++)
      data[i] = (data[i] + data[i - 1]) * 0.5;

  const src  = ctx.createBufferSource();
  src.buffer = buf;
  src.loop   = true;

  const lpf           = ctx.createBiquadFilter();
  lpf.type            = "lowpass";
  lpf.frequency.value = Math.min(freq * 6, 6000);
  lpf.Q.value         = 0.4;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

  src.connect(lpf); lpf.connect(gain); gain.connect(dest);
  src.start(t); src.stop(t + decay + 0.05);
}

export function playStrumSound(ctx: AudioContext, direction: "down" | "up", muted: boolean, accented: boolean, chord?: string) {
  const now   = ctx.currentTime;
  const vol   = accented ? 0.55 : muted ? 0.3 : 0.42;
  const decay = muted ? 0.06 : direction === "up" ? 0.55 : 0.75;

  const rawFreqs: number[] = (chord ? CHORD_FREQS[chord] : undefined) ?? CHORD_FREQS.default ?? [];
  const allFreqs = rawFreqs.filter((f: number) => f > 0);
  const freqs    = direction === "down" ? allFreqs : [...allFreqs].reverse();

  const master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);

  const bodyEq           = ctx.createBiquadFilter();
  bodyEq.type            = "peaking";
  bodyEq.frequency.value = 320;
  bodyEq.gain.value      = 4;
  bodyEq.Q.value         = 0.8;
  bodyEq.connect(master);

  const hpf           = ctx.createBiquadFilter();
  hpf.type            = "highpass";
  hpf.frequency.value = 90;
  hpf.connect(bodyEq);

  const presence           = ctx.createBiquadFilter();
  presence.type            = "lowpass";
  presence.frequency.value = 5000;
  presence.connect(hpf);

  const wet          = ctx.createGain();
  wet.gain.value     = 0.18;
  wet.connect(master);
  const delay1       = ctx.createDelay(0.5);
  delay1.delayTime.value = 0.027;
  const delay2       = ctx.createDelay(0.5);
  delay2.delayTime.value = 0.043;
  const revLpf       = ctx.createBiquadFilter();
  revLpf.type        = "lowpass";
  revLpf.frequency.value = 2000;
  const revGain      = ctx.createGain();
  revGain.gain.value = 0.35;
  presence.connect(delay1);
  delay1.connect(revLpf); revLpf.connect(delay2);
  delay2.connect(revGain); revGain.connect(delay1); revGain.connect(wet);

  const stagger = 0.006;
  const strVol  = vol / freqs.length;
  freqs.forEach((freq: number, i: number) => {
    ksString(ctx, freq, now + i * stagger, decay, strVol, presence);
  });
}
