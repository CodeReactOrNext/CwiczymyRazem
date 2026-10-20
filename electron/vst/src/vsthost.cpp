// vsthost.node — hosts a chain of VST3 effects inside the audio engine process.
//
// Threads:
//   * JS thread (the audio process's event loop, which is also where audify hands
//     us every hardware block): process() runs the whole chain here,
//     synchronously, on the Float32Arrays AmpChain hands over.
//   * UI thread (owned by this addon): a Win32 message loop. Plugins are loaded,
//     configured, saved and shown here. JUCE-based plugins (Neural DSP & co.)
//     adopt whichever thread instantiates them as their "message thread" and post
//     work to it through a hidden window, so that thread must pump messages —
//     libuv's loop does not, which is why nothing but process() touches a
//     plugin from the JS thread.
//
// The audio path never blocks on the UI thread: process() try-locks the chain
// and reports "not processed" while a load/reconfigure/state swap holds it, and
// the JS side plays silence for that block instead of the raw DI signal.
//
// macOS is laid out differently, because AppKit only works on a process's main
// thread (and JUCE plugins post to the main run loop, whatever thread loaded
// them). In the audio process the main thread IS the JS thread that carries
// every block, so a plugin window drawing there would crackle. So on macOS the
// plugins live in the Electron main process instead, where the main thread runs
// NSApplication: the "UI thread" is that main thread (tasks go through GCD's
// main queue), and the chain runs on a real-time thread of the addon's own.
// The audio process loads this same addon only as a client: process() copies
// each block into shared memory, wakes that thread and waits for the result
// (see `bridge` below; serveAudio() / connectAudio() set the two ends up).
//
// Every plugin lives in a named slot (the rack's slot id). Exports:
//   init(onEvent)                          start the UI thread; onEvent(type, payload)
//   getModulePaths() -> string[]           standard VST3 folders (no loading)
//   scanModule(path) -> ClassInfo[]        loads the module; use in a throwaway process
//   load({slot, path, uid, sampleRate, maxBlock, state?}) -> Promise<Info>
//   unload(slot) -> Promise<Buffer|null>   returns the state the plugin had
//   setChain([{slot, bypass}])             processing order; slots not listed don't run
//   configure(sampleRate, maxBlock) -> Promise<void>   every slot
//   getState(slot) -> Promise<Buffer|null>
//   setState(slot, Buffer) -> Promise<boolean>
//   openEditor(slot) / closeEditor(slot) -> Promise<boolean>
//   getInfo(slot) -> Info | null
//   process(left, n?, right?) -> boolean   mono guitar in `left`; stereo out in
//                                          left/right (folded to mono into `left`
//                                          when `right` is omitted). An empty
//                                          chain passes the signal through.
//   shutdown()
// macOS only:
//   serveAudio() -> string                 main process: start the chain thread +
//                                          shared memory; returns its name
//   connectAudio(name)                     audio process: process() now runs the
//                                          chain of the process that served `name`

#include <node_api.h>

#include "public.sdk/source/common/memorystream.h"
#include "public.sdk/source/vst/hosting/eventlist.h"
#include "public.sdk/source/vst/hosting/hostclasses.h"
#include "public.sdk/source/vst/hosting/module.h"
#include "public.sdk/source/vst/hosting/parameterchanges.h"
#include "public.sdk/source/vst/hosting/plugprovider.h"
#include "pluginterfaces/base/funknownimpl.h"
#include "pluginterfaces/gui/iplugview.h"
#include "pluginterfaces/gui/iplugviewcontentscalesupport.h"
#include "pluginterfaces/vst/ivstaudioprocessor.h"
#include "pluginterfaces/vst/ivsteditcontroller.h"
#include "pluginterfaces/vst/ivstprocesscontext.h"
#include "pluginterfaces/vst/vstspeaker.h"

#ifdef _WIN32
#include <windows.h>
#else
// This file is compiled as Objective-C++ (ARC) on macOS — see build.sh.
#import <Cocoa/Cocoa.h>
#include <dispatch/dispatch.h>
#include <fcntl.h>
#include <mach/mach.h>
#include <mach/mach_time.h>
#include <mach/thread_policy.h>
#include <pthread.h>
#include <semaphore.h>
#include <strings.h>
#include <sys/mman.h>
#include <time.h>
#include <unistd.h>
#endif
#if defined(_M_X64) || defined(__x86_64__)
#include <xmmintrin.h>
#endif

#include <algorithm>
#include <atomic>
#include <cerrno>
#include <chrono>
#include <cstdint>
#include <cstring>
#include <deque>
#include <functional>
#include <map>
#include <memory>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

#ifdef __APPLE__
@class RQEditorWindowDelegate;
#endif

using namespace Steinberg;
using namespace Steinberg::Vst;

namespace {

//------------------------------------------------------------------------
// N-API helpers
//------------------------------------------------------------------------

napi_value makeString (napi_env env, const std::string& s)
{
	napi_value v;
	napi_create_string_utf8 (env, s.c_str (), s.size (), &v);
	return v;
}

napi_value makeNumber (napi_env env, double d)
{
	napi_value v;
	napi_create_double (env, d, &v);
	return v;
}

napi_value makeBool (napi_env env, bool b)
{
	napi_value v;
	napi_get_boolean (env, b, &v);
	return v;
}

napi_value makeNull (napi_env env)
{
	napi_value v;
	napi_get_null (env, &v);
	return v;
}

napi_value makeUndefined (napi_env env)
{
	napi_value v;
	napi_get_undefined (env, &v);
	return v;
}

void setProp (napi_env env, napi_value obj, const char* key, napi_value value)
{
	napi_set_named_property (env, obj, key, value);
}

std::string getString (napi_env env, napi_value v)
{
	size_t len = 0;
	if (napi_get_value_string_utf8 (env, v, nullptr, 0, &len) != napi_ok)
		return {};
	std::string s (len, '\0');
	napi_get_value_string_utf8 (env, v, &s[0], len + 1, &len);
	return s;
}

bool getProp (napi_env env, napi_value obj, const char* key, napi_value& out)
{
	bool has = false;
	if (napi_has_named_property (env, obj, key, &has) != napi_ok || !has)
		return false;
	napi_get_named_property (env, obj, key, &out);
	napi_valuetype t;
	napi_typeof (env, out, &t);
	return t != napi_undefined && t != napi_null;
}

double getNumberProp (napi_env env, napi_value obj, const char* key, double fallback)
{
	napi_value v;
	double d = fallback;
	if (getProp (env, obj, key, v))
		napi_get_value_double (env, v, &d);
	return d;
}

bool getBoolProp (napi_env env, napi_value obj, const char* key, bool fallback)
{
	napi_value v;
	bool b = fallback;
	if (getProp (env, obj, key, v))
		napi_get_value_bool (env, v, &b);
	return b;
}

std::string getStringProp (napi_env env, napi_value obj, const char* key)
{
	napi_value v;
	return getProp (env, obj, key, v) ? getString (env, v) : std::string ();
}

bool getBytes (napi_env env, napi_value v, std::vector<char>& out)
{
	bool isBuffer = false;
	napi_is_buffer (env, v, &isBuffer);
	if (isBuffer)
	{
		void* data = nullptr;
		size_t len = 0;
		napi_get_buffer_info (env, v, &data, &len);
		out.assign ((char*)data, (char*)data + len);
		return true;
	}
	bool isTyped = false;
	napi_is_typedarray (env, v, &isTyped);
	if (isTyped)
	{
		napi_typedarray_type type;
		size_t length = 0, offset = 0;
		void* data = nullptr;
		napi_value ab;
		napi_get_typedarray_info (env, v, &type, &length, &data, &ab, &offset);
		if (type != napi_uint8_array && type != napi_int8_array)
			return false;
		out.assign ((char*)data, (char*)data + length);
		return true;
	}
	return false;
}

napi_value makeBuffer (napi_env env, const std::vector<char>& bytes)
{
	napi_value v;
	void* copy = nullptr;
	napi_create_buffer_copy (env, bytes.size (), bytes.data (), &copy, &v);
	return v;
}

napi_value throwError (napi_env env, const std::string& msg)
{
	napi_throw_error (env, nullptr, msg.c_str ());
	return nullptr;
}

/** Float32Array argument -> pointer + length (false if it isn't one). */
bool getFloats (napi_env env, napi_value v, float*& data, size_t& length)
{
	napi_typedarray_type type;
	size_t offset = 0;
	void* raw = nullptr;
	napi_value ab;
	if (napi_get_typedarray_info (env, v, &type, &length, &raw, &ab, &offset) != napi_ok ||
	    type != napi_float32_array)
		return false;
	data = static_cast<float*> (raw);
	return true;
}

//------------------------------------------------------------------------
// JS-thread dispatch: anything the UI thread needs to hand back (promise
// settlements, events) goes through one threadsafe function.
//------------------------------------------------------------------------

using JsTask = std::function<void (napi_env, napi_value onEvent)>;

napi_threadsafe_function gTsfn = nullptr;

void callJs (napi_env env, napi_value jsCb, void*, void* data)
{
	std::unique_ptr<JsTask> task (static_cast<JsTask*> (data));
	if (env && task)
		(*task) (env, jsCb);
}

void toJs (JsTask task)
{
	if (!gTsfn)
		return;
	auto* heap = new JsTask (std::move (task));
	if (napi_call_threadsafe_function (gTsfn, heap, napi_tsfn_nonblocking) != napi_ok)
		delete heap;
}

/** Plain data the UI thread can fill without touching napi. */
struct EventArgs
{
	std::string type;
	std::vector<std::pair<std::string, std::string>> strings;
	std::vector<std::pair<std::string, double>> numbers;
};

void emitEvent (EventArgs ev)
{
	toJs ([ev] (napi_env env, napi_value onEvent) {
		napi_value payload;
		napi_create_object (env, &payload);
		for (auto& s : ev.strings)
			setProp (env, payload, s.first.c_str (), makeString (env, s.second));
		for (auto& n : ev.numbers)
			setProp (env, payload, n.first.c_str (), makeNumber (env, n.second));
		napi_value args[2] = {makeString (env, ev.type), payload};
		napi_value global, result;
		napi_get_global (env, &global);
		napi_call_function (env, global, onEvent, 2, args, &result);
	});
}

//------------------------------------------------------------------------
// Plugin instance
//------------------------------------------------------------------------

class ComponentHandler : public U::ImplementsNonDestroyable<U::Directly<IComponentHandler>>
{
public:
	std::string slot;
	std::function<void (int32)> onRestart;

