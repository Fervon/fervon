# Regla de caché de Cloudflare — TTL de navegador para los assets

> ## ✅ HECHA el 2026-08-20 — regla `assets-larga-vida`, en producción
>
> Comprobado en vivo sobre 16 rutas: los 10 tipos de asset (css, js, woff2,
> webp, png, jpg, svg, ico, mp4, webm) salen con `max-age=31536000`, y el HTML,
> el sitemap y robots.txt **siguen en `max-age=600`** — que es justo lo que se
> quería: una corrección se sigue viendo al momento.
>
> **Medido después** (móvil 412×823, CPU ×4, 1,6 Mbps / 150 ms, mediana de 5):
> la visita repetida pasa de **2128 ms de LCP y 97 KiB** a **788 ms y 0 KiB**.
> La primera visita no cambia (2120 ms), y es lo esperado: esta regla es para
> quien vuelve.
>
> **Al crearla, Cloudflare avisa:** «This rule may not apply to your traffic…
> your DNS configuration may not be proxying traffic for (expresión)». Es un
> **falso positivo**: la expresión sólo mira la extensión y no nombra ningún
> hostname, así que Cloudflare no puede deducir a qué registro DNS aplica. El
> tráfico sí está proxeado (`server: cloudflare`, `cf-ray`, y fervon.dev
> resuelve a 104.21.x / 172.67.x). Se marca **«Ignore and deploy rule anyway»**.
> Lo que NO hay que elegir es «Create a new proxied DNS record»: crearía un
> registro DNS basura con el nombre de la expresión.
>
> Lo de abajo se conserva como registro de por qué existe y de cómo rehacerla.

**Por qué existe esto (PageSpeed 2026-08-17):** PSI móvil señala «Usar tiempos de
vida de caché eficientes — ahorro de 83 KiB». Todos los assets
(`inter-var.woff2` 49 KiB, `textura-forja.webp` 32 KiB, `shared.js`, `index.css`,
`shared.css`) se sirven con **TTL de navegador de 4 horas**, que es el valor por
defecto de Cloudflare («Browser Cache TTL» global). GitHub Pages envía
`max-age=600` y Cloudflare lo sobreescribe a 4 h — ninguno de los dos sirve para
visitas repetidas.

**SIGUE SIN HACERSE (medido el 2026-08-20).** El mismo aviso reaparece en PSI,
ahora con «ahorro de 100 KiB» y **TTL de 10 minutos** en los seis assets. O sea
que el TTL de navegador ya no lo pisa Cloudflare a 4 h: pasa tal cual el
`max-age=600` de GitHub Pages, que es todavía peor. Comprobado en vivo:

```
Invoke-WebRequest -Uri "https://fervon.dev/assets/shared.css?v=20260820" -UseBasicParsing -Method Head
# cache-control: max-age=600
```

Esto **no se puede arreglar desde el repo**: el sitio vive en GitHub Pages, que
manda `max-age=600` fijo y no lee `_headers`. O se crea la regla de abajo en el
panel, o se migra el hosting (ver `cloudflare-pages-migration.md`).

Los CSS/JS van versionados con `?v=` (ver `scripts/bump-cache-buster.mjs`), así
que un TTL largo es seguro: cada cambio publica una URL nueva.

## Qué hacer (dashboard de Cloudflare, ~2 min)

Cloudflare → zona `fervon.dev` → **Rules → Cache Rules → Create rule**:

- **Nombre:** `assets-larga-vida`
- **When incoming requests match** (expresión personalizada):

  ```
  (http.request.uri.path.extension in {"css" "js" "woff2" "webp" "png" "jpg" "jpeg" "svg" "ico" "mp4" "webm"})
  ```

- **Then:**
  - **Eligible for cache**
  - **Edge TTL:** Ignore cache-control header → **1 month**
  - **Browser TTL:** Override origin → **1 year**

**NO** aplicar a HTML (la expresión de arriba ya lo excluye por extensión): las
páginas deben poder actualizarse al momento.

> Extensiones tomadas de lo que se publica de verdad (`npm run pages:build`
> y contar): html 50, css 25, jpg 18, js 18, webp 8, png 5, svg 4, mp4 3,
> webm 3, woff2 1. Los `mp4`/`webm` son las demos de producto desde el
> 2026-08-20 y pesan 130-620 KB cada una: si se quedan fuera de la regla, son
> lo más caro que se vuelve a bajar en cada visita.

## Trampa conocida

`inter-var.woff2` y las imágenes **no** llevan `?v=`. Con TTL de 1 año, si algún
día se cambia una imagen o la fuente **manteniendo el nombre**, los visitantes
recurrentes verán la vieja hasta un año. Regla: si se reemplaza un asset binario,
**cambiarle el nombre de fichero** (p. ej. `textura-forja-2.webp`) y actualizar
las referencias.

## Verificación

Tras crear la regla:

```bash
curl -sI https://fervon.dev/assets/shared.css?v=20260820 | grep -i cache-control
```

Debe salir `cache-control: max-age=31536000` (o similar de 1 año), no `max-age=600`.
