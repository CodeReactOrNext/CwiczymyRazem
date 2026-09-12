import { cn } from "assets/lib/utils";
import { Grain, Led } from "feature/toneStudio/components/PluginChrome";
import type { ChainBlock } from "feature/toneStudio/utils/chain";
import { CHAIN_BLOCKS } from "feature/toneStudio/utils/chain";
import {
  ACCENT_HEX,
  accentWash,
  FACEPLATE_WASH,
} from "feature/toneStudio/utils/chassis";
import {
  AMP_HEAD_SRC,
  CABINET_SRC,
  DELAY_PEDAL_SRC,
  GATE_PEDAL_SRC,
  OVERDRIVE_PEDAL_SRC,
} from "feature/toneStudio/utils/gearArt";
import type { AmpParams } from "types/nativeAudio";

export type ChainKey = ChainBlock["key"];

/**
 * The unit each slot is actually holding. The rack stops being a tab bar the
 * moment the tabs are pictures of the gear — you read your rig off it at a
 * glance instead of reading five words.
 */
const SLOT_ART: Record<ChainKey, string> = {
  gate: GATE_PEDAL_SRC,
  overdrive: OVERDRIVE_PEDAL_SRC,
  amp: AMP_HEAD_SRC,
  cab: CABINET_SRC,
  delay: DELAY_PEDAL_SRC,
};

interface ChainRackProps {
  params: AmpParams;
  selected: ChainKey;
  onSelect: (key: ChainKey) => void;
  onToggle: (patch: Partial<AmpParams>) => void;
  /** Names for the loaded capture/IR, so a slot can say what it's actually
   *  running instead of just "Cabinet". */
  namModelName?: string;
  irName?: string;
}

/** What each unit is set to right now, in one line — the engraving under the
 *  slot name. Keyed rather than switched so a new chain block cannot be added
 *  without giving it one. */
const SUMMARY: Record<
  ChainKey,
  (params: AmpParams, namModelName?: string, irName?: string) => string
> = {
  gate: (p) => (p.gate ? "Hum and hiss cut" : "Open"),
  overdrive: (p) => `Drive ${(p.overdriveDrive * 10).toFixed(1)}`,
  // The slot's own label already says Classic vs NAM, so the line under it
  // says which capture, or how hard the classic channel is being pushed.
  amp: (p, namModelName) =>
    p.namEnabled
      ? (namModelName ?? "No capture")
      : `Drive ${(p.drive * 10).toFixed(1)}`,
  cab: (_p, _namModelName, irName) => irName ?? "Built-in",
  delay: (p) => `${Math.round(p.delayMs)}ms · ${Math.round(p.delayMix * 100)}%`,
};

/**
 * The patch lead between two units: a short jack-to-jack cable that sags under
 * its own weight, with a metal ferrule at each end. It replaced a 2px rule —
 * the rule said "these are next to each other", the cable says "this one feeds
 * that one", which is the whole point of the row.
 */
const PatchCable = () => (
  <svg
    aria-hidden
    width='26'
    height='22'
    viewBox='0 0 26 22'
    className='shrink-0'>
    <path
      d='M3 8 C 9 14, 17 14, 23 8'
      fill='none'
      stroke='#18181b'
      strokeWidth='4'
      strokeLinecap='round'
    />
    <path
      d='M3 8 C 9 14, 17 14, 23 8'
      fill='none'
      stroke='#3f3f46'
      strokeWidth='2'
      strokeLinecap='round'
    />
    <rect x='1' y='5.5' width='4' height='5' rx='1.2' fill='#71717a' />
    <rect x='21' y='5.5' width='4' height='5' rx='1.2' fill='#71717a' />
  </svg>
);

/**
 * The signal chain as a row of units you patch through, left to right, in the
 * real DSP order — and the plugin's tab bar at the same time: the slot you
 * click is the one whose faceplate fills the stage below. The lamp toggles
 * bypass without changing which unit you're editing, exactly like reaching
 * for a pedal's footswitch while looking at something else.
 */
export const ChainRack = ({
  params,
  selected,
  onSelect,
  onToggle,
  namModelName,
  irName,
}: ChainRackProps) => (
  <div className='flex items-stretch gap-1.5 overflow-x-auto px-1 pb-1'>
    {CHAIN_BLOCKS.map((block, index) => {
      const active = block.isActive(params);
      const isSelected = block.key === selected;
      const hex = ACCENT_HEX[block.accent];
      return (
        <div key={block.key} className='flex flex-1 items-center gap-1.5'>
          {index > 0 && <PatchCable />}
          <button
            type='button'
            onClick={() => onSelect(block.key)}
            className={cn(
              "relative flex min-w-[7.5rem] flex-1 flex-col gap-1 overflow-hidden rounded-lg px-3 py-2.5 text-left transition-transform",
              !active && "opacity-60",
            )}
            style={{
              backgroundImage: isSelected
                ? `${accentWash(block.accent)}, ${FACEPLATE_WASH}`
                : FACEPLATE_WASH,
              boxShadow: isSelected
                ? `inset 0 0 0 1px ${hex}55, inset 0 1px 0 rgba(255,255,255,0.06)`
                : "inset 0 1px 0 rgba(255,255,255,0.03)",
            }}>
            <Grain opacity={0.04} />

            {/* Height-bounded rather than width-bounded, so the landscape amp
                and the portrait pedals occupy the same band of the slot. */}
            <span className='relative flex h-14 items-center justify-center'>
              <img
                src={SLOT_ART[block.key]}
                alt=''
                draggable={false}
                className='max-h-full w-auto select-none transition-[filter]'
                style={{
                  filter: active
                    ? "drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
                    : "grayscale(0.7) brightness(0.75)",
                }}
              />
            </span>

            <span className='relative flex items-center gap-2'>
              <span
                role='switch'
                aria-checked={active}
                aria-label={`Bypass ${block.label(params)}`}
                tabIndex={block.toggle ? 0 : -1}
                onClick={(e) => {
                  if (!block.toggle) return;
                  e.stopPropagation();
                  onToggle(block.toggle(params));
                }}
                onKeyDown={(e) => {
                  if (!block.toggle) return;
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle(block.toggle(params));
                }}
                className={cn(
                  "-m-1 flex items-center p-1",
                  block.toggle && "cursor-pointer",
                )}>
                <Led on={active} accent={block.accent} />
              </span>
              <span
                className='truncate text-xs font-medium'
                style={{ color: isSelected ? hex : "#a1a1aa" }}>
                {block.label(params)}
              </span>
            </span>
            <span className='font-mono relative truncate text-[10px] text-zinc-500'>
              {SUMMARY[block.key](params, namModelName, irName)}
            </span>
          </button>
        </div>
      );
    })}
  </div>
);
