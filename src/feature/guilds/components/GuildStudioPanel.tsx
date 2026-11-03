import { GuildStudioTab } from "feature/guilds/components/GuildStudioTab";
import {
  useBuyStudioStep,
  useGuildStudio,
} from "feature/guilds/hooks/useGuildStudio";
import { useStudioText } from "feature/guilds/hooks/useStudioText";
import { itemLevel } from "feature/guilds/utils/guildStudio.utils";
import { toast } from "sonner";

/**
 * The studio tab as the guild view mounts it: the caller's guild's studio
 * from the server, and every purchase sent back to it. The server decides
 * what a step costs and whether the guild can pay; this only asks.
 */
export const GuildStudioPanel = () => {
  const text = useStudioText();
  const { t } = text;
  const { data, isLoading, isError } = useGuildStudio(true);
  const buy = useBuyStudioStep();

  if (isLoading)
    return (
      <p className='rounded-lg bg-zinc-900/40 p-6 text-sm text-zinc-400'>
        {t("studio.loading")}
      </p>
    );
  if (isError || !data)
    return (
      <p className='rounded-lg bg-zinc-900/40 p-6 text-sm text-zinc-400'>
        {t("studio.load_failed")}
      </p>
    );

  // The server words its refusals in English; the screen already says why a
  // button is off, so a refusal that still gets through only needs saying.
  const onError = () => toast.error(t("studio.failed"));

  return (
    <GuildStudioTab
      studio={data.studio}
      bank={data.bank}
      week={data.week}
      busy={buy.isPending}
      onUpgradeItem={(id) =>
        buy.mutate(
          { kind: "item", id },
          {
            onSuccess: (view) =>
              toast.success(
                t("studio.bought", {
                  name: text.levelName(id, itemLevel(view.studio, id)),
                }),
              ),
            onError,
          },
        )
      }
      onUpgradeRoom={() =>
        buy.mutate(
          { kind: "room" },
          {
            onSuccess: (view) =>
              toast.success(
                t("studio.moved", {
                  room: text.roomName(view.studio.roomLevel),
                }),
              ),
            onError,
          },
        )
      }
    />
  );
};
