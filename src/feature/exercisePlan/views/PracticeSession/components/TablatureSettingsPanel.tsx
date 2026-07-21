import { cn } from "assets/lib/utils";
import type { LucideIcon } from "lucide-react";
import { AlignJustify, Box, Music, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import type { GemShapeKey, Highway3DThemeKey } from "./highway3dSettings";
import {
  GEM_SHAPE_ORDER,
  GEM_SHAPES,
  HIGHWAY3D_THEME_ORDER,
  HIGHWAY3D_THEMES,
  useHighway3DSettings,
} from "./highway3dSettings";
import type { PillPresetKey } from "./tablaturePillPresets";
import { PILL_PRESET_ORDER, PILL_PRESETS } from "./tablaturePillPresets";
import type {
  BackgroundKey,
  DefaultViewMode,
  FretTextKey,
  HitColorKey,
  PaletteKey,
  TablatureSettings,
} from "./tablatureSettings";
import {
  BACKGROUNDS,
  FRET_FONT_MAX,
  FRET_FONT_MIN,
  FRET_TEXT_COLORS,
  HIT_COLORS,
  NOTE_SPACING_MAX,
  NOTE_SPACING_MIN,
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

/** 2D stand-in for a highway gem silhouette, in the same landscape proportion. */
function GemSwatch({ shape }: { shape: GemShapeKey }) {
  if (shape === "hex") {
    return (
      <span
        className='block h-6 w-11 bg-cyan-400'
        style={{
          clipPath:
            "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
        }}
      />
    );
  }
  return (
    <span
      className='block h-6 w-11 bg-cyan-400'
      style={{
        borderRadius: shape === "coin" ? "9999px" : shape === "sharp" ? 0 : 6,
      }}
    />
  );
}

/** Miniature of a highway sky: the theme's own background with its nebula blobs. */
function ThemeSwatch({ themeKey }: { themeKey: Highway3DThemeKey }) {
  const { bg, nebula } = HIGHWAY3D_THEMES[themeKey];
  return (
    <span
      className='block h-12 w-full overflow-hidden rounded-md'
      style={{
        backgroundColor: bg,
        backgroundImage: [
          `radial-gradient(circle at 28% 62%, ${nebula[0]}, transparent 62%)`,
          `radial-gradient(circle at 74% 32%, ${nebula[1]}, transparent 58%)`,
          `radial-gradient(circle at 54% 88%, ${nebula[2]}, transparent 60%)`,
        ].join(","),
      }}
    />
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
 * thumb that a Root-level aria-label never reaches), and the 3D panel renders
 * nearly forty of these at once.
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
  beta?: boolean;
}[] = [
  {
    key: "tab",
    label: "Tablature",
    desc: "Classic fretboard tab",
    Icon: AlignJustify,
  },
  {
    key: "highway",
    label: "3D Highway",
    desc: "Beta — may be buggy",
    Icon: Box,
    beta: true,
  },
  {
    key: "notation",
    label: "Notation",
    desc: "Standard sheet music",
    Icon: Music,
  },
];

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
  const settings = useTablatureSettings();
  const { set, reset } = settings;

  const toggles: {
    key: keyof TablatureSettings;
    label: string;
    desc: string;
  }[] = [
    {
      key: "showRhythmLane",
      label: "Rhythm lane",
      desc: "Stems, beams and rests above the staff",
    },
    {
      key: "showChordNames",
      label: "Chord names",
      desc: "White chord pills over the bar",
    },
    {
      key: "showTuningGutter",
      label: "Tuning gutter",
      desc: "Pinned string names on the left",
    },
    {
      key: "showMeasureLines",
      label: "Measure lines",
      desc: "Vertical bar dividers",
    },
    {
      key: "showTechniqueLabels",
      label: "Technique markers",
      desc: "H/P, bends, PM, vibrato, harmonics",
    },
  ];

  return (
    <div className='space-y-4'>
      {/* The two sections with sliders come first — they're the ones players
          reach for most, mid-session, to fit more on screen or read fret
          numbers more easily. */}
      <Section
        title='Spacing'
        hint='How far apart notes sit across the bar and between strings.'>
        <div className='grid gap-x-8 gap-y-4 sm:grid-cols-2'>
          <SliderRow
            label='Note spacing'
            value={settings.noteSpacing}
            min={NOTE_SPACING_MIN}
            max={NOTE_SPACING_MAX}
            step={0.05}
            display={`${Math.round(settings.noteSpacing * 100)}%`}
            onChange={(v) => set("noteSpacing", Math.round(v * 100) / 100)}
          />
          <SliderRow
            label='String spacing'
            value={settings.stringSpacing}
            min={STRING_SPACING_MIN}
            max={STRING_SPACING_MAX}
            step={1}
            display={`${settings.stringSpacing}px`}
            onChange={(v) => set("stringSpacing", Math.round(v))}
          />
        </div>
      </Section>

      <Section title='Fret numbers'>
        <SliderRow
          label='Size'
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
                {FRET_TEXT_COLORS[key].label}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {FRET_TEXT_COLORS[key].desc}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title='Default view'
        hint='Which view opens automatically when you start a practice session.'>
        <div className='grid grid-cols-3 gap-2'>
          {DEFAULT_VIEW_OPTIONS.map(({ key, label, desc, Icon, beta }) => (
            <OptionCard
              key={key}
              active={settings.defaultViewMode === key}
              onClick={() => set("defaultViewMode", key)}>
              <span className='flex h-8 items-center'>
                <Icon className='h-5 w-5 text-zinc-200' />
              </span>
              <span className='flex items-center gap-1.5 text-xs font-semibold text-zinc-100'>
                {label}
                {beta && (
                  <span className='rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400'>
                    Beta
                  </span>
                )}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {desc}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title='Note pills'
        hint='Shape of the blocks carrying the fret numbers.'>
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
                {PILL_PRESETS[key].label}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {PILL_PRESETS[key].desc}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title='String palette'
        hint='One colour per string, high e first.'>
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
                {STRING_PALETTES[key].label}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {STRING_PALETTES[key].desc}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title='Hit colour'
        hint='Fills a note as you sustain it correctly.'>
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
                {HIT_COLORS[key].label}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title='Board background'
        hint='Colour behind the staff, gutter and fade.'>
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
                {BACKGROUNDS[key].label}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {BACKGROUNDS[key].desc}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title='Visible elements'
        hint='Hide layers you do not need to declutter the score.'>
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

      <Section title='Feedback'>
        <div className='space-y-1'>
          <ToggleRow
            label='Hit animations'
            desc='Flash and shockwave rings when a note lands'
            checked={settings.hitAnimations}
            onChange={(next) => set("hitAnimations", next)}
          />
          <ToggleRow
            label='Ambient mic glow'
            desc='Glow under the tab reacting to your playing volume'
            checked={settings.ambientGlow}
            onChange={(next) => set("ambientGlow", next)}
          />
        </div>
      </Section>

      <Section
        title='Notation'
        hint='The standard sheet-music viewer, separate from the fretboard tab above.'>
        <ToggleRow
          label='Dark score'
          desc='Black board with white staff and notes, instead of white paper'
          checked={settings.notationDarkMode}
          onChange={(next) => set("notationDarkMode", next)}
        />
      </Section>

      <ResetButton onClick={reset} label='Reset tablature settings' />
    </div>
  );
}

/**
 * The 3D highway's slider set — the same definitions the in-view panel uses,
 * laid out for a full-width settings page.
 */
export function Highway3DSettingsPanel() {
  const settings = useHighway3DSettings((s) => s.settings);
  const setGemShape = useHighway3DSettings((s) => s.setGemShape);
  const setPalette = useHighway3DSettings((s) => s.setPalette);
  const setTheme = useHighway3DSettings((s) => s.setTheme);
  const reset = useHighway3DSettings((s) => s.reset);

  return (
    <div className='space-y-4'>
      <Section
        title='Backdrop'
        hint='Sky, fog and the light around the hit line all change together.'>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
          {HIGHWAY3D_THEME_ORDER.map((key) => (
            <OptionCard
              key={key}
              active={settings.theme === key}
              onClick={() => setTheme(key)}>
              <ThemeSwatch themeKey={key} />
              <span className='text-xs font-semibold text-zinc-100'>
                {HIGHWAY3D_THEMES[key].label}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {HIGHWAY3D_THEMES[key].desc}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title='Note shape'
        hint='Silhouette of the blocks coming down the highway.'>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          {GEM_SHAPE_ORDER.map((key) => (
            <OptionCard
              key={key}
              active={settings.gemShape === key}
              onClick={() => setGemShape(key)}>
              <span className='flex h-8 items-center'>
                <GemSwatch shape={key} />
              </span>
              <span className='text-xs font-semibold text-zinc-100'>
                {GEM_SHAPES[key].label}
              </span>
              <span className='text-[10px] leading-tight text-zinc-500'>
                {GEM_SHAPES[key].desc}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <Section
        title='String palette'
        hint='Note and string colours on the board.'>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          {(Object.keys(STRING_PALETTES) as PaletteKey[]).map((key) => (
            <OptionCard
              key={key}
              active={settings.palette === key}
              onClick={() => setPalette(key)}>
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
                {STRING_PALETTES[key].label}
              </span>
            </OptionCard>
          ))}
        </div>
      </Section>

      <ResetButton onClick={reset} label='Reset 3D view' />
    </div>
  );
}
