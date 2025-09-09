import { useTranslation } from "react-i18next";

interface Skill {
  name: string;
  percent: number;
  color: string;
}

interface SkillsRadarChartProps {
  className?: string;
  statistics: {
    time: {
      technique: number;
      theory: number;
      hearing: number;
      creativity: number;
    };
  };
}

const SkillsRadarChart: React.FC<SkillsRadarChartProps> = ({
  className,
  statistics,
}) => {
  const { t } = useTranslation("skills");

  // Oblicz całkowity czas spędzony na wszystkie umiejętności
  const totalTime =
    statistics.time.technique +
    statistics.time.theory +
    statistics.time.hearing +
    statistics.time.creativity;

  // Dynamicznie generuj dane dla radar chart na podstawie rzeczywistych danych
  const generateSkillsData = (): Skill[] => {
    if (totalTime === 0) {
      // Jeśli nie ma danych, zwróć domyślne wartości
      return [
        {
          name: t("categories.technique", "Technika"),
          percent: 25,
          color: "#ef4444",
        },
        {
          name: t("categories.theory", "Teoria"),
          percent: 25,
          color: "#3b82f6",
        },
        {
          name: t("categories.creativity", "Kreatywność"),
          percent: 25,
          color: "#8b5cf6",
        },
        {
          name: t("categories.hearing", "Słuch"),
          percent: 25,
          color: "#10b981",
        },
      ];
    }

    // Oblicz procent dla każdej umiejętności na podstawie czasu
    const skillsData: Skill[] = [
      {
        name: t("categories.technique", "Technika"),
        percent: Math.round((statistics.time.technique / totalTime) * 100),
        color: "#ef4444", // Red-500 - vibrant red for technique
      },
      {
        name: t("categories.theory", "Teoria"),
        percent: Math.round((statistics.time.theory / totalTime) * 100),
        color: "#3b82f6", // Blue-500 - vibrant blue for theory
      },
      {
        name: t("categories.creativity", "Kreatywność"),
        percent: Math.round((statistics.time.creativity / totalTime) * 100),
        color: "#8b5cf6", // Violet-500 - vibrant purple for creativity
      },
      {
        name: t("categories.hearing", "Słuch"),
        percent: Math.round((statistics.time.hearing / totalTime) * 100),
        color: "#10b981", // Emerald-500 - vibrant green for hearing
      },
    ];

    return skillsData;
  };

  const skills = generateSkillsData();

  return (
    <div className='hover:shadow-3xl group relative overflow-hidden rounded-2xl border border-zinc-700/50 bg-gradient-to-br from-zinc-900/90 to-zinc-800/50 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-zinc-600/50'>
      {/* Enhanced Background Effects */}
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-800/10 via-transparent to-zinc-900/20'></div>
      <div className='pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-500/5 to-blue-500/5 blur-3xl'></div>

      {/* Enhanced Header */}
      <div className='relative mb-8'>
        <div className='mb-2 flex items-center gap-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shadow-lg'>
            <div className='h-4 w-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400'></div>
          </div>
          <h3 className='text-2xl font-bold tracking-tight text-white'>
            Umiejętności
          </h3>
        </div>
        <p className='text-sm text-zinc-400'>
          Rozkład czasu ćwiczeń według kategorii
        </p>
      </div>

      {/* Enhanced Bar Chart */}
      <div className='relative space-y-6'>
        {skills.map((skill, index) => (
          <div key={skill.name} className='group/item space-y-3'>
            {/* Skill Header */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='relative'>
                  <div
                    className='h-4 w-4 rounded-full shadow-lg transition-all duration-300 group-hover/item:scale-110'
                    style={{
                      backgroundColor: skill.color,
                      boxShadow: `0 0 20px ${skill.color}40`,
                    }}></div>
                </div>
                <span className='text-base font-semibold text-white transition-colors duration-300 group-hover/item:text-cyan-300'>
                  {skill.name}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-lg font-bold text-white'>
                  {skill.percent}%
                </span>
                <div className='text-xs text-zinc-500'>
                  {(() => {
                    const minutes = Math.round(
                      (skill.percent / 100) * (totalTime / 60000)
                    );
                    const hours = Math.floor(minutes / 60);
                    const mins = minutes % 60;
                    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                  })()}
                </div>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className='relative h-3 w-full overflow-hidden rounded-full bg-zinc-800/50 shadow-inner'>
              <div
                className='h-full rounded-full shadow-lg transition-all duration-1000 ease-out'
                style={{
                  width: `${skill.percent}%`,
                  background: `linear-gradient(90deg, ${skill.color}, ${skill.color}dd)`,
                  boxShadow: `0 0 10px ${skill.color}60, inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}></div>

              {/* Animated shine effect */}
              <div
                className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/item:opacity-100'
                style={{
                  animation: "shine 2s ease-in-out infinite",
                  animationDelay: `${index * 0.2}s`,
                }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Summary */}
      <div className='relative mt-8 overflow-hidden rounded-xl border border-zinc-700/30 bg-gradient-to-r from-zinc-800/30 to-zinc-700/20 p-5 backdrop-blur-sm'>
        <div className='absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5'></div>
        <div className='relative flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20'>
              <div className='h-2 w-2 rounded-full bg-cyan-400'></div>
            </div>
            <span className='text-base font-semibold text-zinc-300'>
              Całkowity czas ćwiczeń
            </span>
          </div>
          <div className='text-right'>
            <div className='text-xl font-bold text-white'>
              {(() => {
                const totalMinutes = Math.round(totalTime / 60000);
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
              })()}
            </div>
            <div className='text-xs text-zinc-500'>
              {Math.round(totalTime / 60000)} minut całkowicie
            </div>
          </div>
        </div>
      </div>

      {/* CSS for shine animation */}
      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default SkillsRadarChart;
