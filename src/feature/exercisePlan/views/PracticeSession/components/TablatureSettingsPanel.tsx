import { cn } from "assets/lib/utils";
import {
  METRONOME_SOUND_ORDER,
  METRONOME_SOUNDS,
  type MetronomeSoundKey,
} from "feature/exercisePlan/components/Metronome/utils/clickTones";
import { previewMetronomeSound } from "feature/exercisePlan/components/Metronome/utils/previewMetronomeSound";
import { useHandednessStore, useIsLeftHanded } from "hooks/useHandedness";
import { useTranslation } from "hooks/useTranslation";
import type { LucideIcon } from "lucide-react";
import {
  AlignJustify,
  Bell,
  Cpu,
  Disc,
  Drumstick,
  Music,
  RotateCcw,
  TreePine,
  Waves,
} from "lucide-react";
import type { ReactNode } from "react";

import type { PillPresetKey } from "./tablaturePillPresets";
import { PILL_PRESET_ORDER, PILL_PRESETS } from "./tablaturePillPresets";
import type {
  BackgroundKey,
  DefaultViewMode,
  FretTextKey,
  HitColorKey,
  NoteStyleKey,
  PaletteKey,
  TablatureSettings,
} from "./tablatureSettings";
import {
  BACKGROUNDS,
  FRET_FONT_MAX,
  FRET_FONT_MIN,
  FRET_TEXT_COLORS,
  HIT_COLORS,
  NOTATION_SPACING_MAX,
  NOTATION_SPACING_MIN,
  NOTATION_ZOOM_MAX,
  NOTATION_ZOOM_MIN,
  NOTE_SPACING_MAX,
  NOTE_SPACING_MIN,
  NOTE_STYLES,
  STRING_PALETTES,
  STRING_SPACING_MAX,
  STRING_SPACING_MIN,
  useTablatureSettings,
} from "./tablatureSettings";

interface SectionProps {
  title: string;
  hint?: string;
  children: ReactNode;
}

/** Styleguide: sections are separated by background + space, never by rules. */
function Section({ title, hint, children }: SectionProps) {
  return (
    <section className='rounded-lg bg-zinc-900/40 p-5'>
      <h3 className='text-xs font-semibold tracking-wide text-zinc-300'>
        {title}
      </h3>
      {hint && <p className='mt-1 text-[11px] text-zinc-500'>{hint}</p>}
      <div className='mt-4'>{children}</div>
    </section>
  );
}

interface ToggleRowProps {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ label, desc, checked, onChange }: ToggleRowProps) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className='flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50 hover:bg-white/5'>
      <span className='min-w-0 flex-1'>
        <span className='block text-xs font-semibold text-zinc-100'>
          {label}
        </span>
        <span className='block text-[11px] text-zinc-500'>{desc}</span>
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-cyan-500/80" : "bg-zinc-700",
        )}>
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-[1.125rem]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

interface OptionCardProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function OptionCard({ active, onClick, children }: OptionCardProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col gap-2 rounded-lg p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50",
        active ? "bg-cyan-500/10" : "bg-zinc-800/40 hover:bg-zinc-800/80",
      )}>
      {children}
    </button>
  );
}

/** Scaled-down preview of a pill preset, drawn with its real height/corner ratio. */
function PillSwatch({ presetKey }: { presetKey: PillPresetKey }) {
  const { height, corner } = PILL_PRESETS[presetKey];
  return (
    <span
      className='block bg-cyan-400'
      style={{ height, width: height * 1.9, borderRadius: corner }}
    />
  );
}

