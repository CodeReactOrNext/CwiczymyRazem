import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from "feature/logger/Logger";

import { getBossRecords, saveBossRecord } from "../services/bossProgress.service";
import type { BossRecord, BossRecordMap } from "../types/boss.types";
import type { RunResult } from "../utils/bossProgress";
import { EMPTY_RECORD, recordRun } from "../utils/bossProgress";

export const bossRecordsQueryKey = (uid: string | null) => ["bossRecords", uid] as const;

/**
 * The player's record against one boss. A finished run lands optimistically,
 * so the lair shows it straight away; a failed write rolls back.
 */
export const useBossRecord = (uid: string | null, bossId: string) => {
  const queryClient = useQueryClient();
  const key = bossRecordsQueryKey(uid);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getBossRecords(uid!),
    enabled: !!uid,
  });

  const mutation = useMutation({
    mutationFn: (record: BossRecord) => saveBossRecord(uid!, bossId, record),
    onMutate: async (record) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BossRecordMap>(key);
      queryClient.setQueryData<BossRecordMap>(key, { ...previous, [bossId]: record });
      return { previous };
    },
    onError: (error, _record, context) => {
      logger.error(error, { context: "useBossRecord" });
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });

  const record = query.data?.[bossId] ?? EMPTY_RECORD;

  /** Banks a finished run. Built on the cache, so quick runs stack. */
  const saveRun = (run: RunResult) => {
    if (!uid) return;
    const current = queryClient.getQueryData<BossRecordMap>(key)?.[bossId] ?? EMPTY_RECORD;
    mutation.mutate(recordRun(current, run));
  };

  return { record, isLoading: query.isLoading, saveRun };
};
