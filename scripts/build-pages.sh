#!/usr/bin/env bash
# Build step para Cloudflare Pages.
# Copia SOLO los ficheros públicos del sitio a dist/, excluyendo dev/doc/build
# files (README, SETUP, manifiestos npm, scripts, index.js…) para que NUNCA se
# sirvan en fervon.dev. Misma exclude-list que .github/workflows/pages.yml
# (el deploy actual de GitHub Pages), para no reintroducir la fuga de ficheros
# de dev que se cerró en su día.
set -euo pipefail

OUT="dist"
rm -rf "$OUT"
mkdir -p "$OUT"

rsync -a ./ "$OUT"/ \
  --exclude "$OUT" \
  --exclude '.git' \
  --exclude '.github' \
  --exclude '.claude' \
  --exclude '.wrangler' \
  --exclude 'node_modules' \
  --exclude 'scripts' \
  --exclude 'docs' \
  --exclude '.gitignore' \
  --exclude 'README.md' \
  --exclude 'SECURITY.md' \
  --exclude 'SETUP.md' \
  --exclude 'BRAND-IMAGE-PROMPTS.md' \
  --exclude 'package.json' \
  --exclude 'package-lock.json' \
  --exclude 'index.js' \
  --exclude 'wrangler.toml' \
  --exclude 'build'

# Salvaguarda: aborta el build si algún fichero de dev se ha colado en la salida.
leaked=0
for f in README.md SECURITY.md SETUP.md BRAND-IMAGE-PROMPTS.md package.json package-lock.json index.js .gitignore; do
  if [ -e "$OUT/$f" ]; then echo "FUGA: $OUT/$f no debería publicarse" >&2; leaked=1; fi
done
if [ -e "$OUT/scripts" ]; then echo "FUGA: $OUT/scripts/ no debería publicarse" >&2; leaked=1; fi
[ "$leaked" -eq 0 ] || { echo "Abortado: ficheros de dev en la salida." >&2; exit 1; }

# Sanidad: el index y un par de assets clave deben existir.
for f in index.html sitemap.xml robots.txt CNAME assets/core.css; do
  [ -e "$OUT/$f" ] || { echo "FALTA: $OUT/$f esperado en la salida" >&2; exit 1; }
done

echo "Publicado en $OUT/ (primer nivel):"
find "$OUT" -maxdepth 1 | sort
