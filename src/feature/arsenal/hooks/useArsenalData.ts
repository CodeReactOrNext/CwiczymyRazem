import { useQuery } from "@tanstack/react-query";

import { fetchInventory } from "../services/arsenal.service";

export const ARSENAL_QUERY_KEY = ["arsenal", "inventory"];

export const useArsenalData = () => {
  return useQuery({
    queryKey: ARSENAL_QUERY_KEY,
    queryFn: fetchInventory,
    staleTime: 30_000,
  });
};
