/* Genera src-i18n/about/index.html reutilizando el nav y el footer de contacto,
   que son los bloques compartidos del sitio. El texto bilingüe se declara como
   pares {es,en} y el escapado del atributo data-en lo hace esc(), que es justo
   donde se rompen estas páginas cuando se escriben a mano. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:/Users/jonat/Desktop/proyects/fervon';
const contacto = fs.readFileSync(path.join(ROOT, 'src-i18n/contacto/index.html'), 'utf8').replace(/\r\n/g, '\n');

const NAV = contacto.match(/ {2}<nav><div class="bar">[\s\S]*?<\/div><\/nav>\n/)[0]
  .replace('<a href="/about/" data-en="About">Sobre Fervon</a>',
           '<a href="/about/" aria-current="page" data-en="About">Sobre Fervon</a>')
  .replace('<a class="cta" href="#top" aria-current="page" data-en="Let\'s talk">Hablemos</a>',
           '<a class="cta" href="/contacto/" data-en="Let\'s talk">Hablemos</a>');
const FOOTER = contacto.match(/ {2}<footer><div class="wrap">[\s\S]*?<\/div><\/footer>\n/)[0];
if (!NAV || !FOOTER) throw new Error('no se han podido extraer nav/footer de contacto');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/* t() escribe el nodo español y cuelga el inglés del atributo, que es el
   contrato que espera scripts/i18n-build.mjs. */
const t = (es, en) => `data-en="${esc(en)}">${es}`;

const P = [
  ['Trace', '/trace/', 'Tu memoria personal, en tu máquina. Sin grabar la pantalla.', 'Your personal memory, on your machine. No screen recording.'],
  ['Veredicto', '/veredicto/', 'Pilla a los agentes amañando tus tests, en CI.', 'Catch agents gaming your tests, in CI.'],
  ['inferbench', '/inferbench/', 'Mide qué LLM local rinde de verdad en tu GPU.', 'Measure which local LLM actually performs on your GPU.'],
  ['Lookspan', '/lookspan/', 'Observabilidad local-first para agentes de IA.', 'Local-first observability for AI agents.'],
  ['ClaudeScope', '/claudescope/', 'Busca en todas tus sesiones de Claude Code.', 'Full-text search across every Claude Code session.'],
  ['launchpad', '/launchpad/', 'Levanta todos tus proyectos desde un panel.', 'Spin up every project from one panel.'],
  ['Pregón', '/pregon/', 'Publica una novedad en 8+ canales de una vez.', 'Publish one update to 8+ channels at once.'],
  ['Regenta', '/regenta/', 'El sistema operativo de agentes que mueve el estudio.', 'The agent operating system that runs the studio.'],
];

const productos = P.map(([n, url, des, den]) =>
  `        <li><a href="${url}"><b>${n}</b><span ${t(des, den)}</span></a></li>`).join('\n');

