import { Button } from "assets/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import {
  ClaudeAddConnectorScreen,
  ClaudeChatScreen,
  ClaudeCodeAddScreen,
  ClaudeCodeMcpScreen,
  ClaudeConnectorsScreen,
  CodexAddScreen,
  CodexLoginScreen,
  ConsentScreen,
  CursorConfigScreen,
  CursorMcpScreen,
  GptChatScreen,
  GptDeveloperModeScreen,
  GptNewConnectorScreen,
  ScaledScreen,
} from "feature/settings/components/McpConnectMocks";
import { MCP_CONNECT_SCREENS } from "feature/settings/data/mcpConnectScreens";
import { useTranslation } from "hooks/useTranslation";
import { Check, Copy } from "lucide-react";
import { type ReactNode, useState } from "react";

/**
 * Settings → AI assistants → "How to connect": a step-by-step for each app
 * that takes a remote MCP server, every step with the screen it happens on —
 * a real screenshot once one is shot (scripts/buildMcpConnectScreens.mjs),
 * a drawn one until then (McpConnectMocks). All of them sign in through the
 * riff.quest consent page, so none needs a token.
 */

type ClientId = "claude" | "chatgpt" | "cursor" | "claude_code" | "codex";

const CLIENTS: ClientId[] = [
  "claude",
  "chatgpt",
  "cursor",
  "claude_code",
  "codex",
];

const CLIENT_NAMES: Record<ClientId, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  cursor: "Cursor",
  claude_code: "Claude Code",
  codex: "Codex",
};

/** One copyable line under a terminal or config screen. */
const CopyLine = ({ value }: { value: string }) => {
  const { t } = useTranslation("settings");
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className='flex items-center gap-3 rounded-lg bg-zinc-900/60 py-1.5 pl-4 pr-1.5'>
      <code className='font-mono min-w-0 flex-1 overflow-x-auto whitespace-pre text-xs text-zinc-300'>
        {value}
      </code>
      <Button
        variant='ghost'
        size='sm'
        onClick={copy}
        className='shrink-0'
        aria-label={t("mcp.copy")}>
        {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
      </Button>
    </div>
  );
};

/**
 * A real screenshot of the step. Opens full size in a new tab — they are
 * scaled down to fit the column.
 */
const RealScreen = ({ name, alt }: { name: string; alt: string }) => {
  const size = MCP_CONNECT_SCREENS[name];
  if (!size) return null;
  const src = `/images/mcp-connect/${name}.webp`;
  return (
    <a
      href={src}
      target='_blank'
      rel='noreferrer'
      className='block overflow-hidden rounded-lg'>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image is unoptimized here anyway */}
      <img
        src={src}
        alt={alt}
        width={size.width}
        height={size.height}
        loading='lazy'
        decoding='async'
        className='h-auto w-full'
      />
    </a>
  );
};

interface Step {
  text: string;
  /** Name of the step's screenshot; the drawn `screen` stands in until it exists. */
  image?: string;
  screen: ReactNode;
  /** Something to paste, shown under the screen. */
  copy?: string;
}

const Steps = ({ steps }: { steps: Step[] }) => (
  <ol className='space-y-10'>
    {steps.map((step, index) => (
      <li key={index} className='space-y-4'>
        <div className='flex gap-3'>
          <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200'>
            {index + 1}
          </span>
          <p className='pt-0.5 text-sm text-zinc-300'>{step.text}</p>
        </div>
        <div className='max-w-[760px] space-y-3'>
          {step.image && MCP_CONNECT_SCREENS[step.image] ? (
            <RealScreen name={step.image} alt={step.text} />
          ) : (
            <ScaledScreen>{step.screen}</ScaledScreen>
          )}
          {step.copy && <CopyLine value={step.copy} />}
        </div>
      </li>
    ))}
  </ol>
);

export const McpConnectGuide = ({ url }: { url: string }) => {
  const { t } = useTranslation("settings");
  const g = (key: string) => t(`mcp.guide.${key}`);
  const cursorConfig = JSON.stringify(
    { mcpServers: { "riff-quest": { url } } },
    null,
    2,
  );

  const steps: Record<ClientId, Step[]> = {
    claude: [
      {
        text: g("claude_1"),
        image: "claude-1",
        screen: <ClaudeConnectorsScreen />,
      },
      {
        text: g("claude_2"),
        image: "claude-2",
        screen: <ClaudeAddConnectorScreen url={url} />,
        copy: url,
      },
      {
        text: g("claude_3"),
        image: "consent",
        screen: <ConsentScreen app='Claude' host='claude.ai' />,
      },
      {
        text: g("claude_4"),
        image: "claude-4",
        screen: <ClaudeChatScreen />,
      },
    ],
    chatgpt: [
      {
        text: g("chatgpt_1"),
        image: "chatgpt-1",
        screen: <GptDeveloperModeScreen />,
      },
      {
        text: g("chatgpt_2"),
        image: "chatgpt-2",
        screen: <GptNewConnectorScreen url={url} />,
        copy: url,
      },
      {
        text: g("chatgpt_3"),
        image: "chatgpt-3",
        screen: <GptChatScreen />,
      },
    ],
    cursor: [
      {
        text: g("cursor_1"),
        screen: <CursorConfigScreen url={url} />,
        copy: cursorConfig,
      },
      {
        text: g("cursor_2"),
        image: "cursor-2",
        screen: <CursorMcpScreen />,
      },
      {
        text: g("cursor_3"),
        image: "consent",
        screen: <ConsentScreen app='Cursor' host='127.0.0.1' />,
      },
    ],
    claude_code: [
      {
        text: g("claude_code_1"),
        screen: <ClaudeCodeAddScreen url={url} />,
        copy: `claude mcp add --transport http riff-quest ${url}`,
      },
      {
        text: g("claude_code_2"),
        screen: <ClaudeCodeMcpScreen url={url} />,
        copy: "/mcp",
      },
      {
        text: g("claude_code_3"),
        image: "consent",
        screen: <ConsentScreen app='Claude Code' host='localhost' />,
      },
    ],
    codex: [
      {
        text: g("codex_1"),
        screen: <CodexAddScreen url={url} />,
        copy: `codex mcp add riff-quest --url ${url}`,
      },
      {
        text: g("codex_2"),
        screen: <CodexLoginScreen />,
        copy: "codex mcp login riff-quest",
      },
      {
        text: g("codex_3"),
        image: "consent",
        screen: <ConsentScreen app='Codex' host='127.0.0.1' />,
      },
    ],
  };

  return (
    <div className='space-y-4'>
      <div>
        <p className='text-sm font-semibold text-zinc-200'>{g("title")}</p>
        <p className='mt-1 text-sm text-zinc-400'>{g("subtitle")}</p>
      </div>
      <Tabs defaultValue='claude'>
        <TabsList className='h-auto flex-wrap justify-start gap-1 bg-zinc-900/60'>
          {CLIENTS.map((client) => (
            <TabsTrigger
              key={client}
              value={client}
              className='text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 data-[state=active]:shadow-none'>
              {CLIENT_NAMES[client]}
            </TabsTrigger>
          ))}
        </TabsList>
        {CLIENTS.map((client) => (
          <TabsContent key={client} value={client} className='mt-8'>
            <Steps steps={steps[client]} />
          </TabsContent>
        ))}
      </Tabs>
      <p className='pt-2 text-sm text-zinc-500'>{g("then")}</p>
    </div>
  );
};
