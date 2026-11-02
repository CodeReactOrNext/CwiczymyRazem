import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { useTranslation } from "hooks/useTranslation";
import { ArrowUpDown } from "lucide-react";
import { isLibrarySort, LIBRARY_SORTS, type LibrarySort } from "utils/librarySort";

interface LibrarySortSelectProps {
  value: LibrarySort;
  onChange: (sort: LibrarySort) => void;
}

export const LibrarySortSelect = ({ value, onChange }: LibrarySortSelectProps) => {
  const { t } = useTranslation("library");

  return (
    <Select
      value={value}
      onValueChange={(next) => isLibrarySort(next) && onChange(next)}>
      <SelectTrigger
        aria-label={t("sort.label")}
        className='h-10 w-full gap-2 border-0 bg-zinc-900/60 px-3 text-sm font-semibold text-zinc-200 sm:w-48'>
        <span className='flex items-center text-zinc-500'>
          <ArrowUpDown size={14} aria-hidden />
        </span>
        <SelectValue>{t(`sort.${value}`)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LIBRARY_SORTS.map((sort) => (
          <SelectItem key={sort} value={sort}>
            {t(`sort.${sort}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
