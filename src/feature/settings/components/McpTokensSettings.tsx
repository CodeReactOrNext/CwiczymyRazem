import { Button } from "assets/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { Input } from "assets/components/ui/input";
import { Switch } from "assets/components/ui/switch";
import {
  type ConnectedApp,
  createMcpToken,
  disconnectApp,
  listMcpAccess,
  type McpTokenSummary,
  revokeMcpToken,
} from "feature/settings/services/mcpTokens.service";
import { useTranslation } from "hooks/useTranslation";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const serverUrl = () =>
  `${typeof window === "undefined" ? "https://riff.quest" : window.location.origin}/api/mcp`;

const CopyButton = ({ value }: { value: string }) => {
  const { t } = useTranslation("settings");
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Button variant='ghost' size='sm' onClick={copy} className='shrink-0'>
      {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
      {copied ? t("mcp.copied") : t("mcp.copy")}
    </Button>
  );
};

const CodeLine = ({ value }: { value: string }) => (
  <div className='flex items-center gap-3 rounded-lg bg-zinc-900/60 py-2 pl-4 pr-2'>
    <code className='font-mono min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xs text-zinc-300'>
      {value}
    </code>
    <CopyButton value={value} />
  </div>
);

/**
 * Settings → AI assistants. Two ways to the MCP server at /api/mcp: the
 * address alone (claude.ai and other OAuth clients sign in through the consent
 * screen and show up under connected apps), or a personal token for clients
 * that take a header. A new token is shown once — only its hash is stored.
 */
export const McpTokensSettings = () => {
  const { t } = useTranslation("settings");
  const [tokens, setTokens] = useState<McpTokenSummary[] | null>(null);
  const [apps, setApps] = useState<ConnectedApp[] | null>(null);
  const [label, setLabel] = useState("");
  const [allowWrites, setAllowWrites] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  useEffect(() => {
    listMcpAccess()
      .then((access) => {
        setTokens(access.tokens);
        setApps(access.apps);
      })
      .catch(() => {
        setTokens([]);
        setApps([]);
      });
  }, []);

  const create = async () => {
    setBusy(true);
    try {
      const { token, summary } = await createMcpToken(label, allowWrites);
      setNewToken(token);
      setTokens((current) => [summary, ...(current ?? [])]);
      setLabel("");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("mcp.error"),
      );
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await revokeMcpToken(id);
      setTokens((current) =>
        (current ?? []).filter((token) => token.id !== id),
      );
      toast.success(t("mcp.revoked"));
    } catch {
      toast.error(t("mcp.error"));
    }
  };

  const disconnect = async (id: string) => {
    try {
      await disconnectApp(id);
      setApps((current) => (current ?? []).filter((app) => app.id !== id));
      toast.success(t("mcp.disconnected"));
    } catch {
      toast.error(t("mcp.error"));
    }
  };

  const url = serverUrl();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("mcp.title")}</CardTitle>
        <CardDescription>{t("mcp.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-8'>
        <div className='space-y-2'>
          <p className='text-sm font-semibold text-zinc-200'>
            {t("mcp.server_url")}
          </p>
          <CodeLine value={url} />
          <p className='text-sm text-zinc-400'>{t("mcp.connector_hint")}</p>
        </div>

        <div className='space-y-3'>
          <p className='text-sm font-semibold text-zinc-200'>
            {t("mcp.connected_apps")}
          </p>
          {apps?.length === 0 && (
            <p className='text-sm text-zinc-500'>{t("mcp.no_apps")}</p>
          )}
          {apps?.map((app) => (
            <div
              key={app.id}
              className='flex items-center justify-between gap-4 rounded-lg bg-zinc-900/40 px-4 py-3'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-zinc-200'>
                  {app.name}
                </p>
                <p className='mt-1 text-xs text-zinc-500'>
                  <span className='font-mono'>{app.redirectHost}</span>
                  {" · "}
                  {app.scopes.includes("write")
                    ? t("mcp.read_write")
                    : t("mcp.read_only")}
                  {" · "}
                  {t("mcp.connected_on", {
                    date: new Date(app.connectedAt).toLocaleDateString(),
                  })}
                </p>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => disconnect(app.id)}>
                {t("mcp.disconnect")}
              </Button>
            </div>
          ))}
        </div>

        <div className='space-y-4 rounded-lg bg-zinc-900/40 p-4'>
          <p className='text-sm font-semibold text-zinc-200'>
            {t("mcp.new_token")}
          </p>
          <Input
            value={label}
            maxLength={40}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={t("mcp.label_placeholder")}
          />
          <div className='flex items-center justify-between gap-6'>
            <div className='min-w-0'>
              <p className='text-sm text-zinc-200'>{t("mcp.allow_writes")}</p>
              <p className='mt-1 text-sm text-zinc-400'>
                {t("mcp.allow_writes_description")}
              </p>
            </div>
            <Switch
              checked={allowWrites}
              onChange={() => setAllowWrites((value) => !value)}
              aria-label={t("mcp.allow_writes")}
            />
          </div>
          <Button onClick={create} disabled={busy}>
            {t("mcp.create")}
          </Button>

          {newToken && (
            <div className='space-y-3 pt-2'>
              <p className='text-sm text-amber-300'>{t("mcp.token_once")}</p>
              <CodeLine value={newToken} />
              <p className='pt-2 text-sm text-zinc-400'>
                {t("mcp.claude_code")}
              </p>
              <CodeLine
                value={`claude mcp add --transport http riff-quest ${url} --header "Authorization: Bearer ${newToken}"`}
              />
              <p className='text-sm text-zinc-400'>{t("mcp.other_clients")}</p>
            </div>
          )}
        </div>

        <div className='space-y-3'>
          <p className='text-sm font-semibold text-zinc-200'>
            {t("mcp.your_tokens")}
          </p>
          {tokens?.length === 0 && (
            <p className='text-sm text-zinc-500'>{t("mcp.no_tokens")}</p>
          )}
          {tokens?.map((token) => (
            <div
              key={token.id}
              className='flex items-center justify-between gap-4 rounded-lg bg-zinc-900/40 px-4 py-3'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-zinc-200'>
                  {token.label}
                </p>
                <p className='mt-1 text-xs text-zinc-500'>
                  <span className='font-mono'>{token.hint}…</span>
                  {" · "}
                  {token.scopes.includes("write")
                    ? t("mcp.read_write")
                    : t("mcp.read_only")}
                  {" · "}
                  {token.lastUsedAt
                    ? t("mcp.last_used", {
                        date: new Date(token.lastUsedAt).toLocaleDateString(),
                      })
                    : t("mcp.never_used")}
                </p>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => revoke(token.id)}>
                {t("mcp.revoke")}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
