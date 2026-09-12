import { cn } from "assets/lib/utils";
import { AudioSettingsPanel } from "feature/toneStudio/components/AudioSettingsPanel";
import type { ChainKey } from "feature/toneStudio/components/ChainRack";
import { ChainRack } from "feature/toneStudio/components/ChainRack";
import { InputMeter } from "feature/toneStudio/components/InputMeter";
import { Knob } from "feature/toneStudio/components/Knob";
import { AmpModule } from "feature/toneStudio/components/modules/AmpModule";
import { CabinetModule } from "feature/toneStudio/components/modules/CabinetModule";
import { DelayModule } from "feature/toneStudio/components/modules/DelayModule";
import { GateModule } from "feature/toneStudio/components/modules/GateModule";
import { OverdriveModule } from "feature/toneStudio/components/modules/OverdriveModule";
import { Grain, PowerRocker } from "feature/toneStudio/components/PluginChrome";
import { PresetBrowser } from "feature/toneStudio/components/PresetBrowser";
import { StatusBar } from "feature/toneStudio/components/StatusBar";
import { CHASSIS_WASH, RAIL_WASH } from "feature/toneStudio/utils/chassis";
import { useAmpSim } from "hooks/useAmpSim";
import { useNativeAudioDevices } from "hooks/useNativeAudioDevices";
import { useTonePresets } from "hooks/useTonePresets";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import type { AmpParams } from "types/nativeAudio";
import type { TonePreset } from "types/toneStudio";

/**
 * Tone Studio, laid out as a plugin window rather than a settings page: one
 * fixed frame with a preset rail across the top, the signal chain as a rack of
 * units you click through, a single faceplate in the middle showing whichever
 * unit you picked, and the engine's numbers along the bottom. Device I/O is
 * folded away, because you set it once and then play — but reachable from two
 * places, since "where do I choose my interface" is the first thing anyone
 * asks: the labelled Audio button on the rail, and the interface's own name in
 * the status strip.
 *
 * Deliberately does NOT gate on amp.available — that check belongs to the
 * caller (src/pages/tone-studio.tsx gates the real route; the dev preview at
 * src/pages/dev/tone-studio-preview.tsx intentionally doesn't, so the layout
 * can be screenshotted without the Electron bridge).
 */
