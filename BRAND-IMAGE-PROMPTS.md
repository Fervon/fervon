# Fervon · Prompts de imágenes (forja al rojo vivo)

14 prompts listos para pegar en una IA de imágenes (Midjourney v6 / Flux.1). Misma familia visual y **hex de marca exactos**.

**Sistema visual:** fondo carbón `#0E0B0A`/`#16110E`; el calor SUBE con el degradado `#B5300A` (rojo profundo abajo) → `#E0480F` brasa → `#FF6A00` al-rojo-vivo → `#FFB02E`/`#FFD37A` ámbar/chispa arriba; ceniza `#EFE7DC`; chispas ascendentes + bokeh; glow radial; acero cepillado oscuro; humo/vapor de temple; macro cinemática chiaroscuro. **Nunca** oficina/gente/stock.

**Reglas duras:** CERO texto/letras/números legibles en la imagen (las IAs los deforman) — el wordmark `fervon` y los titulares se sobreponen **después en código**. Heroes: banda izquierda muy oscura para titular+CTA. OG: tercio inferior-izquierdo limpio para el lockup. Exportar cada OG `<300KB`.

**Herramientas:** Midjourney v6 (`--style raw --s 250-300`) para los **hero** atmosféricos; Flux.1 [pro] para los **OG** (composición limpia, respeta mejor la negativa de texto); Flux.1 [dev] para la textura.

---

## 1 · og-marca-home — OG de la home (1200×630)
**Herramienta:** Flux.1 [pro] (o MJ v6 `--ar 1.91:1 --style raw --s 250`)
```
Cinematic ultra-detailed macro photograph of a blacksmith's forge interior shot in near-darkness, the visual identity of an autonomous software studio called Fervon. A single glowing-hot billet of brushed steel rests on a dark anvil, radiating an intense heat gradient that rises vertically: deep ember red #B5300A at the bottom edge where it cools, transitioning up through burning-coal #E0480F, then incandescent orange #FF6A00, into bright amber #FFB02E and pale gold #FFD37A sparks at the very top where the heat escapes. Tiny molten sparks drift upward and to the right with soft bokeh, trailing thin light streaks. The background is pure smoke-black carbon #0E0B0A fading to #16110E, with a warm radial ember glow halo around the metal. A faint plume of grey smoke and a wisp of quench-steam. Surfaces are dark brushed steel and matte forged iron, fine surface grain and orange rim-light. Shallow depth of field, anamorphic feel, dramatic chiaroscuro, artisanal-industrial mood, powerful and premium, not corporate. Negative space of pure dark carbon kept in the lower-left third for an overlaid logo lockup. No text, no letters, no words, no numbers, no logo, no UI. Aspect 1.91:1.
```
**Negative:** `purple gradient, violet, magenta, blue neon, cyberpunk, teal-and-orange cliche, generic AI art, 3d render plastic, stock photo, corporate office, people, person, face, hands, readable text, letters, words, numbers, logo, watermark, signature, UI screenshot, glossy plastic, low contrast, washed out, oversaturated rainbow, busy clutter`
**Notas:** Genera a 1456×768+ y recorta a 1200×630. Deja el tercio inferior-izquierdo casi negro para el lockup `f` + `fervon` + "forjado al rojo vivo".

---

## 2 · textura-forja-base — Textura/fondo reutilizable (1920×1080)
**Herramienta:** Flux.1 [dev]
```
Abstract dark background texture for a software studio brand, evoking a forge at rest. Extreme close-up of cooled black forged iron and brushed dark steel #0E0B0A to #16110E, with subtle horizontal heat shimmer and a few faint embers glowing deep ember red #B5300A and burning orange #FF6A00 scattered sparsely across the surface, fading to almost pure black at the edges. Very low contrast, mostly dark, fine metallic grain, soft warm vignette in one corner only, slow drifting smoke. Moody, minimal, premium, lots of empty dark negative space so text remains legible on top. Macro photography, shallow depth of field, cinematic low-key lighting. No text, no letters, no numbers, no logo, no subject in focus, no clutter. Seamless feel for tiling. Aspect 16:9.
```
**Negative:** `bright, high contrast, busy, purple, violet, blue, neon, rainbow, generic AI art, stock photo, people, faces, readable text, letters, numbers, logo, watermark, UI, glossy plastic, central focal subject, oversaturated`
**Notas:** Úsala al 12-25% de opacidad sobre `#0E0B0A`. Es la capa común que "hermana" todas las páginas.

