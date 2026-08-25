# Migrar fervon.dev a Cloudflare Pages

> **Estado (2026-08-25): esto ya no es una mejora de rendimiento pendiente, es
> el arreglo de un fallo abierto.** Cloudflare levantó un aviso *«Dangling A
> Record detected»* sobre `fervon.dev` → `185.199.109.153` (Fastly / GitHub
> Pages). No es un dominio abandonado —el origen responde con el sitio bueno—,
> pero lo que salió al medirlo es peor que el aviso. Ver «El aviso que destapó
> esto».


## El aviso que destapó esto

Medido el 2026-08-25, y es la razón por la que este documento dejó de poder
esperar:

| Comprobación | Resultado |
|---|---|
| `curl --resolve fervon.dev:80:185.199.10x.153` | **200**, `Server: GitHub.com` — en los 4 IPs |
| `curl --resolve fervon.dev:443:185.199.109.153` | **falla**: el origen presenta `CN=*.github.io` |
| `gh api repos/Fervon/fervon/pages` | `https_enforced: false`, `https_certificate_state:` **`null`** |
| `hstspreload.org/api/v2/status?domain=fervon.dev` | `status: preloaded`, `preloadedDomain:` **`dev`** |

Léelo junto:

1. **GitHub Pages nunca emitió el certificado de `fervon.dev`.** Por eso la sonda
   de Cloudflare prueba HTTPS, recibe un cert que no casa y lo da por
   abandonado. El aviso es un falso positivo en cuanto a *takeover*, pero el
   certificado que falta es real.
2. **La zona no puede estar en Full (Strict).** Si lo estuviera, el sitio
   devolvería 526. Que cargue demuestra que el tramo Cloudflare→GitHub va en
   claro (Flexible) o cifrado sin verificar (Full a secas).
3. **`.dev` es un TLD con `force-https` de fábrica** en la lista de preload de
   Chromium. Ningún navegador cargará `fervon.dev` por HTTP, jamás. Y GitHub
   Pages **sólo** responde a este dominio por HTTP.

> ⚠ **No borres los registros A a mano para callar el aviso.** Las cuatro IPs de
> GitHub Pages tienen exactamente el mismo problema —ninguna tiene certificado
> para `fervon.dev`—, así que quitar una no arregla nada y el aviso vuelve. Y
> quitar las cuatro **tira el sitio entero**: hoy no hay ningún otro origen. El
> aviso se apaga solo cuando el A deje de existir *porque el hosting ya está en
> Pages*, no antes.

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
curl -sI https://fervon.dev | grep -ci x-github-request-id       # 0 -> ya no pasa por GitHub
```

La cabecera `x-github-request-id` es el testigo que dice si el corte se ha
consumado: mientras aparezca, Cloudflare sigue yendo a GitHub Pages. Fuérzalo a
ir al origen para no leer una respuesta de caché:

```
curl -sI "https://fervon.dev/?cachebust=$(date +%s)" | grep -iE "cf-cache-status|x-github"
```

Y en **SSL/TLS → Edge Certificates**, el modo debe figurar como **Full (Strict)**.
Comprobación de que es real: con Pages sirviendo, `Full (Strict)` **no** debe dar
526. Si lo da, el custom domain no está bien enganchado — no lo tapes bajándolo
a "Full".

Por último, el aviso *«Dangling A Record»* de Security → Alerts se apaga solo en
cuanto el registro A a `185.199.10x.153` deja de existir (lo retira el propio
paso 4 al reescribir el DNS). Si sigue ahí después del corte, es que quedó un
registro suelto.

## Rollback

**El rollback es volver a Pages→GitHub por el proxy, nunca quitar el proxy.**
Quita el custom domain en Pages y reactiva GitHub Pages (Settings → Pages →
Source = GitHub Actions); vuelve a pegar la Transform Rule de la CSP (la imprime
`npm run csp:build`) y baja SSL/TLS a "Full". El DNS vuelve solo.

> ⚠ **La nube naranja no se toca ni en una emergencia.** Por el punto 3 de
> arriba, con el DNS en *DNS-only* el sitio queda inalcanzable en todos los
> navegadores: `.dev` exige HTTPS y el origen no tiene certificado válido.
> Cloudflare terminando el TLS es lo único que mantiene `fervon.dev` en pie hoy.

**Nada de lo que hay en `main` rompe el deploy actual mientras no toques el
dashboard**: GitHub Pages ignora `_headers` por completo.

## El negativo que no se arregla con una lista de comprobación

Después de migrar, Cloudflare es DNS, CDN, WAF, hosting y analítica a la vez.
Ese sigue siendo el precio.

Lo que **ya no** es un argumento en contra: *«hoy tienes un segundo origen y lo
pierdes»*. No lo tienes. Se comprobó el 2026-08-25 y falla por los dos lados:

- **Por el navegador**, `.dev` obliga a HTTPS y GitHub Pages no tiene cert para
  este dominio → quitar la nube naranja no degrada el servicio, lo apaga.
- **Por el DNS**, los autoritativos ya son `fred.ns.cloudflare.com` y
  `nelci.ns.cloudflare.com`. Si Cloudflare cae de verdad, el dominio ni
  resuelve; GitHub Pages no te salva de nada.

El «segundo origen» sólo cubría el caso *«Cloudflare mal configurado»*, y por el
primer punto ni eso. Migrar no destruye una redundancia: la redundancia ya
estaba rota, y esto lo que hace es dejar de fingir que existe.
