# Pagos — Trace (pre-venta lifetime con Polar.sh)

Estado: **el código de compra está listo y desplegado.** Lo único que falta para
que el pago quede VIVO son los pasos de cuenta en Polar (no automatizables: KYC +
datos bancarios + crear el producto). En cuanto pegues el Checkout Link en el sitio
marcado, los botones "Reservar — $39" cobran de verdad.

Modelo elegido: **pre-venta lifetime early-bird** — cobras los $39 hoy y entregas
beta + licencia cuando Trace esté listo. Polar es **merchant of record**: gestiona
el IVA/impuestos globales y la conformidad PCI por ti.

---

## Lo que ya hay en el repo (hecho)

- 3 CTA "Reservar — $39" con atributo `data-buy` en `trace/index.html` (hero,
  tarjeta de precio Lifetime, banda CTA final).
- Aviso de pre-orden + reembolso junto al botón y en la FAQ.
- Lista de espera reconvertida en vía **gratuita** secundaria ("¿aún no quieres
  reservar?").
- Página de gracias post-compra: `trace/gracias.html` (`noindex`).
- Un único punto de configuración: la constante `TRACE_CHECKOUT_URL` al inicio de
  `trace/index.client.js`. Mientras esté vacía, los botones caen a `#pricing` /
  `#waitlist` sin romperse.
- CSP estricta intacta: el checkout es un enlace alojado (`<a href>`), no un script
  de terceros → no hay que tocar la regla de Cloudflare.

## Pasos en Polar (humano — una vez)

1. **Crear cuenta + organización** en https://polar.sh y completar el onboarding
   (identidad/KYC + cuenta bancaria de payout). Sin esto no se puede cobrar.
2. **Crear el producto**: Products → New.
   - Nombre: `Trace · Lifetime (early-bird)`
   - Tipo: **One-time payment** (pago único), precio **$39 USD**.
   - Descripción: deja claro que es **pre-orden/beta** — "Pre-order: pago único
     lifetime. Acceso a la beta y descarga cuando esté lista. Reembolso total hasta
     el lanzamiento."
3. **Activar License Keys** en el producto (Benefits → License Keys) para que cada
   compra genere y envíe una clave automáticamente.
4. **Success URL** del producto/checkout → `https://fervon.dev/trace/gracias`.
5. **Checkout Link**: Product → Checkout Links → Create → Copy. Forma:
   `https://buy.polar.sh/xxxxxxxxxxxxxxxx`.
6. **Pegar el link** en `trace/index.client.js`:
   ```js
   var TRACE_CHECKOUT_URL = "https://buy.polar.sh/xxxxxxxxxxxxxxxx";
   ```
   Commit + push → el deploy de Pages lo publica y los botones ya cobran.

## Verificar

- Abre `fervon.dev/trace/`, pulsa "Reservar — $39" → debe ir al checkout de Polar.
- Haz una compra de prueba (Polar tiene modo test / tarjetas de prueba) → confirma
  que aterriza en `/trace/gracias` y que llega el email con recibo + license key.

## Notas

- **No cobres lo que no puedas entregar sin avisar**: el copy ya marca "pre-orden /
  reembolso hasta el lanzamiento". Mantén esa promesa (reduce disputas/chargebacks y
  cumple el derecho de desistimiento de la UE para bienes digitales aún no entregados).
- **Upgrade opcional (mejor UX, requiere tocar CSP)**: checkout embebido de Polar
  (`@polar-sh/checkout`, overlay sin salir del sitio). Necesitaría añadir los dominios
  de Polar a `script-src` + `frame-src` + `connect-src` en la regla de Cloudflare y
  re-correr `scripts/build-csp.mjs`. El enlace alojado actual evita todo eso.
- **SEO follow-up opcional**: añadir/actualizar el schema `Offer` con
  `availability: PreOrder` en el JSON-LD de `trace/index.html`. Eso cambia el hash de
  la CSP → hay que re-correr `node scripts/build-csp.mjs` y actualizar la Transform
  Rule de Cloudflare. Por eso NO se tocó el JSON-LD al habilitar el pago.
- El tier "Pro IA" sigue como "Próximamente" (no se vende todavía).
