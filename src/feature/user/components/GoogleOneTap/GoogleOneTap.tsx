import { useEffect, useRef } from "react";
import Script from "next/script";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { logInViaGoogleCredential } from "feature/user/store/userSlice.asyncThunk";
import { selectUserAuth } from "feature/user/store/userSlice";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_QAUTH; // <- upewnij się co do nazwy

export const GoogleOneTap = () => {
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const initializedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (window.google?.accounts?.id) {
        try { window.google.accounts.id.cancel(); } catch {}
      }
    };
  }, []);

  const handleCredentialResponse = (response: any) => {
    if (response?.credential) {
      dispatch(logInViaGoogleCredential(response.credential));
    }
  };

  // Jeśli użytkownik zalogowany lub brak client_id – nie pokazuj One Tap
  if (userAuth || !GOOGLE_CLIENT_ID) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        if (initializedRef.current) return;
        if (!window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          // kluczowe dla FedCM:
          use_fedcm_for_prompt: true,
        });

        // Nie polegamy na PromptMomentNotification (FedCM je wygasza)
        window.google.accounts.id.prompt();
        initializedRef.current = true;
      }}
    />
  );
};