---

## 3 · hero-trace — Hero de /trace (1600×900) ⭐ producto estrella
**Herramienta:** Midjourney v6 (`--ar 16:9 --style raw --s 300`)
```
Cinematic macro hero image for a personal local-first memory product called Trace, in a red-hot forge visual language. Concept: a single continuous thread of molten incandescent metal being forged and 'stitched' along an invisible timeline — a glowing filament of light that loops and weaves left-to-right across a dark anvil, like a memory being captured permanently. The thread glows with the heat gradient rising upward: deep ember red #B5300A at its base, through brasa #E0480F and incandescent #FF6A00, to amber #FFB02E and pale-gold #FFD37A highlights, with small sparks lifting off where the weave knots. Faint, evenly-spaced ghosted notches of light along the thread suggest moments in time, but stay abstract and never form readable text. Background deep smoke-black carbon #0E0B0A to #16110E with a soft radial ember glow behind the thread and gentle bokeh embers. Brushed dark steel surface, quench-steam wisp, intimate and private mood — warm, calm, premium, not flashy. Shallow depth of field, dramatic low-key chiaroscuro lighting, anamorphic. The left third is kept very dark, near pure carbon, as empty negative space. No text, no letters, no words, no numbers, no clock faces with digits, no logo, no UI. Aspect 16:9.
```
**Negative:** `purple, violet, magenta, blue neon, cyberpunk, teal-orange cliche, generic AI art, stock photo, office, people, face, hands, readable text, letters, words, numbers, clock digits, logo, watermark, UI screenshot, brain illustration cliche, glossy plastic, low contrast overall, washed out, rainbow`
**Notas:** Metáfora = hilo de memoria cosido en el tiempo (NO un cerebro). El producto estrella: invierte más iteraciones aquí.

---

## 4 · og-trace — OG de /trace (1200×630)
**Herramienta:** Flux.1 [pro]
```
Social share card background for a local-first personal-memory product called Trace, forge visual identity. A glowing incandescent thread of molten metal weaves gracefully across a dark anvil from lower-left toward upper-right, symbolizing a memory captured and preserved on a timeline. Heat gradient rises along the thread: ember red #B5300A at the base into brasa #E0480F, incandescent #FF6A00, amber #FFB02E and pale-gold #FFD37A spark highlights lifting off. Pure carbon-black background #0E0B0A blending to #16110E, soft radial ember glow, sparse drifting bokeh embers, faint quench-steam. Brushed dark steel, calm intimate premium mood. Composition keeps the lower-left third as clean dark negative space for an overlaid title and logo lockup; the metaphor sits in the upper-right two-thirds. Macro cinematic, shallow depth of field, low-key chiaroscuro. No text, no letters, no words, no numbers, no logo, no UI, no brain icon. Aspect 1.91:1.
```
**Negative:** `purple, violet, magenta, blue, neon, cyberpunk, generic AI art, stock photo, office, people, face, readable text, letters, words, numbers, logo, watermark, UI screenshot, brain cliche, glossy plastic, low contrast, busy clutter, rainbow`

---

## 5 · hero-lookspan — Hero de /lookspan (1600×900)
**Herramienta:** Midjourney v6 (`--ar 16:9 --style raw --s 250`)
```
Cinematic macro hero image for a local-first observability tool for AI agents called Lookspan, in a red-hot forge visual language. Concept: a 'waterfall' of parallel horizontal veins of incandescent light forged into a dark steel slab — multiple glowing bars of molten heat stacked and offset like trace spans in a timeline, each a different length, staggered diagonally, channels of fire running left to right. The heat gradient rises across the stack: deepest bars glow ember red #B5300A and brasa #E0480F at the bottom, upper bars burn incandescent #FF6A00 into amber #FFB02E with pale-gold #FFD37A sparks lifting where the veins end. Thin bright filaments connect some bars like nested spans. Pure carbon-black background #0E0B0A to #16110E, soft radial ember glow behind the stack, faint smoke, bokeh embers. Brushed dark forged steel, precise and analytical yet warm, premium engineering mood. Left third kept dark as negative space. Macro photography, shallow depth of field, dramatic low-key chiaroscuro, anamorphic. No text, no letters, no numbers, no axis labels, no logo, no literal dashboard UI. Aspect 16:9.
```
**Negative:** `purple, violet, magenta, blue neon, cyberpunk, generic AI art, stock photo, office, people, face, readable text, letters, words, numbers, axis labels, chart legend, logo, watermark, literal UI screenshot, glossy plastic, low contrast, rainbow, busy clutter`
**Notas:** Waterfall de spans como vetas de fuego paralelas, NO un dashboard literal.

