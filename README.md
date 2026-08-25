<p align="center">
  <strong>FERVON</strong><br>
  <em>forjado al rojo vivo</em>
</p>

---

# Fervon

Estudio de software **autónomo** de un solo desarrollador. Una forja donde flotas de agentes de IA escriben, revisan y mergean su propio código — **local-first**, sin pausa, producto tras producto.

> Del latín *fervere*: arder, hervir, bullir con fervor.

## Portfolio

| Proyecto | Qué es |
|---|---|
| **Trace** | Memoria personal local-first: busca todo lo que viste, leíste o hiciste — sin grabar pantalla, sin nube. → [web](https://fervon.dev/trace/) |
| **inferbench** | Benchmark de LLMs locales en tu propia GPU (tokens/s), con modo Serve + servidor MCP. |
| **ClaudeScope** | Dashboard local-first + búsqueda full-text de tus sesiones de Claude Code (0 deps, 0 red). |
| **launchpad** | Launcher local que descubre y levanta todos tus proyectos sin colisión de puertos. |
| **Lookspan** | Librería para desarrolladores publicada en npm + PyPI. |
| **Pregón** | Cross-poster centralizado (8 canales auto) + tracking de tracción de tus lanzamientos. |
| **Veredicto** | Detector de *test-gaming* (trampas en los tests) en PRs hechos por agentes de IA. |
| **Regenta** | Plano de control comercial para gobernar tu flota de agentes de IA. |
| **Trading bot** | Bot de trading autónomo (cripto + acciones) con veto de Claude — la IA solo resta riesgo. |
| **Prompt Tycoon · Pato Patrick** | Juegos casuales del *game factory*. |

## Web

🔥 **https://fervon.dev**

### CSP

La cabecera `Content-Security-Policy` la sirve una Transform Rule de Cloudflare y
es estricta: `default-src 'none'`, `style-src 'self'`, `script-src 'self'` + los
hashes de los bloques JSON-LD. **No hay `'unsafe-inline'`**, así que cualquier
`style=""` o `<script>` suelto que se cuele en el HTML lo bloquea el navegador en
silencio: el estilo no se aplica y solo se ve en la consola del visitante.

```bash
npm run csp:check   # sirve el sitio con la CSP real de producción y recorre todas las páginas con Chrome
```

`npm run csp:build` extrae `<style>`/`<script>` a ficheros externos, recalcula los
hashes JSON-LD e imprime el valor de la CSP para pegar en la Transform Rule.

### Analítica

El sitio mide con **Cloudflare Web Analytics**, no con GA4: sin cookies, sin
banner de consentimiento y sin contradecir el «sin telemetría» que prometen los
productos. El beacon se inyecta desde `assets/shared.js`, que cargan las 49
páginas, así que se enciende cambiando **una línea**.

```bash
npm run analitica:check   # ¿mide algo de verdad? lo comprueba con Chrome contra producción
```

Da tres veredictos y ninguno es ambiguo: **SIN TOKEN** (y dice el paso que falta),
**ROTO** (CSP, caché vieja o token mal pegado) y **MIDIENDO**. Si la máquina desde
la que mides no llega al beacon, lo dice en vez de inventarse un veredicto.

Para encenderla: Cloudflare → *Web Analytics* → *Add a site* → `fervon.dev`, pegar
el token en `FERVON_ANALITICA_TOKEN` y correr `node scripts/bump-cache-buster.mjs`
— sin ese bump el borde sigue sirviendo el `shared.js` viejo durante horas.

### Feed

```bash
npm run feed:gen   # regenera /blog/feed.xml y /en/blog/feed.xml
```

RSS 2.0 en los dos idiomas, con los artículos y las novedades. Se regenera
**después** de `blog:gen` e `i18n:build`, porque las anclas de las novedades las
pinta el generador del blog y el feed las enlaza.

⚠️ El `guid` de cada entrada no puede cambiar nunca: si cambia, todos los
suscriptores ven el feed entero como no leído. Por eso el ancla vive en
`scripts/blog-articles.mjs` (`anclaNovedad`) y la comparten los dos generadores.

⚠️ La regla de caché de Cloudflare cubre los `.xml` con un TTL largo, y eso vale
también para los **404**: si pides una URL de feed antes de desplegarla, el borde
se queda con el 404 durante más de una hora. Comprobado el 2026-08-22 con
`/blog/feed.xml` (`Age: 3723`, `cf-cache-status: HIT`) mientras el origen ya
servía 200. Se arregla purgando esa URL en Cloudflare.

### SEO

```bash
npm run seo:check     # los 26 puntos del checklist, página a página
npm run seo:live      # los mismos, contra lo que sirve fervon.dev
npm run seo:full      # auditoría técnica + rendimiento de todo el sitio
npm run head:check    # ¿está la cabecera DENTRO del <head>? (parser de Chrome)
npm run head:live     # lo mismo contra producción
npm run cabecera:check  # ¿falta breadcrumb, feed, medidas de la OG o el ancho del logo?
```

⚠️ **`head:check` no es redundante con `seo:check`, y esta es la razón.** El
2026-08-25, **24 de las 50 páginas** servían el `<head>` completamente vacío y
toda la cabecera dentro del `<body>`:

```html
<html lang="es"><head></head><body>
  <meta charset="UTF-8">
  <link rel="canonical" ...>
  <link rel="alternate" hreflang=...>
```

`seo:check` las daba por buenas **49/49, en local y en vivo**, porque busca las
etiquetas con expresiones regulares sobre el HTML — y ahí estaban. Pero Google
solo respeta dentro del `<head>` el `canonical`, los `hreflang`, el `meta
robots` y la `description`: fuera de él los ignora. O sea que media web estaba
sin canonical efectivo y con todo el trabajo de multiidioma muerto, sin que una
sola comprobación se quejara.

Lo único que distingue un caso del otro es **dónde coloca las etiquetas el
parser**, así que `head:check` se lo pregunta al parser de Chrome en vez de a
una expresión regular. Si alguna vez vuelve a fallar, `node
scripts/fix-head-vacio.mjs` lo arregla.

La causa fue un **BOM (U+FEFF)** al principio de 12 fuentes de `src-i18n/`: para
el DOMParser es contenido no-espacio, así que cierra el `<head>` implícitamente
antes de leer el primer `<meta>`, y cada fuente genera 2 páginas. `i18n-build`
ahora quita el BOM al leer **y aborta con exit 1** si una página sale con el
`<head>` vacío: antes que publicar eso, no publica.

`seo-cabecera.mjs` completa lo que faltaba en la cabecera —`BreadcrumbList`,
enlace al feed del idioma, `og:image:width/height` y el ancho del logo— y va
encadenado en `npm run i18n:build` **después** del generador, no antes: el
breadcrumb y el feed dependen del idioma de cada página, y una fuente bilingüe
de `src-i18n/` genera las dos.

## Licencia

MIT © Jonathan Martín
