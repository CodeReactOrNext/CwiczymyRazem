import type { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import { autoLogIn } from "feature/user/store/userSlice.asyncThunk";
import { signOut,useSession } from "next-auth/react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "store/store";
import { firebaseGetCurrentUser } from "utils/firebase/client/firebase.utils";

const useAuthSync = () => {
  const { data: session, status } = useSession();
  const dispatch: ThunkDispatch<RootState, unknown, AnyAction> = useDispatch();
  const userStats = useSelector(selectCurrentUserStats);
  const userAuth = useSelector(selectUserAuth);

  useEffect(() => {
    const syncUser = async () => {
      // Only auto-login if authenticated in next-auth but missing stats in Redux
      if (status === "authenticated" && (!userStats || !userAuth)) {
        try {
          // Wait for Firebase Client SDK to initialize
          const currentUser = await firebaseGetCurrentUser();

          if (currentUser) {
            dispatch(autoLogIn(currentUser));
          } else {
            console.warn("Session authenticated but Firebase User null. Logging out to sync.");
            await signOut({ redirect: false });
          }

        } catch (error) {
          console.error("Auto login sync failed", error);
        }
      }
    };

    if (status === "authenticated") {
      syncUser();
    }
  }, [status, userStats, userAuth, dispatch]);

  return { isLoading: status === "loading" || (status === 'authenticated' && !userStats) };
}

export default useAuthSync;
