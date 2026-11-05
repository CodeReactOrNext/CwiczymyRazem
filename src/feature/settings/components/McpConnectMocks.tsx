import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import {
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Mic,
  MousePointer2,
  Plus,
  RotateCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * Drawn screens for Settings → AI assistants → "How to connect". Each one is
 * laid out at a fixed desktop width, the way a screenshot is, and scaled down
 * to the column — so the proportions hold on a phone too. The other apps'
 * screens borrow their colours and layout so a player recognises where they
 * are, but no logos: the point is "this is the button", not a copy of the app.
 * Colours inside them are hex on purpose — they are the other apps' palettes,
 * not ours.
 */

const DESIGN_WIDTH = 760;

/** Lays a screen out at DESIGN_WIDTH and scales it to the column. */
export const ScaledScreen = ({ children }: { children: ReactNode }) => {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ scale: 1, height: 0 });

  useEffect(() => {
    const outerEl = outer.current;
    const innerEl = inner.current;
    if (!outerEl || !innerEl) return undefined;
    // The observer reports both boxes once on observe, so the first size comes
    // from its callback rather than a set-state in the effect body.
    const observer = new ResizeObserver(() =>
      setBox({
        scale: Math.min(1, outerEl.clientWidth / DESIGN_WIDTH),
        height: innerEl.offsetHeight,
      }),
    );
    observer.observe(outerEl);
    observer.observe(innerEl);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outer}
      aria-hidden='true'
      className='relative w-full overflow-hidden rounded-lg'
      style={{ height: box.height ? box.height * box.scale : 320 }}>
      <div
        ref={inner}
        className='absolute left-0 top-0 select-none'
        style={{
          width: DESIGN_WIDTH,
          transform: `scale(${box.scale})`,
          transformOrigin: "top left",
        }}>
        {children}
      </div>
    </div>
  );
};

/** Where to click: a ring around the target and a pointer resting on it. */
const Hl = ({
  children,
  className,
  ring = "#f5f5f4",
}: {
  children: ReactNode;
  className?: string;
  ring?: string;
}) => (
  <span className={cn("relative inline-flex", className)}>
    <span
      className='pointer-events-none absolute -inset-1.5 rounded-xl'
      style={{ boxShadow: `0 0 0 2px ${ring}` }}
    />
    {children}
    <MousePointer2
      className='absolute -bottom-4 -right-3 h-5 w-5 fill-white text-black'
      strokeWidth={1.5}
    />
  </span>
);

const Toggle = ({ on, color = "#f5f5f4" }: { on: boolean; color?: string }) => (
  <span
    className='flex h-5 w-9 shrink-0 items-center rounded-full px-0.5'
    style={{
      background: on ? color : "#52525b",
      justifyContent: on ? "flex-end" : "flex-start",
    }}>
    <span
      className='h-4 w-4 rounded-full'
      style={{ background: on ? "#18181b" : "#e4e4e7" }}
    />
  </span>
);

/** A letter tile standing in for a service's logo. */
const Tile = ({ letter, bg }: { letter: string; bg: string }) => (
  <span
    className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white'
    style={{ background: bg }}>
    {letter}
  </span>
);

/* ── Frames ─────────────────────────────────────────────────────────────── */

export const BrowserFrame = ({
  url,
  tab,
  children,
}: {
  url: string;
  tab: string;
  children: ReactNode;
}) => (
  <div className='overflow-hidden rounded-lg bg-[#202124] font-sans'>
    <div className='flex items-end gap-2 px-3 pt-2'>
      <div className='mb-2 flex gap-1.5'>
        <span className='h-3 w-3 rounded-full bg-[#ff5f57]' />
        <span className='h-3 w-3 rounded-full bg-[#febc2e]' />
        <span className='h-3 w-3 rounded-full bg-[#28c840]' />
      </div>
      <div className='ml-3 flex w-52 items-center gap-2 rounded-t-lg bg-[#35363a] px-3 py-2 text-xs text-[#e8eaed]'>
        <span className='h-3.5 w-3.5 rounded-sm bg-[#5f6368]' />
        <span className='truncate'>{tab}</span>
        <X className='ml-auto h-3 w-3 text-[#9aa0a6]' />
      </div>
      <Plus className='mb-2 h-4 w-4 text-[#9aa0a6]' />
    </div>
    <div className='flex items-center gap-3 bg-[#35363a] px-3 py-2'>
      <ChevronLeft className='h-4 w-4 text-[#9aa0a6]' />
      <ChevronRight className='h-4 w-4 text-[#5f6368]' />
      <RotateCw className='h-3.5 w-3.5 text-[#9aa0a6]' />
      <div className='flex flex-1 items-center gap-2 rounded-full bg-[#202124] px-4 py-1.5 text-xs text-[#e8eaed]'>
        <Lock className='h-3 w-3 text-[#9aa0a6]' />
        <span className='truncate'>{url}</span>
      </div>
    </div>
    <div className='h-[400px] overflow-hidden'>{children}</div>
  </div>
);

