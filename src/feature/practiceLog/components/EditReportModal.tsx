import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { Textarea } from "assets/components/ui/textarea";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { convertMsToHM } from "utils/converter";

import { CATEGORY_META } from "../config/sessionType";
import { updatePracticeReport } from "../services/practiceLogMutations.service";
import type { PracticeLogSession } from "../types/practiceLog.types";

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_TIME_MS = 24 * 60 * 60 * 1000;

type CategoryKey =
  | "techniqueTime"
  | "theoryTime"
  | "hearingTime"
  | "creativityTime";

type TimeFields = Record<CategoryKey, { hours: string; minutes: string }>;

const msToFields = (ms: number) => {
  const totalMinutes = Math.round(ms / 60000);
  return {
    hours: String(Math.floor(totalMinutes / 60)),
    minutes: String(totalMinutes % 60),
  };
};

const fieldsToMs = (field: { hours: string; minutes: string }) => {
  const hours = Number(field.hours) || 0;
  const minutes = Number(field.minutes) || 0;
  return hours * 3600000 + minutes * 60000;
};

const fieldLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500";
const inputClass =
  "border-none bg-white/5 text-sm text-zinc-100 shadow-none placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-0";

const TimeUnitInput = ({
  value,
  max,
  unit,
  label,
  onChange,
}: {
  value: string;
  max: number;
  unit: string;
  label: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex items-center rounded-lg bg-white/5 transition-shadow focus-within:ring-1 focus-within:ring-cyan-500/50">
    <input
      type="number"
      min={0}
      max={max}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onFocus={(event) => event.target.select()}
      aria-label={label}
      className="w-12 bg-transparent py-2 pl-2.5 text-right text-sm tabular-nums text-zinc-100 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
    <span className="py-2 pl-1 pr-2.5 text-xs text-zinc-500">{unit}</span>
  </div>
);

interface EditReportModalProps {
  session: PracticeLogSession | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const EditReportForm = ({
  session,
  onOpenChange,
  onSaved,
}: {
  session: PracticeLogSession;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) => {
  const { t } = useTranslation(["practice_log", "common"]);
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description ?? "");
  const [timeFields, setTimeFields] = useState<TimeFields>(() => ({
    techniqueTime: msToFields(session.timeSumary?.techniqueTime ?? 0),
    theoryTime: msToFields(session.timeSumary?.theoryTime ?? 0),
    hearingTime: msToFields(session.timeSumary?.hearingTime ?? 0),
    creativityTime: msToFields(session.timeSumary?.creativityTime ?? 0),
  }));
  const [isSaving, setIsSaving] = useState(false);

  const totalMs = useMemo(
    () =>
      CATEGORY_META.reduce(
        (sum, { key }) => sum + fieldsToMs(timeFields[key]),
        0
      ),
    [timeFields]
  );

  const trimmedTitle = title.trim();
  const isValid =
    trimmedTitle.length > 0 &&
    trimmedTitle.length <= MAX_TITLE_LENGTH &&
    description.length <= MAX_DESCRIPTION_LENGTH &&
    totalMs > 0 &&
    totalMs <= MAX_TIME_MS;

  const setField = (
    key: CategoryKey,
    part: "hours" | "minutes",
    value: string
  ) => {
    setTimeFields((prev) => ({
      ...prev,
      [key]: { ...prev[key], [part]: value },
    }));
  };

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      await updatePracticeReport({
        reportId: session.id,
        title: trimmedTitle,
        description: description.trim(),
        timeSumary: {
          techniqueTime: fieldsToMs(timeFields.techniqueTime),
          theoryTime: fieldsToMs(timeFields.theoryTime),
          hearingTime: fieldsToMs(timeFields.hearingTime),
          creativityTime: fieldsToMs(timeFields.creativityTime),
        },
      });
      toast.success(t("toast.edit_success"));
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error("Failed to update report:", error);
      toast.error(t("toast.edit_error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle className="font-display text-lg font-semibold text-zinc-50">
          {t("edit_modal.title")}
        </DialogTitle>
        <p className="text-xs text-zinc-500">
          {session.date.toLocaleDateString("en", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}{" "}
          · {t("edit_modal.date_locked")}
        </p>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="report-title" className={fieldLabelClass}>
            {t("edit_modal.title_label")}
          </Label>
          <Input
            id="report-title"
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="report-description" className={fieldLabelClass}>
            {t("edit_modal.description_label")}
          </Label>
          <Textarea
            id="report-description"
            value={description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
            className={cn(inputClass, "resize-none")}
            placeholder={t("edit_modal.description_placeholder")}
          />
        </div>

        <div className="space-y-3">
          <Label className={fieldLabelClass}>{t("edit_modal.time_label")}</Label>

          <div className="flex flex-col gap-1.5">
            {CATEGORY_META.map(({ key, labelKey, dot }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-lg px-1 py-0.5"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
                  <span className="truncate text-sm text-zinc-300">
                    {t(labelKey)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <TimeUnitInput
                    value={timeFields[key].hours}
                    max={24}
                    unit={t("edit_modal.hours")}
                    label={`${t(labelKey)} ${t("edit_modal.hours")}`}
                    onChange={(value) => setField(key, "hours", value)}
                  />
                  <TimeUnitInput
                    value={timeFields[key].minutes}
                    max={59}
                    unit={t("edit_modal.minutes")}
                    label={`${t(labelKey)} ${t("edit_modal.minutes")}`}
                    onChange={(value) => setField(key, "minutes", value)}
                  />
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-baseline justify-between px-1 pt-1">
            <span className={fieldLabelClass}>{t("edit_modal.total")}</span>
            <span
              className={cn(
                "text-base font-semibold tabular-nums",
                totalMs === 0 ? "text-zinc-500" : "text-cyan-300"
              )}
            >
              {convertMsToHM(totalMs)}h
            </span>
          </div>
          {totalMs === 0 && (
            <p className="px-1 text-xs text-rose-400">
              {t("edit_modal.total_required")}
            </p>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-zinc-600">
          {t("edit_modal.stats_note")}
        </p>
      </div>

      <DialogFooter className="gap-2">
        <button
          onClick={() => onOpenChange(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
        >
          {t("edit_modal.cancel")}
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? t("edit_modal.saving") : t("edit_modal.save")}
        </button>
      </DialogFooter>
    </>
  );
};

export const EditReportModal = ({
  session,
  onOpenChange,
  onSaved,
}: EditReportModalProps) => {
  return (
    <Dialog open={!!session} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-none bg-zinc-900 text-zinc-100 sm:max-w-[440px] sm:rounded-xl">
        {session && (
          <EditReportForm
            key={session.id}
            session={session}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