/** A long note drawn the way each note style renders it on the tab. */
function NoteStyleSwatch({ styleKey }: { styleKey: NoteStyleKey }) {
  if (styleKey === "bar") {
    return <span className='block h-5 w-20 rounded bg-cyan-400' />;
  }
  return (
    <span className='relative flex h-5 w-20 items-center'>
      <span className='absolute inset-x-2 h-2 rounded-full bg-cyan-400/40' />
      <span className='relative h-5 w-5 rounded bg-cyan-400' />
    </span>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

/**
 * Native range input rather than the Radix slider: wrapping it in the <label>
 * gives the control a real accessible name (Radix puts role="slider" on an inner
 * thumb that a Root-level aria-label never reaches).
 */
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: SliderRowProps) {
  return (
    <label className='block'>
      <div className='mb-2 flex items-center justify-between text-[11px] font-semibold text-zinc-400'>
        <span>{label}</span>
        <span className='font-mono tabular-nums text-zinc-500'>{display}</span>
      </div>
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className='w-full accent-cyan-500'
      />
    </label>
  );
}

const DEFAULT_VIEW_OPTIONS: {
  key: DefaultViewMode;
  label: string;
  desc: string;
  Icon: LucideIcon;
}[] = [
  {
    key: "tab",
    label: "Tablature",
    desc: "Classic fretboard tab",
    Icon: AlignJustify,
  },
  {
    key: "notation",
    label: "Notation",
    desc: "Standard sheet music",
    Icon: Music,
  },
];

/** A glyph per click sound — the picker has nothing visual to swatch. */
const METRONOME_SOUND_ICONS: Record<MetronomeSoundKey, LucideIcon> = {
  classic: Waves,
  wood: TreePine,
  digital: Cpu,
  sticks: Drumstick,
  hihat: Disc,
  cowbell: Bell,
};

function ResetButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-400 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50 hover:bg-white/5 hover:text-white'>
      <RotateCcw className='h-3.5 w-3.5' />
      {label}
    </button>
  );
}

/**
 * All flat-tablature look settings. Shared by the in-session dialog and the
 * settings page, both of which drive the same persisted store — so whatever
 * preview is on screen updates as the controls move.
 */