export const TerminalFrame = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className='font-mono overflow-hidden rounded-lg bg-[#0c0c0c] text-[13px] leading-6'>
    <div className='flex items-center gap-3 bg-[#1f1f1f] px-3 py-2 font-sans text-xs text-[#cccccc]'>
      <span className='rounded-t bg-[#0c0c0c] px-3 py-1'>{title}</span>
      <Plus className='h-3.5 w-3.5 text-[#8a8a8a]' />
      <span className='ml-auto flex gap-4 text-[#8a8a8a]'>
        <span>—</span>
        <span>▢</span>
        <X className='h-3.5 w-3.5' />
      </span>
    </div>
    <div className='min-h-[220px] px-4 py-3 text-[#cccccc]'>{children}</div>
  </div>
);

const Prompt = ({ children }: { children: ReactNode }) => (
  <p className='whitespace-pre-wrap break-all'>
    <span className='text-[#3b8eea]'>PS C:\Users\you&gt;</span>{" "}
    <span className='text-[#f9f1a5]'>{children}</span>
  </p>
);

/* ── Claude ─────────────────────────────────────────────────────────────── */

const CLAUDE = {
  bg: "#262624",
  side: "#1f1e1d",
  card: "#30302e",
  text: "#faf9f5",
  muted: "#a6a39b",
  clay: "#d97757",
};

const ClaudeSettings = ({ dim }: { dim?: boolean }) => (
  <div
    className='flex h-full'
    style={{ background: CLAUDE.bg, color: CLAUDE.text }}>
    <div className='w-44 space-y-1 px-3 py-6 text-[13px]'>
      <p className='font-serif mb-4 px-2 text-xl'>Settings</p>
      {[
        "General",
        "Account",
        "Privacy",
        "Billing",
        "Capabilities",
        "Connectors",
        "Claude Code",
      ].map((item) => (
        <p
          key={item}
          className='rounded-lg px-2 py-1.5'
          style={{
            background: item === "Connectors" ? CLAUDE.card : undefined,
            color: item === "Connectors" ? CLAUDE.text : CLAUDE.muted,
          }}>
          {item}
        </p>
      ))}
    </div>
    <div className='flex-1 px-8 py-6' style={{ opacity: dim ? 0.35 : 1 }}>
      <p className='text-[15px] font-semibold'>Connectors</p>
      <p className='mt-1 text-[13px]' style={{ color: CLAUDE.muted }}>
        Allow Claude to reference other apps and services for more context.
      </p>
      <div className='mt-5 space-y-2'>
        {[
          ["G", "Google Drive", "#3f6fd8"],
          ["M", "Gmail", "#c5473d"],
          ["G", "GitHub", "#3a3a3a"],
        ].map(([letter, name, bg]) => (
          <div
            key={name}
            className='flex items-center gap-3 rounded-xl px-3 py-2.5'
            style={{ background: CLAUDE.side }}>
            <Tile letter={letter} bg={bg} />
            <span className='text-[13px]'>{name}</span>
            <span
              className='ml-auto rounded-lg px-3 py-1 text-xs'
              style={{ background: CLAUDE.card }}>
              Connect
            </span>
          </div>
        ))}
      </div>
      <div className='mt-5'>
        {dim ? (
          <span
            className='inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px]'
            style={{ background: CLAUDE.card }}>
            <Plus className='h-4 w-4' /> Add custom connector
          </span>
        ) : (
          <Hl ring={CLAUDE.clay}>
            <span
              className='inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px]'
              style={{ background: CLAUDE.card }}>
              <Plus className='h-4 w-4' /> Add custom connector
            </span>
          </Hl>
        )}
      </div>
    </div>
  </div>
);