export const ToneStudioView = () => {
  const amp = useAmpSim();
  const {
    devices,
    outputDevices,
    api,
    selectedId,
    selectedOutputId,
    selectedChannel,
    selectedOutputChannel,
    loading,
    refresh,
    select,
    selectOutput,
    selectChannel,
    selectOutputChannel,
  } = useNativeAudioDevices();
  const {
    presets,
    irs,
    namModels,
    importing,
    importingNamModel,
    irError,
    namError,
    savePreset,
    updatePreset,
    deletePreset,
    importIR,
    deleteIR,
    importNamModel,
    deleteNamModel,
  } = useTonePresets();

  const [selectedBlock, setSelectedBlock] = useState<ChainKey>("amp");
  const [showSettings, setShowSettings] = useState(false);

  const { activePresetId, setActivePresetId } = amp;

  const set = (patch: Partial<AmpParams>) => amp.setParams(patch);

  const handleSelectDevice = async (id: number) => {
    select(id);
    await amp.restart();
  };

  const handleSelectOutputDevice = async (id: number | null) => {
    selectOutput(id);
    await amp.restart();
  };

  const handleSelectChannel = async (channel: number) => {
    selectChannel(channel);
    await amp.restart();
  };

  const handleSelectOutputChannel = async (channel: number) => {
    selectOutputChannel(channel);
    await amp.restart();
  };

  const handleSaveNewPreset = async (name: string) => {
    const saved = await savePreset(name, amp.params);
    if (saved) setActivePresetId(saved.id);
  };

  const handleOverwritePreset = async (preset: TonePreset) => {
    await updatePreset(preset, amp.params);
    setActivePresetId(preset.id);
  };

  const handleDeletePreset = (id: string) => {
    deletePreset(id);
    if (activePresetId === id) setActivePresetId(null);
  };

  const namModelName = namModels.find(
    (m) => m.id === amp.params.namModelId,
  )?.name;
  const irName = irs.find((ir) => ir.id === amp.params.irId)?.name;

  const modulePanel = {
    gate: <GateModule params={amp.params} set={set} />,
    overdrive: <OverdriveModule params={amp.params} set={set} />,
    amp: (
      <AmpModule
        params={amp.params}
        set={set}
        namModels={namModels}
        importingNamModel={importingNamModel}
        namError={namError}
        onImportNamModel={() => importNamModel()}
        onDeleteNamModel={deleteNamModel}
        live={amp.isOn}
      />
    ),
    cab: (
      <CabinetModule
        params={amp.params}
        set={set}
        irs={irs}
        importing={importing}
        irError={irError}
        onImportIR={() => importIR()}
        onDeleteIR={deleteIR}
      />
    ),
    delay: <DelayModule params={amp.params} set={set} />,
  }[selectedBlock];

  return (
    // The page column offers ~1426px inside its own padding; the chassis takes
    // as much of it as it can get. A plugin window is wide — the rack wants to
    // show five units side by side without crowding, and the amp's faceplate is
    // a landscape panel that only gets better with room.
    <div className='mx-auto w-full max-w-[1400px] p-3 sm:p-6'>
      <div
        className='relative overflow-hidden rounded-xl'
        style={{
          backgroundImage: CHASSIS_WASH,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}>
        <Grain opacity={0.045} />

        {/* ── Top rail: preset library, master output, power ────────────── */}
        <div
          className='relative flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3'
          style={{ backgroundImage: RAIL_WASH }}>
          <div className='order-3 w-full min-w-0 sm:order-none sm:w-auto sm:flex-1'>
            <PresetBrowser
              presets={presets}
              activePresetId={activePresetId}
              params={amp.params}
              onLoad={amp.loadPreset}
              onSaveNew={handleSaveNewPreset}
              onOverwrite={handleOverwritePreset}
              onDelete={handleDeletePreset}
            />
          </div>

          <InputMeter className='hidden w-40 shrink-0 lg:flex' />

          <Knob
            label='Master'
            size={44}
            ring={false}
            value={amp.params.level}
            defaultValue={0.5}
            onChange={(v) => set({ level: v })}
          />

          {/* Labelled, not a bare gear: this is where the audio interface and
              the ASIO buffer live, and "where do I pick my interface" is the
              first question anyone has. The driver API doubles as the label
              once it is known, so the word ASIO is visible on the rail. */}
          <button
            type='button'
            onClick={() => setShowSettings((open) => !open)}
            title='Audio interface, channels and buffer size'
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              showSettings
                ? "bg-zinc-700/70 text-zinc-100"
                : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60 hover:text-white",
            )}>
            <Settings2 size={16} />
            <span className='hidden sm:inline'>Audio</span>
            {api && (
              <span className='font-mono hidden rounded bg-zinc-900/70 px-1.5 py-0.5 text-[10px] text-zinc-400 md:inline'>
                {api}
              </span>
            )}
          </button>

          <PowerRocker
            on={amp.isOn}
            disabled={amp.isBusy || !amp.available}
            onToggle={() => amp.toggle()}
            disabledReason={
              !amp.available
                ? "Needs the desktop app"
                : amp.isBusy
                  ? "Opening the audio stream…"
                  : undefined
            }
          />
        </div>

        {/* ── Alerts: only ever present when something is actually wrong ──── */}
        {(!amp.available || amp.error || amp.overload) && (
          <div className='relative flex flex-col gap-2 px-4 pt-3'>
            {!amp.available && (
              <p className='rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-400'>
                No connection to the desktop app — this is a visual preview
                only, audio control is inactive.
              </p>
            )}
            {amp.error && (
              <p className='rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400'>
                {amp.error}
              </p>
            )}
            {amp.overload && (
              <p className='rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-400'>
                The DSP chain fell behind real time and had to reset (~
                {Math.round(amp.overload.driftMs)}ms drift) — you probably just
                heard a click.
                {amp.overload.namEnabled &&
                  " Try a bigger buffer or a lighter capture."}
              </p>
            )}
          </div>
        )}

        {/* ── I/O sheet, folded away behind the gear ──────────────────────── */}
        {showSettings && (
          <div className='relative px-3 pt-3'>
            <AudioSettingsPanel
              api={api}
              devices={devices}
              outputDevices={outputDevices}
              selectedId={selectedId}
              selectedOutputId={selectedOutputId}
              selectedChannel={selectedChannel}
              selectedOutputChannel={selectedOutputChannel}
              loading={loading}
              bufferSize={amp.bufferSize}
              sampleRate={amp.info?.sampleRate || 48000}
              onRefresh={refresh}
              onSelectDevice={handleSelectDevice}
              onSelectOutputDevice={handleSelectOutputDevice}
              onSelectChannel={handleSelectChannel}
              onSelectOutputChannel={handleSelectOutputChannel}
              onBufferSizeChange={amp.setBufferSize}
            />
          </div>
        )}

        {/* ── The rack: signal order left to right, and the tab bar ───────── */}
        <div className='relative px-3 pt-3'>
          <ChainRack
            params={amp.params}
            selected={selectedBlock}
            onSelect={setSelectedBlock}
            onToggle={set}
            namModelName={namModelName}
            irName={irName}
          />
        </div>

        {/* ── The stage: whichever unit the rack has selected ─────────────── */}
        <div className='relative px-3 pb-3 pt-1.5'>{modulePanel}</div>

        {/* ── Status strip ────────────────────────────────────────────────── */}
        <div className='relative' style={{ backgroundImage: RAIL_WASH }}>
          <StatusBar
            isOn={amp.isOn}
            info={amp.info}
            diagnostics={amp.diagnostics}
            bufferSize={amp.bufferSize}
            api={api}
            selectedDeviceName={
              devices.find((d) => d.id === selectedId)?.name ?? undefined
            }
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>
      </div>
    </div>
  );
};
