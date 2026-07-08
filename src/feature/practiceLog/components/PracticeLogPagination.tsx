import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

interface PracticeLogPaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Windowed page list: 1 … 4 5 6 … 12 */
const buildPageItems = (
  current: number,
  total: number
): (number | "gap")[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("gap");
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < total - 1) items.push("gap");
  items.push(total);

  return items;
};

export const PracticeLogPagination = ({
  page,
  totalPages,
  onChange,
}: PracticeLogPaginationProps) => {
  const { t } = useTranslation("practice_log");
  const items = useMemo(
    () => buildPageItems(page, totalPages),
    [page, totalPages]
  );

  if (totalPages <= 1) return null;

  const arrowClass =
    "flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-30";

  return (
    <nav
      className="flex items-center justify-center gap-1 pt-4"
      aria-label={t("pagination.label")}
    >
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={arrowClass}
        aria-label={t("pagination.previous")}
      >
        <ChevronLeft size={16} />
      </button>

      {items.map((item, index) =>
        item === "gap" ? (
          <span
            key={`gap-${index}`}
            className="px-1 text-xs text-zinc-600"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "h-8 min-w-8 rounded-lg px-2.5 text-xs font-semibold tabular-nums transition-colors",
              item === page
                ? "bg-white/10 text-zinc-50"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={arrowClass}
        aria-label={t("pagination.next")}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};