---

## 6 · og-lookspan — OG de /lookspan (1200×630)
**Herramienta:** Flux.1 [pro]
```
Social share card background for a local-first AI-agent observability tool called Lookspan, forge visual identity. Several parallel horizontal veins of incandescent molten light are forged into a dark steel slab, staggered diagonally like nested trace spans flowing left to right. Heat gradient rises across the stack: lower veins ember red #B5300A and brasa #E0480F, upper veins incandescent #FF6A00 into amber #FFB02E with pale-gold #FFD37A spark tips. Pure carbon-black background #0E0B0A to #16110E, soft radial ember glow, sparse bokeh embers, faint smoke. Brushed dark forged steel, analytical-but-warm premium mood. Lower-left third reserved as clean dark negative space for an overlaid title and logo lockup; the span-veins occupy the upper-right. Macro cinematic, shallow depth of field, low-key chiaroscuro. No text, no letters, no numbers, no chart labels, no logo, no UI. Aspect 1.91:1.
```
**Negative:** `purple, violet, blue, neon, cyberpunk, generic AI art, stock photo, office, people, face, readable text, letters, numbers, chart labels, logo, watermark, UI screenshot, glossy plastic, low contrast, rainbow, clutter`

---

## 7 · hero-inferbench — Hero de /inferbench (1600×900)
**Herramienta:** Midjourney v6 (`--ar 16:9 --style raw --s 300`)
```
Cinematic macro hero image for a local LLM GPU benchmark app called inferbench, in a red-hot forge visual language. Concept: speed and raw GPU throughput forged in fire. A heavy ingot shaped like a finned processor/GPU die sits glowing on a dark anvil, and a burst of molten sparks streams off its trailing edge to the right at high velocity — long motion-blurred spark trails like a torrent of tokens-per-second erupting. The heat gradient rises: ingot base glows ember red #B5300A and brasa #E0480F, top face incandescent #FF6A00 into amber #FFB02E, spark stream blazing pale-gold #FFD37A. A subtle arc of brighter-vs-dimmer embers suggests a heat gauge / tachometer sweeping up, kept abstract with no numbers. Pure carbon-black background #0E0B0A to #16110E, radial ember glow, hot bokeh particles, faint smoke and forge-blower wind. Brushed dark steel with cooling-fin ridges, powerful kinetic energetic mood. Left third kept dark as negative space. Macro photography, shallow depth of field, dramatic low-key chiaroscuro, motion blur on the spark trails, anamorphic. No text, no letters, no numbers, no gauge digits, no logo, no UI. Aspect 16:9.
```
**Negative:** `purple, violet, magenta, blue neon, cyberpunk, generic AI art, stock photo, office, people, face, readable text, letters, words, numbers, gauge digits, speedometer numbers, logo, watermark, UI screenshot, RGB gamer rainbow, glossy plastic, low contrast, washed out`
**Notas:** GPU/velocidad: lingote-chip con ráfaga de chispas = tokens/s. Evita el cliché RGB de gaming (azul/morado).

---

## 8 · og-inferbench — OG de /inferbench (1200×630)
**Herramienta:** Flux.1 [pro]
```
Social share card background for a local LLM GPU benchmark app called inferbench, forge visual identity. A glowing finned processor/GPU-die-shaped ingot rests on a dark anvil in the upper-right two-thirds, throwing a high-velocity stream of molten sparks off its trailing edge — motion-blurred spark trails reading as a torrent of throughput. Heat gradient rises: ingot ember red #B5300A and brasa #E0480F at the base, incandescent #FF6A00 into amber #FFB02E on the top face, spark stream pale-gold #FFD37A. Pure carbon-black background #0E0B0A to #16110E, radial ember glow, hot bokeh particles, faint smoke. Brushed dark steel with cooling fins, powerful kinetic premium mood. Lower-left third reserved as clean dark negative space for an overlaid title and logo lockup. Macro cinematic, shallow depth of field, motion blur on sparks, low-key chiaroscuro. No text, no letters, no numbers, no logo, no UI, no RGB gamer lighting. Aspect 1.91:1.
```
**Negative:** `purple, violet, blue neon, cyberpunk, RGB gamer rainbow, generic AI art, stock photo, office, people, face, readable text, letters, numbers, logo, watermark, UI screenshot, glossy plastic, low contrast, clutter`

