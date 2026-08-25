/**
 * scripts/site-headers.mjs
 * ────────────────────────────────────────────────────────────────────────────
 * FUENTE ÚNICA de las cabeceras que sirve fervon.dev.
 *
 * Hoy las pone una Transform Rule del panel de Cloudflare (fuera del repo).
 * Cuando el hosting pase a Cloudflare Pages las pondrá el fichero `_headers`,
 * que genera `scripts/gen-headers.mjs` a partir de ESTE módulo. Vive aquí, y no
 * duplicado en cada script, porque lo que se bifurca se desincroniza: la CSP ya
 * llevaba una copia en `build-csp.mjs` y otra pegada a mano en el panel.
 *
 * ⚠ MIENTRAS EL DOMINIO SIGA EN GITHUB PAGES, `_headers` NO HACE NADA:
 *   GitHub Pages lo ignora por completo. Es preparación, no un cambio en vivo.
 *
 * ⚠ EL DÍA QUE SE MUEVA EL DOMINIO A PAGES, HAY QUE BORRAR LA TRANSFORM RULE.
 *   Si quedan las dos, el navegador recibe DOS cabeceras `Content-Security-
 *   Policy` y aplica la INTERSECCIÓN de ambas: cualquier origen que esté en una
 *   y no en la otra queda bloqueado, y se bloquea en silencio.
 */

const CF_INSIGHTS_SCRIPT = 'https://static.cloudflareinsights.com';
const CF_INSIGHTS_CONNECT = 'https://cloudflareinsights.com';

/* La política es estricta y CONSTANTE: sólo cambia si cambian los ORÍGENES
   permitidos, nunca porque cambie el contenido. Los bloques JSON-LD no se
   hashean —son data blocks y la CSP no los evalúa— - ver la cabecera de
   scripts/build-csp.mjs, donde está medido. */
export const CSP = [
  "default-src 'none'",
  `script-src 'self' ${CF_INSIGHTS_SCRIPT}`,
  "style-src 'self'",
  "img-src 'self' data:",
  // Las demos de producto de /inferbench/, /launchpad/ y /claudescope/ son
  // <video> desde el 2026-08-20. Sin esta línea caen en `default-src 'none'`,
  // no cargan, y sólo se ve su póster (que va por img-src).
  "media-src 'self'",
  "font-src 'self'",
  `connect-src 'self' https://formspree.io ${CF_INSIGHTS_CONNECT}`,
  "form-action 'self' https://formspree.io",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

/* Las demás cabeceras que hoy sirve la Transform Rule, copiadas de lo que
   devuelve producción (`Invoke-WebRequest -Method Head https://fervon.dev/`)
   para que al apagar la regla no se pierda ninguna sin que nadie se entere. */
export const SEGURIDAD = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=15552000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

/* ── Caché ──────────────────────────────────────────────────────────────────
 * El aviso «Usar tiempos de vida de caché eficientes» de PSI. MEDIDO el
 * 2026-08-20 contra producción (móvil, CPU x4, 1,6 Mbps): una visita repetida
 * con los assets ya en caché baja de 2068 ms de LCP a 992 ms y de 97 KiB a
 * 2 KiB. Es el pendiente que más vale de todo el informe.
 *
 * Es seguro poner un año en css/js porque van versionados con `?v=` (ver
 * scripts/bump-cache-buster.mjs): cada cambio publica una URL nueva.
 *
 * ⚠ TRAMPA: las fuentes, imágenes y vídeos de /assets/ NO llevan `?v=`. Con un
 * año de caché, si algún día se reemplaza uno MANTENIENDO EL NOMBRE, quien ya
 * lo tenga verá el viejo hasta un año. Regla: al reemplazar un binario, se le
 * cambia el nombre de fichero y se actualizan las referencias.
 */
const UN_ANIO = 'public, max-age=31536000, immutable';

export const CACHE = [
  // El HTML se revalida siempre: una corrección tiene que verse al momento.
  { ruta: '/*', cabeceras: { 'Cache-Control': 'public, max-age=0, must-revalidate' } },
  // …y los assets, que son inmutables por URL, tiran de caché un año.
  { ruta: '/assets/*', cabeceras: { 'Cache-Control': UN_ANIO } },
  { ruta: '/*.css', cabeceras: { 'Cache-Control': UN_ANIO } },
  { ruta: '/*.js', cabeceras: { 'Cache-Control': UN_ANIO } },
];

/* ── Descubrimiento para agentes (RFC 8288 · RFC 9727 §3) ───────────────────
 * Cabeceras `Link` que apuntan a los recursos LEGIBLES POR MÁQUINA del sitio,
 * para que un agente los encuentre sin tener que parsear el HTML ni adivinar
 * rutas. Se emiten como varias cabeceras `Link` (RFC 8288 §3 lo permite igual
 * que una sola separada por comas; varias son más fáciles de parsear mal-que-
 * bien por clientes simples).
 *
 * Los destinos EXISTEN los cuatro — si se renombra alguno hay que tocarlos
 * aquí Y en la Transform Rule (ver el aviso de arriba):
 *   /.well-known/api-catalog  linkset RFC 9727 con todo lo demás dentro
 *   /llms.txt                 descripción del sitio para agentes
 *   /about/                   documentación humana de la entidad
 *
 * ⚠ Igual que la CSP, HOY las pone una Transform Rule del panel de Cloudflare
 *   (regla «Link headers — descubrimiento para agentes», operación ADD, no
 *   SET: SET machacaría cualquier Link que pusiera el origen). GitHub Pages no
 *   sabe poner cabeceras. Al migrar a Pages las pondrá `_headers` y hay que
 *   BORRAR la regla del panel, o se sirven duplicadas.
 *
 * Se aplican a TODAS las rutas a propósito: así el agente las ve caiga donde
 * caiga, y no hay dos criterios (uno aquí y otro en el panel) que se separen.
 */
export const ENLACES = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</llms.txt>; rel="service-desc"; type="text/plain"',
  '</about/>; rel="service-doc"; type="text/html"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
];

/* ── Tipos de contenido que el origen no sabe adivinar ──────────────────────
 * `/.well-known/api-catalog` no tiene extensión, y GitHub Pages deduce el tipo
 * SÓLO por ella: hoy lo sirve como `application/octet-stream`. MEDIDO el
 * 2026-08-25 contra producción. RFC 9727 §3 exige `application/linkset+json`.
 *
 * ⚠ ESTO NO SE ARREGLA HASTA LA MIGRACIÓN A PAGES. Renombrar el fichero no
 *   vale: la URL es fija y la fija el estándar. Y una Transform Rule de
 *   Cloudflare no es camino fiable — `Content-Type` no está entre las
 *   cabeceras de respuesta que la documentación garantiza modificables.
 *   El `Link` de la home ya anuncia `type="application/linkset+json"`, así que
 *   un cliente que se fíe del enlace acierta igual.
 */
export const TIPOS = [
  { ruta: '/.well-known/api-catalog', cabeceras: { 'Content-Type': 'application/linkset+json' } },
];
