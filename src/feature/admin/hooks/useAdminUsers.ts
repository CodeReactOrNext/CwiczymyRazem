import { useState, useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";

export const useAdminUsers = (password: string) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    recentUsers: 0,
    registrationTrend: [] as { name: string, users: number }[]
  });

  const fetchUsers = useCallback(async (currentPassword?: string) => {
    const pass = currentPassword || password;
    if (!pass) return;

    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/users", {
        headers: { "x-admin-password": pass }
      });
      setUsers(response.data.users);
      setUserStats(response.data.stats);
    } catch (error) {
      console.error("Fetch users error:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [password]);

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.userAuth?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  return {
    users,
    filteredUsers,
    isLoading,
    searchTerm,
    setSearchTerm,
    userStats,
    fetchUsers
  };
};
