# Presencia externa: mapas, directorios y LinkedIn

> Esta carpeta está excluida del despliegue (`--exclude 'docs'` en `pages.yml`),
> así que nada de esto se sirve en fervon.dev.
>
> **Verificado el 2026-09-01.** Todo lo que lleva una URL se comprobó ese día.
> Los precios, los requisitos y los desplegables de estos sitios cambian:
> vuelve a mirarlos antes de fiarte de una cifra de aquí.

## Por qué existe este documento

En ChatGPT, «estudio de ia» en Málaga devuelve cinco competidores y ninguno es
Fervon. Los cinco comparten tres cosas que Fervon no tiene: ficha en el mapa,
página de empresa en LinkedIn citada como fuente («*es una estructura pequeña,
de 2–10 personas **según LinkedIn***») y precios y metodología publicados.

Y para la consulta a escala nacional —«estudio de ia en españa»— ChatGPT dice
literalmente: «*además, en **directorios especializados** de 2026 aparecen…*».
Para esa consulta el mecanismo no es la web propia: son listados de terceros.

Lo que se arregla desde el repositorio ya está hecho: `/servicios/`, la
cobertura geográfica en el schema y `llms.txt`. Esto es la otra mitad, y no se
hace desde el repositorio.

---

## 0. El bloqueo común: no hay correo en el dominio

Los tres frentes piden un correo, y **AIAgencies.eu dice explícitamente que un
correo del dominio de la agencia acelera la verificación**. Hoy fervon.dev no
tiene ninguno: el contacto va por un formulario de Formspree.

**Buena noticia, medida el 2026-09-01:** Email Routing de Cloudflare ya está
activo en el dominio. Los MX responden desde fuera:

```
fervon.dev  MX 14  route1.mx.cloudflare.net
fervon.dev  MX 92  route2.mx.cloudflare.net
fervon.dev  MX 77  route3.mx.cloudflare.net
```

Falta solo crear la dirección. Es gratis, no necesita la suscripción de pago y
son dos minutos: **Cloudflare → fervon.dev → Email → Email Routing → Create
address**, reenviando a la cuenta de Gmail (Cloudflare manda un correo de
verificación al destino y hay que pulsarlo).

Sugerencia: `hola@fervon.dev`. Corto, no dice «no-reply», y sirve igual para un
formulario de directorio que para una ficha de Google.

> El token de la API que hay en esta máquina no puede hacerlo: solo tiene
> permisos de Pages y D1 (403 en `email/routing`, en `dns_records` y en
> `subscriptions`). Tiene que hacerse desde el panel, o ampliar el token.

---

## 1. Ficha en el mapa (Google Business Profile y Bing Places)

### Lo que hay que saber antes de empezar

Fervon no tiene local de cara al público. La figura que corresponde es
**negocio con área de servicio** (*service-area business*): se declara a dónde
se da servicio y **la dirección queda oculta** en la ficha.

**La fricción real, sin adornos:** aunque la dirección no se muestre, para
*verificar* la ficha Google pide normalmente una dirección real y cada vez más
un **vídeo de verificación** grabado en el momento, enseñando el sitio donde se
trabaja, algo que identifique el negocio y a la persona. No es un trámite de
cinco minutos y a un autónomo sin local le pueden rechazar la ficha. Conviene
saberlo antes de invertir la tarde.

### Categorías propuestas

| | Categoría | Por qué |
|---|---|---|
| **Principal** | Servicio de desarrollo de software | Es lo que se vende; la principal pesa mucho más que las demás |
| Secundaria | Empresa de software | Cubre la consulta genérica |
| Secundaria | Consultor informático | Es como mucha gente nombra esto |
| Secundaria | Servicio de diseño de páginas web | Solo si se aceptan encargos de web a medida |

Deja fuera «agencia de marketing» y «agencia de publicidad» aunque tienten:
atraen la consulta equivocada y la página `/servicios/` dice explícitamente que
eso no se hace.

### Descripción para la ficha (750 caracteres es el límite de Google)

