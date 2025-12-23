import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import type { Song } from "feature/songs/types/songs.type";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useAdminSongs = (password: string) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unverified" | "no-cover" | "no-rating">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", artist: "", avgDifficulty: 0 });

  const { data: songs = [], isLoading, refetch: fetchSongs } = useQuery({
    queryKey: ["admin-songs", password],
    queryFn: async () => {
      const res = await axios.get("/api/admin/songs", {
        headers: { "x-admin-password": password }
      });
      return res.data as Song[];
    },
    enabled: !!password,
  });

  const invalidateSongs = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-songs"] });
  };

  const handleSave = async (songId: string) => {
    try {
      await axios.post("/api/admin/songs", {
        password,
        songId,
        data: editForm
      });
      invalidateSongs();
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
      invalidateSongs();
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
      invalidateSongs();
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
    } catch (error) {
      toast.error("Bulk add failed");
    }
  };

  const handleUpdateCover = async (songId: string, coverUrl: string) => {
    try {
      await axios.post("/api/admin/songs", {
        password,
        songId,
        data: { coverUrl, isVerified: true }
      });
      invalidateSongs();
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
      invalidateSongs();
      toast.success("Song deleted");
    } catch (error) {
      toast.error("Failed to delete song");
    }
  };

  const filteredSongs = songs.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "unverified") return matchesSearch && !s.isVerified;
    if (filterType === "no-cover") return matchesSearch && !s.coverUrl;
    if (filterType === "no-rating") return matchesSearch && (!s.avgDifficulty || s.avgDifficulty === 0);

    return matchesSearch;
  });

  const stats = {
    total: songs.length,
    missing: songs.filter(s => !s.coverUrl).length,
    unverified: songs.filter(s => !s.isVerified).length,
    noRating: songs.filter(s => !s.avgDifficulty || s.avgDifficulty === 0).length,
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
    filteredSongs,
    stats
  };
};
