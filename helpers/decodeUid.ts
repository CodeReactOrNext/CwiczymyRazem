export function decodeUid(input: string) {
  const uri = decodeURIComponent(input);
  const output = Buffer.from(uri, "base64").toString("ascii");
  return output;
}
