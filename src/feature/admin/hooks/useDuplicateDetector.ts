import { useState, useMemo } from "react";
import { Song } from "feature/songs/types/songs.type";

export const useDuplicateDetector = (songs: Song[]) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const duplicates = useMemo(() => {
    const map = new Map<string, Song[]>();

    songs.forEach((song) => {
      const normalTitle = song.title?.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
      const normalArtist = song.artist?.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
      const key = `${normalArtist}|${normalTitle}`;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(song);
    });

    const duplicateGroups: { key: string; songs: Song[] }[] = [];
    map.forEach((group, key) => {
      if (group.length > 1) {
        duplicateGroups.push({ key, songs: group });
      }
    });

    return duplicateGroups;
  }, [songs]);

  return {
    duplicates,
    duplicateCount: duplicates.length,
    isModalOpen,
    setIsModalOpen,
  };
};
