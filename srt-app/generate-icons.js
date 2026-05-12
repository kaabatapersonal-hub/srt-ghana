// Generates minimal valid PNG files for PWA icons
// Run once: node generate-icons.js
// Produces public/icon-192.png and public/icon-512.png (solid #2e7d32 green)

import { createWriteStream } from "fs";
import { deflateSync } from "zlib";

function buildPNG(size) {
  const r = 0x2e, g = 0x7d, b = 0x32; // #2e7d32

  // PNG signature
  const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, "ascii");
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([typeBuf, data]);
    const crc = crc32(body);
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  // CRC-32
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c;
    }
    return t;
  })();
  function crc32(buf) {
    let c = 0xffffffff;
    for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff);
  }

  // IHDR: width, height, bit depth 8, color type 2 (RGB), compress 0, filter 0, interlace 0
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw pixel data: filter byte 0 + RGB per row
  const rowLen = 1 + size * 3;
  const raw = Buffer.alloc(size * rowLen);
  for (let y = 0; y < size; y++) {
    const off = y * rowLen;
    raw[off] = 0; // filter type none
    for (let x = 0; x < size; x++) {
      raw[off + 1 + x * 3 + 0] = r;
      raw[off + 1 + x * 3 + 1] = g;
      raw[off + 1 + x * 3 + 2] = b;
    }
  }

  const compressed = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const png = buildPNG(size);
  const out = createWriteStream(`public/icon-${size}.png`);
  out.write(png);
  out.end();
  console.log(`wrote public/icon-${size}.png (${png.length} bytes)`);
}
