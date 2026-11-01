import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { Heart } from "lucide-react";
import Link from "next/link";

/**
 * Shown wherever a player without the supporter badge meets AI assistants:
 * Settings → AI assistants and the consent screen an AI app opens. The servers
 * refuse on their own (lib/mcp/supporter); this only says why, and where to go.
 */
export const McpSupporterNotice = () => {
  const { t } = useTranslation("settings");
  return (
    <div className='space-y-4 rounded-lg bg-zinc-900/40 p-5'>
      <div className='space-y-2'>
        <p className='flex items-center gap-2 text-sm font-semibold text-amber-300'>
          <Heart className='h-4 w-4' fill='currentColor' aria-hidden='true' />
          {t("mcp.supporters_title")}
        </p>
        <p className='text-sm leading-relaxed text-zinc-400'>
          {t("mcp.supporters_description")}
        </p>
      </div>
      <Button asChild size='sm'>
        <Link href='/supporter'>{t("mcp.supporters_cta")}</Link>
      </Button>
    </div>
  );
};
