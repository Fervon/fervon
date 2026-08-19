#!/usr/bin/env node
/* ============================================================================
   scripts/render-og-veredicto.mjs
   ----------------------------------------------------------------------------
   Rasteriza veredicto/og.svg a JPG para las metas Open Graph.

   POR QUÉ. Hasta el 2026-08-19 las tres páginas de Veredicto declaraban
   `og:image` apuntando al SVG. Ningún sitio donde se comparte un enlace
   —Facebook, LinkedIn, X, WhatsApp, Slack, Telegram— renderiza SVG en una
   tarjeta: las tres se compartían SIN imagen. Las otras ocho páginas del sitio
   ya usaban .jpg y funcionaban.

   Se rasteriza el SVG que ya existe en vez de rediseñar nada, así la tarjeta es
   exactamente la pieza aprobada. Del mismo SVG salen dos versiones, ES y EN,
   sustituyendo sólo las tres cadenas de texto.

   El JPEG se hace con System.Drawing de PowerShell porque en esta máquina no
   hay sharp ni ImageMagick; resvg sólo sabe escribir PNG.

   Uso:  npm run og:veredicto
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FUENTE = path.join(ROOT, 'veredicto/og.svg');
const CALIDAD = 86;

/* Las tres cadenas traducibles del SVG. El resto (marca, dominio, arte) es igual
   en los dos idiomas. */
const EN = [
  ['Detecta tests tramposos en PRs de agentes.', 'Catches gamed tests in agent PRs.'],
  ['10 detectores · over-mocking · tests vacíos', '10 detectors · over-mocking · vacuous tests'],
];

const svgEs = fs.readFileSync(FUENTE, 'utf8');
let svgEn = svgEs;
for (const [de, a] of EN) {
  if (!svgEn.includes(de)) throw new Error('no está en el SVG la cadena a traducir: ' + de);
  svgEn = svgEn.replace(de, a);
}

function aPng(svg) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { fontFiles: [path.join(ROOT, 'assets/fonts/inter-var.woff2')], loadSystemFonts: true, defaultFontFamily: 'Inter' },
  });
  return r.render().asPng();
}

/* PNG → JPEG con System.Drawing. Se pasa por fichero temporal porque el binario
   no sobrevive a un round-trip por stdout de PowerShell. */
function aJpg(pngPath, jpgPath, calidad) {
  const ps = [
    'Add-Type -AssemblyName System.Drawing',
    `$img = [System.Drawing.Image]::FromFile('${pngPath}')`,
    '$bmp = New-Object System.Drawing.Bitmap $img.Width, $img.Height',
    '$g = [System.Drawing.Graphics]::FromImage($bmp)',
    // Sin fondo opaco, las zonas transparentes del PNG salen negras o basura.
    '$g.Clear([System.Drawing.Color]::FromArgb(255,7,5,4))',
    '$g.DrawImage($img, 0, 0, $img.Width, $img.Height)',
    "$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }",
    '$params = New-Object System.Drawing.Imaging.EncoderParameters 1',
    `$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, ${calidad})`,
    `$bmp.Save('${jpgPath}', $codec, $params)`,
    '$g.Dispose(); $bmp.Dispose(); $img.Dispose()',
  ].join('; ');
  execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps], { stdio: 'pipe' });
}

for (const [sufijo, svg] of [['', svgEs], ['-en', svgEn]]) {
  const png = path.join(ROOT, `assets/og-veredicto${sufijo}.png`);
  const jpg = path.join(ROOT, `assets/og-veredicto${sufijo}.jpg`);
  fs.writeFileSync(png, aPng(svg));
  aJpg(png.replace(/\\/g, '/'), jpg.replace(/\\/g, '/'), CALIDAD);
  fs.unlinkSync(png);                       // el PNG es sólo el paso intermedio
  const kb = (fs.statSync(jpg).size / 1024).toFixed(0);
  console.log(`assets/og-veredicto${sufijo}.jpg  1200×630  ${kb} KB`);
}
