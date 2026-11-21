/**
 * Procesa "Logo original.jpg" para eliminar el fondo de cuadritos gris/blanco
 * y generar un PNG con transparencia real, recortado al contenido del logo.
 * Uso: node scripts/remove-logo-checkerboard.cjs
 */
const path = require('path');
const sharp = require('sharp');

const input = path.resolve(__dirname, '../public/assets/aistudio/Logo original.jpg');
const output = path.resolve(__dirname, '../public/assets/aistudio/Logo original sin cuadros.png');

(async () => {
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const rgba = Buffer.alloc(width * height * 4);

  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * channels;
      const dst = (y * width + x) * 4;
      const r = data[src];
      const g = data[src + 1];
      const b = data[src + 2];

      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const spread = mx - mn;

      // El cuadriculado es gris claro (≈207 / ≈245) con R≈G≈B.
      // El dorado tiene croma (R > G > B). Los píxeles oscuros se conservan
      // siempre por si forman parte del detalle del logo.
      let alpha = 255;
      if (mn >= 180) {
        alpha = Math.max(0, Math.min(255, Math.round(((spread - 5) / 18) * 255)));
      }

      rgba[dst] = r;
      rgba[dst + 1] = g;
      rgba[dst + 2] = b;
      rgba[dst + 3] = alpha;

      if (alpha > 40) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 12;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const cropWidth = Math.min(width - left, maxX - minX + pad * 2 + 1);
  const cropHeight = Math.min(height - top, maxY - minY + pad * 2 + 1);

  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .png({ compressionLevel: 9, palette: false })
    .toFile(output);

  console.log('Logo procesado:', output);
  console.log('Contenido:', { left, top, cropWidth, cropHeight });
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
