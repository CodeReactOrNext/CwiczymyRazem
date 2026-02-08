import {
  selectIsLoggedOut,
  selectUserAuth,
  updateLocalTimer,
} from "feature/user/store/userSlice";
import Router from "next/router";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { auth } from "utils/firebase/client/firebase.utils";

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
    // autoLogIn is now handled globally by useAuthSync in _app.tsx
    // This hook only handles redirects
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