export const ClaudeConnectorsScreen = () => (
  <BrowserFrame url='claude.ai/settings/connectors' tab='Settings - Claude'>
    <ClaudeSettings />
  </BrowserFrame>
);

const ClaudeInput = ({ label, value }: { label: string; value: string }) => (
  <div className='space-y-1.5'>
    <p className='text-xs' style={{ color: CLAUDE.muted }}>
      {label}
    </p>
    <p
      className='truncate rounded-lg px-3 py-2 text-[13px]'
      style={{ background: CLAUDE.bg, boxShadow: "inset 0 0 0 1px #4a4945" }}>
      {value}
    </p>
  </div>
);

export const ClaudeAddConnectorScreen = ({ url }: { url: string }) => (
  <BrowserFrame url='claude.ai/settings/connectors' tab='Settings - Claude'>
    <div className='relative h-full'>
      <ClaudeSettings dim />
      <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
        <div
          className='w-[420px] space-y-4 rounded-2xl p-6'
          style={{ background: CLAUDE.card, color: CLAUDE.text }}>
          <div className='flex items-center gap-2'>
            <p className='font-serif text-lg'>Add custom connector</p>
            <span
              className='rounded px-1.5 text-[10px] font-semibold'
              style={{ background: CLAUDE.bg, color: CLAUDE.muted }}>
              BETA
            </span>
            <X className='ml-auto h-4 w-4' style={{ color: CLAUDE.muted }} />
          </div>
          <p className='text-xs' style={{ color: CLAUDE.muted }}>
            Connect Claude to your data and tools.
          </p>
          <ClaudeInput label='Name' value='riff.quest' />
          <ClaudeInput label='Remote MCP server URL' value={url} />
          <p
            className='flex items-center gap-1 text-xs'
            style={{ color: CLAUDE.muted }}>
            <ChevronRight className='h-3 w-3' /> Advanced settings
          </p>
          <div className='flex justify-end gap-2 pt-1'>
            <span className='rounded-lg px-3 py-1.5 text-[13px]'>Cancel</span>
            <Hl ring={CLAUDE.clay}>
              <span
                className='rounded-lg px-4 py-1.5 text-[13px] font-medium'
                style={{ background: CLAUDE.text, color: "#141413" }}>
                Add
              </span>
            </Hl>
          </div>
        </div>
      </div>
    </div>
  </BrowserFrame>
);

