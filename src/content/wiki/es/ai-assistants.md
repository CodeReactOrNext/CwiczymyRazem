---
title: "Conecta Claude u otro asistente de IA"
description: "Conecta Claude, ChatGPT o Cursor a tu cuenta de riff.quest para que lea tu práctica, planifique tu próxima sesión y escriba ejercicios con tablatura por ti."
slug: "ai-assistants"
section: "Practice"
order: 6
---

riff.quest puede hablar con el asistente de IA que ya usas. Conecta Claude (u otra app que admita conectores) a tu cuenta y pregúntale cosas como «¿qué estoy descuidando este mes?» o «escríbeme un ejercicio de legato en la menor a 90 BPM», y te responderá con tu historial real de práctica en lugar de adivinar. También puede guardar lo que acordéis: un plan de práctica, una meta de tempo, una canción en tu lista, un ejercicio nuevo con su tablatura o una sesión que tocaste fuera de la app. riff.quest no ejecuta ninguna IA para esto. Todo el razonamiento ocurre en tu asistente; riff.quest solo le pasa tus datos y guarda los cambios que apruebes.

Es una ventaja de supporter: cualquier donación a riff.quest la desbloquea para tu cuenta, mientras que practicar y todo lo demás sigue siendo gratis para todos. [Hazte supporter](/supporter) y podrás conectar enseguida, y cortar la conexión cuando quieras.

## Conectar Claude

El conector se añade una vez, en Claude en la web o en la app de escritorio. Después funciona también en la app móvil de Claude.

<StepList steps="Copia la dirección del servidor::En riff.quest, abre Ajustes y la pestaña AI assistants. La dirección del servidor de arriba tiene un botón Copiar al lado|Añádela como conector en Claude::En Claude, abre Ajustes, luego Conectores, y añade un conector personalizado. Ponle un nombre, pega la dirección y añádelo|Inicia sesión::Claude te lleva a una página de riff.quest. Inicia sesión si aún no lo has hecho|Decide qué puede hacer::La página muestra qué app lo pide y adónde volverás. Leer tu práctica siempre va incluido; activa Permitir cambios si quieres que también guarde planes, metas, canciones, ejercicios y tiempo de práctica. Pulsa Permitir|Pregunta::De vuelta en Claude, abre un chat nuevo y pregunta por tu práctica. Por defecto, Claude pregunta antes de cada cambio que quiera guardar" />

<ClickPath steps="Ajustes|AI assistants" caption="Aquí está la dirección del servidor, y aquí vuelves luego para ver o desconectar tus apps." />

<BlogAlert type="info">
La dirección es `https://riff.quest/api/mcp`, la misma para todos. Tu cuenta sale del inicio de sesión, no de la dirección, así que no tiene nada de secreto.
</BlogAlert>

## Otras apps de IA

Cualquier app que admita conectores MCP remotos, como ChatGPT, Cursor o Claude Code, acepta la misma dirección. Si la app ofrece iniciar sesión, úsalo: llegarás a la misma página de riff.quest que arriba. Si solo acepta una clave fija, crea una en **AI assistants → Token nuevo**, ponle el nombre de la app, decide si puede hacer cambios y cópiala enseguida, porque solo se muestra una vez.

## Qué puede hacer

<Checklist items="Leer tu progreso::Tu perfil, historial de práctica, calendario, habilidades, puntos débiles, metas de tempo y tus últimas pasadas puntuadas|Explorar la biblioteca::Ejercicios, canciones, el ejercicio del día, el reto del mes y esta wiki|Planificar contigo::Crear y editar planes de práctica, añadir canciones a tu lista, y fijar o ajustar metas de tempo|Registrar tu práctica::Anotar una sesión que tocaste sin la app, repartida por categoría, habilidad o canción. Da puntos y Fame y mantiene tu racha, igual que si la registraras tú|Escribir ejercicios::Convertir una tablatura en un ejercicio propio, comprobarlo, previsualizarlo con reproducción y corregirlo después" />

No toca nada fuera de tu cuenta. No ve datos de otros jugadores, no puede publicar nada y no te inscribe en rankings, gremios ni duelos. Los ejercicios que crea son privados.

<BlogAlert type="tip">
Para empezar: «Resume mi última semana de práctica», «Planifica una sesión de 30 minutos en torno a mi habilidad más floja», «Pon una meta de 140 BPM en mi ejercicio de púa alterna», «Registra 40 minutos: 20 de púa alterna y 20 de Back in Black», o pega un riff y pide «haz de esto un ejercicio».
</BlogAlert>

## Límites

<StatRow stats="20:cambios al día|10:ejercicios nuevos al día|60:peticiones por minuto" />

Leer nunca cuenta para el límite diario. Cada cambio guardado le dice al asistente cuántos quedan hoy, así puede avisarte antes de que se acaben.

## Qué pasa con tus datos

El asistente solo recibe lo que pide a riff.quest en tu conversación, y solo mientras está conectado. Lo que recibe pasa a formar parte de ese chat, así que desde ahí rigen las normas de privacidad de tu proveedor de IA. riff.quest guarda la conexión en sí (qué app, cuándo la conectaste, qué puede hacer) para poder mostrártela y cortarla. Todos los detalles están en la [política de privacidad](/privacy-policy).

## Desconectar

Abre **Ajustes → AI assistants**. Las apps en las que iniciaste sesión están en **Apps conectadas**; **Desconectar** las detiene al momento. Las claves creadas a mano están en **Tus tokens**, donde **Revocar** hace lo mismo. Quitar también el conector en Claude ordena tu lista de conectores, pero lo que de verdad corta el acceso es el lado de riff.quest.

## Preguntas frecuentes

<FaqList items="¿Tengo que ser supporter?::Sí, cualquier donación lo desbloquea. Todo lo demás en riff.quest sigue siendo gratis. Sin la insignia, la página de inicio de sesión de riff.quest no te deja conectar, y una conexión anterior deja de funcionar hasta que vuelva la insignia|¿Es lo mismo que el AI coach?::No. El AI coach vive dentro de riff.quest. Aquí un asistente que ya usas lee tu cuenta, y riff.quest no ejecuta ninguna IA para ello|¿Cambiará cosas sin preguntar?::Por defecto Claude pregunta antes de cada cambio, salvo que le digas que lo permita siempre. Si nunca activaste Permitir cambios, solo puede leer|¿Ve mi contraseña o mi correo?::No. Ve tus datos de práctica, nunca tu contraseña, y no puede cambiar los ajustes de tu cuenta|¿Verán otros jugadores lo que cree con él?::No. Los ejercicios y planes que guarda son privados|¿Una sesión registrada por el asistente cuenta para las misiones?::Cuenta para puntos, Fame, tu racha y el tiempo por habilidad, pero el progreso de las misiones solo avanza con sesiones registradas en el propio riff.quest|¿Puede registrar una sesión muy larga?::Todo lo que pase de 6 horas, o dure más que el tiempo desde tu último registro, tiene que confirmarlo contigo primero, el mismo aviso que muestra la app|He llegado al límite diario::Los cambios se renuevan al día siguiente. Mientras tanto, leer sigue funcionando|Dice que la conexión no es válida::Quita el conector en tu app de IA y añádelo de nuevo. Si lo desconectaste en riff.quest, tendrás que iniciar sesión otra vez de todos modos" />

<ReadNext links="Planes de práctica y Auto Plan::/wiki/exercise-plans-and-auto-plan|Metas de ejercicio::/wiki/exercise-goals|AI coach e hitos semanales::/wiki/ai-coach-and-weekly-milestones|Formas de practicar::/wiki/practice-modes-overview" />
