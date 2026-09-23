import { requireSupporter } from "lib/support/supporterAuth";
import type { NextApiRequest } from "next";

/**
 * The generation routes burn OpenAI credits on every call. The admin queue
 * authenticates with the admin password.
 */
export const isAdminRequest = (req: NextApiRequest): boolean => {
  const password = req.headers["x-admin-password"] ?? req.body?.password;
  return (
    !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD
  );
};

export type GenerationAuth =
  | {
      ok: true;
      /** null for the admin queue, a real uid for a supporter. */ uid:
        | string
        | null;
    }
  | { ok: false; status: number; message: string };

/**
 * Also lets a supporter generate a roadmap for themselves, the same way the
 * rest of the supporter panel authenticates — an `idToken` in the body. The
 * admin password is checked first since it is a cheap, synchronous check;
 * `requireSupporter` only runs when it is absent.
 */
export async function authorizeGeneration(
  req: NextApiRequest,
): Promise<GenerationAuth> {
  if (isAdminRequest(req)) return { ok: true, uid: null };

  const supporterResult = await requireSupporter(req);
  if (supporterResult.ok) {
    return { ok: true, uid: supporterResult.session.uid };
  }
  return {
    ok: false,
    status: supporterResult.status,
    message: supporterResult.error,
  };
}
