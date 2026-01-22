import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { SpotifyPlayer } from "feature/songs/components/SpotifyPlayer";
import type { Song } from "feature/songs/types/songs.type";
import type { useTimerInterface } from "hooks/useTimer";
import { useTranslation } from "hooks/useTranslation";
import { ArrowLeft, ArrowRight, Music, Pause, Play } from "lucide-react";

interface SongTimerLayoutProps {
  timer: useTimerInterface;
  song: Song;
  timerSubmitHandler: () => void;
  onBack: () => void;
}

export const SongTimerLayout = ({
  timer,
  song,
  timerSubmitHandler,
  onBack,
}: SongTimerLayoutProps) => {
  const { t } = useTranslation("timer");
  const { time, timerEnabled, startTimer, stopTimer } = timer;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        const remMinutes = minutes % 60;
        return `${hours}:${remMinutes < 10 ? "0" : ""}${remMinutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const toggleTimer = () => {
      if (timerEnabled) {
          stopTimer();
      } else {
          startTimer();
      }
  };

  return (
    <MainContainer>
      <div className='font-openSans h-full space-y-6 pb-8 sm:space-y-8 sm:pb-12 md:p-8'>
        <div className="pl-14 sm:pl-0">
             <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-white/10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">{t("practice_session")}</h1>
             </div>
        </div>
        
        <div className="relative w-full max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full opacity-50 pointer-events-none" />

            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 sm:p-12 rounded-3xl overflow-hidden shadow-2xl">
                
                <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative group">
                        <div className={cn(
                            "absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full blur-xl transition-all duration-1000",
                            timerEnabled ? "opacity-100 scale-110" : "opacity-0 scale-100"
                        )} />
                        
                        <div className={cn(
                            "relative h-64 w-64 sm:h-80 sm:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-transform duration-700 ease-in-out",
                             timerEnabled && "scale-105"
                        )}>
                            {song.coverUrl ? (
                                <img src={song.coverUrl} className="h-full w-full object-cover" alt={song.title} />
                            ) : (
                                <div className="h-full w-full bg-zinc-800 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                    <Music className="h-32 w-32 text-zinc-700" />
                                </div>
                            )}
                            
                            {!timerEnabled && time > 0 && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                                    <Pause className="h-16 w-16 text-white/80" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-start space-y-8 text-center md:text-left w-full">
                    <div className="space-y-2 w-full">
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight line-clamp-2">
                            {song.title}
                        </h2>
                        <p className="text-xl text-zinc-400 font-medium">{song.artist}</p>
                    </div>

                    <div className="flex flex-col items-center md:items-start space-y-4 w-full">
                         <div className={cn(
                             "text-[6rem] sm:text-[7rem] leading-none font-black font-variant-numeric tabular-nums tracking-tighter transition-colors duration-300",
                             timerEnabled ? "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "text-zinc-600"
                         )}>
                            {formatTime(time)}
                         </div>
                    </div>

                    <div className="flex items-center gap-6 w-full pt-4">
                        <Button
                            onClick={toggleTimer}
                            size="lg"
                            className={cn(
                                "h-20 w-20 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center border-4",
                                timerEnabled 
                                    ? "bg-zinc-900 text-white border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800" 
                                    : "bg-white text-black border-white hover:bg-zinc-100"
                            )}
                        >
                            {timerEnabled ? (
                                <Pause className="h-8 w-8 fill-current" />
                            ) : (
                                <Play className="h-8 w-8 fill-current ml-1" />
                            )}
                        </Button>

                        <div className="flex-1 border-t border-white/5 mx-4" />

                        <Button
                            onClick={timerSubmitHandler}
                            variant="ghost"
                            className="h-14 px-8 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-sm transition-all"
                        >
                            {t("finish")}
                        </Button>
                    </div>
                </div>
            </div>
        
            {song.spotifyId && (
                <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-8 bg-emerald-500 rounded-full" />
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">{t("spotify.playback")}</h3>
                        </div>
                        <a 
                            href={`https://open.spotify.com/track/${song.spotifyId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                        >
                            {t("spotify.open_in_app")} <ArrowRight className="h-3 w-3" />
                        </a>
                    </div>
                    
                    <SpotifyPlayer trackId={song.spotifyId} height={152} className="shadow-2xl hover:border-emerald-500/30 transition-colors duration-500" />
                    
                    <div className="mt-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4 group hover:bg-emerald-500/10 transition-all duration-300">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <Music className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-emerald-400 mb-0.5">{t("spotify.important_login")}</p>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                To listen to full tracks (not just 30s previews), make sure you are logged into <a href="https://www.spotify.com" target="_blank" className="text-emerald-500 underline decoration-emerald-500/30 hover:decoration-emerald-500">Spotify.com</a> with an active Premium account.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </MainContainer>
  );
};