export const ClaudeChatScreen = () => (
  <BrowserFrame url='claude.ai/new' tab='Claude'>
    <div
      className='flex h-full flex-col items-center justify-center gap-6 px-16'
      style={{ background: CLAUDE.bg, color: CLAUDE.text }}>
      <p className='font-serif text-2xl'>
        <span style={{ color: CLAUDE.clay }}>✻</span> How was practice today?
      </p>
      <div className='relative w-full'>
        <div
          className='absolute bottom-[86px] left-0 w-64 space-y-0.5 rounded-xl p-1.5 text-[13px] shadow-2xl'
          style={{ background: CLAUDE.card }}>
          {["Add files or photos", "Take a screenshot", "Add from GitHub"].map(
            (item) => (
              <p
                key={item}
                className='rounded-lg px-2.5 py-1.5'
                style={{ color: CLAUDE.muted }}>
                {item}
              </p>
            ),
          )}
          <div className='flex items-center gap-2 rounded-lg px-2.5 py-1.5'>
            <Globe className='h-3.5 w-3.5' style={{ color: CLAUDE.muted }} />
            <span>Web search</span>
            <span className='ml-auto'>
              <Toggle on={false} />
            </span>
          </div>
          <div
            className='flex items-center gap-2 rounded-lg px-2.5 py-1.5'
            style={{ background: CLAUDE.bg }}>
            <span
              className='flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold'
              style={{ background: CLAUDE.clay, color: CLAUDE.text }}>
              r
            </span>
            <span>riff.quest</span>
            <Hl className='ml-auto' ring={CLAUDE.clay}>
              <Toggle on color={CLAUDE.clay} />
            </Hl>
          </div>
          <p
            className='rounded-lg px-2.5 py-1.5'
            style={{ color: CLAUDE.muted }}>
            Manage connectors
          </p>
        </div>
        <div
          className='w-full rounded-2xl px-4 pb-3 pt-4'
          style={{ background: CLAUDE.card, boxShadow: "0 0 0 1px #3d3c39" }}>
          <p className='text-[15px]' style={{ color: CLAUDE.muted }}>
            How can I help you today?
          </p>
          <div className='mt-5 flex items-center gap-2'>
            <span
              className='flex h-8 w-8 items-center justify-center rounded-lg'
              style={{ boxShadow: "inset 0 0 0 1px #4a4945" }}>
              <Plus className='h-4 w-4' />
            </span>
            <span
              className='flex h-8 w-8 items-center justify-center rounded-lg'
              style={{ boxShadow: "inset 0 0 0 1px #4a4945" }}>
              <SlidersHorizontal className='h-4 w-4' />
            </span>
            <span className='ml-auto text-xs' style={{ color: CLAUDE.muted }}>
              Opus 5.5 <ChevronDown className='inline h-3 w-3' />
            </span>
            <span
              className='flex h-8 w-8 items-center justify-center rounded-lg'
              style={{ background: CLAUDE.clay }}>
              <ArrowUp className='h-4 w-4' />
            </span>
          </div>
        </div>
      </div>
    </div>
  </BrowserFrame>
);

/* ── riff.quest consent page ────────────────────────────────────────────── */

