import axios from "axios";
import { enrichSong } from "feature/songs/services/enrichment.service";
import type { Song } from "feature/songs/types/songs.type";
import { useState } from "react";
import { toast } from "sonner";

export const useAdminBulkActions = (
  songs: Song[],
  password: string,
  onSongsUpdate: (updatedSongs: Song[]) => void,
  onFetchSongs: () => void
) => {
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isEnrichingBySong, setIsEnrichingBySong] = useState<Record<string, boolean>>({});

  const handleEnrich = async (songId: string, artist: string, title: string, silent = false) => {
    setIsEnrichingBySong(prev => ({ ...prev, [songId]: true }));
    try {
      const result = await enrichSong(songId, artist, title);
      if (result) {
        onSongsUpdate(songs.map(s => s.id === songId ? {
          ...s,
          coverUrl: result.coverUrl,
          isVerified: result.isVerified
        } : s));
        if (!silent) toast.success(`Enriched: ${title}`);
      } else {
        if (!silent) toast.error("Enrichment failed for this song");
      }
    } catch (error) {
      if (!silent) toast.error("Service error during enrichment");
    } finally {
      setIsEnrichingBySong(prev => ({ ...prev, [songId]: false }));
    }
  };

  const verifyAll = async () => {
    const unverified = songs.filter(s => !s.isVerified);
    if (unverified.length === 0) {
      toast.info("Database is fully verified.");
      return;
    }

    setIsBulkProcessing(true);
    setProgress({ current: 0, total: unverified.length });

    try {
      const res = await axios.post("/api/admin/enrich", { password }, {
        headers: { "x-admin-password": password }
      });

      if (res.data.success) {
        toast.success(`Verification complete. ${res.data.count} records updated.`);
        onFetchSongs();
      }
    } catch (err) {
      toast.error("Deep Scan failed on server.");
      console.error(err);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleMassEnrich = async () => {
    // Process all songs that don't have a cover, regardless of verification status
    const targetSongs = songs.filter(s => !s.coverUrl);

    if (targetSongs.length === 0) {
      toast.info("All songs in the current view already have covers.");
      return;
    }

    setIsBulkProcessing(true);
    setProgress({ current: 0, total: targetSongs.length });

    for (let i = 0; i < targetSongs.length; i++) {
      const song = targetSongs[i];
      try {
        await handleEnrich(song.id, song.artist, song.title, true);
        setProgress(prev => ({ ...prev, current: i + 1 }));
      } catch (err) {
        console.error(`Error mass enriching ${song.id}:`, err);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    setIsBulkProcessing(false);
    toast.success("Mass enrichment complete!");
    onFetchSongs();
  };


  const handleBulkEnrich = async (songsToEnrich: { id: string, artist: string, title: string }[]) => {
    if (songsToEnrich.length === 0) return;

    setIsBulkProcessing(true);
    setProgress({ current: 0, total: songsToEnrich.length });

    // Process in parallel with a concurrency limit of 5
    const batchSize = 5;
    for (let i = 0; i < songsToEnrich.length; i += batchSize) {
      const batch = songsToEnrich.slice(i, i + batchSize);
      await Promise.all(batch.map(async (song, index) => {
        try {
          await handleEnrich(song.id, song.artist, song.title, true);
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        } catch (err) {
          console.error(`Error enriching ${song.id}:`, err);
        }
      }));
      // Small pause between batches
      if (i + batchSize < songsToEnrich.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    setIsBulkProcessing(false);
    toast.success(`Success! ${songsToEnrich.length} songs are now live and enriched.`);
    onFetchSongs();
  };

  return {
    isBulkProcessing,
    progress,
    isEnrichingBySong,
    handleEnrich,
    verifyAll,
    handleMassEnrich,
    handleBulkEnrich,
  };
};
