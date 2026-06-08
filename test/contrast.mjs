// Deterministic WCAG contrast checker.
// Usage: node test/contrast.mjs '[["#ffffff","#361e55","white on accent"], ...]'
function lum(hex) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const ch = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function ratio(fg, bg) {
  const a = lum(fg), b = lum(bg);
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}
const pairs = JSON.parse(process.argv[2] || "[]");
let fail = 0;
for (const [fg, bg, label] of pairs) {
  const r = ratio(fg, bg);
  const aa = r >= 4.5, aaLarge = r >= 3;
  const tag = aa ? "PASS-AA" : aaLarge ? "pass-large-only" : "FAIL";
  if (!aa) fail++;
  console.log(`${r.toFixed(2)}:1  ${tag.padEnd(16)} ${fg} on ${bg}  — ${label || ""}`);
}
console.log(fail === 0 ? "\nAll pairs meet WCAG AA (>=4.5:1)" : `\n${fail} pair(s) below AA`);
process.exit(fail === 0 ? 0 : 1);
