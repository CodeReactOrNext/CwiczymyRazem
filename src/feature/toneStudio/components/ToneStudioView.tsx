import { cn } from "assets/lib/utils";
import { Knob } from "feature/toneStudio/components/Knob";
import { useAmpSim } from "hooks/useAmpSim";
import { useNativeAudioDevices } from "hooks/useNativeAudioDevices";
import { useTonePresets } from "hooks/useTonePresets";
import {
  Check, Cpu, Disc3, Flame, Power, RefreshCw, Repeat2, Save, ShieldOff, Speaker, Trash2, Upload, Waves, Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { AmpParams } from "types/nativeAudio";

const BUFFER_SIZES = [64, 128, 256, 512, 1024, 2048];

type Accent = "cyan" | "amber" | "emerald" | "purple" | "orange";

const ACCENT_TEXT: Record<Accent, string> = {
  cyan: "text-cyan-400", amber: "text-amber-400", emerald: "text-emerald-400", purple: "text-purple-400", orange: "text-orange-400",
};
const ACCENT_BG: Record<Accent, string> = {
  cyan: "bg-cyan-500/10", amber: "bg-amber-500/10", emerald: "bg-emerald-500/10", purple: "bg-purple-500/10", orange: "bg-orange-500/10",
};
const ACCENT_GLOW: Record<Accent, string> = {
  cyan: "bg-cyan-500/[0.08]", amber: "bg-amber-500/[0.08]", emerald: "bg-emerald-500/[0.08]", purple: "bg-purple-500/[0.08]", orange: "bg-orange-500/[0.08]",
};

interface SectionPanelProps {
  title: string;
  icon: ReactNode;
  accent: Accent;
  headerRight?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

/** Shared "hardware unit" section shell — colored icon badge + ambient glow blob,
 * reused so Amp/Cabinet/Delay/Reverb/Presets read as one consistent plugin chassis. */
const SectionPanel = ({ title, icon, accent, headerRight, children, contentClassName }: SectionPanelProps) => (
  <div className='relative overflow-hidden rounded-lg bg-zinc-900/40 p-5'>
    <div className={cn("pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full blur-3xl", ACCENT_GLOW[accent])} />
    <div className='relative mb-4 flex items-center justify-between'>
      <div className='flex items-center gap-2.5'>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded", ACCENT_BG[accent], ACCENT_TEXT[accent])}>
          {icon}
        </span>
        <span className='text-sm font-semibold text-zinc-200'>{title}</span>
      </div>
      {headerRight}
    </div>
    <div className={cn("relative", contentClassName)}>{children}</div>
  </div>
);

const toggleBadgeClass = (active: boolean, accent: Accent) =>
  cn(
    "flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
    active ? cn(ACCENT_BG[accent], ACCENT_TEXT[accent]) : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800"
  );

/**
 * Full Tone Studio page content. Deliberately does NOT gate on amp.available —
 * that check belongs to the caller (src/pages/tone-studio.tsx gates the real route;
 * src/pages/dev/tone-studio-preview.tsx intentionally doesn't, so the layout can be
 * screenshotted in a plain browser without the Electron bridge).
 */
export const ToneStudioView = () => {
  const amp = useAmpSim();
  const { devices, api, selectedId, loading, refresh, select } = useNativeAudioDevices();
  const {
    presets, irs, namModels, importing, importingNamModel,
    savePreset, deletePreset, importIR, deleteIR, importNamModel, deleteNamModel,
  } = useTonePresets();
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [presetName, setPresetName] = useState("");

  const handleSelectDevice = async (id: number) => {
    select(id);
    await amp.restart();
  };

  const set = (patch: Partial<AmpParams>) => {
    setActivePresetId(null);
    amp.setParams(patch);
  };

  const loadPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    setActivePresetId(id);
    amp.setParams(preset.params);
  };

  const handleSavePreset = async () => {
    const name = presetName.trim();
    if (!name) return;
    const saved = await savePreset(name, amp.params);
    if (saved) setActivePresetId(saved.id);
    setPresetName("");
  };

  return (
    <div className='mx-auto flex max-w-4xl flex-col gap-6 p-6'>
      {/* ── Header: interface + monitoring ─────────────────────────────── */}
      <div className='relative overflow-hidden rounded-lg bg-zinc-900/60 p-5'>
        <div className='pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-500/[0.06] blur-3xl' />
        <div className='relative mb-4 flex items-center justify-between'>
          <div>
            <h1 className='font-display text-xl text-zinc-100'>Tone Studio</h1>
            <p className='text-sm text-zinc-400'>Kształtuj brzmienie, ładuj własne IR, zapisuj presety</p>
          </div>
          <button
            type='button'
            onClick={() => amp.toggle()}
            disabled={amp.isBusy || !amp.available}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
              amp.isOn ? "bg-red-600 text-white hover:bg-red-500" : "bg-zinc-700 text-white hover:bg-zinc-600"
            )}>
            <Power size={16} />
            {amp.isOn ? "Wyłącz" : "Włącz"}
          </button>
        </div>

        {!amp.available && (
          <p className='relative mb-3 text-xs text-amber-400'>
            Brak połączenia z aplikacją desktopową — podgląd wyglądu, sterowanie audio jest nieaktywne.
          </p>
        )}

        <div className='relative flex items-center gap-2'>
          <select
            value={selectedId ?? ""}
            onChange={(e) => handleSelectDevice(Number(e.target.value))}
            className='w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50'>
            {devices.length === 0 && <option value=''>Brak urządzeń wejściowych</option>}
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.inputChannels} in) {api ? `· ${api}` : ""}
              </option>
            ))}
          </select>
          <button
            type='button'
            onClick={() => refresh()}
            title='Odśwież listę urządzeń'
            className='rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white'>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <select
            value={amp.bufferSize}
            onChange={(e) => amp.setBufferSize(Number(e.target.value))}
            title='Rozmiar bufora ASIO/WASAPI — mniejszy = niższe opóźnienie, ale bardziej podatny na trzaski'
            className='w-36 shrink-0 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50'>
            {BUFFER_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} smp (~{((size / (amp.info?.sampleRate || 48000)) * 1000).toFixed(1)}ms)
              </option>
            ))}
          </select>
        </div>

        {amp.error && <p className='relative mt-2 text-xs text-red-400'>{amp.error}</p>}
        {amp.isOn && amp.info && (
          <p className='relative mt-2 text-[11px] text-zinc-500'>
            {amp.info.deviceName} · {amp.info.sampleRate / 1000}kHz · ~{amp.info.roundTripMs.toFixed(0)}ms latency
          </p>
        )}
      </div>

      {/* ── NAM: captured-amp model, replaces Wzmacniacz + Kolumna when active ── */}
      <SectionPanel
        title='NAM (Neural Amp Modeler)'
        icon={<Cpu size={14} />}
        accent='cyan'
        headerRight={
          <button type='button' onClick={() => set({ namEnabled: !amp.params.namEnabled })} className={toggleBadgeClass(amp.params.namEnabled, "cyan")}>
            {amp.params.namEnabled ? "Włączony" : "Wyłączony"}
          </button>
        }
        contentClassName={cn("flex flex-col gap-2", !amp.params.namEnabled && "opacity-40")}>
        <p className='mb-1 text-[11px] text-zinc-500'>
          Zastępuje Wzmacniacz i Kolumnę modelem przechwyconym z prawdziwego sprzętu.
        </p>
        {namModels.length === 0 && (
          <p className='rounded-lg bg-zinc-800/40 px-3 py-2 text-sm text-zinc-400'>Brak wgranych modeli .nam</p>
        )}
        {namModels.map((model) => (
          <div
            key={model.id}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              amp.params.namModelId === model.id ? "bg-cyan-500/10 text-cyan-400" : "bg-zinc-800/40 text-zinc-300"
            )}>
            <button
              type='button'
              disabled={!amp.params.namEnabled}
              onClick={() => set({ namModelId: model.id })}
              className='flex flex-1 items-center gap-2 text-left'>
              <span>
                {model.name}
                {(model.gearMake || model.gearModel) && (
                  <span className='ml-1.5 text-[11px] text-zinc-500'>
                    {[model.gearMake, model.gearModel].filter(Boolean).join(" ")}
                  </span>
                )}
              </span>
              {amp.params.namModelId === model.id && <Check size={14} />}
            </button>
            <button type='button' onClick={() => deleteNamModel(model.id)} title='Usuń model' className='p-1 text-zinc-500 hover:text-red-400'>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          type='button'
          onClick={() => importNamModel()}
          disabled={importingNamModel}
          className='mt-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50'>
          <Upload size={14} />
          {importingNamModel ? "Wczytywanie…" : "Wgraj model (.nam)"}
        </button>
      </SectionPanel>

      {/* ── Overdrive: pre-amp pedal, own clip character from the amp's Drive ── */}
      <SectionPanel
        title='Overdrive'
        icon={<Flame size={14} />}
        accent='orange'
        headerRight={
          <button type='button' onClick={() => set({ overdriveEnabled: !amp.params.overdriveEnabled })} className={toggleBadgeClass(amp.params.overdriveEnabled, "orange")}>
            {amp.params.overdriveEnabled ? "Włączony" : "Wyłączony"}
          </button>
        }
        contentClassName={cn("flex justify-center gap-7", !amp.params.overdriveEnabled && "opacity-40")}>
        <Knob label='Drive' value={amp.params.overdriveDrive} accent='orange' onChange={(v) => set({ overdriveDrive: v })} />
        <Knob label='Tone' value={amp.params.overdriveTone} accent='orange' onChange={(v) => set({ overdriveTone: v })} />
        <Knob label='Level' value={amp.params.overdriveLevel} accent='orange' onChange={(v) => set({ overdriveLevel: v })} />
      </SectionPanel>

      {/* ── Amp: gate / drive / EQ / level ──────────────────────────────── */}
      <SectionPanel
        title='Wzmacniacz'
        icon={<Zap size={14} />}
        accent='cyan'
        headerRight={
          <button
            type='button'
            onClick={() => set({ gate: !amp.params.gate })}
            title='Noise gate — tłumi szum/hum poniżej progu'
            className={toggleBadgeClass(amp.params.gate, "cyan")}>
            <ShieldOff size={12} />
            Gate {amp.params.gate ? "ON" : "OFF"}
          </button>
        }
        contentClassName={amp.params.namEnabled ? "opacity-40" : undefined}>
        <div className='flex flex-wrap justify-center gap-7'>
          <Knob label='Preamp' size={76} value={amp.params.preampGain} accent='cyan' onChange={(v) => set({ preampGain: v })} />
          <Knob label='Drive' size={76} value={amp.params.drive} accent='cyan' onChange={(v) => set({ drive: v })} />
          <Knob label='Bass' size={76} value={amp.params.bass} accent='cyan' onChange={(v) => set({ bass: v })} />
          <Knob label='Mid' size={76} value={amp.params.mid} accent='cyan' onChange={(v) => set({ mid: v })} />
          <Knob label='Treble' size={76} value={amp.params.treble} accent='cyan' onChange={(v) => set({ treble: v })} />
          <Knob label='Level' size={76} value={amp.params.level} accent='cyan' onChange={(v) => set({ level: v })} />
        </div>
      </SectionPanel>

      {/* ── Cabinet: synthetic vs. loaded IR ────────────────────────────── */}
      <SectionPanel
        title='Kolumna (cabinet)'
        icon={<Speaker size={14} />}
        accent='emerald'
        headerRight={
          <button type='button' onClick={() => set({ cab: !amp.params.cab })} className={toggleBadgeClass(amp.params.cab, "emerald")}>
            <Speaker size={12} />
            {amp.params.cab ? "ON" : "OFF"}
          </button>
        }
        contentClassName={cn("flex flex-col gap-2", (!amp.params.cab || amp.params.namEnabled) && "opacity-40")}>
        <button
          type='button'
          disabled={!amp.params.cab}
          onClick={() => set({ irId: null })}
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
            amp.params.irId === null ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800"
          )}>
          Wbudowana symulacja kolumny
          {amp.params.irId === null && <Check size={14} />}
        </button>

        {irs.map((ir) => (
          <div
            key={ir.id}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              amp.params.irId === ir.id ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800/40 text-zinc-300"
            )}>
            <button
              type='button'
              disabled={!amp.params.cab}
              onClick={() => set({ irId: ir.id })}
              className='flex flex-1 items-center gap-2 text-left'>
              {ir.name}
              {ir.truncated && (
                <span className='rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400'>skrócone</span>
              )}
              {amp.params.irId === ir.id && <Check size={14} />}
            </button>
            <button type='button' onClick={() => deleteIR(ir.id)} title='Usuń IR' className='p-1 text-zinc-500 hover:text-red-400'>
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        <button
          type='button'
          onClick={() => importIR()}
          disabled={importing}
          className='mt-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50'>
          <Upload size={14} />
          {importing ? "Wczytywanie…" : "Wgraj własny IR (.wav)"}
        </button>
      </SectionPanel>

      {/* ── Delay ────────────────────────────────────────────────────────── */}
      <SectionPanel
        title='Delay'
        icon={<Repeat2 size={14} />}
        accent='amber'
        headerRight={
          <button type='button' onClick={() => set({ delayEnabled: !amp.params.delayEnabled })} className={toggleBadgeClass(amp.params.delayEnabled, "amber")}>
            {amp.params.delayEnabled ? "Włączony" : "Wyłączony"}
          </button>
        }
        contentClassName={cn("flex justify-center gap-7", !amp.params.delayEnabled && "opacity-40")}>
        <Knob label='Time' value={amp.params.delayMs / 800} accent='amber' displayValue={`${Math.round(amp.params.delayMs)}ms`} onChange={(v) => set({ delayMs: v * 800 })} />
        <Knob label='Feedback' value={amp.params.delayFeedback} accent='amber' onChange={(v) => set({ delayFeedback: v })} />
        <Knob label='Mix' value={amp.params.delayMix} accent='amber' onChange={(v) => set({ delayMix: v })} />
      </SectionPanel>

      {/* ── Reverb ───────────────────────────────────────────────────────── */}
      <SectionPanel
        title='Reverb'
        icon={<Waves size={14} />}
        accent='purple'
        headerRight={
          <button type='button' onClick={() => set({ reverbEnabled: !amp.params.reverbEnabled })} className={toggleBadgeClass(amp.params.reverbEnabled, "purple")}>
            {amp.params.reverbEnabled ? "Włączony" : "Wyłączony"}
          </button>
        }
        contentClassName={cn("flex justify-center gap-7", !amp.params.reverbEnabled && "opacity-40")}>
        <Knob label='Size' value={amp.params.reverbSize} accent='purple' onChange={(v) => set({ reverbSize: v })} />
        <Knob label='Damping' value={amp.params.reverbDamping} accent='purple' onChange={(v) => set({ reverbDamping: v })} />
        <Knob label='Mix' value={amp.params.reverbMix} accent='purple' onChange={(v) => set({ reverbMix: v })} />
      </SectionPanel>

      {/* ── Presets ──────────────────────────────────────────────────────── */}
      <SectionPanel title='Presety' icon={<Disc3 size={14} />} accent='cyan'>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
          {presets.map((preset) => (
            <div
              key={preset.id}
              className={cn(
                "group relative flex flex-col gap-1 rounded-lg p-3 text-left transition-background",
                activePresetId === preset.id ? "bg-cyan-500/10 text-cyan-400" : "bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800/60"
              )}>
              <button type='button' onClick={() => loadPreset(preset.id)} className='flex items-center gap-1.5 text-sm font-medium'>
                {activePresetId === preset.id && <Check size={13} />}
                {preset.name}
              </button>
              <span className='text-[11px] text-zinc-500'>{preset.builtIn ? "wbudowany" : "własny"}</span>
              {!preset.builtIn && (
                <button
                  type='button'
                  onClick={() => deletePreset(preset.id)}
                  title='Usuń preset'
                  className='absolute right-2 top-2 text-zinc-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100'>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className='mt-4 flex items-center gap-2'>
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder='Nazwa nowego presetu'
            className='w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50'
          />
          <button
            type='button'
            onClick={handleSavePreset}
            disabled={!presetName.trim()}
            className='flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20 disabled:opacity-40'>
            <Save size={14} />
            Zapisz
          </button>
        </div>
      </SectionPanel>
    </div>
  );
};
