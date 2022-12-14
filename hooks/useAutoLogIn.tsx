import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "utils/firebase/firebase.utils";
import { useEffect } from "react";
import { autoLogIn, selectUserAuth } from "feature/user/store/userSlice";
import { useAppDispatch, useAppSelector } from "store/hooks";

function useAutoLogIn() {
  const [user, loading] = useAuthState(auth);
  const isUserLoggedIn = useAppSelector(selectUserAuth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (user && !isUserLoggedIn) dispatch(autoLogIn(user));
  }, [user, dispatch, isUserLoggedIn]);

  return { isLoggedIn: Boolean(user && isUserLoggedIn), loading };
}

export default useAutoLogIn;
