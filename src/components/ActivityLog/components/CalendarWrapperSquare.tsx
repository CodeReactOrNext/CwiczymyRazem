import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import type { ReportListInterfaceWithTimeSumary } from "../activityLog.types";

import CalendarSquare from "./CalendarSquare/CalendarSquare";
import ExerciseShortInfo from "./ExerciseShortInfo";

interface CalendarWrapperSquareProps {
  date: Date;
  report: ReportListInterfaceWithTimeSumary | undefined;
}

const CalendarWrapperSquare = ({
  date,
  report,
}: CalendarWrapperSquareProps) => {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger>
          <div>
            <CalendarSquare report={report} />
          </div>
        </TooltipTrigger>
        {report && (
          <TooltipContent>
            <ExerciseShortInfo date={date} report={report} />
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default CalendarWrapperSquare;
