import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "assets/lib/utils";
import { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { NoteData, getFrequencyFromTab, getNoteFromFrequency } from "utils/audio/noteUtils";

interface TablatureViewerProps {
  measures?: TablatureMeasure[];
  bpm: number;
  isPlaying: boolean;
  startTime: number | null;
  countInRemaining?: number;
  className?: string;
  detectedNote?: NoteData | null;
  isListening?: boolean;
  hitNotes?: Record<string, boolean>;
  currentBeatsElapsed?: number;
}

export const TablatureViewer = ({
  measures,
  bpm,
  isPlaying,
  startTime,
  countInRemaining = 0,
  className,
  detectedNote,
  isListening,
  hitNotes = {},
  currentBeatsElapsed = 0
}: TablatureViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 256 });
  const animationFrameRef = useRef<number | null>(null);

  const BEAT_WIDTH = 140; 
  const STRING_SPACING = 30;
  const NOTE_RADIUS = 11;
  const STAFF_TOP_OFFSET = 60;

  const { totalBeats, processedData, hasAccentedNotes } = useMemo(() => {
    if (!measures) return { totalBeats: 1, processedData: { measureLines: [], rhythmItems: [], noteItems: [] }, hasAccentedNotes: false };

    let currentWidth = 0;
    const measureLines: number[] = [];
    const rhythmItems: any[] = [];
    const noteItems: any[] = [];
    let hasAccents = false;

    measures.forEach((measure) => {
      measure.beats.forEach((beat) => {
        const beatStart = currentWidth;
        
        rhythmItems.push({
          left: beatStart + 10,
          duration: beat.duration,
        });

        beat.notes.forEach((note) => {
          if (note.isAccented) hasAccents = true;
          
          noteItems.push({
            left: beatStart + 10,
            y: STAFF_TOP_OFFSET + (note.string - 1) * STRING_SPACING,
            fret: note.fret,
            isAccented: note.isAccented,
            isHammerOn: note.isHammerOn,
            isPullOff: note.isPullOff
          });
        });

        currentWidth += beat.duration * BEAT_WIDTH;
      });
      measureLines.push(currentWidth);
    });

    return { 
      totalBeats: currentWidth / BEAT_WIDTH, 
      processedData: { measureLines, rhythmItems, noteItems },
      hasAccentedNotes: hasAccents
    };
  }, [measures]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerSize.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerSize.width * dpr;
    canvas.height = containerSize.height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      let cursorPosition = 0;
      let scrollX = 0;
      let totalBeatsElapsed = 0;

      // Dynamic Beat Width calculation
      const dynamicBeatWidth = Math.max(100, Math.min(180, containerSize.width / 4));

      if (isPlaying && startTime) {
        const now = Date.now();
        const elapsedSeconds = (now - startTime) / 1000;
        const beatsPerSecond = bpm / 60;
        const totalDurationInBeats = totalBeats;
        totalBeatsElapsed = elapsedSeconds * beatsPerSecond;
        const loopedBeats = totalBeatsElapsed % totalDurationInBeats;
        
        cursorPosition = loopedBeats * dynamicBeatWidth;
        scrollX = Math.max(0, cursorPosition - containerSize.width / 4);
      }

      ctx.clearRect(0, 0, containerSize.width, containerSize.height);
      
      ctx.save();
      ctx.translate(-scrollX, 0);

      const totalWidth = totalBeats * dynamicBeatWidth;

      // 1. Draw Staff Lines
      ctx.strokeStyle = "#404040"; 
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = STAFF_TOP_OFFSET + i * STRING_SPACING;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(totalWidth, y);
        ctx.stroke();
      }

      // 2. Draw Measure Lines
      ctx.strokeStyle = "#ffffff"; 
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, STAFF_TOP_OFFSET);
      ctx.lineTo(0, STAFF_TOP_OFFSET + 5 * STRING_SPACING);
      ctx.stroke();

      measures?.forEach((_, mIdx) => {
        let measureStartX = 0;
        for(let i=0; i<mIdx; i++) {
          measures[i].beats.forEach(b => { measureStartX += b.duration * dynamicBeatWidth; });
        }
        const mLines = [];
        let currentMWidth = measureStartX;
        measures[mIdx].beats.forEach(b => { currentMWidth += b.duration * dynamicBeatWidth; });
        
        ctx.beginPath();
        ctx.moveTo(currentMWidth, STAFF_TOP_OFFSET);
        ctx.lineTo(currentMWidth, STAFF_TOP_OFFSET + 5 * STRING_SPACING);
        ctx.stroke();
      });

      // 3. Draw Rhythm (Stems & Beams)
      const RHYTHM_Y = 15;
      ctx.strokeStyle = "#ffffff";
      ctx.fillStyle = "#ffffff";
      ctx.lineWidth = 2;

      let currentOffset = 0;
      measures?.forEach((measure, mIdx) => {
        measure.beats.forEach((beat, bIdx) => {
          const beatLeft = currentOffset + 10;
          if (beatLeft >= scrollX - 50 && beatLeft <= scrollX + containerSize.width + 50) {
            ctx.beginPath();
            ctx.moveTo(beatLeft, RHYTHM_Y);
            ctx.lineTo(beatLeft, RHYTHM_Y + 25);
            ctx.stroke();

            if (beat.duration <= 0.25) { 
              ctx.fillRect(beatLeft, RHYTHM_Y, beat.duration * dynamicBeatWidth, 4);
              if (beat.duration === 0.0625 || beat.duration === 0.125) { // 16th and 8th
                 ctx.fillRect(beatLeft, RHYTHM_Y + 8, beat.duration * dynamicBeatWidth, 4);
              }
            } else if (beat.duration === 0.5) {
              ctx.fillRect(beatLeft, RHYTHM_Y, beat.duration * dynamicBeatWidth, 4);
            }
          }

          // 4. Draw Beat Notes and Highlight
          beat.notes.forEach((note, nIdx) => {
            const noteY = STAFF_TOP_OFFSET + (note.string - 1) * STRING_SPACING;
            
            // Check if active (cursor is within this beat's range)
            const isActive = isPlaying && startTime &&
                             cursorPosition >= currentOffset && 
                             cursorPosition < (currentOffset + beat.duration * dynamicBeatWidth);

            const noteKey = `${mIdx}-${bIdx}-${nIdx}`;
            const isHit = hitNotes[noteKey];
            
            if (beatLeft >= scrollX - 50 && beatLeft <= scrollX + containerSize.width + 50) {
              // Note Background
              if (isHit) {
                ctx.fillStyle = "#10b981"; // Emerald for success
              } else if (isActive) {
                // Glow effect for active note
                ctx.shadowBlur = 15;
                ctx.shadowColor = "#06b6d4";
                ctx.fillStyle = "#06b6d4";
              } else if (note.isAccented) {
                ctx.fillStyle = "#22d3ee";
              } else {
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
              }
              
              ctx.beginPath();
              ctx.arc(beatLeft, noteY, NOTE_RADIUS, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0; // Reset shadow

              // Fret Number
              ctx.fillStyle = (isActive || isHit) ? "#ffffff" : "#000000";
              ctx.font = "bold 13px Inter, sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              
              let text = note.fret.toString();
              if (hasAccentedNotes && !note.isAccented && !isActive && !isHit) {
                  text = `(${text})`; 
              }
              ctx.fillText(text, beatLeft, noteY);

              // Symbols (Accent, H, P)
              ctx.font = "bold 10px Inter";
              if (note.isAccented) {
                 ctx.fillText(">", beatLeft, noteY - 18); 
              }
              if (note.isHammerOn) {
                 ctx.fillStyle = isHit ? "#064e3b" : "#fbbf24";
                 ctx.fillText("H", beatLeft, noteY - 20);
              }
              if (note.isPullOff) {
                 ctx.fillStyle = isHit ? "#7f1d1d" : "#f87171";
                 ctx.fillText("P", beatLeft, noteY - 20);
              }
            }
          });

          currentOffset += beat.duration * dynamicBeatWidth;
        });
      });

      // 5. Progress Overlay (Passed Box)
      if (isPlaying && startTime && cursorPosition > 0) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)"; // Semi-transparent black box
        ctx.fillRect(0, 0, cursorPosition, containerSize.height);
      }

      // 6. Draw Cursor & Pulse
      if (isPlaying && startTime) {
        // Cursor Line
        ctx.strokeStyle = "#06b6d4"; 
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cursorPosition, 0);
        ctx.lineTo(cursorPosition, containerSize.height);
        ctx.stroke();

        // Beat Pulse Ripple
        const beatProgress = totalBeatsElapsed % 1;
        if (beatProgress < 0.3) { // Ripple lasts for first 30% of each beat
          const rippleRadius = beatProgress * 100;
          const opacity = 1 - (beatProgress / 0.3);
          ctx.strokeStyle = `rgba(6, 182, 212, ${opacity})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cursorPosition, containerSize.height / 2, rippleRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }


      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, startTime, bpm, totalBeats, containerSize, processedData, hasAccentedNotes, detectedNote, isListening]);

  return (
    <div 
      className={cn("w-full bg-[#0a0a0a] rounded-xl border border-white/10 p-4 relative h-64 select-none overflow-hidden", className)} 
      ref={containerRef}
    >
      <canvas 
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      
      {/* Countdown Overlay */}
      {countInRemaining > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20 animate-in fade-in zoom-in duration-300">
           <div className="flex flex-col items-center">
              <span className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-bounce">
                {countInRemaining}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-white/50 mt-4">
                Get Ready
              </span>
           </div>
        </div>
      )}
    </div>
  );
}; 
