import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function lighten(hex,t){ const n=parseInt(hex.slice(1),16); const r=(n>>16)&255,g=(n>>8)&255,b=n&255; const L=v=>Math.round(v+(255-v)*t); return '#'+[L(r),L(g),L(b)].map(v=>v.toString(16).padStart(2,'0')).join('') }

function ogSvg(p){
  const name = esc(p.name), tagline = esc(p.tagline), sub = esc(p.sub)
  const ac = p.accent
  const a1 = lighten(ac, 0.82), a2 = lighten(ac, 0.18)
  const L = p.name.length
  const fs2 = L>16?58 : L>11?76 : L>8?92 : 108
  let pill = ''
  if(p.pillKind==='cmd'){
    const w = 56 + p.pillText.length*15
    pill = '<rect x="96" y="524" width="'+w+'" height="62" rx="14" fill="#1a1310" stroke="#3a2a1f"/>'
      +'<text x="122" y="563" font-family="JetBrains Mono, monospace" font-size="25" fill="'+ac+'">$</text>'
      +'<text x="150" y="563" font-family="JetBrains Mono, monospace" font-size="25" fill="#efe7dc">'+esc(p.pillText)+'</text>'
  } else if(p.pillKind==='tag'){
    const w = 44 + p.pillText.length*15
    pill = '<rect x="96" y="524" width="'+w+'" height="58" rx="29" fill="none" stroke="'+ac+'" stroke-opacity="0.5"/>'
      +'<text x="'+(96+w/2)+'" y="561" text-anchor="middle" font-family="Inter, sans-serif" font-size="25" font-weight="600" fill="'+ac+'">'+esc(p.pillText)+'</text>'
  }
  return '<svg viewBox="0 0 1200 630" width="1200" height="630" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+name+' — Fervon">\n'
+'  <title>'+name+' — Parte de Fervon</title>\n'
+'  <defs>\n'
+'    <radialGradient id="bgr" cx="0.72" cy="0.62" r="1.0"><stop offset="0" stop-color="#20130a"/><stop offset="0.45" stop-color="#120c08"/><stop offset="1" stop-color="#070504"/></radialGradient>\n'
+'    <radialGradient id="forge" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff8a26" stop-opacity="0.6"/><stop offset="0.45" stop-color="#e0480f" stop-opacity="0.22"/><stop offset="1" stop-color="#e0480f" stop-opacity="0"/></radialGradient>\n'
+'    <radialGradient id="plume" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff7a16" stop-opacity="0.16"/><stop offset="1" stop-color="#ff7a16" stop-opacity="0"/></radialGradient>\n'
+'    <linearGradient id="billetTop" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1408"/><stop offset="0.22" stop-color="#b8400e"/><stop offset="0.46" stop-color="#ff8a1e"/><stop offset="0.68" stop-color="#ffc452"/><stop offset="0.85" stop-color="#fff8ea"/><stop offset="1" stop-color="#ffd06a"/></linearGradient>\n'
+'    <linearGradient id="billetFront" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#150a03"/><stop offset="0.22" stop-color="#8a2c08"/><stop offset="0.46" stop-color="#e85e0c"/><stop offset="0.68" stop-color="#ff9a2a"/><stop offset="0.85" stop-color="#ffe6b0"/><stop offset="1" stop-color="#ffb24e"/></linearGradient>\n'
+'    <linearGradient id="billetEnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8ea"/><stop offset="0.5" stop-color="#ffce5e"/><stop offset="1" stop-color="#d4600e"/></linearGradient>\n'
+'    <linearGradient id="name" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1d8"/><stop offset="1" stop-color="#ffb02e"/></linearGradient>\n'
+'    <linearGradient id="nameA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+a1+'"/><stop offset="1" stop-color="'+a2+'"/></linearGradient>\n'
+'    <linearGradient id="fi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E0480F"/><stop offset="0.5" stop-color="#FF6A00"/><stop offset="1" stop-color="#FFB02E"/></linearGradient>\n'
+'    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#070504" stop-opacity="0.94"/><stop offset="0.4" stop-color="#070504" stop-opacity="0.66"/><stop offset="0.72" stop-color="#070504" stop-opacity="0"/></linearGradient>\n'
+'    <radialGradient id="vig" cx="0.5" cy="0.46" r="0.8"><stop offset="0.48" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></radialGradient>\n'
+'    <radialGradient id="acglow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="'+ac+'" stop-opacity="0.5"/><stop offset="1" stop-color="'+ac+'" stop-opacity="0"/></radialGradient>\n'
+'    <radialGradient id="spark" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff6e2"/><stop offset="0.38" stop-color="#ffb02e"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient>\n'
+'    <radialGradient id="sparkA" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff6e2"/><stop offset="0.38" stop-color="'+ac+'"/><stop offset="1" stop-color="'+ac+'" stop-opacity="0"/></radialGradient>\n'
+'    <linearGradient id="trail" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd37a" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd37a" stop-opacity="0"/></linearGradient>\n'
+'    <linearGradient id="dustmask" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset="0.46" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>\n'
+'    <mask id="dm"><rect width="1200" height="630" fill="url(#dustmask)"/></mask>\n'
+'    <filter id="bloom" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="26"/></filter>\n'
+'    <filter id="bloom2" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="11"/></filter>\n'
+'    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>\n'
+'    <filter id="sparkblur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5"/></filter>\n'
+'    <filter id="embers" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.38" numOctaves="2" seed="11" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 0.5  0 0 0 0 0.12  0 0 0 26 -16" result="c"/><feGaussianBlur in="c" stdDeviation="0.8"/></filter>\n'
+'    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="3" seed="6" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.30  0 0 0 0 0.06  0 0 0 0.5 0"/></filter>\n'
+'    <filter id="haze" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="4" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="22"/></filter>\n'
+'  </defs>\n'
+'  <rect width="1200" height="630" fill="url(#bgr)"/>\n'
+'  <g mask="url(#dm)"><rect width="1200" height="630" filter="url(#grain)" opacity="0.5"/></g>\n'
+'  <g filter="url(#haze)"><ellipse cx="968" cy="430" rx="500" ry="400" fill="url(#forge)"/></g>\n'
+'  <ellipse cx="1032" cy="300" rx="260" ry="220" fill="url(#plume)"/>\n'
+'  <ellipse cx="892" cy="476" rx="210" ry="165" fill="url(#plume)"/>\n'
+'  <g mask="url(#dm)"><rect width="1200" height="630" filter="url(#embers)" opacity="0.1"/></g>\n'
+'  <g>\n'
+'    <ellipse cx="962" cy="584" rx="155" ry="17" fill="#000" opacity="0.5" filter="url(#soft)"/>\n'
+'    <path d="M790 430 L885 412 L1108 412 L1108 448 L1004 452 L996 505 L1062 505 L1070 580 L854 580 L862 505 L928 505 L920 452 L838 446 Z" fill="#0d0908"/>\n'
+'    <path d="M838 446 L920 452 L920 452" stroke="#241710" stroke-width="1.5" fill="none"/>\n'
+'    <rect x="885" y="411" width="223" height="4" rx="2" fill="#ff7a16" opacity="0.4" filter="url(#soft)"/>\n'
+'    <path d="M790 430 L885 412 L1108 412" stroke="#ff8a3a" stroke-width="2.4" fill="none" stroke-opacity="0.5" stroke-linejoin="round" stroke-linecap="round"/>\n'
+'  </g>\n'
+'  <g transform="rotate(-2 930 396)">\n'
+'    <ellipse cx="948" cy="420" rx="172" ry="9" fill="#000" opacity="0.5" filter="url(#soft)"/>\n'
+'    <rect x="906" y="414" width="196" height="30" rx="6" fill="#ff7a16" opacity="0.16" filter="url(#soft)"/>\n'
+'    <ellipse cx="1034" cy="394" rx="118" ry="15" fill="#ff7a16" opacity="0.2" filter="url(#bloom2)"/>\n'
+'    <polygon points="728,386 1130,380 1130,416 728,422" fill="url(#billetFront)"/>\n'
+'    <polygon points="1112,366 1130,380 1130,416 1112,402" fill="url(#billetEnd)"/>\n'
+'    <polygon points="728,386 1130,380 1112,366 746,372" fill="url(#billetTop)"/>\n'
+'    <polyline points="746,372 1112,366" fill="none" stroke="#fff0c4" stroke-width="2" opacity="0.55"/>\n'
+'    <polyline points="728,386 1130,380" fill="none" stroke="#ffb255" stroke-width="1.5" opacity="0.6"/>\n'
+'    <polyline points="728,422 1130,416" fill="none" stroke="#0e0703" stroke-width="2.5" opacity="0.85"/>\n'
+'    <polyline points="1112,366 1112,402" fill="none" stroke="#ffe2a0" stroke-width="1.2" opacity="0.5"/>\n'
+'    <circle cx="1129" cy="396" r="12" fill="#fff4d2" opacity="0.5" filter="url(#soft)"/>\n'
+'    <polygon points="728,386 784,384 786,420 728,422" fill="#1d120a"/>\n'
+'    <polygon points="728,386 784,384 800,370 746,372" fill="#2a1c11"/>\n'
+'    <polyline points="728,386 784,384" fill="none" stroke="#4a3322" stroke-width="1.2" opacity="0.5"/>\n'
+'    <circle cx="772" cy="402" r="3.5" fill="#0e0704" opacity="0.6"/><circle cx="800" cy="408" r="3" fill="#160c06" opacity="0.55"/>\n'
+'  </g>\n'
+'  <g>\n'
+'    <circle cx="1030" cy="300" r="46" fill="url(#spark)" opacity="0.36" filter="url(#sparkblur)"/>\n'
+'    <circle cx="940" cy="230" r="32" fill="url(#sparkA)" opacity="0.3" filter="url(#sparkblur)"/>\n'
+'    <circle cx="1110" cy="220" r="28" fill="url(#spark)" opacity="0.28" filter="url(#sparkblur)"/>\n'
+'    <path d="M1006 372 C1016 320 1024 286 1030 250" stroke="url(#trail)" stroke-width="2.2" fill="none" stroke-linecap="round"/>\n'
+'    <path d="M1030 372 C1052 322 1072 286 1086 244" stroke="url(#trail)" stroke-width="1.7" fill="none" stroke-linecap="round"/>\n'
+'    <path d="M988 374 C982 326 980 292 982 256" stroke="url(#trail)" stroke-width="1.5" fill="none" stroke-linecap="round"/>\n'
+'    <circle cx="1030" cy="248" r="7" fill="#fff6e2"/><circle cx="1030" cy="248" r="15" fill="url(#spark)" opacity="0.7"/>\n'
+'    <circle cx="1086" cy="242" r="4.5" fill="#fff2d2"/><circle cx="1086" cy="242" r="11" fill="url(#sparkA)" opacity="0.7"/>\n'
+'    <circle cx="982" cy="254" r="4" fill="#fff2d2"/><circle cx="982" cy="254" r="10" fill="url(#spark)" opacity="0.6"/>\n'
+'    <circle cx="1138" cy="172" r="3.4" fill="#ffd8a0"/><circle cx="1138" cy="172" r="9" fill="url(#sparkA)" opacity="0.5"/>\n'
+'    <circle cx="966" cy="186" r="3" fill="#ffd8a0"/><circle cx="966" cy="186" r="8" fill="url(#spark)" opacity="0.5"/>\n'
+'    <circle cx="1160" cy="300" r="2.6" fill="#ffcf8a"/><circle cx="1092" cy="140" r="2.4" fill="#ffcf8a"/><circle cx="1010" cy="150" r="2.2" fill="#ffcf8a"/>\n'
+'  </g>\n'
+'  <rect width="1200" height="630" fill="url(#vig)"/>\n'
+'  <rect width="1200" height="630" fill="url(#shade)"/>\n'
+'  <ellipse cx="150" cy="318" rx="320" ry="150" fill="url(#acglow)" opacity="0.10"/>\n'
+'  <g transform="translate(74,50) scale(0.46)"><ellipse cx="56" cy="82" rx="62" ry="62" fill="#FF6A00" opacity="0.16"/><path d="M58 6 C40 6 30 17 30 38 L30 48 L10 48 L10 70 L30 70 L30 116 C30 120 33 123 37 123 L51 123 C55 123 58 120 58 116 L58 70 L82 70 L82 48 L58 48 L58 38 C58 30 62 26 71 26 L86 26 L86 6 Z" fill="url(#fi)"/><circle cx="100" cy="22" r="5" fill="#FFD37A"/><path d="M86 30 L98 20" stroke="#FFB02E" stroke-width="3.2" stroke-linecap="round"/><path d="M94 12 L99 2" stroke="#FF6A00" stroke-width="3.2" stroke-linecap="round"/><circle cx="116" cy="30" r="2.8" fill="#FF6A00"/></g>\n'
+'  <text x="146" y="98" font-family="Inter, sans-serif" font-size="34" font-weight="700" fill="#efe7dc" letter-spacing="0.5">fervon</text>\n'
+'  <text x="1104" y="96" text-anchor="end" font-family="Inter, sans-serif" font-size="26" font-weight="700" fill="url(#name)" letter-spacing="0.3">fervon.dev</text>\n'
+'  <text x="96" y="336" font-family="Inter, sans-serif" font-size="'+fs2+'" font-weight="800" fill="url(#nameA)" letter-spacing="-3">'+name+'</text>\n'
+'  <rect x="100" y="362" width="110" height="6" rx="3" fill="'+ac+'"/>\n'
+'  <text x="98" y="434" font-family="Inter, sans-serif" font-size="36" font-weight="500" fill="#f0e8dd">'+tagline+'</text>\n'
+'  <text x="98" y="484" font-family="Inter, sans-serif" font-size="27" font-weight="400" fill="#d8ccc0">'+sub+'</text>\n'
+'  '+pill+'\n'
+'</svg>\n'
}

