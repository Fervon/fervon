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

**YA ESTÁ MIDIENDO, y no con el beacon de este repo.** `FERVON_ANALITICA_TOKEN`
está vacío a propósito: Web Analytics está en **modo automático**, así que quien
inyecta el beacon es **Cloudflare en el borde**, sin tocar el HTML.

⚠️ **No pegues el token en `shared.js` «para arreglarlo».** Tendrías dos beacons
por página y cada visita se contaría dos veces. El token del repo solo hace falta
si algún día se quita el proxy naranja de Cloudflare: entonces sí, token +
`node scripts/bump-cache-buster.mjs` (sin ese bump el borde sirve el `shared.js`
viejo durante horas).

⚠️ **Cloudflare NO inyecta el beacon a cualquiera.** A un `fetch` sin User-Agent
de navegador le sirve el HTML pelado. Eso tuvo en rojo el punto 23 del checklist
durante días mientras el panel acumulaba visitas: el comprobador miraba si había
token en el fichero, salía con `exit 1` y **nunca llegaba a preguntarle al
sitio**. Un rojo falso es tan malo como un verde falso. Ahora los dos scripts
piden la página como la pediría un visitante.

Veredictos, ninguno ambiguo: **MIDIENDO** (dice si es con beacon propio o con el
del borde), **ROTO** (CSP, caché vieja o token mal pegado), **SIN VEREDICTO** (la
página pide el beacon pero *esta* máquina no resuelve
`static.cloudflareinsights.com` — filtro de DNS en la red desde la que mides, no
un fallo del sitio) y **en local no se puede saber**, porque el borde no existe
ahí.

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

### Descubrimiento para agentes

Un agente que llega a `fervon.dev` no debería tener que parsear el HTML para
saber qué hay. Tres piezas, las tres verificables desde fuera:

| Qué | Dónde | Estándar |
|---|---|---|
| Catálogo de recursos legibles por máquina | `/.well-known/api-catalog` | [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727) (linkset de [RFC 9264](https://www.rfc-editor.org/rfc/rfc9264)) |
| Autenticación y alta de credenciales | `/auth.md` | Auth.md |
| Cabeceras `Link` en la respuesta | todas las rutas | [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288) · rels `api-catalog`, `service-desc`, `service-doc`, `describedby` |

La fuente única de las cabeceras es `ENLACES` en `scripts/site-headers.mjs`. De
ahí salen las dos formas en que se sirven, que dicen lo mismo:

```bash
npm run headers:build   # -> _headers (cuatro líneas Link; sólo lo lee Cloudflare Pages)
npm run links:cf        # -> Transform Rule de Cloudflare (UNA cabecera, valores separados por comas)
npm run links:check     # compara la regla viva contra el repo
```

**`/auth.md` dice que NO hay OAuth, y por qué.** No hay recurso protegido en
este origen, ni servidor de autorización, ni token endpoint, así que tampoco hay
`/.well-known/oauth-protected-resource`: la ausencia es deliberada, no un olvido.
Lo que sí documenta es el aprovisionamiento real de credenciales — licencias de
Veredicto y de Trace por checkout self-serve de Polar, verificadas **offline**,
nunca en una cabecera `Authorization` — y pide explícitamente que nadie sondee
`POST /agent/auth`: no existe.

**Dos cosas medidas el 2026-08-25 que no se arreglan desde el repo:**

1. **Las cabeceras `Link` no están en vivo.** GitHub Pages no sabe poner
   cabeceras y `_headers` sólo lo lee Cloudflare Pages, así que hoy dependen de
   la Transform Rule. `npm run links:cf` la crea, pero necesita un token con
   `Zone → Transform Rules → Edit`; el del PC es de Pages y da 403.
2. **`/.well-known/api-catalog` se sirve como `application/octet-stream`.** No
   tiene extensión y GitHub Pages deduce el tipo sólo por ella. RFC 9727 pide
   `application/linkset+json`. Renombrarlo no vale: la URL la fija el estándar.
   Ya está puesto en `_headers` para el día de la migración; mientras tanto, el
   `Link` de la home anuncia el `type` correcto.

Se valida desde fuera con el escáner de
[isitagentready.com](https://isitagentready.com):

```powershell
Invoke-RestMethod -Uri "https://isitagentready.com/api/scan" -Method Post -ContentType "application/json" -Body '{"url": "https://fervon.dev"}'
```

⚠ **Justo después de publicar una URL nueva, el escáner puede seguir viendo el
404** que él mismo cacheó antes: es la trampa del 404 de arriba. Se distingue en
un segundo — un `404` con `cf-cache-status: HIT` mientras el origen ya da 200 —
y se arregla purgando esa URL, no volviendo a desplegar.

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
