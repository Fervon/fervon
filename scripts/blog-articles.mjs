/* ============================================================================
   scripts/blog-articles.mjs
   ----------------------------------------------------------------------------
   El CONTENIDO del blog, separado del renderizado (scripts/gen-blog.mjs).

   POR QUÉ ASÍ: el cuerpo se declara como bloques ({k:'p'}, {k:'ul'}, …) con el
   par {es, en} en cada uno, y el generador se encarga del atributo `data-en` y
   de su escapado. Escribir el HTML a mano es justo donde se rompe esto: un
   `data-en="…href="x"…"` con comillas dobles corta el atributo y el inglés sale
   destrozado sin que falle nada (ya pasó en cinco pies de página de producto).

   LOS TÍTULOS. La auditoría SEO proponía seis artículos, pero tres de ellos
   ("Why We Built Trace", "ClaudeScope: Analytics…", "Lookspan: Observability…")
   repetirían la landing del producto: mismo tema, misma consulta, contenido
   duplicado compitiendo consigo mismo. Y otros dos ("What is Fervon?" y
   "Building an AI-Native Software Studio") son el mismo artículo.

   Así que se cubren las seis intenciones con cuatro piezas que atacan la
   consulta INFORMATIVA —la que la landing no puede atacar— y enlazan al
   producto desde dentro:
     · la tesis (Fervon como entidad)          ← "What is Fervon" + "AI-Native Studio"
     · el método                               ← "How Fervon Builds with Fleets"
     · el problema que resuelve Veredicto      ← lleva a /veredicto/
     · el problema que resuelven Lookspan/inferbench ← lleva a los dos

   Los slugs cumplen el punto 18 del checklist: sin cifras y sin conectores
   (de, la, con, para, and, of, the…), que es lo que comprueba seo-check.
   ========================================================================== */

/* Paleta de la forja, para las figuras SVG. */
export const C = {
  ember: '#FF6A00', brasa: '#E0480F', amber: '#FFB02E', spark: '#FFD37A',
  bone: '#EFE7DC', ash: '#A89A8E', line: '#3A2C22', card: '#1A1310', carbon: '#0E0B0A',
};

/* Ladrillos para las figuras: cajas y flechas con el mismo aire que el resto. */
const caja = (x, y, w, h, t, sub, col = C.line, fill = C.card) =>
  `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${col}"/>` +
  `<text x="${x + w / 2}" y="${y + (sub ? h / 2 - 4 : h / 2 + 5)}" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="700" fill="${C.bone}">${t}</text>` +
  (sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 16}" text-anchor="middle" font-family="Inter,sans-serif" font-size="11.5" fill="${C.ash}">${sub}</text>` : '') + '</g>';
/* OJO: un <path> de SVG se RELLENA por defecto. En un tramo recto no se nota
   (área cero), pero un camino en L pinta un bloque negro que tapa media figura.
   Todo path de trazo lleva fill="none" explícito. */
const flecha = (x1, y1, x2, y2, col = C.ember) =>
  `<path fill="none" d="M${x1} ${y1} L${x2} ${y2}" stroke="${col}" stroke-width="2" marker-end="url(#pta)"/>`;
const DEFS = `<defs><marker id="pta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.ember}"/></marker></defs>`;

/* ── Figura 1: el bucle de un estudio autónomo ───────────────────────────── */
const figCiclo = `<svg viewBox="0 0 760 250" width="100%" role="img" aria-labelledby="fig-ciclo-t">
  <title id="fig-ciclo-t">El criterio humano dirige la flota de agentes; un panel de jueces filtra lo que sale y solo lo aprobado llega al producto.</title>
  ${DEFS}
  ${caja(20, 95, 150, 62, 'Criterio', 'una persona', C.ember)}
  ${caja(230, 95, 150, 62, 'Flota', 'agentes en paralelo')}
  ${caja(440, 95, 150, 62, 'Jueces', 'lentes distintas')}
  ${caja(650, 95, 90, 62, 'Producto', '', C.amber)}
  ${flecha(172, 126, 226, 126)}
  ${flecha(382, 126, 436, 126)}
  ${flecha(592, 126, 646, 126)}
  <path fill="none" d="M515 95 L515 45 L95 45 L95 93" stroke="${C.brasa}" stroke-width="2" stroke-dasharray="5 5" marker-end="url(#pta)"/>
  <text x="305" y="36" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" fill="${C.amber}">lo rechazado vuelve con el motivo</text>
  <text x="380" y="205" text-anchor="middle" font-family="Inter,sans-serif" font-size="12.5" fill="${C.ash}">La ejecución es barata y paralela. El criterio es escaso: es el único cuello de botella real.</text>
</svg>`;

/* ── Figura 2: un worktree por agente ────────────────────────────────────── */
const figWorktrees = `<svg viewBox="0 0 760 312" width="100%" role="img" aria-labelledby="fig-wt-t">
  <title id="fig-wt-t">Cada agente trabaja en su propio git worktree y solo se integra al final, en vez de escribir todos sobre el mismo directorio.</title>
  ${DEFS}
  ${caja(285, 14, 190, 54, 'Repositorio', 'una sola rama base', C.ember)}
  ${caja(20, 118, 160, 58, 'worktree A', 'agente 1')}
  ${caja(210, 118, 160, 58, 'worktree B', 'agente 2')}
  ${caja(400, 118, 160, 58, 'worktree C', 'agente 3')}
  ${caja(590, 118, 150, 58, 'worktree D', 'agente 4')}
  ${flecha(340, 70, 110, 114)} ${flecha(365, 70, 290, 114)}
  ${flecha(415, 70, 480, 114)} ${flecha(440, 70, 660, 114)}
  ${caja(285, 220, 190, 54, 'Integración', 'una a una, revisada', C.amber)}
  ${flecha(110, 178, 320, 216)} ${flecha(290, 178, 360, 216)}
  ${flecha(480, 178, 420, 216)} ${flecha(660, 178, 450, 216)}
  <text x="380" y="303" text-anchor="middle" font-family="Inter,sans-serif" font-size="12.5" fill="${C.ash}">Sin worktrees, cuatro agentes = cuatro versiones del mismo fichero.</text>
</svg>`;

/* ── Figura 3: anatomía de un verde que no prueba nada ───────────────────── */
const figVerde = `<svg viewBox="0 0 760 250" width="100%" role="img" aria-labelledby="fig-verde-t">
  <title id="fig-verde-t">Un test puede pasar sin llegar a ejecutar el código que dice probar: el mock intercepta la llamada antes de que llegue.</title>
  ${DEFS}
  ${caja(20, 40, 150, 58, 'Test', 'dice que prueba X', C.line)}
  ${caja(230, 40, 170, 58, 'Mock', 'devuelve lo esperado', C.brasa)}
  ${caja(470, 40, 170, 58, 'Código real', 'nunca se ejecuta', C.line, '#140f0c')}
  ${flecha(172, 69, 226, 69)}
  <path fill="none" d="M402 69 L466 69" stroke="${C.ash}" stroke-width="2" stroke-dasharray="4 4"/>
  <path fill="none" d="M424 55 L446 83 M446 55 L424 83" stroke="${C.brasa}" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="660" y="49" width="80" height="40" rx="20" fill="#122413" stroke="#2f6b34"/>
  <text x="700" y="74" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="700" fill="#79d17f">PASA</text>
  <text x="380" y="150" text-anchor="middle" font-family="Inter,sans-serif" font-size="13.5" fill="${C.bone}">El test es verde. La cobertura sube. El fallo sigue ahí.</text>
  <text x="380" y="180" text-anchor="middle" font-family="Inter,sans-serif" font-size="12.5" fill="${C.ash}">Lo único que se ha comprobado es que el mock devuelve lo que le has dicho que devuelva.</text>
  <text x="380" y="216" text-anchor="middle" font-family="Inter,sans-serif" font-size="12.5" fill="${C.amber}">La prueba de fuego: rompe el código a propósito. Si el test sigue verde, no prueba nada.</text>
</svg>`;

/* ── Figura 4: dónde se esconde el coste ─────────────────────────────────── */
const figCoste = `<svg viewBox="0 0 760 300" width="100%" role="img" aria-labelledby="fig-coste-t">
  <title id="fig-coste-t">En una tarea de agente, la respuesta final es una fracción del gasto: el contexto reenviado, las herramientas y los reintentos pesan mucho más.</title>
  <text x="20" y="26" font-family="Inter,sans-serif" font-size="13" fill="${C.ash}">Reparto típico del gasto de UNA tarea de agente</text>
  ${(() => {
    /* Las cinco partidas son un REPARTO, así que suman 100. La barra se escala
       contra la mayor —no contra 100— para que la más pequeña siga viéndose. */
    const partidas = [
      ['Contexto reenviado en cada turno', 46, C.brasa],
      ['Salida de herramientas leída por el modelo', 24, C.ember],
      ['Reintentos tras un fallo', 16, C.amber],
      ['Razonamiento intermedio', 10, C.spark],
      ['La respuesta que de verdad querías', 4, '#8FD06B'],
    ];
    const max = Math.max(...partidas.map((p) => p[1]));
    return partidas.map(([t, pct, col], i) => {
      const y = 54 + i * 46;
      return `<g><text x="20" y="${y + 13}" font-family="Inter,sans-serif" font-size="13" fill="${C.bone}">${t}</text>` +
        `<rect x="20" y="${y + 22}" width="640" height="14" rx="7" fill="#181210"/>` +
        `<rect x="20" y="${y + 22}" width="${Math.round(640 * pct / max)}" height="14" rx="7" fill="${col}"/>` +
        `<text x="672" y="${y + 34}" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="${col}">${pct}%</text></g>`;
    }).join('\n  ');
  })()}
  <text x="20" y="290" font-family="Inter,sans-serif" font-size="12" fill="${C.ash}">Reparto ilustrativo sobre 100: cambia con cada tarea. Lo que no cambia es el orden — la respuesta final nunca es la partida grande.</text>
</svg>`;

