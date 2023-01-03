import crypto from "crypto";
export function decodeUid(input: string) {
  // Get the password from the ENV variables
  const password = process.env.NEXT_PUBLIC_UID_SEED_PASSWORD;
  if (password) {
    // Decode the encoded string using decodeURIComponent
    const base64 = decodeURIComponent(input + "==="); // Add padding to ensure the string is a valid base64 string

    // Convert the base64 encoded string back into a buffer
    const buffer = Buffer.from(base64, "base64");

    // Convert the buffer back into a string
    const decodedString = buffer.toString();

    // Split the decoded string into the hash and the original input string
    const hash = decodedString.substring(0, 64);
    const originalInput = decodedString.substring(64 + password.length);

    // Verify that the decoded string is the same as the original input string
    const newHash = crypto
      .createHash("sha256")
      .update(originalInput)
      .digest("hex");
    if (newHash === hash) {
      // Return the original input string if the hashes match
      return originalInput;
    } else {
      // Return an error if the hashes do not match
      throw new Error("Invalid password or input string");
    }
  }
}
