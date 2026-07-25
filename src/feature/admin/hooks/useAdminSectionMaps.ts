import axios from "axios";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface AdminSectionMapContributor {
  userId: string;
  username: string;
  sectionCount: number;
  submittedAt: string | null;
}

export interface AdminSectionMapRow {
  mapId: string;
  songId: string;
  videoId: string;
  title: string;
  artist: string;
  status: "pending" | "verified";
  contributorCount: number;
  sectionCount: number;
  updatedAt: string | null;
  contributors: AdminSectionMapContributor[];
}

export interface AdminSectionMapsResponse {
  rows: AdminSectionMapRow[];
  stats: { total: number; verified: number; pending: number };
}

export const useAdminSectionMaps = (password: string) => {
  const [data, setData] = useState<AdminSectionMapsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSectionMaps = useCallback(async () => {
    if (!password) return;
    setIsLoading(true);
    try {
      const res = await axios.get<AdminSectionMapsResponse>(
        "/api/admin/section-maps",
        { headers: { "x-admin-password": password } }
      );
      setData(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to load section maps");
    } finally {
      setIsLoading(false);
    }
  }, [password]);

  return { data, isLoading, fetchSectionMaps };
};
