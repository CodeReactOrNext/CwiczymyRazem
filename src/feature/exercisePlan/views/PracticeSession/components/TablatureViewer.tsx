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
  hideNotes?: boolean;
  audioContext?: AudioContext | null;
  audioStartTime?: number | null;
  resetKey?: number;
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
  currentBeatsElapsed = 0,
  hideNotes = false,
  audioContext,
  audioStartTime,
  resetKey
}: TablatureViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 256 });
  const animationFrameRef = useRef<number | null>(null);
  const lastPausedPositionRef = useRef({ cursorPosition: 0, scrollX: 0, totalBeatsElapsed: 0 });
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const initialScrollXRef = useRef(0);

  const handleDragStart = (clientX: number) => {
    if (isPlaying) return;
    isDraggingRef.current = true;
    dragStartXRef.current = clientX;
    initialScrollXRef.current = lastPausedPositionRef.current.scrollX;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - dragStartXRef.current;
    // We subtract dx to make it feel like "pulling" the content
    const newScrollX = Math.max(0, initialScrollXRef.current - dx);
    
    lastPausedPositionRef.current = {
      ...lastPausedPositionRef.current,
      scrollX: newScrollX
    };
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
  };

  const BEAT_WIDTH = 240;
  const STRING_SPACING = 32;
  const NOTE_RADIUS = 11;
  const STAFF_TOP_OFFSET = 85;

  const STRING_COLORS = [
    "#f87171", // 1: E wysoka  – czerwony
    "#fb923c", // 2: B         – pomarańczowy
    "#facc15", // 3: G         – żółty
    "#4ade80", // 4: D         – zielony
    "#60a5fa", // 5: A         – niebieski
    "#c084fc", // 6: E niska   – fioletowy
  ];

  const STRING_DARK_COLORS = [
    "#7f1d1d", // 1: E wysoka  – ciemny czerwony
    "#7c2d12", // 2: B         – ciemny pomarańczowy
    "#713f12", // 3: G         – ciemny żółty
    "#14532d", // 4: D         – ciemny zielony
    "#1e3a5f", // 5: A         – ciemny niebieski
    "#4a1d96", // 6: E niska   – ciemny fioletowy
  ];

  const { totalBeats, processedData, hasAccentedNotes, hasDynamics, rhythmBeats } = useMemo(() => {
    if (!measures) return { totalBeats: 1, processedData: { measureLines: [], rhythmItems: [], noteItems: [] }, hasAccentedNotes: false, hasDynamics: false, rhythmBeats: [] };

    let currentWidth = 0;
    const measureLines: number[] = [];
    const rhythmItems: any[] = [];
    const noteItems: any[] = [];
    const rhythmBeats: { duration: number; beamRight: boolean; beamRight2: boolean }[] = [];
    let hasAccents = false;
    let hasDyn = false;

    measures.forEach((measure) => {
      measure.beats.forEach((beat, i) => {
        const beatStart = currentWidth;
        const next = measure.beats[i + 1];

        rhythmItems.push({
          left: beatStart + 10,
          duration: beat.duration,
        });

        rhythmBeats.push({
          duration: beat.duration,
          beamRight:  beat.duration <= 0.5  && !!next && next.duration <= 0.5,
          beamRight2: beat.duration <= 0.25 && !!next && next.duration <= 0.25,
        });

        beat.notes.forEach((note) => {
          if (note.isAccented) hasAccents = true;
          if (note.dynamics !== undefined) hasDyn = true;

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
      hasAccentedNotes: hasAccents,
      hasDynamics: hasDyn,
      rhythmBeats
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
    lastPausedPositionRef.current = { cursorPosition: 0, scrollX: 0, totalBeatsElapsed: 0 };
  }, [measures, resetKey]);

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

      const dynamicBeatWidth = Math.max(120, Math.min(200, containerSize.width / 4));

      if (isPlaying && startTime && countInRemaining === 0) {
        const elapsedSeconds = (audioContext && audioStartTime != null)
          ? audioContext.currentTime - audioStartTime
          : (Date.now() - startTime) / 1000;
        const beatsPerSecond = bpm / 60;
        const totalDurationInBeats = totalBeats;
        totalBeatsElapsed = elapsedSeconds * beatsPerSecond;
        const loopedBeats = totalBeatsElapsed % totalDurationInBeats;
        
        cursorPosition = loopedBeats * dynamicBeatWidth;
        scrollX = Math.max(0, cursorPosition - containerSize.width / 4);
        
        lastPausedPositionRef.current = { cursorPosition, scrollX, totalBeatsElapsed };
      } else {
        cursorPosition = lastPausedPositionRef.current.cursorPosition;
        scrollX = lastPausedPositionRef.current.scrollX;
        totalBeatsElapsed = lastPausedPositionRef.current.totalBeatsElapsed;
      }

      ctx.clearRect(0, 0, containerSize.width, containerSize.height);
      
      ctx.save();
      ctx.translate(-scrollX, 0);

      const totalWidth = totalBeats * dynamicBeatWidth;

      // 1. Draw Staff Lines (gradient opacity — outer strings brighter)
      if (!hideNotes) {
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const y = STAFF_TOP_OFFSET + i * STRING_SPACING;
          const dist = Math.abs(i - 2.5); // 0=środek, 2.5=skrajne
          const alpha = 0.15 + dist * 0.12; // 0.15 (środek) → 0.45 (skrajne)
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(totalWidth, y);
          ctx.stroke();
        }
      }

      // 2. Draw Measure Lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
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

      // 3. Draw Rhythm Notation (standard tab style)
      const STEM_TOP_Y = 12;
      const RHY_HEAD_Y = STAFF_TOP_OFFSET - 36; // 49px — tuż nad pięciolinią
      const RHY_HEAD_R = 3.5;
      const BEAM_H = 3;
      const BEAM_GAP = 4.5;
      const RHYTHM_COLOR = "rgba(255, 255, 255, 0.4)";

      let currentOffset = 0;
      let beatGlobalIdx = 0;
      measures?.forEach((measure, mIdx) => {
        measure.beats.forEach((beat, bIdx) => {
          const beatLeft = currentOffset + 10;
          const rd = rhythmBeats[beatGlobalIdx];
          const prevRd = beatGlobalIdx > 0 ? rhythmBeats[beatGlobalIdx - 1] : null;
          const nextBeatLeft = beatLeft + beat.duration * dynamicBeatWidth;

          if (rd && beatLeft >= scrollX - 50 && beatLeft <= scrollX + containerSize.width + 50) {
            const dur = rd.duration;
            ctx.strokeStyle = RHYTHM_COLOR;
            ctx.fillStyle = RHYTHM_COLOR;

            if (dur >= 4.0) {
              // Cała nuta: otwarta elipsa, bez laski
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.ellipse(beatLeft, RHY_HEAD_Y, RHY_HEAD_R * 1.5, RHY_HEAD_R, 0, 0, Math.PI * 2);
              ctx.stroke();
            } else {
              // Laska
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(beatLeft, RHY_HEAD_Y - RHY_HEAD_R);
              ctx.lineTo(beatLeft, STEM_TOP_Y);
              ctx.stroke();

              if (dur >= 2.0) {
                // Półnuta: otwarty okrąg
                ctx.beginPath();
                ctx.arc(beatLeft, RHY_HEAD_Y, RHY_HEAD_R, 0, Math.PI * 2);
                ctx.stroke();
              } else {
                // Ćwierćnuta i krótsze: wypełniony okrąg
                ctx.beginPath();
                ctx.arc(beatLeft, RHY_HEAD_Y, RHY_HEAD_R, 0, Math.PI * 2);
                ctx.fill();

                // Ogonki / belki
                const flagCount = dur < 0.25 ? 3 : dur < 0.5 ? 2 : dur < 1.0 ? 1 : 0;
                for (let f = 0; f < flagCount; f++) {
                  const beamY = STEM_TOP_Y + f * (BEAM_H + BEAM_GAP);
                  const drawRight = f === 0 ? rd.beamRight : rd.beamRight2;
                  const leftBeamed = f === 0 ? prevRd?.beamRight : prevRd?.beamRight2;

                  if (drawRight) {
                    // Belka do następnej nuty
                    ctx.fillStyle = RHYTHM_COLOR;
                    ctx.fillRect(beatLeft, beamY, nextBeatLeft - beatLeft, BEAM_H);
                  } else if (!leftBeamed) {
                    // Ogonek (poprzednia nuta nie rysowała belki do tej)
                    ctx.strokeStyle = RHYTHM_COLOR;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(beatLeft, beamY);
                    ctx.bezierCurveTo(
                      beatLeft + 10, beamY + 3,
                      beatLeft + 8,  beamY + 8,
                      beatLeft + 2,  beamY + 12
                    );
                    ctx.stroke();
                  }
                }
              }
            }
          }

          // 4. Draw Beat Notes and Highlight
          beat.notes.forEach((note, nIdx) => {
            const noteY = STAFF_TOP_OFFSET + (note.string - 1) * STRING_SPACING;

            // Dynamics-based scaling
            const dyn = (hasDynamics && note.dynamics !== undefined) ? note.dynamics : 1.0;
            const noteR = hasDynamics ? NOTE_RADIUS * (0.7 + 0.3 * dyn) : NOTE_RADIUS;

            // Check if active (cursor is within this beat's range)
            const isActive = isPlaying && startTime &&
                             cursorPosition >= currentOffset &&
                             cursorPosition < (currentOffset + beat.duration * dynamicBeatWidth);


            const noteKey = `${mIdx}-${bIdx}-${nIdx}`;
            const isHit = hitNotes[noteKey];

            if (beatLeft >= scrollX - 50 && beatLeft <= scrollX + containerSize.width + 50) {
              // Note Background
              const stringColor = STRING_COLORS[note.string - 1] ?? "#ffffff";
              const dynAlpha = (hasDynamics && note.dynamics !== undefined) ? (0.3 + 0.7 * dyn) : 1.0;

              if (isHit) {
                ctx.fillStyle = "#10b981"; // Emerald for success
                ctx.globalAlpha = 1;
              } else if (isActive) {
                // Glow effect for active note
                ctx.shadowBlur = 15;
                ctx.shadowColor = stringColor;
                ctx.fillStyle = stringColor;
                ctx.globalAlpha = 1;
              } else {
                ctx.fillStyle = stringColor;
                const accentDim = hasAccentedNotes && !note.isAccented ? 0.25 : 1.0;
                ctx.globalAlpha = dynAlpha * accentDim;
              }

              if (!hideNotes) {
                ctx.beginPath();
                ctx.arc(beatLeft, noteY, noteR, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0; // Reset shadow
                ctx.globalAlpha = 1; // Reset alpha

                // Fret Number
                ctx.fillStyle = (isActive || isHit) ? "#ffffff" : "#000000";
                const fontSize = hasDynamics ? Math.max(9, Math.round(13 * (0.75 + 0.25 * dyn))) : 13;
                ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                let text = note.fret.toString();
                if (hasAccentedNotes && !note.isAccented && !isActive && !isHit) {
                    text = `(${text})`; 
                }
                ctx.fillText(text, beatLeft, noteY);

                // Symbols (Accent, H, P, Bend, Vibrato, Tap)
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

                // === Bend / Pre-bend / Release badge helper ===
                const drawBendBadge = (label: string, icon: string, bgColor: string, textColor: string, badgeX: number, badgeY: number) => {
                  const fontSize = 16;
                  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                  const fullText = `${icon} ${label}`;
                  const textWidth = ctx.measureText(fullText).width;
                  const padX = 8;
                  const badgeW = textWidth + padX * 2;
                  const badgeH = 24;
                  const r = 6;

                  // Badge background (rounded rect)
                  ctx.fillStyle = bgColor;
                  ctx.beginPath();
                  ctx.moveTo(badgeX - badgeW / 2 + r, badgeY - badgeH / 2);
                  ctx.lineTo(badgeX + badgeW / 2 - r, badgeY - badgeH / 2);
                  ctx.arcTo(badgeX + badgeW / 2, badgeY - badgeH / 2, badgeX + badgeW / 2, badgeY - badgeH / 2 + r, r);
                  ctx.lineTo(badgeX + badgeW / 2, badgeY + badgeH / 2 - r);
                  ctx.arcTo(badgeX + badgeW / 2, badgeY + badgeH / 2, badgeX + badgeW / 2 - r, badgeY + badgeH / 2, r);
                  ctx.lineTo(badgeX - badgeW / 2 + r, badgeY + badgeH / 2);
                  ctx.arcTo(badgeX - badgeW / 2, badgeY + badgeH / 2, badgeX - badgeW / 2, badgeY + badgeH / 2 - r, r);
                  ctx.lineTo(badgeX - badgeW / 2, badgeY - badgeH / 2 + r);
                  ctx.arcTo(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeX - badgeW / 2 + r, badgeY - badgeH / 2, r);
                  ctx.closePath();
                  ctx.fill();

                  // Badge border
                  ctx.strokeStyle = textColor;
                  ctx.lineWidth = 2;
                  ctx.stroke();

                  // Badge text
                  ctx.fillStyle = "#ffffff";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText(fullText, badgeX, badgeY + 1);

                  // Connector line from badge to note (with arrowhead)
                  const lineStartY = badgeY + badgeH / 2;
                  const lineEndY = noteY - NOTE_RADIUS - 1;
                  if (lineEndY > lineStartY + 2) {
                    ctx.strokeStyle = textColor;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 3]);
                    ctx.beginPath();
                    ctx.moveTo(badgeX, lineStartY);
                    ctx.lineTo(badgeX, lineEndY);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Small arrowhead at note end
                    ctx.fillStyle = textColor;
                    ctx.beginPath();
                    ctx.moveTo(badgeX, lineEndY);
                    ctx.lineTo(badgeX - 3, lineEndY - 6);
                    ctx.lineTo(badgeX + 3, lineEndY - 6);
                    ctx.closePath();
                    ctx.fill();
                  }
                };

                // Badge Y: above the topmost note in this beat so it never overlaps any note
                const topStringInBeat = Math.min(...beat.notes.map(n => n.string));
                const topNoteYInBeat = STAFF_TOP_OFFSET + (topStringInBeat - 1) * STRING_SPACING;
                const bendBadgeY = topNoteYInBeat - NOTE_RADIUS - 24;

                // Bend indicator
                if (note.isBend) {
                  const bendLabel = note.bendSemitones
                    ? (note.bendSemitones === 2 ? "full" : note.bendSemitones === 1 ? "½" : `${note.bendSemitones / 2}`)
                    : "";
                  drawBendBadge(
                    bendLabel,
                    "\u2191",  // ↑ arrow
                    isHit ? "#064e3b" : "#7e22ce",
                    isHit ? "#34d399" : "#f0abfc",
                    beatLeft, bendBadgeY
                  );
                }

                // Pre-bend indicator
                if (note.isPreBend) {
                  drawBendBadge(
                    "PB",
                    "\u2191",  // ↑ arrow
                    isHit ? "#064e3b" : "#4c1d95",
                    isHit ? "#34d399" : "#ddd6fe",
                    beatLeft, bendBadgeY
                  );
                }

                // Release indicator
                if (note.isRelease) {
                  drawBendBadge(
                    "R",
                    "\u2193",  // ↓ arrow
                    isHit ? "#064e3b" : "#312e81",
                    isHit ? "#34d399" : "#c7d2fe",
                    beatLeft, bendBadgeY
                  );
                }

                // Vibrato indicator (wavy line under the note)
                if (note.isVibrato) {
                  const vibratoColor = isHit ? "#064e3b" : "#a78bfa";
                  ctx.strokeStyle = vibratoColor;
                  ctx.lineWidth = 1.5;
                  ctx.beginPath();
                  const waveY = noteY + NOTE_RADIUS + 6;
                  const waveWidth = 16;
                  const waveAmplitude = 3;
                  for (let w = -waveWidth / 2; w <= waveWidth / 2; w += 1) {
                    const wy = waveY + Math.sin((w / waveWidth) * Math.PI * 4) * waveAmplitude;
                    if (w === -waveWidth / 2) {
                      ctx.moveTo(beatLeft + w, wy);
                    } else {
                      ctx.lineTo(beatLeft + w, wy);
                    }
                  }
                  ctx.stroke();
                }

                // Tap indicator
                if (note.isTap) {
                  ctx.fillStyle = isHit ? "#064e3b" : "#34d399"; // emerald-400
                  ctx.font = "bold 10px Inter";
                  ctx.textAlign = "center";
                  ctx.fillText("T", beatLeft, noteY - 20);
                }
              }
            }
          });

          // Draw Chord Name
          if (beat.chordName) {
            // Shadow/Glow for readability
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(34, 211, 238, 0.4)";
            
            ctx.fillStyle = "#22d3ee"; // Cyan-400
            ctx.font = "black 22px Inter, system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(beat.chordName, beatLeft, STAFF_TOP_OFFSET - 58);
            
            ctx.shadowBlur = 0; // Reset
          }

          beatGlobalIdx++;
          currentOffset += beat.duration * dynamicBeatWidth;
        });
      });

      // 4.5: Dynamics Lane — volume bars below the staff
      if (hasDynamics) {
        const DYNAMICS_BASELINE = STAFF_TOP_OFFSET + 5 * STRING_SPACING + 36;
        const DYNAMICS_MAX_H = 24;
        const BAR_W = 6;

        // Faint baseline
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, DYNAMICS_BASELINE);
        ctx.lineTo(totalWidth, DYNAMICS_BASELINE);
        ctx.stroke();

        let dynOffset = 0;
        measures?.forEach((measure) => {
          measure.beats.forEach((beat) => {
            const x = dynOffset + 10;
            if (x >= scrollX - 50 && x <= scrollX + containerSize.width + 50) {
              beat.notes.forEach((note) => {
                if (note.dynamics !== undefined && note.dynamics > 0) {
                  const barH = Math.max(2, note.dynamics * DYNAMICS_MAX_H);
                  const alpha = 0.2 + note.dynamics * 0.8;

                  if (note.dynamics > 0.7) {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = `rgba(6, 182, 212, ${note.dynamics * 0.4})`;
                  }

                  ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
                  ctx.fillRect(x - BAR_W / 2, DYNAMICS_BASELINE - barH, BAR_W, barH);
                  ctx.shadowBlur = 0;
                }
              });
            }
            dynOffset += beat.duration * dynamicBeatWidth;
          });
        });
      }

      // 5. Progress Overlay (gradient fade — starsze nuty ciemniejsze)
      if (cursorPosition > 0) {
        const overlayGrad = ctx.createLinearGradient(scrollX, 0, cursorPosition, 0);
        overlayGrad.addColorStop(0, "rgba(0, 0, 0, 0.7)");
        overlayGrad.addColorStop(1, "rgba(0, 0, 0, 0.15)");
        ctx.fillStyle = overlayGrad;
        ctx.fillRect(0, 0, cursorPosition, containerSize.height);
      }

      // 6. Draw Cursor & Pulse
      if (cursorPosition > 0 || isPlaying) {
        // Cursor Line
        ctx.strokeStyle = isPlaying ? "#06b6d4" : "#ef4444"; 
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cursorPosition, 0);
        ctx.lineTo(cursorPosition, containerSize.height);
        ctx.stroke();

        // Beat Pulse Ripple (only when playing)
        if (isPlaying) {
          const beatProgress = totalBeatsElapsed % 1;
          if (beatProgress < 0.3) {
            const rippleRadius = beatProgress * 100;
            const opacity = 1 - (beatProgress / 0.3);
            ctx.strokeStyle = `rgba(6, 182, 212, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cursorPosition, containerSize.height / 2, rippleRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
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
  }, [isPlaying, startTime, bpm, totalBeats, containerSize, processedData, hasAccentedNotes, hasDynamics, rhythmBeats, detectedNote, isListening, hideNotes, audioContext, audioStartTime, countInRemaining, resetKey]);

  return (
    <div 
      className={cn(
        "w-full bg-[#0a0a0a] rounded-xl  p-4 relative h-[300px] select-none overflow-hidden",
        !isPlaying && "cursor-grab active:cursor-grabbing",
        className
      )} 
      ref={containerRef}
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
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