const samples = [
  { key:'lookspan', name:'Lookspan', accent:'#FFB02E', tagline:'Mira cada span que emiten tus agentes.', sub:'Observabilidad local-first para agentes · nativo MCP', pillKind:'cmd', pillText:'npx lookspan' },
  { key:'trace', name:'Trace', accent:'#FF6A00', tagline:'Tu memoria personal, en tu máquina.', sub:'Encuentra lo que viste o hiciste · sin grabar pantalla', pillKind:'tag', pillText:'Local-first' },
  { key:'inferbench', name:'InferBench', accent:'#FFB02E', tagline:'Benchmarka LLMs locales de verdad.', sub:'llama.cpp · vLLM · Ollama · medición real', pillKind:'tag', pillText:'tokens/s reales' },
  { key:'claudescope', name:'ClaudeScope', accent:'#5BC8D8', tagline:'Busca y revive tus sesiones de Claude Code.', sub:'Local-first · 0 dependencias · 0 red', pillKind:'cmd', pillText:'npx claudescope-cli' },
  { key:'launchpad', name:'Launchpad', accent:'#8FD06B', tagline:'Lanza todos tus proyectos locales.', sub:'Descubre, arranca y monitoriza · puertos sin colisión', pillKind:'tag', pillText:'mission control' },
  { key:'pregon', name:'Pregón', accent:'#FF8A66', tagline:'Publica en todas partes desde un solo sitio.', sub:'Cross-poster + tracking de tracción · 8 canales auto', pillKind:'tag', pillText:'8 canales auto' },
  { key:'regenta', name:'Regenta', accent:'#FF6A00', tagline:'Tu centro de mando de agentes IA.', sub:'Orquesta una flota de 18 agentes persistentes', pillKind:'tag', pillText:'Regenta' },
  { key:'veredicto', name:'Veredicto', accent:'#E0480F', tagline:'Detecta tests tramposos en PRs de agentes.', sub:'10 detectores · over-mocking · tests vacíos', pillKind:'tag', pillText:'GitHub Action' },
  { key:'trading-bot', name:'trading-bot', accent:'#FFB02E', tagline:'Trading autónomo, paper-first.', sub:'Cripto + acciones · cerebro híbrido + veto de Claude', pillKind:'tag', pillText:'paper-first' },
  { key:'portfolio', name:'Jonathan Martín', accent:'#FF6A00', tagline:'Estudio de software de una persona.', sub:'Forjado al rojo vivo con flotas de agentes IA', pillKind:'tag', pillText:'fervon.dev' },
  { key:'comparador-pisos', name:'Comparador de pisos', accent:'#FFB02E', tagline:'Compara pisos reales de toda España.', sub:'Mapa · filtros · 40.000+ fichas reales', pillKind:'tag', pillText:'España' },
  { key:'cocina-barata', name:'Cocina Barata', accent:'#FFB02E', tagline:'Recetas baratas y dónde comprarlas.', sub:'PWA · precios reales por supermercado', pillKind:'tag', pillText:'PWA' },
  { key:'dynafeet', name:'Dynafeet', accent:'#FF6A00', tagline:'Clínica podológica en Málaga.', sub:'Biomecánica y podología · cita por WhatsApp', pillKind:'tag', pillText:'Málaga' },
  { key:'prompttycoon', name:'Prompt Tycoon', accent:'#FFB02E', tagline:'El imperio de la IA, prompt a prompt.', sub:'Idle tycoon · de los mainframes a la singularidad', pillKind:'tag', pillText:'Juego' },
  { key:'patopatrick', name:'Pato Patrick', accent:'#FFB02E', tagline:'Esquiva, sube, sobrevive.', sub:'Plataformas espacial · Phaser', pillKind:'tag', pillText:'Juego' },
]
for(const s of samples){
  const svg = ogSvg(s)
  fs.writeFileSync(`og-test-${s.key}.svg`, svg)
  const r = new Resvg(svg, { fitTo:{mode:'width', value:1200}, font:{ fontFiles:['assets/fonts/inter-var.woff2'], loadSystemFonts:true, defaultFontFamily:'Inter' } })
  fs.writeFileSync(`og-test-${s.key}.png`, r.render().asPng())
  console.log('rendered', s.key)
}
