import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

export const useAdminActivity = (password: string) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [activityTrend, setActivityTrend] = useState<any[]>([]);
  const [featureUsage, setFeatureUsage] = useState<any[]>([]);
  const [skillDistribution, setSkillDistribution] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalPoints: 0,
    totalTimeMinutes: 0,
    activeUsers30d: 0
  });

  const fetchActivity = useCallback(async (currentPassword?: string) => {
    const pass = currentPassword || password;
    if (!pass) return;

    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin/activity", {
        headers: { "x-admin-password": pass }
      });
      setLogs(response.data.logs);
      setActivityTrend(response.data.activityTrend);
      setFeatureUsage(response.data.featureUsage);
      setSkillDistribution(response.data.skillDistribution);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Fetch activity error:", error);
      toast.error("Failed to load activity logs");
    } finally {
      setIsLoading(false);
    }
  }, [password]);

  return {
    logs,
    activityTrend,
    featureUsage,
    skillDistribution,
    isLoading,
    stats,
    fetchActivity
  };
};
