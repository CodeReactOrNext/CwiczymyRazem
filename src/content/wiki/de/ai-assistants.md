---
title: "Claude oder einen anderen KI-Assistenten verbinden"
description: "Verbinde Claude, ChatGPT oder Cursor mit deinem riff.quest-Konto, damit er dein Üben liest, deine nächste Session plant und Übungen mit Tabs für dich schreibt."
slug: "ai-assistants"
section: "Practice"
order: 6
---

riff.quest kann mit dem KI-Assistenten reden, den du ohnehin benutzt. Verbinde Claude (oder eine andere App, die Konnektoren unterstützt) mit deinem Konto und frag zum Beispiel „was vernachlässige ich diesen Monat?“ oder „schreib mir eine Legato-Übung in a-Moll mit 90 BPM“, und die Antwort kommt aus deiner echten Übungshistorie statt aus Raterei. Er kann auch speichern, worauf ihr euch einigt: einen Übungsplan, ein Tempoziel, einen Song auf deiner Liste, eine neue Übung mit Tab oder eine Session, die du ohne die App gespielt hast. riff.quest lässt dafür keine KI laufen. Das ganze Denken passiert in deinem Assistenten; riff.quest reicht ihm nur deine Daten und speichert die Änderungen, die du erlaubst.

Es ist ein Supporter-Vorteil: Jede Spende an riff.quest schaltet ihn für dein Konto frei, Üben und alles andere bleibt für alle kostenlos. [Werde Supporter](/supporter), dann kannst du sofort verbinden und die Verbindung jederzeit kappen.

## Claude verbinden

Den Konnektor fügst du einmal hinzu, in Claude im Browser oder in der Claude-Desktop-App. Danach funktioniert er auch in der Claude-App fürs Handy.

<StepList steps="Serveradresse kopieren::Öffne in riff.quest die Einstellungen und den Tab AI assistants. Neben der Serveradresse oben steht ein Kopieren-Button|Als Konnektor in Claude hinzufügen::Öffne in Claude die Einstellungen, dann Konnektoren, und füge einen eigenen Konnektor hinzu. Gib ihm einen Namen, füge die Adresse ein und bestätige|Anmelden::Claude schickt dich auf eine riff.quest-Seite. Melde dich an, falls du es noch nicht bist|Festlegen, was er darf::Die Seite zeigt, welche App fragt und wohin du zurückkommst. Lesen ist immer dabei; schalte Änderungen erlauben ein, wenn er auch Pläne, Ziele, Songs, Übungen und Übungszeit speichern soll. Drück Erlauben|Loslegen::Zurück in Claude startest du einen neuen Chat und fragst nach deinem Üben. Standardmäßig fragt Claude vor jeder Änderung, die er speichern will" />

<ClickPath steps="Einstellungen|AI assistants" caption="Hier steht die Serveradresse, und hierher kommst du später zurück, um deine Apps zu sehen oder zu trennen." />

<BlogAlert type="info">
Die Adresse ist `https://riff.quest/api/mcp`, für alle dieselbe. Dein Konto ergibt sich aus der Anmeldung, nicht aus der Adresse, also ist an ihr nichts geheim.
</BlogAlert>

## Andere KI-Apps

Jede App, die Remote-MCP-Konnektoren unterstützt, etwa ChatGPT, Cursor oder Claude Code, nimmt dieselbe Adresse. Bietet die App eine Anmeldung an, nimm sie: Du landest auf derselben riff.quest-Seite wie oben. Akzeptiert sie nur einen festen Schlüssel, erstell einen unter **AI assistants → Neues Token**, benenne ihn nach der App, entscheide, ob sie Änderungen machen darf, und kopiere ihn sofort, denn er wird nur einmal angezeigt.

## Was er kann

<Checklist items="Deinen Fortschritt lesen::Profil, Übungshistorie, Kalender, Skills, Schwachstellen, Tempoziele und die letzten bewerteten Durchläufe|Die Bibliothek durchsuchen::Übungen, Songs, die Übung des Tages, die Monats-Challenge und dieses Wiki|Mit dir planen::Übungspläne anlegen und bearbeiten, Songs zu deiner Liste hinzufügen, Tempoziele setzen und anpassen|Dein Üben eintragen::Eine Session, die du ohne die App gespielt hast, nach Kategorie, Skill oder Song aufgeteilt eintragen. Sie bringt Punkte und Fame und hält deine Serie, genau wie ein selbst eingetragener Bericht|Übungen schreiben::Aus einem Tab eine eigene Übung machen, sie prüfen, mit Wiedergabe ansehen und später korrigieren" />

