import { hasDesktopGoogleSignIn } from "feature/user/services/desktopLogin";
import { selectIsFetching } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useAppSelector } from "store/hooks";

/**
 * Under the Google button in the desktop app: sign-in continues in the
 * browser, so say so, and let the player stop waiting (e.g. after closing
 * that tab) without sitting out the timeout.
 */
export const DesktopGoogleSignInHint = () => {
  const { t } = useTranslation("login");
  const isWaiting = useAppSelector(selectIsFetching) === "google";

  // isWaiting is false on the server and on first render, so reading `window`
  // only past this point can't cause a hydration mismatch.
  if (!isWaiting || !hasDesktopGoogleSignIn()) return null;

  return (
    <p className='mt-3 text-center text-sm text-zinc-400'>
      {t("desktop.waiting")}{" "}
      <button
        type='button'
        onClick={() => void window.electronApp?.cancelGoogleSignIn?.()}
        className='font-medium text-zinc-200 transition-colors hover:text-white'>
        {t("desktop.cancel")}
      </button>
    </p>
  );
};
