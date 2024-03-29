import { useEffect } from "react";
import Router from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";

import { auth } from "utils/firebase/client/firebase.utils";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { autoLogIn } from "feature/user/store/userSlice.asyncThunk";
import {
  selectIsLoggedOut,
  selectUserAuth,
  updateLocalTimer,
} from "feature/user/store/userSlice";

type pagesToRedirectTo = "/" | "/login" | "/leaderboard" | "/faq";

interface useAutoLogInProps {
  redirects?: { loggedIn?: pagesToRedirectTo; loggedOut?: pagesToRedirectTo };
}

const useAutoLogIn = (props: useAutoLogInProps) => {
  const [user, loading] = useAuthState(auth);
  const isUserLoggedIn = useAppSelector(selectUserAuth);
  const isLoggedOut = useAppSelector(selectIsLoggedOut);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("userSlice.timer")) {
        dispatch(
          updateLocalTimer(JSON.parse(localStorage.getItem("userSlice.timer")!))
        );
      }
    }
    if (user && !isUserLoggedIn && !isLoggedOut) {
      dispatch(autoLogIn(user));
    }
    if (user && isUserLoggedIn && !loading && props?.redirects?.loggedIn) {
      Router.push(props.redirects.loggedIn);
    }
    if (!user && !isUserLoggedIn && !loading && props?.redirects?.loggedOut) {
      Router.push(props?.redirects?.loggedOut);
    }
  }, [
    user,
    dispatch,
    isUserLoggedIn,
    loading,
    props?.redirects?.loggedIn,
    props?.redirects?.loggedOut,
    isLoggedOut,
  ]);

  return { isLoggedIn: Boolean(user && isUserLoggedIn), isLoading: loading };
};

export default useAutoLogIn;
