import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import type { GlobalSearchResult } from "components/GlobalSearch/useGlobalSearch";
import { useGlobalSearch } from "components/GlobalSearch/useGlobalSearch";
import {
  ClipboardList,
  Dumbbell,
  Loader2,
  Music,
  Search,
} from "lucide-react";
import { useRouter } from "next/router";
import type { KeyboardEvent } from "react";
import { Fragment, useEffect, useRef, useState } from "react";

const GROUP_LABELS: Record<GlobalSearchResult["type"], string> = {
  plan: "Plans",
  exercise: "Exercises",
  song: "Songs",
};

const GROUP_ICONS: Record<GlobalSearchResult["type"], typeof Music> = {
  plan: ClipboardList,
  exercise: Dumbbell,
  song: Music,
};

// Matches the color coding already used for these categories elsewhere in the
// app (e.g. the dashboard quick-links: indigo = plans, emerald = exercises,
// amber = songs).
const GROUP_TILE_CLASSES: Record<GlobalSearchResult["type"], string> = {
  plan: "bg-indigo-500/10 text-indigo-400",
  exercise: "bg-emerald-500/10 text-emerald-400",
  song: "bg-amber-500/10 text-amber-400",
};

const highlightMatch = (text: string, query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return text;
  const startIndex = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (startIndex === -1) return text;
  const endIndex = startIndex + trimmed.length;
  return (
    <>
      {text.slice(0, startIndex)}
      <span className='text-cyan-400'>{text.slice(startIndex, endIndex)}</span>
      {text.slice(endIndex)}
    </>
  );
};

export const GlobalSearch = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, isLoading, hasQuery } = useGlobalSearch(query, isOpen);

  // Re-sync the highlighted row to the first result whenever the result set
  // itself changes (new query, or plans/songs finishing their fetch) — set
  // during render rather than in an effect to avoid an extra render pass.
  const [syncedResults, setSyncedResults] = useState(results);
  if (results !== syncedResults) {
    setSyncedResults(results);
    setHighlightedIndex(results.length > 0 ? 0 : -1);
  }

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setQuery("");
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (result: GlobalSearchResult) => {
    handleOpenChange(false);
    router.push(result.href);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      handleSelect(results[highlightedIndex]);
    }
  };

  return (
    <>
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className='hidden w-48 items-center gap-2 rounded-lg bg-zinc-900/60 px-3 py-2 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300 sm:flex lg:w-64'>
        <Search className='h-4 w-4 shrink-0' />
        <span className='flex-1 truncate'>Search...</span>
        <kbd className='hidden shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 lg:inline-block'>
          Ctrl K
        </kbd>
      </button>

      <button
        type='button'
        onClick={() => setIsOpen(true)}
        aria-label='Search'
        className='flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/40 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 sm:hidden'>
        <Search className='h-4 w-4' />
      </button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
          className='gap-0 border-none bg-zinc-950 p-0 shadow-none sm:top-24 sm:max-w-2xl sm:translate-y-0'>
          <DialogTitle className='sr-only'>Search</DialogTitle>
          <DialogDescription className='sr-only'>
            Search your plans, exercises and songs
          </DialogDescription>

          <div className='flex items-center gap-3 bg-zinc-900/40 px-4 py-3 pr-14 sm:px-5 sm:py-4'>
            <Search className='h-5 w-5 shrink-0 text-zinc-500' />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Search plans, exercises, songs...'
              autoComplete='off'
              className='flex-1 bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-500'
            />
            {isLoading && <Loader2 className='h-4 w-4 shrink-0 animate-spin text-zinc-500' />}
          </div>

          <div className='max-h-[60vh] overflow-y-auto p-2 sm:p-3'>
            {!hasQuery && (
              <p className='px-3 py-10 text-center text-sm text-zinc-500'>
                Start typing to search your plans, exercises and songs.
              </p>
            )}
            {hasQuery && results.length === 0 && !isLoading && (
              <p className='px-3 py-10 text-center text-sm text-zinc-500'>
                No results for &ldquo;{query.trim()}&rdquo;.
              </p>
            )}
            {results.map((result, index) => {
              const Icon = GROUP_ICONS[result.type];
              const showGroupLabel =
                index === 0 || results[index - 1].type !== result.type;
              return (
                <Fragment key={`${result.type}-${result.id}`}>
                  {showGroupLabel && (
                    <p className='px-3 pb-1 pt-3 text-xs font-medium text-zinc-500 first:pt-1'>
                      {GROUP_LABELS[result.type]}
                    </p>
                  )}
                  <button
                    type='button'
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                      index === highlightedIndex ? "bg-zinc-800" : "hover:bg-zinc-800/60",
                    )}>
                    {result.type === "song" && result.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={result.coverUrl}
                        alt=''
                        className='h-9 w-9 shrink-0 rounded object-cover'
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded",
                          GROUP_TILE_CLASSES[result.type],
                        )}>
                        <Icon className='h-4 w-4' />
                      </div>
                    )}
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-semibold text-zinc-100'>
                        {highlightMatch(result.title, query)}
                      </p>
                      <p className='truncate text-xs text-zinc-400'>{result.subtitle}</p>
                    </div>
                  </button>
                </Fragment>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalSearch;
