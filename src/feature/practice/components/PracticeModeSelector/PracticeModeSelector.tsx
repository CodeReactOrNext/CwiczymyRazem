import { Button } from "assets/components/ui/button";
import { useTranslation } from "react-i18next";
import { FaClock, FaList, FaRandom } from "react-icons/fa";

interface PracticeModeSelectorProps {
  onSelectMode: (mode: "timer" | "plan" | "auto") => void;
}

export const PracticeModeSelector = ({
  onSelectMode,
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
      iconBg: "bg-teal-800/30",
      iconText: "text-teal-400/90",
      blur: "bg-teal-700/15",
      ring: "hover:ring-teal-700/30",
      from: "from-teal-950/60",
      via: "via-teal-950/40",
      to: "to-slate-950",
    },
  };

  const modes = [
    {
      id: "timer" as const,
      icon: FaClock,
      title: t("timer:modes.timer.title"),
      description: t("timer:modes.timer.description"),
      colors: colorClasses.indigo,
      features: ["Flexible time", "Skill selection", "Progress tracking"],
    },
    {
      id: "plan" as const,
      icon: FaList,
      title: t("timer:modes.plan.title"),
      description: t("timer:modes.plan.description"),
      colors: colorClasses.amber,
      features: [
        "Ready-made plans",
        "Structured exercises",
        "Step-by-step guide",
      ],
    },
    {
      id: "auto" as const,
      icon: FaRandom,
      title: t("timer:modes.auto.title"),
      description: t("timer:modes.auto.description"),
      colors: colorClasses.rose,
      features: [ "Time adjusted", "Personalized"],
    },
  ] as const;

  return (
    <div className='mb-6 w-full'>
      <div className='font-openSans container mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-8'>
        <div className='space-y-4 sm:space-y-8'>
          <div className='text-center'>
            <h1 className='text-xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl'>
              {t("timer:select_practice_mode")}
            </h1>
            <p className='mt-1.5 text-sm text-gray-400 sm:mt-3 sm:text-lg'>
              {t("timer:choose_practice_description")}
            </p>
          </div>

          <div className='flex flex-col gap-3 sm:gap-6 md:grid md:grid-cols-3'>
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
                      {/* Features list - only visible on desktop */}
                      <div className='mt-3 hidden sm:block'>
                        <ul className='space-y-1 text-xs text-gray-400'>
                          {mode.features.map((feature, i) => (
                            <li key={i} className='flex items-center gap-1'>
                              <div className='h-1 w-1 rounded-full bg-gray-500'></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    className={`w-auto border border-white/10 bg-white/5 py-1.5 text-xs backdrop-blur-sm transition-all duration-300 hover:bg-white/10 sm:w-full sm:py-3 sm:text-base`}
                    variant='outline'>
                    {t("common:select" as any)}
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
