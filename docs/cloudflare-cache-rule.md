# Regla de caché de Cloudflare — TTL de navegador para los assets

**Por qué existe esto (PageSpeed 2026-08-17):** PSI móvil señala «Usar tiempos de
vida de caché eficientes — ahorro de 83 KiB». Todos los assets
(`inter-var.woff2` 49 KiB, `textura-forja.webp` 32 KiB, `shared.js`, `index.css`,
`shared.css`) se sirven con **TTL de navegador de 4 horas**, que es el valor por
defecto de Cloudflare («Browser Cache TTL» global). GitHub Pages envía
`max-age=600` y Cloudflare lo sobreescribe a 4 h — ninguno de los dos sirve para
visitas repetidas.

Los CSS/JS van versionados con `?v=` (ver `scripts/bump-cache-buster.mjs`), así
que un TTL largo es seguro: cada cambio publica una URL nueva.

## Qué hacer (dashboard de Cloudflare, ~2 min)

Cloudflare → zona `fervon.dev` → **Rules → Cache Rules → Create rule**:

- **Nombre:** `assets-larga-vida`
- **When incoming requests match** (expresión personalizada):

  ```
  (http.request.uri.path.extension in {"css" "js" "woff2" "webp" "png" "jpg" "svg" "ico"})
  ```

- **Then:**
  - **Eligible for cache**
  - **Edge TTL:** Ignore cache-control header → **1 month**
  - **Browser TTL:** Override origin → **1 year**

**NO** aplicar a HTML (la expresión de arriba ya lo excluye por extensión): las
páginas deben poder actualizarse al momento.

## Trampa conocida

`inter-var.woff2` y las imágenes **no** llevan `?v=`. Con TTL de 1 año, si algún
día se cambia una imagen o la fuente **manteniendo el nombre**, los visitantes
recurrentes verán la vieja hasta un año. Regla: si se reemplaza un asset binario,
**cambiarle el nombre de fichero** (p. ej. `textura-forja-2.webp`) y actualizar
las referencias.

## Verificación

Tras crear la regla:

```bash
curl -sI https://fervon.dev/assets/shared.css?v=20260817d | grep -i cache-control
```

Debe salir `cache-control: max-age=31536000` (o similar de 1 año), no `max-age=14400`.
