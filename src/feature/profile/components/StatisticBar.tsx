interface StatisticBarProps {
  title: string;
  value: string;
  percent: number;
}

const getSkillColor = (title: string) => {
  switch (title.toLowerCase()) {
    case "technika":
      return {
        accent: "bg-gradient-to-r from-red-700 to-red-500",
        text: "text-red-400",
        dot: "bg-red-600",
      };
    case "teoria":
      return {
        accent: "bg-gradient-to-r from-blue-700 to-blue-500",
        text: "text-blue-400",
        dot: "bg-blue-600",
      };
    case "słuch":
      return {
        accent: "bg-gradient-to-r from-emerald-700 to-emerald-500",
        text: "text-emerald-400",
        dot: "bg-emerald-600",
      };
    case "kreatywność":
      return {
        accent: "bg-gradient-to-r from-purple-700 to-purple-500",
        text: "text-purple-400",
        dot: "bg-purple-600",
      };
    default:
      return {
        accent: "bg-gradient-to-r from-main-600 to-main-400",
        text: "text-main-400",
        dot: "bg-main-500",
      };
  }
};

export const StatisticBar = ({ title, value, percent }: StatisticBarProps) => {
  const percentValue = percent ? percent : 0;
  const colors = getSkillColor(title);

  return (
    <div className='flex items-center justify-between rounded-lg border border-second-400/25 bg-second-500/25 p-5 font-openSans transition-all duration-200 hover:border-second-400/40 hover:bg-second-500/40'>
      <div className='flex items-center gap-3'>
        <div className={`h-3 w-3 rounded-full ${colors.dot} shadow-sm`}></div>
        <div>
          <p className='text-sm font-semibold text-white'>{title}</p>
          <p className={`text-xs font-medium ${colors.text}`}>{value}</p>
        </div>
      </div>

      <div className='ml-4 flex items-center gap-4'>
        <div className='h-2.5 w-56 overflow-hidden rounded-full bg-second-400/30'>
          <div
            className={`h-full ${colors.accent} rounded-full shadow-sm transition-all duration-500 ease-out`}
            style={{ width: percentValue + "%" }}
          />
        </div>
        <span
          className={`text-base font-bold text-white min-w-[3.5rem] text-right`}>
          {percentValue}%
        </span>
      </div>
    </div>
  );
};
