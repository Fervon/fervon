# Pagos — Veredicto

Estado: **la tienda está montada y cobrando**. Producto creado en Polar, campo del
repositorio obligatorio en el checkout y enlace ya publicado en el landing. Merchant of
record: Polar (el mismo que Trace).

## Datos fijos (2026-08-12)

| | |
|---|---|
| Producto | `Veredicto — repository licence` · id `5da2a1b2-2e5d-48f1-9419-b0c807dc2931` |
| Precio | **19 USD** y **19 EUR** al mes, recurrente, por repositorio |
| Checkout | `https://buy.polar.sh/polar_cl_ir1Idm0ddrPHPDUqy6bEP7cIpXA8ls1cWAP3f09bDie` |
| Campo obligatorio | `GitHub repository` · slug `github-repository` · llega como `custom_field_data.github-repository` |
| Success URL | vacía (no hay worker todavía) |

**Ojo con el IVA:** Polar cobra con impuestos INCLUIDOS. En España el checkout muestra
19 € de los cuales 15,70 € son tuyos y 3,30 € son IVA. Si querías 19 € netos, hay que
subir el precio.

**Ojo con las dos monedas:** cada moneda tiene su propio precio y **la nueva empieza en
0,00**. Si algún día añades otra (GBP…), pon el importe o la regalas.

> Este fichero describía hasta 2026-08-12 una "prueba de humo" con capa gratis + Pro.
> Ese modelo murió: hoy es **un solo producto de pago** con licencia firmada.

## Cómo se cobra y cómo se entrega

1. El comprador paga en Polar.
2. Tú (o un worker) le mandas una **clave de licencia** firmada con Ed25519.
3. Él la guarda como secreto `VEREDICTO_LICENSE` en su repo.
4. La Action la verifica **offline** contra la clave pública embebida en
   `src/entitlement.js`. No se contacta con ningún servidor, nunca.

Sin clave válida, la Action falla al arrancar y no analiza nada. Es deliberado: un run
que no encuentra nada porque nunca corrió es indistinguible de un PR limpio, y ese es el
único fallo que un check de pago no se puede permitir.

**La clave va atada a un repositorio** (`acme/web`) o a todo un dueño (`acme/*`), y
caduca. Consecuencia práctica para la tienda: **necesitas saber el repo del comprador
antes de poder emitir la clave.**

## Las rutas exactas