/** The real /oauth/authorize page, laid out with its own classes. */
export const ConsentScreen = ({ app, host }: { app: string; host: string }) => {
  const { t } = useTranslation("settings");
  return (
    <BrowserFrame
      url='riff.quest/oauth/authorize?client_id=…'
      tab='Connect an app — riff.quest'>
      <div className='flex h-full items-center justify-center bg-zinc-950 px-4'>
        <div className='w-[400px] space-y-5 rounded-2xl bg-zinc-900/60 p-7'>
          <Image
            src='/images/longlightlogo.svg'
            alt=''
            width={120}
            height={24}
            className='h-6 w-auto'
          />
          <div className='space-y-2'>
            <p className='text-lg font-bold leading-snug text-zinc-100'>
              {t("oauth.title", { app })}
            </p>
            <p className='text-xs text-zinc-400'>{t("oauth.subtitle")}</p>
          </div>
          <p className='rounded-lg bg-zinc-800/40 px-3 py-2 text-xs text-zinc-400'>
            {t("oauth.returns_to")}{" "}
            <span className='font-mono font-semibold text-zinc-100'>
              {host}
            </span>
          </p>
          <div className='flex items-center justify-between gap-4'>
            <p className='text-xs text-zinc-200'>{t("mcp.allow_writes")}</p>
            <Toggle on />
          </div>
          <div className='flex gap-2'>
            <span className='flex-1 rounded-md bg-zinc-800 py-2 text-center text-xs text-zinc-200'>
              {t("oauth.deny")}
            </span>
            <Hl className='flex-1'>
              <span className='w-full rounded-md bg-zinc-100 py-2 text-center text-xs font-semibold text-zinc-900'>
                {t("oauth.allow")}
              </span>
            </Hl>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};

/* ── ChatGPT ────────────────────────────────────────────────────────────── */

const GPT = {
  bg: "#212121",
  side: "#181818",
  modal: "#2f2f2f",
  text: "#ececec",
  muted: "#afafaf",
  blue: "#0285ff",
};

const GptSettings = ({ children }: { children: ReactNode }) => (
  <div
    className='flex h-full items-center justify-center bg-black/60'
    style={{ color: GPT.text }}>
    <div
      className='flex h-[350px] w-[640px] overflow-hidden rounded-2xl'
      style={{ background: GPT.modal }}>
      <div
        className='w-44 space-y-0.5 p-3 text-[13px]'
        style={{ background: GPT.side }}>
        <X className='mb-3 ml-1 h-4 w-4' style={{ color: GPT.muted }} />
        {[
          "General",
          "Notifications",
          "Personalization",
          "Apps & Connectors",
          "Schedules",
          "Data controls",
          "Security",
          "Account",
        ].map((item) => (
          <p
            key={item}
            className='rounded-lg px-2 py-1.5'
            style={{
              background: item === "Apps & Connectors" ? GPT.modal : undefined,
            }}>
            {item}
          </p>
        ))}
      </div>
      <div className='flex-1 p-6'>{children}</div>
    </div>
  </div>
);

export const GptDeveloperModeScreen = () => (
  <BrowserFrame url='chatgpt.com/#settings/Connectors/Advanced' tab='ChatGPT'>
    <GptSettings>
      <p className='flex items-center gap-1 text-[15px] font-semibold'>
        <ChevronLeft className='h-4 w-4' /> Advanced settings
      </p>
      <div className='mt-6 flex items-start gap-6'>
        <div>
          <p className='flex items-center gap-2 text-[13px]'>
            Developer mode
            <span className='rounded bg-[#4a2a12] px-1.5 text-[10px] font-semibold text-[#ff9f43]'>
              ELEVATED RISK
            </span>
          </p>
          <p
            className='mt-1 text-xs leading-relaxed'
            style={{ color: GPT.muted }}>
            Add unverified connectors that could modify or erase data
            permanently. Use at your own risk.
          </p>
        </div>
        <Hl className='ml-auto mt-1' ring={GPT.blue}>
          <Toggle on color={GPT.blue} />
        </Hl>
      </div>
    </GptSettings>
  </BrowserFrame>
);

const GptInput = ({ label, value }: { label: string; value: string }) => (
  <div className='space-y-1'>
    <p className='text-xs font-medium'>{label}</p>
    <p
      className='truncate rounded-lg px-3 py-1.5 text-[13px]'
      style={{ boxShadow: "inset 0 0 0 1px #4d4d4d" }}>
      {value}
    </p>
  </div>
);

export const GptNewConnectorScreen = ({ url }: { url: string }) => (
  <BrowserFrame url='chatgpt.com/#settings/Connectors' tab='ChatGPT'>
    <div
      className='flex h-full items-center justify-center bg-black/60'
      style={{ color: GPT.text }}>
      <div
        className='w-[440px] space-y-3 rounded-2xl p-5'
        style={{ background: GPT.modal }}>
        <div className='flex items-center gap-2'>
          <p className='text-[15px] font-semibold'>New Connector</p>
          <span
            className='rounded px-1.5 text-[10px]'
            style={{ background: GPT.bg, color: GPT.muted }}>
            BETA
          </span>
          <X className='ml-auto h-4 w-4' style={{ color: GPT.muted }} />
        </div>
        <GptInput label='Name' value='riff.quest' />
        <GptInput label='MCP Server URL' value={url} />
        <div className='space-y-1'>
          <p className='text-xs font-medium'>Authentication</p>
          <p
            className='flex items-center rounded-lg px-3 py-1.5 text-[13px]'
            style={{ boxShadow: "inset 0 0 0 1px #4d4d4d" }}>
            OAuth <ChevronDown className='ml-auto h-3.5 w-3.5' />
          </p>
        </div>
        <p
          className='flex items-center gap-2 text-xs'
          style={{ color: GPT.muted }}>
          <span className='flex h-4 w-4 items-center justify-center rounded bg-[#ececec]'>
            <Check className='h-3 w-3 text-black' />
          </span>
          I understand and want to continue
        </p>
        <div className='flex justify-end pt-1'>
          <Hl ring={GPT.blue}>
            <span className='rounded-full bg-[#ececec] px-4 py-1.5 text-[13px] font-medium text-black'>
              Create
            </span>
          </Hl>
        </div>
      </div>
    </div>
  </BrowserFrame>
);

export const GptChatScreen = () => (
  <BrowserFrame url='chatgpt.com' tab='ChatGPT'>
    <div
      className='flex h-full flex-col items-center justify-center gap-6 px-16'
      style={{ background: GPT.bg, color: GPT.text }}>
      <p className='text-2xl'>What are you working on?</p>
      <div className='relative w-full'>
        <div
          className='absolute bottom-[76px] left-0 w-60 rounded-2xl p-1.5 text-[13px] shadow-2xl'
          style={{ background: GPT.modal }}>
          {["Add photos & files", "Deep research", "Create image"].map(
            (item) => (
              <p key={item} className='rounded-lg px-2.5 py-1.5'>
                {item}
              </p>
            ),
          )}
          <p
            className='px-2.5 pb-1 pt-2 text-[11px]'
            style={{ color: GPT.muted }}>
            Developer mode
          </p>
          <div
            className='flex items-center gap-2 rounded-lg px-2.5 py-1.5'
            style={{ background: GPT.bg }}>
            <span className='flex h-4 w-4 items-center justify-center rounded bg-[#ff9f43] text-[9px] font-bold text-black'>
              r
            </span>
            riff.quest
            <Hl className='ml-auto' ring={GPT.blue}>
              <Toggle on color={GPT.blue} />
            </Hl>
          </div>
        </div>
        <div
          className='flex items-center gap-3 rounded-[28px] px-4 py-3'
          style={{ background: GPT.modal }}>
          <Plus className='h-5 w-5' />
          <span className='rounded-full bg-[#4a2a12] px-2 py-0.5 text-[11px] text-[#ff9f43]'>
            Developer mode
          </span>
          <span className='text-[15px]' style={{ color: GPT.muted }}>
            Ask anything
          </span>
          <Mic className='ml-auto h-4 w-4' />
          <span className='flex h-8 w-8 items-center justify-center rounded-full bg-[#ececec]'>
            <ArrowUp className='h-4 w-4 text-black' />
          </span>
        </div>
      </div>
    </div>
  </BrowserFrame>
);

/* ── Cursor ─────────────────────────────────────────────────────────────── */

const CURSOR = {
  bg: "#181818",
  panel: "#1f1f1f",
  row: "#262626",
  text: "#e4e4e4",
  muted: "#8b8b8b",
  blue: "#4c8bf5",
};

const CursorWindow = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div
    className='overflow-hidden rounded-lg font-sans'
    style={{ background: CURSOR.bg, color: CURSOR.text }}>
    <div
      className='flex items-center px-3 py-2 text-xs'
      style={{ background: CURSOR.panel, color: CURSOR.muted }}>
      <Search className='mr-2 h-3 w-3' />
      <span className='mx-auto'>{title}</span>
      <span className='flex gap-4'>
        <span>—</span>
        <span>▢</span>
        <X className='h-3.5 w-3.5' />
      </span>
    </div>
    {children}
  </div>
);

