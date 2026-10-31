import { Button } from "assets/components/ui/button";
import { Switch } from "assets/components/ui/switch";
import axios from "axios";
import type { User } from "firebase/auth";
import { useTranslation } from "hooks/useTranslation";
import { rememberOAuthReturn } from "lib/mcp/oauth/postLoginRedirect";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { auth } from "utils/firebase/client/firebase.utils";

interface ConsentRequest {
  clientName: string;
  clientUri: string | null;
  clientHost: string | null;
  redirectHost: string;
  loopback: boolean;
  scopes: ("read" | "write")[];
}

type Described =
  | { request: ConsentRequest }
  | { redirect: string }
  | { error: string };

const queryParams = (query: Record<string, string | string[] | undefined>) =>
  Object.fromEntries(
    Object.entries(query).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value]] : [],
    ),
  );

/**
 * /oauth/authorize — where an AI app (claude.ai, Claude Desktop, Claude Code…)
 * asks the player for access to their riff.quest account.
 *
 * The server checks the request (`describe`) before anything is shown, and
 * again when the player decides (`decide`). The redirect host is spelled out:
 * an app's name is whatever it registered, where it sends the code is not.
 */
export const OAuthConsentView = () => {
  const { t } = useTranslation("settings");
  const router = useRouter();
  const [described, setDescribed] = useState<Described | null>(null);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [allowWrite, setAllowWrite] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => auth.onAuthStateChanged(setUser), []);

  useEffect(() => {
    if (!router.isReady) return;
    axios
      .post<Described>("/api/oauth/authorize", {
        action: "describe",
        params: queryParams(router.query),
      })
      .then(({ data }) => {
        // a request that is wrong but trustworthy goes straight back to the app
        if ("redirect" in data) window.location.replace(data.redirect);
        else setDescribed(data);
      })
      .catch((error) =>
        setDescribed({
          error:
            axios.isAxiosError(error) &&
            typeof error.response?.data?.error === "string"
              ? error.response.data.error
              : t("oauth.error"),
        }),
      );
  }, [router.isReady, router.query, t]);

  const signIn = () => {
    rememberOAuthReturn(window.location.pathname + window.location.search);
    void router.push("/login");
  };

  const decide = async (approve: boolean) => {
    if (!user) return;
    setBusy(true);
    try {
      const { data } = await axios.post<{ redirect: string }>(
        "/api/oauth/authorize",
        {
          action: "decide",
          params: queryParams(router.query),
          idToken: await user.getIdToken(),
          approve,
          allowWrite,
        },
      );
      window.location.assign(data.redirect);
    } catch {
      setBusy(false);
      setDescribed({ error: t("oauth.error") });
    }
  };

  const request =
    described && "request" in described ? described.request : null;
  const error = described && "error" in described ? described.error : null;

  return (
    <main className='flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-16'>
      <div className='w-full max-w-md space-y-8 rounded-2xl bg-zinc-900/60 p-8'>
        {/* Not the shared Logo: that one links home, and leaving this page drops the connection. */}
        <Image
          src='/images/longlightlogo.svg'
          alt='riff.quest'
          width={176}
          height={32}
          className='h-8 w-auto'
          priority
        />

        {!described || user === undefined ? (
          <div className='flex justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin text-zinc-500' />
          </div>
        ) : error ? (
          <div className='space-y-3'>
            <h1 className='text-xl font-bold text-zinc-100'>
              {t("oauth.invalid_title")}
            </h1>
            <p className='text-sm text-zinc-400'>
              {t("oauth.invalid_description")}
            </p>
            <p className='font-mono rounded-lg bg-zinc-800/60 px-4 py-3 text-xs text-zinc-400'>
              {error}
            </p>
          </div>
        ) : request ? (
          <>
            <div className='space-y-3'>
              <h1 className='text-xl font-bold text-zinc-100'>
                {t("oauth.title", { app: request.clientName })}
              </h1>
              <p className='text-sm text-zinc-400'>{t("oauth.subtitle")}</p>
            </div>

            <div className='space-y-2 rounded-lg bg-zinc-800/40 px-4 py-3 text-sm'>
              <p className='text-zinc-400'>
                {t("oauth.returns_to")}{" "}
                <span className='font-mono font-semibold text-zinc-100'>
                  {request.redirectHost}
                </span>
              </p>
              {request.clientHost && (
                <p className='text-zinc-500'>
                  {t("oauth.published_by")}{" "}
                  <span className='font-mono'>{request.clientHost}</span>
                </p>
              )}
              {request.loopback && (
                <p className='text-amber-300'>{t("oauth.loopback_warning")}</p>
              )}
            </div>

            <div className='space-y-4'>
              <p className='text-sm text-zinc-200'>{t("oauth.can_read")}</p>
              {request.scopes.includes("write") && (
                <div className='flex items-center justify-between gap-6'>
                  <div className='min-w-0'>
                    <p className='text-sm text-zinc-200'>
                      {t("mcp.allow_writes")}
                    </p>
                    <p className='mt-1 text-sm text-zinc-400'>
                      {t("mcp.allow_writes_description")}
                    </p>
                  </div>
                  <Switch
                    checked={allowWrite}
                    onChange={() => setAllowWrite((value) => !value)}
                    aria-label={t("mcp.allow_writes")}
                  />
                </div>
              )}
            </div>

            {user ? (
              <div className='space-y-4'>
                <p className='text-xs text-zinc-500'>
                  {t("oauth.signed_in_as", {
                    name: user.displayName || user.email || "",
                  })}
                </p>
                <div className='flex gap-3'>
                  <Button
                    onClick={() => decide(true)}
                    disabled={busy}
                    className='flex-1'>
                    {t("oauth.allow")}
                  </Button>
                  <Button
                    variant='ghost'
                    onClick={() => decide(false)}
                    disabled={busy}>
                    {t("oauth.deny")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={signIn} className='w-full'>
                {t("oauth.sign_in")}
              </Button>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
};
