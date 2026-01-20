import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "utils/firebase/api/firebase.config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Missing ID token" });
  }

  try {
    // Set session expiration to 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Create the session cookie. This will also verify the ID token in the process.
    // The session cookie will have the same claims as the ID token.
    // To only allow session cookies to be created permissions on the specific new account,
    // we can check claims here.
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn,
    });

    const options = {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    };

    // Set the cookie
    res.setHeader(
      "Set-Cookie",
      `session=${sessionCookie}; Max-Age=${expiresIn / 1000}; Path=/; HttpOnly; ${options.secure ? "Secure;" : ""
      } SameSite=Lax`
    );

    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Error creating session cookie:", error);
    res.status(401).json({ error: "Unauthorized request" });
  }
}
