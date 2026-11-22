import { buttonVariants } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Skeleton } from "assets/components/ui/skeleton";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getLocalDateKey } from "utils/converter";

import type { DateWithReport } from "./activityLog.types";
import ActivityCalendarCanvas from "./components/ActivityCalendarCanvas";
import ExerciseShortInfo from "./components/ExerciseShortInfo";
import { useActivityLog } from "./hooks/useActivityLog";

const CALENDAR_CELL_SIZE = 19;
const CALENDAR_HEIGHT = 7 * CALENDAR_CELL_SIZE;

interface ActivityLogViewProps {
  year: number;
  setYear: (year: number) => void;
  datasWithReports: DateWithReport[];
  isLoading: boolean;
}

export const ActivityLogView = ({
  year,
  setYear,
  datasWithReports,
  isLoading,
}: ActivityLogViewProps) => {
  const { t } = useTranslation(["common", "ui"]);

  const [hoveredItem, setHoveredItem] = useState<DateWithReport | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedDay, setSelectedDay] = useState<DateWithReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // On mobile the calendar overflows horizontally and defaults to the start of
  // the year. Scroll to today's column once data is ready so the most recent
  // activity is visible without manual scrolling.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoading || datasWithReports.length === 0) return;
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    if (year !== new Date().getFullYear()) return;

    const todayStr = new Date().toDateString();
    // Leading placeholders carry today's date as filler — skip them, otherwise
    // the match lands on column 0 and the calendar never moves.
    const todayIndex = datasWithReports.findIndex(
      (d) => !d.isPlaceholder && d.date.toDateString() === todayStr
    );
    if (todayIndex === -1) return;

    const todayCol = Math.floor(todayIndex / 7);
    const todayX = todayCol * CALENDAR_CELL_SIZE;
    // Park today two cells from the right edge so the last few days still read
    // as "recent" instead of being flush against the border.
    const target = todayX - container.clientWidth + CALENDAR_CELL_SIZE * 2;
    container.scrollLeft = Math.max(0, target);
  }, [datasWithReports, isLoading, year]);

  const handleHover = useCallback(
    (item: DateWithReport | null, x: number, y: number) => {
      // Hide tooltip if modal is open to avoid clutter, or keep it.
      // The boolean prop "sm:block hidden" on tooltip div handles mobile visibility.
      if (item?.report) {
        setHoveredItem(item);
        setTooltipPosition({ x, y });
      } else {
        setHoveredItem(null);
      }
    },
    []
  );

  const handleDayClick = useCallback((item: DateWithReport) => {
    if (item.report) {
      setSelectedDay(item);
      setIsModalOpen(true);
    }
  }, []);

  const startYear = 2023;
  const currentYear = new Date().getFullYear();
  const yearButtons = [];
  for (let y = startYear; y <= currentYear; y++) {
    yearButtons.push(y);
  }

  return (
    <Card className='relative w-full p-5 sm:p-6 mb-6'>
      {/* First load only (cached logs render straight away): the calendar stays
          in place, dimmed, instead of a blurred overlay with a spinner. */}
      <div
        aria-busy={isLoading}
        className={`transition-opacity duration-base ${isLoading ? "pointer-events-none animate-pulse opacity-50" : "opacity-100"}`}>
         <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='mr-2 text-base font-semibold text-zinc-100'>Activity</h3>

          <SegmentedControl
            label={String(year)}
            selected={[String(year)]}
            onSelect={(value) => setYear(Number(value))}
            options={yearButtons.map((yearValue) => ({
              value: String(yearValue),
              label: String(yearValue),
            }))}
          />
        </div>

        <div className='flex items-start gap-3'>
          <div
            className='flex shrink-0 flex-col justify-between text-xs text-zinc-400 font-medium pr-2'
            style={{ height: CALENDAR_HEIGHT, paddingTop: 2, paddingBottom: 2 }}>
            <span>{t("calendar.monday")}</span>
            <span>{t("calendar.thursday")}</span>
            <span>{t("calendar.sunday")}</span>
          </div>

          <div
            ref={scrollContainerRef}
            className='flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20'
            style={{ height: CALENDAR_HEIGHT + 8 }}>
            {isLoading && datasWithReports.length === 0 ? (
              <div className='flex gap-[5px]' style={{ height: CALENDAR_HEIGHT }}>
                {Array.from({ length: 53 }).map((_, col) => (
                  <div key={col} className='flex flex-col gap-[5px]'>
                    {Array.from({ length: 7 }).map((_, row) => (
                      <Skeleton
                        key={row}
                        className='rounded-[3px]'
                        style={{ width: 14, height: 14 }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <ActivityCalendarCanvas
                datasWithReports={datasWithReports}
                onHover={handleHover}
                onClick={handleDayClick}
              />
            )}
          </div>
        </div>

      </div>

      {hoveredItem?.report &&
        createPortal(
          <div
            className='pointer-events-none fixed z-50 hidden rounded-lg bg-white p-3 text-black sm:block'
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 16,
              transform: "translateX(-50%) translateY(-100%)",
            }}>
            <ExerciseShortInfo
              date={hoveredItem.date}
              report={hoveredItem.report}
            />
          </div>,
          document.body
        )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] !p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
            <DialogHeader className="mb-4">
              <DialogTitle>{t("ui:activity_details")}</DialogTitle>
            </DialogHeader>
            {selectedDay?.report && (
              <>
                <ExerciseShortInfo
                  date={selectedDay.date}
                  report={selectedDay.report}
                  isModal={true}
                />
                <Link
                  href={`/practice-log?date=${getLocalDateKey(selectedDay.date)}`}
                  className={buttonVariants({
                    variant: "subtle",
                    className: "mt-4 w-full font-semibold",
                  })}
                >
                  {t("ui:open_in_practice_log")}
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const ActivityLog = ({ userAuth }: { userAuth: string }) => {
  const activityLogData = useActivityLog(userAuth);

  return <ActivityLogView {...activityLogData} />;
};

export default ActivityLog;
