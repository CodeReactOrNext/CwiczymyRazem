import { useTranslation } from "hooks/useTranslation";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { useDashboardLayoutContext } from "feature/dashboard/context/DashboardContext";
import {
  getShortcut,
  SHORTCUT_GROUP_LABELS,
  SHORTCUT_GROUP_ORDER,
  SHORTCUTS,
} from "feature/dashboard/data/shortcutCatalog";
import {
  isShortcutLimitReached,
  MAX_SHORTCUTS,
  toggleShortcut,
} from "feature/dashboard/utils/dashboardLayout";
import { Zap } from "lucide-react";
import Link from "next/link";

import { WidgetHeader } from "./WidgetHeader";

const chip =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500";

/**
 * A row of the player's own quick links. While Home is being customised the
 * same card turns into the picker, so choosing shortcuts happens where they
 * will be used rather than in a separate settings screen.
 */
export const ShortcutsWidget = () => {
  const { t } = useTranslation("dashboard");
  const { layout, isEditing, updateLayout } = useDashboardLayoutContext();
  const selected = layout.shortcuts;
  const limitReached = isShortcutLimitReached(layout);

  if (isEditing) {
    return (
      <Card className='p-5 sm:p-6'>
        <WidgetHeader
          icon={Zap}
          title={t("shortcuts.title")}
          action={
            <span className='text-xs tabular-nums text-zinc-500'>
              {selected.length}/{MAX_SHORTCUTS}
            </span>
          }
        />
        <p className='mb-5 text-sm text-zinc-400'>
          {t("shortcuts.tap_to_pin")}{" "}
          {limitReached
            ? t("shortcuts.limit_reached")
            : t("shortcuts.up_to", { count: MAX_SHORTCUTS })}
        </p>

        <div className='space-y-5'>
          {SHORTCUT_GROUP_ORDER.map((group) => (
            <div key={group}>
              <p className='mb-2 text-xs font-semibold text-zinc-500'>
                {t(`shortcuts.groups.${group}`, SHORTCUT_GROUP_LABELS[group])}
              </p>
              <div className='flex flex-wrap gap-2'>
                {SHORTCUTS.filter((shortcut) => shortcut.group === group).map(
                  (shortcut) => {
                    const active = selected.includes(shortcut.id);
                    const Icon = shortcut.icon;
                    return (
                      <button
                        key={shortcut.id}
                        type='button'
                        aria-pressed={active}
                        disabled={!active && limitReached}
                        onClick={() =>
                          updateLayout(toggleShortcut(layout, shortcut.id))
                        }
                        className={cn(
                          chip,
                          "disabled:pointer-events-none disabled:opacity-50",
                          active
                            ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                            : "bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100",
                        )}>
                        <Icon
                          size={14}
                          className={cn(
                            "shrink-0",
                            active ? "text-cyan-400" : "text-zinc-500",
                          )}
                        />
                        {t(`shortcuts.items.${shortcut.id}`, shortcut.label)}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className='p-5 sm:p-6'>
      <WidgetHeader icon={Zap} title={t("shortcuts.title")} />
      {selected.length === 0 ? (
        <p className='text-sm text-zinc-400'>
          {t("shortcuts.empty")}
        </p>
      ) : (
        <div className='flex flex-wrap gap-2'>
          {selected.map((id) => {
            const shortcut = getShortcut(id);
            const Icon = shortcut.icon;
            return (
              <Link
                key={id}
                href={shortcut.href}
                className={cn(
                  chip,
                  "bg-zinc-900/40 text-zinc-200 hover:bg-zinc-800/60 hover:text-zinc-100",
                )}>
                <Icon size={14} className='shrink-0 text-zinc-500' />
                {t(`shortcuts.items.${shortcut.id}`, shortcut.label)}
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
};
