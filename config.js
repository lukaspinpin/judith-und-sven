// ─────────────────────────────────────────────────────────────────────────
//  CONFIG — edit these values. None of this is secret.
//  The upload endpoint is a public Apps Script URL by design.
// ─────────────────────────────────────────────────────────────────────────
window.CONFIG = {
  // Shown in the header and intro text.
  coupleNames: "Judith & Sven",

  // The wedding itself — shown on the welcome screen.
  event: {
    date: { de: "8. August 2026", en: "August 8, 2026" },
    venue: "Schloss Namedy",
  },

  // Photo-submission deadline ("please by …"). A week before the wedding gives
  // time to build the slideshow. ↓↓↓ adjust if you like ↓↓↓
  deadline: {
    de: "31. Juli 2026",
    en: "July 31, 2026",
  },

  // Landing photo. Defaults to the Schloss Namedy courtyard (from the wedding
  // site). Swap for a couple portrait anytime: drop a file in assets/ + point here.
  couplePhoto: "assets/venue-namedy.jpg",

  // ↓↓↓ PASTE your Apps Script Web-App URL here after running SETUP.md ↓↓↓
  // It looks like: https://script.google.com/macros/s/AKfyc.../exec
  uploadUrl: "",

  // Shared word that must match TOKEN in apps-script/Code.gs.
  // Just light spam protection — change it to anything you like (both places).
  token: "judith-sven-2026",
};
