import crypto from "crypto";

export function encodeUid(input: string) {
  // Get the password from the ENV variables
  const password = process.env.NEXT_PUBLIC_UID_SEED_PASSWORD;

  // Create a hash of the input string using a hashing algorithm
  const hash = crypto.createHash("sha256").update(input).digest("hex");

  // Combine the hash with the seed password and the input string
  const combinedString = hash + password + input;

  // Encode the combined string using base64
  const base64 = Buffer.from(combinedString).toString("base64");

  // Take the first 20 characters of the base64 encoded string
  const output = base64.substring(0, 20);

  // Encode the output string using URL encoding
  return encodeURIComponent(output);
}
