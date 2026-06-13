# Reservar los handles de Fervon

Disponibilidad confirmada (RDAP/registry, 2026-06-13): `npm fervon`, `@fervon`, `github.com/fervon` (user+org) y `fervon.dev` están **libres**. `fervon.com` está en venta (lo dejamos para más adelante).

Ejecuta estos pasos para blindar el nombre antes de que alguien lo tome.

## 1. npm — reservar el nombre `fervon` y el scope `@fervon`

```bash
cd Desktop/proyects/fervon
npm login                 # tu cuenta npm
npm publish               # publica fervon@0.0.1 (reserva el nombre pelado)
```

Para reservar también el scope `@fervon` (para futuros `@fervon/cli`, `@fervon/core`…), publica un placeholder bajo el scope:

```bash
mkdir fervon-scope && cd fervon-scope
npm init -y               # luego edita "name" a "@fervon/brand"
npm publish --access public   # los paquetes con scope requieren --access public
```

## 2. GitHub — crear la organización `fervon` (paso 4)

La organización se crea desde la web (no hay API para crear orgs):

1. Ve a **https://github.com/account/organizations/new** → plan **Free**.
2. Nombre de la organización: **fervon**.
3. Crea el repo del **perfil de la org** (lo que se ve en `github.com/fervon`):

```bash
gh repo create fervon/.github --public -d "Perfil de la organización Fervon"
git clone https://github.com/fervon/.github
mkdir -p .github/profile
cp ../fervon/.github/profile/README.md .github/profile/README.md
cd .github && git add . && git commit -m "perfil de la organización Fervon" && git push
```

4. Crea el repo casa del estudio:

```bash
cd Desktop/proyects/fervon
gh repo create fervon/fervon --public --source=. --remote=origin --push \
  -d "Fervon — estudio de software autónomo. Forjado al rojo vivo."
```

> Mientras no exista la org, puedes arrancar bajo tu usuario con `gh repo create JoniMartin27/fervon …` y transferir el repo a la org `fervon` después (Settings → Transfer ownership).

## 3. Dominio (más adelante)

`fervon.dev` está **libre** — cómpralo cuando quieras lanzar la landing (Namecheap/Cloudflare/Google ~12 €/año). `fervon.com` está en venta (premium) si lo quieres después.

## 4. Difusión

Cuando publiques, anúncialo con tu propio **Pregón** (`PROJECT=fervon`).