export const CursorConfigScreen = ({ url }: { url: string }) => (
  <CursorWindow title='mcp.json — Cursor'>
    <div className='flex text-xs' style={{ background: CURSOR.panel }}>
      <span
        className='flex items-center gap-2 px-3 py-1.5'
        style={{ background: CURSOR.bg }}>
        <span className='text-[#cbcb41]'>{"{}"}</span> mcp.json
        <X className='h-3 w-3' />
      </span>
    </div>
    <div className='font-mono flex text-[13px] leading-6'>
      <div className='select-none px-4 py-3 text-right text-[#6e7681]'>
        {[1, 2, 3, 4, 5, 6, 7].map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div className='py-3 pr-4'>
        <p>{"{"}</p>
        <p>
          {"  "}
          <span className='text-[#9cdcfe]'>&quot;mcpServers&quot;</span>: {"{"}
        </p>
        <p>
          {"    "}
          <span className='text-[#9cdcfe]'>&quot;riff-quest&quot;</span>: {"{"}
        </p>
        <p>
          {"      "}
          <span className='text-[#9cdcfe]'>&quot;url&quot;</span>:{" "}
          <span className='text-[#ce9178]'>&quot;{url}&quot;</span>
        </p>
        <p>{"    }"}</p>
        <p>{"  }"}</p>
        <p>{"}"}</p>
      </div>
    </div>
  </CursorWindow>
);

export const CursorMcpScreen = () => (
  <CursorWindow title='Cursor Settings'>
    <div className='flex h-[340px]'>
      <div
        className='w-44 space-y-0.5 px-2 py-4 text-[13px]'
        style={{ background: CURSOR.panel }}>
        {[
          "General",
          "Agents",
          "Tab",
          "Models",
          "Tools & MCP",
          "Rules & Memories",
          "Indexing & Docs",
          "Network",
          "Beta",
        ].map((item) => (
          <p
            key={item}
            className='rounded-md px-2 py-1.5'
            style={{
              background: item === "Tools & MCP" ? CURSOR.row : undefined,
              color: item === "Tools & MCP" ? CURSOR.text : CURSOR.muted,
            }}>
            {item}
          </p>
        ))}
      </div>
      <div className='flex-1 px-8 py-5'>
        <p className='text-[15px] font-semibold'>Tools & MCP</p>
        <p className='mt-5 text-xs' style={{ color: CURSOR.muted }}>
          Installed MCP Servers
        </p>
        <div
          className='mt-2 flex items-center gap-3 rounded-lg px-3 py-3'
          style={{ background: CURSOR.row }}>
          <Tile letter='R' bg='#b45309' />
          <div>
            <p className='text-[13px]'>riff-quest</p>
            <p className='flex items-center gap-1.5 text-xs text-[#e5a50a]'>
              <span className='h-1.5 w-1.5 rounded-full bg-[#e5a50a]' />
              Needs authentication
            </p>
          </div>
          <Hl className='ml-auto' ring={CURSOR.blue}>
            <span
              className='rounded-md px-3 py-1 text-xs text-white'
              style={{ background: CURSOR.blue }}>
              Connect
            </span>
          </Hl>
          <span className='ml-3'>
            <Toggle on color='#3fb950' />
          </span>
        </div>
        <p
          className='mt-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px]'
          style={{ background: CURSOR.panel, color: CURSOR.muted }}>
          <Plus className='h-4 w-4' /> New MCP Server
        </p>
      </div>
    </div>
  </CursorWindow>
);

/* ── Terminals ──────────────────────────────────────────────────────────── */

export const ClaudeCodeAddScreen = ({ url }: { url: string }) => (
  <TerminalFrame title='Windows PowerShell'>
    <Prompt>claude mcp add --transport http riff-quest {url}</Prompt>
    <p>Added HTTP MCP server riff-quest with URL: {url} to local config</p>
    <p>File modified: C:\Users\you\.claude.json</p>
    <Prompt>claude</Prompt>
  </TerminalFrame>
);

export const ClaudeCodeMcpScreen = ({ url }: { url: string }) => (
  <TerminalFrame title='claude'>
    <p>
      <span className='text-[#d77757]'>&gt;</span> /mcp
    </p>
    <div
      className='mt-2 rounded-md px-4 py-3'
      style={{ boxShadow: "inset 0 0 0 1px #d77757" }}>
      <p className='font-bold text-[#d77757]'>Riff-quest MCP Server</p>
      <p className='mt-2'>
        Status: <span className='text-[#e5c07b]'>△ needs authentication</span>
      </p>
      <p>URL: {url}</p>
      <p className='mt-2'>
        <span className='text-[#d77757]'>❯ 1. Authenticate</span>
      </p>
      <p className='text-[#8a8a8a]'>{"  "}2. Disable</p>
    </div>
    <p className='mt-2 text-[#8a8a8a]'>Esc to go back</p>
  </TerminalFrame>
);

export const CodexAddScreen = ({ url }: { url: string }) => (
  <TerminalFrame title='Windows PowerShell'>
    <Prompt>codex mcp add riff-quest --url {url}</Prompt>
    <p>Added global MCP server &apos;riff-quest&apos;.</p>
  </TerminalFrame>
);

export const CodexLoginScreen = () => (
  <TerminalFrame title='Windows PowerShell'>
    <Prompt>codex mcp login riff-quest</Prompt>
    <p>Authorize `riff-quest` by opening this URL in your browser:</p>
    <p className='text-[#3b8eea] underline'>
      https://riff.quest/oauth/authorize?response_type=code&amp;client_id=…
    </p>
    <p className='mt-2 text-[#23d18b]'>
      Successfully logged in to MCP server &apos;riff-quest&apos;.
    </p>
  </TerminalFrame>
);
