---
title: "La app de escritorio"
description: "Qué añade la app de Windows, macOS y Linux frente a la web: entrada de guitarra directa desde tu interfaz, menor latencia y algunas cosas que una pestaña del navegador simplemente no puede hacer."
slug: "desktop-app"
section: "Practice"
order: 5
---

riff.quest funciona perfectamente en un navegador, y nada de este artículo es necesario para practicar, registrar sesiones o subir en las clasificaciones. La app de escritorio existe por una sola razón: un navegador es un mal sitio donde enchufar una guitarra. Todo lo del audio mejora en cuanto la app habla directamente con tu interfaz.

Es la misma cuenta y los mismos datos. Registra una sesión en el escritorio y un segundo después está en el navegador de tu móvil.

## Conseguirla

En la parte inferior del menú de la izquierda hay una tarjeta **Descarga la app de escritorio**. Está en la web y desaparece cuando ejecutas la app, que es una forma decente de saber en cuál estás.

**Todo el sentido de instalarla es que el audio se siente mejor.** El navegador pasa tu guitarra por varias capas de fontanería de micrófono antes de que riff.quest llegue siquiera a verla; la app abre tu interfaz ella misma, a través del controlador. Cambian dos cosas, y son el motivo para molestarse:

- **Va más fluida.** Menos cortes, menos momentos en que la detección se atasca a mitad de pasada y no sabes si fuiste tú o el software.
- **La latencia baja.** No a cero —ningún ordenador lo consigue—, pero lo bastante como para que el hueco entre tocar una nota y la reacción de la app deje de ser algo que notes mientras tocas.

Todo lo demás de esta página es un extra agradable. Ese es el titular.

### ¿Qué archivo quieres?

Las descargas están en la página de versiones: **[github.com/Michaljapko/riff-quest-releases/releases](https://github.com/Michaljapko/riff-quest-releases/releases)**. Coge la versión más reciente de arriba, abre **Assets** debajo y elige el único archivo que encaje con tu máquina.

<Screenshot src="/images/wiki/desktop-release-assets.webp" alt="La lista Assets de una versión de GitHub, con doce entradas: latest-linux.yml, latest-mac.yml, latest.yml, riff.quest-0.1.7-arm64-mac.zip, riff.quest-0.1.7-arm64.dmg, riff.quest-0.1.7.AppImage, riff.quest-Setup-0.1.7.exe, varios archivos .blockmap y los archivos del código fuente" caption="Más larga de lo necesario. Todo lo que acaba en .yml o .blockmap es maquinaria para el actualizador automático, y Source code es para desarrolladores: tú quieres exactamente uno de los cuatro de abajo." />

<Checklist items="Windows::riff.quest-Setup-[versión].exe — el instalador normal, doble clic y listo|macOS, Apple Silicon::riff.quest-[versión]-arm64.dmg — ábrelo y arrastra la app. El -arm64-mac.zip de al lado contiene exactamente la misma app, para cuando prefieras no montar una imagen de disco|macOS, Intel::No hay. Los Mac Intel se quedan con la web|Linux::riff.quest-[versión].AppImage — márcalo como ejecutable y ejecútalo, sin instalación" />

<BlogAlert type="info">
Ignora todo lo demás de esa lista. Los archivos `.yml` y `.blockmap` son la forma en que la app busca y descarga sus propias actualizaciones más adelante; descargarlos a mano no sirve de nada. **Source code** es el proyecto, no el programa.
</BlogAlert>

<BlogAlert type="warning">
Las versiones no están firmadas con un certificado de pago, así que el primer arranque se detiene: Windows muestra un panel de SmartScreen, donde **Más información → Ejecutar de todos modos** te deja pasar, y macOS rechaza un simple doble clic, donde **clic derecho → Abrir** funciona. Es algo único, por instalación.
</BlogAlert>

<BlogAlert type="tip">
Después se actualiza sola. Cuando se ha descargado una versión nueva recibes un aviso con un botón para reiniciar en ella, así que solo visitas esa página una vez. Las instalaciones muy antiguas acaban dejando de aceptarse y te pedirán que descargues una nueva, así que acepta el reinicio cuando se ofrezca.
</BlogAlert>

## Lo que realmente obtienes

<Checklist items="Entrada directa de guitarra::La app abre tu interfaz de audio ella misma, a través del controlador, en lugar de pasar por la fontanería de micrófono del navegador. Menor latencia, sin baile de permisos, y capta el canal real de la guitarra|Elige bien la entrada::Elige el dispositivo, elige el canal en el que está tu jack y fija el tamaño del búfer. Búfer pequeño, menos retardo. Demasiado pequeño, chasquidos|Tu pantalla se queda despierta::Leer tablaturas mientras tocas significa largos periodos sin teclado ni ratón. La app le dice al sistema que deje en paz la pantalla|Progreso de la sesión en la barra de tareas::El icono del dock o de la barra de tareas se llena a medida que avanza el ejercicio|Acciones rápidas desde la bandeja::Salta directo a Inicio, Mis ejercicios o tu Registro de práctica sin buscar primero la ventana|Una pequeña insignia en tu avatar::Otros jugadores ven un pequeño icono de monitor junto a ti en la franja de conectados. Puramente decorativo" />

## ¿Te compensa?

<StepList steps="Tocas guitarra eléctrica con una interfaz::Sí, sin duda. Es la configuración para la que se construyó todo, y es donde la entrada más fluida y de menor latencia de verdad se nota|Tocas acústica con el micro del portátil::Realmente no. La detección funciona de cualquier forma y ganas muy poco|Practicas en el móvil o en un portátil del trabajo::Quédate en la web. Allí no falta nada de tu progreso|Dejas la app abierta todo el día::Merece la pena por la bandeja, las acciones rápidas y que la pantalla no se atenúe a mitad de ejercicio" />

## Preguntas que la gente hace

<FaqList items="¿La necesito para usar la detección de notas?::No. La detección funciona en el navegador con un micrófono o una interfaz. La app de escritorio solo la hace más rápida y fiable|¿Es una función de pago?::No, la app viene con la cuenta|¿Practicar en la app cuenta igual?::Idéntico. Los mismos puntos, la misma racha, las mismas habilidades, las mismas clasificaciones|¿Puedo usar ambas?::Sí, y la mayoría lo hace: la app de escritorio junto a la guitarra, la web en el móvil para mirar las clasificaciones|¿Qué archivo necesito?::Uno por sistema: el .exe en Windows, el .dmg arm64 en un Mac con Apple Silicon, el .AppImage en Linux. Para los Mac Intel no se compila|Mi ordenador dice que la app no es segura::Es la falta de certificado de firma, no un problema con la descarga. Windows: Más información y luego Ejecutar de todos modos. macOS: clic derecho en la app y elegir Abrir|La app dice que es demasiado antigua para ejecutarse::A tu instalación se le pasaron las actualizaciones. Descarga la actual desde el enlace de esa pantalla y conservas todo" />

<ReadNext links="Detección de notas y configuración del micrófono::/wiki/note-detection|Formas de practicar::/wiki/practice-modes-overview|Registrar una sesión de práctica::/wiki/practice-sessions-and-logging|Primeros pasos::/wiki/getting-started" />
