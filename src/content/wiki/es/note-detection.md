---
title: "Detección de notas y configuración del micrófono"
description: "Cómo escucha la app tu guitarra, qué ejercicios la usan, la calibración que la hace precisa y qué hacer cuando no oye nada."
slug: "note-detection"
section: "Practice"
order: 4
---

Algunos ejercicios no se limitan a mostrarte qué tocar, lo comprueban. Activa **Detección** y la app escucha tu guitarra a través de un micrófono o una interfaz de audio, averigua qué nota salió y la puntúa frente a lo que había en pantalla. Es la diferencia entre un ejercicio que tachas y un ejercicio que discute contigo.

<ClickPath steps="Práctica|cualquier ejercicio|Detección" caption="El botón está junto a los controles de reproducción y se pone verde mientras la app escucha." />

<BlogAlert type="info">
Nada de esto es obligatorio. Todo ejercicio se puede practicar con la detección desactivada, y tus puntos vienen del tiempo que registras, no de lo preciso que tocaste. La detección cambia el ejercicio, no la recompensa.
</BlogAlert>

## Lo que realmente puede oír

<Checklist items="Ejercicios con tablatura::Cada nota que tocas se compara con la nota que correspondía y se ilumina como acierto o fallo al pasar el cursor|Patrones de rasgueo::Escucha el ataque en lugar de la altura, así que los golpes hacia abajo, hacia arriba y silenciados caen en el hueco correcto|Caza de notas::Se te da el nombre de una nota y tienes que encontrar todas sus octavas en el mástil. Tocar una la marca como encontrada|Caza de acordes::La misma idea con un acorde: toca sus notas en cualquier parte del diapasón hasta que todas estén marcadas|Entrenamiento auditivo::La app toca una frase y tú la devuelves en la guitarra en lugar de hacer clic en una respuesta" />

Hay dos cosas que deliberadamente no escucha. Los ejercicios de mástil en los que se te pide **hacer clic** en la nota de la pantalla funcionan con ratón o dedo, a propósito, para que se puedan usar en el tren. Y toda caza tiene una salida manual: puedes marcar tú mismo una octava o una nota del acorde y pasar al siguiente objetivo cuando la hayas encontrado, que es como funcionan las cazas con el micrófono apagado.

## No es el juez. Tus oídos lo son.

Vale la pena ser contundente con esto, porque las marcas verdes son persuasivas y no deberían serlo.

Todo lo que hace la app es medir la altura. No tiene opinión sobre si sonaste bien. Una nota tocada con un tono muerto y ahogado, arrastrada medio tiempo tarde, con otras tres cuerdas zumbando debajo, es un **acierto** en lo que a la detección respecta: oyó la frecuencia correcta. Eso no es lo mismo que tocarla bien.

También se la engaña en ambas direcciones:

<Checklist items="Te da notas que no tocaste::Una cuerda al aire sonando, un armónico o la cola de la nota anterior pueden caer en la altura que esperaba y marcar la casilla por ti|Se pierde notas que tocaste limpias::Pasajes rápidos, mucha distorsión, un micro de sala, un Si grave: todo realmente difícil de leer, y nada de ello es culpa tuya|No puede oír la mayor parte de lo que importa::Mide el tiempo de tus ataques y, en los ejercicios de bending, comprueba cuánto se acerca cada bending a la altura. La dinámica, el timbre y si la frase respiró no se miden en absoluto, así que nada de eso aparece en la puntuación" />

Así que trata la puntuación como tratarías un metrónomo: una segunda opinión útil sobre una pregunta estrecha, no un veredicto sobre tu forma de tocar. Si tu oído dice que una pasada fue descuidada y la pantalla dice 98 %, **tu oído tiene razón**. Si la pantalla dice que fallaste una nota que sabes que clavaste, tócala otra vez y escucha: si sonó bien, estuvo bien, y el software se equivocó.

<BlogAlert type="important">
La detección es una herramienta para pillar notas equivocadas cuando aprendes algo nuevo y aún no oyes tus propios errores. No sustituye a aprender a oírlos. El objetivo es necesitarla cada vez menos con el tiempo, no perseguir un porcentaje más alto.
</BlogAlert>

