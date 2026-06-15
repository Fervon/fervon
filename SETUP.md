# Reservar los handles de Fervon

> **Estado (2026-06-15):** Handles de marca **TODOS reservados**. La organización **[Fervon](https://github.com/Fervon)** existe en GitHub, este repo vive en **`Fervon/fervon`**, **[fervon.dev](https://fervon.dev)** está **activo** (GitHub Pages + proxy Cloudflare), y en **npm** ya están **el paquete pelado `fervon@0.0.1` publicado y el scope `@fervon`** reservado por la org npm (owner `lookspan`). Único pendiente opcional: `fervon.com` sigue en venta (arrancamos en `.dev`). Los pasos de abajo quedan como **referencia histórica** de cómo se blindó.

Disponibilidad original confirmada (RDAP/registry, 2026-06-13): `npm fervon`, `@fervon`, `github.com/fervon` (user+org) y `fervon.dev` estaban **libres**.

Los pasos de abajo documentan cómo se blindó (y cómo terminar lo de npm).

## 1. npm — reservar el nombre `fervon` y el scope `@fervon`

Ya tienes sesión activa (`npm whoami` → `lookspan`). El único paso bloqueante es el **2FA**: el publish pide un código OTP de tu app de autenticación, así que **lo ejecutas tú** (un agente no puede publicar headless).

```powershell
npm publish "C:\Users\jonat\Desktop\proyects\fervon"
# npm pedirá el OTP. O directo:  npm publish "...\fervon" --otp=CÓDIGO
```

Esto reserva el nombre pelado `fervon@0.0.1`.

### Scope de marca `@fervon` — NO es renombrar el usuario

npm **no permite renombrar** la cuenta `lookspan`, y no hace falta. Para publicar bajo `@fervon/...` necesitas una **organización npm `fervon`** (gratis para paquetes públicos):

1. Crea la org en **https://www.npmjs.com/org/create** → nombre `fervon`, plan **Free** (Unlimited public packages).
2. A partir de ahí, futuros paquetes:

```powershell
# en cada paquete con package.json name "@fervon/cli", "@fervon/core", etc.
npm publish --access public --otp=CÓDIGO   # los scoped requieren --access public
```

Tu login sigue siendo `lookspan`; la cara pública de la marca es el paquete `fervon` + el scope `@fervon`.

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
