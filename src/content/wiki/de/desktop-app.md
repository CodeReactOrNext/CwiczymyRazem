---
title: "Die Desktop-App"
description: "Was die Windows-, macOS- und Linux-App gegenüber der Website ergänzt: Gitarreneingang direkt vom Interface, geringere Latenz und ein paar Dinge, die ein Browser-Tab schlicht nicht kann."
slug: "desktop-app"
section: "Practice"
order: 5
---

riff.quest läuft im Browser völlig problemlos, und nichts in diesem Artikel ist nötig, um zu üben, Sessions einzutragen oder in den Ranglisten aufzusteigen. Die Desktop-App gibt es aus einem einzigen Grund: Ein Browser ist ein schlechter Ort, um eine Gitarre anzuschließen. Alles am Audio wird besser, sobald die App direkt mit deinem Interface spricht.

Es ist dasselbe Konto und dieselben Daten. Trag eine Session am Desktop ein, und sie ist eine Sekunde später im Browser auf deinem Handy.

## Sie besorgen

Unten im linken Menü gibt es eine Karte **Desktop-App holen**. Sie ist auf der Website da und verschwindet, sobald du die App ausführst, was eine brauchbare Art ist zu erkennen, in welcher du gerade bist.

**Der ganze Sinn der Installation ist, dass sich das Audio besser anfühlt.** Der Browser reicht deine Gitarre durch mehrere Schichten Mikrofon-Installation, bevor riff.quest sie überhaupt sieht; die App öffnet dein Interface selbst, über den Treiber. Zwei Dinge ändern sich, und sie sind der Grund, sich die Mühe zu machen:

- **Es läuft flüssiger.** Weniger Aussetzer, weniger Momente, in denen die Erkennung mitten im Durchlauf hängt und du nicht weißt, ob du es warst oder die Software.
- **Die Latenz sinkt.** Nicht auf null — das schafft kein Computer —, aber weit genug, dass die Lücke zwischen dem Spielen einer Note und der Reaktion der App nichts mehr ist, was du beim Spielen bemerkst.

Alles andere auf dieser Seite ist ein nettes Extra. Das ist die Schlagzeile.

### Welche Datei willst du?

