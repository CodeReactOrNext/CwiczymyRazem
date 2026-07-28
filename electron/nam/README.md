# NAM WASM core

`nam.wasm` + `nam.js` are a compiled build of the real
[NeuralAmpModelerCore](https://github.com/sdatkinson/NeuralAmpModelerCore) (MIT) —
the same C++/Eigen DSP library real NAM plugins use to run `.nam` captured-amp
models — plus `wrapper.cpp`, a thin C API exposing model load/process/reset to
JS. This is a vendored prebuilt artifact (like `audify`'s native binary); there
is no build step for it in this repo's normal `npm run` scripts.

## Why WASM instead of a native Node addon

A pure-JS reimplementation of WaveNet inference was benchmarked at ~0.5x
real-time for the "standard" NAM architecture (16/8 channels, 10 dilations) —
not fast enough. A native Node addon around the real C++ core would need its
own prebuilt-binary CI pipeline (this project's only other native dep, `audify`,
ships prebuilt N-API binaries so no compiler is needed to build the app — NAM's
core has no such npm package). Compiling the real core to WASM gets native-like
speed (~2.2x real-time for the standard architecture, measured on this repo's
dev machine) as a single portable file, with no compiler needed to build/run
the app afterward — only to rebuild `nam.wasm` itself, which is rare.

## Rebuilding

Requires the [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)
activated (`emsdk install latest && emsdk activate latest`), then from a checkout
of `NeuralAmpModelerCore` with submodules fetched (`git submodule update --init --depth 1`):

```sh
emcc -O3 -std=c++20 -DNAM_SAMPLE_FLOAT -DNAM_ENABLE_A2_FAST -fexceptions -msimd128 \
  -I<NeuralAmpModelerCore>/NAM \
  -I<NeuralAmpModelerCore>/Dependencies/eigen \
  -I<NeuralAmpModelerCore>/Dependencies/nlohmann \
  wrapper.cpp \
  <NeuralAmpModelerCore>/NAM/activations.cpp \
  <NeuralAmpModelerCore>/NAM/container.cpp \
  <NeuralAmpModelerCore>/NAM/conv1d.cpp \
  <NeuralAmpModelerCore>/NAM/convnet.cpp \
  <NeuralAmpModelerCore>/NAM/dsp.cpp \
  <NeuralAmpModelerCore>/NAM/get_dsp.cpp \
  <NeuralAmpModelerCore>/NAM/linear.cpp \
  <NeuralAmpModelerCore>/NAM/lstm.cpp \
  <NeuralAmpModelerCore>/NAM/ring_buffer.cpp \
  <NeuralAmpModelerCore>/NAM/util.cpp \
  <NeuralAmpModelerCore>/NAM/wavenet/model.cpp \
  <NeuralAmpModelerCore>/NAM/wavenet/slimmable.cpp \
  <NeuralAmpModelerCore>/NAM/wavenet/a2_fast.cpp \
  -sMODULARIZE=1 -sEXPORT_NAME=createNamModule -sENVIRONMENT=node \
  -sALLOW_MEMORY_GROWTH=1 -sDISABLE_EXCEPTION_CATCHING=0 \
  -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPF32","HEAPU8","stringToUTF8","lengthBytesUTF8"]' \
  -sEXPORTED_FUNCTIONS='["_malloc","_free","_nam_load","_nam_unload","_nam_is_loaded","_nam_set_sample_rate","_nam_reset","_nam_process","_nam_get_buffer","_nam_buffer_capacity"]' \
  -o nam.js
```

(`NAM/wavenet/slimmable.cpp` must be included — `model.cpp` references
`nam::slimmable_wavenet::create_config` even for non-slimmable models.)

`NAM_ENABLE_A2_FAST` / `NAM/wavenet/a2_fast.cpp` (added 2026-07-28, built from
NeuralAmpModelerCore v0.5.5 — above TONE3000's stated v0.5.2 minimum for A2)
**is now compiled in**. Originally left out on the reasoning that the generic
path already cleared real-time for the architectures tested — but a real
client on a small buffer (128 samples @48kHz, 2.67ms budget) hit sustained
`driftMs` creep (see `nativeAudioEngine.js`) up to ~50ms over a minute of play
with an A2 model: individual blocks only ran ~1.1-1.4x over budget (below the
1.5x threshold that logs a `[audio] Block overrun` line), but thousands of
such blocks per minute net-accumulate drift silently. `is_a2_shape()` in
`a2_fast.cpp` requires an exact structural match (single layer array, 23
layers, kernel/dilation sequence, all-LeakyReLU(0.01), no FiLM/gating/head1x1,
k=16 head) — it's a compile-time-specialized `A2FastModel<Channels>` (Channels
∈ {3, 8} = nano/standard) instead of the generic dynamic-Eigen `WaveNetConfig`,
with a pow2 ring buffer and hand-unrolled/Eigen-GEMM per-layer kernels. No real
`.nam` A2 file was available to verify against, so this was smoke-tested with
synthetic weight streams shaped to pass `is_a2_shape()` for both Channels=3 and
Channels=8 (`nam_load` succeeds, `process()` produces finite, bounded,
non-passthrough output over 20k samples) — that confirms the fast path is
reachable and doesn't crash/NaN, not sonic correctness against a real trained
model.

`-msimd128` (added 2026-07-27) enables WASM SIMD — Eigen vectorizes the
conv/matrix math with it. Verified bit-identical output vs. the non-SIMD build
on three real captured `SlimmableContainer` models (rms diff = 0.0, no NaNs —
see conversation history for the comparison script), ~1.4-1.7x faster per
64-sample block on the dev machine. Chromium/Electron (V8) has supported WASM
SIMD for years, so this is safe to assume present on any client's build.

Note: in one real debugging session, a *much* larger gap showed up between
this isolated per-block benchmark (a heavy SlimmableContainer submodel still
ran at 3-5x real-time even on the pre-SIMD build) and what the live app
measured for the same model (1.6-4.8x *over* budget). SIMD is a genuine,
verified win, but it's very unlikely to be the whole story for a live overload
— check `nativeAudioEngine.js`'s overrun watchdog log (capture/dsp/write ms
breakdown) before assuming a slow model is the culprit.

## Loading a model — the stack-overflow trap

`nam_load` takes a `const char*` (the `.nam` file's raw JSON text). **Never**
pass it via `ccall(..., ["string"])` — that marshalling stack-allocates the
string, and a real model's JSON (weights array included) can be several MB
while the default WASM stack is 64KB. Always write it to the heap yourself:

```js
const len = Module.lengthBytesUTF8(jsonStr) + 1;
const ptr = Module._malloc(len);
Module.stringToUTF8(jsonStr, ptr, len);
Module.ccall("nam_load", "number", ["number"], [ptr]);
Module._free(ptr);
```

See `electron/dsp/nam.js` for the wrapper that does this.

## Per-sample call overhead — why processing is batched

Calling `nam_process(1)` once per audio sample (matching `ampSim.js`'s
sample-at-a-time `process(x)` convention) measured at ~0.7x real-time — the
JS↔WASM boundary crossing cost dominates at 48000+ calls/sec. Batching into
64-sample blocks recovers ~2.2x real-time at the cost of ~1.3ms of added
latency. `electron/dsp/nam.js` does this batching internally so callers still
see a plain `process(x)` per-sample interface.
