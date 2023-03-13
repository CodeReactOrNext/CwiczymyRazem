import { ReportListInterface } from "types/api.types";

interface CalendarSquareProps {
  report: ReportListInterface | undefined;
}

const CalendarSquare = ({ report }: CalendarSquareProps) => {
  const getPointRaitings = (report: ReportListInterface | undefined) => {
    if (report === null) return null;
    if (report === undefined) return;

    switch (true) {
      case !!report.isDateBackReport !== false:
        return "backDate";
      case report.points > 30:
        return "super";
      case report.points > 20:
        return "great";
      case report.points > 10:
        return "nice";
      case report.points >= 0:
        return "ok";
      case report.points === 0:
        return "zero";
      default:
        return null;
    }
  };

  const raiting = getPointRaitings(report);

  return (
    <div
      className={`m-[0.2rem] rounded-[1px] p-[0.3rem]
${raiting === "backDate" ? "cursor-pointer bg-blue-400" : null}
${raiting === "super" ? "cursor-pointer bg-main-calendar" : null}
${raiting === "great" ? "cursor-pointer bg-main-calendar/80" : null}
${raiting === "nice" ? "cursor-pointer bg-main-calendar/70" : null}
${raiting === "ok" ? "cursor-pointer bg-main-calendar/60" : null}
${raiting === "zero" ? "cursor-pointer bg-main-calendar/20" : null}
${raiting ? "" : "bg-slate-600/50"}
`}></div>
  );
};

export default CalendarSquare;
