/* Bloque «Noticias» en la home: el punto 13 de la auditoría pedía que el
   contenido fuese un nodo de primer nivel del enlazado interno, junto a marca
   y productos. Va SIN imágenes a propósito — la home ya tiene CLS 0 y un
   PageSpeed trabajado, y tres portadas más arriba lo pondrían en riesgo sin
   aportar nada que el texto no aporte. Reutiliza .services, que ya está en
   index.css: cero CSS nuevo. */
import fs from 'node:fs';
import { ARTICLES } from 'file:///C:/Users/jonat/Desktop/proyects/fervon/scripts/blog-articles.mjs';

const F = 'C:/Users/jonat/Desktop/proyects/fervon/src-i18n/index.html';
let h = fs.readFileSync(F, 'utf8');
if (h.includes('id="noticias"')) { console.log('ya estaba'); process.exit(0); }

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const t = (es, en) => (/[<>"]/.test(en) ? `data-en='${en.replace(/&/g, '&amp;').replace(/'/g, '&#39;')}'>${es}`
                                        : `data-en="${esc(en)}">${es}`);

const items = ARTICLES.map((a) =>
  `          <li><a href="/blog/${a.slug}/"><b ${t(a.titulo.es, a.titulo.en)}</b><span ${t(a.desc.es, a.desc.en)}</span></a></li>`).join('\n');

const bloque = `    <!-- NOTICIAS -->
    <section class="sec" id="noticias">
      <h2 ${t('Noticias', 'News')}</h2>
      <p class="sub" ${t('Cómo se construye todo esto, contado sin adornos.', 'How all of this gets built, told without decoration.')}</p>
      <div class="services">
        <h3 ${t('Novedades de los proyectos y el método', 'Project releases and the method')}</h3>
        <p class="intro" ${t('Ahí se publican las novedades de cada proyecto según van saliendo, y cuatro artículos de fondo sobre dirigir flotas de agentes de IA. Sin muro y sin pedir el correo.', 'That is where each project&#39;s releases get published as they ship, plus four long articles on directing fleets of AI agents. No paywall and no email gate.')}</p>
        <ul>
${items}
        </ul>
        <div class="cta-row sact">
          <a class="btn btn-ghost" href="/blog/" ${t('Ver todas las noticias', 'See all the news')}</a>
        </div>
      </div>
    </section>

`;

h = h.replace('    <!-- seo:faq -->', bloque + '    <!-- seo:faq -->');
fs.writeFileSync(F, h);
console.log('home: bloque «Noticias» con', ARTICLES.length, 'enlaces a artículos');
