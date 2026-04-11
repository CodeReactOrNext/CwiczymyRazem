import React from "react";
import { motion } from "framer-motion";
import { Lock, Guitar, Drum, Music2, Mic2, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import type { JourneyModuleWithStatus, LockedModulePlaceholder } from "../../types/journey.types";

interface ModuleListProps {
  activeModuleId: string;
  onSelectModule: (id: string) => void;
  activeModule: JourneyModuleWithStatus;
  placeholders: LockedModulePlaceholder[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Guitar: <Guitar size={18} />,
  Drum:   <Drum size={18} />,
  Music2: <Music2 size={18} />,
  Mic2:   <Mic2 size={18} />,
};

// 3D images for each module
const MODULE_IMAGES: Record<string, string> = {
  fundamentals:  "/images/3d/guitarist.png",
  rhythm:        "/images/3d/metronom.png",
  scales:        "/images/3d/skills.png",
  improvisation: "/images/3d/activity.png",
};

export const ModuleList: React.FC<ModuleListProps> = ({
  activeModuleId,
  onSelectModule,
  activeModule,
  placeholders,
}) => {
  const progressPercent =
    activeModule.totalCount > 0
      ? Math.round((activeModule.completedCount / activeModule.totalCount) * 100)
      : 0;

  return (
    <div className="hidden w-60 shrink-0 flex-col gap-2 border-r border-zinc-800/60 bg-zinc-950 px-3 py-6 md:flex">
      <p className="mb-2 px-1 text-[10px] font-semibold tracking-widest text-zinc-600">
        Modules
      </p>

      {/* Active module */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelectModule(activeModule.id)}
        className={`relative flex w-full flex-col gap-0 overflow-hidden rounded-xl border text-left transition-colors ${
          activeModuleId === activeModule.id
            ? "border-cyan-500/30 bg-zinc-900"
            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
        }`}
      >
        {/* Image strip */}
        <div className="relative h-24 w-full overflow-hidden bg-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/60 to-zinc-900/80" />
          <Image
            src={MODULE_IMAGES[activeModule.id] ?? "/images/3d/guitarist.png"}
            alt={activeModule.title}
            fill
            className="object-contain object-center scale-110"
          />
          {/* Active indicator */}
          {activeModuleId === activeModule.id && (
            <div className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_2px_rgba(34,211,238,0.5)]" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2.5 p-3">
          <div className="flex items-start gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              {ICON_MAP[activeModule.icon] ?? <Guitar size={18} />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white leading-tight">{activeModule.title}</p>
              <p className="truncate text-[10px] text-zinc-500">{activeModule.subtitle}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">Progress</span>
              <span className="text-[10px] font-semibold text-zinc-400">
                {activeModule.completedCount}/{activeModule.totalCount}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                className="h-full rounded-full bg-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            {activeModule.completedCount === activeModule.totalCount && activeModule.totalCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <CheckCircle2 size={10} />
                Module complete!
              </div>
            )}
          </div>
        </div>
      </motion.button>

      {/* Locked placeholders */}
      {placeholders.map((mod) => (
        <div
          key={mod.id}
          className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 opacity-40 cursor-not-allowed"
          title="Coming soon"
        >
          {/* Image strip */}
          <div className="relative h-16 w-full overflow-hidden bg-zinc-800/50">
            <Image
              src={MODULE_IMAGES[mod.id] ?? "/images/3d/skills.png"}
              alt={mod.title}
              fill
              className="object-contain object-center opacity-50"
            />
          </div>

          {/* Info */}
          <div className="flex items-center gap-2 p-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
              {ICON_MAP[mod.icon] ?? <Guitar size={18} />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-500">{mod.title}</p>
              <p className="truncate text-[10px] text-zinc-600">{mod.subtitle}</p>
            </div>
            <Lock size={12} className="flex-shrink-0 text-zinc-600 ml-auto" />
          </div>
        </div>
      ))}

      <p className="mt-1 px-1 text-center text-[10px] text-zinc-700">More modules coming soon</p>
    </div>
  );
};