	tresult PLUGIN_API beginEdit (ParamID) override { return kResultOk; }
	tresult PLUGIN_API performEdit (ParamID id, ParamValue value) override
	{
		{
			std::lock_guard<std::mutex> lock (mutex);
			pending.push_back ({id, value});
		}
		if (!editedSinceNotify.exchange (true))
			emitEvent ({"edited", {{"slot", slot}}, {}});
		return kResultOk;
	}
	tresult PLUGIN_API endEdit (ParamID) override { return kResultOk; }
	tresult PLUGIN_API restartComponent (int32 flags) override
	{
		if (onRestart)
			onRestart (flags);
		return kResultOk;
	}

	/** Audio thread: never waits — edits that arrive mid-drain go next block. */
	void drainInto (ParameterChanges& changes)
	{
		std::unique_lock<std::mutex> lock (mutex, std::try_to_lock);
		if (!lock.owns_lock ())
			return;
		for (auto& p : pending)
		{
			int32 idx = 0;
			if (auto* q = changes.addParameterData (p.first, idx))
			{
				int32 pointIdx = 0;
				q->addPoint (0, p.second, pointIdx);
			}
		}
		pending.clear ();
	}

	std::atomic<bool> editedSinceNotify {false};

private:
	std::mutex mutex;
	std::vector<std::pair<ParamID, ParamValue>> pending;
};

struct Instance;

#ifdef _WIN32
class PlugFrame : public U::ImplementsNonDestroyable<U::Directly<IPlugFrame>>
{
public:
	HWND hwnd = nullptr;
	IPlugView* view = nullptr;
	bool resizing = false;

	tresult PLUGIN_API resizeView (IPlugView* v, ViewRect* r) override
	{
		if (!hwnd || !r || v != view)
			return kInvalidArgument;
		RECT rc {0, 0, r->getWidth (), r->getHeight ()};
		AdjustWindowRectEx (&rc, (DWORD)GetWindowLongW (hwnd, GWL_STYLE), FALSE,
		                    (DWORD)GetWindowLongW (hwnd, GWL_EXSTYLE));
		resizing = true;
		SetWindowPos (hwnd, nullptr, 0, 0, rc.right - rc.left, rc.bottom - rc.top,
		              SWP_NOMOVE | SWP_NOZORDER | SWP_NOACTIVATE);
		resizing = false;
		view->onSize (r);
		return kResultOk;
	}
};
#else
class PlugFrame : public U::ImplementsNonDestroyable<U::Directly<IPlugFrame>>
{
public:
	__unsafe_unretained NSWindow* window = nil; // the Instance owns it
	IPlugView* view = nullptr;
	bool resizing = false;

	/** Keeps the window's top-left corner where it is (AppKit's origin is the
	 *  bottom-left, so a plain setContentSize would move the title bar). */
	tresult PLUGIN_API resizeView (IPlugView* v, ViewRect* r) override
	{
		if (!window || !r || v != view)
			return kInvalidArgument;
		const NSRect old = window.frame;
		NSRect next = [window frameRectForContentRect:NSMakeRect (0, 0, r->getWidth (), r->getHeight ())];
		next.origin.x = old.origin.x;
		next.origin.y = NSMaxY (old) - next.size.height;
		resizing = true;
		[window setFrame:next display:YES];
		resizing = false;
		view->onSize (r);
		return kResultOk;
	}
};
#endif

struct Instance
{
	std::string slot;
	VST3::Hosting::Module::Ptr module;
	IPtr<PlugProvider> provider;
	IPtr<IComponent> component;
	IPtr<IAudioProcessor> processor;
	IPtr<IEditController> controller;
	ComponentHandler handler;

	std::string path, uid, name, vendor;
	int sampleRate = 48000;
	int maxBlock = 1024;
	uint32 latency = 0;
	int mainIn = 0, mainOut = 0;
	bool active = false;

	std::vector<std::vector<std::vector<float>>> inMem, outMem;
	std::vector<std::vector<float*>> inPtrs, outPtrs;
	std::vector<AudioBusBuffers> inBus, outBus;
	ProcessContext ctx {};
	ParameterChanges inChanges {64}, outChanges {64};
	EventList inEvents, outEvents;

