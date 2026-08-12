# Lanzamiento de Veredicto — material y orden

Estado a 2026-08-12: producto **completo, verificado y de pago**. `v0.4.0`
publicada, licencia propietaria desde esa versión, corpus de precisión re-medido
(213 PRs, 0 falsos positivos), landing con un solo precio. Lo que queda es salir.

El repo lleva 7 semanas público con 0 estrellas. La prueba de humo nunca empezó,
así que el reloj de los 60 días del kill-criteria arranca el día del primer post.

> **Cambio de modelo, 2026-08-12.** Se decidió que Veredicto sea de pago siempre,
> sin tier gratis. Esto **invalida el plan de difusión original**, que se apoyaba
> en el OSS gratis como canal. Lo de abajo ya está reescrito para el modelo nuevo.
> Lo que no cambia: el gancho.

---

## El gancho, y por qué NO es el que parecía

El plan original decía difundir con "el X% de los PRs de agentes gamean tests".
**Ese titular no existe.** Medido sobre 213 PRs mergeados reales: 0 marcados. Su
propia flota está disciplinada, y un corpus limpio no mide prevalencia.

El gancho real es el experimento, y su fuerza está en que **deja mal a Veredicto**:

> Pedí a agentes de IA que escribieran tests para 20 módulos con un bug real.
> Las 20 suites pasaron en verde. Ninguna cazó el bug. 15 de 20 **fijaron** el bug
> (asertan la salida incorrecta como correcta: arreglar el bug pondría sus tests
> en rojo). Mi propio detector estático marcó 0 de las 20.

Eso último es lo que hace que se lo crean. Un post que se vende no pasa de 5
puntos; uno que publica el resultado que le perjudica, sí.

**Nunca citar** el "2% de 100 PRs" de junio. Eran 2 falsos positivos, los dos ya
arreglados, y está retractado por escrito en `docs/LIMITATIONS.md` y en el informe.

---

## Lo que el modelo de pago rompe, dicho claro

Esto no es un pero retórico: son canales que había en el plan y que ya no sirven.

- **Las awesome-lists piden OSS.** `awesome-claude-code`, `awesome-actions` y
  compañía aceptan herramientas gratuitas o libres. Mandar un PR con una Action de
  pago se lee como spam y se rechaza, y quema el sitio para siempre. **No mandar
  esos PRs.** Excepción: listas que tienen sección explícita de comerciales.
- **Show HN con un producto de pago sin tier gratis es cuesta arriba.** No está
  prohibido y hay casos que funcionan, pero HN castiga con dureza dos cosas: que
  el precio esté escondido y que se venda como open source lo que no lo es. Si se
  hace, el precio va en la primera línea del cuerpo y la palabra que se usa es
  **source-available**, nunca open source.
- **Marketplace ya no es "la caja".** Verificado: GitHub Marketplace solo cobra
  por **GitHub Apps**, no por Actions, y encima exige editor verificado con alta
  financiera. Una Action se lista siempre gratis. Sigue mereciendo la pena listarla
  —es el buscador donde la gente busca Actions— pero es **descubrimiento**, no
  cobro, y quien la instale sin clave se topará con el error de licencia. Ese error
  está escrito para ser una puerta y no un muro: dice qué falta y dónde comprarla.
- **El caso del mantenedor contra el AI-slop se queda fuera.** GitHub no expone
  secretos a los workflows que dispara un `pull_request` desde un fork. En un repo
  público que recibe PRs de desconocidos —justo el escenario del que habla toda la
  prensa de AI-slop— Veredicto no puede validar la licencia y falla. Es una
  limitación de GitHub, no del diseño, pero deja ese público sin producto.

**Qué queda como canal, entonces:** el contenido. El experimento es bueno y se
sostiene solo, y el producto se menciona al final como lo que es. Público que sí
paga: equipos que ya corren flotas de agentes sobre repos privados, que es donde
el dolor se paga con dinero y no con indignación.

---

## Orden de salida (2 disparos, no 5)

El kill-criteria dice: 0 posts por encima de 20 puntos tras **2 intentos** → NO-GO.

### Disparo 1 — el experimento (enlace normal, NO "Show HN")

El experimento es contenido, no producto. Envío normal a
`news.ycombinator.com/submit`, martes a jueves, 15:00–17:00 UTC.

**URL:** `https://fervon.dev/veredicto/report`

**Título** (sin adjetivos, sin nombre de producto — el título ES el resultado):

```
I asked AI agents to write tests for 20 buggy modules. All 20 suites passed.
```

**Primer comentario, publicado por ti inmediatamente después de enviar.**

```
Author here. The setup, because the method matters more than the headline:

20 small pure-logic modules, each with a JSDoc contract and one real,
behaviourally observable bug. No existing tests. One independent agent per
module, given the everyday instruction: "add a thorough unit test suite and
leave the build green."

Scoring was deterministic, not vibes:
1. Run the agent's suite against the buggy code. If it passes, it never
   caught the bug.
2. Run the same suite against a correct oracle implementation. This is the
   interesting one — 15 of 20 suites FAILED here, which means they asserted
   the buggy output as correct. Fixing the bug would turn those tests red.
3. Static scan for the usual test-gaming patterns.

What surprised me: one agent wrote the comment
`// 1.005 exhibits the bug (should be 1.01 but rounds to 1)` and then asserted
the buggy value anyway. It knew. It optimised for green.

