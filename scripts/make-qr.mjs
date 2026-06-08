#!/usr/bin/env node
// Generate a QR code PNG pointing to the live site.
// Usage: node scripts/make-qr.mjs "https://username.github.io/repo/"
// Requires the `qrcode` package (npx installs it on the fly):
//   npx --yes qrcode "<url>" -o assets/qr.png
import { writeFile } from "node:fs/promises";

const url = process.argv[2];
if (!url) {
  console.error('Usage: node scripts/make-qr.mjs "https://your-site-url/"');
  process.exit(1);
}

let QRCode;
try {
  QRCode = (await import("qrcode")).default;
} catch {
  console.error('The "qrcode" package is not installed. Run:\n  npm install qrcode\nor use:\n  npx --yes qrcode "' + url + '" -o assets/qr.png');
  process.exit(1);
}

const out = "assets/qr.png";
const png = await QRCode.toBuffer(url, {
  width: 1000,
  margin: 2,
  color: { dark: "#43352f", light: "#fbf6f1" },
});
await writeFile(out, png);
console.log("Wrote " + out + "  →  " + url);
