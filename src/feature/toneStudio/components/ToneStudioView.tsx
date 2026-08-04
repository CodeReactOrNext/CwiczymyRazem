import { cn } from "assets/lib/utils";
import { Knob } from "feature/toneStudio/components/Knob";
import { useAmpSim } from "hooks/useAmpSim";
import { useNativeAudioDevices } from "hooks/useNativeAudioDevices";
import { useTonePresets } from "hooks/useTonePresets";
import {
  BookMarked,
  Cable,
  Check,
  ChevronRight,
  ExternalLink,
  Flame,
  Power,
  RefreshCw,
  Repeat2,
  Save,
  Speaker,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Fragment, type ReactNode, useState } from "react";
import type { AmpParams } from "types/nativeAudio";

const BUFFER_SIZES = [64, 128, 256, 512, 1024, 2048];

type Accent = "cyan" | "amber" | "emerald" | "purple" | "orange";

const ACCENT_TEXT: Record<Accent, string> = {
  cyan: "text-cyan-400",
  amber: "text-amber-400",
  emerald: "text-emerald-400",
  purple: "text-purple-400",
  orange: "text-orange-400",
};
const ACCENT_BG: Record<Accent, string> = {
  cyan: "bg-cyan-500/10",
  amber: "bg-amber-500/10",
  emerald: "bg-emerald-500/10",
  purple: "bg-purple-500/10",
  orange: "bg-orange-500/10",
};
const ACCENT_GLOW: Record<Accent, string> = {
  cyan: "bg-cyan-500/[0.08]",
  amber: "bg-amber-500/[0.08]",
  emerald: "bg-emerald-500/[0.08]",
  purple: "bg-purple-500/[0.08]",
  orange: "bg-orange-500/[0.08]",
};
const ACCENT_SWITCH: Record<Accent, string> = {
  cyan: "bg-cyan-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
};

interface SectionPanelProps {
  id?: string;
  title: string;
  icon: ReactNode;
  /** Omit for "setup/meta" panels (audio interface, presets) — renders a plain
   *  gray badge with no ambient glow, visually separating them from the colored
   *  DSP chain sections below. */
  accent?: Accent;
  headerRight?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

/** Shared "hardware unit" section shell — colored icon badge + ambient glow blob,
 * reused so NAM/Overdrive/Cabinet/Delay read as one consistent plugin chassis. */
const SectionPanel = ({
  id,
  title,
  icon,
  accent,
  headerRight,
  children,
  contentClassName,
}: SectionPanelProps) => (
  <div
    id={id}
    className='relative scroll-mt-4 overflow-hidden rounded-lg bg-zinc-900/40 p-5'>
    {accent && (
      <div
        className={cn(
          "pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full blur-3xl",
          ACCENT_GLOW[accent],
        )}
      />
    )}
    <div className='relative mb-4 flex items-center justify-between'>
      <div className='flex items-center gap-2.5'>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded",
            accent ? ACCENT_BG[accent] : "bg-zinc-800/60",
            accent ? ACCENT_TEXT[accent] : "text-zinc-400",
          )}>
          {icon}
        </span>
        <span className='text-sm font-semibold text-zinc-200'>{title}</span>
      </div>
      {headerRight}
    </div>
    <div className={cn("relative", contentClassName)}>{children}</div>
  </div>
);

interface ToggleBadgeProps {
  active: boolean;
  accent: Accent;
  onToggle: () => void;
  onLabel?: string;
  offLabel?: string;
}

/** Enable/disable control for a chain block — a little switch-track (not just
 * colored text) so it reads as something you click, not a status label. */
const ToggleBadge = ({
  active,
  accent,
  onToggle,
  onLabel = "Enabled",
  offLabel = "Disabled",
}: ToggleBadgeProps) => (
  <button
    type='button'
    onClick={onToggle}
    className={cn(
      "flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
      active
        ? cn(ACCENT_BG[accent], ACCENT_TEXT[accent])
        : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800",
    )}>
    <span
      className={cn(
        "relative inline-flex h-3.5 w-6 shrink-0 rounded-full transition-colors",
        active ? ACCENT_SWITCH[accent] : "bg-zinc-600",
      )}>
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform",
          active && "translate-x-[10px]",
        )}
      />
    </span>
    {active ? onLabel : offLabel}
  </button>
);