Downloads liegen auf der Releases-Seite: **[github.com/Michaljapko/riff-quest-releases/releases](https://github.com/Michaljapko/riff-quest-releases/releases)**. Nimm das neueste Release oben, öffne darunter **Assets** und wähle die eine Datei, die zu deinem Rechner passt.

<Screenshot src="/images/wiki/desktop-release-assets.webp" alt="Die Assets-Liste eines GitHub-Releases mit zwölf Einträgen: latest-linux.yml, latest-mac.yml, latest.yml, riff.quest-0.1.7-arm64-mac.zip, riff.quest-0.1.7-arm64.dmg, riff.quest-0.1.7.AppImage, riff.quest-Setup-0.1.7.exe, mehrere .blockmap-Dateien und die Quellcode-Archive" caption="Länger als nötig. Alles, was auf .yml oder .blockmap endet, ist Maschinerie für den Auto-Updater, und Source code ist für Entwickler — du willst genau eine der vier unten." />

<Checklist items="Windows::riff.quest-Setup-[Version].exe — der normale Installer, Doppelklick und fertig|macOS, Apple Silicon::riff.quest-[Version]-arm64.dmg — öffnen und die App hinüberziehen. Die daneben liegende -arm64-mac.zip enthält genau dieselbe App, falls du kein Disk-Image einbinden möchtest|macOS, Intel::Gibt es nicht. Intel-Macs bleiben bei der Website|Linux::riff.quest-[Version].AppImage — als ausführbar markieren und starten, keine Installation" />

<BlogAlert type="info">
Ignoriere alles andere auf dieser Liste. Die `.yml`- und `.blockmap`-Dateien sind die Art, wie die App später nach Updates sucht und sie lädt; sie von Hand herunterzuladen bringt nichts. **Source code** ist das Projekt, nicht das Programm.
</BlogAlert>

<BlogAlert type="warning">
Die Builds sind nicht mit einem bezahlten Zertifikat signiert, der erste Start wird also gestoppt: Windows zeigt ein SmartScreen-Fenster, wo dich **Weitere Informationen → Trotzdem ausführen** durchbringt, und macOS verweigert einen einfachen Doppelklick, wo **Rechtsklick → Öffnen** funktioniert. Es ist einmalig, pro Installation.
</BlogAlert>

<BlogAlert type="tip">
Danach aktualisiert sie sich selbst. Wenn eine neue Version heruntergeladen ist, bekommst du einen Hinweis mit einer Schaltfläche zum Neustart darin, du besuchst diese Seite also nur einmal. Sehr alte Installationen werden irgendwann nicht mehr akzeptiert und bitten dich, eine frische herunterzuladen, nimm den Neustart also an, wenn er angeboten wird.
</BlogAlert>

## Was du tatsächlich bekommst

<Checklist items="Direkter Gitarreneingang::Die App öffnet dein Audio-Interface selbst, über den Treiber, statt durch die Mikrofon-Installation des Browsers zu gehen. Geringere Latenz, kein Berechtigungstanz, und sie greift den tatsächlichen Gitarrenkanal ab|Den Eingang richtig wählen::Wähle das Gerät, wähle den Kanal, an dem dein Klinkenstecker steckt, und stell die Puffergröße ein. Kleiner Puffer, weniger Verzögerung. Zu klein, Knistern|Dein Bildschirm bleibt wach::Tabs beim Spielen zu lesen bedeutet lange Zeiten ohne Tastatur oder Maus. Die App sagt dem System, das Display in Ruhe zu lassen|Sessionfortschritt in der Taskleiste::Das Dock- oder Taskleistensymbol füllt sich, während die Übung läuft|Schnellaktionen aus dem Tray::Spring direkt zu Start, Meine Übungen oder deinem Übungsprotokoll, ohne erst das Fenster zu suchen|Ein kleines Abzeichen an deinem Avatar::Andere Spieler sehen ein kleines Monitor-Symbol neben dir in der Online-Leiste. Rein zur Zierde" />

## Lohnt es sich für dich?

<StepList steps="Du spielst E-Gitarre über ein Interface::Ja, ganz klar. Das ist das Setup, für das das Ganze gebaut wurde, und dort zeigt sich der flüssigere Eingang mit geringerer Latenz wirklich|Du spielst Akustik in ein Laptop-Mikrofon::Eher nicht. Die Erkennung funktioniert so oder so, und du gewinnst sehr wenig|Du übst auf dem Handy oder einem Firmenlaptop::Bleib bei der Website. Dort fehlt nichts von deinem Fortschritt|Du lässt die App den ganzen Tag offen::Lohnt sich für den Tray, die Schnellaktionen und den Bildschirm, der mitten in der Übung nicht abdunkelt" />

## Fragen, die Leute stellen

<FaqList items="Brauche ich sie für die Notenerkennung?::Nein. Die Erkennung funktioniert im Browser über ein Mikrofon oder ein Interface. Die Desktop-App macht sie nur schneller und zuverlässiger|Ist es eine kostenpflichtige Funktion?::Nein, die App gehört zum Konto|Zählt Üben in der App genauso?::Identisch. Dieselben Punkte, dieselbe Serie, dieselben Fähigkeiten, dieselben Ranglisten|Kann ich beides nutzen?::Ja, und die meisten tun es: die Desktop-App an der Gitarre, die Website auf dem Handy, um die Ranglisten zu prüfen|Welche Datei brauche ich?::Eine pro System: die .exe unter Windows, die arm64-.dmg auf einem Apple-Silicon-Mac, die .AppImage unter Linux. Für Intel-Macs wird nicht gebaut|Mein Computer sagt, die App sei nicht sicher::Das ist das fehlende Signaturzertifikat, kein Problem mit dem Download. Windows: Weitere Informationen, dann Trotzdem ausführen. macOS: Rechtsklick auf die App und Öffnen wählen|Die App sagt, sie sei zu alt zum Ausführen::Deine Installation hat ihre Updates verpasst. Lade die aktuelle über den Link auf diesem Bildschirm herunter, und du behältst alles" />

<ReadNext links="Notenerkennung & Mikrofon-Einrichtung::/wiki/note-detection|Wege zu üben::/wiki/practice-modes-overview|Eine Übungssession eintragen::/wiki/practice-sessions-and-logging|Erste Schritte::/wiki/getting-started" />
