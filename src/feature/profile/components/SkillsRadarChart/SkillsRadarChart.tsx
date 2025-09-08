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
          color: "#64748b",
        },
        {
          name: t("categories.theory", "Teoria"),
          percent: 25,
          color: "#475569",
        },
        {
          name: t("categories.creativity", "Kreatywność"),
          percent: 25,
          color: "#334155",
        },
        {
          name: t("categories.hearing", "Słuch"),
          percent: 25,
          color: "#1e293b",
        },
      ];
    }

    // Oblicz procent dla każdej umiejętności na podstawie czasu
    const skillsData: Skill[] = [
      {
        name: t("categories.technique", "Technika"),
        percent: Math.round((statistics.time.technique / totalTime) * 100),
        color: "#64748b", // Slate-500 - professional gray
      },
      {
        name: t("categories.theory", "Teoria"),
        percent: Math.round((statistics.time.theory / totalTime) * 100),
        color: "#475569", // Slate-600 - darker professional gray
      },
      {
        name: t("categories.creativity", "Kreatywność"),
        percent: Math.round((statistics.time.creativity / totalTime) * 100),
        color: "#334155", // Slate-700 - even darker
      },
      {
        name: t("categories.hearing", "Słuch"),
        percent: Math.round((statistics.time.hearing / totalTime) * 100),
        color: "#1e293b", // Slate-800 - very dark
      },
    ];

    return skillsData;
  };

  const skills = generateSkillsData();

  return (
    <div className='relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-xl'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <h3 className='font-display text-xl font-bold tracking-tight text-white'>
          Umiejętności
        </h3>
        <div className='text-xs font-medium text-white/70'>
          Rozkład czasu ćwiczeń
        </div>
      </div>

      {/* Background effects */}
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-800/20 via-transparent to-zinc-800/20'></div>

      {/* Simple Bar Chart */}
      <div className='space-y-4'>
        {skills.map((skill, index) => (
          <div key={skill.name} className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div
                  className='h-3 w-3 rounded-full'
                  style={{ backgroundColor: skill.color }}></div>
                <span className='text-sm font-medium text-white'>
                  {skill.name}
                </span>
              </div>
              <span className='text-sm font-bold text-white'>
                {skill.percent}%
              </span>
            </div>
            <div className='h-2 w-full overflow-hidden rounded-full bg-white/10'>
              <div
                className='h-full rounded-full transition-all duration-700 ease-out'
                style={{
                  width: `${skill.percent}%`,
                  backgroundColor: skill.color,
                }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className='mt-6 rounded-lg border border-white/10 bg-white/5 p-4'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-white/70'>
            Całkowity czas ćwiczeń
          </span>
          <span className='text-sm font-bold text-white'>
            {Math.round(
              (statistics.time.technique +
                statistics.time.theory +
                statistics.time.hearing +
                statistics.time.creativity) /
                60000
            )}{" "}
            min
          </span>
        </div>
      </div>
    </div>
  );
};

export default SkillsRadarChart;
