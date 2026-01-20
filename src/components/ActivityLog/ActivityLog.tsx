import { Card } from "assets/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { AnimatePresence,motion } from "framer-motion";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FaSpinner } from "react-icons/fa";

import type { DateWithReport } from "./activityLog.types";
import ActivityCalendarCanvas from "./components/ActivityCalendarCanvas";
import ExerciseShortInfo from "./components/ExerciseShortInfo";
import { useActivityLog } from "./hooks/useActivityLog";

const CALENDAR_HEIGHT = 7 * 19;

export interface ActivityLogViewProps {
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
    <Card className='relative w-full overflow-hidden rounded-xl border-white/5 bg-zinc-900/50 backdrop-blur-md p-0'>
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

      <div className={`p-4 transition-all duration-500 ${isLoading ? 'blur-[1.5px] opacity-40 grayscale-[0.5] pointer-events-none scale-[0.995]' : 'blur-0 opacity-100 grayscale-0'}`}>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-xl font-semibold text-white mr-2'>Activity</h3>

          <div className='flex gap-1 rounded-lg bg-white/10 p-1'>
            {yearButtons.map((yearValue) => (
              <button
                key={`year-btn-${yearValue}`}
                role='tab'
                onClick={() => setYear(yearValue)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  year === yearValue
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}>
                {yearValue}
              </button>
            ))}
          </div>
        </div>

        <div className='flex items-start gap-3'>
          <div
            className='flex shrink-0 flex-col justify-between text-xs text-white/60'
            style={{ height: CALENDAR_HEIGHT, paddingTop: 2, paddingBottom: 2 }}>
            <span>{t("calendar.monday")}</span>
            <span>{t("calendar.thursday")}</span>
            <span>{t("calendar.sunday")}</span>
          </div>

          <div
            className='flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20'
            style={{ height: CALENDAR_HEIGHT + 8 }}>
            <ActivityCalendarCanvas
              datasWithReports={datasWithReports}
              onHover={handleHover}
              onClick={handleDayClick}
            />
          </div>
        </div>

        <div className='mt-4 flex flex-wrap gap-4 text-xs text-white/60'>
          <div className='flex items-center gap-2'>
            <div className='relative h-3 w-3 rounded bg-cyan-500'>
              <div className='absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white' />
            </div>
            <span>{t("calendar.hasTitle")}</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='relative h-3 w-3 rounded bg-cyan-500'>
              <div className='absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white' />
            </div>
            <span>{t("calendar.backDate")}</span>
          </div>
        </div>

        <div className='mt-4 flex w-full items-center justify-end gap-2 text-xs text-zinc-500'>
          <span>Less</span>
          <div className='flex gap-1'>
            <div className='h-3 w-3 rounded-[3px] bg-[#3f3f46]' />
            <div className='h-3 w-3 rounded-[3px] bg-[#A5F3FC]' />
            <div className='h-3 w-3 rounded-[3px] bg-[#67E8F9]' />
            <div className='h-3 w-3 rounded-[3px] bg-[#22D3EE]' />
            <div className='h-3 w-3 rounded-[3px] bg-[#06B6D4]' />
            <div className='h-3 w-3 rounded-[3px] bg-[#0891B2]' />
          </div>
          <span>More</span>
        </div>
      </div>

      {hoveredItem?.report &&
        createPortal(
          <div
            className='pointer-events-none fixed z-50 rounded-lg border border-white/10 bg-neutral-900/95 p-3 shadow-xl backdrop-blur-sm sm:block hidden'
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
        <DialogContent className="border-white/10 bg-neutral-900 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {selectedDay?.report && (
            <ExerciseShortInfo
              date={selectedDay.date}
              report={selectedDay.report}
              isModal={true}
            />
          )}
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
