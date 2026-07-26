// WASM-facing wrapper around the real NeuralAmpModelerCore (github.com/sdatkinson/
// NeuralAmpModelerCore, MIT) -- the same C++/Eigen DSP library real NAM plugins use
// for .nam model inference. Compiled with Emscripten; see README.md in this
// directory for the exact build command and rationale (perf/aliasing benchmarks
// live in the riff.quest conversation history, not here).
#include <emscripten.h>
#include <cstdio>
#include <memory>
#include <string>

#include "dsp.h"
#include "get_dsp.h"

static std::unique_ptr<nam::DSP> g_model;
static double g_sampleRate = 48000.0;
static float g_scratch[512]; // reused buffer; caller (JS) never requests more than this per call

extern "C"
{
  // Loads a .nam model from its raw JSON text (heap pointer -- the caller must
  // NOT pass this via ccall's "string" arg type, which stack-allocates: a real
  // model's JSON with its full weight array can be several MB, and the default
  // WASM stack is only 64KB). Returns 1 on success, 0 on failure.
  EMSCRIPTEN_KEEPALIVE
  int nam_load(const char* jsonStr)
  {
    try
    {
      auto j = nlohmann::json::parse(jsonStr);
      auto model = nam::get_dsp(j);
      if (!model)
        return 0;
      model->Reset(g_sampleRate, 512);
      g_model = std::move(model);
      return 1;
    }
    catch (const std::exception& e)
    {
      fprintf(stderr, "nam_load failed: %s\n", e.what());
      return 0;
    }
    catch (...)
    {
      fprintf(stderr, "nam_load failed: unknown error\n");
      return 0;
    }
  }

  EMSCRIPTEN_KEEPALIVE
  void nam_set_sample_rate(double sampleRate)
  {
    g_sampleRate = sampleRate;
    if (g_model)
      g_model->Reset(g_sampleRate, 512);
  }

  EMSCRIPTEN_KEEPALIVE
  void nam_unload() { g_model.reset(); }

  EMSCRIPTEN_KEEPALIVE
  int nam_is_loaded() { return g_model ? 1 : 0; }

  // Pointer to the shared scratch buffer JS writes samples into / reads results from.
  EMSCRIPTEN_KEEPALIVE
  float* nam_get_buffer() { return g_scratch; }

  EMSCRIPTEN_KEEPALIVE
  int nam_buffer_capacity() { return 512; }

  // Processes numFrames samples in-place in the shared scratch buffer. No-op
  // (leaves the buffer untouched) if no model is loaded.
  EMSCRIPTEN_KEEPALIVE
  void nam_process(int numFrames)
  {
    if (!g_model)
      return;
    float* inCh[1] = { g_scratch };
    float* outCh[1] = { g_scratch };
    g_model->process(inCh, outCh, numFrames);
  }

  // Clears the model's internal history (ring buffers / conv state) without
  // unloading it -- call when the audio stream restarts/reopens.
  EMSCRIPTEN_KEEPALIVE
  void nam_reset()
  {
    if (g_model)
      g_model->Reset(g_sampleRate, 512);
  }
}
