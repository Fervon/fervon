#!/usr/bin/env node
/* ============================================================================
   scripts/gen-landing-mac.mjs
   ----------------------------------------------------------------------------
   Genera src-i18n/trace/rewind-alternative-mac.html a partir de la landing de
   Windows, que es la de estructura más parecida.

   POR QUÉ ESTA PÁGINA. Rewind era una app **solo para Mac**. Cuando Meta la
   cerró el 19 de diciembre de 2025, los huérfanos fueron mayoritariamente
   usuarios de macOS — y hasta hoy el sitio tenía landing de Windows pero no de
   Mac, que es donde está el grueso de la demanda. VocAI ya ocupaba ese hueco.

   POR QUÉ NO ES UN CALCO. Dos landings casi idénticas compiten entre sí y
   Google se queda con una. El ángulo aquí es el opuesto al de Windows: allí el
   lector NUNCA pudo usar Rewind; aquí lo usaba y lo ha perdido. Cambian el
   titular, el resumen, las cuatro tarjetas, la tabla comparativa entera
   (Microsoft Recall no existe en Mac: los rivales reales son Limitless y
   Screenpipe) y las cinco preguntas, incluida la del permiso de Grabación de
   Pantalla de macOS, que es la objeción concreta de este público.

   Fail-closed: si algún fragmento a sustituir no aparece —porque la landing de
   Windows cambió— aborta en vez de escribir una página a medias.

   Uso:  npm run landing:mac
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = path.join(ROOT, 'src-i18n/trace/rewind-alternative-windows.html');
const DESTINO = path.join(ROOT, 'src-i18n/trace/rewind-alternative-mac.html');

/* Cada par es [fragmento exacto de la landing de Windows, lo que va en la de Mac].
   El orden importa: los más específicos primero. */
