<p align="center">
  <strong>FERVON</strong><br>
  <em>forjado al rojo vivo</em>
</p>

---

# Fervon

Estudio de software **autónomo** de un solo desarrollador. Una forja donde flotas de agentes de IA escriben, revisan y mergean su propio código — **local-first**, sin pausa, producto tras producto.

> Del latín *fervere*: arder, hervir, bullir con fervor.

## Portfolio

| Proyecto | Qué es |
|---|---|
| **Trace** | Memoria personal local-first: busca todo lo que viste, leíste o hiciste — sin grabar pantalla, sin nube. → [web](https://fervon.dev/trace/) |
| **inferbench** | Benchmark de LLMs locales en tu propia GPU (tokens/s), con modo Serve + servidor MCP. |
| **ClaudeScope** | Dashboard local-first + búsqueda full-text de tus sesiones de Claude Code (0 deps, 0 red). |
| **launchpad** | Launcher local que descubre y levanta todos tus proyectos sin colisión de puertos. |
| **Lookspan** | Librería para desarrolladores publicada en npm + PyPI. |
| **Pregón** | Cross-poster centralizado (8 canales auto) + tracking de tracción de tus lanzamientos. |
| **Veredicto** | Detector de *test-gaming* (trampas en los tests) en PRs hechos por agentes de IA. |
| **Regenta** | Plano de control comercial para gobernar tu flota de agentes de IA. |
| **Trading bot** | Bot de trading autónomo (cripto + acciones) con veto de Claude — la IA solo resta riesgo. |
| **Prompt Tycoon · Pato Patrick** | Juegos casuales del *game factory*. |

## Web

🔥 **https://fervon.dev**

### CSP

La cabecera `Content-Security-Policy` la sirve una Transform Rule de Cloudflare y
es estricta: `default-src 'none'`, `style-src 'self'`, `script-src 'self'` + los
hashes de los bloques JSON-LD. **No hay `'unsafe-inline'`**, así que cualquier
`style=""` o `<script>` suelto que se cuele en el HTML lo bloquea el navegador en
silencio: el estilo no se aplica y solo se ve en la consola del visitante.

```bash
npm run csp:check   # sirve el sitio con la CSP real de producción y recorre todas las páginas con Chrome
```

`npm run csp:build` extrae `<style>`/`<script>` a ficheros externos, recalcula los
hashes JSON-LD e imprime el valor de la CSP para pegar en la Transform Rule.

## Licencia

MIT © Jonathan Martín