```
Estudio de software con base en Málaga que trabaja en remoto para toda España.
Construye seis cosas: aplicaciones web y APIs a medida, SaaS desde cero,
chatbots que responden con los documentos del propio cliente, automatización de
procesos con agentes de IA, integración de modelos de lenguaje en productos que
ya existen, y herramientas internas.

Lo lleva una sola persona, Jonathan Martín, dirigiendo flotas de agentes de IA.
No hay capa comercial: quien construye es quien responde.

Precio cerrado por proyecto, acordado por escrito antes de empezar. Nunca por
horas. El código entregado es del cliente, documentado y traspasado.

No se hacen apps nativas, videojuegos ni marketing.
```

*(688 caracteres, contados. El límite de Google son 750: si lo editas, vuelve a contarlos — la primera versión de este bloque medía 762 y no cabía.)*

### Preguntas y respuestas para precargar en la ficha

Google deja publicar preguntas y responderlas uno mismo. Es donde entran los
**precios y la metodología**, que es justo lo que ChatGPT cita de la competencia.

1. **¿Trabajáis con empresas fuera de Málaga?** — Sí, y es el caso normal. La
   base está en Málaga pero todos los proyectos se llevan en remoto, así que un
   cliente de Madrid, Barcelona o Sevilla recibe el mismo proceso.
2. **¿Cómo se cobra?** — Precio cerrado por proyecto, acordado por escrito
   antes de empezar. Nunca por horas. Un cambio de alcance es una cifra nueva,
   no una sorpresa en la factura.
3. **¿De quién es el código al terminar?** — Del cliente. El repositorio se
   traspasa con su documentación y sus pruebas, sin licencia que lo ate.
4. **¿Mis datos acaban en un proveedor de IA?** — Se decide por escrito antes
   de empezar. Cuando importa, todo corre contra modelos locales y nada sale de
   la red del cliente.
5. **¿Qué NO hacéis?** — Apps nativas de iOS/Android, videojuegos, SEO y
   marketing, y meter una persona dentro del equipo del cliente durante meses.

### Bing Places

Bing Places permite **importar la ficha de Google** una vez creada, así que el
orden correcto es Google primero y Bing después: se ahorra rellenarlo dos veces.
Y Bing importa más aquí de lo que parece — **ChatGPT busca con el índice de
Bing**.

### DECIDE JONATHAN

- **Dirección para la verificación.** Sale del panel de Google aunque luego se
  oculte. ¿Se usa la de casa?
- **Teléfono.** Google lo pide y no admite un formulario en su lugar.
- **Área de servicio.** Recomendado: España como país, y Málaga y Andalucía
  como áreas concretas — lo mismo que ya declara el `areaServed` del schema.

---

## 2. Directorios

### El hallazgo que cambia el plan

**AIAgencies.eu es el directorio que citó ChatGPT.** Encaja con la chapa de
cita («AIAgencies…») y con el texto: 313 agencias en 42 ciudades europeas.

Y hay que decirlo claro: **hoy rechazaría a Fervon**, y no por un problema de
redacción. Cuatro cosas, todas comprobadas en su propio formulario y en su
página de metodología:

1. **Málaga no está en su lista de ciudades.** Hay Alicante, Barcelona y
   Madrid, pero no Málaga. Existe un «My city isn't listed», y su metodología
   dice que esos casos van a una cola de expansión: *«23 waiting on a city…
   esta lista es también nuestra cola de expansión»*. No es un alta, es una
   lista de espera.
2. **El tamaño mínimo del desplegable es «2-9 employees».** No hay opción de
   una persona. Marcar 2-9 sería mentir en un directorio cuyo modelo entero es
   verificar lo que dices.
3. **«Office Address» es obligatorio.** No hay oficina.
4. **La barra es tener clientes con nombre.** Su metodología: han evaluado 418
   agencias y no listaron 104; de esas, *«49 declinadas por evidencia: leímos
   el trabajo publicado y no se sostenía — sin clientes con nombre, sin entrega
   verificable»*. Fervon tiene productos publicados y código abierto, pero **no
   tiene todavía un proyecto de cliente que se pueda enseñar con nombre**.

Eso último es lo importante y no es un problema de SEO: **el motivo por el que
Fervon no está en los directorios que lee ChatGPT es que esos directorios piden
una evidencia que Fervon aún no tiene.** El primer cliente con permiso para
contarlo desbloquea más que cualquier cosa que se escriba en la web.

