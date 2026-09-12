import { cn } from "assets/lib/utils";
import { AudioSelect } from "feature/toneStudio/components/AudioSelect";
import { plateButtonClass } from "feature/toneStudio/components/PluginChrome";
import { RefreshCw } from "lucide-react";
import type { NativeAudioDevice } from "types/nativeAudio";

const BUFFER_SIZES = [64, 128, 256, 512, 1024, 2048];
/** Sentinel for "no explicit output device" — Radix selects cannot hold "". */
const ENGINE_PICKED_OUTPUT = "engine-picked";

interface AudioSettingsPanelProps {
  api: string | null;
  devices: NativeAudioDevice[];
  outputDevices: NativeAudioDevice[];
  selectedId: number | null;
  selectedOutputId: number | null;
  selectedChannel: number;
  selectedOutputChannel: number;
  loading: boolean;
  bufferSize: number;
  sampleRate: number;
  onRefresh: () => void;
  onSelectDevice: (id: number) => void;
  onSelectOutputDevice: (id: number | null) => void;
  onSelectChannel: (channel: number) => void;
  onSelectOutputChannel: (channel: number) => void;
  onBufferSizeChange: (size: number) => void;
}

/**
 * The I/O sheet — every plugin hides this behind a gear, because you set it
 * once per rig and never touch it again while playing. Kept out of the signal
 * chain entirely so the window below stays about tone.
 */
export const AudioSettingsPanel = ({
  api,
  devices,
  outputDevices,
  selectedId,
  selectedOutputId,
  selectedChannel,
  selectedOutputChannel,
  loading,
  bufferSize,
  sampleRate,
  onRefresh,
  onSelectDevice,
  onSelectOutputDevice,
  onSelectChannel,
  onSelectOutputChannel,
  onBufferSizeChange,
}: AudioSettingsPanelProps) => {
  // ASIO is a single-device driver — the engine always routes output to the same
  // device as input on ASIO (see nativeAudioEngine.js), so output selection only
  // has an effect on WASAPI/other APIs.
  const isAsio = /asio/i.test(api || "");
  const selectedInputDevice = devices.find((d) => d.id === selectedId);
  // On ASIO the engine always routes output through the input device, so that's
  // whose channel count governs the output channel picker too.
  const outputChannelCount = isAsio
    ? selectedInputDevice?.outputChannels || 0
    : (outputDevices.find((d) => d.id === selectedOutputId) ?? outputDevices[0])
        ?.outputChannels || 0;

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-zinc-900/50 p-5'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-zinc-200'>
          Audio interface
        </span>
        <button
          type='button'
          onClick={onRefresh}
          title='Refresh device list'
          className={cn(plateButtonClass(), "px-2.5 py-1.5 text-xs")}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className='flex flex-col gap-4 sm:flex-row sm:items-start'>
        <AudioSelect
          className='flex-1'
          label={`Input${api ? ` (${api})` : ""}`}
          value={selectedId !== null ? String(selectedId) : ""}
          onValueChange={(v) => onSelectDevice(Number(v))}
          placeholder={
            devices.length ? "Select an input" : "No input devices found"
          }
          options={devices.map((d) => ({
            value: String(d.id),
            label: d.name,
            hint: `${d.inputChannels} in${d.isDefaultInput ? " · default" : ""}`,
          }))}
        />
        {(selectedInputDevice?.inputChannels || 0) > 1 && (
          <AudioSelect
            className='sm:w-28'
            label='Channel'
            title='Which input channel to capture from — e.g. the guitar jack on a multi-channel interface'
            value={String(selectedChannel)}
            onValueChange={(v) => onSelectChannel(Number(v))}
            options={Array.from(
              { length: selectedInputDevice?.inputChannels || 0 },
              (_, i) => ({ value: String(i), label: String(i + 1) }),
            )}
          />
        )}
      </div>

      <div className='flex flex-col gap-4 sm:flex-row sm:items-start'>
        <AudioSelect
          className='flex-1'
          label='Output'
          disabled={isAsio}
          title={
            isAsio
              ? "ASIO uses the same device for input and output"
              : "Output device for amp monitoring"
          }
          value={
            selectedOutputId !== null
              ? String(selectedOutputId)
              : ENGINE_PICKED_OUTPUT
          }
          onValueChange={(v) =>
            onSelectOutputDevice(v === ENGINE_PICKED_OUTPUT ? null : Number(v))
          }
          options={[
            {
              value: ENGINE_PICKED_OUTPUT,
              label: isAsio ? "Same as input (ASIO)" : "System default output",
            },
            ...outputDevices.map((d) => ({
              value: String(d.id),
              label: d.name,
              hint: `${d.outputChannels} out${d.isDefaultOutput ? " · default" : ""}`,
            })),
          ]}
        />
        {outputChannelCount > 1 && (
          <AudioSelect
            className='sm:w-28'
            label='Channel'
            title='First output channel to monitor through — e.g. outputs 3/4 instead of 1/2 on a multi-channel interface'
            value={String(selectedOutputChannel)}
            onValueChange={(v) => onSelectOutputChannel(Number(v))}
            options={Array.from({ length: outputChannelCount }, (_, i) => ({
              value: String(i),
              label: String(i + 1),
            }))}
          />
        )}
      </div>

      <AudioSelect
        className='sm:w-64'
        label='Buffer'
        title='ASIO/WASAPI buffer size — smaller = lower latency but more prone to crackling'
        hint='Smaller buffers cut latency; too small and the audio starts crackling.'
        value={String(bufferSize)}
        onValueChange={(v) => onBufferSizeChange(Number(v))}
        options={BUFFER_SIZES.map((size) => ({
          value: String(size),
          label: `${size} smp`,
          hint: `~${((size / sampleRate) * 1000).toFixed(1)} ms`,
        }))}
      />
    </div>
  );
};
