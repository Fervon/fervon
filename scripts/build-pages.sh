#!/usr/bin/env bash
# Envoltorio del build de Cloudflare Pages.
#
# El build de verdad está en scripts/build-pages.mjs (Node). Antes esto montaba
# la salida con rsync, que NO está garantizado en la imagen de build de Pages.
# Este fichero se queda por compatibilidad: si el proyecto de Pages ya tiene
# configurado `bash scripts/build-pages.sh` como build command, sigue valiendo.
#
# Para configuraciones nuevas usa directamente:  npm run pages:build
set -euo pipefail
exec node "$(dirname "$0")/build-pages.mjs"
