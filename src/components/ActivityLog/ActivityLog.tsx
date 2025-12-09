import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaSpinner } from "react-icons/fa";

import { Card } from "assets/components/ui/card";

import type { DateWithReport } from "./activityLog.types";
import { useActivityLog } from "./hooks/useActivityLog";
import ActivityCalendarCanvas from "./components/ActivityCalendarCanvas";
import ExerciseShortInfo from "./components/ExerciseShortInfo";

const CALENDAR_HEIGHT = 7 * 19;

const ActivityLog = ({ userAuth }: { userAuth: string }) => {
  const { t } = useTranslation("common");
  const { reportList, year, setYear, datasWithReports } =
    useActivityLog(userAuth);

  const [hoveredItem, setHoveredItem] = useState<DateWithReport | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleHover = useCallback(
    (item: DateWithReport | null, x: number, y: number) => {
      if (item?.report) {
        setHoveredItem(item);
        setTooltipPosition({ x, y });
      } else {
        setHoveredItem(null);
      }
    },
    []
  );

  const startYear = 2023;
  const currentYear = new Date().getFullYear();
  const yearButtons = [];
  for (let y = startYear; y <= currentYear; y++) {
    yearButtons.push(y);
  }

  if (!reportList.length) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <FaSpinner className="animate-spin text-2xl text-second" />
      </div>
    );
  }

  return (
    <Card className="relative w-full overflow-hidden rounded-xl">
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Aktywność</h3>

          <div className="flex gap-1 rounded-lg bg-white/10 p-1">
            {yearButtons.map((yearValue) => (
              <button
                key={`year-btn-${yearValue}`}
                role="tab"
                onClick={() => setYear(yearValue)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  year === yearValue
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {yearValue}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div 
            className="flex flex-col justify-between text-xs text-white/60 shrink-0" 
            style={{ height: CALENDAR_HEIGHT, paddingTop: 2, paddingBottom: 2 }}
          >
            <span>{t("calendar.monday")}</span>
            <span>{t("calendar.thursday")}</span>
            <span>{t("calendar.sunday")}</span>
          </div>

          <div 
            className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
            style={{ height: CALENDAR_HEIGHT + 8 }}
          >
            <ActivityCalendarCanvas
              datasWithReports={datasWithReports}
              onHover={handleHover}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <div className="relative h-3 w-3 rounded bg-cyan-500">
              <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            </div>
            <span>{t("calendar.hasTitle")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative h-3 w-3 rounded bg-cyan-500">
              <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
            </div>
            <span>{t("calendar.backDate")}</span>
          </div>
        </div>
      </div>

      {hoveredItem?.report && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-white/10 bg-neutral-900/95 p-3 shadow-xl backdrop-blur-sm"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 16,
            transform: "translateX(-50%) translateY(-100%)",
          }}
        >
          <ExerciseShortInfo
            date={hoveredItem.date}
            report={hoveredItem.report}
          />
        </div>
      )}
    </Card>
  );
};

export default ActivityLog;
