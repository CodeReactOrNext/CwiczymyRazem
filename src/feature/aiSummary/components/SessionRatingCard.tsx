import { cn } from "assets/lib/utils";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { firebaseGetRating, firebaseSaveRating } from "../services/rating.service";
import {
  CheckCircle2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";
import type { DailySummaryResponse, SessionGrade, SessionRatingResponse } from "../types/summary.types";

// ─── Mood config (used by DailyAssessmentCard) ────────────────────────────────

const MOOD_CHIP: Record<DailySummaryResponse["mood"], string> = {
  excellent: "bg-orange-500/10 text-orange-400 border-orange-500/25",
  good:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  solid:     "bg-main/10 text-main border-main/25",
  light:     "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  rest:      "bg-zinc-800 text-zinc-500 border-zinc-700",
};

const MOOD_LABEL: Record<DailySummaryResponse["mood"], string> = {
  excellent: "Excellent session",
  good:      "Good practice",
  solid:     "Solid session",
  light:     "Light practice",
  rest:      "Rest day",
};

// ─── Score ring ───────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<SessionGrade, { ring: string; text: string; bg: string; border: string }> = {
  S:   { ring: "#f59e0b", text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25" },
  "A+":{ ring: "#10b981", text: "text-emerald-400",  bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  A:   { ring: "#10b981", text: "text-emerald-400",  bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  "A-":{ ring: "#34d399", text: "text-emerald-300",  bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  "B+":{ ring: "#0891B2", text: "text-main",         bg: "bg-main/10",        border: "border-main/25" },
  B:   { ring: "#0891B2", text: "text-main",         bg: "bg-main/10",        border: "border-main/25" },
  "B-":{ ring: "#67e8f9", text: "text-main-300",     bg: "bg-main/10",        border: "border-main/20" },
  "C+":{ ring: "#fbbf24", text: "text-yellow-400",   bg: "bg-yellow-500/10",  border: "border-yellow-500/25" },
  C:   { ring: "#fbbf24", text: "text-yellow-400",   bg: "bg-yellow-500/10",  border: "border-yellow-500/25" },
  D:   { ring: "#f97316", text: "text-orange-400",   bg: "bg-orange-500/10",  border: "border-orange-500/25" },
  F:   { ring: "#ef4444", text: "text-red-400",      bg: "bg-red-500/10",     border: "border-red-500/25" },
};

function ScoreRing({ score, grade, animated }: { score: number; grade: SessionGrade; animated: boolean }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const fill = animated ? (score / 10) * circ : 0;
  const offset = circ - fill;
  const cfg = GRADE_COLOR[grade];

  return (
    <div className="relative flex items-center justify-center w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
        {/* Track */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#27272a" strokeWidth="7" />
        {/* Progress */}
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={cfg.ring}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 6px ${cfg.ring}80)` }}
        />
      </svg>
      {/* Center text */}
      <div className="relative flex flex-col items-center gap-0.5">
        <span className={cn("text-2xl font-black tabular-nums leading-none", cfg.text)}>
          {score.toFixed(1)}
        </span>
        <span className={cn("text-xs font-black tracking-wider", cfg.text)}>{grade}</span>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RatingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 rounded-full bg-zinc-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded-full bg-zinc-800" />
          <div className="h-3.5 w-full rounded-full bg-zinc-800" />
          <div className="h-3.5 w-11/12 rounded-full bg-zinc-800" />
          <div className="h-3.5 w-4/5 rounded-full bg-zinc-800" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 w-3/4 rounded-full bg-zinc-800" />
        <div className="h-3 w-2/3 rounded-full bg-zinc-800" />
      </div>
    </div>
  );
}

// ─── Shared list renderer ─────────────────────────────────────────────────────

function ItemList({ items, markerColor }: { items: string[]; color: string; markerColor: string }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2.5">
      {items.map((s, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-200 leading-snug">
          <span className={cn("mt-[5px] shrink-0 text-[8px]", markerColor)}>▸</span>
          <span>{s}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Shared rating body ───────────────────────────────────────────────────────

function RatingBody({ rating, ringAnimated, cfg, compact = false }: {
  rating: SessionRatingResponse;
  ringAnimated: boolean;
  cfg: typeof GRADE_COLOR[SessionGrade];
  compact?: boolean;
}) {
  return (
    <>
      {/* ── Hero row: ring + verdict + feedback ── */}
      <div className="flex items-start gap-5">
        <ScoreRing score={rating.score} grade={rating.grade} animated={ringAnimated} />

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn("text-lg font-semibold", cfg.text)}>
              {rating.verdict}
            </span>
          </div>
          {!compact && (
            <p className="text-sm leading-relaxed text-zinc-300">{rating.feedback}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2">
        {rating.strengths.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Strengths</h4>
            </div>
            <ItemList items={rating.strengths} color="text-zinc-200" markerColor="text-emerald-500/60" />
          </div>
        )}
        {rating.improvements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <TriangleAlert size={15} className="text-yellow-400" />
              <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide">To Improve</h4>
            </div>
            <ItemList items={rating.improvements} color="text-zinc-200" markerColor="text-yellow-500/60" />
          </div>
        )}
      </div>


    </>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface SessionRatingCardProps {
  log: FirebaseUserExceriseLog;
  onClose?: () => void;
}

export function SessionRatingCard({ log }: SessionRatingCardProps) {
  const userStats = useAppSelector(selectCurrentUserStats);
  const userAuth  = useAppSelector(selectUserAuth) as string | null;
  const [rating, setRating] = useState<SessionRatingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ringAnimated, setRingAnimated] = useState(false);
  const hasFetched = useRef(false);

  const ratingId = `session-${log.reportDate?.seconds ?? Date.now()}`;

  const fetchRating = async () => {
    setLoading(true);
    setError(null);
    setRingAnimated(false);

    try {
      // Try Firebase cache first
      if (userAuth) {
        const cached = await firebaseGetRating(userAuth, ratingId);
        if (cached) {
          setRating(cached);
          setTimeout(() => setRingAnimated(true), 100);
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/rate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseTitle: log.exceriseTitle || "Practice session",
          techniqueTime: (log.timeSumary?.techniqueTime || 0) / 1000,
          theoryTime: (log.timeSumary?.theoryTime || 0) / 1000,
          hearingTime: (log.timeSumary?.hearingTime || 0) / 1000,
          creativityTime: (log.timeSumary?.creativityTime || 0) / 1000,
          totalTime: (log.timeSumary?.sumTime || 0) / 1000,
          points: log.totalPoints || 0,
          streak: userStats?.actualDayWithoutBreak || 0,
          userLevel: userStats?.lvl || 1,
          songTitle: log.songTitle,
          songArtist: log.songArtist,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as SessionRatingResponse;
      setRating(data);
      setTimeout(() => setRingAnimated(true), 100);
      if (userAuth) firebaseSaveRating(userAuth, ratingId, data);
    } catch {
      setError("Could not generate rating. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchRating();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cfg = rating ? GRADE_COLOR[rating.grade] : null;

  return (
    <div className={cn(
      "mt-2 rounded-2xl border p-5 space-y-5 transition-all duration-500",
      "border-zinc-800 bg-zinc-900"
    )}>
      {loading && <RatingSkeleton />}
      {error && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">{error}</p>
          <button onClick={fetchRating} className="text-xs font-bold text-zinc-400 hover:text-zinc-200 underline underline-offset-2">
            Try again
          </button>
        </div>
      )}
      {rating && !loading && cfg && (
        <RatingBody rating={rating} ringAnimated={ringAnimated} cfg={cfg} />
      )}
    </div>
  );
}

// ─── Period rating card (whole day / whole week) ───────────────────────────────

export interface PeriodRatingCardProps {
  ratingId: string;
  label: string;
  techniqueTime: number;
  theoryTime: number;
  hearingTime: number;
  creativityTime: number;
  totalTime: number;
  points: number;
  streak?: number;
  userLevel?: number;
  compact?: boolean;
  practiceStyle?: "professional" | "hobby";
  goal?: string;
}

// ─── Daily assessment card (merged: rating + coach summary) ───────────────────

export interface DailyAssessmentCardProps extends PeriodRatingCardProps {
  daily: DailySummaryResponse | null;
  dailyLoading: boolean;
  onRatingReady?: () => void;
  // practiceStyle and goal inherited from PeriodRatingCardProps
}

export function DailyAssessmentCard({
  ratingId, label, techniqueTime, theoryTime, hearingTime, creativityTime,
  totalTime, points, streak = 0, userLevel = 1,
  daily, dailyLoading, onRatingReady, practiceStyle, goal,
}: DailyAssessmentCardProps) {
  const userAuth = useAppSelector(selectUserAuth) as string | null;
  const [rating, setRating] = useState<SessionRatingResponse | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ringAnimated, setRingAnimated] = useState(false);
  const hasFetched = useRef(false);

  const fetchRating = async () => {
    setRatingLoading(true);
    setError(null);
    setRingAnimated(false);
    try {
      if (userAuth) {
        const cached = await firebaseGetRating(userAuth, ratingId);
        if (cached) {
          setRating(cached);
          setTimeout(() => setRingAnimated(true), 100);
          setRatingLoading(false);
          onRatingReady?.();
          return;
        }
      }
      const res = await fetch("/api/rate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseTitle: label, techniqueTime, theoryTime, hearingTime, creativityTime, totalTime, points, streak, userLevel, practiceStyle, goal }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as SessionRatingResponse;
      setRating(data);
      setTimeout(() => setRingAnimated(true), 100);
      if (userAuth) {
        await firebaseSaveRating(userAuth, ratingId, data);
        onRatingReady?.();
      }
    } catch {
      setError("Could not generate rating. Try again.");
    } finally {
      setRatingLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchRating();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = ratingLoading || dailyLoading;
  const cfg = rating ? GRADE_COLOR[rating.grade] : null;

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all duration-500",
      "border-zinc-800 bg-zinc-900"
    )}>

      {isLoading && <div className="p-5"><RatingSkeleton /></div>}

      {error && !isLoading && (
        <div className="flex items-center justify-between gap-3 p-5">
          <p className="text-sm text-zinc-500">{error}</p>
          <button onClick={fetchRating} className="text-xs font-bold text-zinc-400 hover:text-zinc-200 underline underline-offset-2">Try again</button>
        </div>
      )}

      {!isLoading && rating && cfg && (
        <div className="p-5 space-y-5">
          {/* Hero: ring + verdict + daily summary */}
          <div className="flex items-start gap-5">
            <ScoreRing score={rating.score} grade={rating.grade} animated={ringAnimated} />
            <div className="flex-1 min-w-0 space-y-2">
              <span className={cn("text-lg font-semibold leading-tight", cfg.text)}>{rating.verdict}</span>
              {daily?.summary && (
                <p className="text-sm leading-relaxed text-zinc-300">{daily.summary}</p>
              )}
            </div>
          </div>

          {/* Strengths / To Improve */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-1">
            {rating.strengths.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Strengths</h4>
                </div>
                <ItemList items={rating.strengths} color="text-zinc-200" markerColor="text-emerald-500/60" />
              </div>
            )}
            {rating.improvements.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <TriangleAlert size={15} className="text-yellow-400" />
                  <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide">To Improve</h4>
                </div>
                <ItemList items={rating.improvements} color="text-zinc-200" markerColor="text-yellow-500/60" />
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Period rating card (whole day / whole week) ───────────────────────────────

export function PeriodRatingCard({
  ratingId, label, techniqueTime, theoryTime, hearingTime, creativityTime, totalTime, points, streak = 0, userLevel = 1, compact = false, practiceStyle, goal,
}: PeriodRatingCardProps) {
  const userAuth = useAppSelector(selectUserAuth) as string | null;
  const [rating, setRating] = useState<SessionRatingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ringAnimated, setRingAnimated] = useState(false);
  const hasFetched = useRef(false);

  const fetchRating = async () => {
    setLoading(true);
    setError(null);
    setRingAnimated(false);

    try {
      // Try Firebase cache first
      if (userAuth) {
        const cached = await firebaseGetRating(userAuth, ratingId);
        if (cached) {
          setRating(cached);
          setTimeout(() => setRingAnimated(true), 100);
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/rate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseTitle: label, techniqueTime, theoryTime, hearingTime, creativityTime, totalTime, points, streak, userLevel, practiceStyle, goal }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as SessionRatingResponse;
      setRating(data);
      setTimeout(() => setRingAnimated(true), 100);
      if (userAuth) firebaseSaveRating(userAuth, ratingId, data);
    } catch {
      setError("Could not generate rating. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchRating();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cfg = rating ? GRADE_COLOR[rating.grade] : null;

  return (
    <div className={cn(
      "rounded-2xl border p-5 space-y-5 transition-all duration-500",
      "border-zinc-800 bg-zinc-900"
    )}>
      {loading && <RatingSkeleton />}
      {error && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">{error}</p>
          <button onClick={fetchRating} className="text-xs font-bold text-zinc-400 hover:text-zinc-200 underline underline-offset-2">
            Try again
          </button>
        </div>
      )}
      {rating && !loading && cfg && (
        <RatingBody rating={rating} ringAnimated={ringAnimated} cfg={cfg} compact={compact} />
      )}
    </div>
  );
}
