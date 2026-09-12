import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { plateButtonClass } from "feature/toneStudio/components/PluginChrome";
import { ACCENT_HEX } from "feature/toneStudio/utils/chassis";
import { isPresetModified } from "feature/toneStudio/utils/presetDiff";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import type { AmpParams } from "types/nativeAudio";
import type { TonePreset } from "types/toneStudio";

interface PresetBrowserProps {
  presets: TonePreset[];
  activePresetId: string | null;
  params: AmpParams;
  onLoad: (id: string, params: AmpParams) => void;
  onSaveNew: (name: string) => void;
  onOverwrite: (preset: TonePreset) => void;
  onDelete: (id: string) => void;
}

/**
 * The preset rail every amp plugin puts across its top edge: step through the
 * library with the arrows, open the whole list from the name, and save from
 * the same place. A dot next to the name means the live knobs have drifted
 * from what the preset stores — the plugin convention for "unsaved".
 */
export const PresetBrowser = ({
  presets,
  activePresetId,
  params,
  onLoad,
  onSaveNew,
  onOverwrite,
  onDelete,
}: PresetBrowserProps) => {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  const activeIndex = presets.findIndex((p) => p.id === activePresetId);
  const active = activeIndex >= 0 ? presets[activeIndex] : null;
  const modified = active ? isPresetModified(params, active.params) : false;

  const step = (delta: number) => {
    if (presets.length === 0) return;
    // No preset loaded yet: "next" starts at the top of the library.
    const next =
      activeIndex < 0
        ? delta > 0
          ? 0
          : presets.length - 1
        : (activeIndex + delta + presets.length) % presets.length;
    onLoad(presets[next].id, presets[next].params);
  };

  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSaveNew(trimmed);
    setName("");
    setNaming(false);
  };

  if (naming) {
    return (
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <input
          type='text'
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitName();
            if (e.key === "Escape") setNaming(false);
          }}
          placeholder='Name this tone'
          className='h-9 min-w-0 flex-1 rounded-md bg-zinc-900 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50'
        />
        <button
          type='button'
          onClick={commitName}
          disabled={!name.trim()}
          className={plateButtonClass()}>
          <Save size={14} />
          Save
        </button>
        <button
          type='button'
          onClick={() => setNaming(false)}
          title='Cancel'
          className={cn(plateButtonClass(), "px-2")}>
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className='flex min-w-0 flex-1 items-center gap-1.5'>
      <button
        type='button'
        onClick={() => step(-1)}
        disabled={presets.length === 0}
        title='Previous preset'
        className={cn(plateButtonClass(), "px-2 py-1.5")}>
        <ChevronLeft size={15} />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          className='flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm text-zinc-100 transition-colors hover:bg-zinc-800/60'
          style={{
            background: "#0b0b0d",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)",
          }}>
          <span className='truncate'>{active?.name ?? "No preset loaded"}</span>
          {modified && (
            <span
              aria-label='Edited since loading'
              className='h-1.5 w-1.5 shrink-0 rounded-full'
              style={{ background: ACCENT_HEX.amber }}
            />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='center'
          className='z-[999999999] max-h-80 w-64 overflow-y-auto border-0 bg-zinc-900 text-zinc-200'>
          {presets.length === 0 && (
            <div className='px-2 py-3 text-center text-xs text-zinc-500'>
              No presets saved yet
            </div>
          )}
          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onSelect={() => onLoad(preset.id, preset.params)}
              className='flex cursor-pointer items-center justify-between gap-2 focus:bg-zinc-800'>
              <span className='flex min-w-0 items-center gap-2'>
                {preset.id === activePresetId ? (
                  <Check size={13} className='shrink-0 text-purple-400' />
                ) : (
                  <span className='w-[13px] shrink-0' />
                )}
                <span className='truncate'>{preset.name}</span>
              </span>
              {preset.builtIn ? (
                <span className='shrink-0 text-[10px] text-zinc-500'>
                  Built-in
                </span>
              ) : (
                <span
                  role='button'
                  tabIndex={0}
                  title='Delete preset'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(preset.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    onDelete(preset.id);
                  }}
                  className='shrink-0 cursor-pointer p-1 text-zinc-500 hover:text-red-400'>
                  <Trash2 size={13} />
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type='button'
        onClick={() => step(1)}
        disabled={presets.length === 0}
        title='Next preset'
        className={cn(plateButtonClass(), "px-2 py-1.5")}>
        <ChevronRight size={15} />
      </button>

      {active && !active.builtIn && modified && (
        <button
          type='button'
          onClick={() => onOverwrite(active)}
          title={`Overwrite "${active.name}" with the current settings`}
          className={cn(plateButtonClass(), "px-2 py-1.5 text-[11px]")}>
          <Save size={13} />
          Update
        </button>
      )}
      <button
        type='button'
        onClick={() => setNaming(true)}
        title='Save the current settings as a new preset'
        className={cn(plateButtonClass(), "px-2 py-1.5 text-[11px]")}>
        <Save size={13} />
        Save as
      </button>
    </div>
  );
};
