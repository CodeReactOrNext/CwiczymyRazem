// Throwaway benchmark (same category as test-amp.js / test-concurrent.js — manual,
// not part of the build or Vitest). Times the real Convolver inner loop at several
// tap counts against the ~5.33ms/block deadline (256 frames @48kHz) to sanity-check
// MAX_IR_TAPS before shipping it. Run with: node electron/bench-convolve.js
const { Convolver } = require("./dsp/convolver");

const SR = 48000;
const FRAME = 256;
const BLOCK_DEADLINE_MS = (FRAME / SR) * 1000;
const SECONDS_TO_SIMULATE = 5;
const totalFrames = SR * SECONDS_TO_SIMULATE;

function bench(taps) {
  const conv = new Convolver(SR);
  const ir = new Float32Array(taps);
  for (let i = 0; i < taps; i++) ir[i] = Math.exp(-i / (taps / 4)) * (Math.random() * 2 - 1);
  // Bypass setIR()'s MAX_IR_TAPS clamp directly so this bench can measure tap counts
  // above the current constant too (that's the whole point — deciding the constant).
  conv.ir = ir; conv.n = taps; conv.hist = new Float32Array(taps * 2); conv.pos = 0;

  const input = new Float32Array(FRAME);
  for (let i = 0; i < FRAME; i++) input[i] = Math.sin(i * 0.1);

  const blocks = Math.ceil(totalFrames / FRAME);
  const start = process.hrtime.bigint();
  let sink = 0;
  for (let b = 0; b < blocks; b++) {
    for (let i = 0; i < FRAME; i++) sink += conv.process(input[i]);
  }
  const end = process.hrtime.bigint();

  const totalMs = Number(end - start) / 1e6;
  const msPerBlock = totalMs / blocks;
  const pctOfDeadline = (msPerBlock / BLOCK_DEADLINE_MS) * 100;
  return { taps, totalMs, msPerBlock, pctOfDeadline, sink };
}

console.log(`Block deadline @${SR}Hz/${FRAME} frames: ${BLOCK_DEADLINE_MS.toFixed(3)}ms\n`);
console.log("taps".padEnd(8), "ms/block".padEnd(12), "% of deadline");
for (const taps of [512, 1024, 2048, 4096, 8192]) {
  const r = bench(taps);
  console.log(
    String(r.taps).padEnd(8),
    r.msPerBlock.toFixed(4).padEnd(12),
    r.pctOfDeadline.toFixed(1) + "%"
  );
}
