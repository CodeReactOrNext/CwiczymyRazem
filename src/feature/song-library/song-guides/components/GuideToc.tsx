"use client";

import { cn } from "assets/lib/utils";
import { useEffect, useMemo, useState } from "react";

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
 * sections are optional per-guide, e.g. songMap/riffPreview/sources/videoLessons).
 * CTA-only sections (inlineCta, relatedExercises) are deliberately excluded —
 * they're not landmarks a reader would jump to.
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
      case "riffPreview":
        if (guide.riffPreview) {
          entries.push({ id: sectionId, label: guide.riffPreview.heading });
        }
        break;
      case "timeline":
        entries.push({ id: sectionId, label: guide.timeline.heading });
        break;
      case "practicePlan":
        entries.push({ id: sectionId, label: guide.practicePlan.heading });
        break;
      case "learningPath":
        entries.push({ id: sectionId, label: guide.learningPath.heading });
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

/**
 * Fixed left-rail TOC — only shown once the viewport is wide enough that
 * there's genuinely unused space beside the max-w-5xl article column (below
 * that it would either overlap the text or have nowhere to sit, so it's
 * hidden rather than squeezed in). Scroll-spy highlights whichever section is
 * nearest the top of the viewport.
 */
export const GuideToc = ({ guide }: GuideTocProps) => {
  const entries = useMemo(() => getTocEntries(guide), [guide]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (observedEntries) => {
        const visible = observedEntries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-140px 0px -70% 0px", threshold: 0 }
    );

    const elements = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => Boolean(el));
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav
      aria-label='In this guide'
      className='no-scrollbar fixed left-8 top-28 z-30 hidden max-h-[calc(100vh-9rem)] w-56 overflow-y-auto min-[1600px]:block'>
      <p className='mb-3 text-xs font-semibold text-zinc-500'>In this guide</p>
      <ul className='space-y-1'>
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className={cn(
                "block truncate rounded px-3 py-1.5 text-sm transition-colors",
                activeId === entry.id
                  ? "bg-cyan-500/10 font-semibold text-cyan-400"
                  : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
              )}>
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
