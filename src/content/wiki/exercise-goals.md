---
title: "Exercise Goals"
description: "Set where you start and the tempo you want to reach on an exercise, then climb milestone by milestone, three clean runs at each, in goal mode."
slug: "exercise-goals"
section: "Skill Development"
order: 4
---

A goal is one exercise and the tempo you want to play it at, reached in small steps. You pick where you start and where you want to end up, and the app lays out the way between them as milestones: 80, 85, 90 and so on up to 120. Each milestone takes three clean runs before the next one opens. You decide how clean a run has to be, and the only way up is to play it.

## Setting a goal

<ClickPath steps="Progress|Goals|New goal" caption="Pick an exercise, the start tempo and the goal tempo, how clean a run must be and how the clean runs add up." />

Goals work on exercises that have a tablature and a metronome tempo, because those are the ones the microphone can score note by note. Hunts, strumming patterns, listening quizzes and songs can't take a goal.

The start tempo begins at the bottom of the exercise's own range and the goal tempo at the top. Change both to whatever fits you. Under them you see the milestones the goal will have. They go up 5 BPM at a time, and on a very long climb the steps get bigger so the path stays at 16 milestones or fewer. Each exercise holds one open goal at a time. Once you save, the feed shows the goal you set, from the start tempo to the goal tempo.

<StepList steps="How clean::Relaxed counts a run at 80% accuracy, Standard at 90%, Strict at 95%|Three clean runs per milestone::In a row means a run that isn't clean starts that milestone's count over. In total means clean runs add up, whatever happens between them" />

## Playing in goal mode

<ClickPath steps="Progress|Goals|Play at 85 BPM" caption="Opens the exercise with the metronome at your current milestone." />

A goal run is the exercise played for its full time with the microphone on. When the timer runs out, the summary tells you whether the run was clean and how many clean runs you have at this milestone. Press **Try again** for the next run.

A run counts at the slowest tempo it was scored at. You can slow the metronome down for a warm-up run, but that run won't be clean, because it wasn't played at the milestone's tempo.

The third clean run clears the milestone. The summary tells you which one comes next, and the metronome is already set to it when you press **Try again**. Clearing the last milestone, the goal tempo itself, reaches the goal.

<ProgressLadder items="80 BPM::3 clean runs|85 BPM::3 clean runs|90 BPM::3 clean runs|120 BPM::Goal reached" highlight="85 BPM" />

<BlogAlert type="info">
Only goal runs can clear a milestone. Ordinary practice of the same exercise still shows up on the goal's chart, so you can see the way up, but it never counts toward the three clean runs.
</BlogAlert>

## The chart

Every goal shows the milestone you're on, a bar with one segment per milestone (green ones are cleared), and a chart of your scored runs on that exercise. The goal's tempo is a dashed green line and the current milestone a dotted grey one. Small grey dots are ordinary practice, green dots are clean goal runs, and hollow dots are goal runs that didn't count.

The chart starts before the goal does: sessions where you practised that one exercise with the microphone on show up too, so a new goal opens on the climb that led to it. Sessions of a routine with several exercises don't, because the score can't be pinned to one exercise.

Switch the chart to **Timing** to see how precisely you play rather than how fast. Each run shows how far your notes typically land from the beat, in milliseconds, and the higher the dot, the tighter the run. The shaded band at the top is dead on, within 25 ms. Hover a run to see whether you tend to play ahead of the beat or behind it.

<BlogAlert type="tip">
If every run leans the same way, ahead or behind by about the same amount, that is usually your audio delay rather than your hands. Run the timing calibration once, see note detection.
</BlogAlert>

## When you reach it

Every cleared milestone ticks the exercise's **Speeds mastered** up to its tempo. When the last one is cleared, the goal moves to **Reached** and the feed tells everyone. Coming back from the run, you're asked whether to raise the bar: the next goal starts one step above the old one and aims about 10% faster, and you can change both before saving. Reached goals stay in the list, and the latest one for each exercise keeps a **Raise the bar** button.

Goals don't give points or Fame. The practice time of a goal run logs like any other session.

## Questions people ask

<FaqList items="Do I need a microphone?::Yes. A run the microphone didn't score doesn't count, see note detection|Can a goal be faster than the exercise's range?::Yes. Goal mode lets the metronome go up to your goal's tempo even when it's above the exercise's usual range|Can I skip a milestone?::No. Playing faster than the milestone still counts as clean, but each milestone needs its own three clean runs. Set a higher start tempo if the first ones are too easy|What happens if I delete a goal?::It's gone, but the runs stay on the exercise's chart and come back if you set a new goal there|Why is my chart empty?::Nothing scored yet on that exercise on its own. Play it with the microphone on, in practice or in goal mode|Does my timing count?::A run is judged on the notes you hit and the tempo you played them at. Timing shows on the Timing chart and in the summary, it just doesn't decide the goal|Why does the Timing chart start later than the Tempo chart?::Timing is recorded from runs scored with the microphone from now on. Older sessions only kept their tempo" />

<ReadNext links="Note detection & mic setup::/wiki/note-detection|Learning Path & Scale Map::/wiki/journey-and-scale-tree|Skills & achievements::/wiki/skills-and-achievements|Practice sessions & logging::/wiki/practice-sessions-and-logging" />