Detalle a favor cuando llegue el momento: su método dice que las posiciones
*«se ganan, nunca se venden»*, y hay una vía gratuita (revisión en 60-90 días)
además de una de pago. No es un pago-por-aparecer.

- Formulario: <https://www.aiagencies.eu/submit>
- Método y requisitos: <https://www.aiagencies.eu/methodology>

### El que sí encaja hoy: agentes.ai

<https://www.agentes.ai/> — directorio B2B **en español** de agencias de IA.

Por qué es el bueno ahora mismo:

- **Tiene página propia de Málaga** (`/agencias/ciudad/malaga`) y, cuando se
  miró, **ninguno de los competidores que ChatGPT cita aparecía en ella**. Hay
  sitio delante.
- **«Publica tu agencia gratis 3 meses»**, según su propia portada.
- Y lo que más importa para el objetivo: **está construido para que lo lean las
  IA**. Tiene su propio `llms.txt`, una especificación OpenAPI y hasta un
  manifiesto MCP en `/.well-known/mcp.json`. Un directorio que publica su
  catálogo en formato de máquina es exactamente el que un asistente puede citar.
- Sus categorías encajan sin forzar nada: automatización con IA, agentes
  autónomos, integraciones IA, consultoría IA. (La quinta, agentes de voz, no
  aplica: no marcarla.)

Aviso honesto: es un directorio joven y no es el que ChatGPT citó. Que lo llegue
a citar es una apuesta razonable por cómo está construido, no un hecho.

### Los grandes: Clutch, Sortlist, DesignRush, GoodFirms

Aparecen en todas las búsquedas y hay que decir por qué **no** son la primera
opción aquí: su modelo es vender contactos. Te dan de alta gratis y a los pocos
días empiezan las llamadas comerciales, y la visibilidad de verdad se paga.

Eso choca de frente con cómo quiere trabajar Fervon —self-serve, descubrible,
sin venta persona a persona—. Además, casi todos piden reseñas verificadas de
clientes con nombre, o sea el mismo muro del punto anterior.

**Recomendación: sáltatelos por ahora.** Si algún día se entra, que sea con el
alta gratuita y sabiendo que el teléfono va a sonar.

### Lo que sí se puede hacer YA, sin permiso de nadie

La vía que no pide clientes con nombre porque juzga el código, no el cliente:
**las *awesome lists* de GitHub**. Fervon tiene cinco herramientas open source
publicadas y con código a la vista. Se manda una pull request y se acepta por
lo que hace la herramienta.

Ya hay un proyecto abierto para esto en el workspace —el seguimiento de
*awesome-lists*—; esto le da un motivo más para retomarlo, porque cada lista es
un enlace desde un repositorio que las IA leen mucho.

### Texto de alta, listo para pegar

**Descripción corta (~50 palabras, castellano)**

```
Estudio de software en Málaga que trabaja en remoto para toda España.
Aplicaciones a medida, SaaS, chatbots que responden con los datos del cliente,
automatización con agentes de IA e integración de modelos de lenguaje. Precio
cerrado por proyecto, nunca por horas. El código entregado es del cliente.
```

**Short description (~50 words, English)**

```
A software studio based in Málaga, Spain, working remotely across the country.
Bespoke applications, SaaS, chatbots grounded in the client's own data, process
automation with AI agents, and LLM integration. Closed price per project, never
by the hour. The delivered code belongs to the client.
```

**Descripción media (~150 palabras, castellano)**

```
Fervon es un estudio de software de una persona con base en Málaga, que trabaja
en remoto para toda España y para clientes en cualquier huso horario.

Construye seis cosas distintas: aplicaciones web y APIs hechas al proceso del
cliente; SaaS desde cero, con multi-tenant, planes y facturación que cuadra;
chatbots y asistentes que responden desde los documentos del propio cliente y
citan la fuente, con la opción de correr contra un modelo local para que nada
salga de su red; automatización de procesos con agentes de IA, reversibles y con
freno ante lo irreversible; integración de modelos de lenguaje en productos que
ya existen, medida por coste por petición antes de publicarse; y herramientas
internas.

El precio es cerrado por proyecto y se acuerda por escrito antes de empezar. El
código entregado es del cliente, documentado y traspasado.

No se hacen apps nativas, videojuegos, marketing ni staff augmentation.
```

