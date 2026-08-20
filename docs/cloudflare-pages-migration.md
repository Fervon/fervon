# Migrar fervon.dev a Cloudflare Pages

## Qué se gana (y qué no)

Hoy fervon.dev se sirve desde **GitHub Pages** detrás del proxy de Cloudflare.
Migrar el hosting a **Cloudflare Pages** da tres cosas:

1. **`_headers` versionado en el repo.** Hoy la CSP y las cabeceras de seguridad
   viven en una Transform Rule del panel, fuera del control de versiones, y hay
   que pegarlas a mano. Con Pages salen de `scripts/site-headers.mjs`.
2. **Caché larga sin depender del panel.** GitHub Pages manda `max-age=600` fijo
   y no lee `_headers`; desde el repo es imposible arreglarlo.
3. **SSL "Full (Strict)".** Con el DNS *proxied*, GitHub Pages presenta un
   certificado de origen `*.github.io`, que Cloudflare no puede validar → hay
   que quedarse en "Full" ("Full (Strict)" da **526**). Con Pages, el origen es
   Cloudflare y su certificado sí se valida.

**Lo que NO cambia:** el beacon de Cloudflare Web Analytics y el script inline de
*Bot Fight Mode* los sigue inyectando el borde. Eso son ajustes del panel, no del
hosting.

### Cuánto vale, medido (2026-08-20, contra producción)

Móvil 412×823, CPU ×4, 1,6 Mbps / 150 ms, mediana de 5 pasadas:

| | FCP / LCP | red |
|---|---|---|
| Visita nueva (o repetida pasados los 10 min de TTL actual) | 2060 / 2068 ms | 9 peticiones · 97 KiB |
| Visita repetida con caché de 1 año | **992 / 992 ms** | 9 peticiones · **2 KiB** |
| Visita nueva con el CSS en línea | **1724 / 1724 ms** | 5 peticiones · 86 KiB |

> **Ojo con la comparación.** Los 1076 ms de la caché **no hacen falta migrar
> para cobrarlos**: la Cache Rule del panel da lo mismo en 2 minutos (ver
> `cloudflare-cache-rule.md`). Lo que sólo da la migración son los 344 ms del
> CSS en línea *de forma mantenible* — con la CSP en el panel habría que pegar
> un hash nuevo a mano cada vez que cambie una línea de estilo.

## Lo que ya está preparado en el repo

- **`scripts/site-headers.mjs`** — fuente única de la CSP, las cabeceras de
  seguridad y las reglas de caché. `build-csp.mjs` la importa, así que la
  política ya no está escrita en dos sitios.
- **`_headers`** — generado con `npm run headers:build`; `npm run headers:check`
  falla si se ha quedado desincronizado. Verificado byte a byte contra la CSP que
  sirve producción hoy.
- **`scripts/build-pages.mjs`** (`npm run pages:build`) — stagea sólo los
  ficheros públicos en `dist/`, minifica CSS/JS con la API de esbuild y **aborta
  si se filtra algún fichero de dev**. Ya no usa `rsync`: no está garantizado en
  la imagen de build de Pages y habría reventado el primer despliegue.
- **`wrangler.toml`** — declara `pages_build_output_dir = "dist"`.
- **`.github/workflows/pages.yml`** excluye `_headers` de la publicación actual,
  para que GitHub Pages no lo sirva como un .txt en `/_headers`.

Mientras el dominio siga en GitHub Pages, **nada de esto cambia producción**:
GitHub Pages ignora `_headers` por completo.

## Pasos (dashboard de Cloudflare — tu cuenta)

1. **Workers & Pages → Create → Pages → Connect to Git** → autoriza GitHub y
   elige el repo **`Fervon/fervon`**, rama `main`.
2. **Build settings:**
   - Framework preset: **None**
   - Build command: `npm run pages:build`
   - Build output directory: `dist`
   - Deploy. Despliega en `https://<proyecto>.pages.dev`.
3. Comprueba en `*.pages.dev`:
   - el sitio carga y las brasas animan;
   - **NO** se sirven ficheros de dev (404 en `/README.md`, `/SETUP.md`,
     `/package.json`, `/index.js`, `/scripts/`, `/src-i18n/`);
   - `curl -sI .../assets/shared.css` devuelve `max-age=31536000`.

   > ⚠ **En `*.pages.dev` NO se aplican las reglas de la zona.** Ahí no está la
   > Transform Rule, así que lo que veas de CSP en la preview **no** es lo que
   > sirve producción. Para la CSP sigue valiendo `npm run csp:check`.

4. **Custom domains → Set up a custom domain → `fervon.dev`.** Cloudflare
   reescribe el DNS para apuntar a Pages.
5. **EL MISMO DÍA: borra la Transform Rule de la CSP** (Rules → Transform Rules →
   Modify Response Header). Si quedan las dos, el navegador recibe **dos**
   cabeceras `Content-Security-Policy` y aplica la **intersección**: bloquea en
   silencio cualquier origen que esté en una y no en la otra.
   Igual con la Cache Rule si ya la habías creado: `_headers` la sustituye.
6. **SSL/TLS → Overview → Full (Strict).**
7. Con `https://fervon.dev` sirviendo desde Pages, **desactiva GitHub Pages** en
   `Fervon/fervon` (Settings → Pages → Source = None) para no tener dos orígenes.

## Verificación final

```
curl -sI https://fervon.dev                      # 200, Server: cloudflare
curl -sI https://fervon.dev/SETUP.md             # 404 (no se filtran dev files)
curl -sI https://fervon.dev/_headers             # 404 (Pages lo consume, no lo sirve)
curl -sI https://fervon.dev/assets/shared.css    # max-age=31536000
curl -sI https://fervon.dev | grep -ci content-security-policy   # 1, no 2
```

Y en **SSL/TLS → Edge Certificates**, el modo debe figurar como **Full (Strict)**.

## Rollback

Quita el custom domain en Pages y reactiva GitHub Pages (Settings → Pages →
Source = GitHub Actions); vuelve a pegar la Transform Rule de la CSP (la imprime
`npm run csp:build`) y pon SSL/TLS en "Full". El DNS vuelve solo. **Nada de lo
que hay en `main` rompe el deploy actual mientras no toques el dashboard.**

## El negativo que no se arregla con una lista de comprobación

Hoy, si Cloudflare falla, puedes quitar la nube naranja del DNS y GitHub Pages
sigue sirviendo el sitio. Después de migrar no hay segundo origen: Cloudflare es
DNS, CDN, WAF, hosting y analítica a la vez. Es el precio real de esta migración.
