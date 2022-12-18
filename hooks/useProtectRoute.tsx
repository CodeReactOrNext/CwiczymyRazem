import Router from "next/router";
import { useEffect } from "react";
import useAutoLogIn from "./useAutoLogIn";

function useProtectRoute(redirectTo: string) {
  const { isLoggedIn, isLoading } = useAutoLogIn();
  useEffect(() => {
    if (!isLoggedIn) {
      Router.push(redirectTo);
    }
  }, [isLoggedIn, redirectTo]);

  return { isLoggedIn, isLoading };
}

export default useProtectRoute;
