#!/usr/bin/env node
/**
 * scripts/cf-link-headers.mjs
 * ────────────────────────────────────────────────────────────────────────────
 * Crea (o actualiza) en Cloudflare la Transform Rule que sirve las cabeceras
 * `Link` de descubrimiento para agentes en fervon.dev.
 *
 * POR QUÉ HACE FALTA: el dominio lo sirve GitHub Pages, que NO sabe poner
 * cabeceras, y `_headers` sólo lo lee Cloudflare Pages. Hasta la migración, la
 * única forma de que las cabeceras existan en vivo es una regla del panel —
 * exactamente igual que la CSP. Ver scripts/site-headers.mjs.
 *
 * FUENTE ÚNICA: los valores salen de `ENLACES` en site-headers.mjs. Este script
 * NO tiene su propia copia, a propósito: lo que se bifurca se desincroniza.
 *
 * ⚠ UNA SOLA CABECERA, SEPARADA POR COMAS. Las Transform Rules mapean
 *   NOMBRE → operación, así que no se pueden pedir cuatro `Link` distintas: la
 *   clave del objeto JSON se repetiría. RFC 8288 §3 permite igual de bien
 *   varios link-value separados por comas en una sola cabecera, y eso es lo que
 *   se manda. `_headers` sí usa cuatro líneas porque Pages sí sabe repetirlas;
 *   las dos formas dicen lo mismo.
 *
 * ⚠ OPERACIÓN `add`, NUNCA `set`. `set` machacaría cualquier `Link` que pusiera
 *   el origen (hoy ninguna, pero eso puede cambiar sin que nadie avise aquí).
 *
 * Uso:
 *   node scripts/cf-link-headers.mjs --check   comprueba, no escribe (sale 1 si difiere)
 *   node scripts/cf-link-headers.mjs           crea o actualiza la regla
 *
 * Necesita CLOUDFLARE_API_TOKEN con:
 *   Zone → Zone → Read          (para resolver fervon.dev)
 *   Zone → Transform Rules → Edit
 * El token del PC a 2026-08-25 es de Pages y NO tiene el segundo: da 403.
 */
import { ENLACES, TIPOS } from './site-headers.mjs';

const ZONA = 'fervon.dev';
const DESCRIPCION = 'Link headers — descubrimiento para agentes (RFC 8288 / RFC 9727)';
const DESCRIPCION_TIPOS = 'Content-Type de los documentos sin extensión (RFC 9727)';
const FASE = 'http_response_headers_transform';
const API = 'https://api.cloudflare.com/client/v4';

const soloComprobar = process.argv.includes('--check');
const VALOR = ENLACES.join(', ');

const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  console.error('✗ falta CLOUDFLARE_API_TOKEN en el entorno.');
  process.exit(2);
}

async function cf(ruta, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opciones.headers ?? {}),
    },
  });
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok || cuerpo.success === false) {
    const err = (cuerpo.errors ?? []).map((e) => `${e.code} ${e.message}`).join(' · ') || r.statusText;
    const e = new Error(`${r.status} ${err}`);
    e.status = r.status;
    throw e;
  }
  return cuerpo.result;
}

function pistaDePermisos(e) {
  if (e.status !== 403) return;
  console.error('');
  console.error('  El token NO tiene «Zone → Transform Rules → Edit» sobre fervon.dev.');
  console.error('  Añádeselo en https://dash.cloudflare.com/profile/api-tokens , o crea');
  console.error('  la regla a mano en el panel:');
  console.error('');
  console.error('    Rules → Overview → Create rule → Response Header Transform Rule');
  console.error(`    Nombre:     ${DESCRIPCION}`);
  console.error('    Aplica a:   All incoming requests');
  console.error('    Acción:     Add   ·   Header: Link   ·   Value (una sola línea):');
  console.error('');
  console.error(`    ${VALOR}`);
  console.error('');
}

const [zona] = await cf(`/zones?name=${ZONA}`).catch((e) => { pistaDePermisos(e); throw e; });
if (!zona) { console.error(`✗ la zona ${ZONA} no está en esta cuenta.`); process.exit(1); }

