import { Card } from "assets/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { AnimatePresence,motion } from "framer-motion";
import { useRipple } from "hooks/useRipple";
import { useTranslation } from "hooks/useTranslation";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { FaSpinner } from "react-icons/fa";

import type { DateWithReport } from "./activityLog.types";
import ActivityCalendarCanvas from "./components/ActivityCalendarCanvas";
import ExerciseShortInfo from "./components/ExerciseShortInfo";
import { useActivityLog } from "./hooks/useActivityLog";

const CALENDAR_HEIGHT = 7 * 19;

const YearTabButton = ({
  yearValue,
  active,
  onSelect,
}: {
  yearValue: number;
  active: boolean;
  onSelect: () => void;
}) => {
  const { createRipple, ripple } = useRipple();
  return (
    <button
      role='tab'
      onClick={(e) => {
        createRipple(e);
        onSelect();
      }}
      className={`relative overflow-hidden rounded-md px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-white/20 text-white"
          : "text-white/60 hover:bg-white/15 hover:text-white"
      }`}>
      {ripple}
      {yearValue}
    </button>
  );
};

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
  const { t } = useTranslation("common");

  const [hoveredItem, setHoveredItem] = useState<DateWithReport | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedDay, setSelectedDay] = useState<DateWithReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px]'
          >
            <div className='flex flex-col items-center gap-3'>
              <div className="relative">
                <FaSpinner className='animate-spin text-4xl text-cyan-500' />
                <div className="absolute inset-0 animate-pulse blur-xl bg-cyan-500/20" />
              </div>
              <span className='text-[10px] font-bold uppercase tracking-widest text-cyan-500/80'>
                {t("loading.subtitle", { defaultValue: "Synchronizing" })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`transition-all duration-500 ${isLoading ? 'blur-[1.5px] opacity-40 grayscale-[0.5] pointer-events-none scale-[0.995]' : 'blur-0 opacity-100 grayscale-0'}`}>
         <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-xl font-semibold text-white mr-2'>Activity</h3>

          <div className='flex gap-1 rounded-lg bg-white/10 p-1'>
            {yearButtons.map((yearValue) => (
              <YearTabButton
                key={`year-btn-${yearValue}`}
                yearValue={yearValue}
                active={year === yearValue}
                onSelect={() => setYear(yearValue)}
              />
            ))}
          </div>
        </div>

        <div className='flex items-start gap-3'>
          <div
            className='flex shrink-0 flex-col justify-between text-[10px] text-zinc-500 font-medium pr-2'
            style={{ height: CALENDAR_HEIGHT, paddingTop: 2, paddingBottom: 2 }}>
            <span>{t("calendar.monday")}</span>
            <span>{t("calendar.thursday")}</span>
            <span>{t("calendar.sunday")}</span>
          </div>

          <div
            className='flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20'
            style={{ height: CALENDAR_HEIGHT + 8 }}>
            {isLoading && datasWithReports.length === 0 ? (
              <div className='flex gap-[5px]' style={{ height: CALENDAR_HEIGHT }}>
                {Array.from({ length: 53 }).map((_, col) => (
                  <div key={col} className='flex flex-col gap-[5px]'>
                    {Array.from({ length: 7 }).map((_, row) => (
                      <div
                        key={row}
                        className='animate-pulse rounded-[3px] bg-zinc-800'
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
            className='pointer-events-none fixed z-50 rounded-xl border border-[#e8e4db] bg-[#fcfbf7] p-3 shadow-2xl backdrop-blur-md sm:block hidden'
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
        <DialogContent className="max-w-none sm:max-w-[425px] border-[#e8e4db] bg-[#fcfbf7] text-zinc-900 h-full sm:h-auto max-h-[90dvh] !p-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-stone-300">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-zinc-900">Activity Details</DialogTitle>
            </DialogHeader>
            {selectedDay?.report && (
              <ExerciseShortInfo
                date={selectedDay.date}
                report={selectedDay.report}
                isModal={true}
              />
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
