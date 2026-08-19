/* Mide desbordamiento horizontal y errores de consola en las 18 páginas, a los
   dos anchos que el proyecto usa como listón (375 y 320). Compara dos orígenes
   (rama actual vs. copia intacta de HEAD) para separar regresiones de lo que ya
   pasaba antes.

   Uso:  node scripts/check-overflow.mjs <origenActual> [origenBase]
   Ej.:  node scripts/check-overflow.mjs http://localhost:4325 http://localhost:4326
*/
import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
/* OJO: rutas de directorio con barra final, NO `/x/index.html`. El servidor de
   preview responde 301 a esas últimas y la medición sale mal (se midió el
   documento intermedio: daba 611px de falso desborde en /lookspan/). */
const PAGES = [
  '/', '/contacto/', '/about/', '/en/about/', '/claudescope/', '/inferbench/',
  '/launchpad/', '/lookspan/', '/pregon/', '/regenta/',
  '/trace/', '/veredicto/', '/veredicto/report.html',
  '/trace/limitless-alternative.html', '/trace/microsoft-recall-alternative.html',
  '/trace/personal-memory-tool-without-screen-recording.html', '/trace/rewind-ai-alternative.html',
  '/trace/rewind-alternative-windows.html', '/trace/rewind-shut-down-what-to-use.html',
  '/trace/screenpipe-alternative.html',
];
const WIDTHS = [375, 320];

const [, , CUR, BASE] = process.argv;
if (!CUR) { console.error('Falta el origen actual'); process.exit(1); }

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });

async function measure(origin, p, width) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 160)));
  await page.setViewport({ width, height: 812, deviceScaleFactor: 1 });
  await page.goto(origin + p, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 400));
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  // Los elementos dentro de un contenedor con scroll propio NO son desbordes.
  const culprits = await page.evaluate((w) => {
    const inScroller = (el) => {
      for (let n = el.parentElement; n; n = n.parentElement) {
        const o = getComputedStyle(n).overflowX;
        if (o === 'auto' || o === 'scroll' || o === 'hidden') return true;
      }
      return false;
    };
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > w + 2 && !inScroller(el)) {
        out.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' →' + Math.round(r.right));
      }
    }
    return [...new Set(out)].slice(0, 5);
  }, width);
  await page.close();
  return { scrollW, culprits, errors: [...new Set(errors)] };
}

const rows = [];
for (const width of WIDTHS) {
  for (const p of PAGES) {
    const cur = await measure(CUR, p, width);
    const base = BASE ? await measure(BASE, p, width) : null;
    const curBad = cur.scrollW > width + 1;
    const baseBad = base ? base.scrollW > width + 1 : null;
    if (curBad || baseBad || cur.errors.length) {
      rows.push({
        width, p,
        antes: base ? base.scrollW : '-',
        ahora: cur.scrollW,
        veredicto: curBad ? (baseBad ? 'YA PASABA' : 'REGRESIÓN') : baseBad ? 'ARREGLADO' : 'ok',
        culpables: cur.culprits,
        erroresConsola: cur.errors,
      });
    }
  }
}

await browser.close();

if (!rows.length) {
  console.log(`✔ ${PAGES.length} páginas × ${WIDTHS.join('/')}px: 0 desbordes y 0 errores de consola.`);
} else {
  for (const r of rows) console.log(JSON.stringify(r));
  console.log(`\n${rows.length} incidencia(s).`);
}