let entrada;
try {
  entrada = await cf(`/zones/${zona.id}/rulesets/phases/${FASE}/entrypoint`);
} catch (e) {
  if (e.status === 404) entrada = { rules: [] };           // la fase aún no existe
  else { console.error(`✗ no se pudo leer la fase ${FASE}: ${e.message}`); pistaDePermisos(e); process.exit(1); }
}

const reglas = entrada.rules ?? [];
const mia = reglas.find((r) => r.description === DESCRIPCION);
const vivo = mia?.action_parameters?.headers?.Link;

if (soloComprobar) {
  if (!mia) { console.error(`✗ la regla «${DESCRIPCION}» no existe en Cloudflare.`); process.exit(1); }
  if (!mia.enabled) { console.error('✗ la regla existe pero está DESACTIVADA.'); process.exit(1); }
  if (vivo?.operation !== 'add') { console.error(`✗ la regla usa operation="${vivo?.operation}" en vez de "add".`); process.exit(1); }
  if (vivo?.value !== VALOR) {
    console.error('✗ la regla viva NO coincide con ENLACES de site-headers.mjs.');
    console.error(`  vivo:     ${vivo?.value}`);
    console.error(`  esperado: ${VALOR}`);
    process.exit(1);
  }
  console.log(`✔ la Transform Rule está al día (${ENLACES.length} enlaces).`);
  process.exit(0);
}

/* Se reescribe la fase ENTERA porque la API no tiene PATCH de una regla suelta
   dentro del entrypoint. Por eso se conservan las demás: si aquí se perdiera
   una, se caería la CSP del sitio sin hacer ruido.
   ⚠ NO se reenvían tal cual: `version` y `last_updated` son de SOLO LECTURA y
   el PUT los rechaza. Se filtra a los campos que sí acepta, conservando `id`
   para que Cloudflare entienda que es la misma regla y no una nueva. */
const CAMPOS = ['id', 'action', 'action_parameters', 'expression', 'description', 'enabled', 'ref', 'logging'];
const limpiar = (r) => Object.fromEntries(CAMPOS.filter((k) => r[k] !== undefined).map((k) => [k, r[k]]));
const MIAS = new Set([DESCRIPCION, DESCRIPCION_TIPOS]);
const otras = reglas.filter((r) => !MIAS.has(r.description)).map(limpiar);
const nueva = {
  description: DESCRIPCION,
  expression: 'true',
  action: 'rewrite',
  enabled: true,
  action_parameters: { headers: { Link: { operation: 'add', value: VALOR } } },
};

/* GitHub Pages deduce el Content-Type SÓLO por la extensión, y
   `/.well-known/api-catalog` no tiene. Aquí se le pone el que exige el
   estándar. Una regla aparte, y no dentro de la de arriba, porque ésta sí es
   por ruta. Si Cloudflare no dejara tocar `Content-Type`, el PUT entero falla
   y no se toca NADA — es atómico, que es justo lo que se quiere cuando en la
   misma fase vive la CSP. */
const reglasTipos = TIPOS.map((t) => ({
  description: DESCRIPCION_TIPOS,
  expression: `http.request.uri.path eq "${t.ruta}"`,
  action: 'rewrite',
  enabled: true,
  action_parameters: {
    headers: Object.fromEntries(
      Object.entries(t.cabeceras).map(([k, v]) => [k, { operation: 'set', value: v }]),
    ),
  },
}));

try {
  const res = await cf(`/zones/${zona.id}/rulesets/phases/${FASE}/entrypoint`, {
    method: 'PUT',
    body: JSON.stringify({ rules: [...otras, nueva, ...reglasTipos] }),
  });
  console.log(`✔ ${mia ? 'actualizadas' : 'creadas'} · ${res.rules.length} reglas en la fase (${otras.length} intactas, ${reglasTipos.length} de Content-Type)`);
  console.log(`  Link: ${VALOR}`);
} catch (e) {
  console.error(`✗ no se pudo escribir la regla: ${e.message}`);
  pistaDePermisos(e);
  process.exit(1);
}
