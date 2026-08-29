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

**Verificado en vivo el 2026-08-25**, con las dos Transform Rules ya creadas:

```
$ curl -sI https://fervon.dev/ | grep -i ^link
link: </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", ...

$ curl -sI https://fervon.dev/.well-known/api-catalog | grep -i ^content-type
content-type: application/linkset+json
```

Dos cosas que costaron medir y conviene no volver a descubrir:

1. **`/.well-known/api-catalog` no tiene extensión**, y GitHub Pages deduce el
   `Content-Type` sólo por ella: lo servía como `application/octet-stream`.
   Renombrarlo no vale, la URL la fija RFC 9727. **Cloudflare SÍ deja poner
   `Content-Type` desde una Transform Rule**, aunque su documentación no lo
   garantice por escrito — está medido y en vivo. `npm run links:cf` crea esa
   regla junto a la de las cabeceras.
2. **La regla se escribe reemplazando la fase entera**, y en esa misma fase vive
   la CSP. `cf-link-headers.mjs` conserva las demás reglas filtrando sus campos
   de solo lectura (`version`, `last_updated`), que el PUT rechaza. Si algún día
   falla, el PUT es atómico: o entra todo o no se toca nada.

**`authMd` sigue en rojo a propósito.** El escáner exige, además del fichero,
metadatos OAuth en `/.well-known/oauth-protected-resource`. Auth.md es un
protocolo OAuth de punta a punta —servidor de autorización, `token_endpoint`,
ceremonia de reclamación— y fervon.dev no tiene recurso protegido ni cuentas.
Publicar esos documentos sería describir endpoints que devuelven 404 y a los que
un agente iría de cabeza. El propio `/auth.md` explica qué falta y por qué.

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

### Estabilidad visual (CLS)

```bash
npm run cls:check     # mide el CLS real con Chrome, una página por plantilla e idioma
npm run cls:live      # lo mismo contra fervon.dev (aborta el beacon: no cuenta como visita)
```

El 2026-08-29 el panel de Cloudflare daba **CLS 100% «Poor»** en fervon.dev y su
Debug View señalaba dos elementos con nombre y apellidos:
`div.proofcard.reveal>::after` y `div.meta-row>span`. Los dos eran fallos de
verdad, y **ninguna comprobación estática podía verlos**, porque no rompen nada:
todo da 200, el HTML es correcto y la página se ve bien en una captura.

Lo que fallaba, y el patrón que comparten los cuatro:

| Dónde | Qué hacía | Por qué desplaza |
|---|---|---|
| Portada | el barrido ámbar de las tarjetas se movía animando `left` | `left` es **layout**: el rect del pseudo cambia en cada fotograma. Los `transform` están exentos por especificación, `left` no |
| `/lookspan/` | el contador iba de `0` a `1,284` sin ancho reservado | el texto ensancha y empuja al vecino durante 1,1 s |
| `/trace/`, `/regenta/` | el buscador que se teclea solo nacía con altura 0 | crece dos veces —primera letra y salto a la segunda línea— y empuja la página entera 22 px |
| `/pregon/` | el estado de cada fila pasaba de `···` a `✓ publicado` | estruja al vecino hasta partirlo en dos líneas |
| `/pregon/` | **la demo se repite cada ~10 s y vaciaba la caja del mensaje al empezar cada vuelta** | deshace la reserva una y otra vez: **0,0159 en 26 s y subiendo** mientras la pestaña esté abierta con la demo a la vista — «Poor» en una visita de cinco minutos |

**El patrón: todo lo que un script escribe después del primer pintado necesita su
sitio reservado antes.** Con `min-width`/`min-height` cuando el tamaño final se
conoce, y pintando el resto del texto en invisible (`.fantasma`) cuando depende
del ancho, del idioma y de la fuente — que es el caso del mensaje de `/pregon/`,
donde el `min-height: 42px` que ya había se quedaba corto: en 390 px ocupa cuatro
líneas, no dos.

⚠️ **El umbral de `cls:check` es 0,02, no el 0,1 de Core Web Vitals.** Medidos en
este PC con red local, los fallos de arriba daban 0,0089 / 0,027 / 0,033: con el
umbral de la especificación, el script habría dado **verde el día que se
escribió**, mientras Cloudflare los veía en rojo en dispositivos de verdad. El
listón es lo que mide el sitio sano, no lo que permite la norma. Y aun así no
llega a todo: el contador de Lookspan medía 0,0001 aquí. Un verde local no dice
«no hay CLS», dice «no hay CLS de los gordos» — **el panel de RUM sigue
mandando**.

Mide **dos pasadas por página**: una quieta arriba (12 s) y otra bajando hasta el
final. Las dos hacen falta y las dos están calibradas por un fallo real:

- **Dos pasadas**, porque un desplazamiento solo puntúa si ocurre dentro de la
  pantalla, y con una sola el fallo de `/pregon/` salía rojo o verde según dónde
  estuviera el scroll cuando le tocaba crecer.
- **12 s quieto y no 5**, porque las demos de `/pregon/`, `/inferbench/` y
  `/launchpad/` se repiten en bucle cada ~10 s, y **el desplazamiento que se
  repite es el que de verdad hace daño**: se acumula mientras la pestaña sigue
  abierta. Con 5 s, el del bucle de `/pregon/` no aparecía ni una sola vez.

**Queda un aviso sin cerrar**, anotado aquí para que no se pierda: la versión
**inglesa** de `/trace/rewind-alternative-windows` marca `ojo 0,0061` a 1280px,
reproducible, a los ~365 ms, con `section#resumen` / `a.btn-fire` / `p.pfoot`
como fuentes. La española da 0,0000 y a 390px da 0,0000. No es de la familia de
los cuatro de arriba —nada cambia de tamaño, algo se mueve— y no es el swap de
la webfont (`document.fonts.status` ya es `loaded` a los 30 ms). Está 16 veces
por debajo del umbral, así que no se persiguió.

## Licencia

MIT © Jonathan Martín
