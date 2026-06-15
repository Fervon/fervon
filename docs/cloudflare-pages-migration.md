# Migrar fervon.dev a Cloudflare Pages (para SSL "Full (Strict)")

## Por qué
Hoy fervon.dev se sirve desde **GitHub Pages** detrás del proxy de Cloudflare.
GitHub Pages, al estar el DNS *proxied* (naranja), sirve un certificado de origen
`*.github.io` (no `fervon.dev`) → Cloudflare **no** puede validarlo, así que
SSL/TLS tiene que quedarse en **"Full"** (poner "Full (Strict)" da **526**).

Migrando el hosting a **Cloudflare Pages**, el origen pasa a ser Cloudflare y su
certificado SÍ se valida → se puede activar **Full (Strict)**.

> Esto es **opcional**. "Full" ya da candado verde y cifrado válido de cara al
> visitante; "Strict" solo blinda el salto interno CF↔origen.

## Lo que ya está preparado en el repo
- `scripts/build-pages.sh` — stagea solo los ficheros públicos en `dist/`,
  excluyendo dev/doc/build (misma exclude-list que `pages.yml`) y **aborta si se
  filtra algún fichero de dev** (evita reabrir la fuga que se cerró).
- `wrangler.toml` — declara `pages_build_output_dir = "dist"`.

## Pasos (dashboard de Cloudflare — tu cuenta)
1. **Workers & Pages → Create → Pages → Connect to Git** → autoriza GitHub y
   elige el repo **`Fervon/fervon`**, rama `main`.
2. **Build settings:**
   - Framework preset: **None**
   - Build command: `bash scripts/build-pages.sh`
   - Build output directory: `dist`
   - Deploy. Verás que despliega en `https://<proyecto>.pages.dev`.
3. Comprueba en `*.pages.dev` que el sitio carga y que **NO** se sirven ficheros
   de dev (deben dar 404): `/README.md`, `/SETUP.md`, `/package.json`, `/index.js`.
4. **Custom domains → Set up a custom domain → `fervon.dev`** (y `www.fervon.dev`
   si lo usas). Cloudflare reescribe los registros DNS para apuntar a Pages.
5. **SSL/TLS → Overview → Full (Strict).**
6. Cuando confirmes que `https://fervon.dev` carga bien desde Pages, **desactiva
   GitHub Pages** en `Fervon/fervon` (Settings → Pages → Source = None) para no
   tener dos orígenes, y borra el workflow `.github/workflows/pages.yml` (o déjalo;
   quedará inerte sin Pages activado).

## Verificación final
```
curl -sI https://fervon.dev            # 200, Server: cloudflare
curl -sI https://fervon.dev/SETUP.md   # 404 (no se filtran dev files)
```
Y en **SSL/TLS → Edge Certificates** el modo debe figurar como **Full (Strict)**.

## Rollback
Si algo falla, en el dashboard de Pages quita el custom domain y reactiva GitHub
Pages (Settings → Pages → Source = GitHub Actions). El DNS vuelve a su estado y
SSL/TLS a "Full". Nada en `main` rompe el deploy actual mientras no toques el
dashboard.
