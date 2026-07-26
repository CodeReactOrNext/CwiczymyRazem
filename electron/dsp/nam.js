// Wraps the compiled NeuralAmpModelerCore WASM module (electron/nam/ — see its
// README for why WASM instead of pure JS or a native addon) behind the same
// per-sample process(x) shape as the other dsp/*.js stages, so ampSim.js can
// slot it into the chain like any other stage.
//
// Two things the real DSP forces on this wrapper that the others don't have:
// - Loading is async (WASM instantiation) — process() is a silent passthrough
//   until init() resolves and a model is loaded.
// - Processing is internally batched (BLOCK_SIZE samples per WASM call, not 1)
//   — calling nam_process(1) once per sample measured at ~0.7x real-time (the
//   JS<->WASM boundary crossing cost dominates at 48000+ calls/sec); batching
//   into small blocks recovers ~2.2x at the cost of a few ms of latency. See
//   electron/nam/README.md for the actual numbers.
const path = require("path");

const BLOCK_SIZE = 64; // ~1.3ms at 48kHz — the latency/throughput balance point measured for this module

class NamEngine {
  constructor(sr) {
    this.sr = sr;
    this.ready = false;
    this.loaded = false;
    this.module = null;
    this.fns = null;

    // Input accumulator + output queue for the process(x) <-> block-based WASM
    // call size mismatch. inBuf fills up to BLOCK_SIZE before a single
    // nam_process() call refills outBuf, which process(x) then drains one
    // sample at a time.
    this.inBuf = new Float32Array(BLOCK_SIZE);
    this.inPos = 0;
    this.outBuf = new Float32Array(BLOCK_SIZE);
    this.outPos = 0;
    this.outLen = 0;

    this.initPromise = this._init();
  }

  async _init() {
    try {
      const createNamModule = require(path.join(__dirname, "..", "nam", "nam.js"));
      const Module = await createNamModule();
      this.module = Module;
      this.fns = {
        load: Module.cwrap("nam_load", "number", ["number"]),
        unload: Module.cwrap("nam_unload", null, []),
        isLoaded: Module.cwrap("nam_is_loaded", "number", []),
        setSampleRate: Module.cwrap("nam_set_sample_rate", null, ["number"]),
        reset: Module.cwrap("nam_reset", null, []),
        process: Module.cwrap("nam_process", null, ["number"]),
        getBuffer: Module.cwrap("nam_get_buffer", "number", []),
      };
      this.fns.setSampleRate(this.sr);
      this.bufPtr = this.fns.getBuffer();
      this.ready = true;
    } catch (err) {
      // Feature stays silently unavailable (process() passes through) — a
      // missing/corrupt WASM asset shouldn't take down the whole amp chain.
      this.ready = false;
    }
  }

  /** Loads a .nam model from its raw JSON text. Resolves true/false. Safe to
   *  call before init() has resolved (queues behind it). */
  async loadModel(jsonStr) {
    await this.initPromise;
    if (!this.ready) return false;
    if (jsonStr == null) {
      this.fns.unload();
      this.loaded = false;
      return false;
    }
    const len = this.module.lengthBytesUTF8(jsonStr) + 1;
    const ptr = this.module._malloc(len);
    this.module.stringToUTF8(jsonStr, ptr, len);
    const ok = this.fns.load(ptr);
    this.module._free(ptr);
    this.loaded = !!ok;
    this._clearBuffers();
    return this.loaded;
  }

  isLoaded() {
    return this.ready && this.loaded;
  }

  _clearBuffers() {
    this.inPos = 0;
    this.outPos = 0;
    this.outLen = 0;
  }

  _runBlock() {
    const heap = new Float32Array(this.module.HEAPF32.buffer, this.bufPtr, BLOCK_SIZE);
    heap.set(this.inBuf);
    this.fns.process(BLOCK_SIZE);
    this.outBuf.set(heap);
    this.outPos = 0;
    this.outLen = BLOCK_SIZE;
    this.inPos = 0;
  }

  /** Passthrough (returns x unchanged) until a model is loaded and ready, and
   *  for the first BLOCK_SIZE calls after that (ramp-up — no block has run
   *  yet to have produced real output). Steady state adds a constant
   *  BLOCK_SIZE-sample latency, ~1.3ms at 48kHz. Must read any pending output
   *  BEFORE _runBlock() overwrites outBuf, or the sample it would have
   *  returned this call gets silently dropped (a periodic micro-click once
   *  per block). */
  process(x) {
    if (!this.isLoaded()) return x;

    const y = this.outPos < this.outLen ? this.outBuf[this.outPos++] : x;

    this.inBuf[this.inPos++] = x;
    if (this.inPos === BLOCK_SIZE) this._runBlock();

    return y;
  }

  reset() {
    this._clearBuffers();
    if (this.isLoaded()) this.fns.reset();
  }
}

module.exports = { NamEngine, BLOCK_SIZE };
