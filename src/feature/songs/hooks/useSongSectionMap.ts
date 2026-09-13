import { nextSectionColor } from "feature/songs/components/SongSections/SectionList";
import type { YouTubeSongPlayerRef } from "feature/songs/components/YouTubeSongPlayer";
import { useVerifiedSongSectionMaps } from "feature/songs/hooks/useVerifiedSongSectionMaps";
import { submitSongSectionMap } from "feature/songs/services/songSectionMap.service";
import {
  getUserSongMeta,
  saveUserSongMeta,
} from "feature/songs/services/songSections.service";
import type {
  MasteryLevel,
  SongSection,
} from "feature/songs/types/songSection.type";
import { SECTION_COLORS } from "feature/songs/types/songSection.type";
import { MIN_SECTIONS } from "feature/songs/utils/sectionMapValidation.utils";
import { extractVideoId } from "feature/songs/utils/youtube.utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface UseSongSectionMapOptions {
  userId: string;
  songId: string;
  /**
   * Whether Space plays/pauses the video. Off inside the practice session,
   * where Space is the session's own play/pause and the two would fight over
   * the key. M / L / ← → stay on either way.
   */
  spaceTogglesVideo?: boolean;
}

/**
 * The state behind a song's section map: the pinned YouTube video, the
 * sections marked on it, the loop, the lock and the practice notes — loaded
 * from the user's song meta, saved back on every change, and offered to the
 * community once there are enough sections.
 *
 * Shared by the song timer page and by a song item inside a practice routine,
 * which compose the same player, timeline and list in different layouts.
 */
