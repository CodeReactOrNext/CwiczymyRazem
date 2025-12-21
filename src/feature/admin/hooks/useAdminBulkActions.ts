import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { enrichSong } from "feature/songs/services/enrichment.service";
import type { Song } from "feature/songs/types/songs.type";

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
    const unverified = songs.filter(s => !s.isVerified);
    if (unverified.length === 0) {
      toast.info("All songs are already enriched and verified.");
      return;
    }

    setIsBulkProcessing(true);
    setProgress({ current: 0, total: unverified.length });

    for (let i = 0; i < unverified.length; i++) {
      const song = unverified[i];
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
  };

  return {
    isBulkProcessing,
    progress,
    isEnrichingBySong,
    handleEnrich,
    verifyAll,
    handleMassEnrich
  };
};
