import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { DifficultyLevel,Exercise, ExerciseCategory } from "feature/exercisePlan/types/exercise.types";
import { Footer } from "feature/landing/components/Footer";
import {motion } from "framer-motion";
import { 
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock, 
  Dumbbell,
  FastForward,
  Printer, 
  RefreshCw, 
  Settings2,
  Sparkles,
  Target, 
  Trophy, 
  Waves,
  Zap} from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";



export default function GuitarPracticeBuilderPage() {
  const [step, setStep] = useState<'setup' | 'generated'>('setup');
  const [duration, setDuration] = useState(30);
  const [focus, setFocus] = useState<ExerciseCategory | 'mixed'>('mixed');
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [intensity, setIntensity] = useState<'standard' | 'fast-paced' | 'deep-dive'>('standard');
  const [includeWarmup, setIncludeWarmup] = useState(true);
  
  const [generatedPlan, setGeneratedPlan] = useState<Exercise[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const generatePlan = () => {
    setIsGenerating(true);
    setStep('generated');
    
    setTimeout(() => {
        let pool = [...exercisesAgregat];
        
        if (focus !== 'mixed') {
            pool = pool.filter(ex => ex.category === focus);
        }
        
        if (difficulty !== 'all') {
            pool = pool.filter(ex => ex.difficulty === difficulty);
        }

        if (intensity === 'fast-paced') {
            pool.sort((a, b) => a.timeInMinutes - b.timeInMinutes);
        } else if (intensity === 'deep-dive') {
            pool.sort((a, b) => b.timeInMinutes - a.timeInMinutes);
        } else {
            pool = pool.sort(() => Math.random() - 0.5);
        }
        
        const selected: Exercise[] = [];
        let totalTime = 0;
        
        if (includeWarmup) {
            const warmups = exercisesAgregat.filter(ex => ex.category === 'technique' && ex.timeInMinutes <= 5);
            if (warmups.length > 0) {
                const warmup = warmups[Math.floor(Math.random() * warmups.length)];
                selected.push(warmup);
                totalTime += warmup.timeInMinutes;
            }
        }
        
        const shuffledPool = pool.filter(ex => !selected.find(s => s.id === ex.id)).sort(() => Math.random() - 0.5);

        for (const ex of shuffledPool) {
            if (totalTime + ex.timeInMinutes <= duration + 3) {
                selected.push(ex);
                totalTime += ex.timeInMinutes;
            }
            if (totalTime >= duration) break;
        }

        setGeneratedPlan(selected);
        setIsGenerating(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  const getCategoryTheme = (cat: string) => {
    switch(cat) {
        case 'technique': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
        case 'theory': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        case 'creativity': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        case 'hearing': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        default: return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    }
  };

  return (
    <>
      <Head>
        <title>Guitar Practice Builder | Create Systematic Routines | Riff Quest</title>
        <meta name="description" content="Build specialized guitar practice routines in seconds. Tell us your goals and time availability, and get a printable, step-by-step practice plan." />
        <meta name="keywords" content="guitar practice builder, guitar routine generator, guitar practice schedule, guitar lesson plan, systematic guitar practice" />
        <link rel="canonical" href="https://riff.quest/guitar-practice-builder" />
        <meta property="og:title" content="Guitar Practice Builder | Create Systematic Routines | Riff Quest" />
        <meta property="og:description" content="Build specialized guitar practice routines in seconds. Tell us your goals and time availability, and get a printable, step-by-step practice plan." />
        <meta property="og:url" content="https://riff.quest/guitar-practice-builder" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Guitar Practice Builder | Create Systematic Routines" />
        <meta name="twitter:description" content="Build specialized guitar practice routines in seconds. Tell us your goals and time availability, and get a printable, step-by-step practice plan." />
        <meta name="twitter:image" content="https://riff.quest/images/og-image.png" />
      </Head>

      <main className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-cyan-500/30">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl no-print">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="transition-opacity hover:opacity-80">
              <Image src='/images/longlightlogo.svg' alt='Riff Quest' width={120} height={30} className='h-6 w-auto' priority />
            </Link>
            <div className="flex items-center gap-4 sm:gap-6">
                <Link href="/guide" className="hidden sm:inline text-xs font-bold text-zinc-500 hover:text-white transition-colors">Guide</Link>
                <Link href="/login" className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">Login</Link>
                <Link href="/signup">
                    <Button className="rounded-full bg-white text-black font-black h-9 px-4 sm:px-6 text-xs hover:bg-zinc-200">Start Free</Button>
                </Link>
            </div>
          </div>
        </nav>

        {/* Hero & Marketing Header */}
        <section className="relative pt-32 pb-16 px-4 sm:px-6 overflow-hidden no-print">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-cyan-500/5 blur-[120px] rounded-full -z-10" />
            <div className="max-w-4xl mx-auto text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-[10px] font-black uppercase tracking-[0.25em] mb-8"
                >
                    <Settings2 size={12} /> The Lab • Interactive Tool
                </motion.div>
                <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[0.95]">
                    Build your <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Guitar</span> <br />
                    Practice Routine.
                </h1>
                <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
                    Stop mindlessly noodling. Design a high-impact session that targets your technical limits and theoretical gaps in seconds.
                </p>
                <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-16">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-zinc-600">
                        <CheckCircle2 size={14} className="text-emerald-500" /> Professional Accuracy
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-zinc-600">
                        <CheckCircle2 size={14} className="text-emerald-500" /> Printable PDF
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-zinc-600">
                        <CheckCircle2 size={14} className="text-emerald-500" /> 100% Free
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
              {step === 'setup' && (
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-zinc-900/40 border border-white/10 rounded-[40px] p-1.5 shadow-2xl overflow-hidden"
                  >
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-[34px] p-6 md:p-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 mb-12">
                                {/* Time & Category */}
                                <div className="space-y-8 md:space-y-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-2">Available Time</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[15, 30, 45, 60].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setDuration(t)}
                                                    className={cn(
                                                        "h-12 md:h-14 rounded-2xl font-black text-sm transition-all border",
                                                        duration === t ? 'bg-white text-black border-white shadow-xl shadow-white/5' : 'bg-white/[0.03] border-white/5 text-zinc-500 hover:border-white/20'
                                                    )}
                                                >
                                                    {t}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-2">Main Objective</label>
                                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                                            {[
                                                { id: 'mixed', label: 'Balanced' },
                                                { id: 'technique', label: 'Technique' },
                                                { id: 'theory', label: 'Theory' },
                                                { id: 'creativity', label: 'Creative' }
                                            ].map(f => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => setFocus(f.id as any)}
                                                    className={cn(
                                                        "h-12 md:h-14 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                        focus === f.id ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-white/[0.03] border-white/5 text-zinc-500 hover:border-white/20'
                                                    )}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Advanced Config */}
                                <div className="space-y-8 md:space-y-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-2">Skill Level</label>
                                        <div className="flex gap-2 p-1 bg-black/40 rounded-[20px] border border-white/5">
                                            {['all', 'easy', 'medium', 'hard'].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => setDifficulty(d as any)}
                                                    className={cn(
                                                        "flex-1 h-10 md:h-11 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all",
                                                        difficulty === d ? 'bg-white/10 text-white shadow-inner shadow-white/5' : 'text-zinc-600 hover:text-zinc-400'
                                                    )}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-2">Training Intensity</label>
                                        <div className="space-y-2">
                                            {[
                                                { id: 'standard', label: 'Balanced Pace', icon: <Waves size={14} /> },
                                                { id: 'fast-paced', label: 'Speed/Motor Focus', icon: <FastForward size={14} /> },
                                                { id: 'deep-dive', label: 'Cognitive Depth', icon: <BrainCircuit size={14} /> }
                                            ].map(i => (
                                                <button
                                                    key={i.id}
                                                    onClick={() => setIntensity(i.id as any)}
                                                    className={cn(
                                                        "w-full h-11 md:h-12 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between border",
                                                        intensity === i.id ? 'bg-cyan-400/5 border-cyan-400/30 text-cyan-400' : 'bg-transparent border-white/5 text-zinc-600 hover:text-zinc-400'
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {i.icon} {i.label}
                                                    </div>
                                                    {intensity === i.id && <CircleDot size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                            <Dumbbell size={14} /> Warming Up
                                        </div>
                                        <button 
                                            onClick={() => setIncludeWarmup(!includeWarmup)}
                                            className={cn(
                                                "w-10 h-5 rounded-full transition-all relative",
                                                includeWarmup ? 'bg-cyan-500' : 'bg-zinc-800'
                                            )}
                                        >
                                            <motion.div 
                                                animate={{ x: includeWarmup ? 20 : 4 }}
                                                className="h-3 w-3 bg-white rounded-full absolute top-1"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                onClick={generatePlan}
                                className="w-full h-16 md:h-20 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-lg md:text-xl rounded-[24px] shadow-2xl shadow-cyan-500/10 transition-transform hover:scale-[1.01] active:scale-[0.99] gap-4"
                            >
                                Build Professional Stack <ChevronRight size={24} strokeWidth={3} />
                            </Button>
                        </div>
                  </motion.div>
              )}
            </div>
        </section>

        {step === 'generated' && (
            <>
                {/* Web View - Hidden on print */}
                <section className="relative px-4 sm:px-6 pb-20 no-print">
                <div className="max-w-4xl mx-auto">
                    <div className="space-y-8 md:space-y-12">
                        {isGenerating ? (
                            <div className="h-96 flex flex-col items-center justify-center text-center">
                                <RefreshCw className="text-cyan-500 w-16 h-16 animate-spin mb-8" />
                                <h3 className="text-2xl font-black text-white italic tracking-tighter">Analyzing Database...</h3>
                                <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Optimizing {duration}min systematic session</p>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-[32px] md:rounded-[48px] p-6 md:p-16 shadow-3xl"
                            >
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-10 mb-12 md:mb-16 border-b border-white/5 pb-10">
                                    <div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-[0.3em]">
                                                Optimized Routine
                                            </div>
                                            <div className="h-1 w-1 rounded-full bg-zinc-800" />
                                            <div className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Clock size={14} className="text-zinc-700" /> {generatedPlan.reduce((acc, curr) => acc + curr.timeInMinutes, 0)}m Session
                                            </div>
                                        </div>
                                        <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-none">Your Training Stack</h2>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button onClick={handlePrint} className="bg-white text-black font-black h-12 md:h-14 px-6 md:px-10 rounded-2xl flex gap-3 shadow-xl hover:bg-zinc-200 text-sm">
                                            <Printer size={18} /> Print PDF
                                        </Button>
                                        <button onClick={() => setStep('setup')} className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest px-4 md:px-6 transition-colors font-mono">
                                            [Reset]
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-8 md:space-y-12">
                                    {generatedPlan.map((ex, idx) => (
                                        <div key={ex.id} className="relative group/ex">
                                            <div className="absolute -left-12 top-0 bottom-0 w-px bg-zinc-900 md:block hidden" />
                                            
                                            <div className="bg-[#111111] border border-white/5 rounded-[32px] md:rounded-[40px] p-6 md:p-12 hover:border-white/10 transition-all duration-500 relative overflow-hidden group/card shadow-lg hover:shadow-cyan-500/[0.02]">
                                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/card:opacity-10 transition-opacity">
                                                    <div className="text-8xl md:text-9xl font-black italic">{idx + 1}</div>
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-8 md:gap-12 relative z-10">
                                                    <div className="md:w-64 flex-shrink-0">
                                                        <div className={cn(
                                                            "inline-flex px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border mb-6",
                                                            getCategoryTheme(ex.category)
                                                        )}>
                                                            {ex.category}
                                                        </div>
                                                        <div className="text-xs font-bold text-zinc-600 mb-6 md:mb-8 uppercase tracking-widest flex items-center gap-2">
                                                            <Clock size={14} /> {ex.timeInMinutes} Minutes
                                                        </div>
                                                        
                                                        {ex.metronomeSpeed && (
                                                            <div className="bg-black/40 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/5">
                                                                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2 font-mono text-center md:text-left">TARGET_TEMPO</div>
                                                                <div className="text-xl md:text-2xl font-black text-zinc-300 tracking-tight text-center md:text-left">{ex.metronomeSpeed.recommended} <span className="text-xs font-medium text-zinc-600 font-sans">BPM</span></div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-grow">
                                                        <h4 className="text-2xl md:text-3xl font-black text-white mb-4 md:mb-6 leading-tight tracking-tight underline-offset-8 decoration-cyan-500/20">{ex.title}</h4>
                                                        <p className="text-sm md:text-base text-zinc-400 mb-8 md:mb-10 leading-relaxed font-medium">
                                                            {ex.description}
                                                        </p>
                                                        
                                                        <div className="space-y-6">
                                                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 font-mono">UNIT_INSTRUCTIONS</div>
                                                            <div className="grid grid-cols-1 gap-3 md:gap-4">
                                                                {ex.instructions.map((ins, i) => (
                                                                    <div key={i} className="flex gap-4 md:gap-5 group/ins bg-white/[0.02] p-4 rounded-2xl border border-transparent hover:border-white/5 transition-colors">
                                                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-black border border-white/10 flex items-center justify-center text-[10px] md:text-xs font-black text-zinc-500 group-hover/ins:text-cyan-400 group-hover/ins:border-cyan-500/30 transition-all flex-shrink-0">
                                                                            {i + 1}
                                                                        </div>
                                                                        <p className="text-xs md:text-sm text-zinc-300 group-hover/ins:text-white transition-colors pt-1 leading-relaxed font-medium">
                                                                            {ins}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-16 md:mt-20 pt-12 md:pt-16 border-t border-white/5">
                                <div className="max-w-xl mx-auto text-center">
                                    <h3 className="text-xl md:text-2xl font-black text-white mb-4">Want to log this time?</h3>
                                    <p className="text-zinc-500 mb-8 md:mb-10 text-sm font-medium">Create a free Riff Quest account to track your practice minutes, unlock achievements, and see your skills grow on radar charts.</p>
                                    <Link href="/signup">
                                        <Button className="h-14 md:h-16 px-10 md:px-12 bg-white text-black font-black text-base md:text-lg rounded-2xl shadow-2xl shadow-white/5 hover:scale-105 transition-transform">
                                            Create My Profile <ArrowRight className="ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
                </section>

                {/* Print Dedicated View - Hidden on screen */}
                {!isGenerating && (
                    <div className="print-only hidden">
                        <div className="mb-10 flex justify-center">
                            <Image 
                                src="/images/longlightlogo.svg" 
                                alt="Riff Quest" 
                                width={160} 
                                height={40} 
                                className="print-logo-black"
                            />
                        </div>
                        <div className="space-y-6">
                            {generatedPlan.map((ex, idx) => (
                                <article key={ex.id} className="border border-black p-4 break-inside-avoid">
                                    <div className="flex justify-between items-start border-b border-black/10 pb-2 mb-3">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xl font-black border-2 border-black w-8 h-8 flex items-center justify-center">{idx + 1}</span>
                                            <div>
                                                <h3 className="text-lg font-black uppercase tracking-tight">{ex.title}</h3>
                                                <p className="text-[10px] font-bold text-gray-600 tracking-widest">{ex.category.toUpperCase()} • {ex.timeInMinutes} MINUTES</p>
                                            </div>
                                        </div>
                                        {ex.metronomeSpeed && (
                                            <div className="text-right border-l border-black/10 pl-4">
                                                <p className="text-[8px] font-bold text-gray-500 uppercase">Target Tempo</p>
                                                <p className="text-sm font-black">{ex.metronomeSpeed.recommended} BPM</p>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs leading-relaxed mb-4 text-gray-800">{ex.description}</p>

                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                        {ex.instructions.map((ins, i) => (
                                            <div key={i} className="flex gap-2 text-[10px] items-start">
                                                <span className="font-bold flex-shrink-0 w-4">{i + 1}.</span>
                                                <span className="text-gray-700">{ins}</span>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}
            </>
        )}

        {/* Marketing Features Section */}
        <section className="max-w-5xl mx-auto px-6 py-20 md:py-32 border-t border-white/5 no-print">
            <div className="text-center mb-16 md:mb-24">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 italic tracking-tight">Why systematic practice?</h2>
                <p className="text-zinc-500 max-w-2xl mx-auto text-base md:text-lg font-medium">Science shows that structured, varied routines beat random noodling every time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-20 md:mb-32">
                {[
                    { 
                        title: "Bypass Platenaus", 
                        desc: "Random playing leads to stagnation. Our algorithm ensures you rotate through technique, theory, and creativity to keep your brain adapting.",
                        icon: <Target className="text-cyan-500" />
                    },
                    { 
                        title: "Zero Decision Fatigue", 
                        desc: "Don't spend 20 minutes wondering what to play. We build the stack, you pick up the guitar.",
                        icon: <Zap className="text-cyan-500" />
                    },
                    { 
                        title: "Neural Economy", 
                        desc: "High-intensity short blocks (15-60m) are mathematically optimized for motor memory consolidation and long-term skill retention.",
                        icon: <BrainCircuit className="text-cyan-500" />
                    }
                ].map((feat, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 p-8 md:p-10 rounded-[32px] md:rounded-[40px] hover:border-cyan-500/20 transition-all group">
                        <div className="mb-6 md:mb-8 p-4 bg-black rounded-2xl w-fit group-hover:bg-cyan-500/10 transition-colors">
                            {feat.icon}
                        </div>
                        <h4 className="text-lg md:text-xl font-black text-white mb-4 italic">{feat.title}</h4>
                        <p className="text-zinc-500 text-sm leading-relaxed font-medium">{feat.desc}</p>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-[32px] md:rounded-[48px] p-8 md:p-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 hidden sm:block">
                    <Trophy size={200} />
                </div>
                <div className="max-w-2xl relative z-10">
                    <h3 className="text-2xl md:text-4xl font-black text-white mb-6 tracking-tighter">Ready for the Full Experience?</h3>
                    <p className="text-zinc-400 text-base md:text-lg mb-8 md:mb-10 leading-relaxed font-medium">
                        Practice Builder is just a tool. Riff Quest is a complete ecosystem. Join 1,000+ guitarists who are turning practice into an RPG adventure.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 md:mb-12 text-sm font-bold text-zinc-300">
                        <div className="flex items-center gap-2"> <CheckCircle2 className="text-cyan-400" size={16} /> Radar Skill Charts </div>
                        <div className="flex items-center gap-2"> <CheckCircle2 className="text-cyan-400" size={16} /> Progress Logs </div>
                        <div className="flex items-center gap-2"> <CheckCircle2 className="text-cyan-400" size={16} /> Boss Battle Exams </div>
                        <div className="flex items-center gap-2"> <CheckCircle2 className="text-cyan-400" size={16} /> Community Leaderboards </div>
                    </div>
                    <Link href="/signup">
                        <Button className="h-14 md:h-16 px-10 md:px-12 bg-white text-black font-black text-base md:text-lg rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl shadow-white/5">
                            Join Riff Quest Today <Sparkles className="ml-2 text-cyan-500" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>

        <div className="no-print">
          <Footer />
        </div>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: A4;
          }
          
          body, html, main {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 210mm;
          }

          nav, footer, .no-print, .opacity-5, [role="button"], script {
            display: none !important;
          }

          .print-only {
            display: block !important;
            padding: 10mm !important;
          }

          .print-logo-black {
            filter: brightness(0) !important;
            -webkit-filter: brightness(0) !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background-color: transparent !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}


