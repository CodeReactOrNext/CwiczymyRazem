import { Faceplate } from "feature/toneStudio/components/Faceplate";
import { Knob } from "feature/toneStudio/components/Knob";
import {
  PickerRow,
  plateButtonClass,
  SegmentedControl,
} from "feature/toneStudio/components/PluginChrome";
import { useElementWidth } from "feature/toneStudio/hooks/useElementWidth";
import {
  AMP_GRILLE,
  AMP_HEAD_ASPECT,
  AMP_HEAD_SRC,
  AMP_PANEL,
} from "feature/toneStudio/utils/gearArt";
import { ExternalLink, Trash2, Upload } from "lucide-react";
import type { ReactNode } from "react";
import type { AmpParams } from "types/nativeAudio";
import type { ImportedNamModel } from "types/toneStudio";

interface AmpModuleProps {
  params: AmpParams;
  set: (patch: Partial<AmpParams>) => void;
  namModels: ImportedNamModel[];
  importingNamModel: boolean;
  namError: string | null;
  onImportNamModel: () => void;
  onDeleteNamModel: (id: string) => void;
  /** Whether the engine is actually running — the valves only glow when it is. */
  live?: boolean;
}

/** Width the head is drawn at when nothing has measured it yet — the size it
 *  settles on in a full-width window, so the first paint is already right. */
const NOMINAL_ART_WIDTH = 1100;
/** Vertical room a knob needs beyond its dial: the value arc above and below,
 *  plus the label and readout printed under it. */
const KNOB_CHROME_PX = 46;
/** Clearance kept between the knob stack and the edges of the plate, so the
 *  controls sit ON the panel rather than filling it edge to edge. */
const PANEL_BREATHING_PX = 10;

/** The head's bare panel, with whatever belongs on it laid over the render. */
const Panel = ({ children }: { children: ReactNode }) => (
  <div
    className='absolute flex items-center justify-center'
    style={{
      left: `${AMP_PANEL.left * 100}%`,
      top: `${AMP_PANEL.top * 100}%`,
      width: `${AMP_PANEL.width * 100}%`,
      height: `${AMP_PANEL.height * 100}%`,
    }}>
    {children}
  </div>
);

/** Where the pair of power valves sit behind the cloth, across the grille. */
const VALVE_POSITIONS = [0.38, 0.62];

/**
 * Heat behind the speaker cloth. A valve amp that is passing signal glows, and
 * the harder you push the power section the more it glows — so this is the one
 * thing on the panel that moves without being dragged, and it is telling the
 * truth about the DSP rather than decorating.
 */
const ValveGlow = ({ intensity }: { intensity: number }) => (
  <div
    aria-hidden
    className='pointer-events-none absolute overflow-hidden transition-opacity duration-700'
    style={{
      left: `${AMP_GRILLE.left * 100}%`,
      top: `${AMP_GRILLE.top * 100}%`,
      width: `${AMP_GRILLE.width * 100}%`,
      height: `${AMP_GRILLE.height * 100}%`,
      opacity: intensity,
      mixBlendMode: "screen",
    }}>
    {VALVE_POSITIONS.map((x) => (
      <span
        key={x}
        className='absolute'
        style={{
          left: `${x * 100}%`,
          top: "50%",
          width: "26%",
          height: "320%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(closest-side, rgba(255,150,40,0.55) 0%, rgba(255,110,20,0.28) 45%, transparent 75%)",
        }}
      />
    ))}
    <span
      className='absolute inset-0'
      style={{
        background:
          "radial-gradient(120% 140% at 50% 50%, rgba(255,130,30,0.16) 0%, transparent 70%)",
      }}
    />
  </div>
);

/**
 * The amp head. Classic and NAM are mutually exclusive DSP paths (see
 * ampSim.js) — a captured model replaces the preamp and tone stack outright —
 * so this is one panel with a channel switch rather than two competing ones,
 * the way a two-channel head has one faceplate.
 *
 * The head is a render whose control panel was left deliberately blank, and the
 * knobs are laid onto that panel at measured fractions of the image (see
 * gearArt.ts), sized from its drawn width. So they are real controls sitting on
 * real gear at any window size, rather than a picture of an amp with a control
 * strip bolted underneath it.
 */
