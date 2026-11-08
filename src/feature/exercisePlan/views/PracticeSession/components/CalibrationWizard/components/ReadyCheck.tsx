import { motion } from "framer-motion";
import { Check, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** ReadyCheck's counterpart for "not yet — here's what to change", with an icon naming the problem. */
export const IssueNote = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    role="status"
    className="flex items-start gap-3 rounded-lg bg-amber-500/10 px-4 py-3"
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-amber-950">
      <Icon className="h-4 w-4" strokeWidth={2.5} />
    </span>
    <span className="pt-1 text-base leading-relaxed text-amber-200">{children}</span>
  </motion.div>
);

/** The setup's "this part is done, go on" mark — one look for every step that gates Next. */
export const ReadyCheck = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", stiffness: 420, damping: 26 }}
    role="status"
    className="flex items-center gap-3 rounded-lg bg-emerald-500/10 px-4 py-3"
  >
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.05 }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-emerald-950"
    >
      <Check className="h-5 w-5" strokeWidth={3} />
    </motion.span>
    <span className="text-base font-medium text-emerald-300">{children}</span>
  </motion.div>
);
