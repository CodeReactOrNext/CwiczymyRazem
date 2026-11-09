---
title: "Connect Claude or Another AI Assistant"
description: "Hook Claude, ChatGPT or Cursor up to your riff.quest account so it can read your practice, plan your next session and write exercises with tabs for you."
slug: "ai-assistants"
section: "Practice"
order: 6
---

riff.quest can talk to the AI assistant you already use. Connect Claude (or another app that supports connectors) to your account and you can ask it things like "what have I been neglecting this month?" or "write me a legato exercise in A minor at 90 BPM", and it answers from your real practice history instead of guessing. It can also save what you agree on: a practice plan, your week on the practice calendar, a tempo goal, a song on your list, a new exercise with its tab, or a session you played away from the app. riff.quest doesn't run any AI for this. All the thinking happens in your assistant, and riff.quest only hands it your data and saves the changes you approve.

It's a supporter perk: any donation to riff.quest unlocks it for your account, while practising and everything else stays free for everyone. [Become a supporter](/supporter) and you can connect right away, and cut the connection off at any moment.

## Connecting Claude

Add the connector once, in Claude on the web or in the Claude desktop app. After that it works in the Claude mobile app too.

<StepList steps="Copy the server address::In riff.quest, open Settings and the AI assistants tab. The Server address at the top has a Copy button next to it|Add it as a connector in Claude::In Claude, open Settings, then Connectors, and choose Add custom connector. Give it a name, paste the address and add it|Sign in::Claude sends you to a riff.quest page. Sign in if you aren't already|Decide what it may do::The page says which app is asking and where you'll be sent back. Reading your practice is always included; switch on Allow changes if you want it to save plans, calendar days, goals, songs, exercises and practice time too. Press Allow|Ask away::Back in Claude, start a new chat and ask about your practice. By default, Claude asks before each change it wants to save" />

<ClickPath steps="Settings|AI assistants" caption="Where the server address lives, and where you come back later to see or disconnect your apps." />

<BlogAlert type="info">
The address is `https://riff.quest/api/mcp`, the same for everyone. Your account comes from signing in, not from the address, so there's nothing secret about it.
</BlogAlert>

## Other AI apps

Any app that supports remote MCP connectors, such as ChatGPT, Cursor or Claude Code, takes the same address. If the app offers to sign in, use that: you get the same riff.quest page as above. If it only accepts a fixed key, create one under **AI assistants → New token**, name it after the app, choose whether it may make changes, and copy it straight away, because it's shown only once.

## What it can do

<Checklist items="Read your progress::Your profile, practice history, calendar (what you played and what you planned), skills, weak spots, tempo goals, your song lists and recent scored runs|Browse the library::Exercises, songs, the exercise of the day, the monthly challenge and this wiki|Plan with you::Create and edit practice plans, fill in or rearrange your practice calendar, add songs to your list, and set or adjust tempo goals|Log your practice::Note down a session you played without the app, split by category, skill or song. It earns points, Fame and keeps your streak, just like logging it yourself|Write exercises::Turn a tab into an exercise of your own, check it, preview it with playback and fix it later" />

It can't touch anything outside your own account. It doesn't see other players' data, can't post anything, and can't join rankings, guilds or duels on your behalf. Exercises it creates are private to you.

<BlogAlert type="tip">
Some things to try: "Review my last week of practice", "Plan a 30-minute session around my weakest skill", "Set up my practice week in the calendar, 40 minutes a day, rest on Sunday", "Set a goal of 140 BPM on my alternate picking exercise", "Log 40 minutes: 20 on alternate picking and 20 on Back in Black", or paste a riff and ask "make this an exercise I can practise".
</BlogAlert>

## Limits

<StatRow stats="35:changes a day|10:new exercises a day|60:requests a minute" />

Reading never counts against the daily limit. Every change the assistant saves tells it how many are left today, so it can warn you before you run out.

## What happens to your data

The assistant only gets what it asks riff.quest for in your conversation, and only while it's connected. Whatever it receives becomes part of that chat, so from there your AI provider's own privacy rules apply. riff.quest stores the connection itself (which app, when you connected, what it's allowed to do) so it can show it to you and cut it off. The full details are in the [privacy policy](/privacy-policy).

## Disconnecting

Open **Settings → AI assistants**. Apps you signed in to are listed under **Connected apps**; **Disconnect** stops them on the spot. Keys you created by hand are under **Your tokens**, where **Revoke** does the same. Removing the connector inside Claude as well keeps your list of connectors tidy, but the riff.quest side is what actually ends access.

## Questions people ask

<FaqList items="Do I need to be a supporter?::Yes, any donation unlocks it. Everything else in riff.quest stays free. Without the badge, the riff.quest sign-in page won't let you connect, and a connection made earlier stops working until the badge is back|Is this the same as the AI coach?::No. The AI coach lives inside riff.quest. This lets an assistant you already use read your account, and riff.quest runs no AI for it|Will it change things without asking?::By default Claude asks before each change, unless you tell it to always allow that kind. If you never switched on Allow changes, it can only read|Can it see my password or email?::No. It sees your practice data, never your password, and it can't change your account settings|Can other players see what I build with it?::No. Exercises and plans it saves are private to you|Does a session it logs count for quests?::It counts for points, Fame, your streak and time per skill, but quest progress only moves for sessions you log in riff.quest itself|Can it log a really long session?::Anything over 6 hours, or longer than the time since your last log, it has to check with you first, the same warning the app shows|I hit the daily limit::Changes reset the next day. Reading still works in the meantime|It says the connection isn't valid::Remove the connector in your AI app and add it again. If you disconnected it in riff.quest, you have to sign in again anyway" />

<ReadNext links="Practice plans & Auto Plan::/wiki/exercise-plans-and-auto-plan|Exercise goals::/wiki/exercise-goals|AI coach & weekly milestones::/wiki/ai-coach-and-weekly-milestones|Ways to practise::/wiki/practice-modes-overview" />
