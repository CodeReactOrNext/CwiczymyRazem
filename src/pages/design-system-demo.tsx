/**
 * Design System Demo Page
 * Showcase of the new minimalist design system using @components/ui
 */

import { Button } from "assets/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { Badge } from "assets/components/ui/badge";
import { Separator } from "assets/components/ui/separator";
import { Progress } from "assets/components/ui/progress";
import type { NextPage } from "next";
import { useState } from "react";
import {
  User,
  Mail,
  Settings,
  Bell,
  Search,
  ChevronRight,
  Star,
  Heart,
  MessageCircle,
  Share,
  Play,
  Pause,
  SkipForward,
  Volume2,
  Music,
  Palette,
  Type,
  Zap,
  Code,
} from "lucide-react";

const DesignSystemDemo: NextPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black'>
      {/* Header */}
      <header className='border-b border-white/10 bg-zinc-900/50 backdrop-blur-md'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            {/* Logo */}
            <div className='flex items-center gap-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg'>
                <Code className='h-4 w-4' />
              </div>
              <h1 className='text-lg font-semibold text-white'>
                Design System
              </h1>
            </div>

            {/* Navigation Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='hidden md:block'>
              <TabsList className='border border-white/10 bg-zinc-800/50'>
                <TabsTrigger
                  value='overview'
                  className='text-zinc-300 data-[state=active]:text-white'>
                  <Palette className='mr-2 h-4 w-4' />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value='components'
                  className='text-zinc-300 data-[state=active]:text-white'>
                  <Zap className='mr-2 h-4 w-4' />
                  Components
                </TabsTrigger>
                <TabsTrigger
                  value='tokens'
                  className='text-zinc-300 data-[state=active]:text-white'>
                  <Type className='mr-2 h-4 w-4' />
                  Tokens
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Actions */}
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='icon'
                className='text-zinc-400 hover:text-white'>
                <Search className='h-5 w-5' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='text-zinc-400 hover:text-white'>
                <Bell className='h-5 w-5' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='text-zinc-400 hover:text-white'>
                <Settings className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          {/* Hero Section */}
          <section className='mb-12 text-center'>
            <Badge
              variant='secondary'
              className='mb-4 border-cyan-500/20 bg-cyan-500/10 text-cyan-400'>
              <Zap className='mr-1 h-3 w-3' />
              New Design System
            </Badge>
            <h1 className='mb-4 bg-gradient-to-r from-white via-cyan-100 to-cyan-200 bg-clip-text text-5xl font-bold text-transparent text-white'>
              Minimalist Design System
            </h1>
            <p className='mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-zinc-400'>
              Clean, purposeful, and inspired by the best. Built for modern
              applications with dark-first design and subtle accents.
            </p>

            <div className='flex items-center justify-center gap-4'>
              <Button className='bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg transition-all duration-200 hover:from-cyan-600 hover:to-cyan-700 hover:shadow-cyan-500/25'>
                Get Started
                <ChevronRight className='ml-1 h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                className='border-white/20 text-white hover:bg-white/10'>
                View Components
              </Button>
            </div>
          </section>

          {/* Tab Content */}
          <TabsContent value='overview' className='space-y-8'>
            {/* Cards Grid */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {/* Typography Card */}
              <Card className='border-white/10 bg-zinc-900/70 backdrop-blur-xl'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-white'>
                    <Type className='h-5 w-5 text-cyan-400' />
                    Typography
                  </CardTitle>
                  <CardDescription className='text-zinc-400'>
                    Clean, readable typography system
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <p className='mb-1 text-2xl font-bold text-white'>
                      Display Large
                    </p>
                    <p className='text-xs text-zinc-500'>
                      48px / Bold / -0.05em
                    </p>
                  </div>
                  <Separator className='bg-white/10' />
                  <div>
                    <p className='mb-1 text-xl font-semibold text-white'>
                      Heading H2
                    </p>
                    <p className='text-xs text-zinc-500'>24px / Semibold</p>
                  </div>
                  <div>
                    <p className='mb-1 text-base text-white'>Body Medium</p>
                    <p className='text-xs text-zinc-500'>
                      16px / Regular / 1.5
                    </p>
                  </div>
                  <div>
                    <p className='mb-1 text-sm font-medium text-zinc-300'>
                      Label Medium
                    </p>
                    <p className='text-xs text-zinc-500'>
                      12px / Medium / 0.05em
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Colors Card */}
              <Card className='border-white/10 bg-zinc-900/70 backdrop-blur-xl'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-white'>
                    <Palette className='h-5 w-5 text-cyan-400' />
                    Colors
                  </CardTitle>
                  <CardDescription className='text-zinc-400'>
                    Dark-first with subtle accents
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <Label className='mb-2 block text-xs text-zinc-300'>
                      Background Colors
                    </Label>
                    <div className='grid grid-cols-4 gap-2'>
                      <div className='space-y-1'>
                        <div className='h-8 w-full rounded border border-white/10 bg-slate-900'></div>
                        <p className='text-xs text-zinc-500'>Primary</p>
                      </div>
                      <div className='space-y-1'>
                        <div className='h-8 w-full rounded border border-white/10 bg-slate-800'></div>
                        <p className='text-xs text-zinc-500'>Secondary</p>
                      </div>
                      <div className='space-y-1'>
                        <div className='h-8 w-full rounded border border-white/10 bg-zinc-800'></div>
                        <p className='text-xs text-zinc-500'>Surface</p>
                      </div>
                      <div className='space-y-1'>
                        <div className='h-8 w-full rounded border border-white/10 bg-zinc-700'></div>
                        <p className='text-xs text-zinc-500'>Elevated</p>
                      </div>
                    </div>
                  </div>

                  <Separator className='bg-white/10' />

                  <div>
                    <Label className='mb-2 block text-xs text-zinc-300'>
                      Accent Colors
                    </Label>
                    <div className='grid grid-cols-4 gap-2'>
                      <div className='space-y-1'>
                        <div className='h-8 w-full rounded bg-cyan-500'></div>
                        <p className='text-xs text-zinc-500'>Primary</p>
                      </div>
                      <div className='space-y-1'>
                        <div className='h-8 w-full rounded bg-emerald-500'></div>
                        <p className='text-xs text-zinc-500'>Success</p>
                      </div>
                      <div className='space-y-1'>
                        <div className='h-8 w-full rounded bg-amber-500'></div>
                        <p className='text-xs text-zinc-500'>Warning</p>
                      </div>
                      <div className='space-y-1'>
                        <div className='h-8 w-full rounded bg-red-500'></div>
                        <p className='text-xs text-zinc-500'>Error</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Components Card */}
              <Card className='border-white/10 bg-zinc-900/70 backdrop-blur-xl'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-white'>
                    <Zap className='h-5 w-5 text-cyan-400' />
                    Components
                  </CardTitle>
                  <CardDescription className='text-zinc-400'>
                    Consistent, reusable elements
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Buttons */}
                  <div className='space-y-3'>
                    <Label className='text-xs text-zinc-300'>Buttons</Label>
                    <div className='flex flex-wrap gap-2'>
                      <Button
                        size='sm'
                        className='bg-cyan-500 text-white hover:bg-cyan-600'>
                        Primary
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='border-white/20 text-white hover:bg-white/10'>
                        Secondary
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-zinc-300 hover:bg-white/10 hover:text-white'>
                        Ghost
                      </Button>
                    </div>
                  </div>

                  <Separator className='bg-white/10' />

                  {/* Input */}
                  <div className='space-y-3'>
                    <Label className='text-xs text-zinc-300'>Input</Label>
                    <Input
                      placeholder='Enter text...'
                      className='border-white/20 bg-zinc-800/50 text-white placeholder:text-zinc-500'
                    />
                  </div>

                  <Separator className='bg-white/10' />

                  {/* Progress */}
                  <div className='space-y-3'>
                    <Label className='text-xs text-zinc-300'>Progress</Label>
                    <Progress
                      value={65}
                      className='bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-cyan-600'
                    />
                    <p className='text-xs text-zinc-500'>65% complete</p>
                  </div>

                  <Separator className='bg-white/10' />

                  {/* Badge */}
                  <div className='space-y-3'>
                    <Label className='text-xs text-zinc-300'>Badges</Label>
                    <div className='flex flex-wrap gap-2'>
                      <Badge
                        variant='default'
                        className='border-cyan-500/30 bg-cyan-500/20 text-cyan-400'>
                        New
                      </Badge>
                      <Badge
                        variant='secondary'
                        className='border-emerald-500/30 bg-emerald-500/20 text-emerald-400'>
                        Success
                      </Badge>
                      <Badge
                        variant='outline'
                        className='border-amber-500/30 text-amber-400'>
                        Warning
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value='components' className='space-y-8'>
            <div className='mb-8 text-center'>
              <h2 className='mb-2 text-3xl font-bold text-white'>
                Component Library
              </h2>
              <p className='text-zinc-400'>
                Interactive examples of our design system components
              </p>
            </div>

            {/* Music Player Example */}
            <div className='mx-auto max-w-md'>
              <Card className='overflow-hidden border-white/10 bg-zinc-900/70 backdrop-blur-xl'>
                <CardContent className='p-6'>
                  {/* Album Art */}
                  <div className='relative mb-6 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600'>
                    <Music className='h-16 w-16 text-white/30' />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
                  </div>

                  {/* Track Info */}
                  <div className='mb-6 text-center'>
                    <h3 className='mb-1 text-xl font-semibold text-white'>
                      Midnight Dreams
                    </h3>
                    <p className='text-zinc-400'>The Minimalists</p>
                  </div>

                  {/* Progress Bar */}
                  <div className='mb-6'>
                    <Progress
                      value={35}
                      className='mb-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-cyan-600'
                    />
                    <div className='flex justify-between text-xs text-zinc-500'>
                      <span>1:24</span>
                      <span>3:47</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className='mb-6 flex items-center justify-center gap-6'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-zinc-400 hover:text-white'>
                      <SkipForward className='h-5 w-5 rotate-180' />
                    </Button>

                    <Button
                      size='icon'
                      className='h-12 w-12 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg hover:from-cyan-600 hover:to-cyan-700 hover:shadow-cyan-500/25'
                      onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? (
                        <Pause className='h-6 w-6' />
                      ) : (
                        <Play className='ml-0.5 h-6 w-6' />
                      )}
                    </Button>

                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-zinc-400 hover:text-white'>
                      <SkipForward className='h-5 w-5' />
                    </Button>
                  </div>

                  {/* Actions */}
                  <Separator className='mb-4 bg-white/10' />
                  <div className='flex items-center justify-between'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-zinc-400 hover:text-white'>
                      <Heart className='mr-2 h-4 w-4' />
                      Like
                    </Button>

                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-zinc-400 hover:text-white'>
                      <Share className='mr-2 h-4 w-4' />
                      Share
                    </Button>

                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-zinc-400 hover:text-white'>
                      <Volume2 className='mr-2 h-4 w-4' />
                      Volume
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value='tokens' className='space-y-8'>
            <div className='mb-8 text-center'>
              <h2 className='mb-2 text-3xl font-bold text-white'>
                Design Tokens
              </h2>
              <p className='text-zinc-400'>
                The foundation of our design system
              </p>
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Spacing Tokens */}
              <Card className='border-white/10 bg-zinc-900/70 backdrop-blur-xl'>
                <CardHeader>
                  <CardTitle className='text-white'>Spacing Scale</CardTitle>
                  <CardDescription className='text-zinc-400'>
                    4px base unit system
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {[1, 2, 4, 6, 8, 12, 16, 24].map((size) => (
                    <div key={size} className='flex items-center gap-4'>
                      <div
                        className={`rounded bg-cyan-500`}
                        style={{ width: `${size * 4}px`, height: "16px" }}
                      />
                      <span className='font-mono text-sm text-zinc-300'>
                        {size * 4}px
                      </span>
                      <Badge
                        variant='outline'
                        className='border-zinc-600 text-xs text-zinc-400'>
                        space-{size}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Border Radius */}
              <Card className='border-white/10 bg-zinc-900/70 backdrop-blur-xl'>
                <CardHeader>
                  <CardTitle className='text-white'>Border Radius</CardTitle>
                  <CardDescription className='text-zinc-400'>
                    Consistent corner rounding
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {[
                    { name: "sm", value: "4px" },
                    { name: "md", value: "8px" },
                    { name: "lg", value: "12px" },
                    { name: "xl", value: "16px" },
                  ].map((radius) => (
                    <div key={radius.name} className='flex items-center gap-4'>
                      <div
                        className='h-12 w-12 bg-gradient-to-br from-cyan-500 to-purple-600'
                        style={{ borderRadius: radius.value }}
                      />
                      <div>
                        <p className='font-mono text-sm text-zinc-300'>
                          {radius.value}
                        </p>
                        <Badge
                          variant='outline'
                          className='border-zinc-600 text-xs text-zinc-400'>
                          rounded-{radius.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className='mt-16 border-t border-white/10 pt-8 text-center'>
          <div className='mb-4 flex items-center justify-center gap-2'>
            <div className='flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-cyan-500 to-cyan-600 text-white'>
              <Code className='h-3 w-3' />
            </div>
            <span className='text-sm text-zinc-400'>Design System</span>
          </div>
          <p className='mb-2 text-sm text-zinc-500'>
            Built with our minimalist design system. Clean, purposeful, and
            beautiful.
          </p>
          <div className='flex items-center justify-center gap-4 text-xs text-zinc-600'>
            <span>Using @components/ui</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Design Tokens</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default DesignSystemDemo;