## Qué puntúa un resultado de ejercicio

Cada nota que oye la app es un acierto. Lo que vale un acierto depende de lo que trate el ejercicio.

**En la mayoría de los ejercicios, el timing.** Una nota en el pulso conserva todos sus puntos, una algo fuera conserva dos tercios y una claramente fuera del pulso conserva un tercio. Una pequeña flecha bajo la nota muestra hacia qué lado la fallaste: a la izquierda si fuiste pronto, a la derecha si tarde. El resumen tras la pasada te dice hacia qué lado te inclinas en general.

**En los ejercicios de bending, la altura.** Cada nota se juzga por lo afinada que está. Un bending o un soltado cuenta según lo cerca que llega de la nota a la que apunta, y una nota sostenida según dónde se sitúa mientras suena, así que apretar demasiado y subirte se nota. Justo en la altura conserva todo, un poco fuera conserva dos tercios y más lejos conserva un tercio. El timing no cuesta nada ahí. Las flechas bajo las notas aún lo muestran, pero el resumen tras la pasada trata de la altura y te dice si tus notas tienden a quedar bajas o altas.

Mientras suena una nota, un pequeño afinador encima muestra dónde está la cuerda: el punto queda en la banda verde cuando estás afinado y la propia nota se rellena de verde, ámbar o naranja en consecuencia. Una nota que acabó fuera conserva su lectura, por ejemplo +28¢ con una flecha hacia arriba para alta. Mientras haces el bending, una curva junto a la nota se va llenando a medida que sube la cuerda y se pone verde cuando alcanzas la altura.

El gráfico bajo el resumen muestra cada nota de la pasada en orden: a qué distancia del pulso cayó cada una, o de su altura en los ejercicios de bending, con la banda verde marcando la nota máxima. Una pasada que empieza ajustada y se desvía a medida que se cansa tu mano se ve ahí de inmediato.

Si todas las notas se inclinan hacia el mismo lado en una cantidad parecida, lo normal es que sea el retardo del audio y no tus manos. Con el micrófono activado, pulsa **Calibrar el tempo** junto a la puntuación sobre la tablatura y toca siguiendo unos cuantos clics. La app mide el retardo de tus altavoces o interfaz y puntúa contra él a partir de entonces. Después, un mapa muestra dónde cayó cada pulsación respecto a su clic, y puedes quedarte con el resultado con **Está bien** o tocar otra vez.

## Configurarlo

La primera vez que un ejercicio lo necesita, recibes un aviso de **Seguimiento por micrófono** con **Activar micrófono** y **Saltar**. Elegir activar ejecuta la **Calibración de la guitarra**, un breve asistente que solo hay que hacer una vez por configuración.

<StepList steps="¿Cómo está conectada la guitarra?::Interfaz de audio si está enchufada a una caja USB o Thunderbolt, Micrófono si tocas acústica en un micro de portátil o USB|Concede acceso::El navegador pregunta una vez. Di que sí, o nada de lo que sigue funciona|Fija el nivel::Un medidor de Nivel de señal se pone verde cuando estás lo bastante fuerte. Arrastra la ganancia o deja que el ajuste automático te escuche tocar y elija|Toca cada cuerda::Se te piden las seis, una a una, para que la app aprenda cuánto se aleja tu guitarra del tono de concierto y deje de llamar Fa# a un Sol ligeramente bajo|Confirma::El resumen muestra el desvío medido por cuerda. Eso es todo, guardado" />

<BlogAlert type="tip">
Calibra en la sala y con el equipo en el que realmente practicas. Una calibración hecha con auriculares en un piso tranquilo no es la que quieres con un ampli ruidoso.
</BlogAlert>

## Las herramientas del micrófono

Junto al botón Detección hay una pequeña flecha con las cosas que necesitas de vez en cuando y no a diario.

<Screenshot src="/images/wiki/pitch-detect-tools.webp" alt="La barra de herramientas de la sesión: un botón de afinación que dice Half Step Down, un botón verde Detección y un menú abierto con Recalibrar, Afinador y «¿No funciona el micrófono?»" caption="Detección se pone verde mientras la app escucha. El botón de afinación está a su izquierda y muestra la afinación en la que estés." maxWidth="520px" />

