import { GuildRecordingTab } from "feature/guilds/components/GuildRecordingTab";
import { getRecordingContract } from "feature/guilds/data/guildRecording";
import {
  useBookRecording,
  useClaimRecordingPay,
  useDeliverRecording,
  useGuildRecording,
} from "feature/guilds/hooks/useGuildRecording";
import { useRecordingTakeStore } from "feature/guilds/services/guildRecording.service";
import { useTranslation } from "hooks/useTranslation";
import { useRouter } from "next/router";
import { toast } from "sonner";

/**
 * The Recording tab as the guild view mounts it: the caller's guild's
 * sessions from the server, every booking and payout sent back to it, and
 * the way into a take or a rehearsal. The server decides what a session
 * costs, what a take is worth and who is paid; this only asks.
 */
export const GuildRecordingPanel = ({
  onOpenStudio,
}: {
  onOpenStudio: () => void;
}) => {
  const { t } = useTranslation("guilds");
  const router = useRouter();
  const { data, isLoading, isError } = useGuildRecording(true);
  const lastTake = useRecordingTakeStore((state) => state.last);
  const book = useBookRecording();
  const deliver = useDeliverRecording();
  const claim = useClaimRecordingPay();

  if (isLoading)
    return (
      <p className='rounded-lg bg-zinc-900/40 p-6 text-sm text-zinc-400'>
        {t("recording.loading")}
      </p>
    );
  if (isError || !data)
    return (
      <p className='rounded-lg bg-zinc-900/40 p-6 text-sm text-zinc-400'>
        {t("recording.load_failed")}
      </p>
    );

  // The server words its refusals in English; the screen already says why a
  // button is off, so a refusal that still gets through only needs saying.
  const onError = () => toast.error(t("recording.failed"));
  const open = (partId: string, rehearse: boolean) =>
    router.push({
      pathname: "/practice/recording/[partId]",
      query: { partId, ...(rehearse && { rehearse: "1" }) },
    });

  return (
    <GuildRecordingTab
      view={data}
      lastTake={lastTake}
      busy={book.isPending || deliver.isPending || claim.isPending}
      onBook={(tier) =>
        book.mutate(tier, {
          onSuccess: ({ view }) => {
            // The verdict on screen belongs to the session that just ended.
            useRecordingTakeStore.getState().setLast(null);
            // Only now does anybody know who walked in.
            const client = getRecordingContract(view.session?.contractId);
            toast.success(
              t("recording.booked", { client: client?.client ?? "" }),
            );
          },
          onError,
        })
      }
      onRecord={(partId) => open(partId, false)}
      onRehearse={(partId) => open(partId, true)}
      onDeliver={() =>
        deliver.mutate(undefined, {
          onSuccess: () => toast.success(t("recording.delivered")),
          onError,
        })
      }
      onClaim={() =>
        claim.mutate(undefined, {
          onSuccess: ({ fame }) =>
            toast.success(
              t("recording.collected", { fame: fame.toLocaleString() }),
            ),
          onError,
        })
      }
      onOpenStudio={onOpenStudio}
    />
  );
};