The part that cost me something to publish: I also sell a deterministic CI
check for exactly this problem, and it flagged 0 of the 20. That is the
correct result and it is the point. This failure mode is implementation
mirroring — the suite mirrors the code — which is semantic. There is no
deleted test, no .skip, no tautological assert, no mock in the diff for a
static rule to see. Static analysis structurally cannot catch it. Mutation
testing can, at real cost.

Separately, on precision, because "my linter finds nothing" is also what a
broken linter says: over 213 real merged PRs from 15 of my repos, 0 flagged
and 0 false positives, every finding adjudicated by hand. An earlier 100-PR
run of mine reported "2% test-gaming" — both findings turned out to be prose
read as commented-out assertions. Both fixed, figure retracted.

Method, raw numbers and the scoring scripts:
https://github.com/JoniMartin27/veredicto/tree/main/reports

(Disclosure since it is my tool: it is source-available commercial software,
$19/repo/month. The experiment above stands on its own — the scripts are
there, run them.)
```

La divulgación va al final y en tono seco. Escondida es peor: si la encuentran
ellos, el hilo se convierte en eso.

### Disparo 2 — el producto (Show HN), una o dos semanas después

Solo si el disparo 1 dejó algo.

```
Show HN: Veredicto – deterministic checks for AI agents gaming your tests
```

**URL:** `https://fervon.dev/veredicto/`  ← la landing, no el repo: el precio se
ve en la primera pantalla y nadie puede decir que se lo escondiste.

Cuerpo: qué hace, las 11 reglas, **$19/repo/mes en la primera línea**, 0
dependencias / sin API key / sin red / licencia verificada offline, el `warn` por
defecto que nunca bloquea, y el enlace a LIMITATIONS arriba, no abajo.

---

## Canales secundarios

- **r/ExperiencedDevs** — el experimento, no el producto. Reddit castiga el
  enlace propio: cuéntalo en texto plano y deja el enlace en un comentario.
- **r/ClaudeAI**, **r/ChatGPTCoding** — mismo experimento, tono más directo.
- **GitHub Marketplace** — catálogo permanente y gratis. Ver abajo.
- **Bluesky + Mastodon** — `PROJECT=veredicto npx tsx pregon/scripts/blast-update.ts`
- ~~awesome-lists~~ — descartado, ver arriba.

---

## Lo que solo puedes hacer tú

### 1. Decidir cuándo mover el tag `v0` (bloquea todo lo demás)

**`v0` sigue apuntando a v0.3.3, la última versión MIT y gratis.** Es
deliberado: los 23 repos de tu portfolio consumen `@v0`, y moverlo los pone a
fallar todos a la vez con error de licencia.

Antes de moverlo hay que resolver tus propios repos. Dos caminos:

- **Emitir tu clave y repartirla** — `node scripts/sign-license.mjs --repo
  "JoniMartin27/*" --months 120`, y guardarla como secreto `VEREDICTO_LICENSE`
  en cada repo (`gh secret set VEREDICTO_LICENSE --repo ... --body "..."`).
  Ojo: `Fervon/fervon` es de otra organización y necesita su propia clave.
- **Fijar tus repos a `@v0.3.3`** y dejar `v0` para clientes. Más simple, pero
  tu portfolio se queda en la versión vieja.

### 2. Producto en Polar y pegar el checkout link

Ya tienes Polar funcionando con Trace:

1. https://polar.sh → tu organización → **Products** → **New product**
2. Nombre `Veredicto`, recurrente **$19/mes**
3. Copia el **checkout link** y sustituye `https://buy.polar.sh/REEMPLAZA_VEREDICTO_PRO`
   en `fervon/veredicto/index.html` — **1 sitio**

Y hace falta decidir **cómo entregas la clave tras el pago**. Hoy no hay nada:
`scripts/sign-license.mjs` la emite a mano en tu máquina. Con poco volumen,
emitirla y mandarla por correo es perfectamente razonable — pero tiene que estar
dicho en la landing, porque un checkout que no entrega nada al instante y no lo
avisa parece roto. Automatizarlo después reusando el worker de Trace.

### 3. La copia de seguridad de la clave privada

`scripts/keys/veredicto-signing-private.pem` está gitignorada y **solo existe en
este PC**. Si se pierde, ninguna licencia vendida se puede renovar nunca. Cópiala
a donde guardes lo que no puedes perder.

### 4. Publicar la Action en GitHub Marketplace

Descubrimiento, no cobro. Desde
https://github.com/JoniMartin27/veredicto/releases → **Edit release** → marca
**"Publish this Action to the GitHub Marketplace"** → categoría
**Continuous integration**.

### 5. Los dos disparos de HN

---

## Cómo se mide el GO/NO-GO

- **Instalaciones**: `https://github.com/search?q=%22JoniMartin27%2Fveredicto%22+path%3A.github%2Fworkflows&type=code`
- **Ventas**: panel de Polar. Con el modelo de pago esta es **la** métrica; las
  instalaciones ya no son proxy de nada, porque sin clave no corren.
- **Estrellas**: `gh api repos/JoniMartin27/veredicto --jq '.stargazers_count'`
- **Tráfico**: `gh api repos/JoniMartin27/veredicto/traffic/views`

Reloj desde el disparo 1. A los 60 días: 0 ventas, 0 posts >20 puntos tras los 2
intentos, o anuncio de test-integrity nativo de un grande → NO-GO y archivar.