const FAQ = [
  ['¿Qué significa «software autónomo»?',
   'What does "autonomous software" mean?',
   'Que el trabajo de construir lo ejecutan agentes de IA en paralelo y sin pausa, y que una persona pone el criterio: qué se construye, qué se acepta y qué se tira. Autónomo no quiere decir sin supervisión — quiere decir que la ejecución no depende de que haya alguien tecleando.',
   'That the building work is executed by AI agents running in parallel around the clock, while one person supplies the judgement: what gets built, what gets accepted and what gets thrown away. Autonomous does not mean unsupervised — it means execution no longer depends on someone typing.'],
  ['¿Qué son los agentes de IA de Fervon?',
   'What are Fervon\'s AI agents?',
   'Procesos que leen el repositorio, escriben código, ejecutan las pruebas y se revisan entre ellos. Se lanzan por flotas, cada uno con su encargo, y un panel de jueces con criterios distintos tiene que dar el visto bueno antes de que nada se fusione.',
   'Processes that read the repository, write code, run the tests and review each other. They are launched in fleets, each with its own brief, and a panel of judges applying different lenses has to sign off before anything gets merged.'],
  ['¿Fervon es una agencia de desarrollo?',
   'Is Fervon a development agency?',
   'No. Fervon es un estudio de software autónomo: publica productos propios y herramientas open source. Sí acepta encargos a medida, pero por proyecto y con alcance y precio cerrados antes de empezar, nunca por horas ni por perfiles.',
   'No. Fervon is an autonomous software studio: it ships its own products and open-source tools. It does take bespoke work, but per project and with scope and price closed before anything starts — never by the hour or by headcount.'],
  ['¿Qué tecnologías utiliza Fervon?',
   'What technologies does Fervon use?',
   'TypeScript/Node y React en el front, Python donde encaja, SQLite y Postgres para datos, y LLMs tanto de API (Claude) como locales vía llama.cpp. Casi todo se diseña para correr en la máquina del usuario.',
   'TypeScript/Node and React on the front end, Python where it fits, SQLite and Postgres for data, and LLMs both from an API (Claude) and running locally via llama.cpp. Almost everything is designed to run on the user\'s own machine.'],
  ['¿Dónde puedo ver el código de Fervon?',
   'Where can I see Fervon\'s code?',
   'En GitHub, en la organización Fervon. La mayoría de las herramientas son open source con licencia permisiva, así que la promesa de «esto no sale de tu máquina» se puede comprobar leyendo el código en vez de creyéndosela.',
   'On GitHub, under the Fervon organization. Most of the tools are open source under a permissive licence, so the "this never leaves your machine" promise can be verified by reading the code instead of taking it on faith.'],
  ['¿De dónde viene el nombre Fervon?',
   'Where does the name Fervon come from?',
   'Del latín fervere — arder, hervir, bullir con fervor. De ahí el alma de forja del estudio y el lema: forjado al rojo vivo.',
   'From the Latin fervere — to burn, to boil, to seethe with fervor. Hence the studio\'s forge soul and its motto: forged red-hot.'],
];

const faqHtml = FAQ.map(([qEs, qEn, aEs, aEn]) => `        <details>
          <summary ${t(qEs, qEn)}</summary>
          <p ${t(aEs, aEn)}</p>
        </details>`).join('\n');

