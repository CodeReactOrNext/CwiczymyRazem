// The path-inserted form clients probe first: /.well-known/oauth-protected-resource/api/mcp
export { GET, OPTIONS } from "../route";

// Route segment config can't be re-exported — Next reads it from this file.
export const dynamic = "force-dynamic";
