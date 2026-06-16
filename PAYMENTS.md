# Pagos — Trace (pre-venta lifetime con Polar.sh)

Estado: **el pago está CABLEADO y en vivo en fervon.dev/trace.** Los botones
"Reservar — $39" enlazan directamente al checkout de Polar ya existente. La
entrega de la licencia la hace el worker `trace-license` (repo `trace`).

Modelo: **pre-venta lifetime early-bird $39** — cobras hoy, entregas beta +
licencia cuando esté lista. Polar = merchant of record (IVA global + PCI).

---

## Cómo está montado (todo en el repo fervon)

- 3 botones "Reservar — $39 / Pre-order — $39" en `trace/index.html` (hero,
  tarjeta de precio, banda final) con el **checkout link directo en el `href`**
  (a prueba de fallos: funciona sin JS):
  `https://buy.polar.sh/polar_cl_uQFZh6NjMqG5zp0RVGHSjITzIJVn1CPA2uB4N0DUmNc`
  (= `STORE_URL` del repo `trace`, `src/entitlement.js`).
- Aviso de pre-orden + reembolso junto al botón y en la FAQ. Lista de espera =
  vía gratuita secundaria.
- CSP estricta intacta (enlace alojado, sin scripts de terceros).

## Backend de entrega (repo `trace`, ya construido)

Tras pagar, Polar entrega la clave **Ed25519 offline** por dos vías, ambas
verificadas server-side antes de mintear:
- **Redirect** `/?checkout_id=…` → verifica con la API de Polar → muestra la clave
  en pantalla (y la envía por email si no hay webhook).
- **Webhook** `POST /webhook` (evento `order.paid`) → verifica la firma del webhook
  (HMAC, anti-replay) → mintea → **envía la clave por email**. Se dispara aunque el
  comprador cierre la pestaña: es el canal fiable.

Worker: `https://trace-license.jonathanmartinpaez.workers.dev`
Email vía **Resend** (un `fetch`, sin SDK), opcional pero recomendado.

## Pendiente HUMANO para que la entrega funcione al 100%

(En el panel de Polar / Cloudflare / Resend — ver detalle en
`trace/services/license-worker/README.md`.)

1. **Confirmar** que el producto de Polar detrás de ese checkout cuesta **$39** y
   está activo (importe cobrado = importe anunciado en la landing).
2. **Success URL** del checkout en Polar →
   `https://trace-license.jonathanmartinpaez.workers.dev/?checkout_id={CHECKOUT_ID}`
3. Secrets base del worker: `wrangler secret put TRACE_SIGNING_KEY` y
   `wrangler secret put POLAR_ACCESS_TOKEN` (token de Polar scope `checkouts:read`).
4. Fijar el `PRODUCT_ID` real en el worker (`wrangler.toml`, falla cerrado).
5. **Email automático al comprador (Resend):**
   - Verificar el dominio `fervon.dev` en Resend (registros DKIM/SPF en Cloudflare).
   - `wrangler secret put RESEND_API_KEY` + `EMAIL_FROM = "Trace <license@fervon.dev>"`
     en `wrangler.toml [vars]`.
6. **Entrega fiable aunque cierren la pestaña (webhook):**
   - En Polar → Settings → Webhooks: endpoint `…workers.dev/webhook`, evento
     `order.paid`, formato Raw (Standard Webhooks).
   - `wrangler secret put POLAR_WEBHOOK_SECRET` (el secret que muestra Polar).
   - Con el webhook configurado, **el webhook es quien envía el email** y el redirect
     deja de duplicar (solo muestra la clave en pantalla).

## Verificar

- `fervon.dev/trace/` → "Reservar — $39" abre el checkout de Polar.
- Compra de prueba (modo test de Polar) → aterriza en el worker, que muestra/
  envía la license key; verificar que `entitlement.js` la acepta offline.

## Notas

- Mantén la promesa "pre-orden / reembolso hasta el lanzamiento" (ya en el copy):
  reduce disputas y cumple el desistimiento de la UE para digital no entregado.
- **Upgrade opcional** (mejor UX, requiere CSP): checkout embebido de Polar
  (`@polar-sh/checkout`) → habría que añadir dominios de Polar a `script-src` +
  `frame-src` + `connect-src` y re-correr `scripts/build-csp.mjs`. El enlace
  alojado actual lo evita.
- **SEO opcional**: schema `Offer` con `availability: PreOrder` en el JSON-LD de
  `trace/index.html` → cambia el hash de la CSP (re-correr `build-csp.mjs` +
  actualizar la Transform Rule de Cloudflare). Por eso no se tocó el JSON-LD.
- El tier "Pro IA" sigue "Próximamente" (no se vende aún).
