import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { ChevronRight,HelpCircle } from "lucide-react";
import Link from "next/link";
import { FaClock, FaList, FaRandom, FaStar } from "react-icons/fa";

interface PracticeModeSelectorProps {
  onSelectMode: (mode: "timer" | "plan" | "auto" | "song" | "challenges") => void;
  loadingMode?: "timer" | "plan" | "auto" | "song" | "challenges" | null;
}

export const PracticeModeSelector = ({
  onSelectMode,
  loadingMode
}: PracticeModeSelectorProps) => {
  const { t } = useTranslation(["common", "timer"]);

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
    },
    {
      id: "song" as const,
      icon: FaList,
      title: "Practice Song",
      description: "Practice a specific song and track your time.",
      colors: colorClasses.emerald,
    },
    {
      id: "challenges" as const,
      icon: FaStar,
      title: "Challenges",
      description: "Complete challenges earn skills points and extra XP.",
      colors: colorClasses.cyan,
    },
  ] as const;

  return (
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
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-7 gap-1.5 px-2.5 bg-cyan-500/5 border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-cyan-400 transition-all rounded-md"
              >
                <Link href="/guide?tab=practice">
                  <HelpCircle size={13} strokeWidth={2.5} />
                  <span className="text-[10px] font-black uppercase tracking-wider">How it works</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className='flex flex-col gap-3 sm:gap-6 md:grid md:grid-cols-2 lg:grid-cols-3'>
            {modes.map((mode) => (
              <div
                key={mode.id}
                className={`${mode.colors.ring} font-openSans relative flex h-24 transform cursor-pointer overflow-hidden rounded-xl border border-second-400/10 bg-gradient-to-br from-second-500 via-second-500/95 to-second-600 p-3 shadow-lg transition-all duration-300 hover:shadow-xl hover:ring-2 sm:h-full sm:p-6`}
                onClick={() => onSelectMode(mode.id)}
                tabIndex={0}
                role='button'
                aria-label={mode.title}
                onKeyDown={(e) => e.key === "Enter" && onSelectMode(mode.id)}>
                <div
                  className={`${mode.colors.blur} absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 rounded-full blur-2xl sm:h-32 sm:w-32`}></div>
                <div
                  className={`${mode.colors.blur} absolute left-0 top-24 -mr-6 -mt-6 h-8 w-20 rounded-full blur-3xl sm:h-12 sm:w-32`}></div>
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
                    disabled={!!loadingMode}
                  >
                    {loadingMode === mode.id ? (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
