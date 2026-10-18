# VST3 hosting (Tone Studio's VST mode)

Windows desktop only. Tone Studio has two worlds (`AmpParams.toneMode`): the
built-in chain (gate → overdrive → amp/NAM → cab → delay) or the player's own
**rack** of VST3 effects — Neural DSP Archetypes, iZotope, NAM… in any order —
which replaces that whole chain. Only Master (`level`, 2× so the knob's centre
is unity) and the safety limiter still apply after the rack.

## Pieces

| File | Process | Job |
| --- | --- | --- |
| `src/vsthost.cpp` → `bin/win32-x64/vsthost.node` | audio engine | Node-API addon: plugins in named slots, `process()` runs the whole chain (stereo) on the audio callback, editor windows + state on its own UI thread |
| `vstRack.js` | audio engine | The rack: order, bypass, lazy loading, per-slot settings, re-configure per stream; feeds `AmpChain.setInsert()` |
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

## Rebuilding the addon

The binary is committed (like `electron/nam/nam.wasm`), so release CI needs no
C++ toolchain. After editing `src/`:

```
npm i --no-save node-api-headers@1.9.0
electron\vst\build.bat
```

Needs MSVC (VS 2017+ with the C++ workload) and git. The script fetches the
Steinberg VST3 SDK (MIT licence since 3.8) into `third_party/` at a pinned
commit. If git fails with an SSL error on this machine, clone with
`git -c http.sslBackend=schannel`. Node-API means one build works across
Electron versions; it links against `node.exe` with a delay-load hook that
resolves to `electron.exe` at runtime. A running `electron .` from the repo
keeps the `.node` locked — rename it aside (Windows allows that for a loaded
DLL) before rebuilding.
