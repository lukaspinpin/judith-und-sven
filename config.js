// ─────────────────────────────────────────────────────────────────────────
//  CONFIG — edit these values. None of this is secret.
//  The upload endpoint is a public Apps Script URL by design.
// ─────────────────────────────────────────────────────────────────────────
window.CONFIG = {
  // Shown in the header and intro text.
  coupleNames: "Judith & Sven",

  // Submission deadline, shown on the welcome screen (free text per language).
  // ↓↓↓ CHANGE THESE to the real deadline ↓↓↓
  deadline: {
    de: "15. August 2026",
    en: "August 15, 2026",
  },

  // Landing photo of the couple. Drop a file into assets/ and point to it here,
  // e.g. "assets/couple.jpg". A placeholder is used until you do.
  couplePhoto: "assets/couple-placeholder.svg",

  // ↓↓↓ PASTE your Apps Script Web-App URL here after running SETUP.md ↓↓↓
  // It looks like: https://script.google.com/macros/s/AKfyc.../exec
  uploadUrl: "",

  // Shared word that must match TOKEN in apps-script/Code.gs.
  // Just light spam protection — change it to anything you like (both places).
  token: "judith-sven-2026",
};
