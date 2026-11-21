import { cn } from 'assets/lib/utils';
import { useTranslation } from 'hooks/useTranslation';
import { CheckCircle,Lock } from 'lucide-react';

interface ScaleSidebarItem {
  id: string;
  label: string;
  scaleType: string;
  family: 'pentatonic' | 'diatonic' | 'mode';
}

const SIDEBAR_ITEMS: ScaleSidebarItem[] = [
  { id: 'min_pent', label: 'Minor Pentatonic', scaleType: 'minor_pentatonic', family: 'pentatonic' },
  { id: 'maj_pent', label: 'Major Pentatonic', scaleType: 'major_pentatonic', family: 'pentatonic' },
  { id: 'nat_minor', label: 'Natural Minor', scaleType: 'minor', family: 'diatonic' },
  { id: 'major', label: 'Major Scale', scaleType: 'major', family: 'diatonic' },
  { id: 'dorian', label: 'Dorian Mode', scaleType: 'dorian', family: 'mode' },
  { id: 'phrygian', label: 'Phrygian Mode', scaleType: 'phrygian', family: 'mode' },
  { id: 'mixolydian', label: 'Mixolydian Mode', scaleType: 'mixolydian', family: 'mode' },
  { id: 'lydian', label: 'Lydian Mode', scaleType: 'lydian', family: 'mode' },
  { id: 'locrian', label: 'Locrian Mode', scaleType: 'locrian', family: 'mode' },
];

// One accent per family, as palette classes rather than raw hex, so the
// sidebar stays in the app's semantic colour system (amber/cyan/violet).
const FAMILY_METADATA = {
  pentatonic: { title: 'Pentatonic',  text: 'text-amber-400' },
  diatonic:   { title: 'Diatonic',    text: 'text-cyan-400' },
  mode:       { title: 'Modal Modes', text: 'text-violet-400' },
};

interface ScaleTreeSidebarProps {
  activeScaleType: string;
  onSelectScale: (scaleType: string) => void;
  rfNodes: any[];
}

export function ScaleTreeSidebar({
  activeScaleType,
  onSelectScale,
  rfNodes,
}: ScaleTreeSidebarProps) {
  const { t } = useTranslation('scale_tree');
  const getScaleStats = (scaleType: string) => {
    const scaleNodes = rfNodes.filter((n) => n.data?.scaleType === scaleType);
    const total = scaleNodes.length;
    const completed = scaleNodes.filter((n) => n.data?.status === 'completed').length;
    const isLocked = scaleNodes.length > 0 && scaleNodes.every((n) => n.data?.status === 'locked');
    const isCompleted = total > 0 && completed === total;

    return { total, completed, isLocked, isCompleted };
  };

  const families = ['pentatonic', 'diatonic', 'mode'] as const;

  return (
    <div className="flex h-full w-[260px] flex-col bg-zinc-950 px-4 py-5 select-none">
      <h2 className="mb-6 px-3 font-display text-base font-bold text-zinc-100">
        {t('sidebar.title')}
      </h2>

      {/* A list, not a stack of cards: one row per scale, its count on the
          right. The family name above each group is the only colour. */}
      <div className="flex-1 overflow-y-auto space-y-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent">
        {families.map((family) => {
          const meta = FAMILY_METADATA[family];
          const items = SIDEBAR_ITEMS.filter((item) => item.family === family);

          return (
            <div key={family} className="space-y-1">
              <span className={cn("mb-2 block px-3 text-xs font-semibold tracking-wide", meta.text)}>
                {t(`families.${family}.group`, meta.title)}
              </span>

              {items.map((item) => {
                const isActive = activeScaleType === item.scaleType;
                const { total, completed, isLocked, isCompleted } = getScaleStats(item.scaleType);

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectScale(item.scaleType)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      isActive ? "bg-zinc-800/60" : "hover:bg-zinc-900/60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex-1 truncate text-sm font-medium transition-colors",
                        isActive
                          ? "text-zinc-100"
                          : isLocked
                            ? "text-zinc-500 group-hover:text-zinc-300"
                            : "text-zinc-300 group-hover:text-zinc-100"
                      )}
                    >
                      {t(`scales.${item.scaleType}`, item.label)}
                    </span>

                    {isLocked ? (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                    ) : isCompleted ? (
                      <CheckCircle className={cn("h-4 w-4 shrink-0", meta.text)} />
                    ) : total > 0 ? (
                      <span
                        className={cn(
                          "shrink-0 text-xs font-medium tabular-nums",
                          completed > 0 ? meta.text : "text-zinc-500"
                        )}
                      >
                        {completed}/{total}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
