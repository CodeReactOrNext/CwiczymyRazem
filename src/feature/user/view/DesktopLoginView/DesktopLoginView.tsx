import { Button } from "assets/components/ui/button";
import axios from "axios";
import type { DesktopLoginRequest } from "feature/user/services/desktopLogin";
import {
  parseDesktopLoginRequest,
  sendTokenToDesktopApp,
} from "feature/user/services/desktopLogin";
import type { FirebaseError } from "firebase/app";
import { getApp, getApps, initializeApp } from "firebase/app";
import type { Auth, User } from "firebase/auth";
import {
  browserPopupRedirectResolver,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  initializeAuth,
  inMemoryPersistence,
  signInWithPopup,
} from "firebase/auth";
import { useTranslation } from "hooks/useTranslation";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { firebaseApp } from "utils/firebase/client/firebase.config";
import { auth } from "utils/firebase/client/firebase.utils";

const DESKTOP_LOGIN_APP = "desktop-login";

let desktopAuth: Auth | null = null;

/**
 * A Google sign-in that leaves this browser's own riff.quest session alone:
 * a separate Firebase app that keeps its user in memory only. Signing into the
 * desktop app with another account doesn't switch the website's account.
 */
const signInWithGoogleForDesktop = () => {
  if (!desktopAuth) {
    const app = getApps().some(({ name }) => name === DESKTOP_LOGIN_APP)
      ? getApp(DESKTOP_LOGIN_APP)
      : initializeApp(firebaseApp.options, DESKTOP_LOGIN_APP);
    desktopAuth = initializeAuth(app, {
      persistence: inMemoryPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(desktopAuth, provider);
};

const POPUP_DISMISSED = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

/**
 * /desktop-login — opened by the desktop app in the player's browser, because
 * Google won't sign anyone in inside Electron (electron/desktopAuth.js).
 */
export const DesktopLoginView = () => {
  const { t } = useTranslation("login");
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => auth.onAuthStateChanged(setUser), []);

  const request: DesktopLoginRequest | null = router.isReady
    ? parseDesktopLoginRequest(router.query)
    : null;

  const handOver = async (signedIn: User, isNewUser: boolean) => {
    if (request?.kind !== "sign-in") return;
    const { data } = await axios.post<{ token: string }>(
      "/api/auth/desktop-token",
      { idToken: await signedIn.getIdToken() },
    );
    // The page navigates away here; `busy` stays on until it does.
    sendTokenToDesktopApp(request, data.token, isNewUser);
  };

  const run = async (signIn: () => Promise<{ user: User; isNewUser: boolean } | null>) => {
    setBusy(true);
    setFailed(false);
    try {
      const signedIn = await signIn();
      if (!signedIn) {
        setBusy(false);
        return;
      }
      await handOver(signedIn.user, signedIn.isNewUser);
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  const continueAsCurrent = () =>
    run(async () => (user ? { user, isNewUser: false } : null));

  const continueWithGoogle = () =>
    run(async () => {
      try {
        const result = await signInWithGoogleForDesktop();
        return {
          user: result.user,
          isNewUser: !!getAdditionalUserInfo(result)?.isNewUser,
        };
      } catch (error) {
        if (POPUP_DISMISSED.has((error as FirebaseError).code)) return null;
        throw error;
      }
    });

  const isLoading = !request || (request.kind === "sign-in" && user === undefined);

  return (
    <main className='flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-16'>
      <div className='w-full max-w-md space-y-8 rounded-2xl bg-zinc-900/60 p-8'>
        <Image
          src='/images/longlightlogo.svg'
          alt='riff.quest'
          width={176}
          height={32}
          className='h-8 w-auto'
          priority
        />

        {isLoading ? (
          <div className='flex justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin text-zinc-500' />
          </div>
        ) : request.kind === "done" ? (
          <div className='space-y-3'>
            <h1 className='text-xl font-bold text-zinc-100'>
              {t("desktop.done_title")}
            </h1>
            <p className='text-sm text-zinc-400'>{t("desktop.done_body")}</p>
          </div>
        ) : request.kind === "invalid" ? (
          <div className='space-y-3'>
            <h1 className='text-xl font-bold text-zinc-100'>
              {t("desktop.invalid_title")}
            </h1>
            <p className='text-sm text-zinc-400'>{t("desktop.invalid_body")}</p>
          </div>
        ) : (
          <>
            <div className='space-y-3'>
              <h1 className='text-xl font-bold text-zinc-100'>
                {t("desktop.title")}
              </h1>
              <p className='text-sm text-zinc-400'>{t("desktop.subtitle")}</p>
            </div>

            <div className='space-y-3'>
              {user && (
                <Button
                  onClick={continueAsCurrent}
                  disabled={busy}
                  className='w-full'>
                  {t("desktop.continue_as", {
                    name: user.displayName || user.email || "",
                  })}
                </Button>
              )}
              <Button
                variant={user ? "ghost" : "default"}
                onClick={continueWithGoogle}
                disabled={busy}
                className='w-full'>
                <span className='flex items-center justify-center gap-2'>
                  {busy ? (
                    <Loader2 className='h-5 w-5 animate-spin' />
                  ) : (
                    <FcGoogle className='h-5 w-5' />
                  )}
                  {user ? t("desktop.other_account") : t("google_button")}
                </span>
              </Button>
            </div>

            {failed && (
              <p className='text-sm text-amber-300'>{t("desktop.error")}</p>
            )}
          </>
        )}
      </div>
    </main>
  );
};