| Qué | Dónde |
|---|---|
| Placeholder del checkout (1 sitio) | `Desktop\proyects\fervon\veredicto\index.html` línea ~233 — `https://buy.polar.sh/REEMPLAZA_VEREDICTO_PRO` |
| Emitir una licencia | `Desktop\proyects\veredicto\scripts\sign-license.mjs` |
| Clave PRIVADA de firma (gitignorada, sin copia) | `Desktop\proyects\veredicto\scripts\keys\veredicto-signing-private.pem` |
| Clave pública embebida en el producto | `Desktop\proyects\veredicto\src\entitlement.js` |
| Worker de licencias reutilizable (Polar → email) | `Desktop\proyects\trace\services\license-worker\` |
| Guía paso a paso del worker de Trace | `Desktop\proyects\trace\services\license-worker\SETUP-CHECKLIST.md` |

## ~~Paso 1 — Crear el producto en Polar~~ HECHO 2026-08-12

En <https://polar.sh> → tu organización → **Products → New product**:

- **Nombre:** `Veredicto — licencia por repositorio`
- **Precio:** `$19` **recurrente mensual**
- **Descripción:** una licencia cubre **un repositorio**, pull requests ilimitados,
  repos públicos y privados. Incluye actualizaciones mientras la suscripción esté viva.
- **Campo personalizado obligatorio** (Checkout → custom fields): `Repositorio de GitHub`,
  texto, obligatorio, ayuda: *"formato `owner/nombre`, p. ej. `acme/web`. Tu licencia se
  emite para ese repositorio. Si quieres cubrir todos los tuyos, escribe `owner/*`."*

Ese campo es lo que hace que la venta sea de verdad self-serve: sin él tienes que
escribir al comprador para preguntárselo, y ahí se te va la entrega instantánea.

## ~~Paso 2 — Pegar el checkout link~~ HECHO 2026-08-12

Copia el link del producto (`https://buy.polar.sh/polar_cl_…`) y sustituye el
placeholder:

```powershell
cd C:\Users\jonat\Desktop\proyects\fervon
# comprueba que sigue ahí (debe salir 1 línea, la ~233)
Select-String -Path veredicto\index.html -Pattern REEMPLAZA_VEREDICTO_PRO
```

Sustituye la cadena `REEMPLAZA_VEREDICTO_PRO` por el id real, y publica:

```powershell
git add veredicto\index.html; git commit -m "veredicto: checkout de Polar en produccion"; git push
```

## Paso 3 — Emitir la licencia de cada venta

Con el pedido delante (Polar te manda email y lo tienes en el panel), lee el repo del
campo personalizado y emite:

```powershell
cd C:\Users\jonat\Desktop\proyects\veredicto
node scripts\sign-license.mjs --repo acme/web --months 1 --email comprador@acme.com
```

Sale un token `VEREDICTO.…`. Se lo mandas con estas dos frases:

> Guárdala en tu repo como secreto: **Settings → Secrets and variables → Actions → New
> repository secret**, nombre `VEREDICTO_LICENSE`. La instalación completa está en
> <https://github.com/JoniMartin27/veredicto/blob/main/docs/GETTING-STARTED.md>.

Renovación: mientras la suscripción siga activa, vuelves a emitir con más `--months`.
Si alguien cancela, **no hay nada que revocar** — la clave caduca sola. Esa es la
contrapartida de verificar offline, y es la correcta para este producto.

## Paso 4 (cuando duela hacerlo a mano) — Automatizar

Trace ya tiene el camino montado: webhook `order.paid` → verifica la firma de Polar →
emite la clave → la manda por email (Resend), con guarda de reenvío por `webhook-id`.
Está en `trace\services\license-worker\` y su guía en `SETUP-CHECKLIST.md`.

Para Veredicto hay que cambiar **una cosa**: `extractPurchase()` en `src/worker.js` saca
`email`, `name` y `product_id`, pero **no lee campos personalizados**. Hay que añadir el
repo del custom field de Polar y pasárselo al firmador. Hasta entonces, emitir a mano es
perfectamente razonable: son 30 segundos por venta y no te obliga a mantener un servicio.

## Riesgo que hay que cerrar hoy, no mañana

**La clave privada de firma existe en un solo sitio del mundo:**
`Desktop\proyects\veredicto\scripts\keys\veredicto-signing-private.pem`, gitignorada a
propósito. Si se pierde ese fichero, **ningún cliente existente puede renovar** y hay que
publicar una versión nueva con otra clave pública. Cópiala a tu gestor de contraseñas
(es un PEM de 119 bytes, cabe en una nota segura). No la subas a ningún repo.

## Verificar que la cadena funciona

```powershell
cd C:\Users\jonat\Desktop\proyects\veredicto
node scripts\sign-license.mjs --repo prueba/comprobacion --months 1
```

Comprobado el 2026-08-12 con la clave actual: una licencia recién emitida es aceptada en
su repo, **rechazada en otro repo**, rechazada si se le toca un byte a la firma,
rechazada si falta, y rechazada cuando pasa su fecha de caducidad.

## Y el landing

- `fervon.dev/veredicto/` carga con el tema Fervon, sin errores de consola, EN/ES OK.
- El hero abre con el gancho de over-mocking y la rejilla "Qué detecta" también.
- "Comprar licencia — $19/repo" abre el checkout de Polar (tras el paso 2).
