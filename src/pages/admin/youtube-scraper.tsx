import AdminLogin from "feature/admin/components/AdminLogin";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import AdminLayout from "feature/admin/layouts/AdminLayout";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import type { ScraperConfig, YouTubeLesson, YouTubeLessonStatus } from "feature/aiCoach/types/youtubeLesson.types";
import { DEFAULT_SCRAPER_CONFIG } from "feature/aiCoach/types/youtubeLesson.types";
import {
  firebaseGetScraperConfig,
  firebaseSaveScraperConfig,
  firebaseGetLessonsByStatus,
  firebaseUpdateLesson,
  firebaseGetLessonStats,
} from "feature/aiCoach/services/youtubeLesson.service";
import { authOptions } from "../api/auth/[...nextauth]";
import { Youtube, Settings, Play, RefreshCw, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";

type LessonFilter = YouTubeLessonStatus | "all";

const STATUS_COLORS: Record<YouTubeLessonStatus, string> = {
  raw: "text-amber-400 bg-amber-400/10",
  indexed: "text-emerald-400 bg-emerald-400/10",
  rejected: "text-red-400 bg-red-400/10",
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}m`;
}

const YouTubeScraper = () => {
  const [config, setConfig] = useState<ScraperConfig>(DEFAULT_SCRAPER_CONFIG);
  const [lessons, setLessons] = useState<YouTubeLesson[]>([]);
  const [stats, setStats] = useState({ raw: 0, indexed: 0, rejected: 0, total: 0 });
  const [filter, setFilter] = useState<LessonFilter>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [isScraping, setIsScraping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [processLogs, setProcessLogs] = useState<any[]>([]);
  const [scrapeLogs, setScrapeLogs] = useState<any[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [channelInput, setChannelInput] = useState("");

  const loadData = useCallback(async (pass: string) => {
    try {
      const [cfg, sts] = await Promise.all([
        firebaseGetScraperConfig(),
        firebaseGetLessonStats(),
      ]);
      setConfig(cfg);
      setStats(sts);
      loadLessons("all");
    } catch (err) {
      toast.error("Failed to load data");
    }
  }, []);

  const { password, setPassword, isAuth, handleLogin, handleLogout } = useAdminAuth(loadData);

  const loadLessons = async (statusFilter: LessonFilter) => {
    try {
      let data: YouTubeLesson[];
      if (statusFilter === "all") {
        const [raw, indexed, rejected] = await Promise.all([
          firebaseGetLessonsByStatus("raw", 20),
          firebaseGetLessonsByStatus("indexed", 20),
          firebaseGetLessonsByStatus("rejected", 10),
        ]);
        data = [...raw, ...indexed, ...rejected];
      } else {
        data = await firebaseGetLessonsByStatus(statusFilter, 50);
      }
      setLessons(data);
    } catch {
      toast.error("Failed to load lessons");
    }
  };

  useEffect(() => {
    if (isAuth) { loadLessons(filter); setPage(0); }
  }, [filter, isAuth]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await firebaseSaveScraperConfig(config);
      toast.success("Config saved");
    } catch {
      toast.error("Failed to save config");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleScrape = async () => {
    setIsScraping(true);
    setScrapeLogs([]);
    try {
      const res = await fetch("/api/admin/scrape-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScrapeLogs(data.logs ?? []);
      toast.success(`Scraping done: ${data.newLessons} new, ${data.skipped} skipped`);
      const sts = await firebaseGetLessonStats();
      setStats(sts);
      await loadLessons(filter);
    } catch (err: any) {
      toast.error(err.message || "Scraping failed");
    } finally {
      setIsScraping(false);
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setProcessLogs([]);
    let totalIndexed = 0;
    let totalRejected = 0;
    const allLogs: any[] = [];
    try {
      while (true) {
        const res = await fetch("/api/admin/process-youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-password": password },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.processed === 0) break;
        totalIndexed += data.indexed;
        totalRejected += data.rejected;
        allLogs.push(...(data.logs ?? []));
        setProcessLogs([...allLogs]);
        toast.info(`Batch: ${data.indexed} indexed, ${data.rejected} rejected`);
      }
      toast.success(`Done: ${totalIndexed} indexed, ${totalRejected} rejected`);
      const sts = await firebaseGetLessonStats();
      setStats(sts);
      await loadLessons(filter);
    } catch (err: any) {
      toast.error(err.message || "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (videoId: string, status: YouTubeLessonStatus) => {
    try {
      await fetch("/api/admin/youtube-lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ videoId, status }),
      });
      setLessons((prev) =>
        prev.map((l) => (l.videoId === videoId ? { ...l, status } : l))
      );
      const sts = await firebaseGetLessonStats();
      setStats(sts);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const addQuery = () => {
    const q = queryInput.trim();
    if (!q || config.searchQueries.includes(q)) return;
    setConfig((prev) => ({ ...prev, searchQueries: [...prev.searchQueries, q] }));
    setQueryInput("");
  };

  const removeQuery = (q: string) => {
    setConfig((prev) => ({ ...prev, searchQueries: prev.searchQueries.filter((x) => x !== q) }));
  };

  const addExcludedChannel = () => {
    const ch = channelInput.trim();
    if (!ch || config.excludedChannels.includes(ch)) return;
    setConfig((prev) => ({ ...prev, excludedChannels: [...prev.excludedChannels, ch] }));
    setChannelInput("");
  };

  const removeExcludedChannel = (ch: string) => {
    setConfig((prev) => ({ ...prev, excludedChannels: prev.excludedChannels.filter((x) => x !== ch) }));
  };

  if (!isAuth) {
    return <AdminLogin password={password} setPassword={setPassword} onLogin={handleLogin} />;
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-8 p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <Youtube className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">YouTube Scraper</h2>
            <p className="text-sm text-zinc-500">Manage guitar lesson scraping and indexing</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total, color: "text-zinc-200" },
            { label: "Raw", value: stats.raw, color: "text-amber-400" },
            { label: "Indexed", value: stats.indexed, color: "text-emerald-400" },
            { label: "Rejected", value: stats.rejected, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleScrape}
            disabled={isScraping || isProcessing}
            className="gap-2 bg-red-600 hover:bg-red-500 text-white font-bold"
          >
            {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isScraping ? "Scraping..." : "Run Scrape"}
          </Button>
          <Button
            onClick={handleProcess}
            disabled={isScraping || isProcessing || stats.raw === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isProcessing ? "Processing..." : `Process & Index (${stats.raw} raw)`}
          </Button>
        </div>

        {/* Scrape Logs */}
        {scrapeLogs.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                Scrape Logs ({scrapeLogs.filter((l) => l.result === "saved").length} saved · {scrapeLogs.filter((l) => l.result === "skipped").length} skipped)
              </h3>
              <button onClick={() => setScrapeLogs([])} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition">
                Clear
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/40">
              {scrapeLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    log.result === "saved"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {log.result === "saved" ? "✓ new" : "skip"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-300">{log.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-zinc-600">
                      {log.channelName}
                      {log.viewCount ? ` · ${(log.viewCount / 1000).toFixed(0)}k views` : ""}
                      {log.duration ? ` · ${Math.floor(log.duration / 60)}m` : ""}
                      {log.skipReason ? ` · ${log.skipReason}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Logs */}
        {processLogs.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                Processing Logs ({processLogs.length})
              </h3>
              <button
                onClick={() => setProcessLogs([])}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 transition"
              >
                Clear
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/40">
              {processLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    log.result === "indexed"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : log.result === "rejected"
                      ? "bg-red-400/10 text-red-400"
                      : "bg-zinc-700 text-zinc-400"
                  }`}>
                    {log.result === "indexed" ? "✓" : log.result === "rejected" ? "✗" : "!"}{" "}
                    {log.qualityScore != null ? `${log.qualityScore}/10` : log.result}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-zinc-300">{log.title}</p>
                    {log.qualityReason && (
                      <p className="mt-0.5 text-[11px] text-zinc-600">{log.qualityReason}</p>
                    )}
                    {log.topics?.length > 0 && (
                      <p className="mt-0.5 text-[10px] text-zinc-700">{log.topics.join(", ")}</p>
                    )}
                    {log.error && (
                      <p className="mt-0.5 text-[11px] text-red-500">{log.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Config */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Configuration</h3>
          </div>

          {/* Quality Filters */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Min Views", key: "minViewCount" as const, type: "number" },
              { label: "Min Duration (s)", key: "minDurationSeconds" as const, type: "number" },
              { label: "Max Duration (s)", key: "maxDurationSeconds" as const, type: "number" },
              { label: "Min Quality Score", key: "minQualityScore" as const, type: "number" },
            ].map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  {field.label}
                </label>
                <Input
                  type={field.type}
                  value={config[field.key]}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, [field.key]: parseInt(e.target.value) || 0 }))
                  }
                  className="h-9 border-zinc-700 bg-zinc-800 text-zinc-100 text-sm"
                />
              </div>
            ))}
          </div>

          {/* Search Queries */}
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Search Queries
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addQuery()}
                placeholder="guitar lesson beginner..."
                className="h-9 border-zinc-700 bg-zinc-800 text-zinc-100 text-sm"
              />
              <Button onClick={addQuery} size="sm" variant="outline" className="shrink-0 border-zinc-700">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.searchQueries.map((q) => (
                <span
                  key={q}
                  className="flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                >
                  {q}
                  <button onClick={() => removeQuery(q)} className="text-zinc-600 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Excluded Channels */}
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Excluded Channels
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addExcludedChannel()}
                placeholder="Channel name to blacklist..."
                className="h-9 border-zinc-700 bg-zinc-800 text-zinc-100 text-sm"
              />
              <Button onClick={addExcludedChannel} size="sm" variant="outline" className="shrink-0 border-zinc-700">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.excludedChannels.map((ch) => (
                <span
                  key={ch}
                  className="flex items-center gap-1.5 rounded-full bg-red-900/30 px-3 py-1 text-xs text-red-300"
                >
                  {ch}
                  <button onClick={() => removeExcludedChannel(ch)} className="hover:text-red-100">×</button>
                </span>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSaveConfig}
            disabled={isSavingConfig}
            size="sm"
            className="bg-zinc-700 hover:bg-zinc-600 text-white"
          >
            {isSavingConfig ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Save Config
          </Button>
        </div>

        {/* Lessons Table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Lessons</h3>
            <div className="flex gap-2">
              {(["all", "raw", "indexed", "rejected"] as LessonFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase transition ${
                    filter === s
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {lessons.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-600">No lessons found</p>
            ) : (() => {
              const filtered = lessons.filter((l) => filter === "all" || l.status === filter);
              const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
              const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
              return (
              <>
              {paginated.map((lesson) => (
                  <div key={lesson.videoId} className="flex items-center gap-3 px-4 py-3">
                    <img
                      src={lesson.thumbnailUrl}
                      alt={lesson.title}
                      className="h-10 w-[72px] shrink-0 rounded-lg object-cover bg-zinc-800"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-200">{lesson.title}</p>
                      <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                        {lesson.channelName}
                        {lesson.duration ? ` · ${formatDuration(lesson.duration)}` : ""}
                        {lesson.viewCount ? ` · ${(lesson.viewCount / 1000).toFixed(0)}k views` : ""}
                        {lesson.qualityScore != null ? ` · Score: ${lesson.qualityScore}/10` : ""}
                        {lesson.level ? ` · ${lesson.level}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[lesson.status]}`}
                      >
                        {lesson.status}
                      </span>
                      {lesson.status !== "indexed" && (
                        <button
                          title="Approve / Re-index"
                          onClick={() => handleStatusChange(lesson.videoId, "raw")}
                          className="rounded-lg p-1.5 text-zinc-600 hover:bg-emerald-900/30 hover:text-emerald-400 transition"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {lesson.status !== "rejected" && (
                        <button
                          title="Reject"
                          onClick={() => handleStatusChange(lesson.videoId, "rejected")}
                          className="rounded-lg p-1.5 text-zinc-600 hover:bg-red-900/30 hover:text-red-400 transition"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
                  <p className="text-[11px] text-zinc-600">
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 0}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[60px] text-center text-[11px] text-zinc-500">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              </>
              );
            })()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !session.user) {
    return { notFound: true };
  }

  try {
    const userId = (session.user as any).id;
    if (!userId) return { notFound: true };
    const userDocRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    if (!userData || userData.role !== "admin") {
      return { notFound: true };
    }

    return { props: {} };
  } catch {
    return { notFound: true };
  }
};

export default YouTubeScraper;
