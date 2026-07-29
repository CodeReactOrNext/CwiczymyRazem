import type { SongGuide } from "../types";

interface GuideTocProps {
  guide: SongGuide;
}

interface TocEntry {
  id: string;
  label: string;
}

/**
 * Mirrors SongGuidePage's renderSection switch, one section at a time, so
 * the TOC always matches what's actually on the page for this guide (some
 * sections are optional per-guide, e.g. songMap/sources/videoLessons).
 */
const getTocEntries = (guide: SongGuide): TocEntry[] => {
  const entries: TocEntry[] = [];

  guide.sectionOrder.forEach((sectionId) => {
    if (sectionId.startsWith("custom:")) {
      const blockId = sectionId.slice("custom:".length);
      const block = guide.customBlocks.find((b) => b.id === blockId);
      if (block) entries.push({ id: sectionId, label: block.heading });
      return;
    }

    switch (sectionId) {
      case "verdict":
        entries.push({ id: sectionId, label: guide.verdict.heading });
        break;
      case "whoFor":
        entries.push({ id: sectionId, label: guide.whoFor.heading });
        break;
      case "techniques":
        entries.push({ id: sectionId, label: guide.techniques.heading });
        break;
      case "songMap":
        if (guide.songMap) {
          entries.push({ id: sectionId, label: guide.songMap.heading });
        }
        break;
      case "timeline":
        entries.push({ id: sectionId, label: guide.timeline.heading });
        break;
      case "mistakes":
        entries.push({ id: sectionId, label: guide.mistakes.heading });
        break;
      case "practicePlan":
        entries.push({ id: sectionId, label: guide.practicePlan.heading });
        break;
      case "learningPath":
        entries.push({ id: sectionId, label: guide.learningPath.heading });
        break;
      case "progression":
        entries.push({ id: sectionId, label: guide.progression.heading });
        break;
      case "sources":
        if (guide.sources && guide.sources.length > 0) {
          entries.push({ id: sectionId, label: "Sources" });
        }
        break;
      case "videoLessons":
        if (guide.videoLessons && guide.videoLessons.length > 0) {
          entries.push({ id: sectionId, label: "Video lessons" });
        }
        break;
      default:
        break;
    }
  });

  entries.push({ id: "faq", label: "FAQ" });

  return entries;
};

export const GuideToc = ({ guide }: GuideTocProps) => {
  const entries = getTocEntries(guide);

  if (entries.length === 0) return null;

  return (
    <nav
      aria-label='In this guide'
      className='mx-auto w-full max-w-5xl px-6 pb-6'>
      <div className='rounded-lg bg-zinc-900/40 p-5'>
        <p className='mb-3 text-xs font-semibold text-zinc-500'>
          In this guide
        </p>
        <div className='flex flex-wrap gap-2'>
          {entries.map((entry) => (
            <a
              key={entry.id}
              href={`#${entry.id}`}
              className='rounded-full bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white'>
              {entry.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};