export const AmpModule = ({
  params,
  set,
  namModels,
  importingNamModel,
  namError,
  onImportNamModel,
  onDeleteNamModel,
  live = false,
}: AmpModuleProps) => {
  const [artRef, measuredWidth] = useElementWidth<HTMLDivElement>();
  const artWidth = measuredWidth || NOMINAL_ART_WIDTH;
  const panelHeight = (artWidth / AMP_HEAD_ASPECT) * AMP_PANEL.height;
  const knobSize = Math.min(
    88,
    Math.max(28, Math.round(panelHeight - KNOB_CHROME_PX - PANEL_BREATHING_PX)),
  );

  const activeCapture = namModels.find((m) => m.id === params.namModelId);

  // A capture drives the power section as hard as it was captured at, so there
  // is no drive knob to read — the valves settle at a steady warmth instead.
  const valveIntensity = live
    ? params.namEnabled
      ? 0.6
      : 0.3 + params.drive * 0.7
    : 0;

  const head = (
    <div ref={artRef} className='relative w-full'>
      <img
        src={AMP_HEAD_SRC}
        alt=''
        draggable={false}
        className='w-full select-none'
        style={{ aspectRatio: AMP_HEAD_ASPECT }}
      />
      <ValveGlow intensity={valveIntensity} />
      {params.namEnabled ? (
        <Panel>
          <span
            className='truncate px-6 text-center font-display text-lg tracking-wide'
            style={{
              color: "rgba(0,0,0,0.5)",
              textShadow: "0 1px 0 rgba(255,255,255,0.16)",
            }}>
            {activeCapture?.name ?? "No capture loaded"}
          </span>
        </Panel>
      ) : (
        <Panel>
          {/* Spread across the plate rather than huddled in the middle — the
              spacing a real faceplate uses, and it scales with the render. */}
          <div className='flex w-full items-start justify-around px-[4%]'>
            <Knob
              label='Preamp'
              size={knobSize}
              value={params.preampGain}
              defaultValue={0.5}
              onChange={(v) => set({ preampGain: v })}
            />
            <Knob
              label='Bass'
              size={knobSize}
              value={params.bass}
              defaultValue={0.5}
              onChange={(v) => set({ bass: v })}
            />
            <Knob
              label='Mid'
              size={knobSize}
              value={params.mid}
              defaultValue={0.5}
              onChange={(v) => set({ mid: v })}
            />
            <Knob
              label='Treble'
              size={knobSize}
              value={params.treble}
              defaultValue={0.5}
              onChange={(v) => set({ treble: v })}
            />
            <Knob
              label='Drive'
              size={knobSize}
              value={params.drive}
              defaultValue={0.5}
              onChange={(v) => set({ drive: v })}
            />
          </div>
        </Panel>
      )}
    </div>
  );

  return (
    <Faceplate
      accent='cyan'
      title='Amp'
      subtitle={
        params.namEnabled
          ? "Neural capture of a real head, in place of the preamp and tone stack"
          : "Cascading preamp, passive tone stack and power section"
      }
      headerRight={
        <SegmentedControl
          value={params.namEnabled ? "nam" : "classic"}
          onChange={(v) => set({ namEnabled: v === "nam" })}
          options={[
            { value: "classic", label: "Classic" },
            { value: "nam", label: "Neural capture" },
          ]}
        />
      }
      contentClassName='justify-center gap-5'>
      {params.namEnabled ? (
        // Head on top, captures underneath, read top-down like a rack. The head
        // is drawn small here: on this channel it is a nameplate for the loaded
        // capture, not a control surface, and the list is what you work in. So
        // the list takes whatever height the plate has left and scrolls inside
        // it — a capture collection grows without bound, and it must not push
        // the window around when it does.
        <div className='mx-auto flex min-h-0 w-full max-w-[900px] flex-1 flex-col gap-4'>
          <div className='mx-auto w-full max-w-[560px]'>{head}</div>

          <div className='flex flex-wrap items-center justify-between gap-3'>
            <a
              href='https://www.tone3000.com/search'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300'>
              Browse captures on Tone3000
              <ExternalLink size={11} />
            </a>
            <button
              type='button'
              onClick={onImportNamModel}
              disabled={importingNamModel}
              className={plateButtonClass()}>
              <Upload size={14} />
              {importingNamModel ? "Loading…" : "Load capture (.nam)"}
            </button>
          </div>

          <div className='flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1'>
            {namModels.length === 0 && (
              <div className='relative overflow-hidden rounded-md bg-zinc-800/40 px-3 py-7'>
                {/* The gear itself, ghosted — an empty shelf rather than an
                    error message. */}
                <img
                  src={AMP_HEAD_SRC}
                  alt=''
                  draggable={false}
                  aria-hidden
                  className='pointer-events-none absolute -bottom-4 left-1/2 w-[115%] max-w-none -translate-x-1/2 select-none opacity-[0.07]'
                />
                <p className='relative text-center text-sm text-zinc-400'>
                  No captures loaded yet — the classic channel is running
                  instead.
                </p>
              </div>
            )}
            {namModels.map((model) => (
              <PickerRow
                key={model.id}
                accent='cyan'
                selected={params.namModelId === model.id}
                onSelect={() => set({ namModelId: model.id })}
                action={
                  <button
                    type='button'
                    onClick={() => onDeleteNamModel(model.id)}
                    title='Delete capture'
                    className='p-1 text-zinc-500 hover:text-red-400'>
                    <Trash2 size={13} />
                  </button>
                }>
                <span className='truncate'>{model.name}</span>
                {(model.gearMake || model.gearModel) && (
                  <span className='truncate text-[11px] text-zinc-500'>
                    {[model.gearMake, model.gearModel]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                )}
              </PickerRow>
            ))}
          </div>
          {namError && <p className='text-xs text-red-400'>{namError}</p>}
        </div>
      ) : (
        <>
          {/* Capped by how tall the head may get, not by taste: at 8:3 this is
              the widest it can be drawn and still leave the plate its fixed
              height. Any wider and the module would outgrow the window. */}
          <div className='mx-auto w-full max-w-[1100px]'>{head}</div>
          <p className='mx-auto max-w-lg text-center text-[11px] leading-relaxed text-zinc-500'>
            Preamp is the first gain stage, ahead of the tone stack. Drive
            pushes the power section after it — the two cascade, so a little of
            each sounds different from all of one.
          </p>
        </>
      )}
    </Faceplate>
  );
};