	// Editor (UI thread only).
	IPtr<IPlugView> view;
	PlugFrame frame;
#ifdef _WIN32
	HWND hwnd = nullptr;
#else
	NSWindow* window = nil;
	RQEditorWindowDelegate* windowDelegate = nil;
#endif
};

bool editorIsOpen (const Instance& in)
{
#ifdef _WIN32
	return in.hwnd != nullptr;
#else
	return in.window != nil;
#endif
}

bool sameUid (const std::string& a, const std::string& b)
{
#ifdef _WIN32
	return _stricmp (a.c_str (), b.c_str ()) == 0;
#else
	return strcasecmp (a.c_str (), b.c_str ()) == 0;
#endif
}

/** Flush-to-zero + denormals-are-zero for the scope, as every DAW does. */
struct DenormalGuard
{
#if defined(_M_X64) || defined(__x86_64__)
	const unsigned int saved = _mm_getcsr ();
	DenormalGuard () { _mm_setcsr (saved | 0x8040); }
	~DenormalGuard () { _mm_setcsr (saved); }
#elif defined(__aarch64__)
	uint64_t saved = 0;
	DenormalGuard ()
	{
		asm volatile ("mrs %0, fpcr" : "=r"(saved));
		asm volatile ("msr fpcr, %0" ::"r"(saved | (1ull << 24))); // FZ
	}
	~DenormalGuard () { asm volatile ("msr fpcr, %0" ::"r"(saved)); }
#endif
};

// Every loaded slot (UI thread writes, under gChainMutex) and the processing
// order the audio thread walks (rebuilt under gChainMutex).
std::mutex gChainMutex;
std::map<std::string, std::shared_ptr<Instance>> gInstances;
struct ChainEntry
{
	std::string slot;
	bool bypass = false;
};
std::vector<ChainEntry> gChainOrder;
std::vector<std::shared_ptr<Instance>> gChain; // only active, non-bypassed, in order

/** Caller holds gChainMutex. */
void rebuildChain ()
{
	gChain.clear ();
	for (auto& e : gChainOrder)
	{
		if (e.bypass)
			continue;
		auto it = gInstances.find (e.slot);
		if (it != gInstances.end () && it->second->active)
			gChain.push_back (it->second);
	}
}

std::shared_ptr<Instance> findInstance (const std::string& slot)
{
	auto it = gInstances.find (slot);
	return it == gInstances.end () ? nullptr : it->second;
}

/** One plugin block of at most maxBlock samples, in place on L/R. A plugin with
 *  a mono input gets L+R folded; one with a mono output feeds both sides. */
bool processChunk (Instance& in, float* L, float* R, int32 count)
{
	if (in.mainIn == 1)
	{
		float* dst = in.inMem[0][0].data ();
		for (int32 i = 0; i < count; ++i)
			dst[i] = 0.5f * (L[i] + R[i]);
	}
	else if (in.mainIn >= 2)
	{
		memcpy (in.inMem[0][0].data (), L, count * sizeof (float));
		memcpy (in.inMem[0][1].data (), R, count * sizeof (float));
		for (int c = 2; c < in.mainIn; ++c)
			memset (in.inMem[0][c].data (), 0, count * sizeof (float));
	}
	in.inChanges.clearQueue ();
	in.outChanges.clearQueue ();
	in.inEvents.clear ();
	in.outEvents.clear ();
	in.handler.drainInto (in.inChanges);

	ProcessData pd;
	pd.processMode = kRealtime;
	pd.symbolicSampleSize = kSample32;
	pd.numSamples = count;
	pd.numInputs = (int32)in.inBus.size ();
	pd.numOutputs = (int32)in.outBus.size ();
	pd.inputs = in.inBus.empty () ? nullptr : in.inBus.data ();
	pd.outputs = in.outBus.data ();
	pd.inputParameterChanges = &in.inChanges;
	pd.outputParameterChanges = &in.outChanges;
	pd.inputEvents = &in.inEvents;
	pd.outputEvents = &in.outEvents;
	pd.processContext = &in.ctx;
	for (auto& b : in.inBus)
		b.silenceFlags = 0;

	const bool ok = in.processor->process (pd) == kResultOk;

	in.ctx.projectTimeSamples += count;
	in.ctx.projectTimeMusic = in.ctx.projectTimeSamples / (double)in.sampleRate * in.ctx.tempo / 60.0;

	const float* l = in.outMem[0][0].data ();
	const float* r = in.mainOut >= 2 ? in.outMem[0][1].data () : l;
	memcpy (L, l, count * sizeof (float));
	memcpy (R, r, count * sizeof (float));
	return ok;
}

/** Plugins finish initialising lazily inside their first process() calls —
 *  Archetype Petrucci's first block took 341 ms. Pay that here, on the UI
 *  thread, while the audio thread can't reach the instance (it plays silence
 *  instead of stalling the stream). Stops once blocks run well inside a
 *  128-frame budget, or after 1.5 s. */
void warmUp (Instance& in)
{
	using Clock = std::chrono::steady_clock;
	const auto msSince = [] (Clock::time_point t) {
		return std::chrono::duration<double, std::milli> (Clock::now () - t).count ();
	};
	const int32 block = std::min (in.maxBlock, 128);
	std::vector<float> l (block, 0.f), r (block, 0.f);
	const double budgetMs = block * 1000.0 / in.sampleRate;
	const auto start = Clock::now ();
	int fastInARow = 0;
	for (int i = 0; i < 400 && fastInARow < 8; ++i)
	{
		std::fill (l.begin (), l.end (), 0.f);
		std::fill (r.begin (), r.end (), 0.f);
		const auto t0 = Clock::now ();
		processChunk (in, l.data (), r.data (), block);
		const double ms = msSince (t0);
		fastInARow = ms < budgetMs * 0.5 ? fastInARow + 1 : 0;
		if (msSince (start) > 1500)
			break;
	}
}

/** Bus layout + buffers + activation. Caller holds gChainMutex if the instance
 *  is already visible to the audio thread. */
bool activate (Instance& in, std::string& err)
{
	ProcessSetup setup {kRealtime, kSample32, in.maxBlock, (SampleRate)in.sampleRate};
	if (in.processor->setupProcessing (setup) != kResultOk)
	{
		err = "setupProcessing failed";
		return false;
	}

	const int32 nIn = in.component->getBusCount (kAudio, kInput);
	const int32 nOut = in.component->getBusCount (kAudio, kOutput);
	std::vector<SpeakerArrangement> ins (nIn), outs (nOut);
	for (int32 i = 0; i < nIn; ++i)
		in.processor->getBusArrangement (kInput, i, ins[i]);
	for (int32 i = 0; i < nOut; ++i)
		in.processor->getBusArrangement (kOutput, i, outs[i]);
	// Stereo through the chain; a plugin that only takes mono gets L+R folded.
	if (nIn > 0 && nOut > 0)
	{
		auto wantIn = ins, wantOut = outs;
		wantIn[0] = SpeakerArr::kStereo;
		wantOut[0] = SpeakerArr::kStereo;
		if (in.processor->setBusArrangements (wantIn.data (), nIn, wantOut.data (), nOut) != kResultTrue)
		{
			wantIn[0] = SpeakerArr::kMono;
			in.processor->setBusArrangements (wantIn.data (), nIn, wantOut.data (), nOut);
		}
		for (int32 i = 0; i < nIn; ++i)
			in.processor->getBusArrangement (kInput, i, ins[i]);
		for (int32 i = 0; i < nOut; ++i)
			in.processor->getBusArrangement (kOutput, i, outs[i]);
	}

	// Every bus gets real memory — some plugins touch inactive aux buses anyway.
	auto alloc = [&] (BusDirection dir, int32 n, std::vector<SpeakerArrangement>& arr,
	                  std::vector<std::vector<std::vector<float>>>& mem,
	                  std::vector<std::vector<float*>>& ptrs, std::vector<AudioBusBuffers>& bus) {
		mem.assign (n, {});
		ptrs.assign (n, {});
		bus.assign (n, AudioBusBuffers ());
		for (int32 i = 0; i < n; ++i)
		{
			const int ch = SpeakerArr::getChannelCount (arr[i]);
			mem[i].assign (ch, std::vector<float> (in.maxBlock, 0.f));
			ptrs[i].resize (ch);
			for (int c = 0; c < ch; ++c)
				ptrs[i][c] = mem[i][c].data ();
			bus[i].numChannels = ch;
			bus[i].silenceFlags = 0;
			bus[i].channelBuffers32 = ch ? ptrs[i].data () : nullptr;
			in.component->activateBus (kAudio, dir, i, i == 0);
		}
	};
	alloc (kInput, nIn, ins, in.inMem, in.inPtrs, in.inBus);
	alloc (kOutput, nOut, outs, in.outMem, in.outPtrs, in.outBus);
	in.mainIn = nIn ? in.inBus[0].numChannels : 0;
	in.mainOut = nOut ? in.outBus[0].numChannels : 0;
	if (in.mainOut == 0)
	{
		err = "plugin has no audio output";
		return false;
	}

	if (in.component->setActive (true) != kResultOk)
	{
		err = "setActive failed";
		return false;
	}
	in.processor->setProcessing (true);
	in.latency = in.processor->getLatencySamples ();

	in.ctx = ProcessContext ();
	in.ctx.sampleRate = in.sampleRate;
	in.ctx.tempo = 120;
	in.ctx.timeSigNumerator = 4;
	in.ctx.timeSigDenominator = 4;
	in.ctx.state = ProcessContext::kPlaying | ProcessContext::kTempoValid | ProcessContext::kTimeSigValid |
	               ProcessContext::kProjectTimeMusicValid;
	in.active = true;
	warmUp (in);
	return true;
}

void deactivate (Instance& in)
{
	if (!in.active)
		return;
	in.processor->setProcessing (false);
	in.component->setActive (false);
	in.active = false;
}

// State blob: "RQV3" | u32 componentSize | component | u32 controllerSize | controller
bool readState (Instance& in, std::vector<char>& out)
{
	auto comp = owned (new MemoryStream);
	auto ctl = owned (new MemoryStream);
	if (in.component->getState (comp) != kResultOk)
		return false;
	const bool hasCtl = in.controller && in.controller->getState (ctl) == kResultOk;
	const uint32_t cs = (uint32_t)comp->getSize ();
	const uint32_t es = hasCtl ? (uint32_t)ctl->getSize () : 0;
	out.resize (12 + cs + es);
	memcpy (out.data (), "RQV3", 4);
	memcpy (out.data () + 4, &cs, 4);
	if (cs)
		memcpy (out.data () + 8, comp->getData (), cs);
	memcpy (out.data () + 8 + cs, &es, 4);
	if (es)
		memcpy (out.data () + 12 + cs, ctl->getData (), es);
	in.handler.editedSinceNotify = false;
	return true;
}

bool applyState (Instance& in, std::vector<char>& blob, std::string& err)
{
	if (blob.size () < 12 || memcmp (blob.data (), "RQV3", 4))
	{
		err = "not a riff.quest VST state";
		return false;
	}
	uint32_t cs = 0, es = 0;
	memcpy (&cs, blob.data () + 4, 4);
	if (12ull + cs > blob.size ())
	{
		err = "truncated state";
		return false;
	}
	memcpy (&es, blob.data () + 8 + cs, 4);
	if (12ull + cs + es > blob.size ())
	{
		err = "truncated state";
		return false;
	}
	auto comp = owned (new MemoryStream (blob.data () + 8, cs));
	if (in.component->setState (comp) != kResultOk)
	{
		err = "plugin rejected the saved state";
		return false;
	}
	if (in.controller)
	{
		comp->seek (0, IBStream::kIBSeekSet, nullptr);
		in.controller->setComponentState (comp);
		if (es)
		{
			auto ctl = owned (new MemoryStream (blob.data () + 12 + cs, es));
			in.controller->setState (ctl);
		}
	}
	return true;
}

//------------------------------------------------------------------------
// UI thread
//------------------------------------------------------------------------

HostApplication* gHostApp = nullptr;

#ifdef _WIN32
constexpr UINT WM_RQ_TASK = WM_APP + 1;
const wchar_t* kMsgWindowClass = L"RiffQuestVstHostMsg";
const wchar_t* kEditorWindowClass = L"RiffQuestVstEditor";

std::thread gUiThread;
HWND gMsgWindow = nullptr;
std::mutex gTaskMutex;
std::deque<std::function<void ()>> gTasks;

bool uiRunning () { return gMsgWindow != nullptr; }

void drainTasks ()
{
	for (;;)
	{
		std::function<void ()> task;
		{
			std::lock_guard<std::mutex> lock (gTaskMutex);
			if (gTasks.empty ())
				return;
			task = std::move (gTasks.front ());
			gTasks.pop_front ();
		}
		task ();
	}
}

/** Posted to a (message-only) window rather than the thread: thread messages
 *  are silently dropped while a modal loop runs (dragging a plugin window,
 *  a plugin's own dialog), window messages are not. */
void postToUi (std::function<void ()> task)
{
	{
		std::lock_guard<std::mutex> lock (gTaskMutex);
		gTasks.push_back (std::move (task));
	}
	PostMessageW (gMsgWindow, WM_RQ_TASK, 0, 0);
}

LRESULT CALLBACK msgWndProc (HWND hwnd, UINT msg, WPARAM wp, LPARAM lp)
{
	if (msg == WM_RQ_TASK)
	{
		drainTasks ();
		return 0;
	}
	return DefWindowProcW (hwnd, msg, wp, lp);
}

// ---- Editor windows ---------------------------------------------------

void closeEditorOnUi (Instance& in, bool notify)
{
	if (in.view)
	{
		in.view->setFrame (nullptr);
		in.view->removed ();
		in.view = nullptr;
	}
	in.frame.view = nullptr;
	in.frame.hwnd = nullptr;
	if (in.hwnd)
	{
		HWND h = in.hwnd;
		in.hwnd = nullptr;
		SetWindowLongPtrW (h, GWLP_USERDATA, 0);
		DestroyWindow (h);
	}
	if (notify)
		emitEvent ({"editor-closed", {{"slot", in.slot}}, {}});
}

LRESULT CALLBACK editorWndProc (HWND hwnd, UINT msg, WPARAM wp, LPARAM lp)
{
	auto* in = reinterpret_cast<Instance*> (GetWindowLongPtrW (hwnd, GWLP_USERDATA));
	switch (msg)
	{
		case WM_SIZE:
			if (in && in->frame.view && !in->frame.resizing)
			{
				ViewRect r {0, 0, LOWORD (lp), HIWORD (lp)};
				in->frame.view->onSize (&r);
			}
			return 0;
		case WM_DPICHANGED:
		{
			if (in && in->view)
				if (auto css = U::cast<IPlugViewContentScaleSupport> (in->view))
					css->setContentScaleFactor (HIWORD (wp) / 96.f);
			const RECT* suggested = reinterpret_cast<const RECT*> (lp);
			SetWindowPos (hwnd, nullptr, suggested->left, suggested->top, suggested->right - suggested->left,
			              suggested->bottom - suggested->top, SWP_NOZORDER | SWP_NOACTIVATE);
			return 0;
		}
		case WM_CLOSE:
			if (in)
				closeEditorOnUi (*in, true);
			else
				DestroyWindow (hwnd);
			return 0;
	}
	return DefWindowProcW (hwnd, msg, wp, lp);
}

std::wstring widen (const std::string& s)
{
	if (s.empty ())
		return {};
	const int n = MultiByteToWideChar (CP_UTF8, 0, s.c_str (), (int)s.size (), nullptr, 0);
	std::wstring w (n, L'\0');
	MultiByteToWideChar (CP_UTF8, 0, s.c_str (), (int)s.size (), &w[0], n);
	return w;
}

/** Our process didn't receive the click that asked for the window (the
 *  renderer did), so Windows won't let it take the foreground on its own. */
void bringToFront (HWND hwnd)
{
	HWND fg = GetForegroundWindow ();
	const DWORD fgThread = fg ? GetWindowThreadProcessId (fg, nullptr) : 0;
	const DWORD self = GetCurrentThreadId ();
	if (fgThread && fgThread != self)
		AttachThreadInput (fgThread, self, TRUE);
	ShowWindow (hwnd, IsIconic (hwnd) ? SW_RESTORE : SW_SHOW);
	SetForegroundWindow (hwnd);
	BringWindowToTop (hwnd);
	if (fgThread && fgThread != self)
		AttachThreadInput (fgThread, self, FALSE);
}

bool openEditorOnUi (Instance& in, std::string& err)
{
	if (in.hwnd)
	{
		bringToFront (in.hwnd);
		return true;
	}
	if (!in.controller)
	{
		err = "plugin has no editor";
		return false;
	}
	in.view = owned (in.controller->createView (ViewType::kEditor));
	if (!in.view)
	{
		err = "plugin has no editor";
		return false;
	}
	if (in.view->isPlatformTypeSupported (kPlatformTypeHWND) != kResultTrue)
	{
		in.view = nullptr;
		err = "plugin editor does not support Windows";
		return false;
	}
	ViewRect vr {};
	in.view->getSize (&vr);
	const bool resizable = in.view->canResize () == kResultTrue;
	const DWORD style = resizable ? WS_OVERLAPPEDWINDOW : (WS_OVERLAPPEDWINDOW & ~(WS_THICKFRAME | WS_MAXIMIZEBOX));
	RECT r {0, 0, std::max (vr.getWidth (), 200), std::max (vr.getHeight (), 100)};
	AdjustWindowRectEx (&r, style, FALSE, 0);
	const std::wstring title = widen (in.name + " \xC2\xB7 riff.quest");
	in.hwnd = CreateWindowExW (0, kEditorWindowClass, title.c_str (), style, CW_USEDEFAULT, CW_USEDEFAULT,
	                           r.right - r.left, r.bottom - r.top, nullptr, nullptr, GetModuleHandleW (nullptr),
	                           nullptr);
	if (!in.hwnd)
	{
		in.view = nullptr;
		err = "could not create the editor window";
		return false;
	}
	SetWindowLongPtrW (in.hwnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR> (&in));
	in.frame.hwnd = in.hwnd;
	in.frame.view = in.view;
	in.view->setFrame (&in.frame);
	if (auto css = U::cast<IPlugViewContentScaleSupport> (in.view))
		css->setContentScaleFactor (GetDpiForWindow (in.hwnd) / 96.f);
	if (in.view->attached (in.hwnd, kPlatformTypeHWND) != kResultTrue)
	{
		closeEditorOnUi (in, false);
		err = "plugin editor failed to attach";
		return false;
	}
	bringToFront (in.hwnd);
	return true;
}

#else // macOS: the "UI thread" is the main thread of the (Electron main) process

std::atomic<bool> gUiRunning {false};

bool uiRunning () { return gUiRunning.load (); }

/** GCD's main queue: FIFO like the Win32 task queue, and drained by the main
 *  run loop in every mode — also while a window is being dragged or a
 *  plugin's own modal dialog is up. */
void postToUi (std::function<void ()> task)
{
	auto* heap = new std::function<void ()> (std::move (task));
	dispatch_async_f (dispatch_get_main_queue (), heap, [] (void* p) {
		std::unique_ptr<std::function<void ()>> run (static_cast<std::function<void ()>*> (p));
		(*run) ();
	});
}

// ---- Editor windows ---------------------------------------------------

void closeEditorOnUi (Instance& in, bool notify);

} // namespace

