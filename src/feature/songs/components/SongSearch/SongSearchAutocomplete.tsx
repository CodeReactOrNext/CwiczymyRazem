import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { useSongSuggestions } from "feature/songs/hooks/useSongSuggestions";
import type {
  SongSuggestion,
  SongSuggestionField,
} from "feature/songs/services/getSongSuggestions";
import { useTranslation } from "hooks/useTranslation";
import type { LucideIcon } from "lucide-react";
import { Loader2, Music } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

interface SongSearchAutocompleteProps {
  field: SongSuggestionField;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: LucideIcon;
  className?: string;
}

const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text;
  const startIndex = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (startIndex === -1) return text;
  const endIndex = startIndex + query.trim().length;
  return (
    <>
      {text.slice(0, startIndex)}
      <span className='text-cyan-400'>{text.slice(startIndex, endIndex)}</span>
      {text.slice(endIndex)}
    </>
  );
};

export const SongSearchAutocomplete = ({
  field,
  value,
  onChange,
  placeholder,
  icon: Icon,
  className,
}: SongSearchAutocompleteProps) => {
  const { t } = useTranslation("songs");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading } = useSongSuggestions(field, value, isOpen);
  const showDropdown =
    isOpen && value.trim().length >= 2 && (isLoading || suggestions.length > 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectSuggestion = (suggestion: SongSuggestion) => {
    onChange(field === "title" ? suggestion.title : suggestion.artist);
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("group relative", className)}>
      <div className='pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4'>
        <Icon className='h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-white' />
      </div>
      <Input
        placeholder={placeholder}
        value={value}
        autoComplete='off'
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => {
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        className='h-12 w-full border-none bg-zinc-900/60 pl-11 font-medium text-white transition-all placeholder:text-zinc-400 focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10'
      />

      {showDropdown && (
        <div className='absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-80 space-y-1 overflow-y-auto rounded-lg bg-zinc-900 p-2 duration-150 animate-in fade-in-0 slide-in-from-top-1'>
          {isLoading && suggestions.length === 0 ? (
            <div className='flex items-center justify-center gap-2 px-3 py-4 text-sm text-zinc-500'>
              <Loader2 className='h-4 w-4 animate-spin' />
              {t("searching", "Searching...") as string}
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type='button'
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-background",
                  index === highlightedIndex
                    ? "bg-zinc-800"
                    : "hover:bg-zinc-800/60",
                )}>
                {suggestion.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={suggestion.coverUrl}
                    alt=''
                    className='h-9 w-9 shrink-0 rounded object-cover'
                  />
                ) : (
                  <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded bg-zinc-800 text-zinc-500'>
                    <Music className='h-4 w-4' />
                  </div>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-zinc-100'>
                    {highlightMatch(
                      suggestion.title,
                      field === "title" ? value : "",
                    )}
                  </p>
                  <p className='truncate text-xs text-zinc-400'>
                    {highlightMatch(
                      suggestion.artist,
                      field === "artist" ? value : "",
                    )}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
