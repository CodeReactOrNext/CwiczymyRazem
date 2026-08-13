import axios from "axios";
import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface SupportSearchResult extends SupportTeamMember {
  isSupport: boolean;
}

export const useAdminSupport = (password: string) => {
  const [members, setMembers] = useState<SupportTeamMember[]>([]);
  const [results, setResults] = useState<SupportSearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const fetchSupportTeam = useCallback(
    async (currentPassword?: string) => {
      const pass = currentPassword ?? password;
      if (!pass) return;
      setIsLoading(true);
      try {
        const res = await axios.get("/api/admin/support", {
          headers: { "x-admin-password": pass },
        });
        setMembers(res.data.members ?? []);
      } catch {
        toast.error("Failed to load the support team");
      } finally {
        setIsLoading(false);
      }
    },
    [password],
  );

  const searchUsers = useCallback(
    async (term: string) => {
      const query = term.trim();
      if (!query) {
        setResults(null);
        return;
      }
      setIsSearching(true);
      try {
        const res = await axios.get("/api/admin/support", {
          headers: { "x-admin-password": password },
          params: { q: query },
        });
        setResults(res.data.results ?? []);
      } catch {
        toast.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    },
    [password],
  );

  /** Marks the user as support, or updates the label shown on their badge. */
  const markAsSupport = async (uid: string, title?: string) => {
    try {
      const res = await axios.post(
        "/api/admin/support",
        { uid, title: title ?? "" },
        { headers: { "x-admin-password": password } },
      );
      setMembers(res.data.members ?? []);
      setResults(
        (prev) =>
          prev?.map((user) =>
            user.uid === uid
              ? { ...user, isSupport: true, title: title?.trim() || null }
              : user,
          ) ?? null,
      );
      toast.success("Marked as support");
    } catch {
      toast.error("Failed to mark as support");
    }
  };

  const removeSupport = async (uid: string) => {
    try {
      const res = await axios.delete("/api/admin/support", {
        data: { uid },
        headers: { "x-admin-password": password },
      });
      setMembers(res.data.members ?? []);
      setResults(
        (prev) =>
          prev?.map((user) =>
            user.uid === uid
              ? { ...user, isSupport: false, title: null }
              : user,
          ) ?? null,
      );
      toast.success("Removed from the support team");
    } catch {
      toast.error("Failed to remove from the support team");
    }
  };

  return {
    members,
    results,
    isLoading,
    isSearching,
    fetchSupportTeam,
    searchUsers,
    markAsSupport,
    removeSupport,
  };
};
