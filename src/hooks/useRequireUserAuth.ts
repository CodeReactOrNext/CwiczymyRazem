import { selectAutoLogInFailed, selectUserAuth } from "feature/user/store/userSlice";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAppSelector } from "store/hooks";

/**
 * The signed-in player's id, for full-screen pages that render without
 * AppLayout and so have nothing else waiting for the login to come back.
 *
 * On a typed URL or a refresh the id is null for a moment while the Firebase
 * session restores. Sending the player to /login right then bounced them on to
 * the dashboard (the login page redirects anyone signed in), so a shared duel
 * link never opened. Only a session that is really gone goes to the login page;
 * until then the id stays null and the page keeps its loading screen.
 */
export const useRequireUserAuth = () => {
  const router = useRouter();
  const { status } = useSession();
  const userAuth = useAppSelector(selectUserAuth);
  const autoLogInFailed = useAppSelector(selectAutoLogInFailed);
  const isSignedOut =
    !userAuth && (status === "unauthenticated" || autoLogInFailed);

  useEffect(() => {
    if (isSignedOut) router.push("/login");
  }, [isSignedOut, router]);

  return userAuth;
};
