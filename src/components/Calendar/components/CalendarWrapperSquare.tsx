import { useState } from "react";
import ReactTooltip from "react-tooltip";
import type { ReportListInterface } from "types/api.types";

import CalendarSquare from "./CalendarSquare/CalendarSquare";
import ExerciseShortInfo from "./ExerciseShortInfo";

interface CalendarWrapperSquareProps {
  index: number;
  date: Date;
  report: ReportListInterface | undefined;
}

const CalendarWrapperSquare = ({
  date,
  index,
  report,
}: CalendarWrapperSquareProps) => {
  const [showToolTip, setShowTooltip] = useState(false);

  return (
    <div
      data-tip
      data-for={index.toString()}
      onMouseEnter={() => setShowTooltip(true)}>
      {report && showToolTip && (
        <ReactTooltip id={index.toString()}>
          <ExerciseShortInfo date={date} report={report} />
        </ReactTooltip>
      )}
      <CalendarSquare report={report} />
    </div>
  );
};

export default CalendarWrapperSquare;