---

## 9 · hero-claudescope — Hero de /claudescope (1600×900)
**Herramienta:** Midjourney v6 (`--ar 16:9 --style raw --s 250`)
```
Cinematic macro hero image for a local-first full-text search tool over Claude Code sessions called ClaudeScope, in a red-hot forge visual language. Concept: inspection and search through your own logs, forged in fire. A blacksmith's heavy round inspection lens / hand magnifier with a dark steel rim hovers over a dark slab etched with many fine parallel incandescent grooves — rows of glowing molten log-lines stacked like a transcript. Through the lens, a small cluster of grooves flares brighter pale-gold #FFD37A, as if a search match just ignited; outside the lens the grooves glow calmer ember red #B5300A and brasa #E0480F. Overall heat gradient rises: lower rows ember red, upper rows incandescent #FF6A00 into amber #FFB02E. The grooves stay abstract and never form readable characters. Pure carbon-black background #0E0B0A to #16110E, soft radial ember glow, sparse bokeh embers, faint smoke. Brushed dark steel and forged iron, focused investigative calm-precise premium mood. Left third kept dark as negative space. Macro photography, shallow depth of field, low-key chiaroscuro, the lens catching a warm specular highlight. No text, no letters, no readable code, no numbers, no logo, no literal UI. Aspect 16:9.
```
**Negative:** `purple, violet, magenta, blue neon, cyberpunk, generic AI art, stock photo, office, people, face, hands, readable text, code, letters, words, numbers, logo, watermark, literal UI screenshot, Sherlock cliche, glossy plastic, low contrast, rainbow`
**Notas:** Lupa de forja sobre log-lines incandescentes, con el "match" ardiendo dentro del cristal. NO mostrar código real.

---

## 10 · og-claudescope — OG de /claudescope (1200×630)
**Herramienta:** Flux.1 [pro]
```
Social share card background for a local-first search tool over Claude Code sessions called ClaudeScope, forge visual identity. A heavy round inspection magnifier with a dark steel rim sits over a dark slab etched with many fine parallel incandescent grooves (glowing log-lines); inside the lens a small cluster flares bright pale-gold #FFD37A like a found match, the rest glow calmer ember red #B5300A and brasa #E0480F, upper rows incandescent #FF6A00 into amber #FFB02E. Grooves stay abstract, no readable characters. Pure carbon-black background #0E0B0A to #16110E, soft radial ember glow, bokeh embers, faint smoke. Brushed dark steel, investigative calm-precise premium mood. The magnifier and grooves occupy the upper-right two-thirds; lower-left third reserved as clean dark negative space for an overlaid title and logo lockup. Macro cinematic, shallow depth of field, warm specular on the glass, low-key chiaroscuro. No text, no letters, no code, no numbers, no logo, no UI. Aspect 1.91:1.
```
**Negative:** `purple, violet, blue, neon, cyberpunk, generic AI art, stock photo, office, people, face, hands, readable text, code, letters, numbers, logo, watermark, UI screenshot, glossy plastic, low contrast, rainbow, clutter`

---

## 11 · hero-launchpad — Hero de /launchpad (1600×900)
**Herramienta:** Midjourney v6 (`--ar 16:9 --style raw --s 250`)
```
Cinematic macro hero image for a local project launcher / orchestrator called launchpad, in a red-hot forge visual language. Concept: many projects launched together, in perfect order, no collisions. A dark forged-steel launch platform / tiered rail holds a neat row of several small upright glowing ingots shaped like minimalist rockets or bars, each lifting off cleanly on its own vertical lane of fire — orderly parallel exhaust plumes rising, none crossing. The heat gradient rises with the lift-off: ingot bases and lower plumes ember red #B5300A and brasa #E0480F, mid incandescent #FF6A00, plume tips amber #FFB02E and pale-gold #FFD37A sparks at the top. Each rocket-ingot glows a slightly different brightness to read as distinct projects, but they ascend in harmony. Pure carbon-black background #0E0B0A to #16110E, radial ember glow, drifting bokeh embers, faint smoke and launch haze. Brushed dark steel rails and forged iron base, organized energetic optimistic premium mood. Left third kept dark as negative space. Macro photography, shallow depth of field, low-key chiaroscuro, gentle upward motion blur on the plumes, anamorphic. No text, no letters, no numbers, no port numbers, no logo, no UI. Aspect 16:9.
```
**Negative:** `purple, violet, magenta, blue neon, cyberpunk, generic AI art, stock photo, NASA realism, office, people, face, readable text, letters, numbers, logo, watermark, UI screenshot, glossy plastic toy, low contrast, rainbow, chaotic crossing trails, clutter`
**Notas:** Varios proyectos despegando ORDENADOS en carriles paralelos sin cruces (= sin colisión de puertos).

