import { cn } from "assets/lib/utils";
import { Faceplate } from "feature/toneStudio/components/Faceplate";
import {
  BypassSwitch,
  PickerRow,
  plateButtonClass,
} from "feature/toneStudio/components/PluginChrome";
import { CABINET_ASPECT, CABINET_SRC } from "feature/toneStudio/utils/gearArt";
import { Check, Trash2, Upload } from "lucide-react";
import type { AmpParams } from "types/nativeAudio";
import type { ImportedIR } from "types/toneStudio";

interface CabinetModuleProps {
  params: AmpParams;
  set: (patch: Partial<AmpParams>) => void;
  irs: ImportedIR[];
  importing: boolean;
  irError: string | null;
  onImportIR: () => void;
  onDeleteIR: (id: string) => void;
}

/**
 * The speaker cabinet — the built-in model, or any impulse response dropped in.
 *
 * The 4x12 stands next to the list rather than behind it: an impulse response
 * is a recording of a specific cabinet in a specific room, so the picture is
 * the one honest thing on the panel that says what the block *is*, while the
 * list says which one is loaded. Bypassing the block unplugs the cab, and the
 * render dims with it.
 */
export const CabinetModule = ({
  params,
  set,
  irs,
  importing,
  irError,
  onImportIR,
  onDeleteIR,
}: CabinetModuleProps) => (
  <Faceplate
    accent='emerald'
    title='Cabinet'
    subtitle='Speaker and microphone — the last thing that shapes the tone'
    bypassed={!params.cab}
    headerRight={
      <BypassSwitch
        active={params.cab}
        accent='emerald'
        onToggle={() => set({ cab: !params.cab })}
      />
    }
    contentClassName='gap-6 sm:flex-row'>
    <div className='mx-auto w-[46%] max-w-[230px] shrink-0 sm:mx-0'>
      <img
        src={CABINET_SRC}
        alt=''
        draggable={false}
        className='w-full select-none transition-opacity'
        style={{
          aspectRatio: CABINET_ASPECT,
          filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.5))",
          // An IR replaces this cabinet outright, so the built-in one steps back.
          opacity: params.irId === null ? 1 : 0.45,
        }}
      />
      <p className='mt-2 text-center text-[11px] text-zinc-500'>
        {params.irId === null
          ? "Built-in 4x12 model"
          : "Replaced by the loaded impulse response"}
      </p>
    </div>

    <div className='flex min-w-0 flex-1 flex-col gap-2'>
      <div className='flex max-h-48 flex-col gap-2 overflow-y-auto pr-1'>
        <PickerRow
          accent='emerald'
          selected={params.irId === null}
          disabled={!params.cab}
          onSelect={() => set({ irId: null })}>
          <span className='flex-1'>Built-in cabinet</span>
          {params.irId === null && <Check size={14} className='shrink-0' />}
        </PickerRow>

        {irs.map((ir) => (
          <PickerRow
            key={ir.id}
            accent='emerald'
            selected={params.irId === ir.id}
            disabled={!params.cab}
            onSelect={() => set({ irId: ir.id })}
            action={
              <button
                type='button'
                onClick={() => onDeleteIR(ir.id)}
                title='Delete IR'
                className='p-1 text-zinc-500 hover:text-red-400'>
                <Trash2 size={13} />
              </button>
            }>
            <span className='truncate'>{ir.name}</span>
            {ir.truncated && (
              <span className='shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400'>
                truncated
              </span>
            )}
            {params.irId === ir.id && <Check size={14} className='shrink-0' />}
          </PickerRow>
        ))}
      </div>

      <button
        type='button'
        onClick={onImportIR}
        disabled={importing}
        className={cn(plateButtonClass(), "mt-auto")}>
        <Upload size={14} />
        {importing ? "Loading…" : "Load impulse response (.wav)"}
      </button>
      {irError && <p className='text-xs text-red-400'>{irError}</p>}
    </div>
  </Faceplate>
);