**Etiquetas / categorías**

`software a medida` · `SaaS` · `chatbots` · `RAG` · `agentes de IA` ·
`automatización de procesos` · `integración de LLM` · `herramientas internas` ·
`local-first` · `Málaga` · `España`

### DECIDE JONATHAN

- **El correo** del punto 0. Sin él, la mitad de estos formularios se atascan.
- **Tarifa por hora.** Varios directorios la piden como campo obligatorio y
  Fervon no cobra por horas. Hay que decidir qué se pone: la horquilla más baja,
  o no darse de alta en los que la exijan.
- **El primer caso con nombre.** Es lo que abre AIAgencies.eu y los grandes. No
  hace falta el nombre del cliente si no quiere: vale un caso con la cifra y el
  sector («una gestoría de Málaga, X horas al mes»), pero tiene que ser real y
  publicado.

---

## 3. Página de empresa en LinkedIn

Existe (<https://www.linkedin.com/company/fervondev> responde 200) pero **no
sabemos qué tiene dentro**: LinkedIn bloquea la lectura automática, así que hay
que abrirla y mirar. No doy por hecho lo que contiene.

Importa más de lo que parece: **ChatGPT la está leyendo y citando**. De un
competidor dice «*una estructura pequeña, de 2–10 personas según LinkedIn*». Ese
dato salió de la ficha, no de su web.

### Lista de comprobación al abrirla

- [ ] Logo y foto de portada
- [ ] Eslogan
- [ ] «Acerca de»
- [ ] Sitio web → `https://fervon.dev`
- [ ] Sector
- [ ] Tamaño de la empresa
- [ ] Tipo de empresa
- [ ] Año de fundación → 2026
- [ ] Ubicación → Málaga, Andalucía, España
- [ ] **Especialidades** ← el campo más importante y el que más se deja vacío
- [ ] Botón personalizado → «Visitar sitio web»

### Eslogan (tres opciones)

1. `Estudio de software en Málaga: a medida, SaaS y agentes de IA.` (62)
2. `Software a medida con flotas de agentes de IA. Málaga, para toda España.` (72)
3. `Un estudio de software de una persona. Forjado al rojo vivo.` (60)

La 1 es la recomendada: es la que lleva dentro las palabras por las que se busca.

### «Acerca de» — castellano

```
Fervon es un estudio de software de una persona con base en Málaga que trabaja
en remoto para toda España, y para clientes en cualquier huso horario.

Qué se construye aquí:

· Software a medida — aplicaciones web y APIs hechas al proceso del cliente.
· SaaS desde cero — multi-tenant, planes, facturación y alta en autoservicio.
· Chatbots y asistentes con los datos del cliente — responden desde sus
  documentos citando la fuente, y pueden correr contra un modelo local para que
  nada salga de su red.
· Agentes de IA y automatización de procesos — reversibles, observables, y con
  freno: lo irreversible se para y pregunta.
· Integración de modelos de lenguaje en productos que ya existen.
· Herramientas internas y paneles.

Cómo se trabaja: dirigiendo flotas de agentes de IA, con una persona poniendo el
criterio y revisando. Precio cerrado por proyecto, acordado por escrito antes de
empezar; nunca por horas. El código entregado es del cliente, documentado y
traspasado, sin dependencia de Fervon ni de ninguna plataforma.

Qué no se hace, para no hacerte perder el tiempo: apps nativas de iOS y Android,
videojuegos, SEO y marketing, y meter una persona dentro de tu equipo durante
meses.

Fervon publica además sus propias herramientas: Veredicto, un check de CI que
caza tests que pasan sin probar nada (19 $ por repositorio), y Trace, memoria
personal local-first (39 $). Y cinco herramientas de código abierto: inferbench,
Lookspan, ClaudeScope, launchpad y Pregón.

Servicios: https://fervon.dev/servicios/
```

### «Acerca de» — English

```
Fervon is a one-person software studio based in Málaga, Spain, working remotely
across the country and with clients in any timezone.

What gets built here:

· Bespoke software — web applications and APIs built to the client's process.
· SaaS from scratch — multi-tenancy, plans, billing and self-serve onboarding.
· Chatbots and assistants grounded in the client's data — they answer from your
  own documents and cite the source, and can run against a local model so
  nothing leaves your network.
· AI agents and process automation — reversible, observable, and with a brake:
  anything irreversible stops and asks.
· LLM integration into products that already exist.
· Internal tools and dashboards.

How the work runs: directing fleets of AI agents, with one person setting the
judgement and reviewing. A closed price per project, agreed in writing before
starting — never by the hour. The delivered code is the client's, documented and
handed over, with no lock-in to Fervon or to any platform.

What is not done, so nobody wastes their time: native iOS and Android apps,
video games, SEO and marketing, and staff augmentation.

Fervon also publishes its own tools: Veredicto, a CI check that catches tests
passing without testing anything ($19 per repository), and Trace, local-first
personal memory ($39). Plus five open-source tools: inferbench, Lookspan,
ClaudeScope, launchpad and Pregón.

Services: https://fervon.dev/en/servicios/
```

### Especialidades (el campo que más rinde)

Va en orden: las primeras pesan más.

```
Software a medida, Desarrollo de SaaS, Chatbots con IA, Agentes de IA,
Automatización de procesos, Integración de LLM, RAG, Aplicaciones web,
Desarrollo de APIs, Herramientas internas, Software local-first,
Consultoría de IA, TypeScript, Node.js, React
```

### Los campos de desplegable

- **Sector:** «Desarrollo de software» (*Software Development*).
- **Tipo:** «Empresa individual» / *Self-Employed*, si está disponible; si no,
  «Empresa de capital privado».
- **Año de fundación:** 2026.
- **Ubicación:** Málaga, Andalucía, España. Márcala como remota si el formulario
  lo permite.
- **Tamaño:** ⚠️ **VERIFÍCALO EN EL DESPLEGABLE Y ELIGE LA BANDA MÁS BAJA.** No
  la infles. Es literalmente el campo que ChatGPT leyó y citó de un competidor,
  y dice más a favor que en contra: «una persona» encaja con lo que promete la
  página de servicios —hablas con quien lo construye—, y «2-10» sin nadie detrás
  es una incoherencia que un asistente puede cruzar con la web.

### Tres primeros posts (cortos, sin emojis de relleno)

**1 — el que anuncia la página de servicios**

```
Nueva página: qué se construye en Fervon y cómo se cobra.

Seis cosas: software a medida, SaaS, chatbots que responden con tus datos,
agentes, integración de LLM y herramientas internas. Con una tabla de lo que NO
encaja, que ahorra más tiempo que la de lo que sí.

https://fervon.dev/servicios/
```

**2 — el que da una postura**

```
Facturar por horas premia la lentitud.

Si el trabajo lo ejecutan flotas de agentes y lo que antes eran semanas sale en
días, cobrar por tiempo es cobrar menos por hacerlo mejor. Aquí el precio es
cerrado por proyecto y se acuerda antes de empezar.
```

**3 — el que enseña producto**

```
Un test puede pasar sin probar nada. Los agentes lo hacen constantemente,
porque es el camino más corto al verde.

Veredicto lo caza en el pull request: 11 reglas, sin API key, nada sale de tu
runner.

https://fervon.dev/veredicto/
```

### DECIDE JONATHAN

- **El tamaño de empresa**: mira qué bandas ofrece el desplegable hoy y elige
  la más baja que sea cierta.
- **Portada**: hace falta una imagen de 1128×191. Se puede generar con el mismo
  estilo de las portadas OG que ya están en `assets/`.
- **La página personal no se toca.** La marca Fervon va en la página de empresa;
  el perfil personal se queda como está.

---

## Orden recomendado

1. **Crear `hola@fervon.dev`** (5 minutos, gratis, desbloquea el resto).
2. **Rellenar LinkedIn** (media hora, sin fricción, y ChatGPT ya lo lee).
3. **Darse de alta en agentes.ai** (gratis, hay página de Málaga y sitio libre).
4. **Google Business Profile**, contando con la fricción de la verificación.
5. **Bing Places**, importando la ficha de Google ya hecha.
6. **AIAgencies.eu**, cuando exista un caso de cliente que se pueda enseñar.
   Antes de eso, el alta se declina por evidencia.
