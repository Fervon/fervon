# Lanzamiento de Veredicto — material y orden

Estado a 2026-08-12: producto **completo y verificado**, `v0.3.3` publicada como
release, corpus de precisión re-medido (213 PRs, 0 falsos positivos), landing e
informe al día. Lo que queda es **salir**.

El repo lleva 7 semanas público con 0 estrellas. No es que la prueba de humo haya
fallado: nunca empezó. El criterio GO/NO-GO (≥10 instalaciones y/o ≥1 reserva Pro
en 2 semanas) **no puede medirse hasta que alguien lo vea**, así que el reloj de
los 60 días empieza el día del primer post, no antes.

---

## El gancho, y por qué NO es el que parecía

El plan original decía: difundir con "el X% de los PRs de agentes gamean tests".
**Ese titular no existe.** Medido sobre 213 PRs mergeados reales: 0 marcados. Su
propia flota está disciplinada, y un corpus limpio no mide prevalencia.

El gancho real es el experimento, y su fuerza está en que **deja mal a Veredicto**:

> Pedí a agentes de IA que escribieran tests para 20 módulos con un bug real.
> Las 20 suites pasaron en verde. Ninguna cazó el bug. 15 de 20 **fijaron** el bug
> (asertan la salida incorrecta como correcta: arreglar el bug pondría sus tests
> en rojo). Mi propio detector estático marcó 0 de las 20.

Eso último es lo que hace que HN se lo crea. Un post que se vende no pasa de 5
puntos; uno que publica el resultado que le perjudica, sí. La conclusión honesta
—"esto es semántico, no sintáctico, y la capa gratis no lo caza"— es a la vez el
hallazgo y el argumento del tier Pro. No hay que forzarlo: se lee solo.

**Nunca citar** el "2% de 100 PRs" de junio. Eran 2 falsos positivos, los dos ya
arreglados, y está retractado por escrito en `docs/LIMITATIONS.md` y en el informe.

---

## Orden de salida (2 disparos, no 5)

El kill-criteria dice: 0 posts por encima de 20 puntos tras **2 intentos** → NO-GO.
Así que los dos disparos hay que gastarlos bien y separados.

### Disparo 1 — el experimento (enlace normal, NO "Show HN")

El experimento es contenido, no producto. Va como envío normal a
`news.ycombinator.com/submit`, martes a jueves, 15:00–17:00 UTC.

**URL:** `https://fervon.dev/veredicto/report`

**Título** (sin adjetivos, sin nombre de producto — el título ES el resultado):

```
I asked AI agents to write tests for 20 buggy modules. All 20 suites passed.
```

**Primer comentario, publicado por ti inmediatamente después de enviar.** En HN
esto no es opcional: es donde se juega la credibilidad.

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

The part that cost me something to publish: I also maintain a deterministic
CI check for exactly this problem, and it flagged 0 of the 20. That is the
correct result and it is the point. This failure mode is implementation
mirroring — the suite mirrors the code — which is semantic. There is no
deleted test, no .skip, no tautological assert, no mock in the diff for a
static rule to see. Static analysis structurally cannot catch it. Mutation
testing can, at real cost.

Separately, on the precision question, because "my linter finds nothing" is
also what a broken linter says: over 213 real merged PRs from 15 of my repos,
0 flagged and 0 false positives, every finding adjudicated by hand. An earlier
100-PR run of mine reported "2% test-gaming" — both findings turned out to be
prose read as commented-out assertions. Both fixed, figure retracted.

Method, raw numbers and the scoring scripts:
https://github.com/JoniMartin27/veredicto/tree/main/reports
```

**Qué NO hacer:** no pedir estrellas, no enlazar el pricing en el comentario, no
responder a la defensiva. Si alguien dice "esto es obvio", la respuesta es el dato
(15/20 fijaron el bug), no la opinión.

### Disparo 2 — el producto (Show HN), una o dos semanas después

Solo si el disparo 1 dejó algo: comentarios útiles, tráfico, alguna instalación.

```
Show HN: Veredicto – deterministic checks for AI agents gaming your tests
```

**URL:** `https://github.com/JoniMartin27/veredicto`

