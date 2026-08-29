import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { SupporterCaseState } from "feature/supporterCase/types/supporterCase.types";
import { toast } from "sonner";
import { auth } from "utils/firebase/client/firebase.utils";

export const SUPPORTER_CASE_KEY = ["supporter-case"] as const;

const post = async (
  url: string,
  body: object = {},
): Promise<SupporterCaseState> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const { data } = await axios.post<SupporterCaseState>(url, {
    idToken: await user.getIdToken(),
    ...body,
  });
  return data;
};

/** The slate changes once a fortnight — no reason to ask for it often. */
const STALE_TIME = 5 * 60 * 1000;

export const useSupporterCase = (enabled = true) =>
  useQuery({
    queryKey: SUPPORTER_CASE_KEY,
    queryFn: () => post("/api/supporter/case"),
    enabled,
    staleTime: STALE_TIME,
  });

export const useSlateVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rarity, key }: { rarity: string; key: string }) =>
      post("/api/supporter/case/vote", { rarity, key }),
    onSuccess: (state) => queryClient.setQueryData(SUPPORTER_CASE_KEY, state),
    onError: (error) => {
      const message = (error as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      toast.error(message || "Could not spend that token");
    },
  });
};
