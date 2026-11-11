import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GUILDS_KEY } from "feature/guilds/hooks/useGuilds";
import { GUILD_STUDIO_KEY } from "feature/guilds/hooks/useGuildStudio";
import {
  bookRecording,
  claimRecordingPay,
  deliverRecording,
  fetchRecording,
} from "feature/guilds/services/guildRecording.service";
import type { RecordingView } from "feature/guilds/utils/guildRecording.utils";

export const GUILD_RECORDING_KEY = ["guild-recording"] as const;

/**
 * The caller's guild's recording sessions. Read again every time the tab is
 * opened: the player comes back to it straight from a take, and the tapes
 * the other members fill move while they are away.
 */
export const useGuildRecording = (enabled: boolean) =>
  useQuery({
    queryKey: GUILD_RECORDING_KEY,
    queryFn: async () => (await fetchRecording()).view,
    enabled,
    staleTime: 30 * 1000,
    refetchOnMount: "always",
  });

/** A write that answers with the new view, and moves the treasury others show. */
const useRecordingWrite = <Input, Output extends { view: RecordingView }>(
  write: (input: Input) => Promise<Output>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: ({ view }) => {
      queryClient.setQueryData(GUILD_RECORDING_KEY, view);
      queryClient.invalidateQueries({ queryKey: GUILDS_KEY });
      queryClient.invalidateQueries({ queryKey: GUILD_STUDIO_KEY });
    },
  });
};

/** Books a session on a tier out of the treasury. */
export const useBookRecording = () => useRecordingWrite(bookRecording);

/** Hands the finished track over before the week is up. */
export const useDeliverRecording = () =>
  useRecordingWrite(() => deliverRecording());

/** Collects the Fame finished sessions owe the caller. */
export const useClaimRecordingPay = () =>
  useRecordingWrite(() => claimRecordingPay());