/** A plugin window's close button / resizing -> the slot it shows. */
@interface RQEditorWindowDelegate : NSObject <NSWindowDelegate>
@property (nonatomic, assign) Instance* instance;
@end

@implementation RQEditorWindowDelegate

- (BOOL)windowShouldClose:(NSWindow*)sender
{
	// Close button / Cmd+W. Tear down on the next turn instead: releasing the
	// window (and this delegate) inside its own callback would free them while
	// AppKit is still in performClose: on them.
	if (Instance* in = self.instance)
	{
		const std::string slot = in->slot;
		postToUi ([slot] {
			if (auto inst = findInstance (slot))
				if (inst->window)
					closeEditorOnUi (*inst, true);
		});
	}
	return NO;
}

- (NSSize)windowWillResize:(NSWindow*)sender toSize:(NSSize)frameSize
{
	Instance* in = self.instance;
	if (!in || !in->frame.view)
		return frameSize;
	const NSRect content = [sender contentRectForFrameRect:NSMakeRect (0, 0, frameSize.width, frameSize.height)];
	ViewRect r {0, 0, (int32)content.size.width, (int32)content.size.height};
	if (in->frame.view->checkSizeConstraint (&r) != kResultTrue)
		return frameSize;
	return [sender frameRectForContentRect:NSMakeRect (0, 0, r.getWidth (), r.getHeight ())].size;
}

- (void)windowDidResize:(NSNotification*)notification
{
	Instance* in = self.instance;
	if (!in || !in->frame.view || in->frame.resizing || !in->window)
		return;
	const NSSize size = in->window.contentView.frame.size;
	ViewRect r {0, 0, (int32)size.width, (int32)size.height};
	in->frame.view->onSize (&r);
}

@end