const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      '@id': 'https://fervon.dev/about/#webpage',
      url: 'https://fervon.dev/about/',
      name: 'Sobre Fervon — estudio de software autónomo',
      description: 'Qué es Fervon, quién está detrás y cómo se construye software dirigiendo flotas de agentes de IA.',
      inLanguage: 'es',
      isPartOf: { '@id': 'https://fervon.dev/#website' },
      about: { '@id': 'https://fervon.dev/#organization' },
      mainEntity: { '@id': 'https://fervon.dev/#organization' },
      breadcrumb: { '@id': 'https://fervon.dev/about/#breadcrumb' },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://fervon.dev/about/#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Fervon', item: 'https://fervon.dev/' },
        { '@type': 'ListItem', position: 2, name: 'Sobre Fervon', item: 'https://fervon.dev/about/' },
      ],
    },
    {
      '@type': 'Organization',
      '@id': 'https://fervon.dev/#organization',
      name: 'Fervon',
      alternateName: ['Fervon Studio', 'Fervon.dev'],
      url: 'https://fervon.dev/',
      logo: {
        '@type': 'ImageObject',
        '@id': 'https://fervon.dev/#logo',
        url: 'https://fervon.dev/assets/favicon-512.png',
        width: 512,
        height: 512,
        caption: 'Fervon',
      },
      image: { '@id': 'https://fervon.dev/#logo' },
      description: 'Fervon es un estudio de software autónomo: productos local-first, herramientas open source y desarrollo a medida construidos dirigiendo flotas de agentes de IA.',
      slogan: 'Forjado al rojo vivo',
      foundingDate: '2026',
      numberOfEmployees: { '@type': 'QuantitativeValue', value: 1 },
      knowsLanguage: ['es', 'en'],
      knowsAbout: [
        'Autonomous software development',
        'AI agents',
        'Local-first software',
        'Open-source developer tools',
        'LLM observability',
        'Large language model benchmarking',
      ],
      founder: { '@id': 'https://fervon.dev/#jonathan' },
      employee: { '@id': 'https://fervon.dev/#jonathan' },
      subjectOf: { '@id': 'https://fervon.dev/about/#webpage' },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: 'https://fervon.dev/contacto/',
        availableLanguage: ['es', 'en'],
      },
      sameAs: [
        'https://github.com/Fervon',
        'https://www.linkedin.com/company/fervondev',
        'https://www.npmjs.com/package/fervon',
        'https://dev.to/jonimatiin',
        'https://bsky.app/profile/jonimartin.bsky.social',
        'https://mastodon.social/@jonimartin',
      ],
    },
    {
      '@type': 'Person',
      '@id': 'https://fervon.dev/#jonathan',
      name: 'Jonathan Martín',
      jobTitle: 'Fundador de Fervon',
      description: 'Fundador y única persona de Fervon. Dirige flotas de agentes de IA que construyen productos local-first y herramientas open source.',
      url: 'https://fervon.dev/about/',
      worksFor: { '@id': 'https://fervon.dev/#organization' },
      knowsAbout: ['AI agents', 'TypeScript', 'Node.js', 'Python', 'Local-first software', 'Large language models'],
      sameAs: [
        'https://github.com/JoniMartin27',
        'https://dev.to/jonimatiin',
        'https://bsky.app/profile/jonimartin.bsky.social',
        'https://mastodon.social/@jonimartin',
      ],
    },
    {
      '@type': 'ItemList',
      '@id': 'https://fervon.dev/about/#productos',
      name: 'Productos de Fervon',
      numberOfItems: P.length,
      itemListElement: P.map(([n, url, des], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: n,
          url: 'https://fervon.dev' + url,
          applicationCategory: n === 'Trace' ? 'UtilitiesApplication' : 'DeveloperApplication',
          author: { '@id': 'https://fervon.dev/#organization' },
          publisher: { '@id': 'https://fervon.dev/#organization' },
        },
      })),
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://fervon.dev/about/#faq',
      mainEntity: FAQ.map(([qEs, , aEs]) => ({
        '@type': 'Question',
        name: qEs,
        acceptedAnswer: { '@type': 'Answer', text: aEs },
      })),
    },
  ],
};

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Sobre Fervon · Estudio de software autónomo</title>
  <meta name="description" content="Fervon es el estudio de software autónomo de Jonathan Martín: una persona dirigiendo flotas de agentes de IA que construyen productos local-first y herramientas open source." />
  <link rel="canonical" href="https://fervon.dev/about/" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta name="author" content="Fervon" />
  <meta name="theme-color" content="#0E0B0A" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png" />
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Fervon" />
  <meta property="og:title" content="Sobre Fervon · Estudio de software autónomo" />
  <meta property="og:description" content="Una persona, una flota de agentes de IA y un catálogo de productos local-first. Qué es Fervon y cómo se construye aquí." />
  <meta property="og:url" content="https://fervon.dev/about/" />
  <meta property="og:image" content="https://fervon.dev/assets/og-home.jpg" />
  <meta name="twitter:image" content="https://fervon.dev/assets/og-home.jpg" />
  <meta property="og:locale" content="es_ES" />
  <meta name="twitter:card" content="summary_large_image" />

  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
  </script>

  <link rel="preload" href="/assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin="">
  <link rel="stylesheet" href="/index.css?v=20260817d" />
  <link rel="stylesheet" href="/assets/shared.css?v=20260817d" />
</head>
<body class="about-page">
  <a class="skip" href="#top" ${t('Saltar al contenido', 'Skip to content')}</a>

