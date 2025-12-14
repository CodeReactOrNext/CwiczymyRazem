import Script from "next/script";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { logInViaGoogleCredential } from "feature/user/store/userSlice.asyncThunk";
import { selectUserAuth } from "feature/user/store/userSlice";

declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_QAUTH;

export const GoogleOneTap = () => {
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);

  const handleCredentialResponse = (response: any) => {
    if (response.credential) {
        dispatch(logInViaGoogleCredential(response.credential));
    }
  };

  if (userAuth || !GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false, 
            cancel_on_tap_outside: false,
            use_fedcm_for_prompt: true,
          });
          window.google.accounts.id.prompt((notification: any) => {
             // console.log("Google One Tap notification:", notification);
          });
        }
      }}
    />
  );
};
