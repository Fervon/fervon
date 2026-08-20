#!/usr/bin/env node
/**
 * scripts/build-pages.mjs
 * ────────────────────────────────────────────────────────────────────────────
 * Build step para Cloudflare Pages: copia SOLO los ficheros públicos a dist/,
 * los minifica y aborta si se cuela algo de dev.
 *
 * POR QUÉ EN NODE Y NO EN BASH (2026-08-20): la versión anterior montaba la
 * salida con `rsync`, y rsync NO está garantizado en la imagen de build de
 * Cloudflare Pages. Un build que revienta en el primer despliegue por una
 * herramienta que no existe es la clase de sorpresa que no quieres el día que
 * mueves el dominio. Node sí está garantizado —hace falta igualmente para
 * esbuild— así que la copia se hace con `node:fs` y el build deja de depender
 * de nada del sistema.
 *
 * Se conserva la semántica de los `--exclude` de rsync: un patrón sin barra
 * casa por NOMBRE DE FICHERO a cualquier profundidad (por eso `index.js` de la
 * lista tapa cualquier index.js, no sólo el de la raíz — hoy sólo existe el de
 * la raíz, comprobado).
 *
 * Uso:  node scripts/build-pages.mjs
 */
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist');

/* Misma lista que .github/workflows/pages.yml (el deploy actual de GitHub
   Pages), para no reabrir la fuga de ficheros de dev que se cerró en su día. */
const EXCLUIDOS = new Set([
  'dist', '.git', '.github', '.claude', '.wrangler', 'node_modules',
  'scripts', 'src-i18n', 'docs', 'build',
  '.gitignore', '.gitattributes', 'README.md', 'SECURITY.md', 'SETUP.md', 'PAYMENTS.md',
  'BRAND-IMAGE-PROMPTS.md', 'LANZAMIENTO-VEREDICTO.md', 'LICENSE',
  'package.json', 'package-lock.json', 'index.js', 'wrangler.toml',
]);
const EXCLUIDOS_PREFIJO = ['og-test-', 'og-zoom-'];

const excluido = (p) => {
  const n = basename(p);
  return EXCLUIDOS.has(n) || EXCLUIDOS_PREFIJO.some((pre) => n.startsWith(pre));
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
/* Entrada por entrada, no `cpSync(ROOT, OUT)`: Node se niega a copiar un
   directorio dentro de sí mismo (ERR_FS_CP_EINVAL) y dist/ está dentro. */
for (const entrada of readdirSync(ROOT)) {
  if (excluido(entrada)) continue;
  cpSync(join(ROOT, entrada), join(OUT, entrada), {
    recursive: true,
    filter: (src) => !excluido(src),
  });
}

/* Minifica CSS/JS en la salida; las fuentes del repo se quedan legibles.
   PSI 2026-08-17: shared.css sin minificar era el 37% de su peso. */
const activos = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (extname(p) === '.css' || extname(p) === '.js') activos.push(p);
  }
})(OUT);

/* Con la API de esbuild, no con `npx esbuild`: en Windows, spawn de un .cmd
   sin shell revienta con EINVAL, y un proceso por fichero son 44 arranques de
   Node para nada. esbuild es devDependency, así que Pages lo instala solo. */
let antes = 0, despues = 0;
for (const f of activos) {
  const src = readFileSync(f, 'utf8');
  antes += Buffer.byteLength(src);
  const { code } = await transform(src, { minify: true, loader: extname(f) === '.css' ? 'css' : 'js' });
  writeFileSync(f, code, 'utf8');
  despues += Buffer.byteLength(code);
}
console.log(`Minificados ${activos.length} ficheros: ${(antes / 1024).toFixed(0)} KiB → ${(despues / 1024).toFixed(0)} KiB`);

/* Salvaguarda: aborta si algún fichero de dev se ha colado en la salida. */
let fugas = 0;
for (const f of ['README.md', 'SECURITY.md', 'SETUP.md', 'PAYMENTS.md', 'BRAND-IMAGE-PROMPTS.md',
                 'package.json', 'package-lock.json', 'index.js', '.gitignore', 'wrangler.toml']) {
  if (existsSync(join(OUT, f))) { console.error(`FUGA: dist/${f} no debería publicarse`); fugas++; }
}
// src-i18n/ son las fuentes bilingües del generador: duplican todo el contenido
// y, si se publicaran, Google vería decenas de páginas clonadas.
for (const d of ['scripts', 'src-i18n', 'docs', 'node_modules', '.github']) {
  if (existsSync(join(OUT, d))) { console.error(`FUGA: dist/${d}/ no debería publicarse`); fugas++; }
}
if (fugas) { console.error('Abortado: ficheros de dev en la salida.'); process.exit(1); }

/* Sanidad: lo imprescindible tiene que estar. `_headers` es lo que pone la
   caché larga y las cabeceras de seguridad en Pages; si falta, el despliegue
   sale sin CSP y sin caché y nadie se entera. */
for (const f of ['index.html', 'sitemap.xml', 'robots.txt', 'CNAME', 'assets/core.css', '_headers']) {
  if (!existsSync(join(OUT, f))) { console.error(`FALTA: dist/${f} esperado en la salida`); process.exit(1); }
}

const total = (function cuenta(d) {
  let n = 0;
  for (const f of readdirSync(d)) n += statSync(join(d, f)).isDirectory() ? cuenta(join(d, f)) : 1;
  return n;
})(OUT);
console.log(`\nPublicado en dist/ — ${total} ficheros. Primer nivel:`);
for (const f of readdirSync(OUT).sort()) console.log('  ' + f);
