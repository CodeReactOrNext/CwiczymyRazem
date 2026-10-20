# VST3 hosting (Tone Studio's VST mode)

Desktop app on Windows (x64) and Apple Silicon Macs. Tone Studio has two worlds
(`AmpParams.toneMode`): the built-in chain (gate → overdrive → amp/NAM → cab →
delay) or the player's own **rack** of VST3 effects — Neural DSP Archetypes,
iZotope, NAM… in any order — which replaces that whole chain. Only Master
(`level`, 2× so the knob's centre is unity) and the safety limiter still apply
after the rack.

## Pieces

| File | Process | Job |
| --- | --- | --- |
| `src/vsthost.cpp` → `bin/<platform>-<arch>/vsthost.node` | audio engine (Windows) / main (macOS) | Node-API addon: plugins in named slots, `process()` runs the whole chain (stereo) on the audio callback, editor windows + state on its UI thread |
| `vstRack.js` | audio engine | The rack: order, bypass, lazy loading, per-slot settings, re-configure per stream; feeds `AmpChain.setInsert()` |
| `vstRemote.js` | audio engine + main (macOS only) | Stand-in addon for the rack, forwarding to the real one in the main process |
| `vstScanner.js` + `vstScanProcess.js` | main + throwaway utility processes | The library: scans only when the player asks, plus files/folders they add; reads plugins in isolation (unlicensed ones hang / crash / fail DllMain) |
| `vstStore.js` | both | `userData/vst-plugins.json` (library + the player's sources), `vst-rack.json` (the rack), `vst-states/<slot>.bin` (each slot's settings) |

Why the UI thread: JUCE-based plugins adopt the thread that creates them as
their message thread and post work to it through a hidden window. libuv's loop
does not pump Win32 messages, so everything except `process()` runs on a thread
the addon owns. `process()` only ever try-locks; when a load/restart holds the
chain, that block is silenced (never the raw DI at full level). The JS rack
also silences while a plugin that should be playing is still loading.

Signal: the guitar goes in mono (copied to both sides), each plugin gets stereo
in/out (a mono-input plugin gets L+R folded), and the rack's two sides land on
the interface's left/right outputs. The built-in chain stays mono.

Settings belong to a rack slot, not a plugin — the same EQ can sit in the rack
twice with two curves. Amp-sim plugins keep their own preset browser in their
window; Tone Studio presets are built-in-chain sounds and switch back to it.

## macOS: plugins in the main process

AppKit only works on a process's main thread, and JUCE plugins on macOS post
their messages to the main run loop whatever thread loaded them. In the audio
process the main thread *is* the JS thread that carries every audio block — a
plugin window drawing there would crackle. So on macOS:

- The real addon runs in the **Electron main process** (whose main thread runs
  NSApplication anyway). Its "UI thread" is that main thread (GCD main queue);
  plugin windows are ordinary windows of the app.
- `serveAudio()` starts a real-time thread there that runs the chain, plus a
  shared-memory block and a named semaphore (`/rq.vst.<pid>`).
- The audio process loads the same addon only to `connectAudio()` to it:
  its `process()` copies the block into shared memory, wakes that thread and
  spins/naps until it answers (a few µs on top of the plugins' own time). A
  block the chain thread can't take (a load holds the chain) is silence, as
  on Windows.
- `vstRack.js` doesn't know: `vstAddon.loadForRack()` hands it `vstRemote`'s
  stand-in, whose calls go to the main process over the engine's
  utilityProcess port (`audioEngineHost.js` serves them).

Trade-off: a plugin that crashes takes the whole app down on macOS (on
Windows only the audio engine). Scanning is still isolated on both.

## Rebuilding the addon

The binaries are committed (like `electron/nam/nam.wasm`), so release CI needs
no C++ toolchain. After editing `src/`, rebuild **both** — `vsthost.cpp` is
shared, with the platform parts behind `#ifdef`:

```
npm i --no-save node-api-headers@1.9.0
electron\vst\build.bat        # Windows → bin/win32-x64
electron/vst/build.sh         # macOS   → bin/darwin-arm64
```

Windows needs MSVC (VS 2017+ with the C++ workload) and git; macOS the Xcode
command line tools and git. Both scripts fetch the Steinberg VST3 SDK (MIT
licence since 3.8) into `third_party/` at the same pinned commit. If git fails
with an SSL error on Windows, clone with `git -c http.sslBackend=schannel`.
Node-API means one build works across Electron versions. On Windows it links
against `node.exe` with a delay-load hook that resolves to `electron.exe` at
runtime, and a running `electron .` from the repo keeps the `.node` locked —
rename it aside (Windows allows that for a loaded DLL) before rebuilding. On
macOS `vsthost.cpp` is compiled as Objective-C++ (ARC) and links with
`-undefined dynamic_lookup`; the result is ad-hoc signed (Apple Silicon loads
nothing unsigned) and re-signed with the app by electron-builder.
