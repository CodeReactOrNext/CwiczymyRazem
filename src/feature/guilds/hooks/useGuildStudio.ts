import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { GUILDS_KEY } from "feature/guilds/hooks/useGuilds";
import type { GuildStudioView } from "feature/guilds/utils/guildStudio.utils";
import { auth } from "utils/firebase/client/firebase.utils";

export const GUILD_STUDIO_KEY = ["guild-studio"] as const;

const post = async (body: object = {}): Promise<GuildStudioView> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const { data } = await axios.post<GuildStudioView>(
    "/api/supporter/guild/studio",
    { idToken: await user.getIdToken(), ...body },
  );
  return data;
};

/**
 * The caller's guild's studio, treasury and week. The week costs two reads
 * per member, so it is only fetched while the tab is open and kept a while.
 */
export const useGuildStudio = (enabled: boolean) =>
  useQuery({
    queryKey: GUILD_STUDIO_KEY,
    queryFn: () => post(),
    enabled,
    staleTime: 60 * 1000,
  });

export type StudioPurchaseInput =
  | { kind: "item"; id: string }
  | { kind: "room" };

/** Buys the next step of a piece or of the room out of the treasury. */
export const useBuyStudioStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StudioPurchaseInput) =>
      post({ action: "buy", ...input }),
    onSuccess: (view) => {
      queryClient.setQueryData(GUILD_STUDIO_KEY, view);
      // The treasury the guild header and the upgrades tab show just moved.
      queryClient.invalidateQueries({ queryKey: GUILDS_KEY });
    },
  });
};
