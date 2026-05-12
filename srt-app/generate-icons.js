// Generates professional PWA icons for SRT.
// Run once: node generate-icons.js
// Outputs: public/icon-192.png, public/icon-512.png

import { createCanvas } from "@napi-rs/canvas";
import { writeFileSync } from "fs";

function drawWaterDrop(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.bezierCurveTo(
    cx + size * 0.55, cy - size * 0.3,
    cx + size * 0.88, cy + size * 0.3,
    cx,               cy + size * 0.72
  );
  ctx.bezierCurveTo(
    cx - size * 0.88, cy + size * 0.3,
    cx - size * 0.55, cy - size * 0.3,
    cx,               cy - size
  );
  ctx.closePath();
  ctx.fill();
}

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx    = canvas.getContext("2d");

  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.46;

  // Dark green background circle
  ctx.fillStyle = "#1a6b2e";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle inner ring for depth
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth   = size * 0.018;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.stroke();

  // White water drop above the text
  ctx.fillStyle = "white";
  drawWaterDrop(ctx, cx, cy - size * 0.14, size * 0.115);

  // "SRT" text
  const fontSize = Math.round(size * 0.265);
  ctx.font         = `bold ${fontSize}px Arial`;
  ctx.fillStyle    = "white";
  ctx.textAlign    = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("SRT", cx, cy + size * 0.305);

  return canvas.toBuffer("image/png");
}

for (const size of [192, 512]) {
  const buf = generateIcon(size);
  writeFileSync(`public/icon-${size}.png`, buf);
  console.log(`wrote public/icon-${size}.png  (${buf.length} bytes)`);
}