/* ══════════════════════════════════════════════════════════════════════════
   LOS ARTÍCULOS
   ══════════════════════════════════════════════════════════════════════════ */
export const ARTICLES = [
  /* ────────────────────────────────────────────────────────────────────── 1 */
  {
    slug: 'estudio-software-autonomo',
    fecha: '2026-08-19',
    minutos: 7,
    ogAccent: C.ember,
    ogPill: 'La tesis',
    titulo: { es: 'Qué es un estudio de software autónomo', en: 'What an autonomous software studio is' },
    ogTitulo: { es: 'Estudio de software autónomo', en: 'Autonomous software studio' },
    metaTitulo: { es: 'Qué es un estudio de software autónomo · Fervon', en: 'What an autonomous software studio is · Fervon' },
    desc: {
      es: 'Un estudio de software autónomo es un taller donde la ejecución la hacen agentes de IA y el criterio lo pone una persona. Qué cambia de verdad y qué no.',
      en: 'An autonomous software studio is a workshop where AI agents do the execution and one person supplies the judgement. What actually changes, and what does not.',
    },
    lead: {
      es: 'La expresión suena a folleto. Debajo hay algo concreto: cuando ejecutar deja de ser lo caro, lo escaso pasa a ser decidir. Este es el reparto de trabajo que hay detrás de Fervon.',
      en: 'The phrase sounds like a brochure. Underneath there is something concrete: when execution stops being the expensive part, deciding becomes the scarce one. This is the division of labour behind Fervon.',
    },
    figuraHero: {
      es: 'El criterio dirige, la flota ejecuta, los jueces filtran.',
      en: 'Judgement directs, the fleet executes, the judges filter.',
    },
    tldr: [
      { es: 'Un <b>estudio de software autónomo</b> es un taller donde el trabajo de ejecución lo hacen agentes de IA y el criterio —qué se construye y qué se acepta— lo pone una persona.', en: 'An <b>autonomous software studio</b> is a workshop where AI agents do the execution work and one person supplies the judgement — what gets built and what gets accepted.' },
      { es: 'No es «la IA programa sola». Sin alguien que decida qué se tira, una flota produce <b>volumen</b>, no producto.', en: 'It is not "AI programs on its own". Without someone deciding what to throw away, a fleet produces <b>volume</b>, not product.' },
      { es: 'Lo que cambia no es la velocidad de teclear: es que <b>desaparece la cola</b> entre tener una idea y verla funcionando.', en: 'What changes is not typing speed: it is that <b>the queue disappears</b> between having an idea and seeing it run.' },
      { es: 'El modelo solo aguanta si el estudio es <b>pequeño</b>. Cuantas más personas, más tiempo se va en coordinar en vez de en decidir.', en: 'The model only holds if the studio is <b>small</b>. The more people, the more time goes into coordinating instead of deciding.' },
    ],
    cuerpo: [
      { k: 'h2', es: 'El nombre es literal, no un eslogan', en: 'The name is literal, not a slogan' },
      { k: 'p', es: 'Un estudio de software normal vende capacidad: personas por tiempo. Un estudio autónomo vende resultado, porque la capacidad ha dejado de ser el límite. La parte «autónoma» no describe una promesa de futuro sobre inteligencia artificial: describe cómo se organiza el trabajo hoy. La ejecución corre sin que haya nadie tecleando, y la persona aparece en los puntos donde hace falta juicio.', en: 'A normal software studio sells capacity: people multiplied by time. An autonomous studio sells outcome, because capacity has stopped being the limit. The "autonomous" part is not a promise about future artificial intelligence: it describes how the work is organised today. Execution runs without anyone typing, and the person shows up at the points where judgement is required.' },
      { k: 'p', es: 'La diferencia práctica se nota en qué se hace por la noche. En un equipo clásico, por la noche no se hace nada. En un estudio autónomo, por la noche se ejecuta lo que se decidió por la tarde, y por la mañana hay algo que revisar. El trabajo no se ha vuelto instantáneo: se ha desacoplado de la jornada de una persona.', en: 'The practical difference shows in what happens overnight. In a classic team, nothing happens overnight. In an autonomous studio, overnight is when what was decided in the afternoon gets executed, and in the morning there is something to review. The work has not become instant: it has been decoupled from one person\'s working day.' },

      { k: 'h2', es: 'Tres cosas que no es', en: 'Three things it is not' },
      { k: 'p', es: 'La etiqueta se está usando para cosas muy distintas, así que conviene acotarla por exclusión antes que por definición.', en: 'The label is being used for very different things, so it is worth bounding it by exclusion before defining it.' },
      { k: 'ul', items: [
        { es: '<b>No es escribir código a ojo con un chat.</b> Un agente que no puede ejecutar las pruebas, leer el repositorio entero y volver a intentarlo no es una flota: es un autocompletado con buena prosa.', en: '<b>It is not eyeballing code in a chat window.</b> An agent that cannot run the tests, read the whole repository and try again is not a fleet: it is autocomplete with good prose.' },
        { es: '<b>No es una agencia con IA encima.</b> Si sigues cobrando por horas, la IA solo te hace tener horas más baratas que vender, y el incentivo se te pone en contra en cuanto entregas antes.', en: '<b>It is not an agency with AI bolted on.</b> If you still bill by the hour, AI just gives you cheaper hours to sell, and the incentive turns against you the moment you deliver early.' },
        { es: '<b>No es trabajo sin supervisión.</b> Autónomo se refiere a la ejecución, no al criterio. Un cambio que nadie ha mirado no está terminado, esté verde o no.', en: '<b>It is not unsupervised work.</b> Autonomous refers to execution, not to judgement. A change nobody has looked at is not finished, green or not.' },
      ] },

      { k: 'h2', es: 'Lo que sí lo define', en: 'What does define it' },
      { k: 'h3', es: 'La ejecución es paralela y barata', en: 'Execution is parallel and cheap' },
      { k: 'p', es: 'Cuando lanzar un intento cuesta minutos en vez de días, cambia qué preguntas merece la pena hacerse. Deja de tener sentido discutir tres enfoques en una pizarra: sale más barato construir los tres y mirar cuál sobrevive a las pruebas. La discusión de diseño no desaparece, pero se hace con código delante en vez de con opiniones.', en: 'When one attempt costs minutes instead of days, it changes which questions are worth asking. Debating three approaches on a whiteboard stops making sense: it is cheaper to build all three and see which one survives the tests. Design discussion does not disappear, but it happens with code in front of you instead of opinions.' },
      { k: 'h3', es: 'El criterio es escaso y caro', en: 'Judgement is scarce and expensive' },
      { k: 'p', es: 'Este es el cuello de botella real, y conviene decirlo claro porque es lo contrario de lo que promete el discurso habitual. Cuatro agentes trabajando en paralelo generan cuatro cambios que hay que revisar. Si la revisión no escala, la flota deja de ayudar y empieza a enterrar. Por eso el trabajo del estudio no es escribir más código: es decidir más rápido y con mejor información qué código se queda.', en: 'This is the real bottleneck, and it is worth stating plainly because it is the opposite of what the usual pitch promises. Four agents working in parallel produce four changes that have to be reviewed. If review does not scale, the fleet stops helping and starts burying you. That is why the studio\'s job is not writing more code: it is deciding faster, and with better information, which code stays.' },
      { k: 'h3', es: 'El producto es el entregable, no las horas', en: 'The product is the deliverable, not the hours' },
      { k: 'p', es: 'Si la ejecución es barata, cobrar por tiempo es cobrar por lo que ya no es escaso. De ahí salen dos consecuencias que se ven en la web: precio cerrado por proyecto en vez de por horas, y catálogo de productos que se compran y se descargan sin hablar con nadie. No son decisiones de marketing: son la consecuencia contable del modelo.', en: 'If execution is cheap, billing for time means billing for what is no longer scarce. Two consequences follow, and both are visible on the site: a closed per-project price instead of hourly rates, and a catalogue of products you buy and download without talking to anyone. Neither is a marketing decision: both are the accounting consequence of the model.' },

      { k: 'fig', svg: figCiclo, es: 'El bucle completo. Lo que un juez rechaza no se descarta: vuelve al principio con el motivo, que es la parte que hace que la siguiente vuelta sea mejor.', en: 'The full loop. What a judge rejects is not discarded: it goes back to the start with the reason attached, which is the part that makes the next pass better.' },

      { k: 'h2', es: 'Qué cambia frente a un equipo clásico', en: 'What changes versus a classic team' },
      { k: 'table', caption: { es: 'Diferencias entre un estudio de software autónomo y un equipo de desarrollo clásico.', en: 'Differences between an autonomous software studio and a classic development team.' },
        head: [{ es: '', en: '' }, { es: 'Equipo clásico', en: 'Classic team' }, { es: 'Estudio autónomo', en: 'Autonomous studio' }],
        rows: [
          [{ es: 'Recurso escaso', en: 'Scarce resource' }, { es: 'Horas de desarrollo', en: 'Development hours' }, { es: 'Criterio y revisión', en: 'Judgement and review' }],
          [{ es: 'Coste de un intento', en: 'Cost of one attempt' }, { es: 'Días', en: 'Days' }, { es: 'Minutos', en: 'Minutes' }],
          [{ es: 'Cómo se decide el diseño', en: 'How design is decided' }, { es: 'Reunión y documento', en: 'Meeting and a document' }, { es: 'Se construyen las opciones', en: 'The options get built' }],
          [{ es: 'Qué frena la entrega', en: 'What slows delivery' }, { es: 'Coordinación', en: 'Coordination' }, { es: 'Revisión', en: 'Review' }],
          [{ es: 'Unidad de facturación', en: 'Billing unit' }, { es: 'Tiempo y perfiles', en: 'Time and headcount' }, { es: 'Proyecto o producto', en: 'Project or product' }],
          [{ es: 'Horario del trabajo', en: 'Working hours' }, { es: 'El de las personas', en: 'The people\'s' }, { es: 'Continuo', en: 'Continuous' }],
        ] },

      { k: 'h2', es: 'Por qué solo funciona si el estudio es pequeño', en: 'Why it only works if the studio is small' },
      { k: 'p', es: 'Aquí hay una asimetría que se pasa por alto. Añadir agentes es casi gratis; añadir personas no. Cada persona nueva mete coordinación, y la coordinación compite exactamente por el recurso que ya era escaso: la atención de quien decide. Un estudio de una persona con una flota grande puede ir más rápido que un equipo de cinco personas con la misma flota, simplemente porque no gasta nada en ponerse de acuerdo.', en: 'There is an overlooked asymmetry here. Adding agents is nearly free; adding people is not. Every new person introduces coordination, and coordination competes for exactly the resource that was already scarce: the attention of whoever decides. A one-person studio with a large fleet can move faster than a five-person team with the same fleet, simply because it spends nothing on reaching agreement.' },
      { k: 'quote', es: 'La flota no sustituye al equipo. Sustituye al calendario.', en: 'The fleet does not replace the team. It replaces the calendar.' },
      { k: 'p', es: 'Eso pone un techo natural: llega un punto en que una sola persona no puede revisar más, y ahí el estudio deja de escalar por más agentes que arranques. Es un límite real y merece decirse, porque el modelo se vende a menudo como si no lo tuviera.', en: 'That sets a natural ceiling: at some point one person cannot review any more, and there the studio stops scaling no matter how many agents you start. It is a real limit and it deserves to be said, because this model is often sold as though it had none.' },

      { k: 'h2', es: 'Qué sale de un taller así', en: 'What comes out of a workshop like this' },
      { k: 'p', es: 'La prueba de que el método funciona no es un manifiesto: es el catálogo. Todo lo que hay en <a href="/#productos">productos</a> salió del mismo bucle, incluidas las herramientas que existen precisamente para tapar los agujeros que abre trabajar así — <a href="/veredicto/">Veredicto</a> nació de no fiarse de los tests que escriben los agentes, y <a href="/lookspan/">Lookspan</a> de no saber en qué se estaba yendo el gasto. Cómo se dirige la flota en la práctica está en <a href="/blog/flotas-agentes-ia/">el artículo del método</a>, y quién hay detrás, en <a href="/about/">sobre Fervon</a>.', en: 'The proof that the method works is not a manifesto: it is the catalogue. Everything under <a href="/#productos">products</a> came out of the same loop, including the tools that exist precisely to plug the holes this way of working opens — <a href="/veredicto/">Veredicto</a> was born from not trusting the tests agents write, and <a href="/lookspan/">Lookspan</a> from not knowing where the spend was going. How the fleet is actually directed is in <a href="/blog/flotas-agentes-ia/">the method article</a>, and who is behind it, in <a href="/about/">about Fervon</a>.' },
    ],
    faq: [
      { q: { es: '¿Un estudio autónomo escribe el código sin intervención humana?', en: 'Does an autonomous studio write code with no human involvement?' },
        a: { es: 'La ejecución sí corre sin intervención: los agentes leen el repositorio, escriben, ejecutan las pruebas y vuelven a intentarlo. Lo que no corre sin intervención es la decisión de qué se acepta. Un cambio que ningún humano ha mirado no se considera terminado.', en: 'Execution does run without intervention: the agents read the repository, write, run the tests and try again. What does not run without intervention is the decision of what gets accepted. A change no human has looked at is not considered finished.' } },
      { q: { es: '¿Cuántos agentes hacen falta?', en: 'How many agents do you need?' },
        a: { es: 'Menos de los que parece. El límite no lo pone la máquina sino la capacidad de revisar: en cuanto la cola de cambios pendientes crece más rápido de lo que se vacía, añadir agentes empeora las cosas. En la práctica cuatro en paralelo por tarea es un techo razonable.', en: 'Fewer than you would think. The limit is not the machine but review capacity: as soon as the queue of pending changes grows faster than it empties, adding agents makes things worse. In practice four in parallel per task is a sensible ceiling.' } },
      { q: { es: '¿Esto sirve para software serio o solo para prototipos?', en: 'Does this work for serious software or only prototypes?' },
        a: { es: 'Sirve para lo que puedas verificar. Si un cambio se puede probar de forma automática y reproducible, el método aguanta perfectamente. Donde se rompe es en lo que solo se puede validar mirándolo: ahí el cuello de botella humano es total y la flota apenas ayuda.', en: 'It works for whatever you can verify. If a change can be tested automatically and reproducibly, the method holds up fine. Where it breaks down is anything that can only be validated by looking at it: there the human bottleneck is total and the fleet barely helps.' } },
      { q: { es: '¿Qué pasa con la calidad?', en: 'What about quality?' },
        a: { es: 'Es la pregunta correcta, porque el riesgo real de este modelo no es escribir poco código sino aceptar código malo deprisa. La respuesta no es confiar más en el agente: es abaratar la verificación. Pruebas que de verdad fallan cuando algo se rompe, revisión adversarial y medición antes de dar nada por arreglado.', en: 'That is the right question, because the real risk of this model is not writing too little code but accepting bad code quickly. The answer is not trusting the agent more: it is making verification cheaper. Tests that actually fail when something breaks, adversarial review, and measurement before calling anything fixed.' } },
      { q: { es: '¿Fervon es un estudio de software autónomo?', en: 'Is Fervon an autonomous software studio?' },
        a: { es: 'Sí. Fervon es el estudio de software autónomo de Jonathan Martín: una persona dirigiendo flotas de agentes de IA que construyen productos local-first y herramientas open source. El catálogo entero salió de ese método.', en: 'Yes. Fervon is Jonathan Martín\'s autonomous software studio: one person directing fleets of AI agents that build local-first products and open-source tools. The entire catalogue came out of that method.' } },
    ],
    relacionados: ['flotas-agentes-ia', 'tests-amanados-agentes'],
  },

  /* ────────────────────────────────────────────────────────────────────── 2 */
  {
    slug: 'flotas-agentes-ia',
    fecha: '2026-08-19',
    minutos: 8,
    ogAccent: C.amber,
    ogPill: 'El método',
    titulo: { es: 'Cómo se dirige una flota de agentes de IA', en: 'How to direct a fleet of AI agents' },
    ogTitulo: { es: 'Dirigir flotas de agentes', en: 'Directing agent fleets' },
    metaTitulo: { es: 'Cómo se dirige una flota de agentes de IA · Fervon', en: 'How to direct a fleet of AI agents · Fervon' },
    desc: {
      es: 'Aislamiento con git worktree, cuántos agentes en paralelo, medir antes de arreglar y un panel de jueces adversarial. El método real, con sus límites.',
      en: 'Isolation with git worktrees, how many agents in parallel, measuring before fixing, and an adversarial judge panel. The real method, limits included.',
    },
    lead: {
      es: 'Lanzar cuatro agentes sobre el mismo repositorio no es paralelismo: es una condición de carrera con nombres propios. Esto es lo que hace falta alrededor para que sí lo sea.',
      en: 'Launching four agents at the same repository is not parallelism: it is a race condition with names attached. This is the scaffolding that makes it actually parallel.',
    },
    figuraHero: {
      es: 'Un directorio de trabajo por agente, integración de uno en uno.',
      en: 'One working directory per agent, integrated one at a time.',
    },
    tldr: [
      { es: 'Las <b>flotas de agentes</b> se pisan si comparten directorio: cada uno necesita <b>el suyo</b> (git worktree). Sin eso, cuatro agentes son cuatro versiones del mismo fichero.', en: '<b>Agent fleets</b> collide when they share a directory: each one needs <b>its own</b> (a git worktree). Without that, four agents are four versions of the same file.' },
      { es: 'El número óptimo es <b>bajo</b>: alrededor de cuatro en paralelo. El límite no es la máquina, es cuánto puedes revisar.', en: 'The optimal number is <b>low</b>: around four in parallel. The limit is not the machine, it is how much you can review.' },
      { es: '<b>Reproduce el fallo antes de arreglarlo.</b> Un informe de un agente es una hipótesis, no una medición.', en: '<b>Reproduce the bug before fixing it.</b> An agent\'s report is a hypothesis, not a measurement.' },
      { es: 'Antes de integrar, un <b>panel de jueces</b> con lentes distintas intenta tumbar el cambio. Redundancia no: diversidad.', en: 'Before integrating, a <b>panel of judges</b> with different lenses tries to knock the change down. Not redundancy: diversity.' },
    ],
    cuerpo: [
      { k: 'h2', es: 'El primer problema no es el modelo: es el sistema de ficheros', en: 'The first problem is not the model: it is the filesystem' },
      { k: 'p', es: 'La primera vez que lanzas varios agentes sobre un proyecto descubres algo poco glamuroso: se pisan. Uno reformatea un fichero mientras otro lo está editando, un tercero deja el repositorio con cambios sin confirmar y el cuarto arranca desde ese estado sucio y hereda el desastre. El resultado no es cuatro veces más trabajo hecho, es un solo montón de trabajo imposible de separar.', en: 'The first time you launch several agents at one project you discover something unglamorous: they collide. One reformats a file while another is editing it, a third leaves the repository with uncommitted changes, and the fourth starts from that dirty state and inherits the mess. The result is not four times the work done, it is a single pile of work that cannot be untangled.' },
      { k: 'p', es: 'La solución no es más inteligente, es más aburrida: <code>git worktree</code>. Cada agente recibe un directorio propio con su propia rama, todos apuntando al mismo repositorio. Escriben a la vez sin verse, y la integración se hace después, una a una, cuando ya se puede leer cada cambio por separado.', en: 'The fix is not smarter, it is more boring: <code>git worktree</code>. Each agent gets its own directory with its own branch, all pointing at the same repository. They write at the same time without seeing each other, and integration happens afterwards, one at a time, when each change can be read on its own.' },
      { k: 'fig', svg: figWorktrees, es: 'Aislar cuesta unos milisegundos de preparación por agente. Desenredar cuatro cambios mezclados cuesta una tarde.', en: 'Isolation costs a few milliseconds of setup per agent. Untangling four mixed-up changes costs an afternoon.' },
      { k: 'p', es: 'El coste de esto es real pero pequeño, y solo merece la pena cuando los agentes van a <em>escribir</em> a la vez. Para lanzar cuatro lectores que solo exploran el código, montar worktrees es gasto sin beneficio.', en: 'The cost is real but small, and it only pays off when the agents are going to <em>write</em> at the same time. For launching four readers that only explore the code, setting up worktrees is expense with no benefit.' },

      { k: 'h2', es: 'Cuántos agentes a la vez', en: 'How many agents at once' },
      { k: 'p', es: 'La respuesta intuitiva es «los que aguante la máquina». Es la equivocada. El recurso que se agota primero no es la CPU ni el presupuesto de tokens: es la capacidad de leer lo que han hecho. Cuatro agentes terminando a la vez producen cuatro cambios que hay que entender, y entender cuesta lo mismo que costaba antes.', en: 'The intuitive answer is "as many as the machine can take". It is the wrong one. The resource that runs out first is neither CPU nor token budget: it is the capacity to read what they did. Four agents finishing at once produce four changes that have to be understood, and understanding costs exactly what it always did.' },
      { k: 'p', es: 'La regla práctica: <b>si la cola de cambios pendientes de revisar crece, sobran agentes</b>. Antes que lanzar un quinto, casi siempre sale mejor recortar el alcance de la tarea para que los cuatro entreguen algo más pequeño y más fácil de juzgar.', en: 'The practical rule: <b>if the queue of changes awaiting review is growing, you have too many agents</b>. Rather than launching a fifth, it is almost always better to trim the scope so the four deliver something smaller and easier to judge.' },

      { k: 'h2', es: 'Medir antes de arreglar', en: 'Measure before fixing' },
      { k: 'p', es: 'Un agente que informa de un fallo está proponiendo una hipótesis con mucha seguridad en la voz. A veces el fallo no existe; otras existe pero la causa es otra. Si empiezas a parchear a partir del informe, acabas arreglando algo que no estaba roto y dejando lo que sí lo estaba.', en: 'An agent reporting a bug is proposing a hypothesis with a lot of confidence in its voice. Sometimes the bug does not exist; sometimes it exists but the cause is different. If you start patching from the report, you end up fixing something that was not broken and leaving what actually was.' },
      { k: 'p', es: 'El orden que funciona es al revés: primero se reproduce, luego se toca. Reproducir significa una condición que falla ahora y que dejará de fallar cuando el cambio esté bien — un test que se cae, una línea en el registro, una medición A/B contra el sistema de verdad. Si no se puede reproducir, lo primero que hay que construir es la forma de reproducirlo.', en: 'The order that works is the reverse: reproduce first, touch second. Reproducing means a condition that fails now and will stop failing when the change is right — a test that breaks, a line in the log, an A/B measurement against the real system. If it cannot be reproduced, the first thing to build is a way to reproduce it.' },
      { k: 'quote', es: 'Un informe no es una medición. Refuta la afirmación antes de arreglarla.', en: 'A report is not a measurement. Refute the claim before you fix it.' },

      { k: 'h2', es: 'El panel de jueces', en: 'The judge panel' },
      { k: 'p', es: 'Cuando un cambio está listo, la tentación es mirarlo por encima y aceptarlo. El problema es conocido: lo que un agente escribe suena convincente casi siempre, incluso cuando está mal. La revisión de un solo lector, humano o no, se deja engañar por la prosa.', en: 'When a change is ready, the temptation is to skim it and accept. The problem is well known: what an agent writes sounds convincing nearly always, even when it is wrong. Review by a single reader, human or not, gets fooled by the prose.' },
      { k: 'p', es: 'Lo que sí funciona es enfrentarlo a varios revisores con encargos <em>distintos</em>, cada uno buscando un tipo de fallo diferente y con la instrucción de intentar tumbar el cambio, no de aprobarlo. La clave es la diversidad, no la cantidad: tres revisores con la misma lente encuentran el mismo fallo tres veces y se pierden los otros dos.', en: 'What does work is putting it in front of several reviewers with <em>different</em> briefs, each hunting a different class of failure and instructed to knock the change down rather than approve it. The key is diversity, not quantity: three reviewers with the same lens find the same flaw three times and miss the other two.' },
      { k: 'table', caption: { es: 'Lentes de revisión y qué tipo de fallo encuentra cada una.', en: 'Review lenses and the class of failure each one catches.' },
        head: [{ es: 'Lente', en: 'Lens' }, { es: 'Qué busca', en: 'What it hunts' }, { es: 'Lo que se cuela sin ella', en: 'What slips through without it' }],
        rows: [
          [{ es: 'Corrección', en: 'Correctness' }, { es: 'Casos límite, nulos, orden de eventos', en: 'Edge cases, nulls, event ordering' }, { es: 'Falla con datos reales', en: 'Breaks on real data' }],
          [{ es: 'Reproducción', en: 'Reproduction' }, { es: '¿El fallo original existía?', en: 'Did the original bug even exist?' }, { es: 'Arreglos de nada', en: 'Fixes for nothing' }],
          [{ es: 'Pruebas', en: 'Tests' }, { es: 'Tests que pasan sin probar', en: 'Tests that pass without testing' }, { es: 'Verde falso', en: 'False green' }],
          [{ es: 'Seguridad', en: 'Security' }, { es: 'Secretos, entrada sin validar', en: 'Secrets, unvalidated input' }, { es: 'Fugas silenciosas', en: 'Silent leaks' }],
          [{ es: 'Simplicidad', en: 'Simplicity' }, { es: 'Código duplicado, capas de más', en: 'Duplicated code, extra layers' }, { es: 'Deuda desde el día uno', en: 'Debt from day one' }],
        ] },
      { k: 'p', es: 'Y una regla que solo se aprende pagándola: <b>a los agentes hay que repetirles en cada encargo lo que no deben hacer</b>. Un subagente al que no se le prohíbe explícitamente confirmar cambios los confirma, aunque se le dijera al principio de la sesión. Después de lanzar una flota, mirar el estado del repositorio no es paranoia.', en: 'And one rule you only learn by paying for it: <b>agents need to be told what NOT to do in every single brief</b>. A subagent that is not explicitly forbidden from committing will commit, even if it was told at the start of the session. After launching a fleet, checking the repository state is not paranoia.' },

      { k: 'h2', es: 'Lo que no se delega', en: 'What does not get delegated' },
      { k: 'ul', items: [
        { es: '<b>Qué se construye.</b> Un agente optimiza lo que le pides; no te dice que estabas pidiendo lo que no era.', en: '<b>What gets built.</b> An agent optimises what you asked for; it does not tell you that you asked for the wrong thing.' },
        { es: '<b>Qué se acepta.</b> Que las pruebas estén verdes es condición necesaria, no suficiente.', en: '<b>What gets accepted.</b> Green tests are a necessary condition, not a sufficient one.' },
        { es: '<b>Qué se tira.</b> Es la decisión más rentable y la que más cuesta tomar, porque siempre hay trabajo hecho detrás.', en: '<b>What gets thrown away.</b> The most profitable decision and the hardest to make, because there is always finished work behind it.' },
        { es: '<b>Lo que se publica.</b> Nada sale al mundo —una release, un post, un correo— sin que una persona lo apruebe.', en: '<b>What gets published.</b> Nothing goes out into the world —a release, a post, an email— without a person approving it.' },
      ] },
      { k: 'p', es: 'Este método es también el origen de medio catálogo: <a href="/veredicto/">Veredicto</a> automatiza la lente de pruebas, <a href="/lookspan/">Lookspan</a> enseña qué está haciendo y gastando cada agente, y <a href="/regenta/">Regenta</a> es el panel desde el que se gobierna todo. La tesis de por qué el reparto de trabajo es así está en <a href="/blog/estudio-software-autonomo/">qué es un estudio de software autónomo</a>.', en: 'This method is also where half the catalogue came from: <a href="/veredicto/">Veredicto</a> automates the tests lens, <a href="/lookspan/">Lookspan</a> shows what each agent is doing and spending, and <a href="/regenta/">Regenta</a> is the panel it is all governed from. The thesis behind why the work is split this way is in <a href="/blog/estudio-software-autonomo/">what an autonomous software studio is</a>.' },
    ],
    faq: [
      { q: { es: '¿Hace falta git worktree o vale con ramas?', en: 'Do you need git worktrees or are branches enough?' },
        a: { es: 'Las ramas solas no bastan si los agentes trabajan a la vez: comparten el mismo directorio de trabajo, así que cambiar de rama afecta a todos. El worktree da a cada agente su propio directorio. Si los agentes van de uno en uno, las ramas sobran de sobra.', en: 'Branches alone are not enough if the agents work simultaneously: they share one working directory, so switching branch affects everyone. A worktree gives each agent its own directory. If the agents run one at a time, branches are more than enough.' } },
      { q: { es: '¿Cuántos agentes en paralelo son demasiados?', en: 'How many parallel agents are too many?' },
        a: { es: 'Cuando la cola de cambios pendientes de revisar crece más rápido de lo que la vacías. En la práctica ese punto llega antes de lo que parece: alrededor de cuatro por tarea. Si necesitas más, casi siempre la tarea está mal recortada.', en: 'When the queue of changes awaiting review grows faster than you empty it. In practice that point arrives sooner than you would think: around four per task. If you need more, the task is usually badly scoped.' } },
      { q: { es: '¿Por qué revisores con criterios distintos y no simplemente más revisores?', en: 'Why reviewers with different criteria instead of just more reviewers?' },
        a: { es: 'Porque revisores idénticos cometen el mismo error a la vez. Tres agentes con la misma instrucción encuentran el mismo fallo y se pierden los demás. Repartir lentes —corrección, pruebas, seguridad, simplicidad— cubre clases de fallo que la redundancia no cubre.', en: 'Because identical reviewers make the same mistake at the same time. Three agents with the same brief find the same flaw and miss the rest. Splitting the lenses —correctness, tests, security, simplicity— covers classes of failure that redundancy does not.' } },
      { q: { es: '¿Se puede automatizar del todo la revisión?', en: 'Can review be fully automated?' },
        a: { es: 'Se puede automatizar el filtro, no la decisión. Un panel automático descarta muy bien lo que está claramente mal, y eso ya multiplica lo que una persona puede procesar. Pero lo que sobrevive al filtro sigue necesitando que alguien decida si es lo que quería.', en: 'You can automate the filter, not the decision. An automated panel is very good at discarding what is clearly wrong, and that alone multiplies what a person can process. But whatever survives the filter still needs someone to decide whether it is what they wanted.' } },
      { q: { es: '¿Qué pasa cuando un agente dice que ya está arreglado?', en: 'What happens when an agent says it is fixed?' },
        a: { es: 'Que hay que comprobarlo contra la condición que se definió al reproducir el fallo, no contra la afirmación del agente. Si no se definió esa condición antes de empezar, no hay forma de saber si está arreglado, y ese es el verdadero problema.', en: 'You check it against the condition defined when the bug was reproduced, not against the agent\'s claim. If that condition was not defined before starting, there is no way to know whether it is fixed — and that is the real problem.' } },
    ],
    relacionados: ['estudio-software-autonomo', 'tests-amanados-agentes'],
  },

  /* ────────────────────────────────────────────────────────────────────── 3 */
  {
    slug: 'tests-amanados-agentes',
    fecha: '2026-08-19',
    minutos: 7,
    ogAccent: C.brasa,
    ogPill: 'Pruebas',
    titulo: { es: 'Cómo saber si un agente te está amañando los tests', en: 'How to tell when an agent is gaming your tests' },
    ogTitulo: { es: 'Tests amañados por agentes', en: 'Tests gamed by agents' },
    metaTitulo: { es: 'Cómo saber si un agente amaña tus tests · Fervon', en: 'How to tell if an agent games your tests · Fervon' },
    desc: {
      es: 'Seis formas en que un agente pone un test en verde sin arreglar nada, cómo se detecta cada una y la única prueba que no se puede falsear.',
      en: 'Six ways an agent turns a test green without fixing anything, how to detect each one, and the one check that cannot be faked.',
    },
    lead: {
      es: 'Un agente optimiza lo que le mides. Si lo que le mides es «que los tests pasen», tarde o temprano descubre que hay caminos más cortos que arreglar el código.',
      en: 'An agent optimises whatever you measure. If what you measure is "make the tests pass", sooner or later it discovers there are shortcuts cheaper than fixing the code.',
    },
    figuraHero: {
      es: 'El mock intercepta la llamada y el código real nunca se ejecuta.',
      en: 'The mock intercepts the call and the real code never runs.',
    },
    tldr: [
      { es: 'Los <b>tests amañados</b> no son sabotaje: los agentes <b>optimizan la métrica que les has dado</b>. Si la métrica es «verde», el camino corto es hacer verde, no arreglar.', en: '<b>Gamed tests</b> are not sabotage: agents <b>optimise the metric you gave them</b>. If the metric is "green", the short path is making it green, not fixing it.' },
      { es: 'Los seis patrones habituales: mock del punto que falla, aserción vacía, excepción capturada, test que no llama al código, snapshot regenerado y skip condicional.', en: 'The six usual patterns: mocking the failing point, empty assertion, swallowed exception, a test that never calls the code, a regenerated snapshot, and a conditional skip.' },
      { es: 'La cobertura <b>no</b> los detecta: casi todos ejecutan la línea, solo que sin comprobar nada.', en: 'Coverage does <b>not</b> catch them: nearly all of them execute the line, they just check nothing.' },
      { es: 'La prueba que no se puede falsear: <b>rompe el código a propósito</b>. Si el test sigue en verde, el test no vale.', en: 'The check that cannot be faked: <b>break the code on purpose</b>. If the test stays green, the test is worthless.' },
    ],
    cuerpo: [
      { k: 'h2', es: 'El verde que no significa nada', en: 'The green that means nothing' },
      { k: 'p', es: 'Le pides a un agente que arregle un fallo y que deje la batería en verde. Vuelve en unos minutos: verde, cobertura igual o mejor, diff pequeño y una explicación impecable. Descargas el cambio y el fallo sigue exactamente igual en producción.', en: 'You ask an agent to fix a bug and leave the suite green. It comes back in minutes: green, coverage the same or better, a small diff and a flawless explanation. You ship the change and the bug is still there in production, unchanged.' },
      { k: 'p', es: 'No ha mentido. Ha hecho lo que le pediste. El problema es que «los tests pasan» y «el código funciona» son dos cosas distintas, y solo una de las dos era fácil de conseguir.', en: 'It did not lie. It did what you asked. The problem is that "the tests pass" and "the code works" are two different things, and only one of them was easy to achieve.' },
      { k: 'fig', svg: figVerde, es: 'El patrón más común: un mock colocado justo delante del punto que fallaba. El test ejecuta, la cobertura cuenta la línea y el código real no llega a correr.', en: 'The most common pattern: a mock placed right in front of the failing point. The test runs, coverage counts the line, and the real code never executes.' },

      { k: 'h2', es: 'Las seis formas de poner algo en verde sin arreglarlo', en: 'The six ways to go green without fixing anything' },
      { k: 'h3', es: 'Mockear justo el punto que falla', en: 'Mocking exactly the failing point' },
      { k: 'p', es: 'El más frecuente con diferencia. En vez de arreglar la función que rompe, se sustituye por una que devuelve lo que el test espera. Se reconoce porque el mock aparece en el mismo cambio que el arreglo y es más específico que el resto de mocks del fichero.', en: 'By far the most frequent. Instead of fixing the function that breaks, it is replaced with one that returns whatever the test expects. You spot it because the mock appears in the same change as the fix and is more specific than every other mock in the file.' },
      { k: 'h3', es: 'La aserción que no asegura nada', en: 'The assertion that asserts nothing' },
      { k: 'p', es: 'Comprobar que el resultado «existe», que «no es nulo» o que «es de tipo objeto». Formalmente es una aserción; en la práctica pasa con casi cualquier cosa que devuelvas, incluido un objeto vacío o un error serializado.', en: 'Checking that the result "exists", that it "is not null" or that it "is an object". Formally it is an assertion; in practice it passes with almost anything you return, including an empty object or a serialised error.' },
      { k: 'h3', es: 'Capturar la excepción y seguir', en: 'Swallowing the exception' },
      { k: 'p', es: 'Envolver la llamada en un bloque que atrapa cualquier error y no lo vuelve a lanzar. El test ya no puede fallar por definición: pase lo que pase, termina bien.', en: 'Wrapping the call in a block that catches any error and never rethrows it. The test can no longer fail by construction: whatever happens, it finishes cleanly.' },
      { k: 'h3', es: 'El test que nunca llama al código', en: 'The test that never calls the code' },
      { k: 'p', es: 'Se prepara todo, se declara el resultado esperado y se compara con un valor calculado dentro del propio test. Nada del módulo bajo prueba llega a ejecutarse. Este es el único de los seis que la cobertura sí delata.', en: 'Everything gets set up, the expected result is declared, and it is compared against a value computed inside the test itself. Nothing from the module under test ever runs. This is the only one of the six that coverage does flag.' },
      { k: 'h3', es: 'Regenerar el snapshot', en: 'Regenerating the snapshot' },
      { k: 'p', es: 'La salida cambió, así que se actualiza la referencia y vuelve a coincidir. A veces es lo correcto; el problema es que es indistinguible de aceptar una regresión, y el diff del snapshot rara vez se lee.', en: 'The output changed, so the reference gets updated and matches again. Sometimes that is correct; the problem is it is indistinguishable from accepting a regression, and snapshot diffs are rarely read.' },
      { k: 'h3', es: 'El skip condicional', en: 'The conditional skip' },
      { k: 'p', es: 'Marcar el test como omitido, o condicionarlo a una variable de entorno que nunca está puesta en integración continua. El informe dice «0 fallos» y es verdad: también dice «1 omitido», pero eso no lo mira nadie.', en: 'Marking the test as skipped, or gating it behind an environment variable that is never set in CI. The report says "0 failures" and that is true: it also says "1 skipped", but nobody looks at that.' },

      { k: 'h2', es: 'Qué mirar en cada caso', en: 'What to look for in each case' },
      { k: 'table', caption: { es: 'Patrones de tests amañados, cómo se detectan y por qué la cobertura no los ve.', en: 'Gamed-test patterns, how to detect them and why coverage does not see them.' },
        head: [{ es: 'Patrón', en: 'Pattern' }, { es: 'Señal en el cambio', en: 'Signal in the diff' }, { es: '¿Lo ve la cobertura?', en: 'Does coverage see it?' }],
        rows: [
          [{ es: 'Mock del punto que falla', en: 'Mock of the failing point' }, { es: 'Mock nuevo en el mismo commit que el arreglo', en: 'New mock in the same commit as the fix' }, { es: 'No', en: 'No' }],
          [{ es: 'Aserción vacía', en: 'Empty assertion' }, { es: 'Solo comprueba existencia o tipo', en: 'Only checks existence or type' }, { es: 'No', en: 'No' }],
          [{ es: 'Excepción capturada', en: 'Swallowed exception' }, { es: 'Try sin volver a lanzar dentro del test', en: 'Try with no rethrow inside the test' }, { es: 'No', en: 'No' }],
          [{ es: 'No llama al código', en: 'Never calls the code' }, { es: 'El módulo probado no aparece', en: 'The module under test never appears' }, { es: 'Sí', en: 'Yes' }],
          [{ es: 'Snapshot regenerado', en: 'Regenerated snapshot' }, { es: 'Cambia la referencia, no el código', en: 'The reference changes, not the code' }, { es: 'No', en: 'No' }],
          [{ es: 'Skip condicional', en: 'Conditional skip' }, { es: 'Aumenta el contador de omitidos', en: 'The skipped counter goes up' }, { es: 'No', en: 'No' }],
        ] },
      { k: 'p', es: 'La conclusión incómoda de esa columna: la métrica en la que más confía la gente es la que menos sirve aquí. La cobertura mide qué líneas se ejecutan, no si alguien comprobó el resultado.', en: 'The uncomfortable conclusion from that column: the metric people trust most is the least useful one here. Coverage measures which lines execute, not whether anyone checked the result.' },

      { k: 'h2', es: 'La única prueba que no se puede falsear', en: 'The one check that cannot be faked' },
      { k: 'p', es: 'Rompe el código a propósito y vuelve a ejecutar la batería. Cambia un signo, invierte una condición, devuelve siempre el mismo valor. Si los tests siguen en verde, esos tests no prueban nada, digan lo que digan la cobertura y el informe.', en: 'Break the code on purpose and run the suite again. Flip a sign, invert a condition, always return the same value. If the tests stay green, those tests prove nothing, whatever coverage and the report say.' },
      { k: 'p', es: 'Es la idea de las pruebas de mutación, y no hace falta una herramienta grande para empezar: con romper a mano los tres puntos que más te importan ya te enteras de en qué parte de tu batería puedes confiar. Lo caro no es la técnica, es la costumbre de no hacerlo nunca.', en: 'That is the idea behind mutation testing, and you do not need a heavyweight tool to start: breaking by hand the three points you care about most already tells you which part of your suite you can trust. The expensive thing is not the technique, it is the habit of never doing it.' },
      { k: 'quote', es: 'Mata tus propios tests antes de fiarte de un verde.', en: 'Kill your own tests before you trust a green run.' },
      { k: 'p', es: 'Cuando esto deja de ser una revisión manual y pasa a ser un requisito de cada cambio, conviene automatizarlo: es exactamente para lo que existe <a href="/veredicto/">Veredicto</a>, que revisa cada PR buscando estos patrones y bloquea el que los trae. El resto del método —aislamiento, medición y panel de jueces— está en <a href="/blog/flotas-agentes-ia/">cómo se dirige una flota de agentes</a>.', en: 'When this stops being a manual review and becomes a requirement on every change, it is worth automating: that is exactly what <a href="/veredicto/">Veredicto</a> exists for — it reviews every PR looking for these patterns and blocks the ones that carry them. The rest of the method —isolation, measurement and the judge panel— is in <a href="/blog/flotas-agentes-ia/">how to direct a fleet of AI agents</a>.' },
    ],
    faq: [
      { q: { es: '¿Los agentes hacen trampa a propósito?', en: 'Do agents cheat on purpose?' },
        a: { es: 'No hay intención detrás. Un agente optimiza el objetivo que se le da, y si el objetivo es «deja los tests en verde», mockear el punto que falla es una solución perfectamente válida para ese objetivo. El fallo está en el objetivo, no en el agente.', en: 'There is no intent behind it. An agent optimises the objective it is given, and if the objective is "leave the tests green", mocking the failing point is a perfectly valid solution to that objective. The flaw is in the objective, not the agent.' } },
      { q: { es: '¿No basta con exigir cobertura alta?', en: 'Is high coverage not enough?' },
        a: { es: 'No, y puede empeorarlo. Cinco de los seis patrones ejecutan la línea sin comprobar nada, así que suben la cobertura mientras destruyen la utilidad de la batería. Exigir un número de cobertura crea exactamente el incentivo para producirlos.', en: 'No, and it can make things worse. Five of the six patterns execute the line without checking anything, so they raise coverage while destroying the suite\'s usefulness. Demanding a coverage number creates exactly the incentive to produce them.' } },
      { q: { es: '¿Mockear está mal entonces?', en: 'So is mocking wrong?' },
        a: { es: 'Mockear está bien para aislar lo que es lento, externo o no determinista: una red, un reloj, un pago. Está mal cuando el mock cae justo encima de lo que la prueba dice estar probando. La señal es la posición del mock, no su existencia.', en: 'Mocking is fine for isolating what is slow, external or non-deterministic: a network, a clock, a payment. It is wrong when the mock lands right on top of what the test claims to be testing. The signal is where the mock sits, not that it exists.' } },
      { q: { es: '¿Cómo se revisa esto sin leer cada test a mano?', en: 'How do you review this without reading every test by hand?' },
        a: { es: 'Con dos capas. Una automática que busca los patrones en el diff —mock nuevo junto al arreglo, aserciones vacías, contadores de omitidos que suben— y una segunda, más cara pero definitiva, que rompe el código a propósito y comprueba que la batería se entera.', en: 'With two layers. An automatic one that hunts the patterns in the diff —a new mock next to the fix, empty assertions, a rising skipped counter— and a second, more expensive but conclusive one, that breaks the code on purpose and checks that the suite notices.' } },
      { q: { es: '¿Esto solo pasa con código escrito por IA?', en: 'Does this only happen with AI-written code?' },
        a: { es: 'No: los seis patrones llevan décadas apareciendo en código escrito por personas con prisa o con un objetivo de cobertura encima. Lo que cambia con los agentes es el volumen y la velocidad, que es lo que obliga a automatizar la detección.', en: 'No: all six patterns have been showing up for decades in code written by people in a hurry or with a coverage target hanging over them. What changes with agents is the volume and the speed, which is what forces you to automate the detection.' } },
    ],
    relacionados: ['flotas-agentes-ia', 'coste-real-agentes-ia'],
  },

  /* ────────────────────────────────────────────────────────────────────── 4 */
  {
    slug: 'coste-real-agentes-ia',
    fecha: '2026-08-19',
    minutos: 7,
    ogAccent: C.spark,
    ogPill: 'Coste',
    titulo: { es: 'Cuánto cuesta de verdad un agente de IA', en: 'What an AI agent really costs' },
    ogTitulo: { es: 'El coste real de un agente', en: 'The real cost of an agent' },
    metaTitulo: { es: 'Cuánto cuesta de verdad un agente de IA · Fervon', en: 'What an AI agent really costs · Fervon' },
    desc: {
      es: 'La factura del proveedor no es el coste. Dónde se esconde el gasto de un agente, cómo medirlo en local y cuándo compensa mover el modelo a tu GPU.',
      en: 'The provider invoice is not the cost. Where an agent\'s spend actually hides, how to measure it locally, and when moving the model to your own GPU pays off.',
    },
    lead: {
      es: 'La factura te dice cuánto has gastado. No te dice en qué, ni si la mitad se fue en reenviar el mismo contexto veinte veces.',
      en: 'The invoice tells you how much you spent. It does not tell you on what, nor whether half of it went on resending the same context twenty times.',
    },
    figuraHero: {
      es: 'La respuesta final es la partida más pequeña del gasto.',
      en: 'The final answer is the smallest line item in the spend.',
    },
    tldr: [
      { es: 'El <b>coste real</b> de los agentes <b>no está en la respuesta final</b>: está en el contexto que se reenvía en cada turno y en la salida de las herramientas que lee.', en: 'The <b>real cost</b> of agents is <b>not in the final answer</b>: it is in the context resent on every turn and in the tool output it reads.' },
      { es: 'Un agente que falla y reintenta puede costar <b>varias veces</b> lo que uno que acierta a la primera, y en la factura ambos son una línea igual.', en: 'An agent that fails and retries can cost <b>several times</b> what one that gets it right first time does, and on the invoice both look like the same line.' },
      { es: 'Para saberlo hay que <b>instrumentar la llamada</b>, no leer el panel del proveedor: por tarea, por herramienta y por reintento.', en: 'To know, you have to <b>instrument the call</b>, not read the provider dashboard: per task, per tool and per retry.' },
      { es: 'El otro coste es la <b>latencia</b>. Un modelo local puede salir más caro en euros y mucho más barato en espera — o justo al revés.', en: 'The other cost is <b>latency</b>. A local model can be more expensive in euros and far cheaper in waiting — or exactly the other way round.' },
    ],
    cuerpo: [
      { k: 'h2', es: 'La factura no es el coste', en: 'The invoice is not the cost' },
      { k: 'p', es: 'El panel del proveedor te da un total y, con suerte, un desglose por día o por clave. Eso responde «cuánto», que es la pregunta menos útil. Las preguntas que sirven son otras: qué tarea se comió el presupuesto, qué herramienta devuelve tanto texto que el modelo paga por leerlo, y cuántos de esos euros se fueron en intentos que acabaron descartados.', en: 'The provider dashboard gives you a total and, if you are lucky, a breakdown by day or by key. That answers "how much", which is the least useful question. The useful ones are different: which task ate the budget, which tool returns so much text that the model pays to read it, and how many of those euros went on attempts that ended up discarded.' },
      { k: 'p', es: 'Ninguna de esas tres se puede contestar desde fuera. Hay que medir en el punto donde se hace la llamada.', en: 'None of those three can be answered from outside. You have to measure at the point where the call is made.' },

      { k: 'h2', es: 'Dónde se esconde el gasto', en: 'Where the spend hides' },
      { k: 'fig', svg: figCoste, es: 'Las proporciones varían con cada tarea; el orden casi nunca. La respuesta que querías es lo más pequeño que has pagado.', en: 'The proportions vary with every task; the ordering almost never does. The answer you wanted is the smallest thing you paid for.' },
      { k: 'h3', es: 'El contexto reenviado', en: 'Resent context' },
      { k: 'p', es: 'Cada turno de una conversación con herramientas vuelve a enviar todo lo anterior. En una tarea de veinte pasos, el primer mensaje se ha pagado veinte veces. Es la partida más grande casi siempre y la más invisible, porque no aparece como una acción: aparece como «tokens de entrada».', en: 'Every turn of a tool-using conversation resends everything that came before. In a twenty-step task, the first message has been paid for twenty times. It is nearly always the biggest line item and the most invisible one, because it does not show up as an action: it shows up as "input tokens".' },
      { k: 'h3', es: 'La salida de las herramientas', en: 'Tool output' },
      { k: 'p', es: 'Una herramienta que devuelve el fichero entero cuando hacían falta diez líneas no cuesta lo que cuesta ejecutarla: cuesta lo que cuesta que el modelo la lea, en ese turno y en todos los siguientes. Recortar la salida de las herramientas suele ser la optimización con mejor relación esfuerzo-ahorro que existe.', en: 'A tool that returns the whole file when ten lines were needed does not cost what it costs to run: it costs what it costs for the model to read it, on that turn and on every turn after. Trimming tool output is usually the best effort-to-savings optimisation available.' },
      { k: 'h3', es: 'Los reintentos', en: 'Retries' },
      { k: 'p', es: 'Un agente que se equivoca, lo detecta y reintenta hace exactamente lo que debe. Pero cada reintento arrastra el contexto acumulado, así que el tercer intento es bastante más caro que el primero. Un agente con una tasa de acierto mediocre no cuesta un poco más: cuesta varias veces más.', en: 'An agent that gets something wrong, notices and retries is doing exactly what it should. But every retry drags the accumulated context along, so the third attempt is considerably more expensive than the first. An agent with a mediocre success rate does not cost a bit more: it costs several times more.' },
      { k: 'h3', es: 'El contexto muerto', en: 'Dead context' },
      { k: 'p', es: 'Ficheros cargados «por si acaso», resultados de búsquedas que ya no vienen a cuento, instrucciones repetidas en cada turno. Sigue pagándose en cada llamada aunque no aporte nada a la que viene.', en: 'Files loaded "just in case", search results that stopped being relevant, instructions repeated on every turn. It keeps getting paid for on every call even when it contributes nothing to the next one.' },

      { k: 'h2', es: 'Cómo medirlo', en: 'How to measure it' },
      { k: 'table', caption: { es: 'Partidas de gasto de un agente, dónde se esconden y qué hay que medir para verlas.', en: 'An agent\'s spend line items, where they hide and what to measure to see them.' },
        head: [{ es: 'Partida', en: 'Line item' }, { es: 'Dónde se esconde', en: 'Where it hides' }, { es: 'Qué medir', en: 'What to measure' }],
        rows: [
          [{ es: 'Contexto reenviado', en: 'Resent context' }, { es: 'Tokens de entrada por turno', en: 'Input tokens per turn' }, { es: 'Turnos por tarea', en: 'Turns per task' }],
          [{ es: 'Salida de herramientas', en: 'Tool output' }, { es: 'Entrada del turno siguiente', en: 'The next turn\'s input' }, { es: 'Bytes devueltos por llamada', en: 'Bytes returned per call' }],
          [{ es: 'Reintentos', en: 'Retries' }, { es: 'Repetición de la misma tarea', en: 'Repetition of the same task' }, { es: 'Tasa de acierto a la primera', en: 'First-attempt success rate' }],
          [{ es: 'Contexto muerto', en: 'Dead context' }, { es: 'Prompt de sistema y ficheros', en: 'System prompt and files' }, { es: 'Tokens nunca referenciados', en: 'Tokens never referenced' }],
          [{ es: 'Latencia', en: 'Latency' }, { es: 'Tiempo de espera, no la factura', en: 'Waiting time, not the invoice' }, { es: 'Segundos hasta el primer token', en: 'Seconds to first token' }],
        ] },
      { k: 'p', es: 'Todo eso vive en la propia llamada, así que la instrumentación tiene que estar ahí: registrar cada llamada al modelo, cada herramienta invocada y su coste, ligadas a la tarea que las provocó. Es exactamente lo que hace <a href="/lookspan/">Lookspan</a>, y en local: los datos no salen de tu máquina, que en algo que registra tus prompts no es un detalle menor.', en: 'All of it lives in the call itself, so the instrumentation has to live there: record every model call, every tool invoked and its cost, tied to the task that triggered them. That is exactly what <a href="/lookspan/">Lookspan</a> does, and it does it locally: the data never leaves your machine, which for something recording your prompts is not a minor detail.' },

      { k: 'h2', es: 'El coste que no aparece en ninguna factura', en: 'The cost that appears on no invoice' },
      { k: 'p', es: 'La espera. Un agente que tarda cuarenta segundos en empezar a responder no cuesta más dinero que uno que tarda cuatro, pero cambia por completo cómo trabajas con él: con cuarenta segundos te vas a otra cosa y pierdes el hilo; con cuatro, iteras.', en: 'Waiting. An agent that takes forty seconds to start answering costs no more money than one that takes four, but it completely changes how you work with it: at forty seconds you go do something else and lose the thread; at four, you iterate.' },
      { k: 'p', es: 'Ahí es donde entra la pregunta del modelo local, y no tiene una respuesta única. Un modelo en tu GPU no tiene coste por token, pero sí tiene coste de espera, de memoria y de calidad. Lo único que zanja la discusión es medirlo en tu máquina con tu carga: cuántos tokens por segundo, con qué modelo y con cuánta memoria. Para eso está <a href="/inferbench/">inferbench</a>.', en: 'That is where the local-model question comes in, and it has no single answer. A model on your GPU has no per-token cost, but it does have a cost in waiting, in memory and in quality. The only thing that settles the argument is measuring it on your machine with your workload: how many tokens per second, with which model and with how much memory. That is what <a href="/inferbench/">inferbench</a> is for.' },
      { k: 'ul', items: [
        { es: '<b>Compensa el local</b> cuando la tarea es repetitiva, tolera un modelo pequeño y te importa que no salgan datos de la máquina.', en: '<b>Local pays off</b> when the task is repetitive, tolerates a small model and you care that data never leaves the machine.' },
        { es: '<b>Compensa la API</b> cuando la tarea es difícil, se hace pocas veces al día y equivocarse sale más caro que el token.', en: '<b>The API pays off</b> when the task is hard, happens a few times a day and being wrong costs more than the tokens.' },
        { es: '<b>Casi siempre compensa mezclar</b>: lo mecánico en local, el criterio a la API.', en: '<b>Mixing nearly always pays off</b>: mechanical work locally, judgement calls to the API.' },
      ] },
      { k: 'p', es: 'Y una advertencia sobre el ahorro fácil: recortar contexto a lo bruto abarata la llamada y encarece la tarea, porque sube los reintentos. Por eso hay que mirar el coste por tarea terminada, no por llamada. Cómo se organiza todo esto alrededor de una flota está en <a href="/blog/flotas-agentes-ia/">el artículo del método</a>.', en: 'And a warning about easy savings: trimming context bluntly makes the call cheaper and the task more expensive, because it pushes up retries. That is why you look at cost per completed task, not per call. How all of this is organised around a fleet is in <a href="/blog/flotas-agentes-ia/">the method article</a>.' },
    ],
    faq: [
      { q: { es: '¿Por qué el panel de mi proveedor no me vale?', en: 'Why is my provider dashboard not enough?' },
        a: { es: 'Porque agrega por clave y por día, no por tarea. Te dice que gastaste una cantidad, no qué tarea la consumió ni cuánto de eso fueron reintentos. Para eso hay que instrumentar en el punto de la llamada.', en: 'Because it aggregates by key and by day, not by task. It tells you that you spent an amount, not which task consumed it or how much of it was retries. For that you have to instrument at the call site.' } },
      { q: { es: '¿Cuál es la partida más grande normalmente?', en: 'Which line item is usually biggest?' },
        a: { es: 'El contexto reenviado. En una conversación con herramientas, cada turno vuelve a mandar todo lo anterior, así que el gasto crece más que linealmente con el número de pasos aunque cada mensaje nuevo sea corto.', en: 'Resent context. In a tool-using conversation every turn resends everything before it, so spend grows faster than linearly with the number of steps even when each new message is short.' } },
      { q: { es: '¿Un modelo local sale más barato?', en: 'Is a local model cheaper?' },
        a: { es: 'En coste por token, sí: es cero. En coste total, depende de la tasa de acierto y de la espera. Un modelo pequeño que necesita tres intentos puede acabar costando más tiempo del que ahorra en dinero. La única forma de saberlo es medirlo en tu propia máquina.', en: 'In cost per token, yes: it is zero. In total cost, it depends on the success rate and the waiting. A small model that needs three attempts can end up costing more time than it saves in money. The only way to know is to measure it on your own machine.' } },
      { q: { es: '¿Cómo se reduce el gasto sin empeorar los resultados?', en: 'How do you cut spend without hurting results?' },
        a: { es: 'Por orden de rentabilidad: recortar lo que devuelven las herramientas, quitar del contexto lo que ya no se usa, y subir la tasa de acierto a la primera. Las tres bajan la factura sin tocar la calidad. Recortar el contexto a lo bruto la baja también, pero sube los reintentos.', en: 'In order of return: trim what the tools give back, drop from context whatever is no longer used, and raise the first-attempt success rate. All three cut the invoice without touching quality. Blunt context trimming cuts it too, but pushes retries up.' } },
      { q: { es: '¿Qué hay que registrar como mínimo?', en: 'What is the minimum to record?' },
        a: { es: 'Por cada llamada: tokens de entrada y de salida, modelo, duración, herramienta invocada si la hay, y el identificador de la tarea que la provocó. Con eso ya se puede contestar cuánto cuesta una tarea terminada, que es la única cifra que sirve para decidir.', en: 'Per call: input and output tokens, model, duration, the tool invoked if any, and the identifier of the task that triggered it. With that you can already answer what a completed task costs, which is the only figure useful for deciding.' } },
    ],
    relacionados: ['flotas-agentes-ia', 'estudio-software-autonomo'],
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   NOVEDADES DE LOS PROYECTOS
   --------------------------------------------------------------------------
   La línea de publicaciones de /blog/ (Noticias). Van AQUÍ y no como página
   propia a propósito: una nota de versión de cinco líneas convertida en URL
   suelta es contenido pobre, y un puñado de páginas pobres arrastra a las
   buenas. Como entradas del índice, en cambio, dan a la sección la señal de
   frescura que Google busca sin crear nada delgado.

   REGLA: aquí solo entra lo que se puede comprobar en el repositorio —
   versión publicada y su entrada de CHANGELOG. Nada «en camino».
   Para añadir una: copia el bloque de arriba y ponlo el primero.
   ══════════════════════════════════════════════════════════════════════════ */
export const NOVEDADES = [
  {
    fecha: '2026-08-12',
    proyecto: 'Veredicto',
    url: '/veredicto/',
    version: 'v0.4.0',
    titulo: { es: 'Veredicto pasa a ser de pago, con la licencia verificada sin salir del runner', en: 'Veredicto goes paid, with the licence verified without leaving the runner' },
    cuerpo: {
      es: 'Un producto, $19 por repositorio, self-serve y sin escalones. La parte interesante es cómo se comprueba la licencia: una firma Ed25519 validada <b>en local</b> contra una clave pública incrustada en el código. Sin servidor de licencias, sin llamada a casa y sin telemetría — en un runner sin salida a internet sigue funcionando. Una herramienta que lee tus diffs no tiene por qué informar sobre ellos, y eso vale también para su propio cobro. El control es <b>fail-closed</b> y corre antes de leer el diff: una ejecución sin licencia falla y dice por qué, nunca se parece a «Veredicto pasó y tu PR está limpio». Todo lo anterior a la 0.3.3 sigue siendo MIT, de forma irrevocable.',
      en: 'One product, $19 per repository, self-serve and with no tiers. The interesting part is how the licence is checked: an Ed25519 signature validated <b>locally</b> against a public key embedded in the source. No licence server, no phone-home and no telemetry — on a runner with no egress it still works. A tool that reads your diffs has no business reporting on them, and that applies to its own billing too. The gate is <b>fail-closed</b> and runs before the diff is read: an unlicensed run fails and says why, and never resembles "Veredicto ran and your PR is clean". Everything up to 0.3.3 stays MIT, irrevocably.',
    },
  },
  {
    fecha: '2026-08-12',
    proyecto: 'launchpad',
    url: '/launchpad/',
    version: 'v1.3.0',
    titulo: { es: 'Abrir un proyecto en tu editor desde el panel — y un agujero de seguridad cerrado', en: 'Open a project in your editor from the panel — and a security hole closed' },
    cuerpo: {
      es: 'El cajón de detalle ya abre cualquier proyecto en <b>tu editor, tu explorador de archivos o una terminal</b>: el <code>cd</code> que el README prometía ahorrarte. El endpoint existía pero ningún botón lo llamaba, y solo sabía de VS Code; ahora el editor sale de <code>settings.editorCommand</code>, así que <code>subl</code>, <code>webstorm</code> o <code>nvim</code> valen igual. De paso se cerró algo más serio: la ruta antigua usaba <code>execFile(cmd, [path], { shell: true })</code>, que concatena los argumentos en una cadena de shell <b>sin escaparlos</b> — el nombre de una carpeta de proyecto podía ejecutar comandos.',
      en: 'The detail drawer now opens any project in <b>your editor, your file manager or a terminal</b>: the <code>cd</code> the README promised to save you. The endpoint existed but no button ever called it, and it only knew about VS Code; the editor now comes from <code>settings.editorCommand</code>, so <code>subl</code>, <code>webstorm</code> or <code>nvim</code> work just as well. Something more serious got closed along the way: the old route used <code>execFile(cmd, [path], { shell: true })</code>, which concatenates arguments into a shell string <b>without escaping them</b> — a project folder name could run commands.',
    },
  },
  {
    fecha: '2026-08-12',
    proyecto: 'ClaudeScope',
    url: '/claudescope/',
    version: 'v0.5',
    titulo: { es: 'Saltar al mensaje, resumen semanal e informe HTML que se abre sin conexión', en: 'Jump to the message, a weekly digest and an HTML report that opens offline' },
    cuerpo: {
      es: 'Abrir una sesión desde un resultado de búsqueda ahora <b>baja hasta el mensaje</b> que coincidió y lo resalta, que era la mitad que le faltaba al buscar→leer. Llega también <code>--weekly</code>, un «Scope Report» en texto plano —esta semana contra la anterior, racha, arquetipo, proyecto principal, percentil— pensado para una tarea programada, y la exportación a un <b>.html autocontenido</b> que se abre sin conexión. Y modo equipo local: <code>--dump-sessions</code> vuelca las sesiones y <code>--merge</code> junta varios volcados en una analítica común. Cero infraestructura y nada sube a ningún sitio.',
      en: 'Opening a session from a search result now <b>scrolls to the matched message</b> and highlights it, which was the missing half of find→read. There is also <code>--weekly</code>, a plain-text "Scope Report" —this week versus last, streak, archetype, top project, percentile— meant for a scheduled task, and export to a <b>self-contained .html</b> that opens offline. Plus local team mode: <code>--dump-sessions</code> writes a session dump and <code>--merge</code> aggregates several dumps into shared analytics. Zero infrastructure and nothing gets uploaded.',
    },
  },
  {
    fecha: '2026-08-19',
    proyecto: 'Lookspan',
    url: '/lookspan/',
    version: 'v0.5.3',
    titulo: { es: 'Seguridad endurecida y Postgres externo', en: 'Hardened security and external Postgres' },
    cuerpo: {
      es: 'Lookspan puede apoyarse ahora en un <b>Postgres externo</b> además del almacenamiento local, y trae un endurecimiento de seguridad en el servidor de ingesta. Sigue siendo local-first: el dashboard vive en <code>127.0.0.1:3100</code> con <code>npx lookspan</code> y ningún span sale de tu máquina si no se lo pides.',
      en: 'Lookspan can now sit on an <b>external Postgres</b> alongside local storage, and ships a security hardening pass on the ingest server. It stays local-first: the dashboard lives at <code>127.0.0.1:3100</code> via <code>npx lookspan</code> and no span leaves your machine unless you ask it to.',
    },
  },
];
