import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type {
  GearBoard,
  ProposalStatus,
} from "feature/gearProposals/types/gearProposal.types";
import type { GearProposalInput } from "lib/gear/gearBoard";
import { toast } from "sonner";
import { auth } from "utils/firebase/client/firebase.utils";

export const GEAR_BOARD_KEY = ["gear-board"] as const;

const getIdToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.getIdToken();
};

const post = async (url: string, body: object): Promise<GearBoard> => {
  const { data } = await axios.post<GearBoard>(url, {
    idToken: await getIdToken(),
    ...body,
  });
  return data;
};

export const useGearBoard = (enabled: boolean) =>
  useQuery({
    queryKey: GEAR_BOARD_KEY,
    queryFn: () => post("/api/supporter/gear", {}),
    enabled,
    staleTime: 30 * 1000,
  });

const errorMessage = (error: unknown, fallback: string): string => {
  const responseError = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return responseError || fallback;
};

export const useGearMutations = () => {
  const queryClient = useQueryClient();

  const applyBoard = (board: GearBoard) =>
    queryClient.setQueryData(GEAR_BOARD_KEY, board);

  const propose = useMutation({
    mutationFn: (input: GearProposalInput) =>
      post("/api/supporter/gear/propose", input),
    onSuccess: (board) => {
      applyBoard(board);
      toast.success("Proposal filed");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not file that proposal")),
  });

  const back = useMutation({
    mutationFn: ({
      proposalId,
      amount,
    }: {
      proposalId: string;
      amount: number;
    }) => post("/api/supporter/gear/back", { proposalId, amount }),
    onSuccess: applyBoard,
    onError: (error) =>
      toast.error(errorMessage(error, "Could not spend that token")),
  });

  const changeStatus = useMutation({
    mutationFn: async ({
      proposalId,
      status,
    }: {
      proposalId: string;
      status: ProposalStatus;
    }) => {
      const { data } = await axios.patch<GearBoard>(
        "/api/supporter/gear/propose",
        { idToken: await getIdToken(), proposalId, status },
      );
      return data;
    },
    onSuccess: applyBoard,
    onError: (error) =>
      toast.error(errorMessage(error, "Could not change the status")),
  });

  return { propose, back, changeStatus };
};
