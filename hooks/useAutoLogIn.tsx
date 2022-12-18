import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "utils/firebase/firebase.utils";
import { useEffect } from "react";
import { autoLogIn, selectUserAuth } from "feature/user/store/userSlice";
import { useAppDispatch, useAppSelector } from "store/hooks";
import Router from "next/router";

type pagesToRedirectTo = "/" | "/login";

interface useAutoLogInProps {
  redirects?: { loggedIn?: pagesToRedirectTo; loggedOut?: pagesToRedirectTo };
}

function useAutoLogIn(props: useAutoLogInProps) {
  const [user, loading] = useAuthState(auth);
  const isUserLoggedIn = useAppSelector(selectUserAuth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (user && !isUserLoggedIn) {
      dispatch(autoLogIn(user));
    }
    if (user && isUserLoggedIn && !loading && props?.redirects?.loggedIn) {
      console.log("logged in");
      Router.push(props?.redirects?.loggedIn);
    }
    if (!user && !isUserLoggedIn && !loading && props?.redirects?.loggedOut) {
      console.log("logged out");
      Router.push(props?.redirects?.loggedOut);
    }
    console.log(user, isUserLoggedIn);
  }, [
    user,
    dispatch,
    isUserLoggedIn,
    loading,
    props?.redirects?.loggedIn,
    props?.redirects?.loggedOut,
  ]);

  return { isLoggedIn: Boolean(user && isUserLoggedIn), isLoading: loading };
}

export default useAutoLogIn;
