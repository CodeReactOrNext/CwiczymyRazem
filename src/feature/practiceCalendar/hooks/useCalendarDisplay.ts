import { useRotationDisplay } from "feature/rotation/hooks/useRotationDisplay";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import type { LucideIcon } from "lucide-react";
import { Bookmark, Gauge, Signpost } from "lucide-react";
import { useCallback } from "react";
import type { IconType } from "react-icons";

import type { CalendarItem } from "../types/calendar.types";
import { fromDateKey } from "../utils/calendarDates";

export interface CalendarItemDisplay {
  title: string;
  subtitle: string;
  coverUrl?: string;
  Icon: IconType | LucideIcon;
}

/** Names, icons and dates for the calendar, in the player's language. */
export const useCalendarDisplay = () => {
  const { t } = useTranslation(["calendar", "common"]);
  const { describe: describeRotation } = useRotationDisplay();
  const locale = useIntlLocale();

  const describe = useCallback(
    (item: CalendarItem): CalendarItemDisplay => {
      if (item.kind === "song" && item.song) {
        return describeRotation({ type: "song", addedAt: 0, ...item.song });
      }
      if (item.kind === "goal") {
        const base = item.exerciseId
          ? describeRotation({
              type: "exercise",
              id: item.exerciseId,
              addedAt: 0,
            })
          : null;
        return {
          title: base?.title ?? item.title ?? "",
          subtitle: item.bpm
            ? t("item.goal_bpm", { bpm: item.bpm })
            : t("kinds.goal"),
          Icon: Gauge,
        };
      }
      if (item.kind === "roadmap") {
        return {
          title: item.title ?? "",
          subtitle: item.note ?? t("kinds.roadmap"),
          coverUrl: item.song?.coverUrl,
          Icon: Signpost,
        };
      }
      if (item.kind === "custom") {
        return {
          title: item.title ?? "",
          subtitle: item.note || t(`areas.${item.area}`),
          Icon: Bookmark,
        };
      }
      return describeRotation({
        type: "exercise",
        id: item.exerciseId ?? "",
        addedAt: 0,
      });
    },
    [describeRotation, t],
  );

  const formatDate = useCallback(
    (key: string, options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, options).format(fromDateKey(key)),
    [locale],
  );

  /** "1 h 20 min", "45 min". */
  const formatMinutes = useCallback(
    (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const rest = minutes % 60;
      if (hours === 0) return t("time.minutes", { count: rest });
      if (rest === 0) return t("time.hours", { count: hours });
      return t("time.hours_minutes", { hours, minutes: rest });
    },
    [t],
  );

  return { describe, formatDate, formatMinutes, t };
};
