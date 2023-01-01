export function encodeUid(input: string) {
  const base64 = Buffer.from(input).toString("base64");
  const output = encodeURIComponent(base64);
  return output;
}
