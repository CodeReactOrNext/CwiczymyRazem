import { useState, useMemo, useCallback } from "react";
import { Song } from "feature/songs/types/songs.type";
import axios from "axios";
import { toast } from "sonner";

export const useDuplicateDetector = (initialSongs: Song[], password?: string) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedSongs, setScannedSongs] = useState<Song[] | null>(null);

  const songsToProcess = scannedSongs || initialSongs;

  const handleDeepScan = useCallback(async () => {
    if (!password) {
      toast.error("Admin credentials required for deep scan");
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScannedSongs([]);

    let allSongs: Song[] = [];
    let currentPage = 1;
    let hasMore = true;
    const CHUNK_SIZE = 1000;

    try {
      while (hasMore) {
        const response = await axios.get("/api/admin/songs", {
          params: {
            page: currentPage,
            limit: CHUNK_SIZE,
            filterType: "all"
          },
          headers: {
            "x-admin-password": password
          }
        });

        const { songs, total, stats } = response.data;

        // Check if we already have these songs to avoid infinite loop 
        // (though FireStore pagination logic in our API might be simple offset-based)
        if (!songs || songs.length === 0) {
          hasMore = false;
          break;
        }

        allSongs = [...allSongs, ...songs];
        setScannedSongs(prev => {
          const uniqueMap = new Map<string, Song>((prev || []).map(s => [s.id, s]));
          songs.forEach((s: Song) => uniqueMap.set(s.id, s));
          return Array.from(uniqueMap.values());
        }); // Update UI progressively, ensuring unique IDs

        const totalReal = total || stats?.total || 0;
        setScanProgress(Math.min(Math.round((allSongs.length / totalReal) * 100), 100));

        if (allSongs.length >= totalReal) {
          hasMore = false;
        } else {
          currentPage = Math.floor(allSongs.length / CHUNK_SIZE) + 1;
          // Simple safety break for very large DBs
          if (currentPage > 20) {
            toast.info("Database too large for a single scan. Analyze first 20,000 matches.");
            hasMore = false;
          }
        }
      }

      toast.success(`Deep scan complete! Analyzed ${allSongs.length} songs.`);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Deep scan failed:", error);
      toast.error("Deep scan failed. Check network.");
    } finally {
      setIsScanning(false);
    }
  }, [password]);

  const duplicates = useMemo(() => {
    const map = new Map<string, Song[]>();

    songsToProcess.forEach((song) => {
      const normalTitle = song.title?.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
      const normalArtist = song.artist?.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
      const key = `${normalArtist}|${normalTitle}`;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(song);
    });

    const duplicateGroups: { key: string; songs: Song[] }[] = [];
    map.forEach((group, _key) => {
      if (group.length > 1) {
        duplicateGroups.push({ key: _key, songs: group });
      }
    });

    return duplicateGroups;
  }, [songsToProcess]);

  return {
    duplicates,
    duplicateCount: duplicates.length,
    isModalOpen,
    setIsModalOpen,
    isScanning,
    scanProgress,
    handleDeepScan,
    scannedCount: songsToProcess.length
  };
};
