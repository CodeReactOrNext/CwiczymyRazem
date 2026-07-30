import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import {
  ClipboardPaste,
  Copy,
  Link2,
  Scissors,
  TextCursorInput,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  ElectronAppApi,
  ElectronContextMenuParams,
} from "types/electronApp";

interface ContextMenuItem {
  label: string;
  icon: typeof Copy;
  enabled: boolean;
  action: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

const VIEWPORT_MARGIN = 8;

export const buildMenuItems = (
  api: ElectronAppApi,
  params: ElectronContextMenuParams
): ContextMenuItem[] => {
  const items: ContextMenuItem[] = [];

  if (params.isEditable) {
    items.push(
      {
        label: "Cut",
        icon: Scissors,
        enabled: params.editFlags.canCut,
        action: () => api.editCommand("cut"),
      },
      {
        label: "Copy",
        icon: Copy,
        enabled: params.editFlags.canCopy,
        action: () => api.editCommand("copy"),
      },
      {
        label: "Paste",
        icon: ClipboardPaste,
        enabled: params.editFlags.canPaste,
        action: () => api.editCommand("paste"),
      },
      {
        label: "Select All",
        icon: TextCursorInput,
        enabled: params.editFlags.canSelectAll,
        action: () => api.editCommand("selectAll"),
      }
    );
  } else if (params.selectionText.trim()) {
    items.push({
      label: "Copy",
      icon: Copy,
      enabled: true,
      action: () => api.editCommand("copy"),
    });
  }

  if (params.linkURL) {
    items.push({
      label: "Copy Link Address",
      icon: Link2,
      enabled: true,
      action: () => api.copyText(params.linkURL),
    });
  }

  return items;
};

/**
 * Desktop-shell glue, mounted once in _app. Renders nothing on the web build —
 * `window.electronApp` is only present inside Electron (electron/preload.js).
 *
 * - Custom context menu: the main process forwards right-click params here and
 *   we draw a design-matched menu instead of a native/browser one; actions run
 *   through webContents so cut/copy/paste keep native semantics.
 * - Tray/dock quick actions: navigation requests are pushed through the Next
 *   router so the SPA doesn't do a full reload.
 */
export const ElectronIntegrations = () => {
  const router = useRouter();
  const { t } = useTranslation("toast");
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const api = window.electronApp;
    if (!api) return undefined;
    return api.onNavigate((route) => {
      router.push(route);
    });
  }, [router]);

  // The desktop shell only updates on its own cycle (electron-updater) and,
  // with the app parked in the tray for weeks at a time, a downloaded update
  // can otherwise sit unapplied far longer than the web bundle it loads
  // (which redeploys instantly) — the exact mismatch that broke
  // window.nativeAmp.onOverload for users on a stale shell. Prompt instead
  // of waiting for a natural quit.
  useEffect(() => {
    const api = window.electronApp;
    if (!api || typeof api.onUpdateReady !== "function") return undefined;
    return api.onUpdateReady(() => {
      toast.info(t("info.update_ready"), {
        id: "desktop-update-ready",
        duration: Infinity,
        action: {
          label: t("info.update_ready_action"),
          onClick: () => api.installUpdate(),
        },
      });
    });
  }, [t]);

  useEffect(() => {
    const api = window.electronApp;
    if (!api) return undefined;
    return api.onContextMenu((params) => {
      const items = buildMenuItems(api, params);
      // Native apps show nothing on "dead" areas — mirror that.
      setMenu(items.length > 0 ? { x: params.x, y: params.y, items } : null);
    });
  }, []);

  // Clicks near the right/bottom edge would overflow — clamp into the viewport.
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!menu || !el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(
      menu.x,
      Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.width - VIEWPORT_MARGIN)
    );
    const y = Math.min(
      menu.y,
      Math.max(
        VIEWPORT_MARGIN,
        window.innerHeight - rect.height - VIEWPORT_MARGIN
      )
    );
    if (x !== menu.x || y !== menu.y) setMenu({ ...menu, x, y });
  }, [menu]);

  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    const onMouseDown = (event: MouseEvent) => {
      const el = menuRef.current;
      if (el && event.target instanceof Node && el.contains(event.target)) {
        return;
      }
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", close);
    window.addEventListener("wheel", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", close);
      window.removeEventListener("wheel", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  if (!menu) return null;

  return (
    <div
      ref={menuRef}
      style={{ left: menu.x, top: menu.y }}
      className='fixed z-[100] min-w-[11rem] rounded-lg bg-zinc-900 p-1 shadow-xl shadow-black/50 duration-100 animate-in fade-in-0 zoom-in-95'
      // preventDefault keeps focus on the right-clicked element, so paste/cut
      // still target it after clicking a menu item.
      onMouseDown={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}>
      {menu.items.map((item) => (
        <button
          key={item.label}
          type='button'
          tabIndex={-1}
          disabled={!item.enabled}
          onClick={() => {
            item.action();
            setMenu(null);
          }}
          className={cn(
            "flex w-full select-none items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm text-zinc-200 transition-colors",
            item.enabled ? "hover:bg-zinc-800" : "opacity-40"
          )}>
          <item.icon size={14} strokeWidth={1.5} className='text-zinc-400' />
          {item.label}
        </button>
      ))}
    </div>
  );
};
