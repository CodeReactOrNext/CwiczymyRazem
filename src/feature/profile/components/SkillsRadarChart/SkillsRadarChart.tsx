import { Card } from "assets/components/ui/card";
import { useTranslation } from "hooks/useTranslation";

interface Skill {
  name: string;
  percent: number;
  color: string;
}

interface SkillsRadarChartProps {
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
          name: t("categories.technique", "Technique"),
          percent: 25,
          color: "#ef4444",
        },
        {
          name: t("categories.theory", "Theory"),
          percent: 25,
          color: "#3b82f6",
        },
        {
          name: t("categories.creativity", "Creativity"),
          percent: 25,
          color: "#8b5cf6",
        },
        {
          name: t("categories.hearing", "Hearing"),
          percent: 25,
          color: "#10b981",
        },
      ];
    }

    // Oblicz procent dla każdej umiejętności na podstawie czasu
    const skillsData: Skill[] = [
      {
        name: t("categories.technique", "Technique"),
        percent: Math.round((statistics.time.technique / totalTime) * 100),
        color: "#ef4444", // Red-500 - vibrant red for technique
      },
      {
        name: t("categories.theory", "Theory"),
        percent: Math.round((statistics.time.theory / totalTime) * 100),
        color: "#3b82f6", // Blue-500 - vibrant blue for theory
      },
      {
        name: t("categories.creativity", "Creativity"),
        percent: Math.round((statistics.time.creativity / totalTime) * 100),
        color: "#8b5cf6", // Violet-500 - vibrant purple for creativity
      },
      {
        name: t("categories.hearing", "Hearing"),
        percent: Math.round((statistics.time.hearing / totalTime) * 100),
        color: "#10b981", // Emerald-500 - vibrant green for hearing
      },
    ];

    return skillsData;
  };

  const skills = generateSkillsData();

  return (
    <>
      <Card className='group relative  mb-5 overflow-hidden rounded-xl p-4'>
        <div className='relative space-y-6'>
          {skills.map((skill) => (
            <div key={skill.name} className='group/item space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <span className='text-base font-semibold text-white transition-colors duration-300'>
                    {skill.name}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-lg font-semibold text-white'>
                    {skill.percent}%
                  </span>
                  <div className='text-xs text-zinc-400'>
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
              <div className='relative h-2 w-full overflow-hidden rounded-full bg-zinc-800/50 shadow-inner'>
                <div
                  className='h-full rounded-full shadow-lg transition-all duration-1000 ease-out'
                  style={{
                    width: `${skill.percent}%`,
                    background: `linear-gradient(90deg, ${skill.color}, ${skill.color}dd)`,
                    boxShadow: `0 0 10px ${skill.color}60, inset 0 1px 0 rgba(255,255,255,0.2)`,
                  }}></div>
              </div>
            </div>
          ))}
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
      </Card>
      <Card>
        <div className='relative flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <span className='text-base font-semibold text-zinc-300'>
              Total Practice Time
            </span>
          </div>
          <div className='text-right'>
            <div className='text-xl font-semibold text-white'>
              {(() => {
                const totalMinutes = Math.round(totalTime / 60000);
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
              })()}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default SkillsRadarChart;
