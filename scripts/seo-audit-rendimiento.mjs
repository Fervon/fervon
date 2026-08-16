/* Mide Core Web Vitals y peso de página en fervon.dev con Chrome headless,
   simulando móvil (que es lo que Google usa para indexar).
   Uso: node scripts/seo-audit-rendimiento.mjs */

import puppeteer from 'puppeteer-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const P = ['/', '/trace/', '/lookspan/', '/veredicto/', '/inferbench/', '/trace/rewind-ai-alternative'];

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const fmt = (n) => (n / 1024).toFixed(0) + ' KB';

console.log('página'.padEnd(34) + 'LCP     CLS    peso     img     js      css    req  reqImg');
console.log('─'.repeat(96));
const pesados = new Map();

for (const p of P) {
  const pg = await b.newPage();
  await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  const rec = [];
  pg.on('response', async (r) => {
    try {
      const h = r.headers();
      rec.push({ url: r.url(), type: r.request().resourceType(), size: Number(h['content-length'] || 0) });
    } catch {}
  });
  await pg.goto('https://fervon.dev' + p, { waitUntil: 'networkidle2', timeout: 60000 });

  const vitals = await pg.evaluate(() => new Promise((res) => {
    let lcp = 0, cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      res({ lcp, cls, ttfb: nav.responseStart || 0, dcl: nav.domContentLoadedEventEnd || 0 });
    }, 3500);
  }));

  const sum = (t) => rec.filter((r) => t.includes(r.type)).reduce((a, r) => a + r.size, 0);
  const total = rec.reduce((a, r) => a + r.size, 0);
  const img = sum(['image']), js = sum(['script']), css = sum(['stylesheet']);
  for (const r of rec) if (r.type === 'image' && r.size > 300 * 1024) pesados.set(r.url, r.size);

  const mark = (v, lim) => (v > lim ? '⚠' : ' ');
  console.log(
    p.padEnd(34) +
    `${mark(vitals.lcp, 2500)}${(vitals.lcp / 1000).toFixed(2)}s ` +
    `${mark(vitals.cls, 0.1)}${vitals.cls.toFixed(3)} ` +
    `${mark(total, 1.5e6)}${fmt(total).padStart(7)} ` +
    `${fmt(img).padStart(7)} ${fmt(js).padStart(7)} ${fmt(css).padStart(7)} ` +
    `${String(rec.length).padStart(4)} ${String(rec.filter((r) => r.type === 'image').length).padStart(5)}`,
  );
  await pg.close();
}

console.log('\n══════ IMÁGENES DE MÁS DE 300 KB ══════');
if (!pesados.size) console.log('  ninguna');
for (const [u, s] of [...pesados].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${fmt(s).padStart(9)}  ${u.replace('https://fervon.dev', '')}`);
}

console.log('\n══════ FORMATO DE LAS IMÁGENES DEL SITIO ══════');
const r = await fetch('https://fervon.dev/');
const html = await r.text();
console.log('  ¿usa <picture> o AVIF/WebP?', /<picture|\.webp|\.avif/i.test(html) ? 'sí' : 'NO — todo PNG/JPEG');
console.log('  ¿imágenes con loading=lazy?', (html.match(/loading="lazy"/g) || []).length);
console.log('  ¿imágenes con width+height?', (html.match(/<img[^>]+width="[^"]+"[^>]+height="/g) || []).length);

await b.close();
