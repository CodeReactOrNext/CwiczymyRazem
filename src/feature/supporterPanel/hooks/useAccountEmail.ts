import { useEffect, useState } from "react";
import { firebaseGetCurrentUser } from "utils/firebase/client/firebase.utils";

/**
 * The address a donation has to carry to reach this account.
 *
 * Read from Firebase Auth rather than the user document, because the verified
 * address is what a claim on login is checked against. Both sides of
 * /supporter need it — the pitch tells somebody which address to pay from, the
 * Info tab tells a supporter why a later donation added nothing.
 */
export const useAccountEmail = (): string | null => {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    firebaseGetCurrentUser()
      .then((user) => {
        if (alive) setEmail(user?.email ?? null);
      })
      // No email shown is fine; the paragraph around it still reads.
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  return email;
};
