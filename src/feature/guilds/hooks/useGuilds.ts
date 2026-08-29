import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  GuildLogoUploadError,
  uploadGuildLogo,
} from "feature/guilds/services/guildLogo.service";
import type { GuildsState } from "feature/guilds/types/guild.types";
import type { GuildUpgrade } from "feature/guilds/utils/guildUpgrades.utils";
import { GUILD_SEATS_PER_UPGRADE } from "feature/supporterPanel/constants/supporterPanel.constants";
import { toast } from "sonner";
import { auth } from "utils/firebase/client/firebase.utils";

export const GUILDS_KEY = ["guilds"] as const;

const post = async <T = GuildsState>(
  url: string,
  body: object = {},
): Promise<T> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const { data } = await axios.post<T>(url, {
    idToken: await user.getIdToken(),
    ...body,
  });
  return data;
};

/** What the fund route adds to the state it hands back. */
type Funded = GuildsState & { paid: number; unlocked: boolean };

/** What the claim route adds: the Fame that just landed. */
type Claimed = GuildsState & { fame: number };

/** What the deposit route adds: the Fame that just left your own pocket. */
type Deposited = GuildsState & { paid: number };

/** What the tier purchase adds: which week the guild has just signed up for. */
type Upgraded = GuildsState & { tierName: string; spent: number };

/** Said once a pot fills, per track. */
const BOUGHT: Record<GuildUpgrade, string> = {
  seats: `Room for ${GUILD_SEATS_PER_UPGRADE} more`,
  stashRows: "The shelf grew a row",
};

export const useGuilds = (enabled: boolean) =>
  useQuery({
    queryKey: GUILDS_KEY,
    queryFn: () => post("/api/supporter/guild"),
    enabled,
    staleTime: 60 * 1000,
  });

const errorMessage = (error: unknown, fallback: string): string => {
  const responseError = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return responseError || fallback;
};

export const useGuildMutations = () => {
  const queryClient = useQueryClient();

  const apply = (state: GuildsState) =>
    queryClient.setQueryData(GUILDS_KEY, state);

  const found = useMutation({
    // The picture goes to Storage from here rather than through the API: an
    // image is too big to post as JSON, and the server only ever needs the URL
    // it ends up at.
    mutationFn: async (input: {
      name: string;
      tag: string;
      description: string;
      logo: Blob | null;
    }) => {
      const { logo, ...guild } = input;
      return post("/api/supporter/guild/found", {
        ...guild,
        logo: logo ? await uploadGuildLogo(logo) : null,
      });
    },
    onSuccess: (state) => {
      apply(state);
      toast.success("Guild founded");
    },
    // An upload that fell over happened before the API was called, so nothing
    // was charged — worth saying, rather than a founding that "failed".
    onError: (error) =>
      toast.error(
        error instanceof GuildLogoUploadError
          ? "That picture would not upload — nothing was spent"
          : errorMessage(error, "Could not found that guild"),
      ),
  });

  const applyTo = useMutation({
    mutationFn: (input: { guildId: string; message: string }) =>
      post("/api/supporter/guild/membership", { action: "apply", ...input }),
    onSuccess: (state) => {
      apply(state);
      toast.success("Request sent — the founder decides from here");
    },
    onError: (error) => toast.error(errorMessage(error, "Could not apply")),
  });

  const withdraw = useMutation({
    mutationFn: (guildId: string) =>
      post("/api/supporter/guild/membership", { action: "withdraw", guildId }),
    onSuccess: apply,
    onError: (error) =>
      toast.error(errorMessage(error, "Could not withdraw that request")),
  });

  const decide = useMutation({
    mutationFn: (input: {
      guildId: string;
      applicantUid: string;
      accept: boolean;
    }) =>
      post("/api/supporter/guild/membership", {
        action: input.accept ? "accept" : "reject",
        guildId: input.guildId,
        applicantUid: input.applicantUid,
      }),
    onSuccess: (state, input) => {
      apply(state);
      toast.success(input.accept ? "Welcomed in" : "Turned down");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not answer that request")),
  });

  /**
   * Tokens into one of the guild's pots. Nobody buys a step outright: the pot
   * is charged what is left owing at most, and the step happens on the
   * contribution that fills it — which is what the toast says apart.
   */
  const fund = useMutation({
    mutationFn: (input: { track: GuildUpgrade; tokens: number }) =>
      post<Funded>("/api/supporter/guild/fund", input),
    onSuccess: (state, { track }) => {
      apply(state);

      if (state.unlocked) {
        toast.success(BOUGHT[track]);
        return;
      }

      const pot = state.guilds.find((guild) => guild.id === state.myGuildId)
        ?.funds[track];
      const owed = pot?.cost == null ? 0 : pot.cost - pot.pot;
      toast.success(owed > 0 ? `In the pot — ${owed} to go` : "In the pot");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not put that in")),
  });

  const leave = useMutation({
    mutationFn: () =>
      post("/api/supporter/guild/membership", { action: "leave" }),
    onSuccess: apply,
    onError: (error) => toast.error(errorMessage(error, "Could not leave")),
  });

  /**
   * What the guild wears. Free — and the server refuses anyone but the founder,
   * so the button is only ever shown to one member of the roster.
   */
  const equipCosmetic = useMutation({
    mutationFn: (itemId: string) =>
      post("/api/supporter/guild/cosmetics", { itemId }),
    onSuccess: apply,
    onError: (error) =>
      toast.error(errorMessage(error, "Could not change that")),
  });

  /**
   * This week's Fame, for a member who did their own share of a week the guild
   * cleared. The server decides all of that; the button only asks.
   */
  const claimChallenge = useMutation({
    mutationFn: () =>
      post<Claimed>("/api/supporter/guild/challenge", { action: "claim" }),
    onSuccess: (state) => {
      apply(state);
      toast.success(`+${state.fame} Fame — the week is yours`);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not claim that")),
  });

  /** Your own Fame into the guild's. Any member, any amount they hold. */
  const depositFame = useMutation({
    mutationFn: (fame: number) =>
      post<Deposited>("/api/supporter/guild/treasury", {
        action: "deposit",
        amount: fame,
      }),
    onSuccess: (state) => {
      apply(state);
      toast.success(`${state.paid} Fame into the guild's`);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not put that in")),
  });

  /** The founder commits the roster to a harder week, out of the treasury. */
  const buyChallengeTier = useMutation({
    mutationFn: () =>
      post<Upgraded>("/api/supporter/guild/challenge", { action: "buyTier" }),
    onSuccess: (state) => {
      apply(state);
      toast.success(`${state.tierName} — the guild is on a harder week`);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not take that on")),
  });

  return {
    found,
    applyTo,
    withdraw,
    decide,
    leave,
    fund,
    equipCosmetic,
    claimChallenge,
    depositFame,
    buyChallengeTier,
  };
};