const segmentButtonClass = (active: boolean) =>
  cn(
    "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
    active
      ? "bg-cyan-500/10 text-cyan-400"
      : "text-zinc-500 hover:text-zinc-300",
  );

/**
 * Full Tone Studio page content. Deliberately does NOT gate on amp.available —
 * that check belongs to the caller (src/pages/tone-studio.tsx gates the real route;
 * src/pages/dev/tone-studio-preview.tsx intentionally doesn't, so the layout can be
 * screenshotted in a plain browser without the Electron bridge).
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
    deletePreset,
    importIR,
    deleteIR,
    importNamModel,
    deleteNamModel,
  } = useTonePresets();
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [presetName, setPresetName] = useState("");
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);

  // ASIO is a single-device driver — the engine always routes output to the same
  // device as input on ASIO (see nativeAudioEngine.js), so output selection only
  // has an effect on WASAPI/other APIs.
  const isAsio = /asio/i.test(api || "");

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

  const selectedInputDevice = devices.find((d) => d.id === selectedId);
  // On ASIO the engine always routes output through the input device (see
  // isAsio above), so that's whose channel count/name governs the output
  // channel picker too — outputDevices/selectedOutputId only apply on WASAPI.
  const outputChannelCount = isAsio
    ? selectedInputDevice?.outputChannels || 0
    : (outputDevices.find((d) => d.id === selectedOutputId) ?? outputDevices[0])?.outputChannels || 0;

  const set = (patch: Partial<AmpParams>) => {
    amp.setParams(patch);
  };

  const handleLoadPreset = (id: string, params: AmpParams) => {
    amp.setParams(params);
    setActivePresetId(id);
  };

  const handleSavePreset = async () => {
    const name = presetName.trim();
    if (!name) return;
    const saved = await savePreset(name, amp.params);
    setPresetName("");
    setIsCreatingPreset(false);
    if (saved) setActivePresetId(saved.id);
  };

  const handleCancelCreatePreset = () => {
    setIsCreatingPreset(false);
    setPresetName("");
  };

  const handleDeletePreset = (id: string) => {
    deletePreset(id);
    if (activePresetId === id) setActivePresetId(null);
  };

  const scrollToSection = (sectionId: string) => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Mirrors the real DSP order in electron/ampSim.js `process()`: gate → overdrive
  // → (NAM model | classic preamp/tone-stack/drive) → cabinet → delay. Drives the
  // breadcrumb strip below so order + enabled state are visible at a glance —
  // clicking a chip scrolls to the section that controls it.
  const chainSteps: {
    label: string;
    active: boolean;
    accent: Accent;
    sectionId: string;
  }[] = [
    {
      label: "Gate",
      active: amp.params.gate,
      accent: "cyan",
      sectionId: "chain-amp",
    },
    {
      label: "Overdrive",
      active: amp.params.overdriveEnabled,
      accent: "orange",
      sectionId: "chain-overdrive",
    },
    {
      label: amp.params.namEnabled ? "Amp · NAM" : "Amp · Classic",
      active: true,
      accent: "cyan",
      sectionId: "chain-amp",
    },
    {
      label: "Cabinet",
      active: amp.params.cab,
      accent: "emerald",
      sectionId: "chain-cabinet",
    },
    {
      label: "Delay",
      active: amp.params.delayEnabled,
      accent: "amber",
      sectionId: "chain-delay",
    },
  ];

  return (
    <div className='mx-auto flex max-w-4xl flex-col gap-6 p-6'>
      {/* ── Header: title, power, master output level ──────────────────── */}
      <div className='relative overflow-hidden rounded-lg bg-zinc-900/60 p-5'>
        <div className='pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-500/[0.06] blur-3xl' />
        <div className='relative mb-2 flex items-center justify-between'>
          <div>
            <h1 className='font-display text-xl text-zinc-100'>Tone Studio</h1>
            <p className='text-sm text-zinc-400'>
              Shape your tone, load custom IRs and NAM models
            </p>
          </div>
          <div className='flex items-center gap-5'>
            <Knob
              label='Level'
              value={amp.params.level}
              size={48}
              accent='cyan'
              onChange={(v) => set({ level: v })}
            />
            <button
              type='button'
              onClick={() => amp.toggle()}
              disabled={amp.isBusy || !amp.available}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                amp.isOn
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-zinc-700 text-white hover:bg-zinc-600",
              )}>
              <Power size={16} />
              {amp.isOn ? "Turn off" : "Turn on"}
            </button>
          </div>
        </div>

        {!amp.available && (
          <p className='relative mb-1 text-xs text-amber-400'>
            No connection to the desktop app — this is a visual preview only,
            audio control is inactive.
          </p>
        )}

        {amp.error && (
          <p className='relative mt-2 text-xs text-red-400'>{amp.error}</p>
        )}
        {amp.overload && (
          <p className='relative mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400'>
            The DSP chain fell behind real time and had to reset (~
            {Math.round(amp.overload.driftMs)}ms drift) — you probably just
            heard a click.
            {amp.overload.namEnabled &&
              " Try a bigger buffer or a lighter NAM model."}
          </p>
        )}
        {amp.isOn && amp.info && (
          <p className='relative mt-2 text-[11px] text-zinc-500'>
            {amp.info.deviceName}
            {amp.info.outDeviceName &&
              amp.info.outDeviceName !== amp.info.deviceName &&
              ` → ${amp.info.outDeviceName}`}
            {" · "}
            {amp.info.sampleRate / 1000}kHz · ~{amp.info.roundTripMs.toFixed(0)}
            ms latency
          </p>
        )}
      </div>

      {/* ── Audio Interface: device/buffer config, kept separate from tone-shaping ── */}
      <SectionPanel
        title='Audio Interface'
        icon={<Cable size={14} />}
        contentClassName='flex flex-col gap-3'>
        <div className='flex items-center gap-2'>
          <div className='flex-1'>
            <span className='mb-1 block text-xs text-zinc-400'>
              Input {api ? `(${api})` : ""}
            </span>
            <select
              value={selectedId ?? ""}
              onChange={(e) => handleSelectDevice(Number(e.target.value))}
              className='w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50'>
              {devices.length === 0 && (
                <option value=''>No input devices found</option>
              )}
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.inputChannels} in)
                  {d.isDefaultInput ? " · default" : ""}
                </option>
              ))}
            </select>
          </div>
          {(selectedInputDevice?.inputChannels || 0) > 1 && (
            <div className='w-28 shrink-0'>
              <span className='mb-1 block text-xs text-zinc-400'>Channel</span>
              <select
                value={selectedChannel}
                onChange={(e) => handleSelectChannel(Number(e.target.value))}
                title='Which input channel to capture from — e.g. the guitar jack on a multi-channel interface'
                className='w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50'>
                {Array.from({ length: selectedInputDevice?.inputChannels || 0 }, (_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type='button'
            onClick={() => refresh()}
            title='Refresh device list'
            className='mt-5 shrink-0 rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white'>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <div className='w-36 shrink-0'>
            <span className='mb-1 block text-xs text-zinc-400'>Buffer</span>
            <select
              value={amp.bufferSize}
              onChange={(e) => amp.setBufferSize(Number(e.target.value))}
              title='ASIO/WASAPI buffer size — smaller = lower latency but more prone to crackling'
              className='w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50'>
              {BUFFER_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} smp (~
                  {((size / (amp.info?.sampleRate || 48000)) * 1000).toFixed(1)}
                  ms)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <div className='flex-1'>
            <span className='mb-1 block text-xs text-zinc-400'>Output</span>
            <select
              value={selectedOutputId ?? ""}
              onChange={(e) =>
                handleSelectOutputDevice(
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={isAsio}
              title={
                isAsio
                  ? "ASIO uses the same device for input and output"
                  : "Output device for amp monitoring"
              }
              className='w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50'>
              <option value=''>
                {isAsio ? "Same as input (ASIO)" : "System default output"}
              </option>
              {outputDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.outputChannels} out)
                  {d.isDefaultOutput ? " · default" : ""}
                </option>
              ))}
            </select>
          </div>
          {outputChannelCount > 1 && (
            <div className='w-28 shrink-0'>
              <span className='mb-1 block text-xs text-zinc-400'>Channel</span>
              <select
                value={selectedOutputChannel}
                onChange={(e) => handleSelectOutputChannel(Number(e.target.value))}
                title='First output channel to monitor through — e.g. outputs 3/4 instead of 1/2 on a multi-channel interface'
                className='w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50'>
                {Array.from({ length: outputChannelCount }, (_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </SectionPanel>

      {/* ── Presets: browsing/loading is the default view; creating a new one is an
          explicit opt-in action, not a form glued to the list ──────────────────── */}
      <SectionPanel
        title='Presets'
        icon={<BookMarked size={14} />}
        contentClassName='flex flex-col gap-2'>
        <p className='mb-1 text-[11px] text-zinc-500'>
          Load a saved snapshot of the amp, cabinet, drive and delay settings.
        </p>
        {presets.map((preset) => (
          <div
            key={preset.id}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              activePresetId === preset.id
                ? "bg-purple-500/10 text-purple-400"
                : "bg-zinc-800/40 text-zinc-300",
            )}>
            <button
              type='button'
              onClick={() => handleLoadPreset(preset.id, preset.params)}
              className='flex flex-1 items-center gap-2 text-left'>
              <span>
                {preset.name}
                {preset.builtIn && (
                  <span className='ml-1.5 text-[11px] text-zinc-500'>
                    Built-in
                  </span>
                )}
              </span>
              {activePresetId === preset.id && <Check size={14} />}
            </button>
            {!preset.builtIn && (
              <button
                type='button'
                onClick={() => handleDeletePreset(preset.id)}
                title='Delete preset'
                className='p-1 text-zinc-500 hover:text-red-400'>
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        {isCreatingPreset ? (
          <div className='mt-2 flex items-center gap-2'>
            <input
              type='text'
              autoFocus
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
              placeholder='New preset name'
              className='flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50'
            />
            <button
              type='button'
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className='flex shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 transition-colors disabled:opacity-50 hover:bg-zinc-800'>
              <Save size={14} />
              Save
            </button>
            <button
              type='button'
              onClick={handleCancelCreatePreset}
              title='Cancel'
              className='shrink-0 rounded-lg bg-zinc-800/50 p-2 text-zinc-400 hover:text-white'>
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type='button'
            onClick={() => setIsCreatingPreset(true)}
            className='mt-2 flex items-center justify-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800'>
            <Save size={14} />
            Save current as new preset
          </button>
        )}
      </SectionPanel>

      {/* ── Signal chain map: order + enabled state at a glance ─────────────────── */}
      <div className='flex flex-wrap items-center justify-center gap-1.5 px-1'>
        {chainSteps.map((step, i) => (
          <Fragment key={step.label}>
            {i > 0 && (
              <ChevronRight size={12} className='shrink-0 text-zinc-700' />
            )}
            <button
              type='button'
              onClick={() => scrollToSection(step.sectionId)}
              className={cn(
                "rounded px-2 py-1 text-[11px] font-medium transition-colors",
                step.active
                  ? cn(
                      ACCENT_BG[step.accent],
                      ACCENT_TEXT[step.accent],
                      "hover:brightness-125",
                    )
                  : "text-zinc-600 hover:text-zinc-400",
              )}>
              {step.label}
            </button>
          </Fragment>
        ))}
      </div>

      {/* ── Overdrive: pre-amp pedal, runs before the amp stage ─────────────────── */}
      <SectionPanel
        id='chain-overdrive'
        title='Overdrive'
        icon={<Flame size={14} />}
        accent='orange'
        headerRight={
          <ToggleBadge
            active={amp.params.overdriveEnabled}
            accent='orange'
            onToggle={() =>
              set({ overdriveEnabled: !amp.params.overdriveEnabled })
            }
          />
        }
        contentClassName={cn(
          "flex justify-center gap-7",
          !amp.params.overdriveEnabled && "opacity-40",
        )}>
        <Knob
          label='Drive'
          value={amp.params.overdriveDrive}
          accent='orange'
          onChange={(v) => set({ overdriveDrive: v })}
        />
        <Knob
          label='Tone'
          value={amp.params.overdriveTone}
          accent='orange'
          onChange={(v) => set({ overdriveTone: v })}
        />
        <Knob
          label='Level'
          value={amp.params.overdriveLevel}
          accent='orange'
          onChange={(v) => set({ overdriveLevel: v })}
        />
      </SectionPanel>

      {/* ── Amp: the amp stage itself — either a captured NAM model or the classic
          preamp/tone-stack/drive chain. They're mutually exclusive DSP paths (see
          ampSim.js), so instead of two separate always-visible panels this is one
          section with a mode switch. Gate lives here too — it's the last thing
          that runs before this stage. ──────────────────────────────────────────── */}
      <SectionPanel
        id='chain-amp'
        title='Amp'
        icon={<Zap size={14} />}
        accent='cyan'
        headerRight={
          <div className='flex items-center gap-1 rounded bg-zinc-800/50 p-1'>
            <button
              type='button'
              onClick={() => set({ namEnabled: false })}
              className={segmentButtonClass(!amp.params.namEnabled)}>
              Classic
            </button>
            <button
              type='button'
              onClick={() => set({ namEnabled: true })}
              className={segmentButtonClass(amp.params.namEnabled)}>
              NAM model
            </button>
          </div>
        }>
        <div className='mb-3 flex items-center justify-between gap-3 rounded-lg bg-zinc-800/40 px-3 py-2.5'>
          <div>
            <span className='block text-sm text-zinc-200'>Noise gate</span>
            <span className='block text-[11px] text-zinc-500'>
              Kills hum and hiss before it hits the amp
            </span>
          </div>
          <ToggleBadge
            active={amp.params.gate}
            accent='cyan'
            onToggle={() => set({ gate: !amp.params.gate })}
          />
        </div>

        {amp.params.namEnabled ? (
          <div className='flex flex-col gap-2'>
            <p className='mb-1 text-[11px] text-zinc-500'>
              Replaces the preamp and tone stack with a model captured from real
              hardware.
            </p>
            <a
              href='https://www.tone3000.com/search'
              target='_blank'
              rel='noopener noreferrer'
              className='mb-1 flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300'>
              Browse NAM models on Tone3000
              <ExternalLink size={11} />
            </a>
            {namModels.length === 0 && (
              <p className='rounded-lg bg-zinc-800/40 px-3 py-2 text-sm text-zinc-400'>
                No .nam models loaded
              </p>
            )}
            {namModels.map((model) => (
              <div
                key={model.id}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  amp.params.namModelId === model.id
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "bg-zinc-800/40 text-zinc-300",
                )}>
                <button
                  type='button'
                  onClick={() => set({ namModelId: model.id })}
                  className='flex flex-1 items-center gap-2 text-left'>
                  <span>
                    {model.name}
                    {(model.gearMake || model.gearModel) && (
                      <span className='ml-1.5 text-[11px] text-zinc-500'>
                        {[model.gearMake, model.gearModel]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                    )}
                  </span>
                  {amp.params.namModelId === model.id && <Check size={14} />}
                </button>
                <button
                  type='button'
                  onClick={() => deleteNamModel(model.id)}
                  title='Delete model'
                  className='p-1 text-zinc-500 hover:text-red-400'>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              type='button'
              onClick={() => importNamModel()}
              disabled={importingNamModel}
              className='mt-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 transition-colors disabled:opacity-50 hover:bg-zinc-800'>
              <Upload size={14} />
              {importingNamModel ? "Loading…" : "Upload model (.nam)"}
            </button>
            {namError && (
              <p className='mt-1 text-xs text-red-400'>{namError}</p>
            )}
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            <div>
              <p className='mb-2 text-center text-[11px] text-zinc-500'>
                Tone stack
              </p>
              <div className='flex justify-center gap-7'>
                <Knob
                  label='Bass'
                  value={amp.params.bass}
                  accent='cyan'
                  onChange={(v) => set({ bass: v })}
                />
                <Knob
                  label='Mid'
                  value={amp.params.mid}
                  accent='cyan'
                  onChange={(v) => set({ mid: v })}
                />
                <Knob
                  label='Treble'
                  value={amp.params.treble}
                  accent='cyan'
                  onChange={(v) => set({ treble: v })}
                />
              </div>
            </div>
            <div>
              <p className='mb-2 text-center text-[11px] text-zinc-500'>
                Gain stages
              </p>
              <div className='flex justify-center gap-7'>
                <Knob
                  label='Preamp'
                  value={amp.params.preampGain}
                  accent='cyan'
                  onChange={(v) => set({ preampGain: v })}
                />
                <Knob
                  label='Drive'
                  value={amp.params.drive}
                  accent='cyan'
                  onChange={(v) => set({ drive: v })}
                />
              </div>
            </div>
          </div>
        )}
      </SectionPanel>

      {/* ── Cabinet: synthetic vs. loaded IR ────────────────────────────── */}
      <SectionPanel
        id='chain-cabinet'
        title='Cabinet'
        icon={<Speaker size={14} />}
        accent='emerald'
        headerRight={
          <ToggleBadge
            active={amp.params.cab}
            accent='emerald'
            onToggle={() => set({ cab: !amp.params.cab })}
          />
        }
        contentClassName={cn(
          "flex flex-col gap-2",
          !amp.params.cab && "opacity-40",
        )}>
        <button
          type='button'
          disabled={!amp.params.cab}
          onClick={() => set({ irId: null })}
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
            amp.params.irId === null
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800",
          )}>
          Built-in cabinet simulation
          {amp.params.irId === null && <Check size={14} />}
        </button>

        {irs.map((ir) => (
          <div
            key={ir.id}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              amp.params.irId === ir.id
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-zinc-800/40 text-zinc-300",
            )}>
            <button
              type='button'
              disabled={!amp.params.cab}
              onClick={() => set({ irId: ir.id })}
              className='flex flex-1 items-center gap-2 text-left'>
              {ir.name}
              {ir.truncated && (
                <span className='rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400'>
                  truncated
                </span>
              )}
              {amp.params.irId === ir.id && <Check size={14} />}
            </button>
            <button
              type='button'
              onClick={() => deleteIR(ir.id)}
              title='Delete IR'
              className='p-1 text-zinc-500 hover:text-red-400'>
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        <button
          type='button'
          onClick={() => importIR()}
          disabled={importing}
          className='mt-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 transition-colors disabled:opacity-50 hover:bg-zinc-800'>
          <Upload size={14} />
          {importing ? "Loading…" : "Upload custom IR (.wav)"}
        </button>
        {irError && <p className='mt-1 text-xs text-red-400'>{irError}</p>}
      </SectionPanel>

      {/* ── Delay ────────────────────────────────────────────────────────── */}
      <SectionPanel
        id='chain-delay'
        title='Delay'
        icon={<Repeat2 size={14} />}
        accent='amber'
        headerRight={
          <ToggleBadge
            active={amp.params.delayEnabled}
            accent='amber'
            onToggle={() => set({ delayEnabled: !amp.params.delayEnabled })}
          />
        }
        contentClassName={cn(
          "flex justify-center gap-7",
          !amp.params.delayEnabled && "opacity-40",
        )}>
        <Knob
          label='Time'
          value={amp.params.delayMs / 800}
          accent='amber'
          displayValue={`${Math.round(amp.params.delayMs)}ms`}
          onChange={(v) => set({ delayMs: v * 800 })}
        />
        <Knob
          label='Feedback'
          value={amp.params.delayFeedback}
          accent='amber'
          onChange={(v) => set({ delayFeedback: v })}
        />
        <Knob
          label='Mix'
          value={amp.params.delayMix}
          accent='amber'
          onChange={(v) => set({ delayMix: v })}
        />
      </SectionPanel>
    </div>
  );
};
