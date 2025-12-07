"use client";

import { Brain, Timer, Clock, Zap, BarChart3, TrendingUp, Music2, BookOpen } from "lucide-react";

export const FeaturesSection = () => {
  const skillCategories = [
    { name: 'Technique', time: '00:00', percent: '50%', color: 'border-red-500/50 text-red-400', dot: 'bg-red-500' },
    { name: 'Theory', time: '00:00', percent: '49%', color: 'border-blue-500/50 text-blue-400', dot: 'bg-blue-500', active: true },
    { name: 'Hearing', time: '00:00', percent: '0%', color: 'border-teal-500/50 text-teal-400', dot: 'bg-teal-500' },
    { name: 'Creative work', time: '00:00', percent: '0%', color: 'border-purple-500/50 text-purple-400', dot: 'bg-purple-500' },
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

  return (
    <section id='features' className='relative py-24 sm:py-32 bg-[#0d0d0c]'>
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

        {/* Feature 1 - Smart Timer (matching actual app UI) */}
        <div className='mb-16 overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-950'>
          <div className='p-6 border-b border-zinc-800/50'>
            <div className='flex items-center gap-2'>
              <Timer className="w-5 h-5 text-cyan-500" />
              <span className='text-lg font-semibold text-cyan-500'>Ćwicz</span>
            </div>
          </div>
          
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 p-8'>
            {/* Timer Circle - matching screenshot */}
            <div className='flex flex-col items-center justify-center'>
              <div className='relative w-56 h-56'>
                {/* Outer glow rings */}
                <div className='absolute inset-0 rounded-full bg-cyan-500/10 blur-xl'></div>
                <div className='absolute inset-2 rounded-full bg-cyan-500/5 blur-lg'></div>
                
                {/* Main circle */}
                <div className='absolute inset-4 rounded-full border-4 border-cyan-500/30 bg-zinc-950 flex items-center justify-center'>
                  <div className='text-center'>
                    <div className='text-5xl font-mono font-bold text-white tracking-tight'>0:03</div>
                  </div>
                </div>
                
                {/* Animated ring */}
                <svg className='absolute inset-0 -rotate-90 w-full h-full' viewBox='0 0 100 100'>
                  <circle cx='50' cy='50' r='46' fill='none' stroke='#06b6d4' strokeWidth='2' strokeDasharray='289' strokeDashoffset='72' strokeLinecap='round' opacity='0.8' />
                  <circle cx='50' cy='50' r='42' fill='none' stroke='#06b6d4' strokeWidth='1' strokeDasharray='264' strokeDashoffset='132' strokeLinecap='round' opacity='0.4' />
                </svg>
              </div>

              {/* Status info */}
              <div className='mt-6 text-center bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 w-full max-w-xs'>
                <div className='text-xs text-zinc-500 mb-1'>You are currently exercising:</div>
                <div className='text-lg font-semibold text-white'>Theory</div>
                <div className='mt-3 pt-3 border-t border-zinc-800'>
                  <div className='text-xs text-zinc-500'>Total time:</div>
                  <div className='flex items-center justify-center gap-1 text-white'>
                    <Clock className='w-4 h-4' />
                    <span className='font-mono'>00:06</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Categories - matching screenshot layout */}
            <div className='grid grid-cols-2 gap-4'>
              {skillCategories.map((cat, i) => (
                <div 
                  key={i} 
                  className={`relative rounded-xl border-2 ${cat.active ? 'border-blue-500/50 bg-zinc-900/80' : 'border-zinc-800 bg-zinc-900/30'} p-4 transition-all hover:border-zinc-700`}
                >
                  {cat.active && <div className='absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500'></div>}
                  <div className='flex items-center gap-2 mb-3'>
                    <div className={`w-2.5 h-2.5 rounded-full ${cat.dot}`}></div>
                    <span className='text-sm text-zinc-300'>{cat.name}</span>
                  </div>
                  <div className='flex items-end justify-between'>
                    <div className='text-3xl font-mono font-bold text-white'>{cat.time}</div>
                    <div className='text-sm text-zinc-500'>{cat.percent}</div>
                  </div>
                  <button className={`w-full mt-4 py-2 rounded-lg border ${cat.active ? 'border-zinc-600 text-zinc-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'} text-sm flex items-center justify-center gap-2 transition-colors`}>
                    {cat.active ? (
                      <><span className='w-2 h-2 border-l-2 border-r-2 border-zinc-400'></span> pause</>
                    ) : (
                      <><span className='w-0 h-0 border-l-4 border-l-zinc-400 border-y-4 border-y-transparent'></span> start</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature 2 - Statistics & Skills (matching profile page) */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16'>
          {/* Statistics Cards */}
          <div className='lg:col-span-2 space-y-4'>
            <div className='flex items-center gap-2 mb-4'>
              <BarChart3 className="w-5 h-5 text-white" />
              <span className='text-lg font-semibold text-white'>Statistics</span>
            </div>
            <p className='text-sm text-zinc-500 mb-6'>Most important numbers about your progress</p>
            
            <div className='grid grid-cols-2 gap-4'>
              {stats.map((stat, i) => (
                <div key={i} className='rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-6'>
                  <div className='flex items-center gap-2 mb-2'>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className='text-sm text-zinc-400'>{stat.label}</span>
                    <span className='ml-auto text-xs text-green-500'>{stat.trend}</span>
                  </div>
                  <div className='text-3xl font-bold text-white font-mono'>{stat.value}</div>
                  <div className='mt-4 h-1 bg-zinc-800 rounded-full overflow-hidden'>
                    <div className={`h-full ${stat.color === 'text-cyan-400' ? 'bg-cyan-500' : 'bg-amber-500'} rounded-full`} style={{ width: '75%' }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini stats */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 flex items-center gap-4'>
                <Zap className='w-5 h-5 text-amber-400' />
                <div>
                  <div className='text-xs text-zinc-500'>Sessions</div>
                  <div className='text-xl font-bold text-white'>43</div>
                </div>
              </div>
              <div className='rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 flex items-center gap-4'>
                <TrendingUp className='w-5 h-5 text-pink-400' />
                <div>
                  <div className='text-xs text-zinc-500'>Healthy habits</div>
                  <div className='text-xl font-bold text-white'>2146</div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Distribution */}
          <div className='rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-6'>
            <div className='flex items-center gap-2 mb-2'>
              <Brain className="w-5 h-5 text-white" />
              <span className='text-lg font-semibold text-white'>Skills</span>
            </div>
            <p className='text-xs text-zinc-500 mb-6'>Distribution of exercise time by category</p>
            
            <div className='space-y-4'>
              {skills.map((skill, i) => (
                <div key={i} className='flex items-center gap-3'>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='text-sm text-zinc-300'>{skill.name}</span>
                      <span className='text-sm text-white font-semibold'>{skill.percent}%</span>
                    </div>
                    <div className='h-1.5 bg-zinc-800 rounded-full overflow-hidden'>
                      <div className={`h-full ${skill.color} rounded-full transition-all`} style={{ width: `${skill.percent}%` }}></div>
                    </div>
                  </div>
                  <span className='text-xs text-zinc-500 w-20 text-right'>{skill.time}</span>
                </div>
              ))}
            </div>

            <div className='mt-6 pt-6 border-t border-zinc-800'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-zinc-400'>Całkowity czas ćwiczeń</span>
                <span className='text-lg font-bold text-white'>2693h 18m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 - Activity Heatmap */}
        <div className='rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-950 p-8'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h3 className='text-lg font-semibold text-white'>Aktywność</h3>
              <p className='text-sm text-zinc-500'>Your practice activity over time</p>
            </div>
            <div className='flex gap-2'>
              {['2023', '2024', '2025'].map((year, i) => (
                <button key={i} className={`px-3 py-1 rounded-lg text-sm ${i === 2 ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Simplified Heatmap Grid */}
          <div className='overflow-x-auto'>
            <div className='grid grid-rows-7 grid-flow-col gap-1 min-w-[700px]'>
              {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((day, dayIndex) => (
                <div key={dayIndex} className='flex items-center gap-1'>
                  <span className='text-xs text-zinc-500 w-8'>{day}</span>
                  <div className='flex gap-1'>
                    {Array.from({ length: 52 }).map((_, weekIndex) => {
                      const intensity = Math.random();
                      let bgColor = 'bg-zinc-800/50';
                      if (intensity > 0.8) bgColor = 'bg-cyan-500';
                      else if (intensity > 0.6) bgColor = 'bg-cyan-500/70';
                      else if (intensity > 0.4) bgColor = 'bg-cyan-500/40';
                      else if (intensity > 0.2) bgColor = 'bg-cyan-500/20';
                      
                      return (
                        <div 
                          key={weekIndex} 
                          className={`w-3 h-3 rounded-sm ${bgColor} hover:ring-1 hover:ring-cyan-400 transition-all cursor-pointer`}
                          title={`Week ${weekIndex + 1}`}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='flex items-center gap-4 mt-4 text-xs text-zinc-500'>
            <div className='flex items-center gap-1'>
              <div className='w-3 h-3 rounded-sm bg-cyan-500'></div>
              <span>Report with title</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='w-3 h-3 rounded-sm bg-amber-500'></div>
              <span>Backdated report</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
