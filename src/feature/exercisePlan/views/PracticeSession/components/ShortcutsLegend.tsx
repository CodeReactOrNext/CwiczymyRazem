import { Button } from "assets/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Keyboard } from "lucide-react";
import { memo, useState } from "react";

interface ShortcutRow {
  keys: string[];
  label: string;
}

const NAV_SHORTCUTS: ShortcutRow[] = [
  { keys: ["Space"], label: "Play / pause" },
  { keys: ["K"], label: "Previous exercise" },
  { keys: ["J"], label: "Next exercise" },
];

const TEMPO_SHORTCUTS: ShortcutRow[] = [
  { keys: ["↑"], label: "Tempo +1 BPM" },
  { keys: ["↓"], label: "Tempo -1 BPM" },
  { keys: ["Shift", "↑"], label: "Tempo +5 BPM" },
  { keys: ["Shift", "↓"], label: "Tempo -5 BPM" },
  { keys: ["Enter"], label: "Reset tempo to recommended" },
];

const BACKING_SHORTCUTS: ShortcutRow[] = [
  { keys: ["["], label: "Backing track 20 ms earlier" },
  { keys: ["]"], label: "Backing track 20 ms later" },
  { keys: ["Shift", "["], label: "Backing track 100 ms earlier" },
  { keys: ["Shift", "]"], label: "Backing track 100 ms later" },
];

const Kbd = ({ children }: { children: string }) => (
  <kbd className="flex h-6 min-w-6 items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-[11px] font-bold text-zinc-200">
    {children}
  </kbd>
);

const ShortcutList = ({ rows }: { rows: ShortcutRow[] }) => (
  <div className="flex flex-col gap-2.5">
    {rows.map((row) => (
      <div key={row.label} className="flex items-center justify-between gap-4">
        <span className="text-sm text-zinc-300">{row.label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {row.keys.map((key, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-[10px] text-zinc-600">+</span>}
              <Kbd>{key}</Kbd>
            </span>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/** Compact keyboard-shortcuts legend for the practice session — desktop only. */
export const ShortcutsLegend = memo(function ShortcutsLegend({
  hasTempoControl,
  hasBackingTrack = false,
  className,
}: {
  hasTempoControl: boolean;
  /** Song practice with a backing track — adds the live nudge keys. */
  hasBackingTrack?: boolean;
  className?: string;
}) {
  const { t } = useTranslation("session");
  const [isOpen, setIsOpen] = useState(false);
  const localize = (rows: ShortcutRow[], group: string): ShortcutRow[] =>
    rows.map((row, i) => ({ ...row, label: t(`shortcuts.${group}.${i}`, row.label) }));

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title={t("shortcuts.title")}
        onClick={() => setIsOpen(true)}
        className={cn("h-9 w-9 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10", className)}
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* z-index must beat the session view or this dialog opens invisibly behind it. */}
        <DialogContent className="max-w-sm bg-zinc-900 text-white z-[99999999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Keyboard className="h-5 w-5 text-zinc-400" />
              {t("shortcuts.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <ShortcutList rows={localize(NAV_SHORTCUTS, "nav")} />
            {hasTempoControl && (
              <div className="flex flex-col gap-2.5 pt-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {t("shortcuts.tempo")}
                </span>
                <ShortcutList rows={localize(TEMPO_SHORTCUTS, "tempo_rows")} />
              </div>
            )}
            {hasBackingTrack && (
              <div className="flex flex-col gap-2.5 pt-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  {t("shortcuts.backing")}
                </span>
                <ShortcutList rows={localize(BACKING_SHORTCUTS, "backing_rows")} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
