import { useTranslation } from "hooks/useTranslation";
import { Button } from "assets/components/ui/button";
import { Textarea } from "assets/components/ui/textarea";
import { cn } from "assets/lib/utils";
import { saveReportNote } from "feature/practiceLog/services/practiceLogMutations.service";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Mirrors MAX_DESCRIPTION_LENGTH in pages/api/user/report/manage.
export const MAX_NOTE_LENGTH = 500;
// The counter only shows up once the limit is worth knowing about.
const COUNTER_FROM = 400;

interface SessionNoteFormProps {
  /** The report's Firestore doc id — its `reportDate` as an ISO string. */
  reportId: string;
}

/**
 * Free-text note on the session that was just saved. The report already exists
 * by the time the summary shows, so saving is a plain PATCH of its description
 * and never touches the points.
 */
export const SessionNoteForm = ({ reportId }: SessionNoteFormProps) => {
  const { t } = useTranslation("session_summary");
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const trimmed = note.trim();
  const isSaved = trimmed === savedNote && savedNote.length > 0;
  // Clearing a saved note counts as a change — it saves the empty string.
  const canSave =
    !isSaving && trimmed !== savedNote && note.length <= MAX_NOTE_LENGTH;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await saveReportNote(reportId, trimmed);
      setSavedNote(trimmed);
    } catch (error) {
      console.error("Failed to save session note:", error);
      toast.error(t("note.save_error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='flex flex-col gap-4'>
      <p className='text-sm leading-relaxed text-zinc-400'>
        {t("note.intro")}
      </p>

      <Textarea
        value={note}
        maxLength={MAX_NOTE_LENGTH}
        rows={3}
        onChange={(event) => setNote(event.target.value)}
        placeholder={t("note.placeholder")}
        aria-label={t("note.aria")}
        className='resize-none border-none bg-zinc-800/40 text-sm text-zinc-100 shadow-none placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-0'
      />

      <div className='flex items-center justify-end gap-4'>
        {note.length >= COUNTER_FROM && (
          <span className='text-xs tabular-nums text-zinc-500'>
            {note.length}/{MAX_NOTE_LENGTH}
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "gap-2 font-semibold",
            isSaved
              ? "bg-emerald-500/10 text-emerald-400 disabled:opacity-100"
              : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
          )}>
          {isSaved && <Check className='h-4 w-4' aria-hidden />}
          {isSaving ? t("note.saving") : isSaved ? t("note.saved") : t("note.save")}
        </Button>
      </div>
    </div>
  );
};
