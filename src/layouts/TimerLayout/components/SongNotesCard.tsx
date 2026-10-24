import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { FileText } from "lucide-react";

const MAX_LINES = 300;

interface SongNotesCardProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  isSaving: boolean;
  className?: string;
}

/** The song's practice notes, saved with its section map. */
export const SongNotesCard = ({
  notes,
  onNotesChange,
  isSaving,
  className,
}: SongNotesCardProps) => {
  const { t } = useTranslation("timer");

  return (
    <div className={cn("rounded-lg bg-zinc-900/40", className)}>
      <div className='flex items-center justify-between px-5 pt-4'>
        <div className='flex items-center gap-2 text-zinc-400'>
          <FileText className='h-4 w-4' />
          <span className='text-xs font-bold text-zinc-500'>
            {t("song_timer.practice_notes")}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          {isSaving && (
            <span className='animate-pulse text-[10px] text-zinc-500'>
              {t("saving")}
            </span>
          )}
          <span
            className={cn(
              "text-[10px] font-medium",
              notes.split(" ").length > 250
                ? "text-amber-400"
                : "text-zinc-500",
            )}>
            {t("song_timer.lines", { count: notes.split("\n").length })}
          </span>
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => {
          if (e.target.value.split("\n").length <= MAX_LINES) {
            onNotesChange(e.target.value);
          }
        }}
        placeholder={t("song_timer.notes_placeholder")}
        // 16px below lg — iOS zooms the page into any smaller field it focuses.
        className='min-h-[160px] w-full resize-none bg-transparent px-5 pb-5 pt-3 text-base leading-relaxed text-zinc-300 placeholder:text-zinc-600 focus:outline-none lg:text-sm'
      />
    </div>
  );
};
