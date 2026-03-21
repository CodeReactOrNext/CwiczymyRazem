import axios from "axios";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export interface PremiumUser {
  id: string;
  displayName: string;
  avatar: string | null;
  role: "pro" | "master";
  premiumUntil: string | null; // ISO date or null = forever
}

export const useAdminPremium = (password: string) => {
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPremiumUsers = useCallback(
    async (currentPassword?: string) => {
      const pass = currentPassword ?? password;
      if (!pass) return;
      setIsLoading(true);
      try {
        const res = await axios.get("/api/admin/premium", {
          headers: { "x-admin-password": pass },
        });
        setUsers(res.data.users);
      } catch {
        toast.error("Failed to load premium users");
      } finally {
        setIsLoading(false);
      }
    },
    [password]
  );

  const grantPremium = async (userId: string, plan: "pro" | "master", premiumUntil?: string) => {
    try {
      await axios.post(
        "/api/admin/premium",
        { userId, plan, premiumUntil: premiumUntil || null },
        { headers: { "x-admin-password": password } }
      );
      toast.success(`${plan === "master" ? "Master" : "Pro"} plan granted`);
      await fetchPremiumUsers();
    } catch {
      toast.error("Failed to grant premium");
    }
  };

  const revokePremium = async (userId: string) => {
    try {
      await axios.delete("/api/admin/premium", {
        data: { userId },
        headers: { "x-admin-password": password },
      });
      toast.success("Premium revoked");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      toast.error("Failed to revoke premium");
    }
  };

  return { users, isLoading, fetchPremiumUsers, grantPremium, revokePremium };
};
