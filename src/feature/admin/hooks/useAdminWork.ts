import axios from "axios";
import type {
  WorkItem,
  WorkStatus,
} from "feature/workBoard/types/workBoard.types";
import { groupWork } from "feature/workBoard/utils/workBoard.utils";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

/**
 * Every call answers with the whole board, so the panel never has to guess what
 * a status move did to the ordering — it just re-renders what came back.
 */
export const useAdminWork = (password: string) => {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const headers = useMemo(() => ({ "x-admin-password": password }), [password]);

  const fetchItems = useCallback(
    async (currentPassword?: string) => {
      const pass = currentPassword ?? password;
      if (!pass) return;
      setIsLoading(true);
      try {
        const res = await axios.get("/api/admin/work", {
          headers: { "x-admin-password": pass },
        });
        setItems(res.data.items ?? []);
      } catch {
        toast.error("Failed to load the work board");
      } finally {
        setIsLoading(false);
      }
    },
    [password],
  );

  const run = async (
    action: () => Promise<{ data: { items?: WorkItem[] } }>,
    failure: string,
  ) => {
    setIsSaving(true);
    try {
      const res = await action();
      setItems(res.data.items ?? []);
      return true;
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      toast.error(message || failure);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (input: {
    title: string;
    note?: string;
    status?: WorkStatus;
  }) =>
    run(
      () => axios.post("/api/admin/work", input, { headers }),
      "Could not add that item",
    );

  const editItem = (
    id: string,
    patch: { title?: string; note?: string; status?: WorkStatus },
  ) =>
    run(
      () => axios.patch("/api/admin/work", { id, ...patch }, { headers }),
      "Could not save that item",
    );

  const moveItem = (id: string, move: "up" | "down") =>
    run(
      () => axios.patch("/api/admin/work", { id, move }, { headers }),
      "Could not move that item",
    );

  const removeItem = (id: string) =>
    run(
      () => axios.delete("/api/admin/work", { data: { id }, headers }),
      "Could not delete that item",
    );

  return {
    items,
    board: useMemo(() => groupWork(items), [items]),
    isLoading,
    isSaving,
    fetchItems,
    addItem,
    editItem,
    moveItem,
    removeItem,
  };
};