---

## 12 · og-launchpad — OG de /launchpad (1200×630)
**Herramienta:** Flux.1 [pro]
```
Social share card background for a local project launcher called launchpad, forge visual identity. A dark forged-steel tiered launch rail holds a neat row of several small upright glowing rocket-shaped ingots lifting off on parallel vertical lanes of fire, orderly exhaust plumes rising without crossing. Heat gradient rises: bases and lower plumes ember red #B5300A and brasa #E0480F, mid incandescent #FF6A00, plume tips amber #FFB02E and pale-gold #FFD37A. Each ingot a slightly different brightness to read as distinct projects, ascending in harmony. Pure carbon-black background #0E0B0A to #16110E, radial ember glow, bokeh embers, faint launch haze. Brushed dark steel rails, organized optimistic premium mood. Rockets occupy the upper-right two-thirds; lower-left third reserved as clean dark negative space for an overlaid title and logo lockup. Macro cinematic, shallow depth of field, gentle upward motion blur, low-key chiaroscuro. No text, no letters, no numbers, no logo, no UI. Aspect 1.91:1.
```
**Negative:** `purple, violet, blue, neon, cyberpunk, generic AI art, stock photo, NASA realism, office, people, face, readable text, letters, numbers, logo, watermark, UI screenshot, glossy plastic toy, low contrast, rainbow, crossing trails, clutter`

---

## 13 · hero-pregon — Hero de /pregon (1600×900)
**Herramienta:** Midjourney v6 (`--ar 16:9 --style raw --s 280`)
```
Cinematic macro hero image for a centralized multi-channel cross-poster and traction tracker called Pregon, in a red-hot forge visual language. Concept: one message announced outward to many channels at once (a town-crier 'pregon'). A single bright incandescent strike point on a dark anvil sends molten sparks radiating outward in roughly eight clean directions — distinct streams of fire fanning out like broadcast channels, each a glowing arc leaving the center. The heat gradient: the central strike blazes pale-gold #FFD37A and incandescent #FF6A00, the radiating streams cool outward through amber #FFB02E, brasa #E0480F, to ember red #B5300A at their tips, with sparks lifting upward. Optionally a faint forged megaphone/horn silhouette in the dark steel suggests the announcement, kept subtle. Pure carbon-black background #0E0B0A to #16110E, strong radial ember glow at the strike, bokeh embers, faint smoke. Brushed dark forged steel, broadcasting energetic confident premium mood. Left third kept darker as negative space. Macro photography, shallow depth of field, dramatic low-key chiaroscuro, slight motion blur on the radiating sparks, anamorphic. No text, no letters, no numbers, no social icons, no logo, no UI. Aspect 16:9.
```
**Negative:** `purple, violet, magenta, blue neon, cyberpunk, generic AI art, stock photo, office, people, face, readable text, letters, numbers, social media logos, brand icons, watermark, UI screenshot, glossy plastic, low contrast, rainbow, chaotic clutter`
**Notas:** Golpe en el yunque que irradia chispas a ~8 direcciones = 8+ canales. NO logos de redes reales.

---

## 14 · og-pregon — OG de /pregon (1200×630)
**Herramienta:** Flux.1 [pro]
```
Social share card background for a centralized multi-channel cross-poster called Pregon, forge visual identity. A single bright incandescent strike point on a dark anvil radiates molten sparks outward in about eight clean fanning directions like broadcast channels. Heat gradient: central strike pale-gold #FFD37A and incandescent #FF6A00, radiating streams cooling outward through amber #FFB02E and brasa #E0480F to ember red #B5300A tips, sparks lifting. Optional faint forged megaphone silhouette, subtle. Pure carbon-black background #0E0B0A to #16110E, strong radial ember glow at the strike, bokeh embers, faint smoke. Brushed dark forged steel, confident broadcasting premium mood. The radiating strike sits in the upper-right two-thirds; lower-left third reserved as clean dark negative space for an overlaid title and logo lockup. Macro cinematic, shallow depth of field, slight motion blur on sparks, low-key chiaroscuro. No text, no letters, no numbers, no social icons, no logo, no UI. Aspect 1.91:1.
```
**Negative:** `purple, violet, blue, neon, cyberpunk, generic AI art, stock photo, office, people, face, readable text, letters, numbers, social logos, brand icons, watermark, UI screenshot, glossy plastic, low contrast, rainbow, clutter`

