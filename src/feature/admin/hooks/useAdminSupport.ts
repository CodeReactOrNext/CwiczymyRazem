import axios from "axios";
import type {
  PendingSupporter,
  SupportTeamMember,
} from "feature/supportTeam/types/supportTeam.types";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface SupportSearchResult extends SupportTeamMember {
  isSupport: boolean;
}

export const useAdminSupport = (password: string) => {
  const [members, setMembers] = useState<SupportTeamMember[]>([]);
  const [pending, setPending] = useState<PendingSupporter[]>([]);
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
        setPending(res.data.pending ?? []);
      } catch {
        toast.error("Failed to load the supporters");
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

  /** Marks the user as a supporter, or updates the label shown on their badge. */
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
      toast.success("Marked as a supporter");
    } catch {
      toast.error("Failed to mark as a supporter");
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
      toast.success("Removed from the supporters");
    } catch {
      toast.error("Failed to remove from the supporters");
    }
  };

  /** Drops a donation parked on an email nobody has signed up with. */
  const removePending = async (email: string) => {
    try {
      const res = await axios.delete("/api/admin/support", {
        data: { email },
        headers: { "x-admin-password": password },
      });
      setPending(res.data.pending ?? []);
      toast.success("Removed from the waiting donations");
    } catch {
      toast.error("Failed to remove the waiting donation");
    }
  };

  return {
    members,
    pending,
    results,
    isLoading,
    isSearching,
    fetchSupportTeam,
    searchUsers,
    markAsSupport,
    removeSupport,
    removePending,
  };
};
