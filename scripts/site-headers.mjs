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
