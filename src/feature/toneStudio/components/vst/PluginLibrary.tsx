import { Button } from "assets/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { useVstHost } from "feature/toneStudio/hooks/useVstHost";
import type { VstCategory } from "feature/toneStudio/utils/vstLibrary";
import {
  filterPlugins,
  presentCategories,
} from "feature/toneStudio/utils/vstLibrary";
import { useTranslation } from "hooks/useTranslation";
import {
  ChevronDown,
  FilePlus,
  FolderPlus,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import type { RefObject } from "react";
import { useMemo, useState } from "react";

interface PluginLibraryProps {
  /** How many times each plugin id already sits in the rack. */
  inRack: Map<string, number>;
  onAdd: (pluginId: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}

const chipClass = (active: boolean) =>
  cn(
    "shrink-0 rounded px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
    active
      ? "bg-zinc-700/70 text-zinc-100"
      : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
  );

const quietButton =
  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50";

/**
 * Every VST3 effect riff.quest knows about on this computer. Nothing is
 * scanned until the player asks — a first scan loads every plugin file and can
 * take a minute — and plugins kept anywhere else can be added as a file or a
 * whole folder. Clicking a plugin puts it at the end of the rack.
 */
export const PluginLibrary = ({
  inRack,
  onAdd,
  searchRef,
}: PluginLibraryProps) => {
  const { t } = useTranslation("tone_studio");
  const vst = useVstHost();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<VstCategory | "all">("all");
  const [showFailed, setShowFailed] = useState(false);

  const library = vst.library;
  const plugins = useMemo(() => library?.plugins ?? [], [library]);
  const categories = useMemo(() => presentCategories(plugins), [plugins]);
  const visible = useMemo(
    () => filterPlugins(plugins, query, category),
    [plugins, query, category],
  );
  const failed = library?.failed ?? [];
  const folders = library?.sources.folders ?? [];
  const neverScanned = !!library && library.scannedAt === null;
  const progress = vst.scanProgress;

  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type='button' className={quietButton} disabled={vst.scanning}>
          <Plus size={14} />
          {t("library.add")}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='w-56 rounded-lg border-0 bg-zinc-900 p-1 text-zinc-200 shadow-none'>
        <DropdownMenuItem
          onSelect={() => vst.addFile()}
          className='rounded focus:bg-zinc-800 focus:text-zinc-100'>
          <FilePlus className='text-zinc-400' />
          {t("library.add_file")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => vst.addFolder()}
          className='rounded focus:bg-zinc-800 focus:text-zinc-100'>
          <FolderPlus className='text-zinc-400' />
          {t("library.add_folder")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <section className='flex flex-col gap-4 rounded-lg bg-zinc-950/40 p-4 sm:p-5'>
      <header className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <div className='flex min-w-0 flex-1 flex-col'>
          <h3 className='font-display text-base font-semibold text-zinc-100'>
            {t("library.title")}
          </h3>
          <span className='text-xs text-zinc-500'>
            {library?.scannedAt
              ? t("library.summary", {
                  count: plugins.length,
                  date: new Date(library.scannedAt).toLocaleDateString(),
                })
              : t("library.count", { count: plugins.length })}
          </span>
        </div>
        {!neverScanned && (
          <button
            type='button'
            onClick={() => vst.scan()}
            disabled={vst.scanning}
            className={quietButton}>
            <RefreshCw
              size={14}
              className={vst.scanning ? "animate-spin" : ""}
            />
            {t("library.rescan")}
          </button>
        )}
        {addMenu}
      </header>

      {vst.scanning && (
        <div className='flex flex-col gap-2 rounded-lg bg-zinc-900/50 px-4 py-3'>
          <div className='flex items-center justify-between gap-3 text-xs'>
            <span className='text-zinc-300'>
              {progress && progress.total > 0
                ? t("library.reading", {
                    done: progress.done,
                    total: progress.total,
                  })
                : t("library.looking")}
            </span>
            {progress?.current && (
              <span className='truncate text-zinc-500'>{progress.current}</span>
            )}
          </div>
          <div className='h-1 overflow-hidden rounded-full bg-zinc-800'>
            <div
              className='h-full rounded-full bg-zinc-300 transition-[width] duration-base'
              style={{
                width: `${progress && progress.total > 0 ? (progress.done / progress.total) * 100 : 4}%`,
              }}
            />
          </div>
        </div>
      )}

      {vst.libraryError && (
        <p className='text-xs text-red-400'>{vst.libraryError}</p>
      )}

      {neverScanned && plugins.length === 0 && !vst.scanning ? (
        <div className='flex flex-col items-center gap-4 rounded-lg bg-zinc-900/40 px-6 py-10 text-center'>
          <div className='flex flex-col gap-2'>
            <p className='font-display text-lg font-semibold text-zinc-100'>
              {t("library.first_title")}
            </p>
            <p className='mx-auto max-w-md text-sm text-zinc-400'>
              {t("library.first_body")}
            </p>
          </div>
          <div className='flex flex-wrap justify-center gap-2'>
            <Button onClick={() => vst.scan()}>
              <Search />
              {t("library.scan")}
            </Button>
            <Button
              variant='ghost'
              onClick={() => vst.addFile()}
              className='text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'>
              <FilePlus />
              {t("library.add_file")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <div className='sm:w-72'>
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("library.search")}
                aria-label={t("library.search")}
                startIcon={<Search size={14} className='ml-1 text-zinc-500' />}
                className='border-0 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-500'
              />
            </div>
            {categories.length > 1 && (
              <div className='flex gap-1.5 overflow-x-auto pb-1 sm:pb-0'>
                <button
                  type='button'
                  onClick={() => setCategory("all")}
                  className={chipClass(category === "all")}>
                  {t("library.cat_all")}
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    type='button'
                    onClick={() => setCategory(c)}
                    className={chipClass(category === c)}>
                    {t(`library.cat_${c}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {visible.length === 0 ? (
            <p className='rounded-lg bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500'>
              {plugins.length === 0
                ? t("library.none_found")
                : t("library.no_match")}
            </p>
          ) : (
            <ul className='grid gap-2 sm:grid-cols-2 xl:grid-cols-3'>
              {visible.map((plugin) => {
                const count = inRack.get(plugin.id) ?? 0;
                return (
                  <li
                    key={plugin.id}
                    className='group flex items-center rounded-lg bg-zinc-900/50 transition-colors hover:bg-zinc-800/60'>
                    <button
                      type='button'
                      onClick={() => onAdd(plugin.id)}
                      aria-label={t("library.add_to_rack", {
                        name: plugin.name,
                      })}
                      className='flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400'>
                      <span className='flex min-w-0 flex-1 flex-col'>
                        <span className='truncate text-sm text-zinc-100'>
                          {plugin.name}
                        </span>
                        <span className='truncate text-xs text-zinc-500'>
                          {plugin.vendor}
                          {plugin.source !== "system" &&
                            ` · ${t("library.added_by_you")}`}
                        </span>
                      </span>
                      {count > 0 && (
                        <span className='shrink-0 text-[11px] text-zinc-500'>
                          {t("library.in_rack", { count })}
                        </span>
                      )}
                      <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded bg-zinc-800/80 text-zinc-400 transition-colors group-hover:bg-zinc-700 group-hover:text-zinc-100'>
                        <Plus size={14} />
                      </span>
                    </button>
                    {plugin.source === "file" && plugin.sourcePath && (
                      <button
                        type='button'
                        onClick={() => vst.removeSource(plugin.sourcePath!)}
                        aria-label={t("library.forget", { name: plugin.name })}
                        className='mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'>
                        <X size={13} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {neverScanned && !vst.scanning && (
            <button
              type='button'
              onClick={() => vst.scan()}
              className={cn(quietButton, "self-start")}>
              <Search size={14} />
              {t("library.scan_rest")}
            </button>
          )}
        </>
      )}

      {(failed.length > 0 || folders.length > 0) && (
        <div className='flex flex-col gap-3'>
          {folders.length > 0 && (
            <div className='flex flex-col gap-1.5'>
              <span className='text-xs text-zinc-500'>
                {t("library.your_folders")}
              </span>
              {folders.map((folder) => (
                <div
                  key={folder}
                  className='flex items-center gap-2 text-xs text-zinc-400'>
                  <span className='min-w-0 truncate'>{folder}</span>
                  <button
                    type='button'
                    onClick={() => vst.removeSource(folder)}
                    aria-label={t("library.forget", { name: folder })}
                    className='flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {failed.length > 0 && (
            <div className='flex flex-col gap-1.5'>
              <button
                type='button'
                onClick={() => setShowFailed((open) => !open)}
                aria-expanded={showFailed}
                className='flex items-center gap-1 self-start text-xs text-zinc-500 transition-colors hover:text-zinc-300'>
                <ChevronDown
                  size={13}
                  className={cn(
                    "transition-transform",
                    !showFailed && "-rotate-90",
                  )}
                />
                {t("library.failed_toggle", { count: failed.length })}
              </button>
              {showFailed && (
                <ul className='flex flex-col gap-1 pl-4'>
                  {failed.map((plugin) => (
                    <li key={plugin.name} className='text-xs text-zinc-500'>
                      <span className='text-zinc-300'>{plugin.name}</span> —{" "}
                      {plugin.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
