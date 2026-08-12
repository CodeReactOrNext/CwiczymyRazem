import { useDesktopAppVersion } from "hooks/useDesktopAppVersion";

const WEB_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? null;

/**
 * Wersja aplikacji do pokazania w UI. W desktopie to wersja zainstalowanej
 * appki (może być starsza niż web), na webie — wersja builda z package.json.
 */
export const useAppVersion = () => useDesktopAppVersion() ?? WEB_APP_VERSION;
