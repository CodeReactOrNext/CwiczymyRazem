import type { ReportFormikInterface } from "../ReportView.types";

const CATEGORIES = [
  { key: "technique", label: "Technique" },
  { key: "theory", label: "Theory" },
  { key: "hearing", label: "Hearing" },
  { key: "creativity", label: "Creativity" },
] as const;

const toMinutes = (hours: string, minutes: string) =>
  (Number(hours) || 0) * 60 + (Number(minutes) || 0);

const formatMinutes = (total: number) => {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const formatDay = (countBackDays: number) => {
  if (countBackDays <= 0) return "Today";
  if (countBackDays === 1) return "Yesterday";
  return `${countBackDays} days ago`;
};

/**
 * What "Save" is about to log, in one line — "5 min · Technique · Today" — so
 * the quick save is a confirmed choice rather than a leap.
 */
export const buildSaveSummary = (
  values: Pick<
    ReportFormikInterface,
    | "techniqueHours" | "techniqueMinutes"
    | "theoryHours" | "theoryMinutes"
    | "hearingHours" | "hearingMinutes"
    | "creativityHours" | "creativityMinutes"
    | "countBackDays"
  >,
): string => {
  const parts = CATEGORIES.map(({ key, label }) => ({
    label,
    minutes: toMinutes(values[`${key}Hours`], values[`${key}Minutes`]),
  })).filter((part) => part.minutes > 0);

  const total = parts.reduce((sum, part) => sum + part.minutes, 0);
  const categories =
    parts.length === 1
      ? parts[0].label
      : parts.map((part) => `${part.label} ${formatMinutes(part.minutes)}`).join(", ");

  return [formatMinutes(total), categories, formatDay(Number(values.countBackDays) || 0)]
    .filter(Boolean)
    .join(" · ");
};
