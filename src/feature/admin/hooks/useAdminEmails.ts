import axios from "axios";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export type AdminEmailType =
  | "welcome"
  | "streak_d1"
  | "streak_d3"
  | "season_start"
  | "season_ending_soon"
  | "season_results";

export interface AdminEmailRecipient {
  uid: string;
  email: string;
  displayName: string;
  extras?: Record<string, unknown>;
}

export interface AdminEmailContext {
  seasonName?: string;
  daysInSeason?: number;
  top3?: { displayName: string; points: number }[];
}

export interface AdminEmailRecipientsResponse {
  type: AdminEmailType;
  recipients: AdminEmailRecipient[];
  cooldownExcluded: number;
  context?: AdminEmailContext;
  description: string;
}

export interface SendResultRow {
  uid: string;
  email: string;
  ok: boolean;
  error?: string;
  cooldown?: boolean;
}

export interface SendResult {
  sent: number;
  failed: number;
  cooldownSkipped: number;
  results: SendResultRow[];
}

export const useAdminEmails = (password: string) => {
  const [data, setData] = useState<AdminEmailRecipientsResponse | null>(null);
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<SendResult | null>(null);

  const fetchRecipients = useCallback(
    async (type: AdminEmailType) => {
      if (!password) return;
      setIsLoading(true);
      setLastResult(null);
      try {
        const res = await axios.get<AdminEmailRecipientsResponse>("/api/admin/emails", {
          params: { type },
          headers: { "x-admin-password": password },
        });
        setData(res.data);
        setSelectedUids(new Set(res.data.recipients.map((r) => r.uid)));
      } catch (err: any) {
        toast.error(err?.response?.data?.error ?? "Failed to load recipients");
        setData(null);
        setSelectedUids(new Set());
      } finally {
        setIsLoading(false);
      }
    },
    [password]
  );

  const toggleRecipient = useCallback((uid: string) => {
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!data) return;
    setSelectedUids(new Set(data.recipients.map((r) => r.uid)));
  }, [data]);

  const deselectAll = useCallback(() => {
    setSelectedUids(new Set());
  }, []);

  const sendSelected = useCallback(async () => {
    if (!data || !password) return;
    const selected = data.recipients.filter((r) => selectedUids.has(r.uid));
    if (selected.length === 0) {
      toast.error("No recipients selected");
      return;
    }
    setIsSending(true);
    setLastResult(null);
    try {
      const res = await axios.post<SendResult>(
        "/api/admin/emails",
        { type: data.type, recipients: selected, context: data.context },
        { headers: { "x-admin-password": password } }
      );
      setLastResult(res.data);
      const { sent, failed, cooldownSkipped } = res.data;
      if (failed === 0) {
        toast.success(`Sent ${sent} email${sent === 1 ? "" : "s"}`);
      } else if (cooldownSkipped === failed) {
        toast.warning(`Sent ${sent}, ${cooldownSkipped} on cooldown`);
      } else {
        toast.warning(`Sent ${sent}, failed ${failed}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to send emails");
    } finally {
      setIsSending(false);
    }
  }, [data, password, selectedUids]);

  const reset = useCallback(() => {
    setData(null);
    setSelectedUids(new Set());
    setLastResult(null);
  }, []);

  return {
    data,
    selectedUids,
    isLoading,
    isSending,
    lastResult,
    fetchRecipients,
    toggleRecipient,
    selectAll,
    deselectAll,
    sendSelected,
    reset,
  };
};