Cuerpo: qué hace, las 11 reglas, 0 dependencias / sin API key / sin red, el
`warn` por defecto que nunca bloquea, y el enlace a LIMITATIONS **arriba, no
abajo**.

---

## Canales secundarios (uno al día, nunca todos de golpe)

- **r/ExperiencedDevs** — el público correcto para el ángulo mantenedor. Título:
  "AI-written test suites: 20/20 passed on code with a known bug". Reddit castiga
  el enlace propio en el post: cuenta el experimento en texto plano y deja el
  enlace en un comentario.
- **r/ClaudeAI**, **r/ChatGPTCoding** — mismo experimento, tono más directo.
- **awesome-claude-code**, **awesome-actions**, **awesome-ci** — PR a la lista con
  una línea. Aquí el producto sí es lo que se enlaza.
- **Bluesky + Mastodon** — automatizable con Pregón:
  `PROJECT=veredicto npx tsx pregon/scripts/blast-update.ts`
- **GitHub Marketplace** — no es difusión, es catálogo permanente. Ver abajo.

---

## Lo que solo puedes hacer tú (3 clics)

### 1. Publicar la Action en GitHub Marketplace — gratis, y es *el* canal

Es el buscador donde la gente va a por Actions. Sin listar, sólo te encuentra
quien ya sabe tu nombre de usuario. `action.yml` ya cumple los requisitos
(`name`, `description`, `branding.icon` + `branding.color`) y ya hay una release.

1. Abre https://github.com/JoniMartin27/veredicto/releases/tag/v0.3.3
2. **Edit release** → marca **"Publish this Action to the GitHub Marketplace"**
3. Acepta los términos del Marketplace (primera vez, es una casilla)
4. Categoría primaria **Continuous integration**, secundaria **Code quality**
5. **Update release**

### 2. Producto Pro en Polar → pegar el checkout link

Ya tienes Polar funcionando con Trace, así que es el mismo camino:

1. https://polar.sh → tu organización → **Products** → **New product**
2. Nombre `Veredicto Pro`, recurrente **$19/mes**, descripción: juez LLM
   diff-vs-claim + informe firmado exportable, hasta 100 PRs verificados/mes
3. Copia el **checkout link** (`https://buy.polar.sh/...`)
4. Sustituye el marcador en `fervon/veredicto/index.html`:
   `https://buy.polar.sh/REEMPLAZA_VEREDICTO_PRO` — **1 sitio** (el botón del
   plan Pro). La memoria decía 3; hoy hay 1.

Nota: el tier Pro **todavía no está construido** (el juez diff-vs-claim no
existe). Vender antes de construir era el plan acordado — la prueba de
willingness-to-pay. Pero el botón debe llevar a algo que diga con todas las
letras que es una reserva y cuándo llega, o es un cobro por vapor. Si no quieres
eso, cambia el botón por la waitlist hasta que el Pro exista.

### 3. Los dos disparos de HN

Nadie puede postear por ti con tu cuenta, y no debería.

---

## Cómo se mide el GO/NO-GO

- **Instalaciones**: sin Marketplace no hay número. Con Marketplace tampoco da
  contador público — el proxy real es
  `https://github.com/search?q=%22JoniMartin27%2Fveredicto%22+path%3A.github%2Fworkflows&type=code`
  (busca el `uses:` en workflows ajenos). Hoy: solo los tuyos.
- **Estrellas y forks**: `gh api repos/JoniMartin27/veredicto --jq '.stargazers_count'`
- **Reservas Pro**: panel de Polar.
- **Tráfico**: `gh api repos/JoniMartin27/veredicto/traffic/views`

Fecha de inicio del reloj = día del disparo 1. A los 60 días: <75 instalaciones,
0 posts >20 puntos tras los 2 intentos, o anuncio de test-integrity nativo por
parte de GitHub/CodeRabbit → NO-GO y archivar sin drama.
