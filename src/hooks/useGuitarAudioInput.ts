import { useAudioAnalyzer } from "./useAudioAnalyzer";
import { useNativeAudioAnalyzer } from "./useNativeAudioAnalyzer";

/**
 * Single entry point for guitar audio input. Transparently selects:
 *   • native low-latency capture (ASIO/WASAPI) when running inside Electron
 *     (the preload injects `window.nativeAudio`), or
 *   • the browser getUserMedia path on the web.
 *
 * Both underlying hooks are always called (React hook-order safety). Neither
 * touches the audio device until its `init()` is invoked, so the inactive path
 * stays completely idle — no double mic access.
 *
 * The returned object always satisfies the web analyzer's contract
 * ({ isListening, init, close, audioRefs, getLatencyMs, inputGain, setInputGain })
 * plus a stable `isNative` flag and `selectDevice` (undefined on the web path,
 * a no-op consumers can optional-chain past) so callers don't need their own
 * `window.nativeAudio` check to offer interface selection.
 */
export const useGuitarAudioInput = () => {
  const web = useAudioAnalyzer();
  const native = useNativeAudioAnalyzer();

  const isNative = typeof window !== "undefined" && !!window.nativeAudio;
  return isNative ? { ...native, isNative } : { ...web, isNative, selectDevice: undefined };
};
