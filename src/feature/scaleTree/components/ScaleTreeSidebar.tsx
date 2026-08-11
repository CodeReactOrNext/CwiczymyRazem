import { cn } from 'assets/lib/utils';
import { motion } from 'framer-motion';
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
  pentatonic: { title: 'Pentatonic',  text: 'text-amber-400',  bar: 'bg-amber-400',  dot: 'bg-amber-400' },
  diatonic:   { title: 'Diatonic',    text: 'text-cyan-400',   bar: 'bg-cyan-400',   dot: 'bg-cyan-400' },
  mode:       { title: 'Modal Modes', text: 'text-violet-400', bar: 'bg-violet-400', dot: 'bg-violet-400' },
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
    <div className="flex h-full w-[280px] sm:w-[320px] flex-col bg-zinc-950 p-5 select-none">
      <div className="mb-7 px-1">
        <h2 className="font-display text-base font-bold text-zinc-100">
          Scale selector
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          Pick a scale to see its tree and shapes.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-7 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent">
        {families.map((family) => {
          const meta = FAMILY_METADATA[family];
          const items = SIDEBAR_ITEMS.filter((item) => item.family === family);

          return (
            <div key={family} className="space-y-2.5">
              <span className={cn("block px-1 text-xs font-semibold tracking-wide", meta.text)}>
                {meta.title}
              </span>

              <div className="space-y-2">
                {items.map((item) => {
                  const isActive = activeScaleType === item.scaleType;
                  const { total, completed, isLocked, isCompleted } = getScaleStats(item.scaleType);
                  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => onSelectScale(item.scaleType)}
                      className={cn(
                        "group flex w-full flex-col rounded-lg p-4 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        isActive ? "bg-zinc-800/60" : "bg-zinc-900/40 hover:bg-zinc-800/40"
                      )}
                    >
                      <div className="flex w-full items-center gap-2">
                        {/* Active scale is marked by a dot, the way the app's nav does it */}
                        {isActive && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />}
                        <span
                          className={cn(
                            "flex-1 truncate text-sm font-semibold transition-colors",
                            isActive ? "text-zinc-100" : "text-zinc-300 group-hover:text-zinc-100"
                          )}
                        >
                          {item.label}
                        </span>

                        {isLocked ? (
                          <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        ) : isCompleted ? (
                          <CheckCircle className={cn("h-4 w-4 shrink-0", meta.text)} />
                        ) : null}
                      </div>

                      {!isLocked && total > 0 && (
                        <div className="mt-3 flex w-full items-center gap-3">
                          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-zinc-800/80">
                            <motion.div
                              className={cn("absolute inset-y-0 left-0 rounded-full", meta.bar)}
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                          </div>
                          <span
                            className={cn(
                              "shrink-0 text-xs font-medium tabular-nums",
                              progressPercent > 0 ? meta.text : "text-zinc-500"
                            )}
                          >
                            {completed}/{total}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
