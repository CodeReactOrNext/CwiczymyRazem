import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Ear, Eye, EyeOff, HelpCircle, Music, Play, RefreshCw, Volume2 } from "lucide-react";
import { useState } from "react";
import { FaPlay } from "react-icons/fa";

interface EarTrainingViewProps {
  onPlayRiddle: () => void;
  onReveal: () => void;
  onNextRiddle: () => void;
  onGuessed: () => void;
  score: number;
  isRevealed: boolean;
  isPlaying: boolean;
  canGuess: boolean;
  difficulty: "easy" | "medium" | "hard";
  className?: string;
}

export const EarTrainingView = ({
  onPlayRiddle,
  onReveal,
  onNextRiddle,
  onGuessed,
  score,
  isRevealed,
  isPlaying,
  canGuess,
  difficulty,
  className
}: EarTrainingViewProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-6", className)}>
      
      {/* Score Display */}
      <div className="absolute top-4 right-4 bg-zinc-800/80 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mr-2">Score</span>
          <span className="text-xl font-black text-emerald-400">{score}</span>
      </div>

      {/* Visualizer / Mystery Box */}
      <div className="relative w-full aspect-video max-h-[300px] mb-8 group">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br rounded-3xl blur-2xl opacity-20 transition-all duration-1000",
             difficulty === 'easy' && "from-emerald-500 to-cyan-500",
             difficulty === 'medium' && "from-blue-500 to-purple-500",
             difficulty === 'hard' && "from-orange-500 to-red-500",
             isPlaying && "opacity-40 scale-105"
          )} />
          
          <div className="relative h-full w-full bg-zinc-900/90 border border-white/10 rounded-3xl backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden shadow-2xl">
              
              <AnimatePresence mode="wait">
                  {!isRevealed ? (
                      <motion.div 
                        key="mystery"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center gap-6"
                      >
                         <div className={cn(
                             "w-24 h-24 rounded-full flex items-center justify-center border-4 relative",
                             isPlaying ? "border-cyan-400 bg-cyan-400/10 animate-pulse" : "border-zinc-700 bg-zinc-800"
                         )}>
                             {isPlaying ? (
                                 <Volume2 className="w-10 h-10 text-cyan-400" />
                             ) : (
                                 <Ear className="w-10 h-10 text-zinc-500" />
                             )}
                             
                             {/* Ripple effects when playing */}
                             {isPlaying && (
                                <>
                                  <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping" />
                                  <div className="absolute -inset-4 rounded-full border border-cyan-400/20 animate-pulse delay-75" />
                                </>
                             )}
                         </div>

                         <div className="text-center">
                            <h3 className="text-2xl font-bold text-white mb-2">Listen & Repeat</h3>
                            <p className="text-zinc-400 text-sm">
                                {isPlaying ? "Listening..." : "Press Play to hear the melody"}
                            </p>
                         </div>
                      </motion.div>
                  ) : (
                      <motion.div 
                        key="revealed"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4 text-center p-8"
                      >
                          <Music className="w-16 h-16 text-emerald-400 mb-2" />
                          <h3 className="text-2xl font-bold text-white">Revealed!</h3>
                          <p className="text-zinc-400">
                             Check the tablature below. No points for this one.
                          </p>
                      </motion.div>
                  )}
              </AnimatePresence>

          </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 w-full">
          {/* Play/Replay Button */}
          <Button 
            className="flex-1 h-14 text-lg font-bold tracking-wide uppercase"
            variant={isPlaying ? "destructive" : "default"}
            onClick={onPlayRiddle}
          >
             {isPlaying ? (
                 <>Stop</>
             ) : (
                 <><FaPlay className="mr-2 w-4 h-4" /> Play</>
             )}
          </Button>

          {/* Answer Controls */}
          {!isRevealed ? (
            <div className="flex gap-4">
              <Button 
                variant="outline"
                className="h-14 px-8 border-white/10 hover:bg-white/5"
                onClick={onReveal}
              >
                  <Eye className="mr-2 w-5 h-5 text-zinc-400" />
                  Reveal
              </Button>
                <Button 
                    className="h-14 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!canGuess}
                    onClick={onGuessed}
                >
                    <RefreshCw className="mr-2 w-5 h-5" />
                    Guessed! (+1)
                </Button>
            </div>
          ) : (
                <div className="flex gap-4">
                    {/* Only Show Next if Revealed (No Points) */}
                    <Button 
                        variant="secondary" 
                        className="h-14 px-8 bg-zinc-800 hover:bg-zinc-700 text-white w-full"
                        onClick={onNextRiddle}
                    >
                        <RefreshCw className="mr-2 w-5 h-5" />
                        Next Riddle
                    </Button>
                </div>
          )}
      </div>

    </div>
  );
}
