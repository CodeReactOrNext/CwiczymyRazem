import { useState } from "react";
import { toast } from "sonner";

export const useExerciseMigration = (password: string) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const runMigration = async () => {
    if (!password) {
      toast.error("Admin password required");
      return;
    }

    setIsMigrating(true);
    setProgress({ current: 0, total: 1 }); // Indeterminate progress for API call

    try {
      const response = await fetch("/api/admin/migrate-localization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setProgress({
          current: (result.details?.exercises || 0) + (result.details?.plans || 0),
          total: (result.details?.exercises || 0) + (result.details?.plans || 0)
        });
      } else {
        throw new Error(result.message || "Migration failed");
      }
    } catch (error: any) {
      console.error("Migration failed:", error);
      toast.error(error.message || "Migration failed. See console.");
    } finally {
      setIsMigrating(false);
    }
  };

  return {
    runMigration,
    isMigrating,
    migrationProgress: progress
  };
};
