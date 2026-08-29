import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { WorkItem } from "feature/workBoard/types/workBoard.types";
import { groupWork } from "feature/workBoard/utils/workBoard.utils";
import { useMemo } from "react";
import { auth } from "utils/firebase/client/firebase.utils";

export const WORK_BOARD_KEY = ["work-board"] as const;

const fetchWorkBoard = async (): Promise<WorkItem[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const { data } = await axios.post<{ items: WorkItem[] }>(
    "/api/supporter/work",
    { idToken: await user.getIdToken() },
  );
  return data.items ?? [];
};

/** A board one person edits by hand changes rarely — no need to poll it hard. */
const STALE_TIME = 5 * 60 * 1000;

export const useWorkBoard = (enabled: boolean) => {
  const { data, isLoading } = useQuery({
    queryKey: WORK_BOARD_KEY,
    queryFn: fetchWorkBoard,
    enabled,
    staleTime: STALE_TIME,
  });

  const items = useMemo(() => data ?? [], [data]);

  return { board: useMemo(() => groupWork(items), [items]), isLoading };
};