<Checklist items="Recalibrar::Vuelve a ejecutar el asistente. Es el arreglo para casi toda queja de «oye la nota equivocada» tras cambiar de guitarra, sala o interfaz|Afinador::Un afinador de verdad, sin salir del ejercicio|¿No funciona el micrófono?::Una lista de solución de problemas más un botón que borra la configuración de micrófono guardada para que empieces de cero" />

## La afinación importa más de lo que crees

La detección compara lo que oye con lo que espera, así que tiene que saber cómo está afinada tu guitarra. El botón de afinación de la misma fila cubre **Standard**, **Drop D**, **Half Step Down**, **Whole Step Down**, **Drop C#/Db**, **Drop C**, **Open D**, **Open G** y **DADGAD**, y los objetivos se desplazan en consecuencia, así que tocar donde tocarías de forma natural sigue contando.

<BlogAlert type="warning">
Algunos ejercicios bloquean la afinación, porque el ejercicio solo tiene sentido en la afinación para la que se escribió. Cuando está bloqueada, el botón lo dice en lugar de abrirse.
</BlogAlert>

## Cuando no es opcional

Los exámenes de la Ruta de aprendizaje que puntúan tu forma de tocar exigen la detección y no te dejan saltarte el aviso: el módulo no puede calificarte en algo que no puede oír. En cualquier otro sitio, saltarlo es una forma normal y admitida de usar la app.

## Cuando no oye nada

<Checklist items="Otra cosa tiene el micrófono::Zoom, Discord, OBS, una segunda pestaña del navegador. Solo una app a la vez recibe una entrada de baja latencia, así que cierra las demás|Está seleccionada la entrada equivocada::Pon el dispositivo correcto como predeterminado del sistema y recarga|El sistema lo está bloqueando::Windows y macOS tienen una pantalla de privacidad para el acceso al micrófono, y tu navegador tiene que estar permitido ahí además de en el sitio|Demasiado bajo o demasiado fuerte::Un susurro y un muro de distorsión son igual de difíciles de leer. Apunta a la banda verde del medidor de nivel|Desafinada::La detección es una comparación de alturas. Ejecuta primero el Afinador y luego Recalibrar" />

<BlogAlert type="takeaway">
Si la detección te da guerra más de un par de minutos, apágala y sigue tocando. Una sesión registrada con el micrófono apagado vale exactamente lo mismo que una con él encendido.
</BlogAlert>

## Preguntas que la gente hace

<FaqList items="¿Necesito una interfaz de audio?::No. El micrófono de un portátil funciona para la mayoría de los ejercicios. Una interfaz es más limpia, silenciosa y rápida, y la app de escritorio la hace aún más rápida|¿La detección cambia mis puntos?::No. Los puntos vienen del tiempo que registras y de tus hábitos saludables. La precisión afecta a la puntuación propia del ejercicio y a sus estrellas, no a tu nivel|¿Por qué se pierde notas que definitivamente toqué?::Normalmente es calibración o afinación. Reafina y luego Recalibrar. Los pasajes rápidos con un tono distorsionado por un micro de sala también son realmente difíciles de leer|¿Puedo usarla en el móvil?::Sí, la vía del micrófono del navegador funciona en móvil, aunque un teléfono en una sala ruidosa es el caso más difícil que existe|También oye mi ampli o la base::Lo hará. Toca con auriculares donde puedas y mantén silenciosa la sala durante las cazas|¿Puedo practicar un ejercicio de micrófono sin micrófono?::Sí. Las cazas te dejan marcar a mano lo que has encontrado y seguir, y los ejercicios con tablatura simplemente se reproducen sin puntuación" />

<ReadNext links="Formas de practicar::/wiki/practice-modes-overview|La app de escritorio::/wiki/desktop-app|Rutinas de práctica y Plan automático::/wiki/exercise-plans-and-auto-plan|Ruta de aprendizaje y Mapa de escalas::/wiki/journey-and-scale-tree" />
