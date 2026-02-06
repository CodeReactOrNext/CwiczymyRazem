import type { DayOfWeek } from "../types/weeklyScheduler.types";

export const getCurrentWeekStart = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const getWeekDays = (weekStartDate: Date): Date[] => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStartDate);
    day.setDate(weekStartDate.getDate() + i);
    days.push(day);
  }
  return days;
};

export const formatDayName = (date: Date, locale: string = "en-US"): string => {
  return date.toLocaleDateString(locale, { weekday: "long" });
};

export const formatShortDayName = (date: Date, locale: string = "en-US"): string => {
  return date.toLocaleDateString(locale, { weekday: "short" });
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const getDayOfWeekKey = (date: Date): DayOfWeek => {
  const dayIndex = date.getDay();
  const days: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[dayIndex];
};

export const formatWeekRange = (weekStartDate: Date, locale: string = "en-US"): string => {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  const startMonth = weekStartDate.toLocaleDateString(locale, { month: "short" });
  const endMonth = weekEndDate.toLocaleDateString(locale, { month: "short" });
  const startDay = weekStartDate.getDate();
  const endDay = weekEndDate.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
};
