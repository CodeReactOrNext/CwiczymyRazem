import { cn } from "assets/lib/utils";
import { AudioSelect } from "feature/toneStudio/components/AudioSelect";
import { InputMeter } from "feature/toneStudio/components/InputMeter";
import { Knob } from "feature/toneStudio/components/Knob";
import { chainBlockLabel } from "feature/toneStudio/utils/chain";
import { CHAIN_BLOCKS, type ToneAccent } from "feature/toneStudio/utils/chain";
import { AMP_HEAD_SRC } from "feature/toneStudio/utils/gearArt";
import { isPresetModified } from "feature/toneStudio/utils/presetDiff";
import { useAmpSim } from "hooks/useAmpSim";
import { useNativeAudioDevices } from "hooks/useNativeAudioDevices";
import { RippleButton } from "hooks/useRipple";
import { useTonePresets } from "hooks/useTonePresets";
import { useTranslation } from "hooks/useTranslation";
import {
  ChevronRight,
  Power,
  RefreshCw,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Speaker,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface AmpSimButtonProps {
  /** Icon-only trigger to match the compact toolbar layout. */
  compact?: boolean;
  /** Height class to align with sibling toolbar buttons (e.g. "h-12" / "h-8"). */
  h?: string;
  /** "titlebar" is the desktop strip's pill — the same shape and ink as its
   *  nav buttons, state shown by a dot and a tint rather than a filled block.
   *  "toolbar" (default) is the session/timer toolbar's square button. */
  variant?: "toolbar" | "titlebar";
}

/** The three buffer sizes a player actually chooses between — the full smp
 *  list lives in Tone Studio for the curious. */
const LATENCY_PRESETS: { label: string; size: number }[] = [
  { label: "Low", size: 128 },
  { label: "Balanced", size: 256 },
  { label: "Safe", size: 512 },
];

/** DSP load (fraction of the block's real-time budget) above which the chain
 *  is one hiccup away from dropping blocks — same threshold Tone Studio tints. */
const DSP_OVERLOAD_RATIO = 0.9;

const CHIP_ON: Record<ToneAccent, string> = {
  cyan: "bg-cyan-500/15 text-cyan-300",
  amber: "bg-amber-500/15 text-amber-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
  purple: "bg-purple-500/15 text-purple-300",
  orange: "bg-orange-500/15 text-orange-300",
};

const smallButton =
  "flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs transition-colors disabled:opacity-50";
const secondaryButton =
  "flex-1 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-white";

/**
 * Electron-only amp simulator control. Renders nothing on the web build
 * (window.nativeAmp is absent). Toggles real-time monitoring, lets the user pick
 * which audio interface + saved tone preset to use, plus a basic level control.
 * Deep tone-shaping (drive/EQ/delay/IR) lives on the /tone-studio page.
 *
 * Mounted both in the app header and in the practice-session toolbar. Both read
 * the same store (feature/toneStudio/services/ampSimStore), so they always agree
 * on whether the amp is on, and neither one unmounting stops it.
 */
export const AmpSimButton = ({
  compact = false,
  h = "h-12",
  variant = "toolbar",
}: AmpSimButtonProps) => {
  const amp = useAmpSim();
  const { devices, api, selectedId, loading, refresh, select } =
    useNativeAudioDevices();
  const { presets, savePreset, updatePreset } = useTonePresets();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation("tone_studio");
  // Interface/latency are "set once" settings — folded away so the things
  // touched every session (power, preset, level) stay on top.
  const [interfaceOpen, setInterfaceOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [presetName, setPresetName] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Custom popover (not the shared Radix DropdownMenu — its roving-focus/typeahead
  // handling fights with the pickers inside), so click-outside/Escape need to be
  // wired up by hand. The pickers themselves render their listbox in a body-level
  // portal, so both handlers have to treat an open Radix popper as "inside".
  useEffect(() => {
    if (!open) return undefined;
    const isInsidePopper = (node: Node | null) =>
      node instanceof Element &&
      node.closest("[data-radix-popper-content-wrapper]") !== null;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (isInsidePopper(target)) return;
      if (rootRef.current && target && !rootRef.current.contains(target))
        setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Let an open picker swallow the first Escape instead of closing everything.
      if (document.querySelector("[data-radix-popper-content-wrapper]")) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!amp.available) return null;

  const handleSelectDevice = async (id: number) => {
    select(id);
    await amp.restart(); // re-open on the new interface if currently running
  };

  const handleSelectPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    amp.loadPreset(id, preset.params);
  };

  const activePreset = presets.find((p) => p.id === amp.activePresetId);
  const modified =
    !!activePreset && isPresetModified(amp.params, activePreset.params);

  const handleRevert = () => {
    if (activePreset) amp.loadPreset(activePreset.id, activePreset.params);
  };

  const handleUpdatePreset = async () => {
    if (!activePreset || activePreset.builtIn) return;
    await updatePreset(activePreset, amp.params);
  };

  const handleSaveAs = async () => {
    const name = presetName.trim();
    if (!name) return;
    const saved = await savePreset(name, amp.params);
    setNaming(false);
    setPresetName("");
    if (saved) amp.setActivePresetId(saved.id);
  };

  const selectedDevice = devices.find((d) => d.id === selectedId);
  const sampleRate = amp.info?.sampleRate || 48000;
  const bufferMs = (size: number) => ((size / sampleRate) * 1000).toFixed(1);
  const latencyChoices = LATENCY_PRESETS.some((p) => p.size === amp.bufferSize)
    ? LATENCY_PRESETS
    : [...LATENCY_PRESETS, { label: "Custom", size: amp.bufferSize }];
  const latencyLabel = (label: string) =>
    t(`amp_button.latency_preset.${label.toLowerCase()}`, label);

  const reconnecting =
    amp.connectionIssue?.status === "lost" ||
    amp.connectionIssue?.status === "retrying";
  const dropouts = amp.diagnostics?.underruns ?? 0;
  const dspRatio = amp.diagnostics
    ? amp.diagnostics.dspAvgMs /
      ((amp.diagnostics.frameSize / amp.diagnostics.sampleRate) * 1000)
    : 0;
  const overloaded = !!amp.overload || dspRatio >= DSP_OVERLOAD_RATIO;

  // One line under the title that answers "is sound coming out, is it clean,
  // and how late?" — the raw counters stay in Tone Studio.
  const health: "off" | "starting" | "reconnecting" | "bad" | "glitchy" | "ok" =
    amp.isBusy
      ? "starting"
      : !amp.isOn
        ? "off"
        : reconnecting
          ? "reconnecting"
          : overloaded
            ? "bad"
            : dropouts > 0
              ? "glitchy"
              : "ok";
  const latency = amp.info ? `~${amp.info.roundTripMs.toFixed(0)} ms` : null;
  const live = latency
    ? t("amp_button.live_with", { latency })
    : t("amp_button.live");
  const statusLine = {
    starting: t("amp_button.starting"),
    off: t("amp_button.monitoring_off"),
    reconnecting: t("amp_button.reconnecting"),
    bad: `${live} · ${t("amp_button.dsp_overloaded")}`,
    glitchy: `${live} · ${t("amp_button.dropouts", { count: dropouts })}`,
    ok: latency ? t("amp_button.live_latency", { latency }) : live,
  }[health];
  const dotClass = {
    starting: "animate-pulse bg-zinc-500",
    off: "bg-zinc-600",
    reconnecting: "animate-pulse bg-amber-400",
    bad: "animate-pulse bg-red-400",
    glitchy: "bg-amber-400",
    ok: "animate-pulse bg-cyan-400",
  }[health];
  const needsAttention = health === "reconnecting" || health === "bad";

  // Cyan matches this toolbar's own "engaged" convention (Pitch Detect = emerald,
  // Tuner = violet, each on a -950/-400 pair) — red would read as an error state.
  // Amber = a running stream is in trouble; worth opening the popover.
  const triggerColor = needsAttention
    ? "bg-amber-950 text-amber-400 hover:bg-amber-900"
    : amp.isOn
      ? "bg-cyan-950 text-cyan-400 hover:bg-cyan-900"
      : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700";

  // The title bar's pill: the nav buttons' ink (zinc-900 on zinc-950) at rest,
  // a wash of the state colour when live, and a small lamp instead of a
  // pulsing icon — a thin strip wants a quieter signal than a toolbar does.
  const pillColor = needsAttention
    ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/15"
    : amp.isOn
      ? "bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/15"
      : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100";

  const trigger =
    variant === "titlebar" ? (
      <RippleButton
        onClick={() => setOpen((o) => !o)}
        title={needsAttention ? statusLine : t("amp_button.title")}
        className={cn(
          "flex items-center gap-1.5 rounded-full pl-2.5 pr-3 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50",
          h,
          pillColor,
        )}>
        <Speaker className='h-3.5 w-3.5 shrink-0' />
        <span>{amp.isOn ? t("amp_button.amp_on") : t("amp_button.amp")}</span>
        {(amp.isOn || needsAttention) && (
          <span
            aria-hidden
            className={cn(
              "h-1.5 w-1.5 shrink-0 animate-pulse rounded-full",
              needsAttention ? "bg-amber-400" : "bg-cyan-400",
            )}
          />
        )}
      </RippleButton>
    ) : (
      <RippleButton
        onClick={() => setOpen((o) => !o)}
        title={needsAttention ? statusLine : t("amp_button.title")}
        className={cn(
          "flex items-center rounded-lg outline-none transition-all focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50 active:scale-95",
          compact
            ? "h-8 w-8 justify-center active:scale-90"
            : cn("gap-2 px-4", h),
          triggerColor,
        )}>
        <Speaker
          className={cn(
            compact ? "h-3.5 w-3.5" : "h-4 w-4 shrink-0",
            (amp.isOn || needsAttention) && "animate-pulse",
          )}
        />
        {!compact && (
          <span className='text-[10px] font-semibold tracking-wide'>
            {needsAttention
                ? t("amp_button.amp_alert")
                : amp.isOn
                  ? t("amp_button.amp_on_caps")
                  : t("amp_button.amp_caps")}
          </span>
        )}
      </RippleButton>
    );

  return (
    <div className='relative' ref={rootRef}>
      {trigger}

      {open && (
        <div className='absolute right-0 z-[99999999] mt-2 flex w-80 flex-col gap-4 rounded-lg bg-zinc-900/95 p-5 text-left text-white backdrop-blur-md'>
          {/* ── Header: what it is + is it live ─────────────────────────────── */}
          <div className='flex items-center gap-3'>
            {/* The rig itself rather than a speaker glyph — this popover is the
                amp's face on every page outside Tone Studio, and it dims with
                the engine so a glance says whether anything is running. */}
            <img
              src={AMP_HEAD_SRC}
              alt=''
              draggable={false}
              className={cn(
                "h-auto w-[72px] shrink-0 select-none rounded transition-opacity",
                amp.isOn ? "opacity-100" : "opacity-45",
              )}
            />
            <div className='min-w-0 flex-1'>
              <div className='text-sm font-semibold leading-tight'>
                {t("amp_button.amp")}
              </div>
              <div className='mt-1 flex items-center gap-1.5 text-[11px] text-zinc-400'>
                <span
                  className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)}
                />
                <span>{statusLine}</span>
              </div>
            </div>
          </div>

          {/* ── Power: the one thing you reach for most, so it gets a full row ─ */}
          <button
            type='button'
            onClick={() => amp.toggle()}
            disabled={amp.isBusy}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
              amp.isOn
                ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                : "bg-cyan-500 text-zinc-950 hover:bg-cyan-400",
            )}>
            <Power size={15} />
            {amp.isOn ? t("power.turn_off") : t("power.turn_on")}
          </button>

          {amp.isOn && <InputMeter />}

          {/* ── Tone: what you actually change mid-session ─────────────────── */}
          <div className='flex items-center gap-4'>
            <AudioSelect
              className='flex-1'
              size='sm'
              label={t("amp_button.preset")}
              labelRight={
                modified ? (
                  <span className='text-[11px] text-amber-400'>
                    {t("amp_button.modified")}
                  </span>
                ) : undefined
              }
              value={amp.activePresetId ?? ""}
              onValueChange={handleSelectPreset}
              placeholder={
                presets.length
                  ? t("amp_button.select_preset")
                  : t("amp_button.no_presets")
              }
              options={presets.map((p) => ({
                value: p.id,
                label: p.name,
                hint: p.builtIn ? t("rack.built_in") : undefined,
              }))}
            />
            <Knob
              label='Level'
              value={amp.params.level}
              size={44}
              ring={false}
              accent='cyan'
              defaultValue={0.5}
              onChange={(v) => amp.setParams({ level: v })}
            />
          </div>

          {modified &&
            activePreset &&
            (naming ? (
              <div className='flex items-center gap-2'>
                <input
                  type='text'
                  autoFocus
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveAs();
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      setNaming(false);
                    }
                  }}
                  placeholder={t("amp_button.new_preset_name")}
                  className='h-8 min-w-0 flex-1 rounded-lg bg-zinc-800/70 px-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40'
                />
                <button
                  type='button'
                  onClick={handleSaveAs}
                  disabled={!presetName.trim()}
                  className={cn(
                    smallButton,
                    "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25",
                  )}>
                  <Save size={13} />
                  {t("presets.save")}
                </button>
                <button
                  type='button'
                  onClick={() => setNaming(false)}
                  title={t("common.cancel")}
                  className={cn(
                    smallButton,
                    "px-2 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                  )}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={handleRevert}
                  title={t("amp_button.revert_hint", { name: activePreset.name })}
                  className={cn(smallButton, secondaryButton)}>
                  <RotateCcw size={13} />
                  {t("amp_button.revert")}
                </button>
                {activePreset.builtIn ? (
                  <button
                    type='button'
                    onClick={() => setNaming(true)}
                    title={t("amp_button.builtin_readonly")}
                    className={cn(smallButton, secondaryButton)}>
                    <Save size={13} />
                    {t("amp_button.save_as")}
                  </button>
                ) : (
                  <button
                    type='button'
                    onClick={handleUpdatePreset}
                    title={t("presets.overwrite_hint", { name: activePreset.name })}
                    className={cn(smallButton, secondaryButton)}>
                    <Save size={13} />
                    {t("amp_button.update_preset")}
                  </button>
                )}
              </div>
            ))}

          {/* ── Chain: bypass a block without touching the preset ──────────── */}
          <div className='flex flex-col gap-1.5'>
            <span className='text-xs text-zinc-400'>
              {t("amp_button.chain")}
            </span>
            <div className='flex flex-wrap gap-1.5'>
              {CHAIN_BLOCKS.map((block) => {
                const active = block.isActive(amp.params);
                const label = chainBlockLabel(block, amp.params, t);
                const chip = cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? CHIP_ON[block.accent]
                    : "bg-zinc-800/60 text-zinc-500",
                );
                const toggle = block.toggle;
                if (!toggle) {
                  return (
                    <span key={block.key} className={chip}>
                      {label}
                    </span>
                  );
                }
                return (
                  <button
                    key={block.key}
                    type='button'
                    onClick={() => amp.setParams(toggle(amp.params))}
                    title={
                      active
                        ? t("rack.bypass", { name: label })
                        : t("amp_button.enable", { name: label })
                    }
                    className={cn(chip, !active && "hover:text-zinc-300")}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Interface + latency: set once, folded away afterwards ──────── */}
          <div className='flex flex-col gap-3 rounded-lg bg-zinc-800/30 p-3'>
            <button
              type='button'
              onClick={() => setInterfaceOpen((v) => !v)}
              aria-expanded={interfaceOpen}
              className='flex w-full items-center gap-2 text-left'>
              <ChevronRight
                size={14}
                className={cn(
                  "shrink-0 text-zinc-500 transition-transform",
                  interfaceOpen && "rotate-90",
                )}
              />
              <span className='text-xs text-zinc-400'>
                {t("amp_button.interface")}
              </span>
              {!interfaceOpen && (
                <span className='min-w-0 flex-1 truncate text-right text-[11px] text-zinc-500'>
                  {selectedDevice
                    ? `${selectedDevice.name} · ${amp.bufferSize} smp`
                    : t("amp_button.not_set_up")}
                </span>
              )}
            </button>

            {interfaceOpen && (
              <>
                <AudioSelect
                  size='sm'
                  label={`${t("settings.input")}${api ? ` (${api})` : ""}`}
                  labelRight={
                    <RippleButton
                      onClick={() => refresh()}
                      title={t("settings.refresh_hint")}
                      className='rounded p-0.5 text-zinc-500 transition-colors hover:text-white'>
                      <RefreshCw
                        size={12}
                        className={loading ? "animate-spin" : ""}
                      />
                    </RippleButton>
                  }
                  value={selectedId !== null ? String(selectedId) : ""}
                  onValueChange={(v) => handleSelectDevice(Number(v))}
                  placeholder={
                    devices.length
                      ? t("amp_button.select_interface")
                      : t("amp_button.no_input_devices")
                  }
                  options={devices.map((d) => ({
                    value: String(d.id),
                    label: d.name,
                    hint: t("settings.channels_in", { count: d.inputChannels }),
                  }))}
                />

                <div className='flex flex-col gap-1.5'>
                  <span className='text-xs text-zinc-400'>
                    {t("status.latency")}
                  </span>
                  <div className='grid grid-cols-3 gap-1.5'>
                    {latencyChoices.map((choice) => {
                      const active = choice.size === amp.bufferSize;
                      return (
                        <button
                          key={choice.size}
                          type='button'
                          onClick={() => amp.setBufferSize(choice.size)}
                          disabled={amp.isBusy}
                          title={t("amp_button.samples", { count: choice.size })}
                          className={cn(
                            "flex flex-col items-center rounded-lg py-1.5 transition-colors disabled:opacity-50",
                            active
                              ? "bg-cyan-500/15 text-cyan-300"
                              : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                          )}>
                          <span className='text-[11px] font-medium'>
                            {latencyLabel(choice.label)}
                          </span>
                          <span className='text-[10px] opacity-70'>
                            ~{bufferMs(choice.size)} ms
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <span className='text-[11px] text-zinc-500'>
                    {t("amp_button.crackling")}
                  </span>
                </div>
              </>
            )}
          </div>

          {(amp.error ||
            amp.overload ||
            health === "glitchy" ||
            amp.connectionIssue?.status === "recovered") && (
            <div className='flex flex-col gap-2'>
              {amp.error && (
                <p className='rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-400'>
                  {amp.error}
                </p>
              )}
              {amp.overload && (
                <p className='rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400'>
                  {t("amp_button.overload", {
                    drift: Math.round(amp.overload.driftMs),
                  })}
                  {amp.overload.namEnabled &&
                    ` ${t("amp_button.overload_nam_hint")}`}
                </p>
              )}
              {health === "glitchy" && !interfaceOpen && (
                <button
                  type='button'
                  onClick={() => setInterfaceOpen(true)}
                  className='rounded-lg bg-amber-500/10 px-3 py-2 text-left text-[11px] text-amber-400 transition-colors hover:bg-amber-500/15'>
                  {t("amp_button.dropouts_detected")}
                </button>
              )}
              {amp.connectionIssue?.status === "recovered" && (
                <p className='rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-400'>
                  {t("amp_button.reconnected")}
                </p>
              )}
            </div>
          )}

          <Link
            href='/tone-studio'
            className='flex items-center justify-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white'>
            <SlidersHorizontal size={13} />
            {t("amp_button.open_tone_studio")}
          </Link>
        </div>
      )}
    </div>
  );
};
