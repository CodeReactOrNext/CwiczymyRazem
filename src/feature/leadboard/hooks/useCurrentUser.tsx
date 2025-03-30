import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";

export const useCurrentUser = () => {
  const currentUserId = useAppSelector(selectUserAuth);

  return {
    currentUserId,
  };
};
