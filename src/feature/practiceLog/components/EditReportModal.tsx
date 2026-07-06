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
import { useTranslation } from "hooks/useTranslation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { convertMsToHM } from "utils/converter";

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

const CATEGORIES: { key: CategoryKey; labelKey: string }[] = [
  { key: "techniqueTime", labelKey: "common:calendar.technique" },
  { key: "theoryTime", labelKey: "common:calendar.theory" },
  { key: "hearingTime", labelKey: "common:calendar.hearing" },
  { key: "creativityTime", labelKey: "common:calendar.creativity" },
];

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
      CATEGORIES.reduce((sum, { key }) => sum + fieldsToMs(timeFields[key]), 0),
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
      <DialogHeader>
        <DialogTitle>{t("edit_modal.title")}</DialogTitle>
        <p className="text-xs text-zinc-500">
          {session.date.toLocaleDateString("en", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}{" "}
          — {t("edit_modal.date_locked")}
        </p>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="report-title">{t("edit_modal.title_label")}</Label>
          <Input
            id="report-title"
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            className="border-white/10 bg-white/5 text-zinc-100"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="report-description">
            {t("edit_modal.description_label")}
          </Label>
          <Textarea
            id="report-description"
            value={description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
            className="border-white/10 bg-white/5 text-zinc-100 resize-none"
            placeholder={t("edit_modal.description_placeholder")}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("edit_modal.time_label")}</Label>
          {CATEGORIES.map(({ key, labelKey }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-24 text-xs font-semibold text-zinc-400">
                {t(labelKey)}
              </span>
              <Input
                type="number"
                min={0}
                max={24}
                value={timeFields[key].hours}
                onChange={(event) => setField(key, "hours", event.target.value)}
                className="w-20 border-white/10 bg-white/5 text-zinc-100"
                aria-label={`${t(labelKey)} ${t("edit_modal.hours")}`}
              />
              <span className="text-xs text-zinc-500">
                {t("edit_modal.hours")}
              </span>
              <Input
                type="number"
                min={0}
                max={59}
                value={timeFields[key].minutes}
                onChange={(event) =>
                  setField(key, "minutes", event.target.value)
                }
                className="w-20 border-white/10 bg-white/5 text-zinc-100"
                aria-label={`${t(labelKey)} ${t("edit_modal.minutes")}`}
              />
              <span className="text-xs text-zinc-500">
                {t("edit_modal.minutes")}
              </span>
            </div>
          ))}
          <p className="text-xs font-semibold text-zinc-400">
            {t("edit_modal.total")}:{" "}
            <span className="text-cyan-400">{convertMsToHM(totalMs)}h</span>
          </p>
          {totalMs === 0 && (
            <p className="text-xs text-rose-400">
              {t("edit_modal.total_required")}
            </p>
          )}
        </div>

        <p className="text-[11px] text-zinc-500 border-t border-white/10 pt-3">
          {t("edit_modal.stats_note")}
        </p>
      </div>

      <DialogFooter className="gap-2">
        <button
          onClick={() => onOpenChange(false)}
          className="px-4 py-2 rounded bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 text-sm font-semibold transition-background"
        >
          {t("edit_modal.cancel")}
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-background"
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
      <DialogContent className="sm:max-w-[440px] border-white/10 bg-zinc-950 text-zinc-100 max-h-[90dvh] overflow-y-auto">
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
