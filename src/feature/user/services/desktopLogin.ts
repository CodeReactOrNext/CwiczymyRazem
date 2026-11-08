/**
 * /desktop-login — the browser half of the desktop app's Google sign-in
 * (electron/desktopAuth.js). The app opens this page with the port of its
 * one-shot server on 127.0.0.1 and a random `state`; the page sends a custom
 * token back there.
 */

export type DesktopLoginRequest =
  | { kind: "sign-in"; port: number; state: string }
  | { kind: "done" }
  | { kind: "invalid" };

const STATE_PATTERN = /^[0-9a-f]{64}$/;

const single = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

export const parseDesktopLoginRequest = (
  query: Record<string, string | string[] | undefined>,
): DesktopLoginRequest => {
  if (single(query.done) === "1") return { kind: "done" };

  const rawPort = single(query.port) ?? "";
  const state = single(query.state) ?? "";
  const port = Number(rawPort);
  if (
    !/^\d+$/.test(rawPort) ||
    port < 1024 ||
    port > 65535 ||
    !STATE_PATTERN.test(state)
  ) {
    return { kind: "invalid" };
  }
  return { kind: "sign-in", port, state };
};

/**
 * Hands the token to the app with a top-level form POST: the token stays out
 * of the address bar and history, and a navigation to loopback is not blocked
 * the way a fetch from a public site can be. The app answers with a redirect
 * back to /desktop-login?done=1.
 */
export const sendTokenToDesktopApp = (
  { port, state }: { port: number; state: string },
  token: string,
  isNewUser: boolean,
) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `http://127.0.0.1:${port}/callback`;
  form.style.display = "none";
  const fields: Record<string, string> = {
    state,
    token,
    newUser: isNewUser ? "1" : "0",
  };
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
};

/** True in a desktop shell that signs in through the browser. */
export const hasDesktopGoogleSignIn = () =>
  typeof window !== "undefined" &&
  typeof window.electronApp?.signInWithGoogle === "function";