${NAV}
  <main class="wrap">

    <!-- HERO -->
    <header class="chero" id="top">
      <h1 ${t('Sobre Fervon. <span class="grad">Estudio de software autónomo.</span>', 'About Fervon. <span class="grad">Autonomous software studio.</span>')}</h1>
      <p ${t('Fervon es un estudio de software autónomo fundado y dirigido por Jonathan Martín. Una persona pone el criterio; una flota de agentes de IA construye, prueba y despliega productos local-first y herramientas open source.', 'Fervon is an autonomous software studio founded and run by Jonathan Martín. One person supplies the judgement; a fleet of AI agents builds, tests and ships local-first products and open-source developer tools.')}</p>
      <div class="cta-row">
        <a class="btn btn-fire" href="/#productos" ${t('Ver los productos', 'See the products')}</a>
        <a class="btn btn-ghost" href="/contacto/" ${t('Hablemos', "Let's talk")}</a>
      </div>
    </header>

    <!-- seo:tldr -->
    <section class="sec seosec" id="resumen" aria-labelledby="resumen-h">
      <div class="wrap">
        <div class="tldr reveal">
          <h2 id="resumen-h" ${t('En 30 segundos', 'In 30 seconds')}</h2>
          <ul>
        <li ${t('<b>Fervon es un estudio de software autónomo.</b> No es una agencia ni un colectivo: es una persona, Jonathan Martín, dirigiendo flotas de agentes de IA.', '<b>Fervon is an autonomous software studio.</b> Not an agency and not a collective: one person, Jonathan Martín, directing fleets of AI agents.')}</li>
        <li ${t('El estudio publica <b>productos propios</b> —Trace y Veredicto— y <b>herramientas open source</b> gratis: inferbench, Lookspan, ClaudeScope, launchpad y Pregón.', 'The studio ships <b>its own products</b> —Trace and Veredicto— and <b>free, open-source tools</b>: inferbench, Lookspan, ClaudeScope, launchpad and Pregón.')}</li>
        <li ${t('Todo se diseña <b>local-first</b>: sin nube obligatoria, sin suscripción y sin telemetría por defecto.', 'Everything is designed <b>local-first</b>: no mandatory cloud, no subscription and no telemetry by default.')}</li>
        <li ${t('Todo se vende <b>self-serve</b>: se compra y se descarga desde la web, sin demo, sin llamada de ventas y sin dejar el correo.', 'Everything is sold <b>self-serve</b>: buy and download from the site, with no demo, no sales call and no email gate.')}</li>
        <li ${t('El mismo motor se aplica a <b>desarrollo a medida</b>, por proyecto y con precio cerrado antes de empezar.', 'The same engine is applied to <b>bespoke development</b>, per project and at a price closed before work starts.')}</li>
          </ul>
      <div class="cta-row s-tldrcta">
        <a class="btn btn-fire" href="/contacto/" ${t('Cuéntame tu proyecto', 'Tell me about your project')}</a>
      </div>
        </div>
      </div>
    </section>

    <!-- QUÉ ES FERVON -->
    <section class="sec" id="que-es">
      <h2 ${t('Qué es Fervon', 'What Fervon is')}</h2>
      <p class="sub" ${t('La definición corta, y luego la larga.', 'The short definition, then the long one.')}</p>
      <div class="services">
        <h3 ${t('Fervon es un estudio de software autónomo', 'Fervon is an autonomous software studio')}</h3>
        <p class="intro" ${t('Un taller donde el trabajo que antes ocupaba a un equipo de desarrollo lo ejecutan agentes de IA dirigidos por una sola persona. El resultado no son horas facturadas: son productos que se pueden comprar y herramientas que se pueden descargar. El nombre viene del latín <em>fervere</em> —arder, hervir, bullir con fervor—, de ahí el alma de forja y el lema: forjado al rojo vivo.', 'A workshop where the work that used to occupy a whole development team is executed by AI agents directed by a single person. The output is not billable hours: it is products you can buy and tools you can download. The name comes from the Latin <em>fervere</em> —to burn, to boil, to seethe with fervor—, hence the forge soul and the motto: forged red-hot.')}</p>
        <ul>
          <li ${t('Productos propios<span>Software terminado, con precio y sin suscripción.</span>', 'Own products<span>Finished software, priced once, no subscription.</span>')}</li>
          <li ${t('Herramientas open source<span>La mayor parte del catálogo es gratis e inspeccionable.</span>', 'Open-source tools<span>Most of the catalogue is free and inspectable.</span>')}</li>
          <li ${t('Infraestructura de agentes<span>El propio motor del estudio también es software.</span>', 'Agent infrastructure<span>The studio engine is itself a piece of software.</span>')}</li>
          <li ${t('Desarrollo a medida<span>El mismo método aplicado al problema de otra empresa.</span>', 'Bespoke development<span>The same method applied to another company&apos;s problem.</span>')}</li>
        </ul>
      </div>
    </section>

    <!-- QUÉ SIGNIFICA AUTÓNOMO -->
    <section class="sec" id="autonomo">
      <h2 ${t('Qué significa «autónomo»', 'What "autonomous" means')}</h2>
      <p class="sub" ${t('No es sin supervisión. Es sin cuello de botella humano en la ejecución.', 'Not unsupervised. Just without a human bottleneck in the execution.')}</p>
      <div class="steps">
        <div class="step">
          <span class="n">1</span>
          <h3 ${t('El criterio es humano', 'Judgement is human')}</h3>
          <p ${t('Qué se construye, qué se acepta y qué se tira lo decide una persona. Esa parte no se delega.', 'What gets built, what gets accepted and what gets thrown away is decided by a person. That part is not delegated.')}</p>
        </div>
        <div class="step">
          <span class="n">2</span>
          <h3 ${t('La ejecución es de la flota', 'Execution is the fleet&apos;s')}</h3>
          <p ${t('Varios agentes trabajan en paralelo sobre el mismo repositorio, cada uno con su encargo.', 'Several agents work in parallel on the same repository, each with its own brief.')}</p>
        </div>
        <div class="step">
          <span class="n">3</span>
          <h3 ${t('Nada pasa sin medirse', 'Nothing ships unmeasured')}</h3>
          <p ${t('Antes de dar un fallo por arreglado hay que reproducirlo. Un verde sin prueba no cuenta.', 'Before a bug is called fixed it has to be reproduced. A green run with no evidence does not count.')}</p>
        </div>
        <div class="step">
          <span class="n">4</span>
          <h3 ${t('Un panel de jueces revisa', 'A panel of judges reviews')}</h3>
          <p ${t('Agentes con criterios distintos intentan tumbar el cambio antes de que se fusione.', 'Agents applying different lenses try to knock the change down before it gets merged.')}</p>
        </div>
      </div>
    </section>

    <!-- QUIÉN ESTÁ DETRÁS -->
    <section class="sec" id="quien">
      <h2 ${t('Quién está detrás', 'Who is behind it')}</h2>
      <p class="sub" ${t('Una persona, con nombre y con GitHub.', 'One person, with a name and a GitHub.')}</p>
      <div class="services">
        <h3 ${t('Jonathan Martín, fundador de Fervon', 'Jonathan Martín, founder of Fervon')}</h3>
        <p class="intro" ${t('Desarrollador, en remoto desde España (CET) y trabajando con clientes en cualquier huso horario. Dirige cada proyecto de principio a fin: si escribes a Fervon, respondo yo, no un comercial ni un formulario. Todo lo que hay en este catálogo salió del mismo taller y del mismo método.', 'A developer, remote from Spain (CET) and working with clients in any timezone. He runs every project end to end: if you write to Fervon, you get me — not a salesperson and not a form. Everything in this catalogue came out of the same workshop and the same method.')}</p>
        <ul>
          <li><a href="https://github.com/JoniMartin27" rel="me">GitHub<span ${t('El código, los commits y los repositorios personales.', 'The code, the commits and the personal repositories.')}</span></a></li>
          <li><a href="https://github.com/Fervon" rel="me"><b ${t('GitHub de Fervon', 'Fervon on GitHub')}</b><span ${t('La organización donde vive el catálogo open source.', 'The organization where the open-source catalogue lives.')}</span></a></li>
          <li><a href="https://dev.to/jonimatiin" rel="me">DEV.to<span ${t('Artículos técnicos sobre agentes y software local-first.', 'Technical articles on agents and local-first software.')}</span></a></li>
          <li><a href="https://www.linkedin.com/company/fervondev" rel="me">LinkedIn<span ${t('La página del estudio, con las novedades.', 'The studio page, with the updates.')}</span></a></li>
        </ul>
      </div>
    </section>

    <!-- PRINCIPIOS -->
    <section class="sec" id="principios">
      <h2 ${t('En qué creo', 'What I believe')}</h2>
      <p class="sub" ${t('Cuatro reglas que explican casi todas las decisiones del estudio.', 'Four rules that explain almost every decision this studio makes.')}</p>
      <div class="proof">
        <div class="proofcard reveal i0">
          <div class="pf-h"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 18 2 12l6-6"/><path d="m16 6 6 6-6 6"/></svg><span ${t('Open source por defecto', 'Open source by default')}</span></div>
          <p ${t('Si no hay una razón para cerrarlo, el código se publica. Es más fácil confiar en lo que se puede leer.', 'If there is no reason to close it, the code gets published. It is easier to trust what you can read.')}</p>
        </div>
        <div class="proofcard reveal i1">
          <div class="pf-h"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/></svg><span ${t('Local-first y privado', 'Local-first and private')}</span></div>
          <p ${t('Tus datos se quedan en tu máquina. Sin nube obligatoria y sin telemetría por defecto.', 'Your data stays on your machine. No mandatory cloud and no telemetry by default.')}</p>
        </div>
        <div class="proofcard reveal i2">
          <div class="pf-h"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 3 14h8l-1 8 10-12h-8z"/></svg><span ${t('Self-serve, sin comerciales', 'Self-serve, no sales team')}</span></div>
          <p ${t('Todo se compra y se descarga solo. Sin demo, sin llamada y sin «déjanos tu correo».', 'Everything is bought and downloaded on your own. No demo, no call and no "leave us your email".')}</p>
        </div>
        <div class="proofcard reveal i3">
          <div class="pf-h"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span ${t('Precio cerrado, de una vez', 'Closed price, paid once')}</span></div>
          <p ${t('Pago único en los productos y precio por proyecto en los encargos. Nunca por horas.', 'One-time payment on products and a per-project price on commissions. Never by the hour.')}</p>
        </div>
      </div>
    </section>

    <!-- TECNOLOGÍA -->
    <section class="sec" id="tecnologia">
      <h2 ${t('La tecnología', 'The technology')}</h2>
      <p class="sub" ${t('El mismo stack detrás de los productos y de los encargos.', 'The same stack behind the products and the commissions.')}</p>
      <div class="services">
        <h3 ${t('Qué hay debajo', 'What is underneath')}</h3>
        <p class="intro" ${t('Nada exótico y nada de plataformas cerradas: herramientas que se pueden ejecutar en un portátil y que siguen funcionando sin conexión. Cuando un producto necesita un modelo, se prefiere que corra en la máquina del usuario antes que en una API ajena.', 'Nothing exotic and no closed platforms: tools you can run on a laptop and that keep working offline. When a product needs a model, running it on the user&apos;s machine is preferred over calling somebody else&apos;s API.')}</p>
        <ul>
          <li ${t('TypeScript, Node y React<span>El grueso de los productos y de las interfaces.</span>', 'TypeScript, Node and React<span>The bulk of the products and their interfaces.</span>')}</li>
          <li ${t('Python<span>Donde encaja: datos, scripting y el lado de los modelos.</span>', 'Python<span>Where it fits: data, scripting and the model side.</span>')}</li>
          <li ${t('SQLite y Postgres<span>Datos en local por defecto; Postgres cuando hace falta.</span>', 'SQLite and Postgres<span>Local data by default; Postgres when it is needed.</span>')}</li>
          <li ${t('Claude y LLMs locales vía llama.cpp<span>Agentes de API y modelos en la propia GPU.</span>', 'Claude and local LLMs via llama.cpp<span>API agents and models on your own GPU.</span>')}</li>
        </ul>
      </div>
    </section>

    <!-- CATÁLOGO -->
    <section class="sec" id="catalogo">
      <h2 ${t('El catálogo', 'The catalogue')}</h2>
      <p class="sub" ${t('Cada producto tiene su propia página, con su precio y su código.', 'Every product has its own page, with its price and its code.')}</p>
      <div class="services">
        <h3 ${t('Todo lo que ha salido de la forja', 'Everything that came out of the forge')}</h3>
        <p class="intro" ${t('Dos productos de pago y seis herramientas open source, todas construidas con el mismo método. Si solo vas a mirar una, empieza por la que resuelva un problema que tengas hoy.', 'Two paid products and six open-source tools, all built with the same method. If you are only going to look at one, start with whichever solves a problem you have today.')}</p>
        <ul>