const CAMBIOS = [
  // ---------- head ----------
  ['<title>Rewind alternative for Windows | Trace by Fervon</title>',
   '<title>Rewind alternative for Mac | Trace by Fervon</title>'],

  ['<meta name="description" content="Rewind was Mac-only and Meta shut it down. Trace is the local-first, pay-once Rewind alternative for Windows. No screen recording, no cloud." />',
   '<meta name="description" content="Meta shut Rewind down and Mac users lost their memory app. Trace replaces it on macOS: no screen recording, no cloud, pay once." />'],

  ['<link rel="canonical" href="https://fervon.dev/trace/rewind-alternative-windows" />',
   '<link rel="canonical" href="https://fervon.dev/trace/rewind-alternative-mac" />'],

  ['<meta name="keywords" content="Rewind alternative, Rewind alternative Windows, Rewind AI alternative, local memory app Windows, Microsoft Recall alternative, Screenpipe alternative, on-device activity history, pay-once memory app" />',
   '<meta name="keywords" content="Rewind alternative Mac, Rewind AI alternative macOS, Rewind replacement Mac, local memory app Mac, Apple Silicon memory app, Screenpipe alternative Mac, Limitless alternative, on-device activity history, pay-once memory app" />'],

  ['<meta property="og:title" content="The best Rewind alternative for Windows (local-first, pay-once)" />',
   '<meta property="og:title" content="The Rewind alternative for Mac — local-first, pay once" />'],

  ['<meta property="og:description" content="Rewind AI was Mac-only and Meta shut it down. Trace brings local, searchable memory to Windows — no screen recording, no cloud, no subscription. Pay once." />',
   '<meta property="og:description" content="Rewind was the Mac memory app until Meta closed it. Trace picks it up on macOS — no screen recording, no cloud, no subscription. Pay once." />'],

  ['<meta property="og:url" content="https://fervon.dev/trace/rewind-alternative-windows" />',
   '<meta property="og:url" content="https://fervon.dev/trace/rewind-alternative-mac" />'],

  // ---------- breadcrumb ----------
  ['{ "@type": "ListItem", "position": 3, "name": "Rewind alternative for Windows", "item": "https://fervon.dev/trace/rewind-alternative-windows" }',
   '{ "@type": "ListItem", "position": 3, "name": "Rewind alternative for Mac", "item": "https://fervon.dev/trace/rewind-alternative-mac" }'],

  // ---------- FAQ estructurada ----------
  [`        "name": "Is there a Rewind alternative for Windows?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. Trace by Fervon is a local-first personal memory app for Windows, macOS and Linux. It captures lightweight activity history on your own machine so you can search everything you saw, read or did — without the cloud and without a subscription. Trace is currently in waitlist/beta, so you can join the list to be notified when Windows builds are ready." }`,
   `        "name": "Is there a Rewind alternative for Mac?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. Trace by Fervon is a local-first personal memory app that runs natively on macOS, on both Apple Silicon and Intel. It captures lightweight activity history on your own Mac so you can search everything you saw, read or did — without the cloud and without a subscription. Trace is currently in waitlist/beta, so you can join the list to be notified when macOS builds are ready." }`],

  [`        "name": "Did Rewind AI work on Windows?",
        "acceptedAnswer": { "@type": "Answer", "text": "No. Rewind AI was a Mac-only app. There was never an official Rewind build for Windows, which is exactly why Windows users were left without a local memory tool when the app was discontinued." }`,
   `        "name": "Does Trace run on Apple Silicon?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. Trace targets macOS on both Apple Silicon (M-series) and Intel Macs. Because it captures light signals instead of recording video, it does not lean on the GPU or the Neural Engine, so it stays out of the way on a laptop running on battery." }`],

  [`        "name": "How is Trace different from Microsoft Recall?",
        "acceptedAnswer": { "@type": "Answer", "text": "Microsoft Recall is tied to Copilot+ PCs and takes constant snapshots of your screen, which has drawn privacy criticism. Trace runs on any modern Windows PC, captures far less, filters exclusions before anything is written to disk, and is designed to run with your firewall closed." }`,
   `        "name": "Does Trace need macOS Screen Recording permission?",
        "acceptedAnswer": { "@type": "Answer", "text": "No. Trace does not record your screen, so it does not ask for the Screen Recording permission that macOS requires from screen-capture tools. It reads browser history, the active window title and the clipboard, filters your exclusions before anything reaches disk, and is designed to run with your firewall closed." }`],

  // ---------- CSS / JS por página ----------
  ['<link rel="stylesheet" href="rewind-alternative-windows.css?v=20260817d" />',
   '<link rel="stylesheet" href="rewind-alternative-mac.css?v=20260817d" />'],
  ['<script src="rewind-alternative-windows.client.js?v=20260817d" defer></script>',
   '<script src="rewind-alternative-mac.client.js?v=20260817d" defer></script>'],

  // ---------- migas ----------
  // La miga se queda corta a propósito: en móvil comparte fila con el selector
  // de idioma y el botón, y sus hermanas rondan los 20 caracteres.
  ['<span aria-current="page" data-es="Alternativa a Rewind">Rewind alternative</span>',
   '<span aria-current="page" data-es="Rewind en Mac">Rewind on Mac</span>'],

  // ---------- hero ----------
  ['<h1 class="reveal" data-es="¿Buscas una &lt;span class=&quot;grad&quot;&gt;alternativa a Rewind&lt;/span&gt; en Windows?">Looking for a <span class="grad">Rewind alternative</span> on Windows?</h1>',
   '<h1 class="reveal" data-es="Tu Mac se quedó sin &lt;span class=&quot;grad&quot;&gt;Rewind&lt;/span&gt;. Esto es lo que la sustituye.">Your Mac lost <span class="grad">Rewind</span>. This is what replaces it.</h1>'],

  ['<p class="sub reveal" data-es="Rewind AI era solo para Mac, y Meta la cerró. Trace lleva a Windows una memoria local y buscable de tu día — &lt;b&gt;en tu máquina, sin nube, sin suscripción.&lt;/b&gt;">Rewind AI was Mac-only, and Meta shut it down. Trace brings a local, searchable memory of your day to Windows — <b>on your machine, no cloud, no subscription.</b></p>',
   '<p class="sub reveal" data-es="Rewind era LA app de memoria del Mac hasta que Meta la compró y la cerró. Trace retoma la idea en macOS — &lt;b&gt;sin grabar la pantalla, sin nube y sin suscripción.&lt;/b&gt;">Rewind was the Mac memory app until Meta bought it and closed it. Trace picks the idea back up on macOS — <b>no screen recording, no cloud, no subscription.</b></p>'],

  // ---------- resumen ----------
  [`        <li data-es="Rewind AI <b>solo existía para Mac</b>, y además Meta cerró la app de escritorio.">Rewind AI was <b>Mac-only</b>, and on top of that Meta shut the desktop app down.</li>
        <li data-es="<b>Trace</b> corre nativamente en <b>Windows</b> (también en macOS y Linux) con la misma idea."><b>Trace</b> runs natively on <b>Windows</b> (and on macOS and Linux) with the same idea.</li>
        <li data-es="Busca lo que viste y leíste <b>sin grabar la pantalla</b> y sin subir nada a la nube.">It searches what you saw and read <b>without recording your screen</b> and without uploading anything.</li>
        <li data-es="<b>Pago único de $39</b>, sin suscripción y sin cuenta."><b>$39 once</b>, no subscription and no account.</li>`,
   `        <li data-es="Rewind <b>solo existía para Mac</b>, y Meta cerró la app de escritorio el 19 de diciembre de 2025.">Rewind was <b>Mac-only</b>, and Meta shut the desktop app down on 19 December 2025.</li>
        <li data-es="<b>Trace</b> corre nativo en <b>macOS</b>, en Apple Silicon e Intel, con la misma idea."><b>Trace</b> runs natively on <b>macOS</b>, on Apple Silicon and Intel, with the same idea.</li>
        <li data-es="<b>No pide el permiso de Grabación de Pantalla</b>: lee historial, ventana activa y portapapeles, no vídeo."><b>It never asks for Screen Recording permission</b> — it reads history, active window and clipboard, not video.</li>
        <li data-es="<b>Pago único de $39</b>, sin suscripción y sin cuenta."><b>$39 once</b>, no subscription and no account.</li>`],

  // ---------- tarjeta 4 ----------
  ['<h3 data-es="Cualquier PC moderno">Any modern PC</h3><p data-es="Sin Copilot+. Corre ligero.">No Copilot+. Runs light.</p>',
   '<h3 data-es="Apple Silicon e Intel">Apple Silicon &amp; Intel</h3><p data-es="Nativo en macOS. Ligero con la batería.">Native on macOS. Light on battery.</p>'],

  // ---------- comparativa: en Mac los rivales son otros ----------
  ['<h2 data-es="Trace vs Microsoft Recall vs Screenpipe">Trace vs Microsoft Recall vs Screenpipe</h2><p class="desc" data-es="Las tres opciones realistas de memoria local para Windows hoy, lado a lado.">The three realistic local-memory options for Windows today, side by side.</p>',
   '<h2 data-es="Trace vs Limitless vs Screenpipe">Trace vs Limitless vs Screenpipe</h2><p class="desc" data-es="Microsoft Recall no existe en Mac. Estas son las opciones reales para macOS hoy, lado a lado.">Microsoft Recall doesn\'t exist on Mac. These are the real macOS options today, side by side.</p>'],

  ['<thead><tr><th scope="col">&nbsp;</th><th scope="col" class="isus">Trace</th><th scope="col">Microsoft Recall</th><th scope="col">Screenpipe</th></tr></thead>',
   '<thead><tr><th scope="col">&nbsp;</th><th scope="col" class="isus">Trace</th><th scope="col">Limitless</th><th scope="col">Screenpipe</th></tr></thead>'],

  [`            <tr>
              <th scope="row" data-es="Corre en Windows">Runs on Windows</th>
              <td class="isus"><span class="yes" data-es="Sí — cualquier PC moderno">Yes — any modern PC</span></td>
              <td><span class="warn" data-es="Solo PC Copilot+">Copilot+ PC only</span></td>
              <td><span class="yes" data-es="Sí">Yes</span></td>
            </tr>`,
   `            <tr>
              <th scope="row" data-es="Corre en macOS">Runs on macOS</th>
              <td class="isus"><span class="yes" data-es="Sí — Apple Silicon e Intel">Yes — Apple Silicon and Intel</span></td>
              <td><span class="warn" data-es="Se movió a colgante + nube">Moved to a pendant + cloud</span></td>
              <td><span class="yes" data-es="Sí">Yes</span></td>
            </tr>
            <tr>
              <th scope="row" data-es="Permiso de Grabación de Pantalla">Screen Recording permission</th>
              <td class="isus"><span class="yes" data-es="No hace falta">Not required</span></td>
              <td><span class="warn" data-es="No aplica — graba audio">N/A — records audio</span></td>
              <td><span class="no" data-es="Obligatorio">Required</span></td>
            </tr>`],

  [`              <td class="isus"><span class="yes" data-es="Señales ligeras (historial, ventana activa, portapapeles)">Light signals (history, active window, clipboard)</span></td>
              <td><span class="warn" data-es="Capturas constantes de pantalla completa">Constant full-screen snapshots</span></td>`,
   `              <td class="isus"><span class="yes" data-es="Señales ligeras (historial, ventana activa, portapapeles)">Light signals (history, active window, clipboard)</span></td>
              <td><span class="warn" data-es="Audio por colgante, procesado en la nube">Pendant audio, processed in the cloud</span></td>`],

  [`              <td class="isus"><span class="yes" data-es="Sí — funciona con el firewall cerrado">Yes — works firewall-closed</span></td>
              <td><span class="warn" data-es="Local, pero polémico">Local, but controversial</span></td>`,
   `              <td class="isus"><span class="yes" data-es="Sí — funciona con el firewall cerrado">Yes — works firewall-closed</span></td>
              <td><span class="no" data-es="No — depende de la nube">No — cloud-dependent</span></td>`],

  [`              <td class="isus"><span class="yes" data-es="Ligero — sin vídeo 24/7">Light — no 24/7 video</span></td>
              <td><span class="warn" data-es="Capturas constantes">Constant snapshotting</span></td>`,
   `              <td class="isus"><span class="yes" data-es="Ligero — sin vídeo 24/7">Light — no 24/7 video</span></td>
              <td><span class="yes" data-es="Ninguno en el Mac">None on the Mac</span></td>`],

  [`              <td class="isus"><span class="yes" data-es="Pago único $39 (early-bird)">One-time $39 (early-bird)</span></td>
              <td><span class="warn" data-es="Incluido, necesita hardware nuevo">Bundled, needs new hardware</span></td>`,
   `              <td class="isus"><span class="yes" data-es="Pago único $39 (early-bird)">One-time $39 (early-bird)</span></td>
              <td><span class="no" data-es="Suscripción + hardware">Subscription + hardware</span></td>`],

  [`              <td class="isus"><span class="warn" data-es="Beta — únete a la lista">Beta — join the waitlist</span></td>
              <td><span class="yes" data-es="En el mercado (en PC Copilot+)">Shipping (on Copilot+ PCs)</span></td>`,
   `              <td class="isus"><span class="warn" data-es="Beta — únete a la lista">Beta — join the waitlist</span></td>
              <td><span class="warn" data-es="Disponible, ya no como app de Mac">Available, no longer as a Mac app</span></td>`],

  // ---------- lista de espera ----------
  ['<h2 data-es="Sé de los primeros en la beta de Windows">Get the Windows beta first</h2><p class="desc" data-es="Trace aún no se puede descargar. Únete a la lista para conseguir la beta de Windows, fijar el precio lifetime de $39 y ayudar a decidir qué se construye.">Trace isn\'t downloadable yet. Join the waitlist to get the Windows beta, lock in the $39 lifetime price, and help shape what gets built.</p>',
   '<h2 data-es="Sé de los primeros en la beta de macOS">Get the macOS beta first</h2><p class="desc" data-es="Trace aún no se puede descargar. Únete a la lista para conseguir la beta de macOS, fijar el precio lifetime de $39 y ayudar a decidir qué se construye.">Trace isn\'t downloadable yet. Join the waitlist to get the macOS beta, lock in the $39 lifetime price, and help shape what gets built.</p>'],

  ['<input type="hidden" name="origen" value="trace/rewind-alternative-windows" />',
   '<input type="hidden" name="origen" value="trace/rewind-alternative-mac" />'],
  ['<input type="hidden" name="_subject" value="fervon.dev · trace/rewind-alternative-windows" />',
   '<input type="hidden" name="_subject" value="fervon.dev · trace/rewind-alternative-mac" />'],

  // ---------- FAQ visible ----------
  ['<details><summary data-es="¿Hay una alternativa a Rewind para Windows?">Is there a Rewind alternative for Windows?</summary><p data-es="Sí. Trace by Fervon es una app de memoria personal local-first para Windows, macOS y Linux. Captura un historial de actividad ligero en tu propia máquina para que puedas buscar todo lo que viste, leíste o hiciste — sin la nube y sin suscripción. Trace está actualmente en lista de espera/beta, así que puedes unirte a la lista para que te avisemos cuando las builds de Windows estén listas.">Yes. Trace by Fervon is a local-first personal memory app for Windows, macOS and Linux. It captures lightweight activity history on your own machine so you can search everything you saw, read or did — without the cloud and without a subscription. Trace is currently in waitlist/beta, so you can join the list to be notified when Windows builds are ready.</p></details>',
   '<details><summary data-es="¿Hay una alternativa a Rewind para Mac?">Is there a Rewind alternative for Mac?</summary><p data-es="Sí. Trace by Fervon es una app de memoria personal local-first que corre nativa en macOS, tanto en Apple Silicon como en Intel. Captura un historial de actividad ligero en tu propio Mac para que puedas buscar todo lo que viste, leíste o hiciste — sin la nube y sin suscripción. Trace está actualmente en lista de espera/beta, así que puedes unirte a la lista para que te avisemos cuando las builds de macOS estén listas.">Yes. Trace by Fervon is a local-first personal memory app that runs natively on macOS, on both Apple Silicon and Intel. It captures lightweight activity history on your own Mac so you can search everything you saw, read or did — without the cloud and without a subscription. Trace is currently in waitlist/beta, so you can join the list to be notified when macOS builds are ready.</p></details>'],

  ['<details><summary data-es="¿Rewind AI funcionaba en Windows?">Did Rewind AI work on Windows?</summary><p data-es="No. Rewind AI era una app solo para Mac — nunca hubo una build oficial de Rewind para Windows. Por eso exactamente los usuarios de Windows se quedaron sin una herramienta de memoria local, tanto mientras Rewind existía como tras su descontinuación.">No. Rewind AI was a Mac-only app — there was never an official Rewind build for Windows. That\'s exactly why Windows users were left without a local memory tool, both while Rewind existed and after it was discontinued.</p></details>',
   '<details><summary data-es="¿Trace funciona en Apple Silicon?">Does Trace run on Apple Silicon?</summary><p data-es="Sí. Trace apunta a macOS tanto en Apple Silicon (chips M) como en Macs Intel. Como captura señales ligeras en vez de grabar vídeo, no tira de la GPU ni del Neural Engine, así que no molesta en un portátil con batería.">Yes. Trace targets macOS on both Apple Silicon (M-series) and Intel Macs. Because it captures light signals instead of recording video, it doesn\'t lean on the GPU or the Neural Engine, so it stays out of the way on a laptop running on battery.</p></details>'],

  ['<details><summary data-es="¿En qué se diferencia Trace de Microsoft Recall?">How is Trace different from Microsoft Recall?</summary><p data-es="Microsoft Recall está atado a los PC Copilot+ y toma capturas constantes de tu pantalla, lo que recibió críticas de privacidad. Trace funciona en cualquier PC con Windows moderno, captura mucho menos, filtra las exclusiones antes de escribir nada en disco, y está diseñado para correr con el firewall cerrado.">Microsoft Recall is tied to Copilot+ PCs and takes constant snapshots of your screen, which drew privacy criticism. Trace runs on any modern Windows PC, captures far less, filters exclusions before anything is written to disk, and is designed to run with your firewall closed.</p></details>',
   '<details><summary data-es="¿Trace necesita el permiso de Grabación de Pantalla de macOS?">Does Trace need macOS Screen Recording permission?</summary><p data-es="No. Trace no graba tu pantalla, así que no pide el permiso de Grabación de Pantalla que macOS exige a las herramientas de captura. Lee el historial del navegador, el título de la ventana activa y el portapapeles, filtra tus exclusiones antes de que nada llegue al disco, y está diseñado para correr con el firewall cerrado.">No. Trace doesn\'t record your screen, so it never asks for the Screen Recording permission macOS requires from screen-capture tools. It reads browser history, the active window title and the clipboard, filters your exclusions before anything reaches disk, and is designed to run with your firewall closed.</p></details>'],

  // ---------- relacionadas. De paso: los títulos de estas tarjetas estaban en
  // castellano dentro del contenido INGLÉS y sin data-es, así que la versión
  // inglesa los mostraba en español. Aquí van con su data-es como debe ser. ----
  [`        <a class="relcard" href="/trace/rewind-ai-alternative">
          <span class="rt">Alternativa a Rewind AI</span>
          <span class="rd" data-es="Rewind cerró. La sustituta local y multiplataforma.">Rewind is gone. The local, cross-platform replacement.</span>
        </a>
        <a class="relcard" href="/trace/microsoft-recall-alternative">
          <span class="rt">Alternativa a Microsoft Recall</span>
          <span class="rd" data-es="Sin PC Copilot+ y sin los problemas de privacidad.">No Copilot+ PC, none of the privacy problems.</span>
        </a>`,
   `        <a class="relcard" href="/trace/rewind-ai-alternative">
          <span class="rt" data-es="Alternativa a Rewind AI">Rewind AI alternative</span>
          <span class="rd" data-es="Rewind cerró. La sustituta local y multiplataforma.">Rewind is gone. The local, cross-platform replacement.</span>
        </a>
        <a class="relcard" href="/trace/rewind-alternative-windows">
          <span class="rt" data-es="Alternativa a Rewind para Windows">Rewind alternative for Windows</span>
          <span class="rd" data-es="La misma memoria local, en tu PC con Windows.">The same local memory, on your Windows PC.</span>
        </a>`],

  [`        <a class="relcard" href="/trace/limitless-alternative">
          <span class="rt">Limitless alternative</span>`,
   `        <a class="relcard" href="/trace/limitless-alternative">
          <span class="rt" data-es="Alternativa a Limitless">Limitless alternative</span>`],

  [`        <a class="relcard" href="/trace/screenpipe-alternative">
          <span class="rt">Screenpipe alternative</span>`,
   `        <a class="relcard" href="/trace/screenpipe-alternative">
          <span class="rt" data-es="Alternativa a Screenpipe">Screenpipe alternative</span>`],
];

