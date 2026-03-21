import { Button } from "assets/components/ui/button";
import { selectUserInfo } from "feature/user/store/userSlice";
import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import { useTranslation } from "hooks/useTranslation";
import { ChevronRight, HelpCircle, Brain, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAppSelector } from "store/hooks";
import { FaClock, FaGuitar, FaList, FaRandom } from "react-icons/fa";

interface PracticeModeSelectorProps {
  onSelectMode: (mode: "timer" | "plan" | "auto" | "song" | "skills" | "gp") => void;
  loadingMode?: "timer" | "plan" | "auto" | "song" | "skills" | "gp" | null;
}

export const PracticeModeSelector = ({
  onSelectMode,
  loadingMode
}: PracticeModeSelectorProps) => {
  const { t } = useTranslation(["common", "timer"]);
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";
  const isMaster = userInfo?.role === "master" || userInfo?.role === "admin";
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const colorClasses = {
    indigo: {
      iconBg: "bg-sky-800/30",
      iconText: "text-sky-400/90",
      blur: "bg-sky-700/15",
      ring: "hover:ring-sky-700/30",
      from: "from-sky-950/60",
      via: "via-sky-950/40",
      to: "to-slate-950",
    },
    amber: {
      iconBg: "bg-amber-800/30",
      iconText: "text-amber-400/90",
      blur: "bg-amber-700/15",
      ring: "hover:ring-amber-700/30",
      from: "from-amber-950/60",
      via: "via-amber-950/40",
      to: "to-slate-950",
    },
    rose: {
      iconBg: "bg-rose-800/30",
      iconText: "text-rose-400/90",
      blur: "bg-rose-700/15",
      ring: "hover:ring-rose-700/30",
      from: "from-rose-950/60",
      via: "via-rose-950/40",
      to: "to-slate-950",
    },
    emerald: {
      iconBg: "bg-emerald-800/30",
      iconText: "text-emerald-400/90",
      blur: "bg-emerald-700/15",
      ring: "hover:ring-emerald-700/30",
      from: "from-emerald-950/60",
      via: "via-emerald-950/40",
      to: "to-slate-950",
    },
    cyan: {
      iconBg: "bg-cyan-800/30",
      iconText: "text-cyan-400/90",
      blur: "bg-cyan-700/15",
      ring: "hover:ring-cyan-700/30",
      from: "from-cyan-950/60",
      via: "via-cyan-950/40",
      to: "to-slate-950",
    },
    violet: {
      iconBg: "bg-violet-800/30",
      iconText: "text-violet-400/90",
      blur: "bg-violet-700/15",
      ring: "hover:ring-violet-700/30",
      from: "from-violet-950/60",
      via: "via-violet-950/40",
      to: "to-slate-950",
    },
  };

  const modes = [
    {
      id: "timer" as const,
      icon: FaClock,
      title: "Practice with timer",
      description: "Start the timer and practice freely.",
      colors: colorClasses.indigo,
    },
    {
      id: "plan" as const,
      icon: FaList,
      title: "Exercise Plan",
      description: "Follow a structured plan step by step.",
      colors: colorClasses.amber,
    },
    {
      id: "auto" as const,
      icon: FaRandom,
      title: "Auto Plan",
      description: "Get a practice plan generated for you.",
      colors: colorClasses.rose,
      master: true,
    },
    {
      id: "song" as const,
      icon: FaList,
      title: "Practice Song",
      description: "Practice a specific song and track your time.",
      colors: colorClasses.emerald,
    },
    {
      id: "skills" as const,
      icon: Brain,
      title: "Practice Skills",
      description: "Focus on specific techniques and skills.",
      colors: colorClasses.violet,
    },
    {
      id: "gp" as const,
      icon: FaGuitar,
      title: "Guitar Pro File",
      description: "Import a .gp5 / .gpx file and practice interactively.",
      colors: colorClasses.cyan,
      premium: true,
    },
  ] as const;

  return (
    <>
    <div className='mb-6 w-full'>
      <div className='font-openSans container mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-8'>
        <div className='space-y-4 sm:space-y-8'>
          <div className='flex flex-col items-center text-center'>
            <h1 className='text-xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl'>
              {t("timer:select_practice_mode")}
            </h1>
            <div className='mt-2 sm:mt-4 flex flex-col items-center gap-3'>
              <p className='text-sm text-gray-400 sm:text-lg'>
                {t("timer:choose_practice_description")}
              </p>
            
            </div>
          </div>

          <div className='flex flex-col gap-3 sm:gap-6 md:grid md:grid-cols-2 lg:grid-cols-3'>
            {modes.map((mode) => {
              const isLocked =
                ("master" in mode && mode.master && !isMaster) ||
                ("premium" in mode && mode.premium && !isPremium);
              return (
              <div
                key={mode.id}
                className={`${isLocked ? "opacity-75 cursor-default" : mode.colors.ring} font-openSans relative flex h-24 transform cursor-pointer overflow-hidden rounded-xl border border-second-400/10 bg-gradient-to-br from-second-500 via-second-500/95 to-second-600 p-3 shadow-lg transition-all duration-300 hover:shadow-xl ${!isLocked ? "hover:ring-2" : ""} sm:h-full sm:p-6`}
                onClick={() => isLocked ? setShowUpgradeModal(true) : onSelectMode(mode.id)}
                tabIndex={0}
                role='button'
                aria-label={mode.title}
                onKeyDown={(e) => e.key === "Enter" && (isLocked ? setShowUpgradeModal(true) : onSelectMode(mode.id))}>
                <div
                  className={`${mode.colors.blur} absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 rounded-full blur-2xl sm:h-32 sm:w-32`}></div>
                <div
                  className={`${mode.colors.blur} absolute left-0 top-24 -mr-6 -mt-6 h-8 w-20 rounded-full blur-3xl sm:h-12 sm:w-32`}></div>
                {isLocked && (
                  <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 ring-1 ring-amber-500/30">
                    <Lock className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Premium</span>
                  </div>
                )}

                <div className='relative z-10 flex w-full flex-row items-center justify-between sm:flex-col sm:items-stretch'>
                  <div className='flex flex-row items-center gap-3 sm:mb-6 sm:flex-col sm:gap-0'>
                    <div className={`relative flex-shrink-0`}>
                      <div
                        className={`absolute -inset-1.5 sm:-inset-3 ${mode.colors.blur} rounded-full opacity-30 blur-xl`}></div>
                      <div
                        className={`relative flex h-10 w-10 items-center justify-center rounded-full sm:h-16 sm:w-16 ${mode.colors.iconBg} backdrop-blur-sm`}>
                        <mode.icon
                          className={`h-5 w-5 sm:h-8 sm:w-8 ${mode.colors.iconText}`}
                        />
                      </div>
                    </div>
                    <div className='text-left sm:mt-6 sm:text-center'>
                      <h2 className='text-lg font-semibold tracking-tight text-white sm:text-2xl'>
                        {mode.title}
                      </h2>
                      <p className='mt-1 hidden text-xs text-gray-300 sm:mt-2 sm:block sm:text-sm'>
                        {mode.description}
                      </p>
                    </div>
                  </div>

                  <Button
                    className={`w-auto border border-white/10 bg-white/5 py-1.5 text-xs backdrop-blur-sm transition-all duration-300 hover:bg-white/10 sm:w-full sm:py-3 sm:text-base gap-2 group`}
                    variant='outline'
                    disabled={!!loadingMode && !isLocked}
                  >
                    {isLocked ? (
                      <div className="flex items-center justify-center gap-2">
                        <Lock size={14} />
                        Upgrade
                      </div>
                    ) : loadingMode === mode.id ? (
                        <div className="flex items-center gap-2">
                           <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                          {t("common:select" as any)}
                          <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </div>
                    )}
                  </Button>
                </div>

                <div
                  className={`${mode.colors.blur} absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-3xl sm:-right-8 sm:-top-8 sm:h-36 sm:w-36`}></div>
                <div
                  className={`${mode.colors.blur} absolute -bottom-4 -left-4 h-20 w-20 rounded-full opacity-20 blur-3xl sm:-bottom-8 sm:-left-8 sm:h-36 sm:w-36`}></div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};