export const useSongSectionMap = ({
  userId,
  songId,
  spaceTogglesVideo = true,
}: UseSongSectionMapOptions) => {
  const playerRef = useRef<YouTubeSongPlayerRef>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [sections, setSections] = useState<SongSection[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopSectionId, setLoopSectionId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isMetaLoaded, setIsMetaLoaded] = useState(false);
  const isInitialMount = useRef(true);
  const metaLoadedRef = useRef(false);
  const latestMetaRef = useRef({ youtubeUrl, sections, notes });

  const videoId = youtubeUrl ? extractVideoId(youtubeUrl) : null;
  // Shows even before a video is pasted — importing sets both the video and
  // the sections together. Only relevant when there's nothing local to
  // import over yet.
  const { bySongId: verifiedSectionMaps } = useVerifiedSongSectionMaps();
  // Gated on isMetaLoaded too — `sections` starts as [] before the user's
  // own (possibly non-empty) meta has loaded, so without this a returning
  // user with existing sections could see the prompt flash open for a beat.
  const sectionMap =
    isMetaLoaded && sections.length === 0
      ? verifiedSectionMaps.get(songId)
      : undefined;
  const lastSharedSignatureRef = useRef<string | null>(null);

  // Prompt once, the moment a community map shows up — not a passive banner
  // the user has to notice on their own.
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const importPromptShownRef = useRef(false);

  useEffect(() => {
    if (sectionMap && !importPromptShownRef.current) {
      importPromptShownRef.current = true;
      setIsImportModalOpen(true);
    }
  }, [sectionMap]);

  useEffect(() => {
    getUserSongMeta(userId, songId).then((meta) => {
      setYoutubeUrl(meta.youtubeUrl ?? null);
      setSections(meta.sections ?? []);
      setNotes(meta.notes ?? "");
      metaLoadedRef.current = true;
      setIsMetaLoaded(true);
    });
  }, [userId, songId]);

  useEffect(() => {
    latestMetaRef.current = { youtubeUrl, sections, notes };
  }, [youtubeUrl, sections, notes]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveUserSongMeta(userId, songId, {
          youtubeUrl: youtubeUrl ?? undefined,
          sections,
          notes,
        });
      } finally {
        setIsSaving(false);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [youtubeUrl, sections, notes, userId, songId]);

  // Best-effort background share: once there are enough sections and a
  // pinned video, silently publish them so other users on the same song+video
  // get a community-verified starting point. Server-side gates (practice
  // history, structural validation, daily rate limit) decide acceptance —
  // rejections are expected/non-actionable here, so they're never surfaced.
  useEffect(() => {
    if (!videoId || sections.length < MIN_SECTIONS) return;

    const entries = sections
      .map((s) => ({ name: s.name, startTime: s.startTime }))
      .sort((a, b) => a.startTime - b.startTime);
    const signature = JSON.stringify(entries);
    if (signature === lastSharedSignatureRef.current) return;

    const timeout = setTimeout(async () => {
      try {
        await submitSongSectionMap(songId, videoId, entries);
        lastSharedSignatureRef.current = signature;
      } catch (error) {
        console.error("Error auto-sharing section map:", error);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [sections, videoId, songId]);

  // Leaving the page (back button, navigating to another song, …) unmounts
  // this component, which cancels the debounce timeout above — without this,
  // any edit made in the last second before navigating away is silently lost.
  useEffect(() => {
    return () => {
      if (!metaLoadedRef.current) return;
      const latest = latestMetaRef.current;
      saveUserSongMeta(userId, songId, {
        youtubeUrl: latest.youtubeUrl ?? undefined,
        sections: latest.sections,
        notes: latest.notes,
      });
    };
  }, [userId, songId]);

  /** Writes everything out now, ahead of the debounce — for a Finish button. */
  const saveNow = useCallback(async () => {
    setIsSaving(true);
    try {
      const latest = latestMetaRef.current;
      await saveUserSongMeta(userId, songId, {
        youtubeUrl: latest.youtubeUrl ?? undefined,
        sections: latest.sections,
        notes: latest.notes,
      });
    } finally {
      setIsSaving(false);
    }
  }, [userId, songId]);

  const persistSections = useCallback(
    (next: SongSection[]) => setSections(next),
    [],
  );

  const handleImportCommunityMap = () => {
    if (!sectionMap) return;
    const imported: SongSection[] = sectionMap.consensusSections.map(
      (cs, i) => ({
        id: uuidv4(),
        name: cs.name,
        startTime: cs.startTime,
        color: SECTION_COLORS[i % SECTION_COLORS.length],
        mastery: 0,
      }),
    );
    // Sections only make sense paired with the exact video they were mapped
    // against — safe to set even if a different link was already pasted,
    // since we only ever offer this import while sections is still empty.
    setYoutubeUrl(`https://www.youtube.com/watch?v=${sectionMap.videoId}`);
    persistSections(imported);
  };

  const handleUrlSave = (url: string) => setYoutubeUrl(url);

  const handleTimeUpdate = useCallback(
    (t: number, d: number) => {
      setCurrentTime(t);
      if (d > 0 && d !== duration) setDuration(d);

      if (!loopSectionId) return;
      const sorted = [...sections].sort((a, b) => a.startTime - b.startTime);
      const idx = sorted.findIndex((s) => s.id === loopSectionId);
      if (idx === -1) return;
      const loopSec = sorted[idx];
      const endTime = sorted[idx + 1]?.startTime ?? loopSec.startTime + 30;
      if (t >= endTime) {
        playerRef.current?.seekTo(loopSec.startTime);
      }
    },
    [duration, loopSectionId, sections],
  );

  const handleSeek = (time: number) => playerRef.current?.seekTo(time);

  const handleSectionPlay = (section: SongSection) => {
    setLoopSectionId(null);
    playerRef.current?.seekTo(section.startTime);
    playerRef.current?.play();
  };

  const handleSectionLoop = (section: SongSection) => {
    if (loopSectionId === section.id) {
      setLoopSectionId(null);
    } else {
      setLoopSectionId(section.id);
      playerRef.current?.seekTo(section.startTime);
      playerRef.current?.play();
    }
  };

  const handleAddSection = (name?: string) => {
    const newSection: SongSection = {
      id: uuidv4(),
      name: name ?? `Section ${sections.length + 1}`,
      startTime: Math.floor(currentTime),
      color: nextSectionColor(sections),
      mastery: 0,
    };
    persistSections([...sections, newSection]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.code) {
        case "Space":
          if (!spaceTogglesVideo) return;
          e.preventDefault();
          playerRef.current?.togglePlay();
          break;
        case "KeyM":
          if (!isLocked) {
            e.preventDefault();
            handleAddSection(undefined);
          }
          break;
        case "KeyL": {
          e.preventDefault();
          // Toggle loop for current section if any
          const currentSection = sections.find(
            (s) =>
              currentTime >= s.startTime &&
              currentTime <
                (sections.find((next) => next.startTime > s.startTime)
                  ?.startTime ?? Infinity),
          );
          if (currentSection) handleSectionLoop(currentSection);
          break;
        }
        case "ArrowLeft":
          e.preventDefault();
          playerRef.current?.seekTo(Math.max(0, currentTime - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          playerRef.current?.seekTo(Math.min(duration, currentTime + 5));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleRename = (id: string, name: string) =>
    persistSections(sections.map((s) => (s.id === id ? { ...s, name } : s)));

  const handleTimeChange = (id: string, startTime: number) =>
    persistSections(
      sections.map((s) => (s.id === id ? { ...s, startTime } : s)),
    );

  const handleMasteryChange = (id: string, mastery: MasteryLevel) =>
    persistSections(sections.map((s) => (s.id === id ? { ...s, mastery } : s)));

  const handleDelete = (id: string) => {
    if (loopSectionId === id) setLoopSectionId(null);
    persistSections(sections.filter((s) => s.id !== id));
  };

  return {
    playerRef,
    youtubeUrl,
    sections,
    currentTime,
    duration,
    loopSectionId,
    isLocked,
    setIsLocked,
    notes,
    setNotes,
    isSaving,
    isMetaLoaded,
    sectionMap,
    isImportModalOpen,
    setIsImportModalOpen,
    setDuration,
    saveNow,
    handleImportCommunityMap,
    handleUrlSave,
    handleTimeUpdate,
    handleSeek,
    handleSectionPlay,
    handleSectionLoop,
    handleAddSection,
    handleRename,
    handleTimeChange,
    handleMasteryChange,
    handleDelete,
  };
};

export type SongSectionMapController = ReturnType<typeof useSongSectionMap>;