export function TablatureSettingsPanel() {
  const { t } = useTranslation(["tab_settings", "metronome"]);
  const settings = useTablatureSettings();
  const { set, reset } = settings;
  // Handedness lives in its own store: it is a property of the player rather
  // than of the tab, and it drives the neck diagrams in the drills too.
  const leftHanded = useIsLeftHanded();
  const setLeftHanded = useHandednessStore((state) => state.setLeftHanded);

  const toggles: {
    key: keyof TablatureSettings;
    label: string;
    desc: string;
  }[] = [
    {
      key: "showRhythmLane",
      label: t("toggles.rhythm_lane"),
      desc: t("toggles.rhythm_lane_desc"),
    },
    {
      key: "showChordNames",
      label: t("toggles.chord_names"),
      desc: t("toggles.chord_names_desc"),
    },
    {
      key: "showTuningGutter",
      label: t("toggles.tuning_gutter"),
      desc: t("toggles.tuning_gutter_desc"),
    },
    {
      key: "showMeasureLines",
      label: t("toggles.measure_lines"),
      desc: t("toggles.measure_lines_desc"),
    },
    {
      key: "showTechniqueLabels",
      label: t("toggles.technique"),
      desc: t("toggles.technique_desc"),
    },
  ];

  return (
    <div className='space-y-4'>
      {/* The two sections with sliders come first — they're the ones players
          reach for most, mid-session, to fit more on screen or read fret
          numbers more easily. */}
      <Section
        title={t("spacing")}
        hint={t("spacing_hint")}>
        <div className='grid gap-x-8 gap-y-4 sm:grid-cols-2'>
          <SliderRow
            label={t("note_spacing")}
            value={settings.noteSpacing}
            min={NOTE_SPACING_MIN}
            max={NOTE_SPACING_MAX}
            step={0.05}
            display={`${Math.round(settings.noteSpacing * 100)}%`}
            onChange={(v) => set("noteSpacing", Math.round(v * 100) / 100)}
          />
          <SliderRow
            label={t("string_spacing")}
            value={settings.stringSpacing}
            min={STRING_SPACING_MIN}
            max={STRING_SPACING_MAX}
            step={1}
            display={`${settings.stringSpacing}px`}
            onChange={(v) => set("stringSpacing", Math.round(v))}
          />
        </div>
      </Section>

      <Section title={t("fret_numbers")}>
        <SliderRow
          label={t("size")}
          value={settings.fretFontScale}
          min={FRET_FONT_MIN}
          max={FRET_FONT_MAX}
          step={0.05}
          display={`${Math.round(settings.fretFontScale * 100)}%`}
          onChange={(v) => set("fretFontScale", v)}
        />
        <div className='mt-4 grid grid-cols-3 gap-2'>
          {(Object.keys(FRET_TEXT_COLORS) as FretTextKey[]).map((key) => (
            <OptionCard
              key={key}
              active={settings.fretTextColor === key}
              onClick={() => set("fretTextColor", key)}>
              <span className='flex h-8 items-center'>
                <span
                  className='flex h-7 w-full items-center justify-center rounded-md bg-cyan-400 text-xs font-bold'
                  style={{ color: FRET_TEXT_COLORS[key].color ?? "#000000" }}>
                  {key === "auto" ? "A" : "5"}
                </span>
              </span>
              <span className='text-xs font-semibold text-zinc-100'>
                {t(`fret_text.${key}.label`, FRET_TEXT_COLORS[key].label)}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {t(`fret_text.${key}.desc`, FRET_TEXT_COLORS[key].desc)}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title={t("default_view")}
        hint={t("default_view_hint")}>
        <div className='grid grid-cols-2 gap-2'>
          {DEFAULT_VIEW_OPTIONS.map(({ key, label, desc, Icon }) => (
            <OptionCard
              key={key}
              active={settings.defaultViewMode === key}
              onClick={() => set("defaultViewMode", key)}>
              <span className='flex h-8 items-center'>
                <Icon className='h-5 w-5 text-zinc-200' />
              </span>
              <span className='flex items-center gap-1.5 text-xs font-semibold text-zinc-100'>
                {t(`views.${key}.label`, label)}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {t(`views.${key}.desc`, desc)}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title={t("metronome_sound")}
        hint={t("metronome_sound_hint")}>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
          {METRONOME_SOUND_ORDER.map((key) => {
            const Icon = METRONOME_SOUND_ICONS[key];
            return (
              <OptionCard
                key={key}
                active={settings.metronomeSound === key}
                onClick={() => {
                  set("metronomeSound", key);
                  previewMetronomeSound(key);
                }}>
                <span className='flex h-8 items-center'>
                  <Icon className='h-5 w-5 text-zinc-200' />
                </span>
                <span className='text-xs font-semibold text-zinc-100'>
                  {t(`metronome:sounds.${key}.label`, METRONOME_SOUNDS[key].label)}
                </span>
                <span className='text-[10px] leading-tight text-zinc-500'>
                  {t(`metronome:sounds.${key}.desc`, METRONOME_SOUNDS[key].desc)}
                </span>
              </OptionCard>
            );
          })}
        </div>
      </Section>

      <Section
        title={t("note_pills")}
        hint={t("note_pills_hint")}>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          {PILL_PRESET_ORDER.map((key) => (
            <OptionCard
              key={key}
              active={settings.pillPreset === key}
              onClick={() => set("pillPreset", key)}>
              <span className='flex h-8 items-center'>
                <PillSwatch presetKey={key} />
              </span>
              <span className='text-xs font-semibold text-zinc-100'>
                {t(`pills.${key}.label`, PILL_PRESETS[key].label)}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {t(`pills.${key}.desc`, PILL_PRESETS[key].desc)}
              </span>
            </OptionCard>
          ))}
        </div>
        <div className='mt-4 grid grid-cols-2 gap-2'>
          {(Object.keys(NOTE_STYLES) as NoteStyleKey[]).map((key) => (
            <OptionCard
              key={key}
              active={settings.noteStyle === key}
              onClick={() => set("noteStyle", key)}>
              <span className='flex h-8 items-center'>
                <NoteStyleSwatch styleKey={key} />
              </span>
              <span className='text-xs font-semibold text-zinc-100'>
                {t(`note_styles.${key}.label`, NOTE_STYLES[key].label)}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {t(`note_styles.${key}.desc`, NOTE_STYLES[key].desc)}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title={t("string_palette")}
        hint={t("string_palette_hint")}>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-4'>
          {(Object.keys(STRING_PALETTES) as PaletteKey[]).map((key) => (
            <OptionCard
              key={key}
              active={settings.palette === key}
              onClick={() => set("palette", key)}>
              <span className='flex h-8 items-center gap-1'>
                {STRING_PALETTES[key].colors.map((c) => (
                  <span
                    key={c}
                    className='h-5 w-2.5 rounded-sm'
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span className='text-xs font-semibold text-zinc-100'>
                {t(`palettes.${key}.label`, STRING_PALETTES[key].label)}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {t(`palettes.${key}.desc`, STRING_PALETTES[key].desc)}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title={t("hit_colour")}
        hint={t("hit_colour_hint")}>
        <div className='grid grid-cols-3 gap-2 sm:grid-cols-6'>
          {(Object.keys(HIT_COLORS) as HitColorKey[]).map((key) => (
            <OptionCard
              key={key}
              active={settings.hitColor === key}
              onClick={() => set("hitColor", key)}>
              <span className='flex h-8 items-center'>
                <span
                  className='h-5 w-full rounded-md'
                  style={{ backgroundColor: HIT_COLORS[key].fill }}
                />
              </span>
              <span className='text-xs font-semibold text-zinc-100'>
                {t(`hit_colors.${key}`, HIT_COLORS[key].label)}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title={t("board_background")}
        hint={t("board_background_hint")}>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          {(Object.keys(BACKGROUNDS) as BackgroundKey[]).map((key) => (
            <OptionCard
              key={key}
              active={settings.background === key}
              onClick={() => set("background", key)}>
              <span className='flex h-8 items-center'>
                <span
                  className='h-7 w-full rounded-md ring-1 ring-inset ring-white/10'
                  style={{ backgroundColor: BACKGROUNDS[key].color }}
                />
              </span>
              <span className='text-xs font-semibold text-zinc-100'>
                {t(`backgrounds.${key}.label`, BACKGROUNDS[key].label)}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {t(`backgrounds.${key}.desc`, BACKGROUNDS[key].desc)}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title={t("visible_elements")}
        hint={t("visible_elements_hint")}>
        <div className='space-y-1'>
          {toggles.map(({ key, label, desc }) => (
            <ToggleRow
              key={key}
              label={label}
              desc={desc}
              checked={settings[key] as boolean}
              onChange={(next) => set(key, next as never)}
            />
          ))}
        </div>
      </Section>

      <Section
        title={t("handedness")}
        hint={t("handedness_hint")}>
        <div className='space-y-1'>
          <ToggleRow
            label={t("mirror")}
            desc={t("mirror_desc")}
            checked={leftHanded}
            onChange={setLeftHanded}
          />
          <ToggleRow
            label={t("rtl")}
            desc={t("rtl_desc")}
            checked={settings.rightToLeft}
            onChange={(next) => set("rightToLeft", next)}
          />
          <ToggleRow
            label={t("flip")}
            desc={t("flip_desc")}
            checked={settings.flipStrings}
            onChange={(next) => set("flipStrings", next)}
          />
        </div>
      </Section>

      <Section title={t("feedback")}>
        <div className='space-y-1'>
          <ToggleRow
            label={t("hit_animations")}
            desc={t("hit_animations_desc")}
            checked={settings.hitAnimations}
            onChange={(next) => set("hitAnimations", next)}
          />
          <ToggleRow
            label={t("timing_hints")}
            desc={t("timing_hints_desc")}
            checked={settings.timingHints}
            onChange={(next) => set("timingHints", next)}
          />
          <ToggleRow
            label={t("ambient_glow")}
            desc={t("ambient_glow_desc")}
            checked={settings.ambientGlow}
            onChange={(next) => set("ambientGlow", next)}
          />
        </div>
      </Section>

      <ResetButton onClick={reset} label={t("reset")} />
    </div>
  );
}

/**
 * The standard-notation viewer's own settings — split out as its own live-preview
 * view (see TablatureAppearance) rather than a toggle bolted onto the flat-tab
 * panel above, even though it persists to the same tablature settings store.
 */
export function NotationSettingsPanel() {
  const { t } = useTranslation("tab_settings");
  const settings = useTablatureSettings();
  const { set } = settings;

  return (
    <div className='space-y-4'>
      <Section
        title={t("sizing")}
        hint={t("sizing_hint")}>
        <div className='grid gap-x-8 gap-y-4 sm:grid-cols-2'>
          <SliderRow
            label={t("zoom")}
            value={settings.notationZoom}
            min={NOTATION_ZOOM_MIN}
            max={NOTATION_ZOOM_MAX}
            step={0.05}
            display={`${Math.round(settings.notationZoom * 100)}%`}
            onChange={(v) => set("notationZoom", Math.round(v * 100) / 100)}
          />
          <SliderRow
            label={t("note_spacing")}
            value={settings.notationSpacing}
            min={NOTATION_SPACING_MIN}
            max={NOTATION_SPACING_MAX}
            step={0.05}
            display={`${Math.round(settings.notationSpacing * 100)}%`}
            onChange={(v) => set("notationSpacing", Math.round(v * 100) / 100)}
          />
        </div>
      </Section>

      <Section title={t("board")} hint={t("board_hint")}>
        <ToggleRow
          label={t("dark_score")}
          desc={t("dark_score_desc")}
          checked={settings.notationDarkMode}
          onChange={(next) => set("notationDarkMode", next)}
        />
      </Section>
    </div>
  );
}
