/* ============================================================================
   scripts/indexnow.mjs
   ----------------------------------------------------------------------------
   Avisa a Bing y a Yandex de que unas URLs han cambiado, con IndexNow.

   POR QUÉ MERECE LA PENA AQUÍ: Google no usa IndexNow y sigue a su ritmo — el
   sitemap ya está y no hay más que hacer por ese lado. Pero **ChatGPT busca
   con el índice de Bing**, y aparecer citado en ChatGPT es justo el objetivo
   por el que robots.txt permite a OAI-SearchBot. Con el rastreo normal, una
   página nueva puede tardar semanas en entrar en ese índice; con un ping
   entra en horas. Es la única palanca de descubrimiento que se puede accionar
   desde aquí sin depender de nadie: no hace falta cuenta, ni login, ni panel.

   CÓMO SE AUTENTICA: no con una API key, sino demostrando que controlas el
   dominio. Se publica un fichero `<clave>.txt` en la raíz cuyo contenido es la
   propia clave, y se manda esa clave en la petición. Por eso la clave NO es un
   secreto y vive en el repositorio: es pública por diseño, igual que el TXT de
   verificación de Search Console.

   Uso:  node scripts/indexnow.mjs           avisa de TODO el sitemap
         node scripts/indexnow.mjs /a /b     avisa solo de esas rutas
         node scripts/indexnow.mjs --check   comprueba el montaje, sin enviar
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://fervon.dev';
const HOST = 'fervon.dev';
const CHECK = process.argv.includes('--check');

/* La clave vive en un fichero de la raíz porque ESE fichero es la prueba de
   propiedad. Si se cambia aquí hay que renombrar también el .txt, o los
   buscadores rechazan el aviso entero. */
const CLAVE = '7d8677ed512d8e1fd50a3631c6e66846';
const FICHERO = path.join(ROOT, `${CLAVE}.txt`);

if (!fs.existsSync(FICHERO) || fs.readFileSync(FICHERO, 'utf8').trim() !== CLAVE) {
  console.error(`✗ falta ${CLAVE}.txt en la raíz, o su contenido no es la clave.`);
  console.error('  Sin ese fichero el aviso se rechaza entero: es la prueba de que el dominio es tuyo.');
  process.exit(1);
}

const rutas = process.argv.slice(2).filter((a) => !a.startsWith('--'));
let urls;
if (rutas.length) {
  urls = rutas.map((r) => (r.startsWith('http') ? r : ORIGIN + r));
} else {
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

/* El protocolo admite 10.000 por envío; aquí nunca se llega, pero se deja el
   corte para que un sitemap que crezca no falle en silencio. */
if (urls.length > 10000) { console.error('✗ más de 10.000 URLs en un envío.'); process.exit(1); }

console.log(`${urls.length} URL(s) · clave ${CLAVE.slice(0, 8)}… · ${CLAVE}.txt publicado`);
if (CHECK) {
  console.log('✔ montaje correcto. Sin --check se envía de verdad.');
  process.exit(0);
}

/* Un solo aviso vale para todos los buscadores que participan: comparten el
   mismo pool. Se manda a Bing porque es el que alimenta a ChatGPT. */
const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: CLAVE, keyLocation: `${ORIGIN}/${CLAVE}.txt`, urlList: urls }),
});

/* 200 y 202 son los dos «recibido». 422 casi siempre es que el keyLocation no
   se puede leer todavía — típico si acabas de desplegar el .txt. */
const cuerpo = await r.text().catch(() => '');
if (r.status === 200 || r.status === 202) {
  console.log(`✔ ${r.status} — avisadas ${urls.length} URLs. La indexación no es inmediata, pero deja de depender del rastreo.`);
  process.exit(0);
}
console.error(`✗ HTTP ${r.status} ${cuerpo.slice(0, 200)}`);
if (r.status === 422) console.error(`  Comprueba que ${ORIGIN}/${CLAVE}.txt responde 200 y contiene exactamente la clave.`);
if (r.status === 403) console.error('  La clave del fichero y la enviada no coinciden.');
process.exit(1);
