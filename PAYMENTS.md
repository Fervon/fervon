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

Diseño **blindado y fail-closed** (los pagos son la parte más comprometida del
sistema, así que sin bifurcaciones: si falta cualquier requisito, el worker se niega
a entregar). Tras pagar, Polar entrega la clave **Ed25519 offline** así:
- **Redirect** `/?checkout_id=…` → verifica con la API de Polar → **muestra** la clave
  canónica en pantalla. **Nunca envía email.**
- **Webhook** `POST /webhook` (evento `order.paid`) → verifica la firma (HMAC,
  anti-replay) → mintea/recupera la clave canónica → **la envía por email exactamente
  una vez**. Único canal de email; se dispara aunque cierren la pestaña.

**Idempotencia (KV obligatorio):** una sola licencia por comprador (clave
`productId:email`). Reabrir el redirect o que Polar reintente el webhook devuelve
**siempre la misma clave**, y el email se envía **una única vez**.

Worker: `https://trace-license.jonathanmartinpaez.workers.dev`
Email vía **Resend** (un `fetch`, sin SDK).

## Pendiente HUMANO para que la entrega funcione al 100%

(En el panel de Polar / Cloudflare / Resend — ver detalle en
`trace/services/license-worker/README.md`. **Todo es obligatorio: el worker falla
cerrado si falta algo.**)

1. **Confirmar** que el producto de Polar cuesta **$39** y está activo.
2. **KV de idempotencia:** `wrangler kv namespace create DELIVERIES` → pegar el id en
   `wrangler.toml`.
3. **Return URL** del checkout en Polar →
   `https://trace-license.jonathanmartinpaez.workers.dev/?checkout_id={CHECKOUT_ID}`
4. Secrets base: `wrangler secret put TRACE_SIGNING_KEY` y
   `wrangler secret put POLAR_ACCESS_TOKEN` (scope `checkouts:read`).
5. **`PRODUCT_ID` real** en `wrangler.toml` (ya obligatorio, falla cerrado).
6. **Email automático (Resend):**
   - Verificar el dominio `fervon.dev` en Resend (DKIM/SPF en Cloudflare).
   - `wrangler secret put RESEND_API_KEY` + `EMAIL_FROM` en `wrangler.toml`.
7. **Webhook (canal de email):** Polar → Settings → Webhooks: endpoint
   `…workers.dev/webhook`, evento `order.paid`, formato Raw (Standard Webhooks) +
   `wrangler secret put POLAR_WEBHOOK_SECRET`.

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

---

# Pagos — Veredicto (prueba de humo: ¿alguien paga el Pro?)

Estado: **landing publicable en `fervon.dev/veredicto/`**. Es una **prueba de humo
de willingness-to-pay**: el producto (la Action) aún NO está construido — primero
validamos que alguien instala y que alguien reserva el Pro, y SOLO entonces se
construye. Mismo patrón visual que Trace, mismo merchant of record (Polar).

Modelo (del análisis `Desktop\veredicto-analisis\index.html`):
- **Capa base GRATIS y open source** — GitHub Action de detección estática de
  test-gaming (sin LLM, sin API key). CTA "Instalar la Action — gratis".
- **Pro $19/repo/mes** (hasta 100 PRs verificados; $49 hasta 500) — LLM-juez
  diff-vs-claim + informe firmado, BYO API key. CTA "Empezar Pro".

## Cómo está montado (todo en el repo fervon, carpeta `veredicto/`)
- `index.html` + `base.css` + `index.css` + `index.client.js` clonando el tema
  Fervon (core.css + shared.css/js globales). Bilingüe ES/EN, JSON-LD, sitemap.
- **Waitlist** reusa el Formspree de Trace (`/f/mnjyoknb`) con `origen=veredicto/index`
  → te llega a tu email, sin montar nada nuevo.
- Enlazado desde la home (`index.html`: mega-menú + grid "IA local & agentes") y `sitemap.xml`.

## Pendiente HUMANO para cerrar la prueba de humo (en orden)
1. ~~**Repo de la Action** `JoniMartin27/veredicto`~~ **HECHO (2026-06-22):** repo
   PÚBLICO vivo en https://github.com/JoniMartin27/veredicto con una GitHub Action
   v0 REAL y funcional (Node 20, 0 deps): detecta tests borrados/.skip, asserts
   tautológicos, umbrales de cobertura bajados y snapshots regenerados en masa en
   el diff del PR (`src/detectors.js`, 6 tests verdes, CI verde, tags `v0`/`v0.1.0`,
   se dogfoodea a sí mismo). Los botones "Instalar la Action" del landing ya
   resuelven; el snippet `uses: JoniMartin27/veredicto@v0` funciona.
2. **Producto Pro en Polar** ($19/mes, recurrente por repo): crea el producto y
   **pega su checkout link** en lugar del placeholder
   `https://buy.polar.sh/REEMPLAZA_VEREDICTO_PRO` (3 sitios en `veredicto/index.html`:
   pricing + nada más; busca el placeholder). El resto de la entrega (worker de
   licencia, webhook, idempotencia) se reutiliza del montaje de Trace cuando haya GO.
3. **Definir el criterio GO/NO-GO ANTES de difundir** (del plan): en 2 semanas,
   ≥10 instalaciones de la Action y/o ≥1 reserva de Pro con tarjeta → GO (construir
   la Action de verdad). Si nadie pasa de "qué interesante" → NO-GO, archivar.
4. **Difusión** (canal del ICP, no venta): Show HN, r/ClaudeAI, r/ChatGPTCoding,
   awesome-claude-code. El gancho es el **informe de datos** ("Analicé N PRs de
   agentes: X% mostraba test-gaming"), no el "instala mi tool".

## Verificar
- `fervon.dev/veredicto/` carga con el tema Fervon, 0 errores de consola, EN/ES OK.
- "Empezar Pro — $19/repo" abre el checkout de Polar (tras pegar el link real).
- La waitlist envía a Formspree (te llega el email con `origen=veredicto/index`).
