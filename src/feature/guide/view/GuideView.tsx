import { Badge } from "assets/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import MainContainer from "components/MainContainer/MainContainer";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Dumbbell,
  Layout,
  LineChart,
  Music,
  Play,
  PlusCircle,
  Search,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useRouter } from "next/router";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

const VideoPlayer = ({ src, title }: { src: string; title: string }) => (
  <motion.div 
    variants={itemVariants}
    className="relative mx-auto mb-10 max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 shadow-2xl backdrop-blur-sm"
  >
    <div className="aspect-video w-full bg-black/40">
      <video 
        src={src}
        autoPlay 
        loop 
        muted 
        playsInline
        className="h-full w-full object-cover"
      />
    </div>
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{title}</span>
      </div>
    </div>
  </motion.div>
);

const GuideView = () => {
  const router = useRouter();
  const defaultTab = (router.query.tab as string) || "practice";

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 pb-20 pt-8 lg:pt-12 px-4 lg:px-0">
      <MainContainer>
        <div className="p-6 lg:p-10">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 mt-4 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/20">
              <BookOpen size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
                App <span className="text-cyan-400">Guide</span>
              </h1>
              <p className="text-zinc-400">Master Riff Quest and accelerate your musical journey.</p>
            </div>
          </div>
        </motion.div>

        <Tabs 
          key={defaultTab}
          defaultValue={defaultTab} 
          onValueChange={(value) => {
            router.push({ query: { ...router.query, tab: value } }, undefined, { shallow: true });
          }}
          className="space-y-8"
        >
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900/50 p-1 lg:w-[600px] border border-white/5">
            <TabsTrigger value="practice" className="gap-2 transition-all">
              <Zap size={14} />
              <span className="hidden sm:inline">Practice Flow</span>
              <span className="sm:hidden">Practice</span>
            </TabsTrigger>
            <TabsTrigger value="songs" className="gap-2 transition-all">
              <Music size={14} />
              <span className="hidden sm:inline">Song Management</span>
              <span className="sm:hidden">Songs</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2 transition-all">
              <Target size={14} />
              <span className="hidden sm:inline">Custom Plans</span>
              <span className="sm:hidden">Plans</span>
            </TabsTrigger>
          </TabsList>

          {/* Practice & Progress Content */}
          <TabsContent value="practice">
            <VideoPlayer src="/guide/practice.mp4" title="Practice Workflow" />
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 lg:grid-cols-2"
            >
              <motion.div variants={itemVariants}>
                <Card className="h-full border-white/10 bg-zinc-900/40 backdrop-blur-md">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
                      <Play size={20} />
                    </div>
                    <CardTitle className="text-xl text-white">The Training Loop</CardTitle>
                    <CardDescription>How to effectively train with Riff Quest.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-zinc-800">
                      <div className="relative flex gap-4 pl-8">
                        <div className="absolute left-0 h-6 w-6 rounded-full border-4 border-zinc-900 bg-cyan-500 ring-1 ring-cyan-500/50" />
                        <div>
                          <h4 className="font-semibold text-zinc-100">Start a Session</h4>
                          <p className="text-sm text-zinc-400">
                            Navigate to the Practice tab. You can choose any practice mode: use the quick Timer, pick a specific Exercise, or follow one of your structured Plans.
                          </p>
                          <div className="mt-2 rounded-md bg-white/5 p-2 border border-white/5">
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              <span className="text-cyan-400 font-bold uppercase mr-1 text-[9px]">Note:</span> 
                              Practicing on your own? You can skip the modes and go straight to <strong>Reports</strong> to manually log your time and keep your streak alive.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="relative flex gap-4 pl-8">
                        <div className="absolute left-0 h-6 w-6 rounded-full border-4 border-zinc-900 bg-cyan-500 ring-1 ring-cyan-500/50" />
                        <div>
                          <h4 className="font-semibold text-zinc-100">Active Practice</h4>
                          <p className="text-sm text-zinc-400">
                            Focus on your technique. Depending on your choice, the system supports:
                          </p>
                          <ul className="mt-2 space-y-1 text-[11px] text-zinc-400">
                            <li className="flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-cyan-400" />
                              <span><strong>Timer:</strong> Quick manual session.</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-cyan-400" />
                              <span><strong>Plans:</strong> Following your custom-built routines.</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-cyan-400" />
                              <span><strong>Auto:</strong> Letting the system generate a plan based on time.</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-cyan-400" />
                              <span><strong>Exercise:</strong> Focused training on a specific technique.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="relative flex gap-4 pl-8">
                        <div className="absolute left-0 h-6 w-6 rounded-full border-4 border-zinc-900 bg-cyan-500 ring-1 ring-cyan-500/50" />
                        <div>
                          <h4 className="font-semibold text-zinc-100">Finish & Report</h4>
                          <p className="text-sm text-zinc-400">Crucial step! Clock out and fill the report. Be honest about your focus and intensity levels.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6">
                <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Trophy size={20} />
                    </div>
                    <CardTitle className="text-xl text-white">XP Multipliers</CardTitle>
                    <CardDescription>Maximized your gains by understanding the score.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                      <div className="mb-2 flex items-center justify-between text-zinc-100">
                        <span className="text-sm font-bold">Intensity</span>
                        <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-400/20">Up to 2.0x</Badge>
                      </div>
                      <p className="text-xs text-zinc-400">Higher physical and mental effort leads to faster technical progression.</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                      <div className="mb-2 flex items-center justify-between text-zinc-100">
                        <span className="text-sm font-bold">Consistency</span>
                        <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-400/20">Streak Bonus</Badge>
                      </div>
                      <p className="text-xs text-zinc-400">Training multiple days in a row increases your base XP per minute.</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="rounded-2xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 p-6 border border-cyan-500/20">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                      <LineChart size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase tracking-wider text-sm mb-1">PRO TIP: Tracking Progress</h4>
                      <p className="text-sm text-zinc-300">Check your <span className="text-cyan-400 font-medium">Activity</span> tab in the profile to see how your different musical attributes are leveling up.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Song Management Content */}
          <TabsContent value="songs">
            <VideoPlayer src="/guide/songs.mp4" title="Repertoire Management" />
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 lg:grid-cols-2"
            >
              <motion.div variants={itemVariants}>
                <Card className="h-full border-white/10 bg-zinc-900/40 backdrop-blur-md">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                      <Search size={20} />
                    </div>
                    <CardTitle className="text-xl text-white">The Song Library</CardTitle>
                    <CardDescription>Discover and expand your repertoire.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-zinc-400">
                      Browse thousands of community-curated songs. You can filter by difficulty, genre, or specific techniques you want to master.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 p-3">
                        <PlusCircle size={18} className="text-emerald-400" />
                        <span className="text-sm text-zinc-200">Click "+" to add a song to your personal library.</span>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 p-3">
                        <CheckCircle2 size={18} className="text-cyan-400" />
                        <span className="text-sm text-zinc-200">Songs in your library can be used in your Practice Plans.</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full border-white/10 bg-zinc-900/40 backdrop-blur-md">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                      <Layout size={20} />
                    </div>
                    <CardTitle className="text-xl text-white">My Songs & Mastery</CardTitle>
                    <CardDescription>Managing your own collection.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-zinc-400">
                      "My Songs" is your personal headquarters. Track which songs you're learning, which you've mastered, and which are on the back burner.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-white/5 bg-white/5 p-3">
                        <span className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</span>
                        <p className="text-xs text-zinc-300">Organize songs by learning progress.</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-white/5 p-3">
                        <span className="block text-xs font-bold text-zinc-500 uppercase mb-1">Rating</span>
                        <p className="text-xs text-zinc-300">Rate difficulty based on YOUR experience.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Custom Plans Content */}
          <TabsContent value="plans">
            <VideoPlayer src="/guide/plans.mp4" title="Custom Training Plans" />
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 lg:grid-cols-2"
            >
              <motion.div variants={itemVariants}>
                <Card className="h-full border-white/10 bg-zinc-900/40 backdrop-blur-md">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                      <Dumbbell size={20} />
                    </div>
                    <CardTitle className="text-xl text-white">Building Routines</CardTitle>
                    <CardDescription>Design the perfect practice session.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-zinc-400">
                      Don't waste time wondering what to play next. Create a plan that balances technique, theory, and fun.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2 text-sm text-zinc-300">
                        <ArrowRight size={14} className="mt-1 text-cyan-400 shrink-0" />
                        <span>Go to <strong>Practice &rarr; Plans</strong> and click <strong>Create Plan</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-zinc-300">
                        <ArrowRight size={14} className="mt-1 text-cyan-400 shrink-0" />
                        <span>Mix exercises (scales, picking) with songs from your repertoire.</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-zinc-300">
                        <ArrowRight size={14} className="mt-1 text-cyan-400 shrink-0" />
                        <span>After every session, always click <strong>Finish & Report</strong> to ensure your progress is saved to your Activity history.</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-6">
                <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                      <Clock size={20} />
                    </div>
                    <CardTitle className="text-xl text-white">Auto Mode & Recommendations</CardTitle>
                    <CardDescription>Let the system handle the planning.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-400">
                      Short on time? Use the <strong>Auto Mode</strong>! Just specify how many minutes you want to practice, and our system will automatically generate a perfectly balanced plan tailored to your current skill level.
                    </p>
                  </CardContent>
                </Card>

            
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
        </div>
      </MainContainer>
    </div>
  );
};

export default GuideView;