---

## 15 · hero-regenta — Hero de /regenta (1600×900) · producto comercial
**Herramienta:** Midjourney v6 (`--ar 16:9 --style raw --s 280`)
```
Cinematic macro hero image for a commercial agentic control-plane product called Regenta — "govern your fleet of AI agents" — in a red-hot forge visual language. Concept: command and orderly governance forged in fire. A single large authoritative glowing ingot (the regent / command bar) rests prominently on a dark anvil, and from it thin disciplined filaments of incandescent light reach out and hold a neat formation of several smaller subordinate ingots arranged in a controlled arc, like a fleet held under command — every connection deliberate, nothing chaotic. The heat gradient rises: the command ingot and its base glow ember red #B5300A and brasa #E0480F at the bottom, incandescent #FF6A00 through the core, amber #FFB02E and pale-gold #FFD37A sparks where the command lines terminate. The smaller ingots glow in obedient harmony, slightly dimmer than the central one to read as a hierarchy. Pure carbon-black background #0E0B0A to #16110E, strong radial ember glow behind the command ingot, bokeh embers lifting, faint quench-steam. Brushed dark forged steel and matte iron, authoritative controlled premium engineering mood, powerful but disciplined, not corporate. Left third kept very dark as negative space. Macro photography, shallow depth of field, dramatic low-key chiaroscuro, anamorphic. No text, no letters, no numbers, no org-chart diagram, no logo, no UI. Aspect 16:9.
```
**Negative:** `purple, violet, magenta, blue neon, cyberpunk, generic AI art, stock photo, office, people, face, hands, readable text, letters, words, numbers, org chart, flowchart boxes, logo, watermark, UI screenshot, glossy plastic, low contrast, rainbow, chaotic crossing trails, clutter`
**Notas:** Metáfora = un ingote "regente" que comanda una formación ordenada de ingotes menores por filamentos de luz (= flota de agentes bajo control jerárquico). NO un organigrama literal.

---

## 16 · og-regenta — OG de /regenta (1200×630)
**Herramienta:** Flux.1 [pro]
```
Social share card background for a commercial agentic control-plane product called Regenta ("govern your fleet of AI agents"), forge visual identity. A single large authoritative glowing command ingot rests on a dark anvil in the upper-right two-thirds, holding a neat controlled arc of several smaller subordinate ingots by thin disciplined filaments of incandescent light — a fleet under command, every connection deliberate. Heat gradient rises: command ingot ember red #B5300A and brasa #E0480F at the base, incandescent #FF6A00 through the core, amber #FFB02E and pale-gold #FFD37A spark tips where the command lines end; subordinate ingots glow slightly dimmer to read as hierarchy. Pure carbon-black background #0E0B0A to #16110E, strong radial ember glow behind the command ingot, sparse bokeh embers, faint smoke. Brushed dark forged steel, authoritative controlled premium mood. Lower-left third reserved as clean dark negative space for an overlaid title and logo lockup. Macro cinematic, shallow depth of field, low-key chiaroscuro. No text, no letters, no numbers, no org chart, no logo, no UI. Aspect 1.91:1.
```
**Negative:** `purple, violet, blue, neon, cyberpunk, generic AI art, stock photo, office, people, face, readable text, letters, numbers, org chart, flowchart, logo, watermark, UI screenshot, glossy plastic, low contrast, rainbow, crossing trails, clutter`
**Notas:** Hasta generar el Flux definitivo, hay un `og-regenta.png` interino vectorial (mismo palette/motivo) en `assets/` — sustitúyelo por la imagen fotográfica cuando esté.

---

**Flujo sugerido:** genera cada par hero/OG de un producto en la misma sesión para que compartan grano y composición. Tras generar, sustituye en cada página el mockup CSS por la imagen (en el `.visual`/hero) y actualiza el `og:image` de su `<head>`.