${productos}
        </ul>
      </div>
    </section>

    <!-- seo:table -->
    <section class="sec seosec" id="comparativa" aria-labelledby="comparativa-h">
      <div class="wrap">
        <div class="center reveal">
          <span class="eye" ${t('De un vistazo', 'At a glance')}</span>
          <h2 id="comparativa-h" ${t('Estudio autónomo o agencia clásica', 'Autonomous studio or classic agency')}</h2>
        </div>
        <div class="tablewrap reveal">
          <table class="seotable">
            <caption class="vh" ${t('Diferencias entre un estudio de software autónomo y una agencia de desarrollo clásica.', 'Differences between an autonomous software studio and a classic development agency.')}</caption>
            <thead>
          <tr><th ${t('', '')}</th><th ${t('Fervon (estudio autónomo)', 'Fervon (autonomous studio)')}</th><th ${t('Agencia clásica', 'Classic agency')}</th></tr>
            </thead>
            <tbody>
          <tr><th ${t('Quién ejecuta', 'Who executes')}</th><td ${t('Flotas de agentes de IA', 'Fleets of AI agents')}</td><td ${t('Un equipo de personas', 'A team of people')}</td></tr>
          <tr><th ${t('Con quién hablas', 'Who you talk to')}</th><td ${t('Con quien construye', 'With whoever builds it')}</td><td ${t('Comercial y jefe de proyecto', 'Sales rep and project manager')}</td></tr>
          <tr><th ${t('Cómo se cobra', 'How it is billed')}</th><td ${t('Precio cerrado por proyecto', 'Closed price per project')}</td><td ${t('Por horas o por perfiles', 'By the hour or by headcount')}</td></tr>
          <tr><th ${t('Cómo se compra', 'How you buy')}</th><td ${t('Self-serve, sin demo', 'Self-serve, no demo')}</td><td ${t('Demo, propuesta y llamada', 'Demo, proposal and a call')}</td></tr>
          <tr><th ${t('Dónde viven tus datos', 'Where your data lives')}</th><td ${t('En tu máquina (local-first)', 'On your machine (local-first)')}</td><td ${t('Normalmente en su nube', 'Usually in their cloud')}</td></tr>
          <tr><th ${t('El código', 'The code')}</th><td ${t('Open source o tuyo al entregar', 'Open source, or yours on delivery')}</td><td ${t('Depende del contrato', 'Depends on the contract')}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="sec seosec" id="faq" aria-labelledby="faq-h">
      <div class="wrap">
        <div class="center reveal">
          <span class="eye" ${t('FAQ', 'FAQ')}</span>
          <h2 id="faq-h" ${t('Preguntas frecuentes sobre Fervon', 'Frequently asked questions about Fervon')}</h2>
        </div>
        <div class="faq reveal">
