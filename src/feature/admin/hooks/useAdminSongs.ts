import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import type { Song } from "feature/songs/types/songs.type";

export const useAdminSongs = (password: string) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unverified" | "no-cover">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", artist: "" });

  const fetchSongs = useCallback(async (pass = password) => {
    if (!pass) return;
    setIsLoading(true);
    try {
      const res = await axios.get("/api/admin/songs", {
        headers: { "x-admin-password": pass }
      });
      setSongs(res.data);
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setIsLoading(false);
    }
  }, [password]);

  const handleSave = async (songId: string) => {
    try {
      await axios.post("/api/admin/songs", {
        password,
        songId,
        data: editForm
      });
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, ...editForm } : s));
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
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, isVerified: true } : s));
      toast.success("Song marked as verified");
    } catch (error) {
      toast.error("Verification update failed");
    }
  };

  const handleUpdateCover = async (songId: string, coverUrl: string) => {
    try {
      await axios.post("/api/admin/songs", {
        password,
        songId,
        data: { coverUrl, isVerified: true }
      });
      setSongs(prev => prev.map(s => s.id === songId ? { ...s, coverUrl, isVerified: true } : s));
      toast.success("Cover updated successfully");
    } catch (error) {
      toast.error("Failed to update cover");
    }
  };

  const filteredSongs = songs.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "unverified") return matchesSearch && !s.isVerified;
    if (filterType === "no-cover") return matchesSearch && !s.coverUrl;

    return matchesSearch;
  });

  const stats = {
    total: songs.length,
    missing: songs.filter(s => !s.coverUrl).length,
    unverified: songs.filter(s => !s.isVerified).length,
  };

  return {
    songs,
    setSongs,
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
    filteredSongs,
    stats
  };
};
