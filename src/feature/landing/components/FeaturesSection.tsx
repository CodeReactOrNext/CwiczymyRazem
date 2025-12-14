"use client";

import { Brain, Timer, Clock, Zap, BarChart3, TrendingUp, Music2, BookOpen } from "lucide-react";
import { SongCard } from "feature/songs/components/SongsGrid/SongCard";
import { AchievementCard } from "feature/achievements/components/AchievementCard";
import { MiniTrendChart } from "feature/profile/components/MiniTrendChart";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export const FeaturesSection = () => {
  const skillCategories = [
    { name: 'Technique', time: '12:30', percent: '50%', color: 'border-red-500/50 text-red-400', dot: 'bg-red-500', active: true },
    { name: 'Theory', time: '45:00', percent: '49%', color: 'border-blue-500/50 text-blue-400', dot: 'bg-blue-500' },
    { name: 'Hearing', time: '20:15', percent: '0%', color: 'border-teal-500/50 text-teal-400', dot: 'bg-teal-500' },
    { name: 'Creative work', time: '10:00', percent: '0%', color: 'border-purple-500/50 text-purple-400', dot: 'bg-purple-500' },
  ];

  const stats = [
    { label: 'Total time', value: '2693:18', icon: Clock, trend: '+100%', color: 'text-cyan-400' },
    { label: 'Points', value: '2934', icon: Zap, trend: '+100%', color: 'text-amber-400' },
  ];

  const skills = [
    { name: 'Technique', percent: 4, time: '107h 44m', color: 'bg-red-500' },
    { name: 'Theory', percent: 4, time: '107h 44m', color: 'bg-blue-500' },
    { name: 'Creativity', percent: 2, time: '53h 52m', color: 'bg-purple-500' },
    { name: 'Hearing', percent: 90, time: '2423h 58m', color: 'bg-teal-500' },
  ];

  const MOCK_SONGS = [
    {
      id: "1",
      title: "Master of Puppets",
      artist: "Metallica",
      difficulties: Array(124).fill({ rating: 10 }),
      status: "learning"
    },
    {
      id: "2",
      title: "Time",
      artist: "Pink Floyd",
      difficulties: Array(45).fill({ rating: 4 }),
      status: "wantToLearn"
    },
    {
      id: "7",
      title: "Tornado of Souls",
      artist: "Megadeth",
      difficulties: Array(89).fill({ rating: 9 }),
      status: "learned"
    },
    {
      id: "3",
      title: "Stairway to Heaven",
      artist: "Led Zeppelin",
      difficulties: Array(230).fill({ rating: 7 }),
      status: "learned"
    },
    {
      id: "8",
      title: "Nothing Else Matters",
      artist: "Metallica",
      difficulties: Array(15).fill({ rating: 2 }),
      status: "learning"
    },
    {
      id: "4",
      title: "Sweet Child O' Mine",
      artist: "Guns N' Roses",
      difficulties: Array(67).fill({ rating: 7 }),
      status: "learning"
    },
    {
      id: "9",
      title: "Eruption",
      artist: "Van Halen",
      difficulties: Array(12).fill({ rating: 10 }),
      status: "wantToLearn"
    },
    {
      id: "5",
      title: "Comfortably Numb",
      artist: "Pink Floyd",
      difficulties: Array(56).fill({ rating: 8 }),
      status: "wantToLearn"
    },
    {
      id: "6",
      title: "Paranoid",
      artist: "Black Sabbath",
      difficulties: Array(34).fill({ rating: 4 }),
      status: "learned"
    }
  ];

  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % MOCK_SONGS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const visibleSongs = [];
  for (let i = 0; i < 3; i++) {
    visibleSongs.push(MOCK_SONGS[(startIndex + i) % MOCK_SONGS.length]);
  }

  return (
    <section id='features' className='relative py-24 sm:py-32 bg-[#0d0d0c] overflow-hidden'>
      {/* Global Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mx-auto max-w-2xl text-center mb-20'>
          <h2 className='text-base font-semibold leading-7 text-cyan-500 tracking-wider uppercase'>Features</h2>
          <p className='mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl'>
            Everything you need to master guitar
          </p>
          <p className='mt-6 text-lg leading-8 text-zinc-400'>
            A complete ecosystem designed to make your practice structured and effective.
          </p>
        </div>

        <div className="space-y-32">
          {/* GROUP 1: PRACTICE TOOLS */}
          <div>
            <div className="text-center mb-12">
               <h3 className="text-2xl font-bold text-white mb-2">Smart Practice Tools</h3>
               <p className="text-zinc-400">Track every second of your progress with our intelligent timer system.</p>
            </div>
            
            <div className='overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-950 p-8'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
                {/* Timer Circle */}
                <div className='flex flex-col items-center justify-center'>
                  <div className='relative w-64 h-64'>
                    <div className='absolute inset-0 rounded-full bg-cyan-500/10 blur-xl'></div>
                    <div className='absolute inset-4 rounded-full border-4 border-cyan-500/30 bg-zinc-950 flex items-center justify-center'>
                      <div className='text-center'>
                        <div className='text-6xl font-mono font-bold text-white tracking-tight'>12:30</div>
                        <div className='text-sm text-cyan-500 mt-2 font-medium uppercase tracking-widest'>Technique</div>
                      </div>
                    </div>
                    <svg className='absolute inset-0 -rotate-90 w-full h-full' viewBox='0 0 100 100'>
                      <circle cx='50' cy='50' r='46' fill='none' stroke='#06b6d4' strokeWidth='2' strokeDasharray='289' strokeDashoffset='72' strokeLinecap='round' opacity='0.8' />
                    </svg>
                  </div>
                </div>

                {/* Categories */}
                <div className='grid grid-cols-2 gap-4'>
                  {skillCategories.map((cat, i) => (
                    <div 
                      key={i} 
                      className={`relative rounded-xl border-2 ${cat.active ? 'border-cyan-500/40 bg-cyan-900/10' : 'border-zinc-800 bg-zinc-900/30'} p-5 transition-all outline-none`}
                    >
                      <div className='flex items-center gap-3 mb-3'>
                        <div className={`w-3 h-3 rounded-full ${cat.dot}`}></div>
                        <span className='font-medium text-zinc-200'>{cat.name}</span>
                      </div>
                      <div className='text-2xl font-mono font-bold text-white'>{cat.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* GROUP 2: TRACKING & ANALYTICS */}
          <div className="relative">
             {/* Background glow for analytics */}
             <div className="absolute -top-24 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none opacity-50"></div>
             
            <div className="text-center mb-12 relative z-10">
               <h3 className="text-2xl font-bold text-white mb-2">Detailed Analytics</h3>
               <p className="text-zinc-400">Visualize your consistency and breakdown your improvements.</p>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10'>
              {/* Heatmap Card */}
              <div className='lg:col-span-2 rounded-2xl border border-white/5 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl p-8 hover:border-cyan-500/20 transition-colors duration-500 group'>
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                     <Clock className="w-5 h-5"/>
                   </div>
                   <h4 className="font-semibold text-white group-hover:text-cyan-100 transition-colors">Activity History</h4>
                </div>
                <div className='w-full mb-8 overflow-hidden'>
                   <div className="flex gap-2">
                      {/* Day Labels */}
                      <div className="flex flex-col justify-between py-[2px] pr-2 text-xs text-zinc-600 font-medium">
                         <span>Mon</span>
                         <span>Wed</span>
                         <span>Fri</span>
                      </div>
                      
                      {/* The Grid */}
                      <div className="flex-1 flex gap-[3px] overflow-hidden mask-linear-fade">
                         {Array.from({ length: 30 }).map((_, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[3px]">
                               {Array.from({ length: 7 }).map((_, dayIndex) => {
                                  // Mock randomized activity
                                  const intensity = Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0;
                                  const colors = [
                                     'bg-zinc-800/50', // 0: empty
                                     'bg-cyan-900/40', // 1: light
                                     'bg-cyan-700/60', // 2: medium
                                     'bg-cyan-500',    // 3: high
                                  ];
                                  
                                  // Create a nice pattern manually for demo purposes instead of pure random if needed, 
                                  // but random weighted is usually fine for "looks like git chart".
                                  // Let's force some specific nice pattern later if needed, mostly random is fine.
                                  return (
                                     <div 
                                        key={dayIndex} 
                                        className={`w-3 h-3 rounded-sm ${colors[intensity]} transition-colors duration-300 hover:opacity-80`}
                                     ></div>
                                  );
                               })}
                            </div>
                         ))}
                      </div>
                   </div>
                   <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500 justify-end">
                      <span>Less</span>
                      <div className="flex gap-1">
                         <div className="w-3 h-3 rounded-sm bg-zinc-800/50"></div>
                         <div className="w-3 h-3 rounded-sm bg-cyan-900/40"></div>
                         <div className="w-3 h-3 rounded-sm bg-cyan-700/60"></div>
                         <div className="w-3 h-3 rounded-sm bg-cyan-500"></div>
                      </div>
                      <span>More</span>
                   </div>
                </div>

                {/* Additional Stats / Focus Areas */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                   {skills.slice(0, 4).map((skill, i) => (
                      <div key={i} className="bg-zinc-900/40 rounded-lg p-3">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{skill.name}</span>
                            <span className="text-xs text-white">{skill.percent}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full ${skill.color} opacity-80`} style={{ width: `${skill.percent * 10}%` }}></div>
                         </div>
                      </div>
                   ))}
                </div>
              </div>

              {/* Stats Card */}
              <div className='rounded-2xl border border-white/5 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl p-8 flex flex-col justify-between hover:border-amber-500/20 transition-colors duration-500 gap-6'>
                 
                 {/* Stat 1 */}
                 <div className="bg-zinc-900/40 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1 font-medium uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      Avg Session
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tight">60:23</div>
                    <div className="text-xs text-zinc-500 mt-1">Typical practice duration</div>
                 </div>

                 {/* Stat 2 */}
                 <div className="bg-zinc-900/40 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1 font-medium uppercase tracking-wider">
                      <Brain className="w-3 h-3" />
                      Strongest Area
                    </div>
                    <div className="text-2xl font-bold text-teal-400 tracking-tight">Hearing</div>
                    <div className="text-xs text-zinc-500 mt-1">Most improved skill this week</div>
                 </div>
                 
                 {/* Stat 3 */}
                 <div className="bg-zinc-900/40 rounded-xl p-4 border border-white/5">
                     <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1 font-medium uppercase tracking-wider">
                      <Zap className="w-3 h-3" />
                      Points / Hour
                    </div>
                    <div className="text-2xl font-bold text-amber-400 tracking-tight">197</div>
                    <div className="text-xs text-zinc-500 mt-1">Efficiency score</div>
                 </div>

                 {/* Stat 4 */}
                 <div className="bg-zinc-900/40 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1 font-medium uppercase tracking-wider">
                      <TrendingUp className="w-3 h-3" />
                      Current Streak
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                       12 <span className="text-sm text-zinc-600 font-normal">days</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* GROUP 3: SONGS & PROGRESSION */}
          <div className="relative">
             {/* Background glow for songs */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-gradient-to-b from-purple-500/5 to-amber-500/5 blur-3xl rounded-[100px] pointer-events-none -z-10 opacity-60"></div>

            <div className="text-center mb-16 relative z-10">
               <h3 className="text-2xl font-bold text-white mb-2">Songs & Achievements</h3>
               <p className="text-zinc-400">Master your favorite tracks and add them to your library.</p>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10'>
               {/* Songs Column */}
               <div className='space-y-8'>
                  <div className="flex items-center gap-3 mb-2 px-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                      <Music2 className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-xl text-white">Song Library</h4>
                  </div>
                  
                  <div className="h-[750px] overflow-hidden relative flex flex-col gap-4 p-4 [mask-image:linear-gradient(to_bottom,black_80%,transparent)]">
                     <AnimatePresence mode='popLayout'>
                        {visibleSongs.map((song) => (
                           <motion.div
                              key={song.id}
                              layout
                              initial={{ opacity: 0, x: -50, scale: 0.9 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: 50, scale: 0.9 }}
                              transition={{ duration: 0.6, ease: "easeInOut" }}
                              className="transform"
                           >
                              <SongCard 
                                 song={{
                                    id: song.id,
                                    title: song.title,
                                    artist: song.artist,
                                    difficulties: song.difficulties,
                                    createdAt: {} as any,
                                    createdBy: "1"
                                 }}
                                 status={song.status as any}
                                 readonly={true}
                                 onStatusChange={() => {}}
                                 onRatingChange={() => {}}
                              />
                           </motion.div>
                        ))}
                     </AnimatePresence>
                  </div>
               </div>

               {/* Achievements Column */}
               <div className='space-y-8'>
                  <div className="flex items-center gap-3 mb-2 px-2">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                       <TrendingUp className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-xl text-white">Recent Achievements</h4>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-5 gap-y-10 p-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm mb-12 justify-items-center">
                     {/* REAL ACHIEVEMENT COMPONENTS */}
                     <div className="w-[50px] h-[50px] transition-transform hover:scale-110 duration-200"><AchievementCard id="lvl100" /></div>
                     <div className="w-[50px] h-[50px] transition-transform hover:scale-110 duration-200"><AchievementCard id="fireSession" /></div>
                     <div className="w-[50px] h-[50px] transition-transform hover:scale-110 duration-200"><AchievementCard id="time_3" /></div>
                     <div className="w-[50px] h-[50px] transition-transform hover:scale-110 duration-200"><AchievementCard id="points_3" /></div>
                     <div className="w-[50px] h-[50px] transition-transform hover:scale-110 duration-200"><AchievementCard id="diamond" /></div>
                     <div className="w-[50px] h-[50px] transition-transform hover:scale-110 duration-200"><AchievementCard id="scientist" /></div>
                     <div className="w-[50px] h-[50px] transition-transform hover:scale-110 duration-200"><AchievementCard id="wizard" /></div>
                     <div className="w-[50px] h-[50px] transition-transform hover:scale-110 duration-200"><AchievementCard id="medal" /></div>
                  </div>
               </div>
            </div>
          </div>

          {/* GROUP 4: PROGRESSION FLOW */}
          <div className="relative pb-20">
             <div className="text-center mb-16">
               <h3 className="text-2xl font-bold text-white mb-2">Your Path to Mastery</h3>
               <p className="text-zinc-400">A gamified experience that keeps you motivated every single day.</p>
            </div>

            <div className='relative'>
                 {/* Connection Line (Desktop) with Animated Beam */}
                 <div className="hidden lg:block absolute top-[2.5rem] left-0 w-full h-0.5 bg-zinc-800/50 overflow-hidden rounded-full">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent w-[50%] animate-beam"></div>
                 </div>
                 {/* Inject animation styles locally since we can't touch tailwind config easily */}
                 <style dangerouslySetInnerHTML={{__html: `
                    @keyframes beam {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(200%); }
                    }
                    .animate-beam {
                      animation: beam 3s infinite linear;
                    }
                 `}} />

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                    {/* Step 1: Practice */}
                    <div className="relative group">
                       <div className="w-20 h-20 mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cyan-900/20 group-hover:border-cyan-500/30 transition-all duration-300">
                           <BookOpen className="w-8 h-8 text-cyan-400" />
                       </div>
                       <h4 className="text-lg font-bold text-white mb-2">1. Practice</h4>
                       <p className="text-sm text-zinc-400 px-4">Creating your own <span className="text-cyan-400">Custom Plans</span> or choosing from our library of exercises.</p>
                    </div>

                    {/* Step 2: Points */}
                    <div className="relative group">
                       <div className="w-20 h-20 mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-900/20 group-hover:border-amber-500/30 transition-all duration-300">
                           <Zap className="w-8 h-8 text-amber-400" />
                       </div>
                       <h4 className="text-lg font-bold text-white mb-2">2. Earn Points</h4>
                       <p className="text-sm text-zinc-400 px-4">Every minute of practice rewards you with XP, tracking your dedication.</p>
                    </div>

                    {/* Step 3: Level Up */}
                    <div className="relative group">
                       <div className="w-20 h-20 mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-900/20 group-hover:border-purple-500/30 transition-all duration-300">
                           <TrendingUp className="w-8 h-8 text-purple-400" />
                       </div>
                       <h4 className="text-lg font-bold text-white mb-2">3. Level Up</h4>
                       <p className="text-sm text-zinc-400 px-4">Unlock new ranks and watch your profile grow as you improve.</p>
                    </div>

                    {/* Step 4: Compete */}
                     <div className="relative group">
                       <div className="w-20 h-20 mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-900/20 group-hover:border-emerald-500/30 transition-all duration-300">
                           <div className="relative">
                             <BarChart3 className="w-8 h-8 text-emerald-400" />
                             <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                           </div>
                       </div>
                       <h4 className="text-lg font-bold text-white mb-2">4. Compete</h4>
                       <p className="text-sm text-zinc-400 px-4">Join <span className="text-emerald-400">Seasonal Leaderboards</span> and compare your progress with others.</p>
                    </div>
                 </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