let html = fs.readFileSync(ORIGEN, 'utf8');
const fallos = [];
for (const [de, a] of CAMBIOS) {
  const n = html.split(de).length - 1;
  if (n !== 1) { fallos.push(`${n} coincidencias (se esperaba 1): ${de.slice(0, 90).replace(/\s+/g, ' ')}…`); continue; }
  html = html.replace(de, a);
}

/* Red de seguridad: el slug de Windows sólo puede aparecer en el enlace de la
   tarjeta relacionada, que es intencionado. En cualquier otro sitio —canonical,
   og:url, breadcrumb, CSS, JS, formulario— sería un resto sin sustituir. */
if (!fallos.length) {
  const legitimo = '<a class="relcard" href="/trace/rewind-alternative-windows">';
  const total = html.split('rewind-alternative-windows').length - 1;
  const esperado = html.split(legitimo).length - 1;
  if (esperado !== 1) fallos.push('falta el enlace a la landing de Windows en las relacionadas');
  if (total !== esperado) fallos.push(`quedan ${total - esperado} referencias al slug de Windows fuera de las tarjetas relacionadas`);
}

if (fallos.length) {
  console.error('✗ la landing de Windows no tiene la forma esperada; no se escribe nada:\n');
  for (const f of fallos) console.error('  · ' + f);
  process.exit(1);
}

fs.writeFileSync(DESTINO, html, 'utf8');
console.log('escrito  src-i18n/trace/rewind-alternative-mac.html  (' + (html.length / 1024).toFixed(1) + ' KB)');

/* El CSS y el JS por landing son idénticos entre páginas salvo el orden de una
   regla, así que se copian tal cual desde la de Windows. */
for (const ext of ['css', 'client.js']) {
  const src = path.join(ROOT, `trace/rewind-alternative-windows.${ext}`);
  const dst = path.join(ROOT, `trace/rewind-alternative-mac.${ext}`);
  fs.copyFileSync(src, dst);
  console.log(`copiado  trace/rewind-alternative-mac.${ext}`);
}
