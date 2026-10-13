import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { Trash2 } from "lucide-react";

import { STICKER_SIZE } from "../data/guitarParts";
import type { PlacedSticker } from "../types/guitarBuilder.types";

interface StickerPanelProps {
  selected: PlacedSticker | null;
  hasStickers: boolean;
  onChange: (id: string, patch: Partial<PlacedSticker>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const SliderRow = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) => (
  <div className='flex items-center gap-3'>
    <span className='w-14 text-xs text-zinc-400'>{label}</span>
    <Slider
      aria-label={label}
      value={[value]}
      min={min}
      max={max}
      step={1}
      onValueChange={([next]) => onChange(next)}
    />
  </div>
);

/** Size, rotation and removal for the sticker picked on the guitar. */
export const StickerPanel = ({
  selected,
  hasStickers,
  onChange,
  onRemove,
  onClear,
}: StickerPanelProps) => {
  const { t } = useArsenalLabels();
  if (!hasStickers) return null;
  return (
    <div className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 px-5 py-4 sm:flex-row sm:items-center sm:gap-8'>
      {selected ? (
        <div className='grid min-w-0 flex-1 gap-4 sm:grid-cols-2 sm:gap-6'>
          <SliderRow
            label={t("builder.size")}
            value={selected.size}
            min={STICKER_SIZE.min}
            max={STICKER_SIZE.max}
            onChange={(size) => onChange(selected.id, { size })}
          />
          <SliderRow
            label={t("builder.rotate")}
            value={selected.rotation}
            min={-180}
            max={180}
            onChange={(rotation) => onChange(selected.id, { rotation })}
          />
        </div>
      ) : (
        <p className='flex-1 text-sm text-zinc-400'>
          {t("builder.sticker_hint")}
        </p>
      )}
      <div className='flex gap-2'>
        {selected && (
          <Button
            variant='secondary'
            size='sm'
            onClick={() => onRemove(selected.id)}>
            <Trash2 className='mr-2' />
            {t("builder.peel_off")}
          </Button>
        )}
        <Button variant='ghost' size='sm' onClick={onClear}>
          {t("builder.peel_off_all")}
        </Button>
      </div>
    </div>
  );
};
