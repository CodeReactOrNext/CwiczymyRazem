import { useLiveMotivateStore } from "feature/liveMotivate/store/useLiveMotivateStore";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";

/**
 * The session summary's line for live motivations: who motivated the player while they played
 * and the Fame it brought, Hype bonus included. Shows nothing when nobody did.
 */
export const LiveFameSummary = () => {
  const { t } = useTranslation("feed");
  const received = useLiveMotivateStore((state) => state.received);
  if (received.length === 0) return null;

  const total = received.reduce((sum, item) => sum + item.fame, 0);
  const first = received[0];
  const hypeCount = received.find((item) => item.hype)?.hypeCount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.5 }}
      className='flex items-center gap-3 rounded-lg bg-zinc-900/60 px-4 py-3'>
      <span className='flex shrink-0'>
        {received.slice(0, 4).map((item, i) =>
          item.senderAvatarUrl ? (
            <img
              key={item.id}
              src={item.senderAvatarUrl}
              alt=''
              className={`h-8 w-8 rounded-full object-cover ring-2 ring-zinc-950 ${i > 0 ? "-ml-2" : ""}`}
            />
          ) : (
            <span
              key={item.id}
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200 ring-2 ring-zinc-950 ${i > 0 ? "-ml-2" : ""}`}>
              {item.senderName[0]?.toUpperCase() ?? "?"}
            </span>
          ),
        )}
      </span>
      <span className='min-w-0 flex-1 text-sm text-zinc-300'>
        {received.length > 1
          ? t("live_summary_many", { name: first.senderName, count: received.length - 1 })
          : t("live_summary_one", { name: first.senderName })}
        {hypeCount > 0 && (
          <span className='ml-2 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-bold text-amber-400'>
            {t("live_hype", { count: hypeCount })}
          </span>
        )}
      </span>
      <span className='flex shrink-0 items-center gap-1.5 pt-[0.15em] font-teko text-3xl font-semibold leading-none tabular-nums text-amber-400'>
        <img src='/images/tokens/coin.png' alt='' className='-mt-1 h-6 w-6 object-contain' />+{total}
      </span>
    </motion.div>
  );
};
