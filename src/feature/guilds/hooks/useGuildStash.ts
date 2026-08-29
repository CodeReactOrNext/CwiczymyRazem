import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { fetchInventory } from "feature/arsenal/services/arsenal.service";
import type {
  GuildStash,
  StashDeposit,
} from "feature/guilds/types/stash.types";
import { toast } from "sonner";
import { auth } from "utils/firebase/client/firebase.utils";

export const GUILD_STASH_KEY = ["guild-stash"] as const;

const post = async (body: object = {}): Promise<GuildStash> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const { data } = await axios.post<GuildStash>("/api/supporter/guild/stash", {
    idToken: await user.getIdToken(),
    ...body,
  });
  return data;
};

export const useGuildStash = (enabled: boolean) =>
  useQuery({
    queryKey: GUILD_STASH_KEY,
    queryFn: () => post(),
    enabled,
    staleTime: 30 * 1000,
  });

/**
 * The caller's own arsenal, for the board they deposit from.
 *
 * Deliberately the Arsenal's own query rather than a second copy of it: the
 * gear board here is the same cabinet, arranged the same way, and saving a
 * layout from this screen writes to that cache. Two keys meant a drag on one
 * screen looked undone on the other.
 */
export const useMyGear = (enabled: boolean) =>
  useQuery({
    queryKey: ARSENAL_QUERY_KEY,
    queryFn: fetchInventory,
    enabled,
    staleTime: 30 * 1000,
  });

const errorMessage = (error: unknown, fallback: string): string => {
  const responseError = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return responseError || fallback;
};

export const useStashMutations = () => {
  const queryClient = useQueryClient();

  const settle = (stash: GuildStash) => {
    queryClient.setQueryData(GUILD_STASH_KEY, stash);
    // The arsenal moved on both sides of every one of these.
    queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
  };

  const deposit = useMutation({
    mutationFn: (input: StashDeposit) => post({ action: "deposit", ...input }),
    onSuccess: (stash) => {
      settle(stash);
      toast.success("Left on the shelf");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not put that in")),
  });

  const take = useMutation({
    /** `qty` is only read for a stack of parts; everything else moves whole. */
    mutationFn: (input: { entryId: string; qty?: number }) =>
      post({ action: "take", ...input }),
    onSuccess: (stash) => {
      settle(stash);
      toast.success("Taken");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not take that")),
  });

  return { deposit, take };
};
