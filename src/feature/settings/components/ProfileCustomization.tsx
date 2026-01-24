import { Button } from "assets/components/ui/button";
import {
  Card,
  CardContent,
} from "assets/components/ui/card";
import { ScrollArea } from "assets/components/ui/scroll-area";
import Avatar from "components/UI/Avatar";
import {
  selectCurrentUserStats,
  selectIsFetching,
  selectUserInfo,
} from "feature/user/store/userSlice";
import { updateProfileCustomization } from "feature/user/store/userSlice.asyncThunk";
import { useTranslation } from "hooks/useTranslation";
import { Check, Lock, Loader2, Sparkles, Trophy, Zap } from "lucide-react";
import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { cn } from "assets/lib/utils";

const FRAMES = [
  { lvl: 0, label: "Default", class: "bg-zinc-800 text-zinc-400" },
  { lvl: 3, label: "Silver", class: "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-gray-800 shadow-[0_0_8px_rgba(156,163,175,0.3)]" },
  { lvl: 5, label: "Bronze", class: "bg-gradient-to-br from-[#cd7f32] to-[#8b4513] text-white shadow-[0_0_8px_rgba(205,127,50,0.3)]" },
  { lvl: 7, label: "Jade", class: "bg-gradient-to-br from-green-300 via-green-500 to-green-700 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]" },
  { lvl: 9, label: "Emerald", class: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]" },
  { lvl: 11, label: "Aqua", class: "bg-gradient-to-br from-teal-300 via-teal-500 to-cyan-600 text-white shadow-[0_0_10px_rgba(20,184,166,0.4)]" },
  { lvl: 13, label: "Sapphire", class: "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]" },
  { lvl: 15, label: "Cobalt", class: "bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]" },
  { lvl: 17, label: "Ruby", class: "bg-gradient-to-br from-red-500 via-red-600 to-red-800 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]" },
  { lvl: 19, label: "Crimson", class: "bg-gradient-to-br from-rose-500 via-red-600 to-rose-800 text-white shadow-[0_0_12px_rgba(225,29,72,0.4)]" },
  { lvl: 21, label: "Gold", class: "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-[0_0_12px_rgba(234,179,8,0.4)]" },
  { lvl: 23, label: "Amber", class: "bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]" },
  { lvl: 25, label: "Diamond", class: "bg-gradient-to-br from-cyan-300 via-white to-cyan-500 text-cyan-700 shadow-[0_0_15px_rgba(34,211,238,0.5)]" },
  { lvl: 27, label: "Frost", class: "bg-gradient-to-br from-sky-300 via-blue-200 to-indigo-300 text-blue-900 shadow-[0_0_15px_rgba(125,211,252,0.5)]" },
  { lvl: 30, label: "Amethyst", class: "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-900 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]" },
  { lvl: 33, label: "Twilight", class: "bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]" },
  { lvl: 36, label: "Orchid", class: "bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 text-white shadow-[0_0_15px_rgba(192,132,252,0.5)]" },
  { lvl: 40, label: "Magenta", class: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-400 via-rose-600 to-pink-900 text-white shadow-[0_0_18px_rgba(225,29,72,0.6)]" },
  { lvl: 44, label: "Neon", class: "bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-purple-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.6)] animate-pulse" },
  { lvl: 48, label: "Void", class: "bg-gradient-to-br from-purple-900 via-black to-indigo-950 text-purple-200 shadow-[0_0_18px_rgba(88,28,135,0.6)]" },
  { lvl: 50, label: "Obsidian", class: "bg-gradient-to-b from-zinc-600 via-zinc-950 to-zinc-900 text-white border border-zinc-700/50 shadow-[0_0_15px_rgba(0,0,0,1)]" },
  { lvl: 55, label: "Titanium", class: "bg-gradient-to-br from-slate-500 via-gray-600 to-slate-800 text-white shadow-[0_0_20px_rgba(100,116,139,0.6)]" },
  { lvl: 60, label: "Hologram", class: "bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.6)]" },
  { lvl: 65, label: "Plasma", class: "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-[0_0_22px_rgba(168,85,247,0.7)] animate-pulse" },
  { lvl: 70, label: "Solar", class: "bg-gradient-to-tr from-yellow-300 via-orange-400 to-red-500 text-white shadow-[0_0_25px_rgba(251,146,60,0.7)]" },
  { lvl: 75, label: "Inferno", class: "bg-gradient-to-tr from-orange-600 via-red-500 to-yellow-400 text-white shadow-[0_0_28px_rgba(239,68,68,0.7)] animate-pulse border-orange-400/50" },
  { lvl: 80, label: "Nebula", class: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 text-white shadow-[0_0_30px_rgba(192,132,252,0.8)]" },
  { lvl: 85, label: "Supernova", class: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-yellow-200 to-orange-600 text-orange-900 shadow-[0_0_35px_rgba(251,191,36,0.9)] animate-pulse" },
  { lvl: 90, label: "Galaxy", class: "bg-gradient-to-tr from-indigo-900 via-purple-600 to-pink-500 text-white shadow-[0_0_35px_rgba(99,102,241,0.8)]" },
  { lvl: 95, label: "Celestial", class: "bg-[conic-gradient(from_0deg,#3b82f6,#8b5cf6,#ec4899,#f59e0b,#3b82f6)] text-white shadow-[0_0_40px_rgba(139,92,246,0.9)]" },
  { lvl: 100, label: "Divine", class: "bg-[conic-gradient(from_0deg,#6366f1,#a855f7,#ec4899,#a855f7,#6366f1)] text-white shadow-[0_0_45px_rgba(168,85,247,0.9)] ring-2 ring-purple-500/30" },
];

const GUITAR_COUNT = 28;

const ProfileCustomization = () => {
  const { t } = useTranslation(["settings", "common"]);
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(selectUserInfo);
  const userStats = useAppSelector(selectCurrentUserStats);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";

  const currentLevel = userStats?.lvl || 0;
  const [selectedFrame, setSelectedFrame] = useState<number | undefined>(userInfo?.selectedFrame);
  const [selectedGuitar, setSelectedGuitar] = useState<number | undefined>(userInfo?.selectedGuitar);

  const handleSave = () => {
    dispatch(updateProfileCustomization({ selectedFrame, selectedGuitar }));
  };

  const isChanged = selectedFrame !== userInfo?.selectedFrame || selectedGuitar !== userInfo?.selectedGuitar;

  return (
    <Card className="border-zinc-800/50 bg-zinc-900/20">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Personalization</h3>
              <p className="text-sm text-muted-foreground">Customize your profile frame and guitar icon</p>
            </div>
            <div className="flex items-center gap-3 bg-zinc-900/50 rounded-xl px-4 py-2 border border-zinc-800">
               <Trophy className="h-4 w-4 text-cyan-500" />
               <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Level</p>
                  <p className="text-xl font-black text-foreground leading-none">{currentLevel}</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Preview */}
            <div className="lg:col-span-4">
              <div className="relative overflow-hidden rounded-2xl bg-zinc-950 p-6 border border-zinc-800/50">
                <div className="absolute top-3 right-3">
                   <div className="flex items-center gap-1.5 bg-zinc-900/50 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/5">
                      <div className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">Preview</span>
                   </div>
                </div>
                
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="scale-110">
                    <Avatar
                      avatarURL={userInfo?.avatar}
                      name={userInfo?.displayName || "User"}
                      size="2xl"
                      lvl={selectedFrame !== undefined ? selectedFrame : currentLevel}
                      selectedGuitar={selectedGuitar}
                    />
                  </div>
                  <div className="text-center">
                     <p className="text-base font-bold text-white">@{userInfo?.displayName}</p>
                     <p className="text-xs text-zinc-500 font-medium">Level {currentLevel}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isFetching || !isChanged}
                className="w-full mt-4 h-11 font-bold"
              >
                {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                {isFetching ? "Saving..." : "Save changes"}
              </Button>
            </div>

            {/* Controls */}
            <div className="lg:col-span-8 space-y-6">
              {/* Frames */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                    <Trophy className="h-4 w-4 text-cyan-500" />
                    Prestige Frames
                  </h4>
                  <span className="text-xs font-medium text-zinc-500">
                    {FRAMES.filter(f => currentLevel >= f.lvl).length} / {FRAMES.length}
                  </span>
                </div>
                
                <ScrollArea className="h-[280px] w-full rounded-2xl border border-zinc-800/50 bg-zinc-950/30 p-2">
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 p-2">
                    {FRAMES.map((frame) => {
                      const isUnlocked = currentLevel >= frame.lvl;
                      const isSelected = selectedFrame === frame.lvl || (selectedFrame === undefined && currentLevel >= frame.lvl && currentLevel < (FRAMES[FRAMES.indexOf(frame) + 1]?.lvl || 999));
                      
                      return (
                        <button
                          key={frame.lvl}
                          disabled={!isUnlocked}
                          onClick={() => setSelectedFrame(frame.lvl)}
                          className={cn(
                            "group relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                            isUnlocked 
                              ? "cursor-pointer hover:bg-zinc-900/80" 
                              : "opacity-40 cursor-not-allowed grayscale",
                            isSelected 
                              ? "bg-zinc-900 border border-cyan-500/30" 
                              : "hover:border-zinc-700 bg-transparent border border-transparent"
                          )}
                          title={`Level ${frame.lvl}: ${frame.label}`}
                        >
                          <div className={cn(
                               "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105",
                               frame.class,
                               isSelected && "ring-2 ring-cyan-400 ring-offset-2 ring-offset-zinc-950"
                          )}>
                              {/* No text inside, just visual preview */}
                          </div>
                          
                          <div className="flex flex-col items-center gap-0.5 w-full">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider truncate max-w-full",
                              isSelected ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300"
                            )}>
                              {frame.label}
                            </span>
                            <span className="text-[9px] font-medium text-zinc-600 bg-zinc-900/50 px-1.5 py-0.5 rounded-sm">
                              LVL {frame.lvl}
                            </span>
                          </div>
                          
                          {!isUnlocked && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/60 rounded-xl backdrop-blur-[1px]">
                               <Lock className="w-5 h-5 text-zinc-500" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Guitars */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Guitar Icons
                  </h4>
                  <span className="text-xs font-medium text-zinc-500">
                    {Math.min(currentLevel + 1, GUITAR_COUNT + 1)} / {GUITAR_COUNT + 1}
                  </span>
                </div>

                <ScrollArea className="h-[280px] w-full rounded-2xl border border-zinc-800/50 bg-zinc-950/30 p-2">
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3 p-2">
                    {Array.from({ length: GUITAR_COUNT + 1 }).map((_, i) => {
                      const isUnlocked = currentLevel >= i;
                      const isSelected = selectedGuitar === i || (selectedGuitar === undefined && i === (currentLevel > GUITAR_COUNT ? GUITAR_COUNT : currentLevel));

                      return (
                        <button
                          key={i}
                          disabled={!isUnlocked}
                          onClick={() => setSelectedGuitar(i)}
                          className={cn(
                            "group relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200 outline-none",
                            isUnlocked 
                              ? "cursor-pointer hover:bg-zinc-900/80" 
                              : "opacity-30 cursor-not-allowed grayscale",
                            isSelected 
                              ? "bg-zinc-900 border border-cyan-500/30" 
                              : "hover:border-zinc-700 bg-transparent border border-transparent"
                          )}
                        >
                          <div className={cn(
                            "relative flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-900/50 border border-zinc-800/50 transition-all",
                            isSelected && "border-cyan-500 ring-1 ring-cyan-500/30 bg-zinc-900",
                            isUnlocked && !isSelected && "group-hover:border-zinc-700 group-hover:bg-zinc-800"
                          )}>
                            {i === 0 ? (
                                <div className="flex flex-col items-center opacity-40">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">None</span>
                                </div>
                            ) : (
                                <img
                                 src={`/static/images/rank/${i}.png`}
                                 alt={`Guitar ${i}`}
                                 className={cn(
                                   "w-10 h-10 object-contain -rotate-90 transition-transform duration-300 drop-shadow-md",
                                   isUnlocked && "group-hover:scale-110 group-hover:-rotate-[100deg]"
                                 )}
                               />
                            )}
                          </div>
                          
                          <div className="flex flex-col items-center w-full">
                             <div className={cn(
                               "text-[10px] font-bold text-center px-2 py-0.5 rounded-full transition-colors",
                               isSelected ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-600 bg-zinc-900/30"
                             )}>
                                Rank #{i}
                             </div>
                          </div>

                          {!isUnlocked && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/40 rounded-xl">
                               <Lock className="w-4 h-4 text-zinc-600" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCustomization;
