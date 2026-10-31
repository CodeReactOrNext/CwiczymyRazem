import axios from "axios";
import type { ConnectedApp } from "lib/mcp/oauth/grants";
import type { McpTokenSummary } from "lib/mcp/tokens";
import { auth } from "utils/firebase/client/firebase.utils";

export type { ConnectedApp, McpTokenSummary };

/** Settings → AI assistants. Everything goes through /api/mcp-tokens (Admin SDK). */
const call = async <T>(body: Record<string, unknown>): Promise<T> => {
  const idToken = await auth.currentUser!.getIdToken();
  try {
    const { data } = await axios.post<T>("/api/mcp-tokens", {
      idToken,
      ...body,
    });
    return data;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.error
      : undefined;
    throw new Error(typeof message === "string" ? message : "");
  }
};

export const listMcpAccess = () =>
  call<{ tokens: McpTokenSummary[]; apps: ConnectedApp[] }>({ action: "list" });

export const createMcpToken = (label: string, write: boolean) =>
  call<{ token: string; summary: McpTokenSummary }>({
    action: "create",
    label,
    write,
  });

export const revokeMcpToken = (id: string) =>
  call<{ ok: true }>({ action: "revoke", id });

export const disconnectApp = (id: string) =>
  call<{ ok: true }>({ action: "disconnect", id });
