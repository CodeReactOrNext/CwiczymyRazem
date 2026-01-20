import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { Song } from "feature/songs/types/songs.type";
import { useCallback, useEffect,useState } from "react";
import { toast } from "sonner";

export const useAdminSongs = (password: string) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unverified" | "no-cover" | "no-rating">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", artist: "", avgDifficulty: 0 });

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [filterType, searchTerm]);

  const { data: adminSongsData, isLoading, refetch: fetchSongs } = useQuery({
    queryKey: ["admin-songs", password, page, filterType, searchTerm],
    queryFn: async () => {
      const res = await axios.get("/api/admin/songs", {
        headers: { "x-admin-password": password },
        params: { page, limit: ITEMS_PER_PAGE, filterType, search: searchTerm }
      });
      return res.data as { songs: Song[], total: number, stats: any };
    },
    enabled: !!password,
  });

  const songs = adminSongsData?.songs || [];
  const totalCount = adminSongsData?.total || 0;
  const globalStats = adminSongsData?.stats || { total: 0, unverified: 0, noCover: 0, noRating: 0 };

  const invalidateSongs = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-songs"] });
  };

  const updateLocalSong = useCallback((songId: string, updates: Partial<Song>) => {
    queryClient.setQueryData<{ songs: Song[], total: number, stats: any }>(["admin-songs", password, page, filterType, searchTerm], (oldData) => {
      if (!oldData) return { songs: [], total: 0, stats: {} };
      return {
        ...oldData,
        songs: oldData.songs.map(song =>
          song.id === songId ? { ...song, ...updates } : song
        )
      };
    });
  }, [queryClient, password, page, filterType, searchTerm]);

  const removeLocalSong = useCallback((songId: string) => {
    queryClient.setQueryData<{ songs: Song[], total: number, stats: any }>(["admin-songs", password, page, filterType, searchTerm], (oldData) => {
      if (!oldData) return { songs: [], total: 0, stats: {} };
      return {
        ...oldData,
        songs: oldData.songs.filter(song => song.id !== songId),
        total: oldData.total - 1
      };
    });
  }, [queryClient, password, page, filterType, searchTerm]);

  const handleSave = async (songId: string) => {
    try {
      await axios.post("/api/admin/songs", {
        password,
        songId,
        data: editForm
      });
      updateLocalSong(songId, editForm);
      setEditingId(null);
      toast.success("Changes saved");
    } catch (error) {
      toast.error("Save failed");
    }
  };

  const handleManualVerify = async (songId: string) => {
    try {
      await axios.post("/api/admin/songs", {
        password,
        songId,
        data: { isVerified: true }
      });
      updateLocalSong(songId, { isVerified: true });
      toast.success("Song marked as verified");
    } catch (error) {
      toast.error("Verification update failed");
    }
  };

  const handleQuickRate = async (songId: string, rating: number) => {
    try {
      await axios.post("/api/admin/songs", {
        password,
        songId,
        data: { avgDifficulty: rating, isVerified: true }
      });
      updateLocalSong(songId, { avgDifficulty: rating, isVerified: true });
      toast.success(`Song rated ${rating}`);
    } catch (error) {
      toast.error("Rating failed");
    }
  };

  const handleBulkAdd = async (bulkSongs: any[]) => {
    try {
      const response = await axios.post("/api/admin/songs", {
        password,
        bulkSongs
      });
      toast.success(response.data.message || `Bulk add successful: ${bulkSongs.length} songs`);
      invalidateSongs();
      return response.data; // Return results for further processing
    } catch (error) {
      toast.error("Bulk add failed");
      return null;
    }
  };

  const handleUpdateCover = async (songId: string, coverUrl: string) => {
    try {
      await axios.post("/api/admin/songs", {
        password,
        songId,
        data: { coverUrl, isVerified: true }
      });
      updateLocalSong(songId, { coverUrl, isVerified: true });
      toast.success("Cover updated successfully");
    } catch (error) {
      toast.error("Failed to update cover");
    }
  };

  const handleDelete = async (songId: string) => {
    if (!confirm("Are you sure you want to delete this song?")) return;
    try {
      await axios.delete(`/api/admin/songs?songId=${songId}`, {
        headers: { "x-admin-password": password }
      });
      removeLocalSong(songId);
      toast.success("Song deleted");
    } catch (error) {
      toast.error("Failed to delete song");
    }
  };

  const handleMerge = async (sourceId: string, targetId: string) => {
    try {
      const response = await axios.post("/api/admin/songs/merge", {
        password,
        sourceId,
        targetId
      });

      if (response.data.success) {
        removeLocalSong(sourceId);
        // We'd ideally update targetId's popularity locally too, 
        // but it's easier to just refetch or assume it's correct next time.
        toast.success(response.data.message);
        return true;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Merge failed");
      return false;
    }
  };

  // API now handles search
  const filteredSongs = songs;

  const stats = {
    total: globalStats.total,
    missing: globalStats.noCover,
    unverified: globalStats.unverified,
    noRating: globalStats.noRating,
  };

  return {
    songs,
    setSongs: () => { }, // No longer needed as state managed by react-query
    isLoading,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    editingId,
    setEditingId,
    editForm,
    setEditForm,
    fetchSongs,
    handleSave,
    handleManualVerify,
    handleUpdateCover,
    handleBulkAdd,
    handleQuickRate,
    handleDelete,
    handleMerge,
    filteredSongs,
    stats,
    page,
    setPage,
    totalCount
  };
};