Außerhalb deines Kontos fasst er nichts an. Er sieht keine Daten anderer Spieler, kann nichts veröffentlichen, und er meldet dich weder für Ranglisten noch für Gilden oder Duelle an. Übungen, die er anlegt, sind privat.

<BlogAlert type="tip">
Zum Ausprobieren: „Fass meine letzte Übungswoche zusammen“, „Plane eine 30-Minuten-Session um meinen schwächsten Skill“, „Setz ein Ziel von 140 BPM für meine Wechselschlag-Übung“, „Trag 40 Minuten ein: 20 Wechselschlag und 20 Back in Black“, oder füg ein Riff ein und frag „mach daraus eine Übung“.
</BlogAlert>

## Limits

<StatRow stats="20:Änderungen pro Tag|10:neue Übungen pro Tag|60:Anfragen pro Minute" />

Lesen zählt nie zum Tageslimit. Jede gespeicherte Änderung sagt dem Assistenten, wie viele heute noch übrig sind, damit er dich vorwarnen kann.

## Was mit deinen Daten passiert

Der Assistent bekommt nur, was er in deinem Chat bei riff.quest anfragt, und nur solange er verbunden ist. Was er erhält, wird Teil dieses Chats, ab da gelten also die Datenschutzregeln deines KI-Anbieters. riff.quest speichert die Verbindung selbst (welche App, wann verbunden, was sie darf), um sie dir zu zeigen und kappen zu können. Alle Details stehen in der [Datenschutzerklärung](/privacy-policy).

## Trennen

Öffne **Einstellungen → AI assistants**. Apps, bei denen du dich angemeldet hast, stehen unter **Verbundene Apps**; **Trennen** stoppt sie sofort. Von Hand erstellte Schlüssel stehen unter **Deine Tokens**, wo **Widerrufen** dasselbe tut. Den Konnektor auch in Claude zu entfernen hält die Liste ordentlich, aber den Zugriff beendet die riff.quest-Seite.

## Häufige Fragen

<FaqList items="Muss ich Supporter sein?::Ja, jede Spende schaltet es frei. Alles andere in riff.quest bleibt kostenlos. Ohne Abzeichen lässt dich die riff.quest-Anmeldeseite nicht verbinden, und eine frühere Verbindung funktioniert erst wieder, wenn das Abzeichen zurück ist|Ist das dasselbe wie der AI Coach?::Nein. Der AI Coach steckt in riff.quest. Hier liest ein Assistent, den du schon nutzt, dein Konto, und riff.quest lässt dafür keine KI laufen|Ändert er etwas, ohne zu fragen?::Standardmäßig fragt Claude vor jeder Änderung, außer du erlaubst sie ihm dauerhaft. Hast du Änderungen erlauben nie eingeschaltet, kann er nur lesen|Sieht er mein Passwort oder meine E-Mail?::Nein. Er sieht deine Übungsdaten, nie dein Passwort, und kann keine Kontoeinstellungen ändern|Sehen andere Spieler, was ich damit baue?::Nein. Übungen und Pläne, die er speichert, sind privat|Zählt eine eingetragene Session für Quests?::Sie zählt für Punkte, Fame, deine Serie und die Zeit pro Skill, aber Quest-Fortschritt gibt es nur für Sessions, die du in riff.quest selbst einträgst|Kann er eine sehr lange Session eintragen?::Alles über 6 Stunden oder länger als die Zeit seit deinem letzten Eintrag muss er erst mit dir abklären, dieselbe Warnung, die auch die App zeigt|Ich habe das Tageslimit erreicht::Änderungen gibt es am nächsten Tag wieder. Lesen geht in der Zwischenzeit weiter|Er sagt, die Verbindung sei ungültig::Entferne den Konnektor in deiner KI-App und füge ihn neu hinzu. Hast du ihn in riff.quest getrennt, musst du dich ohnehin neu anmelden" />

<ReadNext links="Übungspläne & Auto Plan::/wiki/exercise-plans-and-auto-plan|Übungsziele::/wiki/exercise-goals|AI Coach & wöchentliche Meilensteine::/wiki/ai-coach-and-weekly-milestones|Wege zu üben::/wiki/practice-modes-overview" />
