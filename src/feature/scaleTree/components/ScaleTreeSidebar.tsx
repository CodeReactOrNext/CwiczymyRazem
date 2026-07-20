import { motion } from 'framer-motion';
import { CheckCircle, Flame,Lock } from 'lucide-react';

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

const FAMILY_METADATA = {
  pentatonic: {
    title: 'Pentatonic',
    color: '#fbbf24',
    bgGlow: 'rgba(251, 191, 36, 0.03)',
    borderGlow: 'rgba(251, 191, 36, 0.15)',
  },
  diatonic: {
    title: 'Diatonic',
    color: '#22d3ee',
    bgGlow: 'rgba(34, 211, 238, 0.03)',
    borderGlow: 'rgba(34, 211, 238, 0.15)',
  },
  mode: {
    title: 'Modal Modes',
    color: '#a78bfa',
    bgGlow: 'rgba(167, 139, 250, 0.03)',
    borderGlow: 'rgba(167, 139, 250, 0.15)',
  },
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
    <div className="flex h-full w-[280px] sm:w-[320px] flex-col bg-[#0a0a0c] p-4 select-none">
      <div className="mb-6 px-2">
        <h2 className="text-sm font-bold tracking-widest text-zinc-400 capitalize">
          Scale Selector
        </h2>
        <p className="text-[10px] text-zinc-500 mt-1">
          Select a scale to view its skill tree and box positions.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent">
        {families.map((family) => {
          const meta = FAMILY_METADATA[family];
          const items = SIDEBAR_ITEMS.filter((item) => item.family === family);

          return (
            <div key={family} className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <span
                  className="text-[10px] font-black capitalize tracking-widest"
                  style={{ color: meta.color }}
                >
                  {meta.title}
                </span>
              </div>

              <div className="space-y-1.5">
                {items.map((item) => {
                  const isActive = activeScaleType === item.scaleType;
                  const { total, completed, isLocked, isCompleted } = getScaleStats(item.scaleType);
                  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => onSelectScale(item.scaleType)}
                      className={`relative w-full flex flex-col rounded-lg p-3.5 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                        isActive
                          ? 'bg-zinc-800/60'
                          : 'bg-zinc-900/40 hover:bg-zinc-800/40'
                      }`}
                    >
                      {isActive && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 rounded-r"
                          style={{ backgroundColor: meta.color }}
                        />
                      )}

                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-sm font-semibold tracking-wide transition-colors ${
                            isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                          }`}
                        >
                          {item.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isLocked ? (
                            <Lock className="h-3.5 w-3.5 text-zinc-700" />
                          ) : isCompleted ? (
                            <CheckCircle
                              className="h-4 w-4"
                              style={{ color: meta.color }}
                            />
                          ) : completed > 0 ? (
                            <Flame className="h-4 w-4 text-orange-400 animate-pulse" />
                          ) : null}
                        </div>
                      </div>

                      {!isLocked && total > 0 && (
                        <div className="w-full mt-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                            <span className="capitalize">Progress</span>
                            <span className="font-semibold" style={{ color: progressPercent > 0 ? meta.color : '#71717a' }}>
                              {completed} / {total} ({Math.round(progressPercent)}%)
                            </span>
                          </div>

                          <div className="relative h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                            <motion.div
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                backgroundColor: meta.color,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                          </div>
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
