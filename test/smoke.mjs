// Headless smoke test: loads the real page + scripts via jsdom and walks the
// flow, asserting the render/i18n/navigation logic works. Needs the local
// server running on 127.0.0.1:8000 (jsdom fetches config.js/i18n.js/app.js).
//   npm install jsdom && node test/smoke.mjs
import { JSDOM } from "jsdom";

const BASE = "http://127.0.0.1:8000/";
const html = await (await fetch(BASE)).text();

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable", url: BASE, pretendToBeVisual: true });
const { window } = dom;
const doc = window.document;

await new Promise((res) => {
  if (doc.readyState === "complete") return res();
  window.addEventListener("load", res);
  setTimeout(res, 2500);
});
// give the IIFE a tick
await new Promise((r) => setTimeout(r, 200));

let passed = 0;
function assert(cond, msg) {
  if (!cond) { console.error("✗ " + msg); process.exit(1); }
  console.log("✓ " + msg); passed++;
}
const stage = () => doc.getElementById("stage").innerHTML;
const click = (id) => doc.getElementById(id).click();

// 1. Welcome renders in German
assert(/Wir sammeln Erinnerungen/.test(stage()), "welcome shows German tagline");
assert(!!doc.getElementById("startBtn"), "welcome has start button");
assert(/8\. August 2026/.test(stage()), "welcome shows the wedding date");
assert(/Burg Namedy/.test(stage()), "welcome shows the venue");
assert(!/Pro Frage ein Foto/.test(stage()), "old 'one photo per prompt' chip is gone");

// 2. Language toggle → English, then back
click("langToggle");
assert(/We.{0,3}re collecting memories/.test(stage()), "toggle switches welcome to English");
click("langToggle");
assert(/Wir sammeln Erinnerungen/.test(stage()), "toggle switches back to German");

// 3. Start → name screen
click("startBtn");
assert(!!doc.getElementById("nameInput"), "start opens the name screen");

// 4. Name required guard
click("contBtn");
assert(/Bitte gib deinen Namen ein/.test(stage()), "empty name is blocked with error");

// 5. Fill name → first prompt
const nameInput = doc.getElementById("nameInput");
nameInput.value = "Tom Müller";
nameInput.dispatchEvent(new window.Event("input"));
click("contBtn");
assert(/Dein Lieblingsfoto mit Judith/.test(stage()), "continue reaches prompt 1 (fav with Judith)");
assert(/Foto 1 von 6/.test(stage()), "prompt counter shows 1 of 6");
assert(/erst am Ende/.test(stage()), "prompt step shows the upload hint");

// 6. Skip through to review (no photos) → empty-state guard
for (let i = 0; i < 6; i++) click("nextBtn");
assert(/noch kein Foto ausgewählt/.test(stage()), "review with zero photos shows empty guard");

console.log(`\nALL ${passed} CHECKS PASSED`);
process.exit(0);
