interface ExamModeBannerProps {
  examMode: { requiredBpm: number; nodeId?: string };
}

export function ExamModeBanner({ examMode }: ExamModeBannerProps) {
  const { requiredBpm } = examMode;

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-900/80 to-amber-950/80 backdrop-blur border-b border-amber-700/30 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-200 mb-1">
          🎯 Exam Mode
        </p>
        <h3 className="text-lg font-bold text-amber-50">
          Play at <span className="text-amber-300">{requiredBpm} BPM</span> to Unlock
        </h3>
        <p className="text-xs text-amber-200/70 mt-1">
          Achieve 85% accuracy to pass the exam
        </p>
      </div>
    </div>
  );
}