${faqHtml}
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="sec" id="hablemos">
      <div class="services">
        <h3 ${t('¿Tienes un problema que encaje aquí?', 'Got a problem that fits here?')}</h3>
        <p class="intro" ${t('Si algo del catálogo te sirve, cógelo: está a un clic y sin dejar el correo. Y si lo que necesitas es que el estudio construya algo para ti, cuéntamelo y te digo si encaja.', 'If something in the catalogue helps you, take it: it is one click away and there is no email gate. And if what you need is for the studio to build something for you, tell me about it and I will tell you whether it fits.')}</p>
        <div class="cta-row sact">
          <a class="btn btn-fire" href="/contacto/" ${t('Hablemos', "Let's talk")}</a>
          <a class="btn btn-ghost" href="/#productos" ${t('Ver los productos', 'See the products')}</a>
        </div>
      </div>
      <div class="fv-share">
        <button type="button" class="sharebtn" aria-label="Compartir esta página">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
          <span ${t('Compartir', 'Share')}</span>
        </button>
        <span class="sharemsg" role="status" aria-live="polite"></span>
      </div>
    </section>

  </main>

  <!-- seo:sticky -->
  <div class="stickycta">
    <div class="sct">
      <b ${t('Un estudio, una persona', 'One studio, one person')}</b>
      <span ${t('Coge una herramienta o cuéntame tu proyecto', 'Grab a tool or tell me about your project')}</span>
    </div>
    <a class="btn btn-fire" href="/contacto/" ${t('Hablemos', "Let's talk")}</a>
  </div>

${FOOTER}
  <script src="/assets/shared.js?v=20260817d" defer></script>
</body>
</html>
`;

fs.mkdirSync(path.join(ROOT, 'src-i18n/about'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src-i18n/about/index.html'), html);
console.log('escrito src-i18n/about/index.html —', Math.round(html.length / 1024), 'KB,', (html.match(/ data-en="/g) || []).length, 'nodos traducidos');
