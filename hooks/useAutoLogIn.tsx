import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "utils/firebase/firebase.utils";
import { useEffect } from "react";
import {
  autoLogIn,
  logUserOff,
  selectUserAuth,
  updateLocalTimer,
} from "feature/user/store/userSlice";
import { useAppDispatch, useAppSelector } from "store/hooks";
import Router from "next/router";

type pagesToRedirectTo = "/" | "/login";

interface useAutoLogInProps {
  redirects?: { loggedIn?: pagesToRedirectTo; loggedOut?: pagesToRedirectTo };
}

const useAutoLogIn = (props: useAutoLogInProps) => {
  const [user, loading] = useAuthState(auth);
  const isUserLoggedIn = useAppSelector(selectUserAuth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("userSlice.timer")) {
        dispatch(
          updateLocalTimer(JSON.parse(localStorage.getItem("userSlice.timer")!))
        );
      }
    }
    console.log("place 0", user);
    if (user && !isUserLoggedIn) {
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
  ]);

  return { isLoggedIn: Boolean(user && isUserLoggedIn), isLoading: loading };
};

export default useAutoLogIn;