namespace {

void closeEditorOnUi (Instance& in, bool notify)
{
	if (in.view)
	{
		in.view->setFrame (nullptr);
		in.view->removed ();
		in.view = nullptr;
	}
	in.frame.view = nullptr;
	in.frame.window = nil;
	if (in.window)
	{
		NSWindow* w = in.window;
		in.window = nil;
		w.delegate = nil;
		[w orderOut:nil];
		[w close];
	}
	in.windowDelegate.instance = nullptr;
	in.windowDelegate = nil;
	if (notify)
		emitEvent ({"editor-closed", {{"slot", in.slot}}, {}});
}

/** The click that asked for the window landed in the renderer, so the app may
 *  not be the active one (or the window sits behind the main one). */
void bringToFront (NSWindow* window)
{
	[NSApp activateIgnoringOtherApps:YES];
	if (window.miniaturized)
		[window deminiaturize:nil];
	[window makeKeyAndOrderFront:nil];
}

bool openEditorOnUi (Instance& in, std::string& err)
{
	if (in.window)
	{
		bringToFront (in.window);
		return true;
	}
	if (!in.controller)
	{
		err = "plugin has no editor";
		return false;
	}
	in.view = owned (in.controller->createView (ViewType::kEditor));
	if (!in.view)
	{
		err = "plugin has no editor";
		return false;
	}
	if (in.view->isPlatformTypeSupported (kPlatformTypeNSView) != kResultTrue)
	{
		in.view = nullptr;
		err = "plugin editor does not support macOS";
		return false;
	}
	ViewRect vr {};
	in.view->getSize (&vr);
	const bool resizable = in.view->canResize () == kResultTrue;
	NSWindowStyleMask style = NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskMiniaturizable;
	if (resizable)
		style |= NSWindowStyleMaskResizable;
	const NSRect content = NSMakeRect (0, 0, std::max (vr.getWidth (), 200), std::max (vr.getHeight (), 100));
	NSWindow* window = [[NSWindow alloc] initWithContentRect:content
	                                               styleMask:style
	                                                 backing:NSBackingStoreBuffered
	                                                   defer:NO];
	if (!window)
	{
		in.view = nullptr;
		err = "could not create the editor window";
		return false;
	}
	window.releasedWhenClosed = NO; // ARC owns it (in.window)
	window.title = [NSString stringWithUTF8String:(in.name + " \xC2\xB7 riff.quest").c_str ()] ?: @"riff.quest";
	[window center];
	in.window = window;
	in.windowDelegate = [RQEditorWindowDelegate new];
	in.windowDelegate.instance = &in;
	window.delegate = in.windowDelegate;
	in.frame.window = window;
	in.frame.view = in.view;
	in.view->setFrame (&in.frame);
	// No IPlugViewContentScaleSupport here: on macOS the view follows the
	// backing scale on its own (the VST3 spec says not to call it).
	if (in.view->attached ((__bridge void*)window.contentView, kPlatformTypeNSView) != kResultTrue)
	{
		closeEditorOnUi (in, false);
		err = "plugin editor failed to attach";
		return false;
	}
	bringToFront (window);
	return true;
}

#endif

// ---- Load / unload ----------------------------------------------------

void handleRestart (std::weak_ptr<Instance> weak, int32 flags);

std::shared_ptr<Instance> loadOnUi (const std::string& slot, const std::string& path, const std::string& uid,
                                    int sampleRate, int maxBlock, std::vector<char>* state, std::string& err)
{
	auto in = std::make_shared<Instance> ();
	in->slot = slot;
	in->handler.slot = slot;
	in->path = path;
	in->sampleRate = sampleRate;
	in->maxBlock = maxBlock;

	in->module = VST3::Hosting::Module::create (path, err);
	if (!in->module)
	{
		if (err.empty ())
			err = "could not load the plugin file";
		return nullptr;
	}
	auto factory = in->module->getFactory ();
	for (auto& ci : factory.classInfos ())
	{
		if (ci.category () != kVstAudioEffectClass)
			continue;
		if (!uid.empty () && !sameUid (ci.ID ().toString (), uid))
			continue;
		in->provider = owned (new PlugProvider (factory, ci, true));
		if (!in->provider->initialize ())
		{
			in->provider = nullptr;
			err = "plugin failed to initialise";
			continue;
		}
		in->uid = ci.ID ().toString ();
		in->name = ci.name ();
		in->vendor = ci.vendor ();
		break;
	}
	if (!in->provider)
	{
		if (err.empty ())
			err = "no matching effect in the plugin file";
		return nullptr;
	}
	in->component = in->provider->getComponentPtr ();
	in->controller = in->provider->getControllerPtr ();
	in->processor = U::cast<IAudioProcessor> (in->component);
	if (!in->processor || in->processor->canProcessSampleSize (kSample32) != kResultTrue)
	{
		err = "plugin cannot process 32-bit audio";
		return nullptr;
	}
	std::weak_ptr<Instance> weak = in;
	in->handler.onRestart = [weak] (int32 flags) { handleRestart (weak, flags); };
	if (in->controller)
		in->controller->setComponentHandler (&in->handler);

	if (state && !state->empty ())
	{
		std::string stateErr;
		if (!applyState (*in, *state, stateErr))
			emitEvent ({"warning",
			            {{"slot", slot}, {"message", "Saved plugin settings were not restored: " + stateErr}},
			            {}});
	}
	if (!activate (*in, err))
		return nullptr;
	return in;
}

void destroyOnUi (std::shared_ptr<Instance> in)
{
	if (!in)
		return;
	closeEditorOnUi (*in, false);
	deactivate (*in);
	if (in->controller)
		in->controller->setComponentHandler (nullptr);
	in->processor = nullptr;
	in->component = nullptr;
	in->controller = nullptr;
	in->provider = nullptr; // terminates + disconnects component/controller
	in->module = nullptr;   // FreeLibrary / CFBundle release
}

/** UI thread: unloads every slot. */
void destroyAll ()
{
	std::vector<std::shared_ptr<Instance>> all;
	{
		std::lock_guard<std::mutex> lock (gChainMutex);
		for (auto& e : gInstances)
			all.push_back (e.second);
		gInstances.clear ();
		gChainOrder.clear ();
		gChain.clear ();
	}
	for (auto& in : all)
		destroyOnUi (in);
}

/** Detaches a slot from the audio thread, returning its instance. */
std::shared_ptr<Instance> takeInstance (const std::string& slot)
{
	std::lock_guard<std::mutex> lock (gChainMutex);
	auto it = gInstances.find (slot);
	if (it == gInstances.end ())
		return nullptr;
	auto in = it->second;
	gInstances.erase (it);
	rebuildChain ();
	return in;
}

void handleRestart (std::weak_ptr<Instance> weak, int32 flags)
{
	// A plugin may call this from its own threads (even process()); the audio
	// thread holds gChainMutex there, so always defer to the UI thread.
	postToUi ([weak, flags] {
		auto in = weak.lock ();
		if (!in || findInstance (in->slot) != in)
			return;
		if (flags & (kReloadComponent | kIoChanged | kLatencyChanged))
		{
			std::string err;
			std::lock_guard<std::mutex> lock (gChainMutex);
			deactivate (*in);
			if (!activate (*in, err))
				emitEvent ({"error", {{"slot", in->slot}, {"message", "Plugin could not restart: " + err}}, {}});
			rebuildChain ();
		}
		emitEvent ({"restart", {{"slot", in->slot}}, {{"flags", (double)flags}, {"latency", (double)in->latency}}});
	});
}

#ifdef _WIN32
void uiThreadMain (HANDLE ready)
{
	OleInitialize (nullptr);
	// Electron is per-monitor-v2 DPI aware; keep plugin windows crisp the same way.
	using SetCtx = DPI_AWARENESS_CONTEXT (WINAPI*) (DPI_AWARENESS_CONTEXT);
	if (auto fn = (SetCtx)GetProcAddress (GetModuleHandleW (L"user32.dll"), "SetThreadDpiAwarenessContext"))
		fn (DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);

	WNDCLASSW mc {};
	mc.lpfnWndProc = msgWndProc;
	mc.hInstance = GetModuleHandleW (nullptr);
	mc.lpszClassName = kMsgWindowClass;
	RegisterClassW (&mc);
	WNDCLASSW ec {};
	ec.lpfnWndProc = editorWndProc;
	ec.hInstance = GetModuleHandleW (nullptr);
	ec.lpszClassName = kEditorWindowClass;
	ec.hCursor = LoadCursor (nullptr, IDC_ARROW);
	ec.hIcon = LoadIcon (GetModuleHandleW (nullptr), MAKEINTRESOURCE (1));
	RegisterClassW (&ec);
	gMsgWindow = CreateWindowExW (0, kMsgWindowClass, L"", 0, 0, 0, 0, 0, HWND_MESSAGE, nullptr,
	                              GetModuleHandleW (nullptr), nullptr);
	SetEvent (ready);

	MSG msg;
	while (GetMessageW (&msg, nullptr, 0, 0) > 0)
	{
		TranslateMessage (&msg);
		DispatchMessageW (&msg);
	}
	drainTasks ();
	DestroyWindow (gMsgWindow);
	gMsgWindow = nullptr;
	OleUninitialize ();
}
#endif

//------------------------------------------------------------------------
// Promise plumbing
//------------------------------------------------------------------------

/** JS thread only. The event channel is unref'd so an idle addon never keeps
 *  the process alive — but while a promise is outstanding it must, or Node
 *  could exit before the UI thread answers. */
int gPendingCalls = 0;

/** Runs `work` on the UI thread; `settle` builds the result on the JS thread
 *  (a non-empty error string rejects instead). */
template <typename Result>
napi_value runOnUi (napi_env env, std::function<Result (std::string& err)> work,
                    std::function<napi_value (napi_env, Result&)> settle)
{
	napi_deferred deferred;
	napi_value promise;
	napi_create_promise (env, &deferred, &promise);
	if (!uiRunning () || !gTsfn)
	{
		napi_value msg, error;
		napi_create_string_utf8 (env, "vsthost not initialised", NAPI_AUTO_LENGTH, &msg);
		napi_create_error (env, nullptr, msg, &error);
		napi_reject_deferred (env, deferred, error);
		return promise;
	}
	if (gPendingCalls++ == 0)
		napi_ref_threadsafe_function (env, gTsfn);
	postToUi ([work, settle, deferred] {
		auto err = std::make_shared<std::string> ();
		auto result = std::make_shared<Result> (work (*err));
		toJs ([result, err, settle, deferred] (napi_env env, napi_value) {
			if (--gPendingCalls == 0 && gTsfn)
				napi_unref_threadsafe_function (env, gTsfn);
			if (!err->empty ())
			{
				napi_value msg, error;
				napi_create_string_utf8 (env, err->c_str (), err->size (), &msg);
				napi_create_error (env, nullptr, msg, &error);
				napi_reject_deferred (env, deferred, error);
			}
			else
				napi_resolve_deferred (env, deferred, settle (env, *result));
		});
	});
	return promise;
}

struct InfoData
{
	bool loaded = false;
	std::string slot, name, vendor, uid, path;
	double latency = 0, sampleRate = 0, maxBlock = 0, inChannels = 0, outChannels = 0;
	bool editorOpen = false;
};

InfoData infoOf (const std::shared_ptr<Instance>& in)
{
	InfoData d;
	if (!in)
		return d;
	d.loaded = true;
	d.slot = in->slot;
	d.name = in->name;
	d.vendor = in->vendor;
	d.uid = in->uid;
	d.path = in->path;
	d.latency = in->latency;
	d.sampleRate = in->sampleRate;
	d.maxBlock = in->maxBlock;
	d.inChannels = in->mainIn;
	d.outChannels = in->mainOut;
	d.editorOpen = editorIsOpen (*in);
	return d;
}

napi_value infoToJs (napi_env env, const InfoData& d)
{
	if (!d.loaded)
		return makeNull (env);
	napi_value o;
	napi_create_object (env, &o);
	setProp (env, o, "slot", makeString (env, d.slot));
	setProp (env, o, "name", makeString (env, d.name));
	setProp (env, o, "vendor", makeString (env, d.vendor));
	setProp (env, o, "uid", makeString (env, d.uid));
	setProp (env, o, "path", makeString (env, d.path));
	setProp (env, o, "latencySamples", makeNumber (env, d.latency));
	setProp (env, o, "sampleRate", makeNumber (env, d.sampleRate));
	setProp (env, o, "maxBlock", makeNumber (env, d.maxBlock));
	setProp (env, o, "inChannels", makeNumber (env, d.inChannels));
	setProp (env, o, "outChannels", makeNumber (env, d.outChannels));
	setProp (env, o, "editorOpen", makeBool (env, d.editorOpen));
	return o;
}

std::string slotArg (napi_env env, napi_callback_info info, napi_value* rest = nullptr)
{
	size_t argc = 2;
	napi_value argv[2];
	napi_get_cb_info (env, info, &argc, argv, nullptr, nullptr);
	if (rest)
		*rest = argc > 1 ? argv[1] : nullptr;
	return argc > 0 ? getString (env, argv[0]) : std::string ();
}

//------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------

void envCleanup (void*);

napi_value Init (napi_env env, napi_callback_info info)
{
	size_t argc = 1;
	napi_value argv[1];
	napi_get_cb_info (env, info, &argc, argv, nullptr, nullptr);
	if (gTsfn)
		return makeUndefined (env);
	napi_valuetype t = napi_undefined;
	if (argc > 0)
		napi_typeof (env, argv[0], &t);
	if (t != napi_function)
		return throwError (env, "init(onEvent) needs a callback");

	napi_value name = makeString (env, "vsthost");
	if (napi_create_threadsafe_function (env, argv[0], nullptr, name, 0, 1, nullptr, nullptr, nullptr, callJs,
	                                     &gTsfn) != napi_ok)
		return throwError (env, "could not create the event channel");
	napi_unref_threadsafe_function (env, gTsfn); // never keeps the process alive on its own

	if (!gHostApp)
	{
		gHostApp = new HostApplication ();
		PluginContextFactory::instance ().setPluginContext (gHostApp);
	}

#ifdef _WIN32
	HANDLE ready = CreateEventW (nullptr, TRUE, FALSE, nullptr);
	gUiThread = std::thread (uiThreadMain, ready);
	WaitForSingleObject (ready, 5000);
	CloseHandle (ready);
#else
	// Tasks go to the main queue, which only a main thread running a Cocoa run
	// loop drains — i.e. the Electron main process, never the audio process.
	if (![NSThread isMainThread])
		return throwError (env, "init() must run on the main thread on macOS");
	gUiRunning = true;
#endif
	napi_add_env_cleanup_hook (env, envCleanup, nullptr);
	return makeUndefined (env);
}

napi_value GetModulePaths (napi_env env, napi_callback_info)
{
	const auto paths = VST3::Hosting::Module::getModulePaths ();
	napi_value arr;
	napi_create_array_with_length (env, paths.size (), &arr);
	for (size_t i = 0; i < paths.size (); ++i)
		napi_set_element (env, arr, (uint32_t)i, makeString (env, paths[i]));
	return arr;
}

napi_value ScanModule (napi_env env, napi_callback_info info)
{
	size_t argc = 1;
	napi_value argv[1];
	napi_get_cb_info (env, info, &argc, argv, nullptr, nullptr);
	if (argc < 1)
		return throwError (env, "scanModule(path)");
	const std::string path = getString (env, argv[0]);
	std::string err;
	auto mod = VST3::Hosting::Module::create (path, err);
	if (!mod)
		return throwError (env, err.empty () ? "could not load the plugin file" : err);
	napi_value arr;
	napi_create_array (env, &arr);
	uint32_t i = 0;
	for (auto& ci : mod->getFactory ().classInfos ())
	{
		napi_value o;
		napi_create_object (env, &o);
		setProp (env, o, "uid", makeString (env, ci.ID ().toString ()));
		setProp (env, o, "name", makeString (env, ci.name ()));
		setProp (env, o, "vendor", makeString (env, ci.vendor ()));
		setProp (env, o, "category", makeString (env, ci.category ()));
		setProp (env, o, "subCategories", makeString (env, ci.subCategoriesString ()));
		setProp (env, o, "version", makeString (env, ci.version ()));
		napi_set_element (env, arr, i++, o);
	}
	return arr;
}

napi_value Load (napi_env env, napi_callback_info info)
{
	size_t argc = 1;
	napi_value argv[1];
	napi_get_cb_info (env, info, &argc, argv, nullptr, nullptr);
	if (argc < 1)
		return throwError (env, "load({slot, path, uid, sampleRate, maxBlock, state})");
	const std::string slot = getStringProp (env, argv[0], "slot");
	const std::string path = getStringProp (env, argv[0], "path");
	const std::string uid = getStringProp (env, argv[0], "uid");
	const int sampleRate = (int)getNumberProp (env, argv[0], "sampleRate", 48000);
	const int maxBlock = std::max (32, (int)getNumberProp (env, argv[0], "maxBlock", 1024));
	auto state = std::make_shared<std::vector<char>> ();
	napi_value stateValue;
	if (getProp (env, argv[0], "state", stateValue))
		getBytes (env, stateValue, *state);
	if (slot.empty () || path.empty ())
		return throwError (env, "load: slot and path are required");

	return runOnUi<InfoData> (
	    env,
	    [=] (std::string& err) {
		    destroyOnUi (takeInstance (slot));
		    auto in = loadOnUi (slot, path, uid, sampleRate, maxBlock, state.get (), err);
		    if (!in)
			    return InfoData ();
		    {
			    std::lock_guard<std::mutex> lock (gChainMutex);
			    gInstances[slot] = in;
			    rebuildChain ();
		    }
		    return infoOf (in);
	    },
	    [] (napi_env env, InfoData& d) { return infoToJs (env, d); });
}

napi_value Unload (napi_env env, napi_callback_info info)
{
	const std::string slot = slotArg (env, info);
	using Bytes = std::vector<char>;
	auto got = std::make_shared<bool> (false);
	return runOnUi<Bytes> (
	    env,
	    [slot, got] (std::string&) {
		    Bytes state;
		    auto in = takeInstance (slot);
		    if (in && readState (*in, state))
			    *got = true;
		    destroyOnUi (in);
		    return state;
	    },
	    [got] (napi_env env, Bytes& state) { return *got ? makeBuffer (env, state) : makeNull (env); });
}

/** Synchronous: just reorders pointers under the lock. */
napi_value SetChain (napi_env env, napi_callback_info info)
{
	size_t argc = 1;
	napi_value argv[1];
	napi_get_cb_info (env, info, &argc, argv, nullptr, nullptr);
	bool isArray = false;
	if (argc < 1 || napi_is_array (env, argv[0], &isArray) != napi_ok || !isArray)
		return throwError (env, "setChain([{slot, bypass}])");
	uint32_t len = 0;
	napi_get_array_length (env, argv[0], &len);
	std::vector<ChainEntry> order;
	for (uint32_t i = 0; i < len; ++i)
	{
		napi_value item;
		napi_get_element (env, argv[0], i, &item);
		ChainEntry e;
		e.slot = getStringProp (env, item, "slot");
		e.bypass = getBoolProp (env, item, "bypass", false);
		if (!e.slot.empty ())
			order.push_back (e);
	}
	std::lock_guard<std::mutex> lock (gChainMutex);
	gChainOrder = std::move (order);
	rebuildChain ();
	return makeUndefined (env);
}

napi_value Configure (napi_env env, napi_callback_info info)
{
	size_t argc = 2;
	napi_value argv[2];
	napi_get_cb_info (env, info, &argc, argv, nullptr, nullptr);
	double sr = 48000, mb = 1024;
	if (argc > 0)
		napi_get_value_double (env, argv[0], &sr);
	if (argc > 1)
		napi_get_value_double (env, argv[1], &mb);
	const int sampleRate = (int)sr;
	const int maxBlock = std::max (32, (int)mb);
	return runOnUi<bool> (
	    env,
	    [=] (std::string& err) {
		    std::lock_guard<std::mutex> lock (gChainMutex);
		    for (auto& entry : gInstances)
		    {
			    Instance& in = *entry.second;
			    if (in.sampleRate == sampleRate && in.maxBlock >= maxBlock && in.active)
				    continue;
			    deactivate (in);
			    in.sampleRate = sampleRate;
			    in.maxBlock = std::max (in.maxBlock, maxBlock);
			    std::string slotErr;
			    if (!activate (in, slotErr))
				    err = in.name + ": " + slotErr;
		    }
		    rebuildChain ();
		    return true;
	    },
	    [] (napi_env env, bool& ok) { return makeBool (env, ok); });
}

napi_value GetState (napi_env env, napi_callback_info info)
{
	const std::string slot = slotArg (env, info);
	using Bytes = std::vector<char>;
	auto got = std::make_shared<bool> (false);
	return runOnUi<Bytes> (
	    env,
	    [slot, got] (std::string&) {
		    Bytes state;
		    if (auto in = findInstance (slot))
			    *got = readState (*in, state);
		    return state;
	    },
	    [got] (napi_env env, Bytes& state) { return *got ? makeBuffer (env, state) : makeNull (env); });
}

napi_value SetState (napi_env env, napi_callback_info info)
{
	napi_value blobValue = nullptr;
	const std::string slot = slotArg (env, info, &blobValue);
	auto blob = std::make_shared<std::vector<char>> ();
	if (!blobValue || !getBytes (env, blobValue, *blob))
		return throwError (env, "setState(slot, buffer)");
	return runOnUi<bool> (
	    env,
	    [slot, blob] (std::string& err) {
		    auto in = findInstance (slot);
		    if (!in)
		    {
			    err = "no plugin in that slot";
			    return false;
		    }
		    std::lock_guard<std::mutex> lock (gChainMutex);
		    return applyState (*in, *blob, err);
	    },
	    [] (napi_env env, bool& ok) { return makeBool (env, ok); });
}

napi_value OpenEditor (napi_env env, napi_callback_info info)
{
	const std::string slot = slotArg (env, info);
	return runOnUi<bool> (
	    env,
	    [slot] (std::string& err) {
		    auto in = findInstance (slot);
		    if (!in)
		    {
			    err = "no plugin in that slot";
			    return false;
		    }
		    return openEditorOnUi (*in, err);
	    },
	    [] (napi_env env, bool& ok) { return makeBool (env, ok); });
}

napi_value CloseEditor (napi_env env, napi_callback_info info)
{
	const std::string slot = slotArg (env, info);
	return runOnUi<bool> (
	    env,
	    [slot] (std::string&) {
		    auto in = findInstance (slot);
		    const bool wasOpen = in && editorIsOpen (*in);
		    if (wasOpen)
			    closeEditorOnUi (*in, true);
		    return wasOpen;
	    },
	    [] (napi_env env, bool& ok) { return makeBool (env, ok); });
}

napi_value GetInfo (napi_env env, napi_callback_info info)
{
	const std::string slot = slotArg (env, info);
	std::shared_ptr<Instance> in;
	{
		std::lock_guard<std::mutex> lock (gChainMutex);
		in = findInstance (slot);
	}
	return infoToJs (env, infoOf (in));
}

/** The whole chain, in place: mono guitar in `left` (copied to `right` first —
 *  the same on both sides going in), stereo out in left/right. Caller holds
 *  gChainMutex. */
bool runChain (float* left, float* right, size_t n)
{
	memcpy (right, left, n * sizeof (float));
	DenormalGuard guard;
	bool ok = true;
	for (auto& inst : gChain)
	{
		Instance& in = *inst;
		for (size_t pos = 0; pos < n; pos += (size_t)in.maxBlock)
		{
			const int32 count = (int32)std::min ((size_t)in.maxBlock, n - pos);
			if (!processChunk (in, left + pos, right + pos, count))
				ok = false;
		}
	}
	return ok;
}

#ifdef __APPLE__
//------------------------------------------------------------------------
// macOS audio bridge: the audio process's process() -> the chain thread of
// the main process, one block at a time.
//
// One shared buffer, owned by whoever's turn it is: the client may write it
// only while response == request (the server is idle), bumps `request` and
// posts the semaphore; the server runs the chain on it and sets
// response = request. A client that gives up on a slow block (silence) leaves
// the buffer to the server until it catches up — those blocks are silent
// too, rather than racing it.
//------------------------------------------------------------------------
namespace bridge {

constexpr uint32_t kMaxFrames = 4096;

struct Shared
{
	std::atomic<uint32_t> request;
	std::atomic<uint32_t> response;
	std::atomic<uint32_t> ok;
	uint32_t frames;
	float left[kMaxFrames];
	float right[kMaxFrames];
};
static_assert (std::atomic<uint32_t>::is_always_lock_free, "shared-memory atomics must be lock-free");

/** Names live in one global namespace, 31 chars max. */
std::string shmName (pid_t pid) { return "/rq.vst." + std::to_string (pid); }
std::string semName (const std::string& shm) { return shm + ".go"; }

Shared* mapShared (int fd)
{
	void* p = mmap (nullptr, sizeof (Shared), PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
	return p == MAP_FAILED ? nullptr : static_cast<Shared*> (p);
}

// ---- Server (main process) --------------------------------------------

Shared* gServed = nullptr;
sem_t* gServedWake = SEM_FAILED;
std::string gServedName;
std::thread gServeThread;
std::atomic<bool> gServeStop {false};

/** Mach real-time band, like a DAW's audio threads: not demoted behind the
 *  browser's work, and kept on the performance cores. */
void makeRealtime ()
{
	mach_timebase_info_data_t tb;
	mach_timebase_info (&tb);
	const auto abs = [&] (double ms) { return (uint32_t)(ms * 1e6 * tb.denom / tb.numer); };
	thread_time_constraint_policy_data_t policy;
	policy.period = 0;
	policy.computation = abs (1.0);
	policy.constraint = abs (3.0);
	policy.preemptible = TRUE;
	thread_policy_set (pthread_mach_thread_np (pthread_self ()), THREAD_TIME_CONSTRAINT_POLICY,
	                   (thread_policy_t)&policy, THREAD_TIME_CONSTRAINT_POLICY_COUNT);
}

void serveMain ()
{
	pthread_setname_np ("riff.quest VST chain");
	makeRealtime ();
	Shared& s = *gServed;
	for (;;)
	{
		if (sem_wait (gServedWake) != 0)
		{
			if (errno == EINTR)
				continue;
			return;
		}
		if (gServeStop)
			return;
		const uint32_t req = s.request.load (std::memory_order_acquire);
		if (req == s.response.load (std::memory_order_relaxed))
			continue;
		const uint32_t n = std::min (s.frames, kMaxFrames);
		bool ok = false;
		{
			std::unique_lock<std::mutex> lock (gChainMutex, std::try_to_lock);
			if (lock.owns_lock ())
				ok = runChain (s.left, s.right, n);
		}
		s.ok.store (ok ? 1 : 0, std::memory_order_relaxed);
		s.response.store (req, std::memory_order_release);
	}
}

void closeServed ()
{
	if (gServed)
		munmap (gServed, sizeof (Shared));
	gServed = nullptr;
	if (gServedWake != SEM_FAILED)
		sem_close (gServedWake);
	gServedWake = SEM_FAILED;
	if (!gServedName.empty ())
	{
		shm_unlink (gServedName.c_str ());
		sem_unlink (semName (gServedName).c_str ());
	}
	gServedName.clear ();
}

/** Idempotent: a respawned audio process connects to the same one. */
std::string serve (std::string& err)
{
	if (!gServedName.empty ())
		return gServedName;
	const std::string name = shmName (getpid ());
	shm_unlink (name.c_str ()); // left over by a crashed run with a recycled pid
	sem_unlink (semName (name).c_str ());
	const int fd = shm_open (name.c_str (), O_CREAT | O_EXCL | O_RDWR, 0600);
	if (fd < 0)
	{
		err = std::string ("shm_open: ") + strerror (errno);
		return {};
	}
	gServedName = name;
	if (ftruncate (fd, sizeof (Shared)) != 0 || !(gServed = mapShared (fd)))
	{
		err = std::string ("shared memory: ") + strerror (errno);
		close (fd);
		closeServed ();
		return {};
	}
	close (fd);
	gServedWake = sem_open (semName (name).c_str (), O_CREAT | O_EXCL, 0600, 0);
	if (gServedWake == SEM_FAILED)
	{
		err = std::string ("sem_open: ") + strerror (errno);
		closeServed ();
		return {};
	}
	gServeStop = false;
	gServeThread = std::thread (serveMain);
	return gServedName;
}

void stopServing ()
{
	if (!gServeThread.joinable ())
		return;
	gServeStop = true;
	sem_post (gServedWake);
	gServeThread.join ();
	closeServed ();
}

// ---- Client (audio process) -------------------------------------------

Shared* gPeer = nullptr;
sem_t* gPeerWake = SEM_FAILED;
std::string gPeerName;

bool connected () { return gPeer != nullptr; }

void disconnect ()
{
	if (gPeer)
		munmap (gPeer, sizeof (Shared));
	gPeer = nullptr;
	if (gPeerWake != SEM_FAILED)
		sem_close (gPeerWake);
	gPeerWake = SEM_FAILED;
	gPeerName.clear ();
}

bool connect (const std::string& name, std::string& err)
{
	if (gPeer && name == gPeerName)
		return true;
	disconnect ();
	const int fd = shm_open (name.c_str (), O_RDWR, 0600);
	if (fd < 0)
	{
		err = std::string ("shm_open: ") + strerror (errno);
		return false;
	}
	Shared* shared = mapShared (fd);
	close (fd);
	if (!shared)
	{
		err = std::string ("mmap: ") + strerror (errno);
		return false;
	}
	sem_t* wake = sem_open (semName (name).c_str (), 0);
	if (wake == SEM_FAILED)
	{
		err = std::string ("sem_open: ") + strerror (errno);
		munmap (shared, sizeof (Shared));
		return false;
	}
	gPeer = shared;
	gPeerWake = wake;
	gPeerName = name;
	return true;
}

inline void cpuRelax ()
{
#if defined(__aarch64__)
	__builtin_arm_yield ();
#else
	_mm_pause ();
#endif
}

/** Spins briefly (the usual answer is a fraction of a block away), then naps.
 *  Gives up only on a server that stopped answering altogether. */
bool waitFor (Shared& s, uint32_t req)
{
	using Clock = std::chrono::steady_clock;
	const auto start = Clock::now ();
	const auto spinUntil = start + std::chrono::microseconds (300);
	const auto giveUpAt = start + std::chrono::milliseconds (20);
	for (;;)
	{
		if (s.response.load (std::memory_order_acquire) == req)
			return true;
		const auto now = Clock::now ();
		if (now >= giveUpAt)
			return false;
		if (now < spinUntil)
			cpuRelax ();
		else
		{
			timespec nap {0, 20000};
			nanosleep (&nap, nullptr);
		}
	}
}

/** Same contract as runChain(), across the process boundary. */
bool process (float* left, float* right, size_t n)
{
	Shared& s = *gPeer;
	for (size_t pos = 0; pos < n; pos += kMaxFrames)
	{
		const uint32_t count = (uint32_t)std::min<size_t> (kMaxFrames, n - pos);
		const uint32_t prev = s.request.load (std::memory_order_relaxed);
		if (s.response.load (std::memory_order_acquire) != prev)
			return false; // still on a block we gave up on
		memcpy (s.left, left + pos, count * sizeof (float));
		s.frames = count;
		s.request.store (prev + 1, std::memory_order_release);
		sem_post (gPeerWake);
		if (!waitFor (s, prev + 1) || !s.ok.load (std::memory_order_relaxed))
			return false;
		memcpy (left + pos, s.left, count * sizeof (float));
		memcpy (right + pos, s.right, count * sizeof (float));
	}
	return true;
}

} // namespace bridge
#endif

/** process(left, n = left.length, right?) -> boolean. */
napi_value Process (napi_env env, napi_callback_info info)
{
	size_t argc = 3;
	napi_value argv[3];
	napi_get_cb_info (env, info, &argc, argv, nullptr, nullptr);
	float* left = nullptr;
	size_t length = 0;
	if (argc < 1 || !getFloats (env, argv[0], left, length))
		return throwError (env, "process: Float32Array expected");
	size_t n = length;
	if (argc > 1)
	{
		double d = 0;
		if (napi_get_value_double (env, argv[1], &d) == napi_ok && d >= 0)
			n = std::min (length, (size_t)d);
	}
	float* right = nullptr;
	if (argc > 2)
	{
		napi_valuetype t;
		napi_typeof (env, argv[2], &t);
		if (t != napi_undefined && t != napi_null)
		{
			size_t rlength = 0;
			if (!getFloats (env, argv[2], right, rlength))
				return throwError (env, "process: right channel must be a Float32Array");
			n = std::min (n, rlength);
		}
	}

	// Mono callers get a scratch right channel, folded back at the end.
	static std::vector<float> scratch;
	const bool fold = right == nullptr;
	if (fold)
	{
		if (scratch.size () < n)
			scratch.resize (n);
		right = scratch.data ();
	}

	bool ok = false;
#ifdef __APPLE__
	if (bridge::connected ())
		ok = bridge::process (left, right, n);
	else
#endif
	{
		std::unique_lock<std::mutex> lock (gChainMutex, std::try_to_lock);
		if (!lock.owns_lock ())
			return makeBool (env, false);
		ok = runChain (left, right, n);
	}
	if (!ok)
		return makeBool (env, false); // the JS side plays silence for this block

	if (fold)
		for (size_t i = 0; i < n; ++i)
			left[i] = 0.5f * (left[i] + right[i]);
	return makeBool (env, true);
}

#ifdef __APPLE__
napi_value ServeAudio (napi_env env, napi_callback_info)
{
	std::string err;
	const std::string name = bridge::serve (err);
	if (name.empty ())
		return throwError (env, "could not start the plugin audio thread: " + err);
	return makeString (env, name);
}

napi_value ConnectAudio (napi_env env, napi_callback_info info)
{
	size_t argc = 1;
	napi_value argv[1];
	napi_get_cb_info (env, info, &argc, argv, nullptr, nullptr);
	if (argc < 1)
		return throwError (env, "connectAudio(name)");
	std::string err;
	if (!bridge::connect (getString (env, argv[0]), err))
		return throwError (env, "could not reach the plugin host: " + err);
	return makeUndefined (env);
}
#endif

/** Unloads every plugin and ends the UI thread. Safe to call more than once. */
void stopUiThread ()
{
#ifdef _WIN32
	if (!gUiThread.joinable ())
		return;
	postToUi ([] {
		destroyAll ();
		PostQuitMessage (0);
	});
	gUiThread.join ();
#else
	bridge::stopServing ();
	if (!gUiRunning.exchange (false))
		return;
	if ([NSThread isMainThread])
		destroyAll ();
	else
		dispatch_sync (dispatch_get_main_queue (), ^{
		  destroyAll ();
		});
#endif
}

napi_value Shutdown (napi_env env, napi_callback_info)
{
	stopUiThread ();
	if (gTsfn)
	{
		napi_release_threadsafe_function (gTsfn, napi_tsfn_release);
		gTsfn = nullptr;
	}
	return makeUndefined (env);
}

/** Process exit without shutdown(): a still-joinable std::thread at static
 *  destruction would call std::terminate. */
void envCleanup (void*)
{
	stopUiThread ();
#ifdef __APPLE__
	bridge::disconnect ();
#endif
	gTsfn = nullptr; // Node tears the threadsafe function down itself here
}

napi_value ModuleInit (napi_env env, napi_value exports)
{
	napi_property_descriptor props[] = {
	    {"init", nullptr, Init, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"getModulePaths", nullptr, GetModulePaths, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"scanModule", nullptr, ScanModule, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"load", nullptr, Load, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"unload", nullptr, Unload, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"setChain", nullptr, SetChain, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"configure", nullptr, Configure, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"getState", nullptr, GetState, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"setState", nullptr, SetState, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"openEditor", nullptr, OpenEditor, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"closeEditor", nullptr, CloseEditor, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"getInfo", nullptr, GetInfo, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"process", nullptr, Process, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"shutdown", nullptr, Shutdown, nullptr, nullptr, nullptr, napi_default, nullptr},
#ifdef __APPLE__
	    {"serveAudio", nullptr, ServeAudio, nullptr, nullptr, nullptr, napi_default, nullptr},
	    {"connectAudio", nullptr, ConnectAudio, nullptr, nullptr, nullptr, napi_default, nullptr},
#endif
	};
	napi_define_properties (env, exports, sizeof (props) / sizeof (props[0]), props);
	return exports;
}

} // namespace

NAPI_MODULE (NODE_GYP_MODULE_NAME, ModuleInit)
